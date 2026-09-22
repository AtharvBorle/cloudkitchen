"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "neo-recent-searches";
const MAX_RECENT_ITEMS = 6;

const DEFAULT_TRENDING_SEARCHES = [
  "Pizza",
  "Biryani",
  "Burger",
  "Paneer Tikka",
  "Healthy Bowls",
  "Desserts",
];

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_ITEMS));
          setIsLoaded(true);
          return;
        }
      }
    } catch {
      // fallback to default
    }
    setRecentSearches(DEFAULT_TRENDING_SEARCHES);
    setIsLoaded(true);
  }, []);

  // Add search term to history
  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Remove individual search term
  const removeSearch = useCallback((queryToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== queryToRemove.toLowerCase());
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Clear all recent searches
  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    recentSearches,
    isLoaded,
    addSearch,
    removeSearch,
    clearSearches,
    trendingSearches: DEFAULT_TRENDING_SEARCHES,
  };
}
