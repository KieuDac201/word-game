"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LIBRARY_CATEGORIES } from "@/lib/data/fallback";

export interface CategoryOption {
  key: string;
  slug: string;
  label: string;
  icon: string;
  description: string;
  sentenceCount?: number;
}

export type DbStatus = "loading" | "connected" | "offline";

const FALLBACK_CATEGORIES: CategoryOption[] = LIBRARY_CATEGORIES.map((c) => ({
  ...c,
  key: String(c.key),
  slug: String(c.key),
}));

/** Loads the category list from /api/categories, falling back to the bundled library. */
export function useCategories(): {
  categories: CategoryOption[];
  status: DbStatus;
} {
  const [categories, setCategories] =
    useState<CategoryOption[]>(FALLBACK_CATEGORIES);
  const [status, setStatus] = useState<DbStatus>("loading");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;

        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(
            data.categories.map((c: Partial<CategoryOption>) => ({
              key: c.slug ?? c.key ?? "",
              slug: c.slug ?? c.key ?? "",
              label: c.label ?? "",
              icon: c.icon || "📁",
              description: c.description ?? "",
              sentenceCount: c.sentenceCount,
            })),
          );
        }
        setStatus(data.source === "database" ? "connected" : "offline");
      } catch (err) {
        console.warn("Category fetch failed, using bundled fallback:", err);
        if (isMounted) setStatus("offline");
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, status };
}

export function findCategory(
  categories: CategoryOption[],
  slug: string,
): CategoryOption {
  return (
    categories.find((c) => (c.slug || c.key) === slug) ??
    categories[0] ??
    FALLBACK_CATEGORIES[0]
  );
}

/**
 * Category list plus a selection that starts on a random category.
 * Re-rolls when the database list replaces the bundled fallback, but never
 * after the player has picked one themselves.
 */
export function useCategorySelection(): {
  categories: CategoryOption[];
  status: DbStatus;
  selected: string;
  setSelected: (slug: string) => void;
} {
  const { categories, status } = useCategories();
  const [selected, setSelected] = useState("");
  const pickedByUser = useRef(false);

  // Randomised in an effect, not in state init, to keep SSR and hydration in sync.
  useEffect(() => {
    if (pickedByUser.current || categories.length === 0) return;
    const random = categories[Math.floor(Math.random() * categories.length)];
    setSelected(random.slug || random.key);
  }, [categories]);

  const choose = useCallback((slug: string) => {
    pickedByUser.current = true;
    setSelected(slug);
  }, []);

  return { categories, status, selected, setSelected: choose };
}
