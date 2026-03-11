"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

/** Чекбокс у візарді з preventScrollOnFocus, щоб не стрибав скрол при кліку */
const WizardCheckbox = (props: React.ComponentProps<typeof Checkbox>) => (
  <Checkbox preventScrollOnFocus {...props} />
);

import {
  WizardIntent,
  WIZARD_STEPS,
  createDefaultWizardIntent,
  titleToFeatureId,
  type CreatePageConfig,
} from "./wizardTypes";
import { intentToSummary, intentToUiSpecWithValidation } from "./intentToUiSpec";
import type { AutoFix } from "./intentToUiSpec";
import { getNavigation as getNavigationState, getSectionsForPicker as getSectionsForPickerFn } from "./navigationTree";
import type { FieldRef } from "./fieldCatalog";

// ============================================
// TYPES
// ============================================

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (intent: WizardIntent) => void;
  initialIntent?: WizardIntent | null;
}

// ============================================
// HELPERS
// ============================================

function mapCreateFieldType(type: string): FieldRef["dataType"] {
  switch (type) {
    case "input": return "string";
    case "number": return "number";
    case "textarea": return "string";
    case "select": return "enum";
    case "multi-select": return "enum";
    case "date-time": return "date";
    case "toggle": return "boolean";
    case "url": return "string";
    case "readonly": return "id";
    default: return "string";
  }
}

function extractFieldsFromConfig(config: CreatePageConfig): FieldRef[] {
  const result: FieldRef[] = [];
  const seen = new Set<string>();

  const addField = (id: string, label: string, dataType: FieldRef["dataType"]) => {
    if (seen.has(id)) return;
    seen.add(id);
    result.push({ id, label, dataType });
  };

  for (const section of config.propertiesPanel.sections) {
    for (const f of section.fields) {
      addField(f.id, f.label, mapCreateFieldType(f.type));
    }
  }

  if (config.propertiesPanel.statusToggle) {
    addField("status", config.propertiesPanel.statusLabel || "Status", "enum");
  }

  for (const section of config.sections) {
    if (section.type === "form") {
      const c = section.config as { fields?: Array<{ id: string; label: string; type: string }> };
      for (const f of c.fields || []) {
        addField(f.id, f.label, mapCreateFieldType(f.type));
      }
    }
  }

  addField("created-at", "Created at", "date");
  addField("updated-at", "Updated at", "date");
  addField("created-by", "Created by", "user");

  return result;
}

// ============================================
// WIZARD MODAL COMPONENT
// ============================================

