"use client";

import { forwardRef } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { value, onChange, placeholder, className = "", inputClassName = "" },
    ref,
  ) {
    return (
      <div className={`relative ${className}`.trim()}>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-1.5 pr-8 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--neon-cyan)] font-[family-name:var(--font-mono)] transition-colors ${inputClassName}`.trim()}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
    );
  },
);
