"use client";

import React from "react";
import { SpecCodeBlock } from "./SpecCodeBlock";
import { PreviewRenderer } from "./PreviewRenderer";
import type { UISpec, Artifact } from "../types";

type TabId = "preview" | "spec" | "history";

interface ResultTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  spec: UISpec | null;
  errors: string[];
  artifacts: Artifact[];
  onArtifactSelect: (artifact: Artifact) => void;
}

export function ResultTabs({
  activeTab,
  onTabChange,
  spec,
  errors,
  artifacts,
  onArtifactSelect,
}: ResultTabsProps) {
  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "preview", label: "Preview" },
    { id: "spec", label: "UI Spec" },
    { id: "history", label: "History", count: artifacts.length },
  ];

  return (
    <div className="h-full flex flex-col bg-[var(--color-base-surface-primary)] rounded-lg border border-[var(--color-base-stroke)] overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-[var(--color-base-stroke)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-[var(--color-brand-primary)]"
                : "text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)]"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--color-base-surface-secondary)] text-[var(--color-base-secondary)]">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-brand-primary)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "preview" && (
          <PreviewRenderer spec={spec} errors={errors} />
        )}
        {activeTab === "spec" && (
          <SpecCodeBlock spec={spec} errors={errors} />
        )}
        {activeTab === "history" && (
          <HistoryPanel artifacts={artifacts} onSelect={onArtifactSelect} />
        )}
      </div>
    </div>
  );
}

/**
 * Result Tabs Content Only (no tab header)
 * Used when tabs are in the page header
 */
interface ResultTabsContentProps {
  activeTab: TabId;
  spec: UISpec | null;
  errors: string[];
  artifacts: Artifact[];
  onArtifactSelect: (artifact: Artifact) => void;
  onOpenWizard?: () => void;
}

export function ResultTabsContent({
  activeTab,
  spec,
  errors,
  artifacts,
  onArtifactSelect,
  onOpenWizard,
}: ResultTabsContentProps) {
  return (
    <div className="h-full bg-[var(--color-base-surface-primary)] overflow-hidden">
      {activeTab === "preview" && (
        <PreviewRenderer spec={spec} errors={errors} onOpenWizard={onOpenWizard} />
      )}
      {activeTab === "spec" && (
        <SpecCodeBlock spec={spec} errors={errors} />
      )}
      {activeTab === "history" && (
        <HistoryPanel artifacts={artifacts} onSelect={onArtifactSelect} />
      )}
    </div>
  );
}

// History Panel Component
interface HistoryPanelProps {
  artifacts: Artifact[];
  onSelect: (artifact: Artifact) => void;
}

function HistoryPanel({ artifacts, onSelect }: HistoryPanelProps) {
  if (artifacts.length === 0) {
    return <EmptyHistoryState />;
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-2">
        {artifacts.map((artifact) => (
          <button
            key={artifact.artifactId}
            onClick={() => onSelect(artifact)}
            className="w-full text-left p-3 rounded-lg border border-[var(--color-base-stroke)] hover:border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/[0.03] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={artifact.status} />
                  <h4 className="text-sm font-medium text-[var(--color-base-primary)] truncate">
                    {artifact.title}
                  </h4>
                </div>
                <p className="text-xs text-[var(--color-base-tertiary)] mt-1">
                  {formatDate(artifact.createdAt)}
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-[var(--color-base-tertiary)] flex-shrink-0 mt-0.5"
              >
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {artifact.errors.length > 0 && (
              <div className="mt-2 text-xs text-[var(--color-status-error)]">
                {artifact.errors.length} error{artifact.errors.length > 1 ? "s" : ""}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Status Badge
function StatusBadge({ status }: { status: "DONE" | "FAILED" }) {
  const isDone = status === "DONE";

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded ${
        isDone
          ? "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]"
          : "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]"
      }`}
    >
      {isDone ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5L4 7L8 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M3 3L7 7M7 3L3 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      {isDone ? "Done" : "Failed"}
    </span>
  );
}

// Empty History State
function EmptyHistoryState() {
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
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 7V12L15 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-[var(--color-base-primary)] mb-1">
        No history yet
      </h3>
      <p className="text-xs text-[var(--color-base-tertiary)] max-w-[200px]">
        Your generated UI specs will appear here
      </p>
    </div>
  );
}

// Helpers
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
