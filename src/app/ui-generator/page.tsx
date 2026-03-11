"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, RBACGate, useAuth } from "./auth";
import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
} from "@/components/ui/Sidebar";
import { Button } from "@/components/ui/Button";
import { Notification } from "@/components/ui/Notification";

// UI Generator modules
import {
  generateUISpec,
  parseRequest,
  validateUISpec,
  repairUISpec,
  getDrafts,
  saveDraft,
  deleteDraft,
  renameDraft,
  downloadYaml,
  WizardModal,
  intentToUiSpec,
  intentToYaml,
  type TemplateType,
  type UISpec,
  type ValidationResult,
  type ValidationSummary,
  type Draft,
  type WizardIntent,
} from "@/ui-generator";
import { UISpecRenderer } from "@/ui-generator/renderer";

// Icons
const AgentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L2 6L10 10L18 6L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 14L10 18L18 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 10L10 14L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6L2 10L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 6L18 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 4L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

const WizardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1V3M8 13V15M1 8H3M13 8H15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M3.05 12.95L4.46 11.54M11.54 4.46L12.95 3.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
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

// Theme hook
function useTheme() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  }, [theme]);

  return { theme, toggleTheme };
}

// Default request template
const DEFAULT_REQUEST = `template: table
title: Users
entity: User
entityNamePlural: Users`;

/**
 * Main UI Generator Page Content
 */
