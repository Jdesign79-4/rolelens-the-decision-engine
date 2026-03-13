import React from 'react';
import { Bookmark, Share2 } from 'lucide-react';

export default function ZenJobHeader({ job, onBookmark, onShare, isBookmarked }) {
  if (!job?.meta) return null;

  return (
    <div className="card-raised p-5 mb-5 flex items-start gap-4">
      <div className="card-subtle w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        <img src={job.meta.logo} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-sans-zen text-lg font-bold leading-tight" style={{ color: 'var(--t1)' }}>
          {job.isCompanyOnly ? job.meta.company : job.meta.title}
        </h2>
        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs" style={{ color: 'var(--t2)' }}>
          {!job.isCompanyOnly && (
            <>
              <span className="font-medium" style={{ color: 'var(--t1)' }}>{job.meta.company}</span>
              <span style={{ color: 'var(--t3)' }}>·</span>
            </>
          )}
          <span>{job.meta.location}</span>
          {job.comp?.headline > 0 && (
            <>
              <span style={{ color: 'var(--t3)' }}>·</span>
              <span>${(job.comp.headline / 1000).toFixed(0)}k</span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onBookmark}
          className="card-subtle w-9 h-9 flex items-center justify-center rounded-full zen-transition"
          style={{ color: isBookmarked ? 'var(--sk)' : 'var(--t3)' }}>
          <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
        <button onClick={onShare}
          className="card-subtle w-9 h-9 flex items-center justify-center rounded-full zen-transition"
          style={{ color: 'var(--t3)' }}>
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}