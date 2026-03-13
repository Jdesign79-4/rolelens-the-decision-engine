import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function ZenSearchInput({ searchMode, onSearchModeChange, query, onQueryChange, onSearch, isLoading, showDetails, onToggleDetails, children }) {
  return (
    <div className="mb-5">
      {/* Tab pills */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onSearchModeChange('url')}
          className={`px-4 py-2 rounded-full text-xs font-medium zen-transition ${
            searchMode === 'url' ? 'text-white' : ''
          }`}
          style={{
            background: searchMode === 'url' ? 'var(--sk)' : 'transparent',
            color: searchMode === 'url' ? 'white' : 'var(--t2)',
            boxShadow: searchMode === 'url' ? 'var(--ns)' : 'none'
          }}>
          Job Posting URL
        </button>
        <button
          onClick={() => onSearchModeChange('manual')}
          className={`px-4 py-2 rounded-full text-xs font-medium zen-transition ${
            searchMode === 'manual' ? 'text-white' : ''
          }`}
          style={{
            background: searchMode === 'manual' ? 'var(--sk)' : 'transparent',
            color: searchMode === 'manual' ? 'white' : 'var(--t2)',
            boxShadow: searchMode === 'manual' ? 'var(--ns)' : 'none'
          }}>
          Search Manually
        </button>
      </div>

      {/* Search bar */}
      {searchMode === 'manual' && (
        <div className="flex gap-2">
          <div className="input-pressed flex-1 flex items-center px-4 py-3">
            <Search className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: 'var(--t3)' }} />
            <input
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch()}
              placeholder="Enter company name..."
              className="bg-transparent w-full text-sm outline-none placeholder:opacity-50"
              style={{ color: 'var(--t1)' }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={onSearch}
            disabled={isLoading || !query?.trim()}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white zen-transition disabled:opacity-50"
            style={{ background: 'var(--wa)', boxShadow: 'var(--ns)' }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
          </button>
        </div>
      )}

      {/* Slot for URL analyzer or manual details */}
      {children}
    </div>
  );
}