export function WizardModal({
  isOpen,
  onClose,
  onSubmit,
  initialIntent,
}: WizardModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [intent, setIntent] = useState<WizardIntent>(
    initialIntent || createDefaultWizardIntent()
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  /** Зберігається тільки на pointerdown; відновлюємо при focusin та після оновлення intent (з clamp). */
  const restoreScrollTopRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIntent(initialIntent || createDefaultWizardIntent());
    }
  }, [isOpen, initialIntent]);

  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const safe = Math.min(restoreScrollTopRef.current, maxScroll);
    el.scrollTop = safe;
  }, [intent]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const updateIntent = useCallback((updates: Partial<WizardIntent>) => {
    setIntent((prev) => ({ ...prev, ...updates }));
  }, []);

  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case 0: {
        const hasTitle = intent.title.trim().length > 0;
        const hasPlacement = intent.navigation.isNewSection
          ? intent.navigation.newSectionName.trim().length > 0
          : intent.navigation.parentSection !== null;
        const navState = getNavigationState();
        const allPages = navState.sections.flatMap(s => [
          s.label.toLowerCase(),
          ...s.children.map(c => c.label.toLowerCase()),
        ]);
        const isDuplicate = allPages.includes(intent.title.trim().toLowerCase());
        return hasTitle && hasPlacement && !isDuplicate;
      }
      case 1:
        return intent.createPageConfig.sections.length === 1;
      case 2:
        return intent.selectedFields.tableColumns.length > 0;
      default:
        return true;
    }
  }, [currentStep, intent.title, intent.navigation, intent.createPageConfig.sections.length, intent.selectedFields.tableColumns.length]);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1 && canGoNext()) {
      if (currentStep === 0 && !intent.featureId) {
        updateIntent({ featureId: titleToFeatureId(intent.title) });
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(intent);
    onClose();
  };

  if (!mounted || !isOpen) return null;

  const isWideStep = currentStep === 1 || currentStep === 2;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div
        ref={modalRef}
        className={`relative w-full max-h-[90vh] bg-[var(--color-base-surface-primary)] border border-[var(--color-base-stroke)] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
          isWideStep ? "max-w-[900px]" : "max-w-[640px]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-base-stroke)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-base-primary)]">
              New Feature Request
            </h2>
            <p className="text-sm text-[var(--color-base-secondary)]">
              Step {currentStep + 1} of {WIZARD_STEPS.length} —{" "}
              {WIZARD_STEPS[currentStep]?.title}
            </p>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)]">
          <div className="flex gap-1">
            {WIZARD_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  index <= currentStep
                    ? "bg-[var(--color-brand-primary)]"
                    : "bg-[var(--color-base-stroke)]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content — зберігаємо скрол на pointerdown; відновлюємо при focusin і після intent; overflow-anchor: none щоб не зсувало при зміні контенту */}
        <div
          ref={contentScrollRef}
          className="flex-1 overflow-auto p-6"
          style={{ overflowAnchor: "none" }}
          onPointerDownCapture={() => {
            const el = contentScrollRef.current;
            if (el) restoreScrollTopRef.current = el.scrollTop;
          }}
          onFocusInCapture={() => {
            const el = contentScrollRef.current;
            if (!el) return;
            const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
            const safe = Math.min(restoreScrollTopRef.current, maxScroll);
            const restore = () => { el.scrollTop = safe; };
            restore();
            requestAnimationFrame(restore);
          }}
        >
          {currentStep === 0 && <StepFeatureBasics intent={intent} updateIntent={updateIntent} />}
          {currentStep === 1 && <StepCreatePage intent={intent} updateIntent={updateIntent} />}
          {currentStep === 2 && <StepTableColumns intent={intent} updateIntent={updateIntent} />}
          {currentStep === 3 && <StepFilters intent={intent} updateIntent={updateIntent} />}
          {currentStep === 4 && <StepActions intent={intent} updateIntent={updateIntent} />}
          {currentStep === 5 && <StepSummary intent={intent} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            )}
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canGoNext()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit}>Request Feature</Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// STEP COMPONENTS
// ============================================

interface StepProps {
  intent: WizardIntent;
  updateIntent: (updates: Partial<WizardIntent>) => void;
}

// Step 0: Page Name & Navigation
function StepFeatureBasics({ intent, updateIntent }: StepProps) {
  const [navState] = React.useState(() => getNavigationState());
  const sections = getSectionsForPickerFn(navState);
  const [showNewSection, setShowNewSection] = React.useState(intent.navigation.isNewSection);

  const allExistingPages = navState.sections.flatMap(s => [
    s.label.toLowerCase(),
    ...s.children.map(c => c.label.toLowerCase()),
  ]);
  const isDuplicateName = intent.title.trim().length > 0 &&
    allExistingPages.includes(intent.title.trim().toLowerCase());

  const handleSectionSelect = (sectionId: string) => {
    setShowNewSection(false);
    updateIntent({
      navigation: {
        ...intent.navigation,
        parentSection: sectionId,
        isNewSection: false,
        newSectionName: "",
      },
    });
  };

  const handleNewSection = () => {
    setShowNewSection(true);
    updateIntent({
      navigation: {
        ...intent.navigation,
        parentSection: null,
        isNewSection: true,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[var(--color-base-primary)] mb-1">
          Page Name & Location
        </h3>
        <p className="text-sm text-[var(--color-base-secondary)]">
          Name your page and choose where it appears in the sidebar.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-base-primary)] mb-1.5">
            Page Name <span className="text-[var(--color-status-error)]">*</span>
          </label>
          <Input
            value={intent.title}
            onChange={(e) => updateIntent({ title: e.target.value })}
            placeholder="e.g., VS Campaigns"
            autoFocus
          />
          {isDuplicateName && (
            <p className="mt-1.5 text-xs text-[var(--color-status-error)] flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
              </svg>
              A page with this name already exists in the navigation
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-base-primary)] mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={intent.description}
            onChange={(e) => updateIntent({ description: e.target.value })}
            placeholder="Brief description of what this page does..."
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] text-[var(--color-base-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
            rows={2}
          />
        </div>
      </div>

      {/* Preview */}
      {(intent.navigation.parentSection || (showNewSection && intent.navigation.newSectionName)) && intent.title && (
        <div className="p-3 rounded-lg bg-[var(--color-base-surface-secondary)] border border-[var(--color-base-stroke)]">
          <p className="text-xs text-[var(--color-base-tertiary)] mb-2">Preview:</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-base-secondary)]">
              {showNewSection ? intent.navigation.newSectionName || "New Section" : sections.find(s => s.id === intent.navigation.parentSection)?.label}
            </span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-medium text-[var(--color-brand-primary)]">
              {intent.title}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Placement */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-base-primary)] mb-2">
          Place in sidebar
        </label>
        <div className="space-y-1.5 max-h-[240px] overflow-y-auto rounded-lg border border-[var(--color-base-stroke)] p-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => handleSectionSelect(section.id)}
              onMouseDown={(e) => e.preventDefault()}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                !showNewSection && intent.navigation.parentSection === section.id
                  ? "bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/30 text-[var(--color-brand-primary)]"
                  : "hover:bg-[var(--color-base-surface-secondary)] text-[var(--color-base-primary)]"
              }`}
            >
              <span className="flex-1">{section.label}</span>
              {section.childCount > 0 && (
                <span className="text-xs text-[var(--color-base-tertiary)]">
                  {section.childCount} page{section.childCount !== 1 ? "s" : ""}
                </span>
              )}
              {!showNewSection && intent.navigation.parentSection === section.id && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}

          <button
            type="button"
            onClick={handleNewSection}
            onMouseDown={(e) => e.preventDefault()}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors border border-dashed ${
              showNewSection
                ? "bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)]/30 text-[var(--color-brand-primary)]"
                : "border-[var(--color-base-stroke)] text-[var(--color-base-secondary)] hover:bg-[var(--color-base-surface-secondary)] hover:text-[var(--color-base-primary)]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="flex-1">Create new section</span>
          </button>
        </div>
      </div>

      {showNewSection && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-base-primary)] mb-1.5">
            New Section Name <span className="text-[var(--color-status-error)]">*</span>
          </label>
          <Input
            value={intent.navigation.newSectionName}
            onChange={(e) =>
              updateIntent({
                navigation: {
                  ...intent.navigation,
                  newSectionName: e.target.value,
                },
              })
            }
            placeholder="e.g., VIP Store"
          />
          <p className="mt-1 text-xs text-[var(--color-base-tertiary)]">
            This will appear as a new top-level section in the sidebar.
          </p>
        </div>
      )}
    </div>
  );
}

