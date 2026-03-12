"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ResultTabsContent } from "./components/ResultTabs";
import { agentApi } from "./agentApi";
import { WizardModal, intentToUiSpecWithValidation, type WizardIntent } from "@/ui-generator";
import type { ChatMessage, GenerationStep, UISpec, Artifact, TableColumn } from "./types";

// Theme hook
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check localStorage or system preference
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  }, [theme]);

  return { theme, toggleTheme };
}

// Icons
const AgentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L2 6L10 10L18 6L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 14L10 18L18 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 10L10 14L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ComponentsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.657 4.343L14.243 5.757M5.757 14.243L4.343 15.657M15.657 15.657L14.243 14.243M5.757 5.757L4.343 4.343" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WizardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1V3M8 13V15M1 8H3M13 8H15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M3.05 12.95L4.46 11.54M11.54 4.46L12.95 3.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PhoenixIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2C6 2 3 5 3 9C3 11 4 13 6 14L5 18L10 16L15 18L14 14C16 13 17 11 17 9C17 5 14 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="8" r="1" fill="currentColor"/>
    <circle cx="13" cy="8" r="1" fill="currentColor"/>
    <path d="M8 11C8 11 9 12 10 12C11 12 12 11 12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/**
 * App Switcher Dropdown
 */
function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const apps = [
    { id: "ui-builder", name: "UI Builder", icon: <AgentIcon />, active: true, href: "/" },
    { id: "phoenix", name: "Phoenix", icon: <PhoenixIcon />, active: false, href: "/phoenix" },
    { id: "components", name: "Components", icon: <ComponentsIcon />, active: false, href: "/components" },
  ];

  const currentApp = apps.find(app => app.active) || apps[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-base-surface-secondary)] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)]/10 flex items-center justify-center text-[var(--color-brand-primary)]">
          {currentApp.icon}
        </div>
        <span className="font-semibold text-[var(--color-base-primary)]">{currentApp.name}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--color-base-surface-primary)] border border-[var(--color-base-stroke)] rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-1">
            {apps.map((app) => (
              <a
                key={app.id}
                href={app.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  app.active
                    ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                    : "text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)]"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  app.active
                    ? "bg-[var(--color-brand-primary)] text-white"
                    : "bg-[var(--color-base-surface-secondary)] text-[var(--color-base-secondary)]"
                }`}>
                  {app.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{app.name}</div>
                  {app.active && (
                    <div className="text-xs text-[var(--color-base-secondary)]">Current</div>
                  )}
                </div>
                {app.active && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-brand-primary)]">
                    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </a>
            ))}
          </div>
          <div className="border-t border-[var(--color-base-stroke)] p-2">
            <div className="px-3 py-2 text-xs text-[var(--color-base-tertiary)]">
              Switch between applications
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Sidebar Navigation Item
 */
function NavItem({ 
  icon, 
  label, 
  href, 
  active = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  href: string; 
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
          : "text-[var(--color-base-secondary)] hover:bg-[var(--color-base-surface-secondary)] hover:text-[var(--color-base-primary)]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

/**
 * Header Tab Button
 */
function TabButton({ 
  children, 
  active, 
  onClick,
  count
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
          : "text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)]"
      }`}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--color-base-surface-secondary)] text-[var(--color-base-tertiary)]">
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * UI Builder Page
 */
