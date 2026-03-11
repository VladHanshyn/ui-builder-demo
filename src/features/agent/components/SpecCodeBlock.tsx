"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface SpecCodeBlockProps {
  spec: object | null;
  errors?: string[];
}

export function SpecCodeBlock({ spec, errors = [] }: SpecCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const specJson = spec ? JSON.stringify(spec, null, 2) : "";

  const handleCopy = useCallback(async () => {
    if (!specJson) return;
    
    try {
      await navigator.clipboard.writeText(specJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [specJson]);

  if (!spec && errors.length === 0) {
    return <EmptySpecState />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)]">
        <span className="text-xs font-medium text-[var(--color-base-secondary)]">
          ui-spec.json
        </span>
        <Button
          variant="secondary"
          onClick={handleCopy}
          disabled={!specJson}
        >
          {copied ? "✓ Copied" : "Copy"}
        </Button>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="px-4 py-3 bg-[var(--color-status-error)]/10 border-b border-[var(--color-status-error)]/20">
          <div className="text-xs font-medium text-[var(--color-status-error)] mb-1">
            Generation Errors ({errors.length})
          </div>
          <ul className="space-y-1">
            {errors.map((error, i) => (
              <li key={i} className="text-xs text-[var(--color-status-error)]">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Code */}
      <div className="flex-1 overflow-auto">
        {specJson ? (
          <pre className="p-4 text-xs font-mono text-[var(--color-base-primary)] whitespace-pre overflow-x-auto">
            <code>{highlightJson(specJson)}</code>
          </pre>
        ) : (
          <div className="p-4 text-sm text-[var(--color-base-tertiary)]">
            No spec generated
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State
function EmptySpecState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded-lg bg-[var(--color-base-surface-secondary)] flex items-center justify-center mb-3">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[var(--color-base-tertiary)]"
        >
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 2V8H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 18V12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 15L12 12L15 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-[var(--color-base-primary)] mb-1">
        No UI Spec yet
      </h3>
      <p className="text-xs text-[var(--color-base-tertiary)] max-w-[200px]">
        Send a message to generate a UI specification
      </p>
    </div>
  );
}

// Simple JSON syntax highlighting
function highlightJson(json: string): React.ReactNode {
  // Split by quotes, brackets, etc and colorize
  const parts = json.split(/(".*?"|{|}|\[|\]|,|:|\d+(?:\.\d+)?|true|false|null)/g);

  return parts.map((part, i) => {
    if (!part) return null;

    // String (property or value)
    if (part.startsWith('"') && part.endsWith('"')) {
      // Check if it's a property name (followed by colon in original)
      const isPropertyName = json.indexOf(part + ":") !== -1 || json.indexOf(part + " :") !== -1;
      return (
        <span
          key={i}
          className={isPropertyName ? "text-[#7C3AED]" : "text-[#059669]"}
        >
          {part}
        </span>
      );
    }

    // Numbers
    if (/^\d+(\.\d+)?$/.test(part)) {
      return (
        <span key={i} className="text-[#D97706]">
          {part}
        </span>
      );
    }

    // Booleans and null
    if (part === "true" || part === "false" || part === "null") {
      return (
        <span key={i} className="text-[#DC2626]">
          {part}
        </span>
      );
    }

    // Brackets and punctuation
    if (/^[{}\[\],:]$/.test(part)) {
      return (
        <span key={i} className="text-[var(--color-base-tertiary)]">
          {part}
        </span>
      );
    }

    return <span key={i}>{part}</span>;
  });
}