// Step 1: Create Page (P-03) — tabbed: Properties Panel + Content Sections
function StepCreatePage({ intent, updateIntent }: StepProps) {
  const [activeTab, setActiveTab] = useState<"sections" | "properties">("sections");
  const config = intent.createPageConfig;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-[var(--color-base-primary)] mb-1">
          Create / Edit Page (P-03)
        </h3>
        <p className="text-sm text-[var(--color-base-secondary)]">
          Configure the page users will see when creating or editing an item.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-base-stroke)]">
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "sections"
              ? "text-[var(--color-brand-primary)] border-b-2 border-[var(--color-brand-primary)]"
              : "text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)]"
          }`}
        >
          Zone B Pattern
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "properties"
              ? "text-[var(--color-brand-primary)] border-b-2 border-[var(--color-brand-primary)]"
              : "text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)]"
          }`}
        >
          Properties Panel
        </button>
      </div>

      {activeTab === "sections" ? (
        <SectionsEditor config={config} updateIntent={updateIntent} intent={intent} />
      ) : (
        <PropertiesEditor config={config} updateIntent={updateIntent} intent={intent} />
      )}
    </div>
  );
}

// Zone B — один паттерн: вибір типу замість списку секцій
function AccordionItemFieldsEditor({
  config,
  sectionConfig,
  updateIntent,
}: {
  config: CreatePageConfig;
  sectionConfig: { fields?: Array<{ id: string; label: string; type: string; required?: boolean; autoGenerated?: boolean; placeholder?: string; copyable?: boolean }> };
  updateIntent: StepProps["updateIntent"];
}) {
  const section = config.sections[0];
  if (!section || section.type !== "accordion-list") return null;

  const fields = sectionConfig.fields ?? [];

  const updateConfig = (updates: Record<string, unknown>) => {
    updateIntent({
      createPageConfig: {
        ...config,
        sections: [{ ...section, config: { ...sectionConfig, ...updates } }],
      },
    });
  };

  const addField = () => {
    const newField = { id: `field-${Date.now()}`, label: "New Field", type: "input" as const };
    updateConfig({ fields: [...fields, newField] });
  };

  const removeField = (fieldId: string) => {
    updateConfig({ fields: fields.filter(f => f.id !== fieldId) });
  };

  const updateField = (fieldId: string, updates: Record<string, unknown>) => {
    updateConfig({
      fields: fields.map(f => (f.id === fieldId ? { ...f, ...updates } : f)),
    });
  };

  const reorderFields = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...fields];
    const [removed] = next.splice(fromIndex, 1);
    const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    next.splice(insertIndex, 0, removed);
    updateConfig({ fields: next });
  };

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, fieldId: string, index: number) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ fieldId, index }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json")) as { fieldId: string; index: number };
      reorderFields(data.index, toIndex);
    } catch {
      // ignore
    }
  };

  return (
    <div className="border border-[var(--color-base-stroke)] rounded-lg p-4 space-y-3">
      <div className="text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider">
        Accordion item fields
      </div>
      <p className="text-sm text-[var(--color-base-secondary)]">
        Add inputs that appear inside each accordion item (same as Properties Panel). Drag to reorder.
      </p>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className={`flex items-center gap-2 pl-2 rounded-md transition-colors ${
            dragOverIndex === index ? "bg-[var(--color-brand-primary)]/10 ring-1 ring-[var(--color-brand-primary)]/30" : ""
          }`}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
        >
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, field.id, index)}
            onDragEnd={handleDragLeave}
            className="shrink-0 p-1 cursor-grab active:cursor-grabbing text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)] touch-none"
            title="Drag to reorder"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M5 3H7V5H5V3ZM9 3H11V5H9V3ZM5 7H7V9H5V7ZM9 7H11V9H9V7ZM5 11H7V13H5V11ZM9 11H11V13H9V11Z" fill="currentColor"/>
            </svg>
          </div>
          <Input
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
            className="flex-1"
            placeholder="Field label"
          />
          <select
            value={field.type === "readonly" ? "input" : field.type}
            onChange={(e) => updateField(field.id, { type: e.target.value as "input" | "textarea" | "select" | "date-time" })}
            className="px-2 py-1.5 text-sm border border-[var(--color-base-stroke)] rounded-lg bg-[var(--color-base-surface-primary)] text-[var(--color-base-primary)]"
          >
            <option value="input">Input</option>
            <option value="textarea">Textarea</option>
            <option value="select">Select</option>
            <option value="date-time">Date & Time</option>
          </select>
          <WizardCheckbox
            checked={field.required || false}
            onChange={() => updateField(field.id, { required: !field.required })}
          />
          <span className="text-xs text-[var(--color-base-tertiary)]">Req.</span>
          <WizardCheckbox
            checked={field.readOnly === true || field.type === "readonly"}
            onChange={() => {
              const nextReadOnly = !(field.readOnly === true || field.type === "readonly");
              updateField(field.id, {
                readOnly: nextReadOnly,
                ...(nextReadOnly && field.type === "readonly" ? { type: "input" as const } : {}),
              });
            }}
          />
          <span className="text-xs text-[var(--color-base-tertiary)]">Read-only</span>
          <button
            type="button"
            onClick={() => updateField(field.id, { copyable: !field.copyable })}
            title={field.copyable ? "Disable copy button" : "Enable copy button"}
            className={`p-0.5 transition-colors ${
              field.copyable
                ? "text-[var(--color-brand-primary)]"
                : "text-[var(--color-base-tertiary)] hover:text-[var(--color-base-secondary)]"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <button
            onClick={() => removeField(field.id)}
            className="p-1 text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)]"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-2 text-sm text-[var(--color-brand-primary)] hover:underline"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add field
      </button>
    </div>
  );
}

function SectionsEditor({ config, updateIntent, intent }: { config: CreatePageConfig; updateIntent: StepProps["updateIntent"]; intent: WizardIntent }) {
  const sectionTypes = [
    { value: "form", label: "Form Group", description: "Named group of form fields" },
    { value: "accordion-list", label: "Accordion List", description: "Repeatable expandable items" },
    { value: "editable-table", label: "Editable Table", description: "Inline editable rows with columns" },
    { value: "master-detail", label: "Master-Detail", description: "Left list + right detail panel" },
    { value: "media-upload", label: "Media Upload", description: "Image/file upload with preview" },
    { value: "simple-list", label: "Simple List", description: "Flat repeatable items" },
  ] as const;

  const selectedType = config.sections[0]?.type ?? null;

  const selectPattern = (type: string) => {
    const label = sectionTypes.find(t => t.value === type)?.label || type;
    const newSection = {
      id: `zone-b-${Date.now()}`,
      type: type as CreatePageConfig["sections"][0]["type"],
      title: label,
      config: getDefaultSectionConfig(type),
    };
    updateIntent({
      createPageConfig: { ...config, sections: [newSection] },
    });
  };

  const updateSectionTitle = (title: string) => {
    if (!config.sections[0]) return;
    updateIntent({
      createPageConfig: {
        ...config,
        sections: [{ ...config.sections[0], title }],
      },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-base-secondary)]">
        Zone B can have only one pattern. Choose the content type for the main area of the page.
      </p>

      {/* Single pattern choice — cards */}
      <div>
        <div className="text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider mb-2">
          Zone B Pattern
        </div>
        <div className="grid grid-cols-2 gap-2">
          {sectionTypes.map(st => (
            <button
              key={st.value}
              type="button"
              onClick={() => selectPattern(st.value)}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                selectedType === st.value
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10"
                  : "border-[var(--color-base-stroke)] hover:bg-[var(--color-base-surface-secondary)]"
              }`}
            >
              <div className={`relative shrink-0 size-4 rounded-full border mt-0.5 flex items-center justify-center ${
                selectedType === st.value
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]"
                  : "border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]"
              }`}>
                {selectedType === st.value && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                    <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--color-base-primary)]">{st.label}</div>
                <div className="text-xs text-[var(--color-base-secondary)]">{st.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Title for selected pattern (single section) */}
      {config.sections.length === 1 && (
        <div>
          <label className="block text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider mb-1.5">
            Section title
          </label>
          <Input
            value={config.sections[0].title}
            onChange={(e) => updateSectionTitle(e.target.value)}
            placeholder="e.g. General"
          />
        </div>
      )}

      {/* Accordion List: item fields (same principle as Properties Panel) */}
      {config.sections.length === 1 && selectedType === "accordion-list" && (
        <AccordionItemFieldsEditor
          config={config}
          sectionConfig={config.sections[0].config as { fields?: Array<{ id: string; label: string; type: string; required?: boolean; autoGenerated?: boolean; placeholder?: string }> }}
          updateIntent={updateIntent}
        />
      )}

      {config.sections.length === 0 && (
        <div className="p-4 rounded-lg bg-[var(--color-base-surface-secondary)] border border-[var(--color-base-stroke)]">
          <p className="text-sm text-[var(--color-base-tertiary)]">
            Select one pattern above to continue.
          </p>
        </div>
      )}

      {/* Toolbar options */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider">
          Toolbar & Actions
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)]">
          <WizardCheckbox
            checked={config.showToolbar}
            onChange={() => updateIntent({ createPageConfig: { ...config, showToolbar: !config.showToolbar } })}
          />
          <span className="text-[var(--color-base-primary)]">Show toolbar (+ Add, Expand All / Collapse All)</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)]">
          <WizardCheckbox
            checked={config.saveChanges}
            onChange={() => updateIntent({ createPageConfig: { ...config, saveChanges: !config.saveChanges } })}
          />
          <span className="text-[var(--color-base-primary)]">Save Changes button</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)]">
          <WizardCheckbox
            checked={config.saveAndClose}
            onChange={() => updateIntent({ createPageConfig: { ...config, saveAndClose: !config.saveAndClose } })}
          />
          <span className="text-[var(--color-base-primary)]">Save &amp; Close button</span>
        </div>
      </div>
    </div>
  );
}

