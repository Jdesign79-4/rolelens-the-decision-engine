import React from 'react';
import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center p-10">
        <div className="card-subtle w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="font-serif-zen text-3xl" style={{ color: 'var(--sk)' }}>?</span>
        </div>
        <h1 className="font-serif-zen text-3xl font-semibold mb-2" style={{ color: 'var(--t1)' }}>Path Not Found</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--t2)' }}>This page has wandered beyond the garden walls.</p>
        <Link to="/" className="card-subtle px-6 py-3 rounded-xl text-sm font-medium zen-transition inline-block"
          style={{ color: 'var(--sk)' }}>
          Return to the Garden
        </Link>
      </div>
    </div>
  );
}