import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import type { GifItem } from "../../server/gifs";

interface GifPickerProps {
  onSelectGif: (url: string) => void;
  onClose: () => void;
}

const POPULAR_TAGS = [
  "Trending",
  "Celebrate",
  "Laugh",
  "Agree",
  "Shock",
  "Cat",
  "Dance",
  "Clap",
  "Love",
  "Sad",
];

export const GifPicker: React.FC<GifPickerProps> = ({ onSelectGif, onClose }) => {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("Trending");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  const debounceTimerRef = useRef<number | null>(null);
  const currentRequestIdRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchGifs = useCallback(async (searchTerm: string) => {
    const requestId = ++currentRequestIdRef.current;
    setLoading(true);
    setLastSearchedQuery(searchTerm);

    try {
      const resp = await fetch(`/api/gifs?q=${encodeURIComponent(searchTerm)}`);
      if (resp.ok) {
        const data = (await resp.json()) as GifItem[];
        // Only update state if this is still the most recent request
        if (requestId === currentRequestIdRef.current) {
          setGifs(Array.isArray(data) ? data : []);
        }
      }
    } catch {
      // Ignore network aborts/errors
    } finally {
      if (requestId === currentRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch initial trending GIFs on mount
  useEffect(() => {
    fetchGifs("trending");
  }, [fetchGifs]);

  // Debounced live search when query changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();

    if (trimmed) {
      setActiveTag(""); // Clear active tag when typing custom query
      debounceTimerRef.current = window.setTimeout(() => {
        fetchGifs(trimmed);
      }, 300);
    } else if (activeTag) {
      debounceTimerRef.current = window.setTimeout(() => {
        fetchGifs(activeTag.toLowerCase());
      }, 200);
    } else {
      setActiveTag("Trending");
      debounceTimerRef.current = window.setTimeout(() => {
        fetchGifs("trending");
      }, 200);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, activeTag, fetchGifs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const trimmed = query.trim();
    if (trimmed) {
      fetchGifs(trimmed);
    } else {
      fetchGifs(activeTag ? activeTag.toLowerCase() : "trending");
    }
  };

  const handleClear = () => {
    setQuery("");
    setActiveTag("Trending");
    fetchGifs("trending");
    inputRef.current?.focus();
  };

  const handleTagClick = (tag: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQuery("");
    setActiveTag(tag);
    fetchGifs(tag.toLowerCase());
  };

  return (
    <div className="gif-picker-container" onClick={(e) => e.stopPropagation()}>
      <form onSubmit={handleSearchSubmit} className="gif-picker-header">
        <div className="gif-search-box">
          <Search size={14} className="gif-search-icon" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search GIFs on Loopin..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="gif-search-input"
            enterKeyHint="search"
            autoFocus
          />
          {query && (
            <button
              type="button"
              className="gif-clear-btn"
              onClick={handleClear}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </form>

      <div className="gif-tags-row">
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`gif-tag-btn ${activeTag === tag && !query.trim() ? "active" : ""}`}
            onClick={() => handleTagClick(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="gif-grid-scroll">
        {loading ? (
          <div className="gif-loading-state">
            <Loader2 className="spinner" size={24} />
            <span>Finding GIFs...</span>
          </div>
        ) : gifs.length === 0 ? (
          <div className="gif-empty-state">
            <span>
              {lastSearchedQuery
                ? `No GIFs found for "${lastSearchedQuery}".`
                : "No GIFs found. Try another search."}
            </span>
          </div>
        ) : (
          <div className="gif-grid">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                className="gif-item-btn"
                title={gif.title}
                onClick={() => {
                  onSelectGif(gif.url);
                  onClose();
                }}
              >
                <img
                  src={gif.previewUrl}
                  alt={gif.title}
                  loading="lazy"
                  className="gif-thumbnail"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