// Properties Panel sub-editor
function PropertiesEditor({ config, updateIntent, intent }: { config: CreatePageConfig; updateIntent: StepProps["updateIntent"]; intent: WizardIntent }) {
  const toggleStatusToggle = () => {
    updateIntent({
      createPageConfig: {
        ...config,
        propertiesPanel: { ...config.propertiesPanel, statusToggle: !config.propertiesPanel.statusToggle },
      },
    });
  };

  const toggleDelete = () => {
    updateIntent({
      createPageConfig: {
        ...config,
        propertiesPanel: { ...config.propertiesPanel, showDelete: !config.propertiesPanel.showDelete },
      },
    });
  };

  const addField = (sectionId: string) => {
    const newField = { id: `field-${Date.now()}`, label: "New Field", type: "input" as const };
    updateIntent({
      createPageConfig: {
        ...config,
        propertiesPanel: {
          ...config.propertiesPanel,
          sections: config.propertiesPanel.sections.map(s =>
            s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
          ),
        },
      },
    });
  };

  const removeField = (sectionId: string, fieldId: string) => {
    updateIntent({
      createPageConfig: {
        ...config,
        propertiesPanel: {
          ...config.propertiesPanel,
          sections: config.propertiesPanel.sections.map(s =>
            s.id === sectionId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s
          ),
        },
      },
    });
  };

  const updateField = (sectionId: string, fieldId: string, updates: Record<string, unknown>) => {
    updateIntent({
      createPageConfig: {
        ...config,
        propertiesPanel: {
          ...config.propertiesPanel,
          sections: config.propertiesPanel.sections.map(s =>
            s.id === sectionId
              ? { ...s, fields: s.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f) }
              : s
          ),
        },
      },
    });
  };

  const reorderFields = (sectionId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const section = config.propertiesPanel.sections.find(s => s.id === sectionId);
    if (!section || fromIndex < 0 || toIndex < 0 || fromIndex >= section.fields.length || toIndex >= section.fields.length) return;
    const newFields = [...section.fields];
    const [removed] = newFields.splice(fromIndex, 1);
    const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    newFields.splice(insertIndex, 0, removed);
    updateIntent({
      createPageConfig: {
        ...config,
        propertiesPanel: {
          ...config.propertiesPanel,
          sections: config.propertiesPanel.sections.map(s =>
            s.id === sectionId ? { ...s, fields: newFields } : s
          ),
        },
      },
    });
  };

  const [dragOverIndex, setDragOverIndex] = useState<{ sectionId: string; index: number } | null>(null);

  const handleFieldDragStart = (e: React.DragEvent, sectionId: string, fieldId: string, index: number) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ sectionId, fieldId, index }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFieldDragOver = (e: React.DragEvent, sectionId: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex({ sectionId, index });
  };

  const handleFieldDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleFieldDrop = (e: React.DragEvent, sectionId: string, toIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json")) as { sectionId: string; fieldId: string; index: number };
      if (data.sectionId !== sectionId) return;
      reorderFields(sectionId, data.index, toIndex);
    } catch {
      // ignore
    }
  };

  const handleFieldDragEnd = () => {
    setDragOverIndex(null);
  };

  const addSection = () => {
    updateIntent({
      createPageConfig: {
        ...config,
        propertiesPanel: {
          ...config.propertiesPanel,
          sections: [
            ...config.propertiesPanel.sections,
            { id: `section-${Date.now()}`, title: "New Section", fields: [] },
          ],
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-base-secondary)]">
        Configure the right-side properties panel that appears on create/edit pages.
      </p>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)]">
          <WizardCheckbox checked={config.propertiesPanel.statusToggle} onChange={toggleStatusToggle} />
          <div>
            <div className="font-medium text-[var(--color-base-primary)]">Status Toggle</div>
            <div className="text-sm text-[var(--color-base-secondary)]">Live/Draft toggle at the top</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)]">
          <WizardCheckbox checked={config.propertiesPanel.showDelete} onChange={toggleDelete} />
          <div>
            <div className="font-medium text-[var(--color-base-primary)]">Delete Button</div>
            <div className="text-sm text-[var(--color-base-secondary)]">Show delete action at the bottom</div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {config.propertiesPanel.sections.map(section => (
        <div key={section.id} className="border border-[var(--color-base-stroke)] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={section.title}
              onChange={(e) => {
                updateIntent({
                  createPageConfig: {
                    ...config,
                    propertiesPanel: {
                      ...config.propertiesPanel,
                      sections: config.propertiesPanel.sections.map(s =>
                        s.id === section.id ? { ...s, title: e.target.value } : s
                      ),
                    },
                  },
                });
              }}
              className="flex-1 font-medium"
            />
          </div>

          {section.fields.map((field, index) => (
            <div
              key={field.id}
              className={`flex items-center gap-2 pl-2 rounded-md transition-colors ${
                dragOverIndex?.sectionId === section.id && dragOverIndex?.index === index
                  ? "bg-[var(--color-brand-primary)]/10 ring-1 ring-[var(--color-brand-primary)]/30"
                  : ""
              }`}
              onDragOver={(e) => handleFieldDragOver(e, section.id, index)}
              onDragLeave={handleFieldDragLeave}
              onDrop={(e) => handleFieldDrop(e, section.id, index)}
            >
              <div
                draggable
                onDragStart={(e) => handleFieldDragStart(e, section.id, field.id, index)}
                onDragEnd={handleFieldDragEnd}
                className="shrink-0 p-1 cursor-grab active:cursor-grabbing text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)] touch-none"
                title="Drag to reorder"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M5 3H7V5H5V3ZM9 3H11V5H9V3ZM5 7H7V9H5V7ZM9 7H11V9H9V7ZM5 11H7V13H5V11ZM9 11H11V13H9V11Z" fill="currentColor"/>
                </svg>
              </div>
              <Input
                value={field.label}
                onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                className="flex-1"
                placeholder="Field label"
              />
              <select
                value={field.type === "readonly" ? "input" : field.type}
                onChange={(e) => updateField(section.id, field.id, { type: e.target.value as "input" | "textarea" | "select" | "date-time" })}
                className="px-2 py-1.5 text-sm border border-[var(--color-base-stroke)] rounded-lg bg-[var(--color-base-surface-primary)] text-[var(--color-base-primary)]"
              >
                <option value="input">Input</option>
                <option value="textarea">Textarea</option>
                <option value="select">Select</option>
                <option value="date-time">Date & Time</option>
              </select>
              <WizardCheckbox
                checked={field.required || false}
                onChange={() => updateField(section.id, field.id, { required: !field.required })}
              />
              <span className="text-xs text-[var(--color-base-tertiary)]">Req.</span>
              <WizardCheckbox
                checked={field.readOnly === true || field.type === "readonly"}
                onChange={() => {
                  const nextReadOnly = !(field.readOnly === true || field.type === "readonly");
                  updateField(section.id, field.id, {
                    readOnly: nextReadOnly,
                    ...(nextReadOnly && field.type === "readonly" ? { type: "input" as const } : {}),
                  });
                }}
              />
              <span className="text-xs text-[var(--color-base-tertiary)]">Read-only</span>
              <button
                onClick={() => removeField(section.id, field.id)}
                className="p-1 text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)]"
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={() => addField(section.id)}
            className="flex items-center gap-1 text-sm text-[var(--color-brand-primary)] hover:opacity-80"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Add field
          </button>
        </div>
      ))}

      <button
        onClick={addSection}
        className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-primary)] hover:opacity-80"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add section
      </button>
    </div>
  );
}

