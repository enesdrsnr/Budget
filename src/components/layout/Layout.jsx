import React from 'react';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  return (
    <div className="animated-bg min-h-screen">
      <main
        className="max-w-lg mx-auto px-4 pt-6 pb-32 scrollable"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
