'use client';

import { db } from '@/lib/db';
import MemeCard from '@/components/MemeCard';
import AuthButton from '@/components/AuthButton';
import Link from 'next/link';
import './feed.css';

export default function FeedPage() {
  const { data, isLoading, error } = db.useQuery({
    memes: {
      $: {
        order: { createdAt: 'desc' },
      },
    },
  });

  const memes = data?.memes || [];

  if (isLoading) {
    return (
      <div className="feed-container">
        <div className="feed-header">
          <h1>Meme Feed</h1>
          <AuthButton />
          <Link href="/" className="nav-link">Create Meme</Link>
        </div>
        <div className="loading">Loading memes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-container">
        <div className="feed-header">
          <h1>Meme Feed</h1>
          <AuthButton />
          <Link href="/" className="nav-link">Create Meme</Link>
        </div>
        <div className="error">Error loading memes: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h1>Meme Feed</h1>
        <AuthButton />
        <Link href="/" className="nav-link">Create Meme</Link>
      </div>
      
      {memes.length === 0 ? (
        <div className="empty-state">
          <p>No memes yet. Be the first to create one!</p>
          <Link href="/" className="action-btn">Create Meme</Link>
        </div>
      ) : (
        <div className="meme-grid">
          {memes.map((meme: any) => (
            <MemeCard key={meme.id} meme={meme} />
          ))}
        </div>
      )}
    </div>
  );
}
