'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, User, Home, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SearchResult {
  type: 'user' | 'unit';
  id: string;
  label: string;
  subtitle?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    
    if (result.type === 'user') {
      router.push(`/dashboard/users/${result.id}`);
    } else if (result.type === 'unit') {
      router.push(`/dashboard/units/${result.id}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari unit, nama, atau no. telefon..."
          className="w-full bg-slate-100/50 border-none rounded-xl py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all outline-none"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg",
                result.type === 'user' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {result.type === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Home className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{result.label}</div>
                {result.subtitle && (
                  <div className="text-xs text-slate-500 truncate">{result.subtitle}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !isLoading && results.length === 0 && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
          <p className="text-sm text-slate-500 text-center">Tiada hasil dijumpai</p>
        </div>
      )}

      {isLoading && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
          <p className="text-sm text-slate-500 text-center">Mencari...</p>
        </div>
      )}
    </div>
  );
}

