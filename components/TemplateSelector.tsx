'use client';

import React, { useEffect, useState } from 'react';

interface Template {
  name: string;
  data: string;
}

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template, index?: number) => void;
  selectedIndex: number | null;
}

export default function TemplateSelector({ onSelectTemplate, selectedIndex }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Access TEMPLATE_DATA from window (loaded via script tag)
    const loadTemplates = () => {
      if (typeof window !== 'undefined' && (window as any).TEMPLATE_DATA) {
        setTemplates((window as any).TEMPLATE_DATA);
        return true;
      }
      return false;
    };

    // Try immediately
    if (loadTemplates()) return;

    // Retry until script loads (script may load after component mounts)
    const interval = setInterval(() => {
      if (loadTemplates()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleTemplateClick = (template: Template, index: number) => {
    // Clear file input when template is selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onSelectTemplate(template, index);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSelectTemplate({
            name: file.name,
            data: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="sidebar">
      <h2>Templates</h2>
      <div className="template-grid">
        {templates.map((template: Template, index: number) => (
          <div
            key={index}
            className={`template-item ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => handleTemplateClick(template, index)}
          >
            <img src={template.data} alt={template.name} />
          </div>
        ))}
      </div>
      <div className="upload-divider">
        <span>OR</span>
      </div>
      <label htmlFor="imageUpload" className="upload-label">
        <span>Upload Image</span>
        <input
          ref={fileInputRef}
          type="file"
          id="imageUpload"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </label>
    </aside>
  );
}