function getDefaultSectionConfig(type: string): Record<string, unknown> {
  switch (type) {
    case "form":
      return {
        fields: [
          { id: "title", label: "Title", type: "input", width: "half", required: true },
          { id: "id", label: "ID", type: "input", width: "half", readOnly: true, autoGenerated: true },
        ],
      };
    case "accordion-list":
      return {
        titleField: "Item",
        addLabel: "+ Add Item",
        hasStatusToggle: false,
        actions: ["copy", "delete"],
        fields: [
          { id: "field-1", label: "Title", type: "input", required: false },
          { id: "field-2", label: "ID", type: "input", required: false, readOnly: true, autoGenerated: true },
        ],
        children: [
          {
            type: "form",
            title: "General",
            fields: [
              { id: "title", label: "Title", type: "input", width: "half" },
              { id: "id", label: "ID", type: "input", width: "half", readOnly: true },
            ],
          },
        ],
      };
    case "editable-table":
      return {
        addLabel: "+ Add Row",
        hasDragHandle: true,
        columns: [
          { id: "name", label: "Name", type: "input" },
          { id: "value", label: "Value", type: "number" },
        ],
      };
    case "master-detail":
      return {
        addLabel: "+ Add Item",
        titleField: "Item",
        subtitleTemplate: "Sub-items: {count}",
        actions: ["view", "delete"],
        detailChildren: [
          { type: "form", title: "Configuration", fields: [
            { id: "name", label: "Name", type: "input", required: true },
          ]},
        ],
      };
    case "media-upload":
      return {
        accept: "image",
        modes: ["upload", "url"],
        showPreview: true,
      };
    case "simple-list":
      return {
        addLabel: "+ Add Item",
        fields: [
          { id: "name", label: "Name", type: "input" },
        ],
      };
    default:
      return {};
  }
}

