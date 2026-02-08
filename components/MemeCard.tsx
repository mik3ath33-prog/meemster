'use client';

import { db } from '@/lib/db';
import { useState } from 'react';

interface Meme {
  id: string;
  imageUrl: string;
  userId: string;
  createdAt: number;
  upvoteCount?: number;
}

interface MemeCardProps {
  meme: Meme;
}

export default function MemeCard({ meme }: MemeCardProps) {
  const { user } = db.useAuth();
  const [isUpvoting, setIsUpvoting] = useState(false);

  // Query upvotes for this meme
  const { data: upvotesData } = db.useQuery({
    upvotes: {
      $: {
        where: {
          memeId: meme.id,
        },
      },
    },
  });

  const upvotes = upvotesData?.upvotes || [];
  const userUpvote = user ? upvotes.find((u: any) => u.userId === user.id) : null;
  const hasUpvoted = !!userUpvote;
  const upvoteCount = upvotes.length;

  const handleUpvote = async () => {
    if (!user) {
      alert('Please sign in to upvote memes');
      return;
    }

    if (isUpvoting) return;
    setIsUpvoting(true);

    try {
      if (hasUpvoted && userUpvote) {
        // Remove upvote
        await db.transact(
          db.tx.upvotes[userUpvote.id].delete()
        );
      } else {
        // Add upvote
        await db.transact(
          db.tx.upvotes[db.id()].update({
            memeId: meme.id,
            userId: user.id,
            createdAt: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error('Failed to toggle upvote:', error);
      alert('Failed to upvote. Please try again.');
    } finally {
      setIsUpvoting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="meme-card">
      <div className="meme-image-container">
        <img src={meme.imageUrl} alt="Meme" className="meme-image" />
      </div>
      <div className="meme-footer">
        <button
          className={`upvote-btn ${hasUpvoted ? 'upvoted' : ''}`}
          onClick={handleUpvote}
          disabled={isUpvoting || !user}
          title={user ? (hasUpvoted ? 'Remove upvote' : 'Upvote') : 'Sign in to upvote'}
        >
          <span className="upvote-icon">▲</span>
          <span className="upvote-count">{upvoteCount}</span>
        </button>
        <span className="meme-date">{formatDate(meme.createdAt)}</span>
      </div>
    </div>
  );
}