export function AgentPage() {
  // Theme
  const { theme, toggleTheme } = useTheme();

  // Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Results State
  const [activeTab, setActiveTab] = useState<"preview" | "spec" | "history">("preview");
  const [currentSpec, setCurrentSpec] = useState<UISpec | null>(null);
  const [currentErrors, setCurrentErrors] = useState<string[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const { sessionId } = await agentApi.createSession();
        setSessionId(sessionId);
      } catch (error) {
        console.error("Failed to create session:", error);
      } finally {
        setIsInitializing(false);
      }
    }

    initSession();
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const handleSend = useCallback(async () => {
    if (!sessionId || !inputValue.trim() || generationStep !== "idle") return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setGenerationStep("generating");
    setCurrentErrors([]);

    try {
      setTimeout(() => setGenerationStep("validating"), 800);

      const response = await agentApi.generateSpec({
        sessionId,
        prompt: userMessage.content,
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content:
          response.status === "DONE"
            ? `✓ "${response.spec?.page.title}" generated`
            : `✗ Failed with ${response.errors.length} error(s)`,
        timestamp: new Date().toISOString(),
        status: response.status === "DONE" ? "done" : "failed",
        artifactId: response.artifactId,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.status === "DONE" && response.spec) {
        setCurrentSpec(response.spec);
        setCurrentErrors([]);
        setActiveTab("preview");
      } else {
        setCurrentSpec(response.spec);
        setCurrentErrors(response.errors);
        setActiveTab("preview");
      }

      setArtifacts((prev) => [
        {
          artifactId: response.artifactId,
          title: response.spec?.page.title || "Untitled",
          status: response.status,
          spec: response.spec,
          errors: response.errors,
          createdAt: response.createdAt,
        },
        ...prev,
      ]);

      setGenerationStep(response.status === "DONE" ? "done" : "failed");
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `Error: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
        status: "failed",
      };

      setMessages((prev) => [...prev, errorMessage]);
      setCurrentErrors([(error as Error).message]);
      setGenerationStep("failed");
    }

    setTimeout(() => setGenerationStep("idle"), 1000);
  }, [sessionId, inputValue, generationStep]);

  const handleArtifactSelect = useCallback((artifact: Artifact) => {
    setCurrentSpec(artifact.spec);
    setCurrentErrors(artifact.errors);
    setActiveTab("preview");
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = generationStep === "generating" || generationStep === "validating";

  // Wizard submit handler
  const handleWizardSubmit = useCallback((intent: WizardIntent) => {
    try {
      // Convert intent to UISpec and validate against design system rules
      const { spec: wizardSpec, autoFixes } = intentToUiSpecWithValidation(intent);
      
      const fixedRules = autoFixes.filter(f => f.severity === "fixed");
      if (fixedRules.length > 0) {
        console.info(`[Wizard] Auto-applied ${fixedRules.length} design system rules:`, fixedRules);
      }
      
      // Build columns based on selected fields from wizard
      const dataTypeToColumnType = (dataType: string): TableColumn["type"] => {
        const mapping: Record<string, TableColumn["type"]> = {
          string: "text",
          number: "number",
          date: "date",
          enum: "status",
          boolean: "text",
          user: "text",
          media: "text",
          id: "text",
        };
        return mapping[dataType] || "text";
      };

      const columns: TableColumn[] = intent.selectedFields.tableColumns.map((field) => ({
        id: field.id,
        label: field.label,
        type: dataTypeToColumnType(field.dataType),
        sortable: ["date", "number", "string", "user"].includes(field.dataType),
        ...(field.dataType === "id" ? { width: "80px" } : {}),
        ...(field.copyable ? { copyable: true } : {}),
      }));

      // Add actions column if any row actions are enabled (always rightmost)
      const hasAnyRowAction = intent.rowActions.viewDetails || intent.rowActions.edit || 
        intent.rowActions.duplicate || intent.rowActions.approve || 
        intent.rowActions.reject || intent.rowActions.delete;
      
      if (hasAnyRowAction) {
        columns.push({ 
          id: "actions", 
          label: "Actions", 
          type: "actions", 
          width: "140px",
          actions: {
            view: intent.rowActions.viewDetails,
            edit: intent.rowActions.edit,
            duplicate: intent.rowActions.duplicate,
            delete: intent.rowActions.delete,
          },
        });
      }

      // Create a spec that matches the Agent's expected UISpec format
      const agentSpec: UISpec = {
        version: "1.0",
        page: {
          id: wizardSpec.id,
          title: wizardSpec.title || intent.title,
          description: wizardSpec.description,
        },
        toolbar: {
          search: intent.filters.freeTextSearch,
          filters: Object.entries(intent.filters.fieldFilters || {})
            .filter(([, enabled]) => enabled)
            .map(([fieldId]) => {
              // Find the field label from selected table columns
              const field = intent.selectedFields.tableColumns.find(f => f.id === fieldId);
              return {
                id: fieldId,
                label: field?.label || fieldId.charAt(0).toUpperCase() + fieldId.slice(1).replace(/-/g, " "),
                type: "select" as const,
              };
            }),
          actions: [
            ...(intent.bulkActions.approveSelected
              ? [{ id: "approve-selected", label: "Approve Selected", variant: "secondary" as const }]
              : []),
            ...(intent.bulkActions.rejectSelected
              ? [{ id: "reject-selected", label: "Reject Selected", variant: "secondary" as const }]
              : []),
            { id: "create", label: "Create", variant: "primary" as const, icon: "plus" },
          ],
        },
        table: {
          columns,
          pagination: true,
          selectable: intent.bulkActions.approveSelected || intent.bulkActions.rejectSelected,
        },
        drawer: intent.detailsOpen === "side-panel" ? { enabled: true, title: `${intent.title} Details` } : undefined,
      };

      // Set as current spec
      setCurrentSpec(agentSpec);
      setCurrentErrors([]);
      setActiveTab("preview");

      // Add to artifacts
      const newArtifact: Artifact = {
        artifactId: `wizard-${Date.now()}`,
        title: intent.title,
        status: "DONE",
        spec: agentSpec,
        errors: [],
        createdAt: new Date().toISOString(),
      };
      setArtifacts((prev) => [newArtifact, ...prev]);

      // Build auto-fix summary for chat message
      const fixedCount = autoFixes.filter(f => f.severity === "fixed").length;
      const fixSummary = fixedCount > 0
        ? `\n\n✅ ${fixedCount} design system rule${fixedCount !== 1 ? "s" : ""} auto-applied.`
        : "";

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `Created "${intent.title}" page via Wizard with ${intent.primaryView} view, ${intent.selectedFields.tableColumns.length} table columns, and ${Object.values(intent.rowActions).filter(Boolean).length} row actions.${fixSummary}`,
          timestamp: new Date().toISOString(),
          status: "done",
        },
      ]);
    } catch (error) {
      console.error("Wizard error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `Wizard failed: ${(error as Error).message}`,
          timestamp: new Date().toISOString(),
          status: "failed",
        },
      ]);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-base-surface-secondary)]">
      {/* Unified Header */}
      <header className="h-14 flex-shrink-0 bg-[var(--color-base-surface-primary)] border-b border-[var(--color-base-stroke)] flex items-center justify-between px-4">
        {/* Left: Logo with App Switcher */}
        <div className="flex items-center gap-3">
          <AppSwitcher />
          {currentSpec && (
            <span className="px-2 py-0.5 text-xs bg-[var(--color-status-success)]/10 text-[var(--color-status-success)] rounded">
              {currentSpec.page.title}
            </span>
          )}
        </div>

        {/* Center: Tabs */}
        <div className="flex items-center gap-1">
          <TabButton 
            active={activeTab === "preview"} 
            onClick={() => setActiveTab("preview")}
          >
            Preview
          </TabButton>
          <TabButton 
            active={activeTab === "spec"} 
            onClick={() => setActiveTab("spec")}
          >
            UI Spec
          </TabButton>
          <TabButton 
            active={activeTab === "history"} 
            onClick={() => setActiveTab("history")}
            count={artifacts.length}
          >
            History
          </TabButton>
        </div>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-3">
          <Link href="/wizard">
            <Button>
              <WizardIcon />
              Create with Wizard
            </Button>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with Chat */}
        <aside className="w-[280px] flex flex-col bg-[var(--color-base-surface-primary)] border-r border-[var(--color-base-stroke)]">
          {/* Navigation */}
          <nav className="p-2 border-b border-[var(--color-base-stroke)]">
            <NavItem icon={<AgentIcon />} label="UI Builder" href="/" active />
            <NavItem icon={<ComponentsIcon />} label="Components" href="/components" />
          </nav>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-[var(--color-base-stroke)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider">
                  Chat
                </span>
                {isLoading && (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-brand-primary)]">
                    <span className="w-1.5 h-1.5 bg-[var(--color-brand-primary)] rounded-full animate-pulse" />
                    {generationStep === "generating" ? "Generating..." : "Validating..."}
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isInitializing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 px-2">
                  <p className="text-xs text-[var(--color-base-tertiary)]">
                    Describe the UI you want to create
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${
                      message.role === "user" ? "ml-4" : "mr-4"
                    }`}
                  >
                    <div
                      className={`px-3 py-2 rounded-xl text-xs ${
                        message.role === "user"
                          ? "bg-[var(--color-brand-primary)] text-white rounded-br-sm ml-auto"
                          : message.status === "failed"
                          ? "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)] rounded-bl-sm"
                          : "bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)] rounded-bl-sm"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[var(--color-base-stroke)]">
              <div className="flex gap-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your page..."
                  disabled={!sessionId || isLoading}
                  rows={2}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)] placeholder:text-[var(--color-base-tertiary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-primary)]/30 disabled:opacity-50"
                />
                <Button
                  onClick={handleSend}
                  disabled={!sessionId || isLoading || !inputValue.trim()}
                  className="self-end px-3"
                >
                  <SendIcon />
                </Button>
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--color-base-tertiary)]">
                Enter to send • Shift+Enter for newline
              </p>
            </div>
          </div>

          {/* Session Info */}
          <div className="px-4 py-2 border-t border-[var(--color-base-stroke)] text-[10px] text-[var(--color-base-tertiary)]">
            {sessionId ? `Session: ${sessionId.slice(0, 12)}...` : "Connecting..."}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <ResultTabsContent
            activeTab={activeTab}
            spec={currentSpec}
            errors={currentErrors}
            artifacts={artifacts}
            onArtifactSelect={handleArtifactSelect}
            onOpenWizard={() => setIsWizardOpen(true)}
          />
        </main>
      </div>

      {/* Wizard Modal */}
      <WizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleWizardSubmit}
      />
    </div>
  );
}

export default AgentPage;
