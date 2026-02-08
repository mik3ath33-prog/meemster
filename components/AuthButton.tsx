'use client';

import { useState } from 'react';
import { db } from '@/lib/db';

export default function AuthButton() {
  const { user } = db.useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      setShowCodeInput(true);
    } catch (error) {
      console.error('Failed to send code:', error);
      alert('Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !code) return;
    setIsLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email, code });
      setShowCodeInput(false);
      setCode('');
    } catch (error) {
      console.error('Failed to sign in:', error);
      alert('Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await db.auth.signOut();
    setEmail('');
    setCode('');
    setShowCodeInput(false);
  };

  const handleGuestSignIn = () => {
    setIsLoading(true);
    db.auth
      .signInAsGuest()
      .catch((err: any) => {
        console.error('Failed to sign in as guest:', err);
        alert('Failed to sign in as guest: ' + (err?.body?.message || err?.message || 'Unknown error'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (user) {
    return (
      <div className="auth-button">
        <span className="user-info">Signed in as {user.email || 'Guest'}</span>
        <button onClick={handleSignOut} className="auth-btn auth-btn-secondary" disabled={isLoading}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-button">
      {!showCodeInput ? (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
          <button
            onClick={handleSendCode}
            className="auth-btn"
            disabled={isLoading || !email}
          >
            {isLoading ? 'Sending...' : 'Send Code'}
          </button>
          <button
            onClick={handleGuestSignIn}
            className="auth-btn auth-btn-secondary"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Guest'}
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="auth-input"
            maxLength={6}
          />
          <button
            onClick={handleSignIn}
            className="auth-btn"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          <button
            onClick={() => {
              setShowCodeInput(false);
              setCode('');
            }}
            className="auth-btn auth-btn-secondary"
            disabled={isLoading}
          >
            Back
          </button>
        </>
      )}
    </div>
  );
}