// Step 2: Table Columns — pick from P-03 fields
function StepTableColumns({ intent, updateIntent }: StepProps) {
  const availableFields = React.useMemo(
    () => extractFieldsFromConfig(intent.createPageConfig),
    [intent.createPageConfig]
  );

  const selectedColumns = (intent.selectedFields?.tableColumns || []).filter(
    (f): f is FieldRef => f != null && typeof f.id === "string"
  );

  const isSelected = (fieldId: string) => selectedColumns.some(f => f.id === fieldId);

  const toggleField = (field: FieldRef) => {
    let updated: FieldRef[];
    if (isSelected(field.id)) {
      updated = selectedColumns.filter(f => f.id !== field.id);
    } else {
      updated = [...selectedColumns, { ...field }];
    }
    updateIntent({
      selectedFields: { ...intent.selectedFields, tableColumns: updated },
    });
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const current = [...selectedColumns];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= current.length) return;
    [current[index], current[newIndex]] = [current[newIndex], current[index]];
    updateIntent({
      selectedFields: { ...intent.selectedFields, tableColumns: current },
    });
  };

  const removeField = (fieldId: string) => {
    const updated = selectedColumns.filter(f => f.id !== fieldId);
    updateIntent({
      selectedFields: { ...intent.selectedFields, tableColumns: updated },
    });
  };

  const toggleCopyable = (fieldId: string) => {
    const updated = selectedColumns.map(f =>
      f.id === fieldId ? { ...f, copyable: !f.copyable } : f
    );
    updateIntent({
      selectedFields: { ...intent.selectedFields, tableColumns: updated },
    });
  };

  const canBeCopyable = (field: FieldRef): boolean => {
    if (!field || !field.id) return false;
    return field.id === "id" || field.id === "title" || field.dataType === "id" || field.dataType === "string";
  };

  const showWarning = selectedColumns.length > 8;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-[var(--color-base-primary)] mb-1">
          Table Columns
        </h3>
        <p className="text-sm text-[var(--color-base-secondary)]">
          Choose which fields from the create page should appear as columns in the table view (P-02).
        </p>
      </div>

      {showWarning && (
        <div className="px-3 py-2 rounded-lg bg-[var(--color-status-warning)]/10 border border-[var(--color-status-warning)]/30 text-sm text-[var(--color-status-warning)]">
          {selectedColumns.length} table columns selected. More than 8 may affect readability.
        </div>
      )}

      <div className="flex gap-4 min-h-[320px]">
        {/* Left: Available fields */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider mb-2">
            Available Fields ({availableFields.length})
          </div>
          <div className="flex-1 overflow-auto border border-[var(--color-base-stroke)] rounded-lg">
            <div className="divide-y divide-[var(--color-base-stroke)]">
              {availableFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-base-surface-secondary)] cursor-pointer"
                  onClick={() => toggleField(field)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className={`relative shrink-0 size-4 rounded border transition-all duration-200 flex items-center justify-center ${
                    isSelected(field.id)
                      ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white"
                      : "bg-[var(--color-base-surface-primary)] border-[var(--color-base-stroke)]"
                  }`}>
                    {isSelected(field.id) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--color-base-primary)]">{field.label}</div>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-base-surface-secondary)] text-[var(--color-base-tertiary)]">
                    {field.dataType}
                  </span>
                </div>
              ))}
              {availableFields.length === 0 && (
                <div className="p-4 text-center text-sm text-[var(--color-base-tertiary)]">
                  No fields available. Configure the Create Page first.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected columns */}
        <div className="w-52 flex-shrink-0 flex flex-col">
          <div className="text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider mb-2">
            Table Columns ({selectedColumns.length})
          </div>
          <div className="flex-1 overflow-auto border border-[var(--color-base-stroke)] rounded-lg">
            {selectedColumns.length === 0 ? (
              <div className="p-3 text-center text-xs text-[var(--color-base-tertiary)]">
                No columns selected
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-base-stroke)]">
                {selectedColumns.map((field, index) => {
                  if (!field || !field.id) return null;
                  return (
                    <div key={field.id} className="flex items-center gap-1 px-2 py-1.5 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveField(index, "up")}
                          disabled={index === 0}
                          className="p-0.5 text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)] disabled:opacity-30"
                        >▲</button>
                        <button
                          type="button"
                          onClick={() => moveField(index, "down")}
                          disabled={index === selectedColumns.length - 1}
                          className="p-0.5 text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)] disabled:opacity-30"
                        >▼</button>
                      </div>
                      <span className="flex-1 truncate text-[var(--color-base-primary)]">
                        {field.label}
                      </span>
                      {canBeCopyable(field) && (
                        <button
                          type="button"
                          onClick={() => toggleCopyable(field.id)}
                          title={field.copyable ? "Disable copy button" : "Enable copy button"}
                          className={`p-0.5 transition-colors ${
                            field.copyable
                              ? "text-[var(--color-brand-primary)]"
                              : "text-[var(--color-base-tertiary)] hover:text-[var(--color-base-secondary)]"
                          }`}
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="p-0.5 text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)]"
                      >×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedColumns.length === 0 && (
            <p className="mt-2 text-xs text-[var(--color-status-error)]">
              At least 1 table column required
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 3: Filters & Search
function StepFilters({ intent, updateIntent }: StepProps) {
  const selectedColumns = (intent.selectedFields?.tableColumns || []).filter(
    (f): f is FieldRef => f != null && typeof f.id === "string" && typeof f.dataType === "string"
  );

  const filterableTypes = ["enum", "date", "boolean"];
  const filterableFields = selectedColumns
    .filter((field) => filterableTypes.includes(field.dataType))
    .map((field) => ({
      id: field.id,
      label: field.label || field.id,
      dataType: field.dataType,
      description: getFilterDescription(field.dataType),
    }));

  const toggleFreeTextSearch = () => {
    updateIntent({
      filters: { ...intent.filters, freeTextSearch: !intent.filters.freeTextSearch },
    });
  };

  const toggleFieldFilter = (fieldId: string) => {
    const currentFieldFilters = intent.filters.fieldFilters || {};
    updateIntent({
      filters: {
        ...intent.filters,
        fieldFilters: {
          ...currentFieldFilters,
          [fieldId]: !currentFieldFilters[fieldId],
        },
      },
    });
  };

  const isFieldFilterEnabled = (fieldId: string): boolean => {
    return intent.filters.fieldFilters?.[fieldId] || false;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[var(--color-base-primary)] mb-1">
          Filters & Search
        </h3>
        <p className="text-sm text-[var(--color-base-secondary)]">
          Select which filters should be available based on your table columns.
        </p>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider">
          Search
        </div>
        <div
          className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)] cursor-pointer hover:bg-[var(--color-base-surface-secondary)] transition-colors"
          onClick={toggleFreeTextSearch}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className={`relative shrink-0 size-4 rounded border transition-all duration-200 flex items-center justify-center ${
            intent.filters.freeTextSearch
              ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white"
              : "bg-[var(--color-base-surface-primary)] border-[var(--color-base-stroke)]"
          }`}>
            {intent.filters.freeTextSearch && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-[var(--color-base-primary)]">Free-text search</div>
            <div className="text-sm text-[var(--color-base-secondary)]">Search across all text fields</div>
          </div>
        </div>
      </div>

      {filterableFields.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider">
            Field Filters ({filterableFields.length} available)
          </div>
          {filterableFields.map((field) => (
            <div
              key={field.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)] cursor-pointer hover:bg-[var(--color-base-surface-secondary)] transition-colors"
              onClick={() => toggleFieldFilter(field.id)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className={`relative shrink-0 size-4 rounded border transition-all duration-200 flex items-center justify-center ${
                isFieldFilterEnabled(field.id)
                  ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white"
                  : "bg-[var(--color-base-surface-primary)] border-[var(--color-base-stroke)]"
              }`}>
                {isFieldFilterEnabled(field.id) && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--color-base-primary)]">{field.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-base-surface-secondary)] text-[var(--color-base-tertiary)]">
                    {field.dataType}
                  </span>
                </div>
                <div className="text-sm text-[var(--color-base-secondary)]">{field.description}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-[var(--color-base-surface-secondary)] border border-[var(--color-base-stroke)]">
          <div className="text-sm text-[var(--color-base-secondary)]">
            <span className="font-medium">No filterable fields</span>
            <p className="mt-1">
              Your table columns don&apos;t include fields that can be filtered (enum, date, or boolean types).
              Go back to &quot;Table Columns&quot; and add columns with those types.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getFilterDescription(dataType: string): string {
  switch (dataType) {
    case "enum": return "Filter by predefined options";
    case "date": return "Filter by date range";
    case "boolean": return "Toggle filter (yes/no)";
    default: return "Filter by value";
  }
}

// Step 4: Actions
function StepActions({ intent, updateIntent }: StepProps) {
  const toggleRowAction = (key: keyof WizardIntent["rowActions"]) => {
    updateIntent({
      rowActions: { ...intent.rowActions, [key]: !intent.rowActions[key] },
    });
  };

  const toggleBulkAction = (key: keyof WizardIntent["bulkActions"]) => {
    updateIntent({
      bulkActions: { ...intent.bulkActions, [key]: !intent.bulkActions[key] },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[var(--color-base-primary)] mb-1">
          Actions
        </h3>
        <p className="text-sm text-[var(--color-base-secondary)]">
          What actions can users perform on table rows?
        </p>
      </div>

      {/* Row Actions */}
      <div>
        <h4 className="text-sm font-medium text-[var(--color-base-primary)] mb-3">
          Row Actions
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)] cursor-pointer hover:bg-[var(--color-base-surface-secondary)]">
            <WizardCheckbox checked={intent.rowActions.viewDetails} onChange={() => toggleRowAction("viewDetails")} />
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
                <path d="M8 3C4.5 3 1.5 6 1.5 8C1.5 10 4.5 13 8 13C11.5 13 14.5 10 14.5 8C14.5 6 11.5 3 8 3Z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span className="text-[var(--color-base-primary)]">View details</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)] cursor-pointer hover:bg-[var(--color-base-surface-secondary)]">
            <WizardCheckbox checked={intent.rowActions.edit} onChange={() => toggleRowAction("edit")} />
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
                <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <span className="text-[var(--color-base-primary)]">Edit</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)] cursor-pointer hover:bg-[var(--color-base-surface-secondary)]">
            <WizardCheckbox checked={intent.rowActions.duplicate} onChange={() => toggleRowAction("duplicate")} />
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
                <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span className="text-[var(--color-base-primary)]">Duplicate</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)] cursor-pointer hover:bg-[var(--color-base-surface-secondary)]">
            <WizardCheckbox checked={intent.rowActions.approve} onChange={() => toggleRowAction("approve")} />
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-status-success)]">
                <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[var(--color-base-primary)]">Approve</span>
            </div>
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)] cursor-pointer hover:bg-[var(--color-base-surface-secondary)]">
              <WizardCheckbox checked={intent.rowActions.reject} onChange={() => toggleRowAction("reject")} />
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-status-warning)]">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-[var(--color-base-primary)]">Reject</span>
              </div>
            </label>
            {intent.rowActions.reject && (
              <label className="flex items-center gap-3 ml-8 p-2 rounded-lg cursor-pointer">
                <WizardCheckbox
                  checked={intent.rowActions.rejectRequiresReason}
                  onChange={() => toggleRowAction("rejectRequiresReason")}
                />
                <span className="text-sm text-[var(--color-base-secondary)]">Requires reason</span>
              </label>
            )}
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-status-error)]/30 cursor-pointer hover:bg-[var(--color-status-error)]/5">
            <WizardCheckbox checked={intent.rowActions.delete} onChange={() => toggleRowAction("delete")} />
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-status-error)]">
                <path d="M3 4H13M6 4V3C6 2.45 6.45 2 7 2H9C9.55 2 10 2.45 10 3V4M12 4V13C12 13.55 11.55 14 11 14H5C4.45 14 4 13.55 4 13V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-[var(--color-status-error)]">Delete (always requires confirmation)</span>
            </div>
          </label>
        </div>
      </div>

      {/* Bulk Actions */}
      <div>
        <h4 className="text-sm font-medium text-[var(--color-base-primary)] mb-3">
          Bulk Actions
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)] cursor-pointer hover:bg-[var(--color-base-surface-secondary)]">
            <WizardCheckbox checked={intent.bulkActions.approveSelected} onChange={() => toggleBulkAction("approveSelected")} />
            <span className="text-[var(--color-base-primary)]">Approve selected</span>
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-base-stroke)] cursor-pointer hover:bg-[var(--color-base-surface-secondary)]">
              <WizardCheckbox checked={intent.bulkActions.rejectSelected} onChange={() => toggleBulkAction("rejectSelected")} />
              <span className="text-[var(--color-base-primary)]">Reject selected</span>
            </label>
            {intent.bulkActions.rejectSelected && (
              <label className="flex items-center gap-3 ml-8 p-2 rounded-lg cursor-pointer">
                <WizardCheckbox
                  checked={intent.bulkActions.rejectRequiresReason}
                  onChange={() => toggleBulkAction("rejectRequiresReason")}
                />
                <span className="text-sm text-[var(--color-base-secondary)]">Requires reason</span>
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 5: Summary
function StepSummary({ intent }: { intent: WizardIntent }) {
  const summary = intentToSummary(intent);
  const [autoFixes, setAutoFixes] = React.useState<AutoFix[]>([]);

  React.useEffect(() => {
    try {
      const result = intentToUiSpecWithValidation(intent);
      setAutoFixes(result.autoFixes);
    } catch {
      setAutoFixes([]);
    }
  }, [intent]);

  const fixed = autoFixes.filter(f => f.severity === "fixed");
  const recommendations = autoFixes.filter(f => f.severity === "recommendation");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-[var(--color-base-primary)] mb-1">
          Summary
        </h3>
        <p className="text-sm text-[var(--color-base-secondary)]">
          Review your configuration before submitting. Both a table page (P-02) and a create/edit page (P-03) will be generated.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-[var(--color-base-surface-secondary)] border border-[var(--color-base-stroke)]">
        <pre className="text-sm text-[var(--color-base-primary)] whitespace-pre-wrap font-mono leading-relaxed">
          {summary.join("\n")}
        </pre>
      </div>

      {fixed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-status-success)]">
              <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium text-[var(--color-base-primary)]">
              Auto-applied {fixed.length} design system rule{fixed.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-status-success)]/5 border border-[var(--color-status-success)]/20">
            <div className="space-y-1.5">
              {fixed.map((f, i) => (
                <div key={`fix-${i}`} className="flex items-center gap-2 text-sm">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[var(--color-status-success)]">
                    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[var(--color-base-primary)]">{f.description}</span>
                  <span className="text-xs font-mono text-[var(--color-base-tertiary)]">{f.ruleId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-[var(--color-base-secondary)]">
            Recommendations
          </span>
          <div className="p-3 rounded-lg bg-[var(--color-base-surface-secondary)] border border-[var(--color-base-stroke)]">
            <div className="space-y-1.5">
              {recommendations.map((r, i) => (
                <div key={`rec-${i}`} className="flex items-start gap-2 text-sm">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-[var(--color-base-tertiary)]">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="8" cy="5" r="0.75" fill="currentColor"/>
                  </svg>
                  <span className="text-[var(--color-base-secondary)]">{r.description}</span>
                  <span className="text-xs font-mono text-[var(--color-base-tertiary)] shrink-0">{r.ruleId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-lg bg-[var(--color-brand-primary)]/5 border border-[var(--color-brand-primary)]/20">
        <p className="text-sm text-[var(--color-base-primary)]">
          <strong>Ready to submit!</strong> Click &quot;Request Feature&quot; to create
          your CRM section with both table and create page.
          {fixed.length > 0 && (
            <span className="text-[var(--color-base-secondary)]">
              {" "}{fixed.length} design system rule{fixed.length !== 1 ? "s were" : " was"} automatically applied.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
