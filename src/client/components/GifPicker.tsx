import React, { useState, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import type { GifItem } from "../../server/gifs";

interface GifPickerProps {
  onSelectGif: (url: string) => void;
  onClose: () => void;
}

const POPULAR_TAGS = ["Trending", "Celebrate", "Laugh", "Agree", "Shock", "Cat", "Dance", "Clap"];

export const GifPicker: React.FC<GifPickerProps> = ({ onSelectGif, onClose }) => {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("Trending");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGifs = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/gifs?q=${encodeURIComponent(q)}`);
      if (resp.ok) {
        const data = (await resp.json()) as GifItem[];
        setGifs(data);
      }
    } catch {
      // Ignore network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifs(activeTag.toLowerCase());
  }, [activeTag, fetchGifs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      fetchGifs(query.trim());
    }
  };

  return (
    <div className="gif-picker-container" onClick={(e) => e.stopPropagation()}>
      <form onSubmit={handleSearchSubmit} className="gif-picker-header">
        <div className="gif-search-box">
          <Search size={14} className="gif-search-icon" />
          <input
            type="text"
            placeholder="Search GIFs on Loopin..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="gif-search-input"
            autoFocus
          />
        </div>
      </form>

      <div className="gif-tags-row">
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`gif-tag-btn ${activeTag === tag && !query ? "active" : ""}`}
            onClick={() => {
              setQuery("");
              setActiveTag(tag);
            }}
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
            <span>No GIFs found. Try another search.</span>
          </div>
        ) : (
          <div className="gif-grid">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                className="gif-item-btn"
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