function UIGeneratorContent() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // State
  const [template, setTemplate] = useState<TemplateType>("table");
  const [requestText, setRequestText] = useState(DEFAULT_REQUEST);
  const [uiSpecText, setUiSpecText] = useState("");
  const [parsedSpec, setParsedSpec] = useState<UISpec | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"spec" | "validation" | "preview">("spec");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [notification, setNotification] = useState<{ message: string; variant: "success" | "warning" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Load drafts on mount
  useEffect(() => {
    setDrafts(getDrafts());
  }, []);

  // Generate UI Spec
  const handleGenerate = useCallback(() => {
    setIsLoading(true);
    try {
      const options = parseRequest(requestText);
      options.template = template;
      
      const spec = generateUISpec(options);
      const specYaml = formatSpecAsYaml(spec);
      
      setUiSpecText(specYaml);
      setParsedSpec(spec);
      setValidation(null);
      setActiveTab("spec");
      setNotification({ message: "UI Spec generated successfully!", variant: "success" });
    } catch (error) {
      setNotification({ message: `Generation failed: ${(error as Error).message}`, variant: "warning" });
    } finally {
      setIsLoading(false);
    }
  }, [requestText, template]);

  // Preview UI Spec
  const handlePreview = useCallback(() => {
    try {
      const spec = parseYamlSpec(uiSpecText);
      setParsedSpec(spec);
      setActiveTab("preview");
      setNotification({ message: "Preview ready!", variant: "success" });
    } catch (error) {
      setNotification({ message: `Preview failed: ${(error as Error).message}`, variant: "warning" });
    }
  }, [uiSpecText]);

  // Validate UI Spec
  const handleValidate = useCallback(() => {
    setIsLoading(true);
    try {
      const spec = parseYamlSpec(uiSpecText);
      const result = validateUISpec(spec);
      setValidation(result);
      setActiveTab("validation");
      
      if (result.passed) {
        setNotification({ message: "Validation passed!", variant: "success" });
      } else {
        setNotification({ message: `Validation failed with ${result.errors.length} error(s)`, variant: "warning" });
      }
    } catch (error) {
      setNotification({ message: `Validation failed: ${(error as Error).message}`, variant: "warning" });
    } finally {
      setIsLoading(false);
    }
  }, [uiSpecText]);

  // Repair UI Spec
  const handleRepair = useCallback(() => {
    if (!validation || validation.passed) return;
    
    setIsLoading(true);
    try {
      const spec = parseYamlSpec(uiSpecText);
      const { spec: repairedSpec, fixes } = repairUISpec(spec, validation);
      
      setUiSpecText(formatSpecAsYaml(repairedSpec));
      setValidation(null);
      setNotification({ message: `Applied ${fixes.length} fix(es): ${fixes.join(", ")}`, variant: "success" });
    } catch (error) {
      setNotification({ message: `Repair failed: ${(error as Error).message}`, variant: "warning" });
    } finally {
      setIsLoading(false);
    }
  }, [uiSpecText, validation]);

  // Save Draft
  const handleSaveDraft = useCallback(() => {
    try {
      const title = currentDraftId 
        ? drafts.find(d => d.id === currentDraftId)?.title || `Draft - ${template}`
        : `Draft - ${template} - ${new Date().toLocaleString()}`;
      
      const validationSummary: ValidationSummary = validation ? {
        errorsCount: validation.errors.length,
        warningsCount: validation.warnings.length,
        infoCount: validation.info.length,
        passed: validation.passed,
        lastRunAt: new Date().toISOString(),
      } : {
        errorsCount: 0,
        warningsCount: 0,
        infoCount: 0,
        passed: true,
        lastRunAt: null,
      };

      const savedDraft = saveDraft({
        id: currentDraftId || undefined,
        title,
        templateType: template,
        requestText,
        uiSpecText,
        validationSummary,
      });
      
      setCurrentDraftId(savedDraft.id);
      setDrafts(getDrafts());
      setNotification({ message: "Draft saved!", variant: "success" });
    } catch (error) {
      setNotification({ message: `Save failed: ${(error as Error).message}`, variant: "warning" });
    }
  }, [requestText, uiSpecText, template, validation, currentDraftId, drafts]);

  // Load Draft
  const handleLoadDraft = useCallback((draft: Draft) => {
    setRequestText(draft.requestText);
    setUiSpecText(draft.uiSpecText);
    setTemplate(draft.templateType);
    setCurrentDraftId(draft.id);
    setValidation(null);
    setNotification({ message: `Loaded: ${draft.title}`, variant: "success" });
  }, []);

  // Delete Draft
  const handleDeleteDraft = useCallback((id: string) => {
    deleteDraft(id);
    if (currentDraftId === id) {
      setCurrentDraftId(null);
    }
    setDrafts(getDrafts());
    setNotification({ message: "Draft deleted", variant: "success" });
  }, [currentDraftId]);

  // Rename Draft
  const handleStartRename = useCallback((draft: Draft) => {
    setEditingDraftId(draft.id);
    setEditingTitle(draft.title);
  }, []);

  const handleSaveRename = useCallback(() => {
    if (editingDraftId && editingTitle.trim()) {
      renameDraft(editingDraftId, editingTitle.trim());
      setDrafts(getDrafts());
      setNotification({ message: "Draft renamed!", variant: "success" });
    }
    setEditingDraftId(null);
    setEditingTitle("");
  }, [editingDraftId, editingTitle]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(uiSpecText);
    setNotification({ message: "Copied to clipboard!", variant: "success" });
  }, [uiSpecText]);

  // Download YAML
  const handleDownload = useCallback(() => {
    const filename = currentDraftId 
      ? `${drafts.find(d => d.id === currentDraftId)?.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'ui-spec'}.yaml`
      : 'ui-spec.yaml';
    downloadYaml(uiSpecText, filename);
    setNotification({ message: "Downloaded!", variant: "success" });
  }, [uiSpecText, currentDraftId, drafts]);

  // Handle wizard submit
  const handleWizardSubmit = useCallback((intent: WizardIntent) => {
    try {
      // Generate YAML representation for request textarea
      const yamlRequest = intentToYaml(intent);
      setRequestText(yamlRequest);
      
      // Generate UI Spec from intent
      const spec = intentToUiSpec(intent);
      const specJson = JSON.stringify(spec, null, 2);
      
      setUiSpecText(specJson);
      setParsedSpec(spec);
      setTemplate("table"); // Wizard generates table-based specs
      setCurrentDraftId(null);
      
      // Run validation
      try {
        const result = validateUISpec(spec);
        setValidation(result);
        
        // Save as draft
        const validationSummary: ValidationSummary = {
          errorsCount: result.errors.length,
          warningsCount: result.warnings.length,
          infoCount: result.info.length,
          passed: result.passed,
          lastRunAt: new Date().toISOString(),
        };

        const savedDraft = saveDraft({
          title: intent.title || "Wizard Draft",
          templateType: "table",
          requestText: yamlRequest,
          uiSpecText: specJson,
          validationSummary,
        });
        
        setCurrentDraftId(savedDraft.id);
        setDrafts(getDrafts());
        
        if (result.passed) {
          setActiveTab("preview");
          setNotification({ message: "UI Spec generated and saved as draft!", variant: "success" });
        } else {
          setActiveTab("validation");
          setNotification({ message: `Generated with ${result.errors.length} validation error(s)`, variant: "warning" });
        }
      } catch (validationError) {
        setActiveTab("spec");
        setNotification({ message: "Generated! Validation skipped due to error.", variant: "warning" });
      }
    } catch (error) {
      setNotification({ message: `Wizard failed: ${(error as Error).message}`, variant: "warning" });
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-base-surface-secondary)]">
      {/* Header - Top Priority */}
      <header className="h-14 flex-shrink-0 border-b border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] flex items-center justify-between px-6">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center text-white">
            <CodeIcon />
          </div>
          <span className="font-semibold text-[var(--color-base-primary)]">UI Generator</span>
          <span className="px-2 py-0.5 text-xs bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] rounded">
            MVP
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsWizardOpen(true)}>
            <WizardIcon />
            New via Wizard
          </Button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      {/* Main Layout - Below Header */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar defaultActiveItem="ui-generator">
          <SidebarGroup>
            <SidebarItem id="agent" icon={<AgentIcon />} label="UI Builder" href="/" />
            <SidebarItem id="ui-generator" icon={<CodeIcon />} label="UI Generator" href="/ui-generator" />
            <SidebarItem id="components" icon={<ComponentsIcon />} label="Components" href="/components" />
          </SidebarGroup>
          <SidebarFooter>
            <div className="px-3 py-2 text-xs text-[var(--color-base-tertiary)]">
              {user?.name}
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content Grid */}
          <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left Column - Request */}
            <div className="flex flex-col gap-4">
              {/* Template Selector */}
              <div className="bg-[var(--color-base-surface-primary)] rounded-lg border border-[var(--color-base-stroke)] p-4">
                <label className="block text-sm font-medium text-[var(--color-base-primary)] mb-2">
                  Template
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as TemplateType)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] text-[var(--color-base-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                >
                  <option value="table">Table Page (P-02)</option>
                  <option value="editor">Editor Page (P-03)</option>
                  <option value="overlay">Overlay (P-05)</option>
                </select>
              </div>

              {/* Request Textarea */}
              <div className="flex-1 bg-[var(--color-base-surface-primary)] rounded-lg border border-[var(--color-base-stroke)] p-4 flex flex-col">
                <label className="block text-sm font-medium text-[var(--color-base-primary)] mb-2">
                  Request / Prompt
                </label>
                <textarea
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  className="flex-1 w-full px-3 py-2 rounded-md border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)] font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                  placeholder="Enter your request..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleGenerate} isLoading={isLoading}>
                  Generate
                </Button>
                <Button variant="secondary" onClick={handleValidate} disabled={!uiSpecText}>
                  Validate
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleRepair}
                  disabled={!validation || validation.passed}
                >
                  Repair
                </Button>
                <Button variant="secondary" onClick={handleSaveDraft} disabled={!uiSpecText}>
                  Save
                </Button>
                <Button variant="secondary" onClick={handleCopy} disabled={!uiSpecText}>
                  Copy
                </Button>
                <Button variant="secondary" onClick={handleDownload} disabled={!uiSpecText}>
                  ⬇ Download
                </Button>
              </div>

              {/* Drafts List */}
              {drafts.length > 0 && (
                <div className="bg-[var(--color-base-surface-primary)] rounded-lg border border-[var(--color-base-stroke)] p-4">
                  <h3 className="text-sm font-medium text-[var(--color-base-primary)] mb-2">
                    Saved Drafts ({drafts.length})
                  </h3>
                  <div className="space-y-1 max-h-[200px] overflow-auto">
                    {drafts.map((draft) => (
                      <div
                        key={draft.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          currentDraftId === draft.id 
                            ? "bg-[var(--color-brand-primary)]/[0.12]" 
                            : "hover:bg-[var(--color-brand-primary)]/[0.08]"
                        }`}
                        onClick={() => handleLoadDraft(draft)}
                      >
                        <div className="flex-1 min-w-0">
                          {editingDraftId === draft.id ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={handleSaveRename}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename();
                                if (e.key === "Escape") {
                                  setEditingDraftId(null);
                                  setEditingTitle("");
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="w-full px-1 py-0.5 text-sm border border-[var(--color-brand-primary)] rounded bg-[var(--color-base-surface-primary)] text-[var(--color-base-primary)] focus:outline-none"
                            />
                          ) : (
                            <div className="text-sm text-[var(--color-base-primary)] truncate">
                              {draft.title}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-[var(--color-base-tertiary)]">
                            <span>{draft.templateType}</span>
                            <span>•</span>
                            <span>{new Date(draft.updatedAt).toLocaleDateString()}</span>
                            {draft.validationSummary.lastRunAt && (
                              <>
                                <span>•</span>
                                <span className={draft.validationSummary.passed ? "text-[var(--color-status-success)]" : "text-[var(--color-status-error)]"}>
                                  {draft.validationSummary.passed ? "✓" : `${draft.validationSummary.errorsCount}⚠`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(draft);
                            }}
                            className="p-1 text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)]"
                            title="Rename"
                          >
                            ✏
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDraft(draft.id);
                            }}
                            className="p-1 text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)]"
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Output */}
            <div className="flex flex-col bg-[var(--color-base-surface-primary)] rounded-lg border border-[var(--color-base-stroke)]">
              {/* Tabs */}
              <div className="flex border-b border-[var(--color-base-stroke)]">
                <button
                  onClick={() => setActiveTab("spec")}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "spec"
                      ? "text-[var(--color-brand-primary)] border-b-2 border-[var(--color-brand-primary)]"
                      : "text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)]"
                  }`}
                >
                  UI Spec
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === "preview"
                      ? "text-[var(--color-brand-primary)] border-b-2 border-[var(--color-brand-primary)]"
                      : "text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)]"
                  }`}
                >
                  👁 Preview
                </button>
                <button
                  onClick={() => setActiveTab("validation")}
                  className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === "validation"
                      ? "text-[var(--color-brand-primary)] border-b-2 border-[var(--color-brand-primary)]"
                      : "text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)]"
                  }`}
                >
                  Validation Report
                  {validation && (
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded ${
                        validation.passed
                          ? "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]"
                          : "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]"
                      }`}
                    >
                      {validation.passed ? "PASS" : `${validation.errors.length} errors`}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto">
                {activeTab === "spec" && (
                  <div className="p-4 h-full">
                    <textarea
                      value={uiSpecText}
                      onChange={(e) => setUiSpecText(e.target.value)}
                      className="w-full h-full px-3 py-2 rounded-md border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)] font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                      placeholder="Generated UI Spec will appear here..."
                    />
                  </div>
                )}
                {activeTab === "preview" && (
                  <div className="h-full">
                    {parsedSpec ? (
                      <UISpecRenderer spec={parsedSpec} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--color-base-tertiary)]">
                        Generate a UI Spec first, then click Preview
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "validation" && (
                  <div className="p-4">
                    <ValidationReport validation={validation} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50">
          <Notification
            title={notification.variant === "success" ? "Success" : "Warning"}
            description={notification.message}
            variant={notification.variant}
            showCloseButton
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      {/* Wizard Modal */}
      <WizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleWizardSubmit}
      />
    </div>
  );
}

/**
 * Validation Report Component
 */
function ValidationReport({ validation }: { validation: ValidationResult | null }) {
  if (!validation) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-base-tertiary)]">
        Run validation to see results
      </div>
    );
  }

  const allViolations = [
    ...validation.errors.map((v) => ({ ...v, severity: "error" as const })),
    ...validation.warnings.map((v) => ({ ...v, severity: "warning" as const })),
    ...validation.info.map((v) => ({ ...v, severity: "info" as const })),
  ];

  if (allViolations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-2">✓</div>
        <div className="text-[var(--color-status-success)] font-medium">
          All validations passed!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-[var(--color-status-error)]">
          {validation.errors.length} errors
        </span>
        <span className="text-[var(--color-status-warning)]">
          {validation.warnings.length} warnings
        </span>
        <span className="text-[var(--color-base-secondary)]">
          {validation.info.length} info
        </span>
      </div>
      
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[var(--color-base-secondary)]">
            <th className="pb-2 pr-4 font-medium">Severity</th>
            <th className="pb-2 pr-4 font-medium">Rule ID</th>
            <th className="pb-2 font-medium">Message</th>
          </tr>
        </thead>
        <tbody>
          {allViolations.map((v, i) => (
            <tr key={i} className="border-t border-[var(--color-base-stroke)]">
              <td className="py-2 pr-4">
                <span
                  className={`px-2 py-0.5 text-xs rounded ${
                    v.severity === "error"
                      ? "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]"
                      : v.severity === "warning"
                      ? "bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)]"
                      : "bg-[var(--color-base-surface-secondary)] text-[var(--color-base-secondary)]"
                  }`}
                >
                  {v.severity.toUpperCase()}
                </span>
              </td>
              <td className="py-2 pr-4 font-mono text-[var(--color-base-tertiary)]">
                {v.ruleId}
              </td>
              <td className="py-2 text-[var(--color-base-primary)]">
                {v.message}
                {v.path && (
                  <span className="ml-2 text-[var(--color-base-tertiary)] text-xs">
                    ({v.path})
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Format UISpec as YAML-like string
 */
function formatSpecAsYaml(spec: UISpec): string {
  return JSON.stringify(spec, null, 2)
    .replace(/": /g, ": ")
    .replace(/",$/gm, "")
    .replace(/^"/gm, "")
    .replace(/"/g, "");
}

/**
 * Parse YAML-like spec (simplified JSON parse)
 */
function parseYamlSpec(text: string): UISpec {
  // For MVP, we use JSON format but with relaxed parsing
  try {
    return JSON.parse(text);
  } catch {
    // Try to fix common issues
    const fixed = text
      .replace(/(\w+):/g, '"$1":')
      .replace(/: ([^",\[\]{}\n]+)$/gm, ': "$1"')
      .replace(/'/g, '"');
    return JSON.parse(fixed);
  }
}

/**
 * Main Page Component with Auth
 */
export default function UIGeneratorPage() {
  return (
    <AuthProvider>
      <RBACGate roles={["admin", "designer", "developer"]}>
        <UIGeneratorContent />
      </RBACGate>
    </AuthProvider>
  );
}
