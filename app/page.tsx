'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import MemeCanvas, { MemeCanvasRef } from '@/components/MemeCanvas';
import TemplateSelector from '@/components/TemplateSelector';
import ControlPanel from '@/components/ControlPanel';
import AuthButton from '@/components/AuthButton';
import './meme-generator.css';

interface Template {
  name: string;
  data: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user } = db.useAuth();
  const canvasRef = useRef<MemeCanvasRef>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);

  const handleSelectionChange = useCallback((layerId: number | null) => {
    setSelectedLayerId(layerId);
  }, []);

  const handleSelectTemplate = (template: Template, index?: number) => {
    setSelectedTemplate(template);
    if (index !== undefined) {
      setSelectedTemplateIndex(index);
    } else {
      setSelectedTemplateIndex(null);
    }
    setImageDataUrl(template.data);
  };

  const handleDownload = async () => {
    const dataUrl = await canvasRef.current?.exportCanvas();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `meme-${Date.now()}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePost = async () => {
    if (!user || !imageDataUrl) {
      alert('Please sign in to post memes');
      return;
    }

    setIsPosting(true);
    try {
      const dataUrl = await canvasRef.current?.exportCanvas();
      if (!dataUrl) {
        throw new Error('Failed to export canvas');
      }

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Upload to InstantDB Storage
      const filename = `memes/${user.id}/${Date.now()}.jpg`;
      const storageUrl = await db.storage.uploadFile(filename, blob, {
        contentType: 'image/jpeg',
      });

      // Create meme record
      const memeId = db.id();
      await db.transact(
        db.tx.memes[memeId].update({
          imageUrl: storageUrl,
          userId: user.id,
          createdAt: Date.now(),
        })
      );

      // Redirect to feed
      router.push('/feed');
    } catch (error) {
      console.error('Failed to post meme:', error);
      alert('Failed to post meme. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="app-container">
      <TemplateSelector
        onSelectTemplate={handleSelectTemplate}
        selectedIndex={selectedTemplateIndex}
      />
      
      <main className="main-content">
        <div className="main-header">
          <h1>Meme Generator</h1>
          <div className="header-actions">
            <AuthButton />
            <a href="/feed" className="nav-link">View Feed</a>
          </div>
        </div>
        <MemeCanvas
          ref={canvasRef}
          imageDataUrl={imageDataUrl}
          onImageReady={setImageReady}
          onSelectionChange={handleSelectionChange}
        />
      </main>

      <ControlPanel
        canvasRef={canvasRef}
        onDownload={handleDownload}
        onPost={handlePost}
        canPost={!!user}
        isPosting={isPosting}
        selectedLayerId={selectedLayerId}
      />
    </div>
  );
}
