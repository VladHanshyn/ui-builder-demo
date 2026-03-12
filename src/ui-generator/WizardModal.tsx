"use client";

let _uidSeq = 0;
function uid(prefix: string) { return `${prefix}-${Date.now()}-${++_uidSeq}`; }

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input, SearchInput } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Checkbox } from "@/components/ui/Checkbox";
import { ButtonGroup, ButtonGroupItem } from "@/components/ui/ButtonGroup";
import { Toggle } from "@/components/ui/Toggle";
import { Select } from "@/components/ui/Select";
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

function AnimatedStep({ stepKey, children }: { stepKey: number; children: React.ReactNode }) {
  const [displayKey, setDisplayKey] = useState(stepKey);
  const [phase, setPhase] = useState<"enter" | "visible">("visible");
  const prevKey = useRef(stepKey);

  useEffect(() => {
    if (stepKey !== prevKey.current) {
      prevKey.current = stepKey;
      setPhase("enter");
      setDisplayKey(stepKey);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase("visible"));
      });
    }
  }, [stepKey]);

  return (
    <div
      className="h-full w-full transition-all duration-300 ease-out"
      style={{
        opacity: phase === "enter" ? 0 : 1,
        transform: phase === "enter" ? "translateY(12px)" : "translateY(0)",
      }}
      key={displayKey}
    >
      {children}
    </div>
  );
}
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
    } else if (section.type === "accordion-list") {
      const sItems = migrateSectionItems(section.config as Record<string, unknown>);
      for (const si of sItems) {
        if (si.kind === "field") {
          addField(si.id, si.label, mapCreateFieldType(si.type));
        }
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
  const [step1ActiveTab, setStep1ActiveTab] = useState<"sections" | "properties">("sections");
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
    const restore = () => {
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      const safe = Math.min(restoreScrollTopRef.current, maxScroll);
      el.scrollTop = safe;
    };
    restore();
    requestAnimationFrame(restore);
    setTimeout(restore, 0);
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative w-[1376px] max-w-[calc(100vw-2rem)] h-[90vh] bg-[var(--color-base-stroke)] border border-[var(--color-base-stroke)] rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Робоча область: зліва 24px, справа 8px, зверху 8px, знизу 8px; Preview Area отримає додатковий pb окремо */}
        <div className="flex-1 flex min-h-0 pl-6 pr-2 pt-2 pb-2 gap-0">
          {/* Preview Area — додатковий відступ знизу 64px */}
          <div className={`flex-1 min-w-0 min-h-0 pb-16 ${currentStep <= 1 ? "overflow-visible" : "overflow-hidden rounded-xl"}`}>
              {currentStep === 0 && (
                <AnimatedStep stepKey={0}>
                  <Step0PreviewArea intent={intent} updateIntent={updateIntent} />
                </AnimatedStep>
              )}
              {currentStep === 1 && (
                <AnimatedStep stepKey={1}>
                  <Step1PreviewArea intent={intent} updateIntent={updateIntent} activeTab={step1ActiveTab} />
                </AnimatedStep>
              )}
              {currentStep >= 2 && currentStep <= 4 && (
                <SmartTablePreview intent={intent} activeStep={currentStep as 2 | 3 | 4} />
              )}
              {currentStep >= 5 && (
                <AnimatedStep stepKey={currentStep}>
                  <StepGenericPreview step={currentStep} intent={intent} />
                </AnimatedStep>
              )}
          </div>

          {/* Right Tool Panel — повна висота, 8px від низу модалки через pb-2 контейнера */}
          <div className="relative z-10 w-[465px] min-w-[465px] max-w-[465px] shrink-0 flex flex-col min-h-0 bg-[var(--color-base-surface-primary)] rounded-[24px] overflow-hidden border border-[var(--color-base-stroke)]">
            <button
              ref={firstFocusableRef}
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {/* Фіксований хедер: інформація про степ */}
            <div className="shrink-0 px-4 pt-6 pb-4 border-b border-[var(--color-base-stroke)]">
              <p className="text-paragraph-2 text-[var(--color-base-secondary)]">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </p>
              <h3 className="text-xl font-medium text-[var(--color-base-primary)] mt-1">
                {WIZARD_STEPS[currentStep]?.title}
              </h3>
              {(currentStep !== 0 && currentStep !== 1) ? (
                <p className="text-sm text-[var(--color-base-secondary)] mt-1">
                  {WIZARD_STEPS[currentStep]?.description}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-base-secondary)] mt-1">
                  {currentStep === 0 && "Name your page and choose where it appears in the sidebar."}
                  {currentStep === 1 && "Configure the page users will see when creating or editing an item."}
                </p>
              )}
            </div>
            {/* Скроловане тіло */}
            <div
              ref={contentScrollRef}
              className="flex-1 min-h-0 overflow-y-auto pt-4 pb-4"
              onPointerDownCapture={() => {
                const el = contentScrollRef.current;
                if (el) restoreScrollTopRef.current = el.scrollTop;
              }}
              onClickCapture={() => {
                const el = contentScrollRef.current;
                if (el) restoreScrollTopRef.current = el.scrollTop;
              }}
              onFocusCapture={() => {
                const el = contentScrollRef.current;
                if (!el) return;
                const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
                const safe = Math.min(restoreScrollTopRef.current, maxScroll);
                const restore = () => { el.scrollTop = safe; };
                restore();
                requestAnimationFrame(restore);
                setTimeout(restore, 0);
              }}
            >
              {currentStep === 0 && (
                <Step0Form intent={intent} updateIntent={updateIntent} />
              )}
              {currentStep === 1 && (
                <StepCreatePage intent={intent} updateIntent={updateIntent} activeTab={step1ActiveTab} setActiveTab={setStep1ActiveTab} />
              )}
              {currentStep === 2 && (
                <StepTableColumns intent={intent} updateIntent={updateIntent} />
              )}
              {currentStep === 3 && (
                <div className="mt-4 px-4">
                  <StepFilters intent={intent} updateIntent={updateIntent} />
                </div>
              )}
              {currentStep === 4 && (
                <div className="mt-4 px-4">
                  <StepActions intent={intent} updateIntent={updateIntent} />
                </div>
              )}
              {currentStep === 5 && (
                <div className="mt-4 px-4">
                  <StepSummary intent={intent} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-4 border-t border-[var(--color-base-stroke)] shrink-0">
              {currentStep > 0 && (
                <Button variant="secondary" onClick={handleBack} className="flex-1">
                  Back
                </Button>
              )}
              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button onClick={handleNext} disabled={!canGoNext()} className="flex-1">
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1">Request Feature</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// WIZARD PAGE COMPONENT (full-page, no modal)
// ============================================

interface WizardPageProps {
  onSubmit?: (intent: WizardIntent) => void;
  onBack?: () => void;
  initialIntent?: WizardIntent | null;
}

export function WizardPage({
  onSubmit,
  onBack,
  initialIntent,
}: WizardPageProps) {
  const [mounted, setMounted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [step1ActiveTab, setStep1ActiveTab] = useState<"sections" | "properties">("sections");
  const [intent, setIntent] = useState<WizardIntent>(
    initialIntent || createDefaultWizardIntent()
  );
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const restoreScrollTopRef = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    const restore = () => {
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      const safe = Math.min(restoreScrollTopRef.current, maxScroll);
      el.scrollTop = safe;
    };
    restore();
    requestAnimationFrame(restore);
    setTimeout(restore, 0);
  }, [intent]);

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
    onSubmit?.(intent);
  };

  if (!mounted) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--color-base-stroke)]">
      <div className="flex-1 flex min-h-0 pl-6 pr-2 pt-2 pb-2 gap-0">
        {/* Preview Area */}
        <div className={`flex-1 min-w-0 min-h-0 pb-16 ${currentStep <= 1 ? "overflow-visible" : "overflow-hidden rounded-xl"}`}>
            {currentStep === 0 && (
              <AnimatedStep stepKey={0}>
                <Step0PreviewArea intent={intent} updateIntent={updateIntent} />
              </AnimatedStep>
            )}
            {currentStep === 1 && (
              <AnimatedStep stepKey={1}>
                <Step1PreviewArea intent={intent} updateIntent={updateIntent} activeTab={step1ActiveTab} />
              </AnimatedStep>
            )}
            {currentStep >= 2 && currentStep <= 4 && (
              <SmartTablePreview intent={intent} activeStep={currentStep as 2 | 3 | 4} />
            )}
            {currentStep >= 5 && (
              <AnimatedStep stepKey={currentStep}>
                <StepGenericPreview step={currentStep} intent={intent} />
              </AnimatedStep>
            )}
        </div>

        {/* Right Tool Panel */}
        <div className="relative z-10 w-[465px] min-w-[465px] max-w-[465px] shrink-0 flex flex-col min-h-0 bg-[var(--color-base-surface-primary)] rounded-[24px] overflow-hidden border border-[var(--color-base-stroke)]">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {/* Step header */}
          <div className="shrink-0 px-4 pt-6 pb-4 border-b border-[var(--color-base-stroke)]">
            <p className="text-paragraph-2 text-[var(--color-base-secondary)]">
              Step {currentStep + 1} of {WIZARD_STEPS.length}
            </p>
            <h3 className="text-xl font-medium text-[var(--color-base-primary)] mt-1">
              {WIZARD_STEPS[currentStep]?.title}
            </h3>
            {(currentStep !== 0 && currentStep !== 1) ? (
              <p className="text-sm text-[var(--color-base-secondary)] mt-1">
                {WIZARD_STEPS[currentStep]?.description}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-base-secondary)] mt-1">
                {currentStep === 0 && "Name your page and choose where it appears in the sidebar."}
                {currentStep === 1 && "Configure the page users will see when creating or editing an item."}
              </p>
            )}
          </div>
          {/* Scrollable body */}
          <div
            ref={contentScrollRef}
            className="flex-1 min-h-0 overflow-y-auto pt-4 pb-4"
            onPointerDownCapture={() => {
              const el = contentScrollRef.current;
              if (el) restoreScrollTopRef.current = el.scrollTop;
            }}
            onClickCapture={() => {
              const el = contentScrollRef.current;
              if (el) restoreScrollTopRef.current = el.scrollTop;
            }}
            onFocusCapture={() => {
              const el = contentScrollRef.current;
              if (!el) return;
              const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
              const safe = Math.min(restoreScrollTopRef.current, maxScroll);
              const restore = () => { el.scrollTop = safe; };
              restore();
              requestAnimationFrame(restore);
              setTimeout(restore, 0);
            }}
          >
            {currentStep === 0 && (
              <Step0Form intent={intent} updateIntent={updateIntent} />
            )}
            {currentStep === 1 && (
              <StepCreatePage intent={intent} updateIntent={updateIntent} activeTab={step1ActiveTab} setActiveTab={setStep1ActiveTab} />
            )}
            {currentStep === 2 && (
              <StepTableColumns intent={intent} updateIntent={updateIntent} />
            )}
            {currentStep === 3 && (
              <div className="mt-4 px-4">
                <StepFilters intent={intent} updateIntent={updateIntent} />
              </div>
            )}
            {currentStep === 4 && (
              <div className="mt-4 px-4">
                <StepActions intent={intent} updateIntent={updateIntent} />
              </div>
            )}
            {currentStep === 5 && (
              <div className="mt-4 px-4">
                <StepSummary intent={intent} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-4 border-t border-[var(--color-base-stroke)] shrink-0">
            {currentStep > 0 && (
              <Button variant="secondary" onClick={handleBack} className="flex-1">
                Back
              </Button>
            )}
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canGoNext()} className="flex-1">
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="flex-1">Request Feature</Button>
            )}
          </div>
        </div>
      </div>

      {/* Exit confirmation popup */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowExitConfirm(false)} />
          <div className="relative bg-[var(--color-base-surface-primary)] rounded-2xl shadow-2xl border border-[var(--color-base-stroke)] p-6 w-[400px] max-w-[calc(100vw-2rem)]">
            <h3 className="text-lg font-medium text-[var(--color-base-primary)]">Leave Wizard?</h3>
            <p className="text-sm text-[var(--color-base-secondary)] mt-2">
              All unsaved progress will be lost. Are you sure you want to leave?
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => { setShowExitConfirm(false); onBack?.(); }}
                className="flex-1 !bg-[var(--color-status-error)] !text-white hover:!opacity-90"
              >
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// STEP COMPONENTS
// ============================================

interface StepProps {
  intent: WizardIntent;
  updateIntent: (updates: Partial<WizardIntent>) => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  audiences: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  ),
  banners: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  ),
  gifts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
  ),
  features: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
  ),
  tags: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  history: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  "vip-store": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-5z"/><line x1="3" y1="7" x2="21" y2="7"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  ),
};

function SectionIcon({ icon, className }: { icon: string; className?: string }) {
  return (
    <span className={`shrink-0 ${className ?? ""}`}>
      {SECTION_ICONS[icon] ?? SECTION_ICONS.features}
    </span>
  );
}

// Step 0: Preview Area — ліва частина, підсвічує поточний вибір (сайдбар + контекст)
function Step0PreviewArea({ intent, updateIntent }: StepProps) {
  const [navState] = React.useState(() => getNavigationState());
  const sections = getSectionsForPickerFn(navState);
  const newSectionRef = React.useRef<HTMLDivElement>(null);
  const iconBtnRef = React.useRef<HTMLButtonElement>(null);
  const [isEditingNew, setIsEditingNew] = React.useState(false);
  const [iconPickerOpen, setIconPickerOpen] = React.useState(false);
  const [pickerPos, setPickerPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  React.useEffect(() => {
    if (isEditingNew && newSectionRef.current) {
      newSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isEditingNew]);

  const customSections = intent.navigation.customSections ?? [];

  const handleSectionSelect = (sectionId: string) => {
    setIsEditingNew(false);
    updateIntent({
      navigation: {
        ...intent.navigation,
        parentSection: sectionId,
        isNewSection: false,
        newSectionName: "",
        newSectionIcon: "features",
      },
    });
  };

  const confirmNewCategory = () => {
    const name = intent.navigation.newSectionName.trim();
    if (!name) return;
    const id = uid("custom");
    const icon = intent.navigation.newSectionIcon || "features";
    setIsEditingNew(false);
    updateIntent({
      navigation: {
        ...intent.navigation,
        parentSection: id,
        isNewSection: false,
        newSectionName: "",
        newSectionIcon: "features",
        customSections: [...customSections, { id, label: name, icon }],
      },
    });
  };

  const removeCustomSection = (sectionId: string) => {
    const next = customSections.filter(s => s.id !== sectionId);
    setIconPickerOpen(false);
    updateIntent({
      navigation: {
        ...intent.navigation,
        parentSection: intent.navigation.parentSection === sectionId ? null : intent.navigation.parentSection,
        customSections: next,
      },
    });
  };

  const updateCustomSectionIcon = (sectionId: string, icon: string) => {
    updateIntent({
      navigation: {
        ...intent.navigation,
        customSections: customSections.map(s => s.id === sectionId ? { ...s, icon } : s),
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Надпис Preview — відступ до контенту 40px */}
      <p className="text-lg font-medium text-[var(--color-base-primary)] px-0 pt-4 mb-10 shrink-0">
        Preview
      </p>

      {/* Контейнер превʼю навігації: хедер + сайдбар в одному блоці зі stroke, білий фон; заходить під Right Panel */}
      <div
        className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]"
        style={{ width: 850, flexShrink: 0, marginRight: -255, marginLeft: 192 }}
      >
        {/* Хедер превʼю */}
        <div className="h-10 border-b border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] flex items-center px-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-base-surface-secondary)] flex items-center justify-center shrink-0">
              <span className="text-sm" aria-hidden>🦅</span>
            </div>
            <span className="font-semibold text-[var(--color-base-primary)] text-sm">Phoenix</span>
          </div>
        </div>
        <div className="flex flex-1 min-h-0">
          {/* Бокова навігація — surface-secondary */}
          <div className="w-64 shrink-0 flex flex-col overflow-hidden bg-[var(--color-base-surface-secondary)] border-r border-[var(--color-base-stroke)]">
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0 hide-scrollbar">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionSelect(section.id)}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    intent.navigation.parentSection === section.id
                      ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                      : "text-[var(--color-base-primary)] hover:bg-[var(--color-base-stroke)]/20"
                  }`}
                >
                  <SectionIcon icon={section.icon} />
                  <span className="flex-1 truncate">{section.label}</span>
                  {section.childCount > 0 && (
                    <span className="text-xs text-[var(--color-base-tertiary)]">{section.childCount}</span>
                  )}
                </button>
              ))}
              {/* Custom (user-created) category (max 1) */}
              {customSections.slice(0, 1).map((cs) => (
                <div
                  key={cs.id}
                  className={`w-full flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                    intent.navigation.parentSection === cs.id
                      ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                      : "text-[var(--color-base-primary)] hover:bg-[var(--color-base-stroke)]/20"
                  }`}
                  onClick={() => handleSectionSelect(cs.id)}
                >
                  <IconButton
                    ref={iconBtnRef}
                    icon={<SectionIcon icon={cs.icon} />}
                    aria-label="Change icon"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (iconBtnRef.current) {
                        const rect = iconBtnRef.current.getBoundingClientRect();
                        setPickerPos({ top: rect.top, left: rect.left });
                      }
                      setIconPickerOpen(!iconPickerOpen);
                    }}
                  />
                  {iconPickerOpen && createPortal(
                    <>
                      <div className="fixed inset-0 z-[9998]" onClick={() => setIconPickerOpen(false)} />
                      <div
                        className="fixed z-[9999] grid grid-cols-4 gap-1 p-2 rounded-xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] shadow-lg"
                        style={{ bottom: `calc(100vh - ${pickerPos.top}px + 4px)`, left: pickerPos.left }}
                      >
                        {Object.keys(SECTION_ICONS).map((iconKey) => (
                          <button
                            key={iconKey}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCustomSectionIcon(cs.id, iconKey);
                              setIconPickerOpen(false);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              cs.icon === iconKey
                                ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                                : "text-[var(--color-base-secondary)] hover:bg-[var(--color-base-surface-secondary)]"
                            }`}
                            title={iconKey}
                          >
                            <SectionIcon icon={iconKey} />
                          </button>
                        ))}
                      </div>
                    </>,
                    document.body
                  )}
                  <span className="flex-1 truncate font-medium">{cs.label}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeCustomSection(cs.id); }}
                    className="shrink-0 p-1 rounded-md text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10 transition-colors"
                    title="Delete category"
                  >
                    <PreviewDeleteIcon />
                  </button>
                </div>
              ))}
              {/* Inline input for new category being created */}
              {isEditingNew && (
                <div ref={newSectionRef} className="flex items-center gap-1 px-1 py-1 rounded-lg bg-[var(--color-brand-primary)]/10">
                  <input
                    type="text"
                    value={intent.navigation.newSectionName}
                    onChange={(e) =>
                      updateIntent({
                        navigation: { ...intent.navigation, newSectionName: e.target.value },
                      })
                    }
                    placeholder="New Category"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && intent.navigation.newSectionName.trim()) {
                        confirmNewCategory();
                      } else if (e.key === "Escape") {
                        setIsEditingNew(false);
                        updateIntent({ navigation: { ...intent.navigation, isNewSection: false, newSectionName: "", newSectionIcon: "features" } });
                      }
                    }}
                    className="flex-1 min-w-0 px-2 py-1.5 text-sm font-medium text-[var(--color-brand-primary)] bg-transparent border-0 outline-none placeholder:text-[var(--color-brand-primary)]/50"
                  />
                  <button
                    type="button"
                    onClick={() => confirmNewCategory()}
                    disabled={!intent.navigation.newSectionName.trim()}
                    className="shrink-0 p-1 rounded-md text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Confirm category"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingNew(false);
                      updateIntent({
                        navigation: { ...intent.navigation, isNewSection: false, newSectionName: "", newSectionIcon: "features" },
                      });
                    }}
                    className="shrink-0 p-1 rounded-md text-[var(--color-brand-primary)]/50 hover:text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10 transition-colors"
                    title="Cancel"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {/* New Category button at bottom — hidden if one custom category exists */}
            {!isEditingNew && customSections.length === 0 && (
              <div className="shrink-0 p-2 border-t border-[var(--color-base-stroke)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingNew(true);
                    updateIntent({
                      navigation: { ...intent.navigation, isNewSection: true, newSectionName: "", newSectionIcon: "features" },
                    });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  New Category
                </button>
              </div>
            )}
          </div>
          {/* Основна область контенту превʼю — без фону */}
          <div className="flex-1 min-w-0 bg-transparent" />
        </div>
      </div>
    </div>
  );
}

// Step 0: форма в Right Tool Panel (назва фічі, куди помістити)
function Step0Form({ intent, updateIntent }: StepProps) {
  const [navState] = React.useState(() => getNavigationState());
  const sections = getSectionsForPickerFn(navState);

  const allExistingPages = navState.sections.flatMap(s => [
    s.label.toLowerCase(),
    ...s.children.map(c => c.label.toLowerCase()),
  ]);
  const isDuplicateName = intent.title.trim().length > 0 &&
    allExistingPages.includes(intent.title.trim().toLowerCase());

  const customSection = (intent.navigation.customSections ?? []).find(s => s.id === intent.navigation.parentSection);
  const parentLabel = intent.navigation.isNewSection
    ? intent.navigation.newSectionName || "New Category"
    : customSection?.label ?? sections.find(s => s.id === intent.navigation.parentSection)?.label;

  return (
    <div className="space-y-6 px-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-base-primary)] mb-1">
          Feature Name <span className="text-[var(--color-status-error)]">*</span>
        </label>
        <Input
          value={intent.title}
          onChange={(e) => updateIntent({ title: e.target.value })}
          placeholder='e.g. "Coinback"'
          className="w-full"
        />
        {isDuplicateName && (
          <p className="mt-1.5 text-xs text-[var(--color-status-error)] flex items-center gap-1">
            A page with this name already exists in the navigation
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-base-primary)] mb-1">
          Path
        </label>
        <div className="px-4 py-3 rounded-xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]">
          {parentLabel ? (
            <p className="text-sm font-medium">
              <span className="text-[var(--color-base-secondary)]">{parentLabel}</span>
              <span className="text-[var(--color-base-tertiary)] mx-1.5">&gt;</span>
              <span className="text-[var(--color-brand-primary)]">{intent.title || "Feature Name"}</span>
            </p>
          ) : (
            <p className="text-sm text-[var(--color-base-tertiary)]">Select a category in the Preview area</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Preview Area — живий інтерактивний превʼю сторінки Create Page (на дизайн-системі)

const PreviewDragHandleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
    <path d="M5 3H7V5H5V3ZM9 3H11V5H9V3ZM5 7H7V9H5V7ZM9 7H11V9H9V7ZM5 11H7V13H5V11ZM9 11H11V13H9V11Z" fill="currentColor"/>
  </svg>
);

const PreviewCopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const PreviewDeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.667 4.667H13.333M6.667 7.333V11.333M9.333 7.333V11.333M3.333 4.667L4 12.667C4 13.403 4.597 14 5.333 14H10.667C11.403 14 12 13.403 12 12.667L12.667 4.667M6 4.667V2.667C6 2.299 6.299 2 6.667 2H9.333C9.701 2 10 2.299 10 2.667V4.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PreviewChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface PreviewAccordionItem {
  id: string;
  name: string;
  expanded: boolean;
}

function Step1PreviewArea({ intent, updateIntent, activeTab }: { intent: WizardIntent; updateIntent: (updates: Partial<WizardIntent>) => void; activeTab: "sections" | "properties" }) {
  const config = intent.createPageConfig;
  const section = config.sections[0];
  const sectionConfig = section?.config as Record<string, unknown> | undefined;
  const sectionItems = migrateSectionItems(sectionConfig);
  const actions = (sectionConfig?.actions ?? []) as string[];
  const enableReorder = (sectionConfig?.enableReorder as boolean | undefined) !== false;
  const featureName = intent.title || "Auction";

  const [items, setItems] = useState<PreviewAccordionItem[]>([
    { id: "preview-1", name: "Section name", expanded: true },
  ]);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [draggingAccordionIdx, setDraggingAccordionIdx] = useState<number | null>(null);
  const [dropInsertIdx, setDropInsertIdx] = useState<number | null>(null);
  const [rowJoinTarget, setRowJoinTarget] = useState<string | null>(null);
  const [hReorderTarget, setHReorderTarget] = useState<{ fieldId: string; side: "left" | "right" } | null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const dropContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Details panel drag-and-drop
  const [detailsDropIdx, setDetailsDropIdx] = useState<number | null>(null);
  const [detailsDraggingIdx, setDetailsDraggingIdx] = useState<number | null>(null);
  const [detailsMenuId, setDetailsMenuId] = useState<string | null>(null);
  const [detailsMenuPos, setDetailsMenuPos] = useState({ top: 0, left: 0 });
  const detailsItems = migrateDetailsItems(config.propertiesPanel);

  const setDetailsItems = useCallback((next: DetailsItem[]) => {
    updateIntent({
      createPageConfig: {
        ...config,
        propertiesPanel: {
          ...config.propertiesPanel,
          sections: detailsItemsToSections(next),
          detailsItems: next,
        },
      },
    });
  }, [config, updateIntent]);

  const handleDetailsContainerDragOver = useCallback((e: React.DragEvent) => {
    const hasPalette = e.dataTransfer.types.includes("details-palette-component");
    const hasReorder = e.dataTransfer.types.includes("details-reorder");
    if (!hasPalette && !hasReorder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = hasPalette ? "copy" : "move";

    const container = e.currentTarget as HTMLElement;
    const children = Array.from(container.querySelectorAll("[data-details-idx]")) as HTMLElement[];
    if (children.length === 0) { setDetailsDropIdx(0); return; }

    let insertIdx = children.length;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) { insertIdx = i; break; }
    }

    if (hasReorder && detailsDraggingIdx !== null) {
      if (insertIdx === detailsDraggingIdx || insertIdx === detailsDraggingIdx + 1) {
        setDetailsDropIdx(null);
        return;
      }
    }

    setDetailsDropIdx(insertIdx);
  }, [detailsDraggingIdx]);

  const handleDetailsContainerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const idx = detailsDropIdx;
    setDetailsDropIdx(null);
    setDetailsDraggingIdx(null);
    if (idx === null) return;

    const paletteData = e.dataTransfer.getData("details-palette-component");
    if (paletteData) {
      const { type, label } = JSON.parse(paletteData);
      let newItem: DetailsItem;
      if (type === "action") {
        newItem = { id: uid("action"), kind: "action", label };
      } else if (type === "section") {
        newItem = { id: uid("section"), kind: "section", title: label };
      } else {
        newItem = { id: uid("field"), kind: "field", label, type };
      }
      const next = [...detailsItems];
      next.splice(idx, 0, newItem);
      setDetailsItems(next);
      return;
    }

    const reorderData = e.dataTransfer.getData("details-reorder");
    if (reorderData) {
      const fromIdx = Number(reorderData);
      if (!isNaN(fromIdx) && fromIdx !== idx) {
        const next = [...detailsItems];
        const [removed] = next.splice(fromIdx, 1);
        const adjustedIdx = idx > fromIdx ? idx - 1 : idx;
        next.splice(adjustedIdx, 0, removed);
        setDetailsItems(next);
      }
    }
  }, [detailsDropIdx, detailsItems, setDetailsItems]);

  const removeDetailsItem = useCallback((itemId: string) => {
    setDetailsItems(detailsItems.filter(i => i.id !== itemId));
  }, [detailsItems, setDetailsItems]);

  const updateDetailsItem = useCallback((itemId: string, updates: Record<string, unknown>) => {
    setDetailsItems(detailsItems.map(i => (i.id === itemId ? { ...i, ...updates } : i)));
  }, [detailsItems, setDetailsItems]);
  const autoScrollRef = React.useRef<number | null>(null);

  const autoScrollSpeedRef = React.useRef(0);

  const startAutoScroll = useCallback((clientY: number) => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const rect = el.getBoundingClientRect();
    const edgeZone = 60;
    const topDist = clientY - rect.top;
    const bottomDist = rect.bottom - clientY;

    let speed = 0;
    if (topDist < edgeZone) {
      speed = -Math.max(2, (edgeZone - topDist) / 3);
    } else if (bottomDist < edgeZone) {
      speed = Math.max(2, (edgeZone - bottomDist) / 3);
    }

    autoScrollSpeedRef.current = speed;

    if (speed === 0) {
      if (autoScrollRef.current) { cancelAnimationFrame(autoScrollRef.current); autoScrollRef.current = null; }
      return;
    }
    if (autoScrollRef.current) return;

    const tick = () => {
      if (!scrollContainerRef.current || autoScrollSpeedRef.current === 0) {
        autoScrollRef.current = null;
        return;
      }
      scrollContainerRef.current.scrollTop += autoScrollSpeedRef.current;
      autoScrollRef.current = requestAnimationFrame(tick);
    };
    autoScrollRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) { cancelAnimationFrame(autoScrollRef.current); autoScrollRef.current = null; }
  }, []);
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    const onScroll = () => close();
    const scrollEl = scrollContainerRef.current;
    if (scrollEl) scrollEl.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      if (scrollEl) scrollEl.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [openMenuId]);

  const rows = groupByRows(sectionItems);

  const calcDropIndex = useCallback((clientY: number): number => {
    if (!dropContainerRef.current) return -1;
    const rowEls = dropContainerRef.current.querySelectorAll<HTMLElement>("[data-row-idx]");
    if (rowEls.length === 0) return 0;

    const zone = 24;

    const firstRect = rowEls[0].getBoundingClientRect();
    if (clientY < firstRect.top + zone) return 0;

    for (let i = 0; i < rowEls.length - 1; i++) {
      const bottomEdge = rowEls[i].getBoundingClientRect().bottom;
      const topEdge = rowEls[i + 1].getBoundingClientRect().top;
      const boundary = (bottomEdge + topEdge) / 2;
      if (clientY > boundary - zone && clientY < boundary + zone) return i + 1;
    }

    const lastRect = rowEls[rowEls.length - 1].getBoundingClientRect();
    if (clientY > lastRect.bottom - zone) return rowEls.length;

    return -1;
  }, [rows.length]);

  React.useEffect(() => {
    const clear = () => { setDropInsertIdx(null); setRowJoinTarget(null); setHReorderTarget(null); setDraggingFieldId(null); stopAutoScroll(); };
    document.addEventListener("dragend", clear);
    document.addEventListener("drop", clear);
    return () => { document.removeEventListener("dragend", clear); document.removeEventListener("drop", clear); };
  }, [stopAutoScroll]);

  const setSectionItems = useCallback((next: SectionItem[]) => {
    if (!section) return;
    updateIntent({
      createPageConfig: {
        ...config,
        sections: [{ ...section, config: { ...sectionConfig, items: next, fields: undefined, customActions: undefined } }],
      },
    });
  }, [section, config, sectionConfig, updateIntent]);

  const addFieldFromPalette = useCallback((type: string, label: string, atIndex?: number, joinRowId?: string) => {
    const kind = type === "action" ? "action" as const : "field" as const;
    const newId = uid(kind);
    const rowHasAction = joinRowId ? sectionItems.some(i => i.rowId === joinRowId && i.kind === "action") : false;
    const rowHasTextarea = joinRowId ? sectionItems.some(i => i.rowId === joinRowId && i.kind === "field" && i.type === "textarea") : false;
    const effectiveJoinRowId = (kind === "action" || rowHasAction || type === "textarea" || rowHasTextarea) ? undefined : joinRowId;
    const rowId = effectiveJoinRowId || newId;
    const newItem: SectionItem = kind === "action"
      ? { id: newId, kind: "action", label, rowId }
      : { id: newId, kind: "field", label, type, rowId };

    if (effectiveJoinRowId) {
      const rowCount = sectionItems.filter(i => i.rowId === effectiveJoinRowId).length;
      if (rowCount >= 3) return;
      const lastIdx = sectionItems.findLastIndex(i => i.rowId === effectiveJoinRowId);
      if (lastIdx !== -1) {
        const next = [...sectionItems];
        next.splice(lastIdx + 1, 0, newItem);
        setSectionItems(next);
        return;
      }
    }

    const next = [...sectionItems];
    if (atIndex !== undefined && atIndex >= 0) {
      next.splice(atIndex, 0, newItem);
    } else {
      next.push(newItem);
    }
    setSectionItems(next);
  }, [sectionItems, setSectionItems]);

  const removeField = useCallback((fieldId: string) => {
    setSectionItems(sectionItems.filter(i => i.id !== fieldId));
  }, [sectionItems, setSectionItems]);

  const splitFromRow = useCallback((fieldId: string) => {
    setSectionItems(sectionItems.map(i => i.id === fieldId ? { ...i, rowId: i.id } : i));
  }, [sectionItems, setSectionItems]);

  const updateField = useCallback((fieldId: string, updates: Partial<SectionItem>) => {
    setSectionItems(sectionItems.map(i => i.id === fieldId ? { ...i, ...updates } as SectionItem : i));
  }, [sectionItems, setSectionItems]);

  const reorderFields = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...sectionItems];
    const [removed] = next.splice(fromIndex, 1);
    const movedItem = { ...removed, rowId: uid("row") };
    const adjustedTo = fromIndex < toIndex ? toIndex - 1 : toIndex;
    next.splice(adjustedTo, 0, movedItem);
    setSectionItems(next);
  }, [sectionItems, setSectionItems]);

  const moveFieldToRow = useCallback((dragFieldId: string, targetRowId: string) => {
    const next = [...sectionItems];
    const fromIdx = next.findIndex(i => i.id === dragFieldId);
    if (fromIdx === -1) return;
    const dragItem = next[fromIdx];
    if (dragItem.rowId === targetRowId) return;
    if (dragItem.kind === "action") return;
    if (dragItem.kind === "field" && dragItem.type === "textarea") return;
    if (next.some(i => i.rowId === targetRowId && i.kind === "action")) return;
    if (next.some(i => i.rowId === targetRowId && i.kind === "field" && i.type === "textarea")) return;
    if (next.filter(i => i.rowId === targetRowId).length >= 3) return;
    next.splice(fromIdx, 1);
    const lastInRow = next.findLastIndex(i => i.rowId === targetRowId);
    next.splice(lastInRow + 1, 0, { ...dragItem, rowId: targetRowId });
    setSectionItems(next);
  }, [sectionItems, setSectionItems]);

  const reorderWithinRow = useCallback((dragFieldId: string, targetFieldId: string, side: "left" | "right") => {
    if (dragFieldId === targetFieldId) return;
    const next = [...sectionItems];
    const fromIdx = next.findIndex(i => i.id === dragFieldId);
    if (fromIdx === -1) return;
    const dragItem = next[fromIdx];
    const targetItem = next.find(i => i.id === targetFieldId);
    if (!targetItem || dragItem.rowId !== targetItem.rowId) return;
    next.splice(fromIdx, 1);
    const targetIdx = next.findIndex(i => i.id === targetFieldId);
    const insertIdx = side === "left" ? targetIdx : targetIdx + 1;
    next.splice(insertIdx, 0, dragItem);
    setSectionItems(next);
  }, [sectionItems, setSectionItems]);

  const addItem = () => {
    setItems(prev => [...prev, { id: uid("preview"), name: "Section name", expanded: true }]);
  };

  const expandAll = () => setItems(prev => prev.map(i => ({ ...i, expanded: true })));
  const collapseAll = () => setItems(prev => prev.map(i => ({ ...i, expanded: false })));

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, expanded: !i.expanded } : i));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const duplicateItem = (id: string) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const src = prev[idx];
      const copy = { ...src, id: uid("preview"), name: src.name };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ index: idx }));
    e.dataTransfer.setData("accordion-reorder", "1");
    e.dataTransfer.effectAllowed = "move";
    setDraggingAccordionIdx(idx);

    const row = (e.target as HTMLElement).closest("[data-accordion-idx]") as HTMLElement | null;
    if (row) {
      const clone = row.cloneNode(true) as HTMLElement;
      clone.style.width = `${row.offsetWidth}px`;
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.opacity = "0.9";
      clone.style.borderRadius = "8px";
      clone.style.overflow = "hidden";
      clone.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
      document.body.appendChild(clone);
      const handleRect = (e.target as HTMLElement).closest(".cursor-grab")?.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const offsetX = handleRect ? handleRect.left - rowRect.left + handleRect.width / 2 : e.clientX - rowRect.left;
      const offsetY = handleRect ? handleRect.top - rowRect.top + handleRect.height / 2 : e.clientY - rowRect.top;
      e.dataTransfer.setDragImage(clone, offsetX, offsetY);
      requestAnimationFrame(() => document.body.removeChild(clone));
    }
  };

  const handleAccordionContainerDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("accordion-reorder")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const container = e.currentTarget as HTMLElement;
    const accordionEls = Array.from(container.querySelectorAll("[data-accordion-idx]")) as HTMLElement[];
    const y = e.clientY;
    let insertIdx = accordionEls.length;
    for (let i = 0; i < accordionEls.length; i++) {
      const rect = accordionEls[i].getBoundingClientRect();
      if (y < rect.top + rect.height / 2) { insertIdx = i; break; }
    }
    if (draggingAccordionIdx !== null && (insertIdx === draggingAccordionIdx || insertIdx === draggingAccordionIdx + 1)) {
      setDragOverIdx(null);
    } else {
      setDragOverIdx(insertIdx);
    }
  };

  const handleAccordionContainerDrop = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("accordion-reorder")) return;
    e.preventDefault();
    const insertAt = dragOverIdx;
    setDragOverIdx(null);
    setDraggingAccordionIdx(null);
    if (insertAt === null) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json")) as { index: number };
      const fromIdx = data.index;
      if (fromIdx === insertAt || fromIdx + 1 === insertAt) return;
      setItems(prev => {
        const next = [...prev];
        const [removed] = next.splice(fromIdx, 1);
        const adjustedTo = fromIdx < insertAt ? insertAt - 1 : insertAt;
        next.splice(adjustedTo, 0, removed);
        return next;
      });
    } catch { /* ignore */ }
  };

  return (
    <div className="h-full flex flex-col overflow-visible">
      <p className="text-lg font-medium text-[var(--color-base-primary)] px-0 pt-4 mb-10 shrink-0">
        Preview
      </p>

      <div
        className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl mr-[-465px]"
        style={{ minHeight: 200 }}
      >
        {/* Page header: Create {featureName} + Save buttons */}
        <div className="h-12 flex items-center justify-between shrink-0">
          <span className="text-headline-1 text-[var(--color-base-primary)]">
            Create {featureName}
          </span>
          <div className="flex items-center gap-2 opacity-50" style={{ marginRight: "calc(465px - 80px)" }}>
            {config.saveChanges && (
              <Button variant="secondary">Save Changes</Button>
            )}
            {config.saveAndClose && (
              <Button variant="primary">
                Save &amp; Close
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1.5">
                  <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-h-0 overflow-hidden relative mt-2">
          <div
            className="h-full w-full flex gap-6 transition-transform duration-300 ease-in-out"
            style={{
              transform: activeTab === "properties" ? "translateX(-278px)" : "translateX(0)",
            }}
          >
          {/* Main Section */}
          <div
            className="shrink-0 flex flex-col transition-opacity duration-300 ease-in-out"
            style={{
              width: "calc(100% - 555px)",
              opacity: activeTab === "sections" ? 1 : 0.3,
              pointerEvents: activeTab === "sections" ? "auto" : "none",
            }}
          >
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto pl-0 pt-0 pb-4 pr-0 hide-scrollbar rounded-xl"
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("palette-component") || e.dataTransfer.types.includes("field-reorder")) {
                  startAutoScroll(e.clientY);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) stopAutoScroll();
              }}
            >
              {/* Toolbar */}
              {config.showToolbar && (
                <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-xl bg-[var(--color-base-surface-primary)]">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={addItem} leftIcon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}>
                      <span>Add</span>
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={expandAll}>Expand All</Button>
                    <Button variant="secondary" onClick={collapseAll}>Collapse All</Button>
                  </div>
                </div>
              )}

              {/* Accordion items */}
              <div
                className="space-y-0"
                onDragOver={enableReorder ? handleAccordionContainerDragOver : undefined}
                onDrop={enableReorder ? handleAccordionContainerDrop : undefined}
                onDragLeave={enableReorder ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { setDragOverIdx(null); } } : undefined}
              >
                {items.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {/* Drop indicator ABOVE this accordion */}
                    <div className={`transition-all duration-200 ease-in-out overflow-hidden mx-0 ${
                      dragOverIdx === idx
                        ? "h-1.5 my-1"
                        : "h-0 my-0"
                    }`}>
                      <div className={`h-full rounded-full transition-all duration-200 ${
                        dragOverIdx === idx
                          ? "bg-[var(--color-brand-primary)]"
                          : "bg-transparent"
                      }`} />
                    </div>
                  <div
                    data-accordion-idx={idx}
                    className={`border border-[var(--color-base-stroke)] rounded-lg overflow-hidden bg-[var(--color-base-surface-primary)] transition-all duration-200 ease-in-out ${
                      draggingAccordionIdx === idx ? "opacity-30 scale-[0.97]" : "opacity-100 scale-100"
                    } ${idx > 0 && dragOverIdx !== idx ? "mt-2" : ""}`}
                  >
                    {/* Accordion header */}
                    <div className="flex items-center gap-2 px-3 h-12 bg-[var(--color-base-surface-secondary)] border-b border-[var(--color-base-stroke)]">
                      {enableReorder && (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragEnd={() => { setDragOverIdx(null); setDraggingAccordionIdx(null); }}
                          className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)]"
                        >
                          <PreviewDragHandleIcon />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Input
                          value={item.name}
                          onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))}
                          className="w-full !border-0 !bg-transparent !shadow-none !ring-0 font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <ButtonGroup>
                          {actions.includes("copy") && (
                            <ButtonGroupItem
                              icon={<PreviewCopyIcon />}
                              aria-label="Duplicate"
                              onClick={() => duplicateItem(item.id)}
                            />
                          )}
                          {actions.includes("delete") && (
                            <ButtonGroupItem
                              icon={<PreviewDeleteIcon />}
                              aria-label="Delete"
                              onClick={() => deleteItem(item.id)}
                              className="hover:!border-[var(--color-danger-100)] [&>span]:text-[var(--color-danger-100)]"
                            />
                          )}
                        </ButtonGroup>
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          className="p-1 rounded text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] transition-colors"
                        >
                          <PreviewChevronIcon expanded={item.expanded} />
                        </button>
                      </div>
                    </div>
                    {/* Accordion body — drop zone for palette + reorderable fields */}
                    {item.expanded && (
                      <div
                        ref={dropContainerRef}
                        className="px-1 py-1 min-h-[60px] flex flex-col"
                        onDragOver={(e) => {
                          const isPalette = e.dataTransfer.types.includes("palette-component");
                          const isReorder = e.dataTransfer.types.includes("field-reorder");
                          if (!isPalette && !isReorder) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = isPalette ? "copy" : "move";
                          let idx = calcDropIndex(e.clientY);
                          if (draggingFieldId) {
                            const dragRowIdx = rows.findIndex(r => r.items.some(i => i.id === draggingFieldId));
                            if (dragRowIdx !== -1) {
                              const isSingleItemRow = rows[dragRowIdx].items.length === 1;
                              if (idx === dragRowIdx || (isSingleItemRow && idx === dragRowIdx + 1)) {
                                idx = -1;
                              }
                            }
                          }
                          setDropInsertIdx(idx === -1 ? null : idx);
                          startAutoScroll(e.clientY);
                        }}
                        onDragEnd={() => { setDropInsertIdx(null); setRowJoinTarget(null); setHReorderTarget(null); stopAutoScroll(); }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setDropInsertIdx(null);
                            setRowJoinTarget(null);
                            stopAutoScroll();
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          stopAutoScroll();
                          const insertAt = dropInsertIdx;
                          setDropInsertIdx(null);
                          setRowJoinTarget(null);
                          const targetGlobalIdx = insertAt !== null && insertAt < rows.length
                            ? sectionItems.findIndex(i => i.id === rows[insertAt].items[0].id)
                            : sectionItems.length;
                          const reorderData = e.dataTransfer.getData("field-reorder");
                          if (reorderData) {
                            if (insertAt === null) return;
                            const fromIdx = Number(reorderData);
                            if (!isNaN(fromIdx)) reorderFields(fromIdx, targetGlobalIdx);
                            return;
                          }
                          const paletteData = e.dataTransfer.getData("palette-component");
                          if (paletteData) {
                            try {
                              const { type, label } = JSON.parse(paletteData) as { type: string; label: string };
                              addFieldFromPalette(type, label, targetGlobalIdx);
                            } catch { /* ignore */ }
                          }
                        }}
                      >
                        {rows.map((rowGroup, rowIdx) => {
                          const isMulti = rowGroup.items.length > 1;
                          return (
                            <React.Fragment key={`${rowGroup.rowId}-${rowIdx}`}>
                              {/* Drop indicator gap ABOVE this row */}
                              <div className={`rounded-lg transition-all duration-200 ease-in-out overflow-hidden ${
                                dropInsertIdx === rowIdx
                                  ? "h-10 border-2 border-dashed border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 opacity-100"
                                  : "h-0 border-0 opacity-0"
                              }`} />
                            <div
                              data-row-idx={rowIdx}
                              className="transition-transform duration-200 ease-in-out"
                            >
                              <div className={`flex ${isMulti ? "items-stretch" : ""}`}>
                                {rowGroup.items.map((si) => (
                                  <div
                                    key={si.id}
                                    data-field-id={si.id}
                                    className={`group relative flex items-start gap-1.5 rounded-lg px-2 py-2 transition-all duration-200 flex-1 min-w-0 ${
                                      draggingFieldId === si.id
                                        ? "opacity-30 scale-[0.97]"
                                        : "hover:bg-[var(--color-base-surface-secondary)]"
                                    }`}
                                    onDragOver={(e) => {
                                      const isPalette = e.dataTransfer.types.includes("palette-component");
                                      const isReorder = e.dataTransfer.types.includes("field-reorder");

                                      if (isReorder && isMulti && draggingFieldId && draggingFieldId !== si.id) {
                                        const draggedItem = sectionItems.find(i => i.id === draggingFieldId);
                                        if (draggedItem && draggedItem.rowId === si.rowId) {
                                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                          const x = e.clientX - rect.left;
                                          const side: "left" | "right" = x < rect.width / 2 ? "left" : "right";
                                          const rowItems = rowGroup.items;
                                          const dragIdx = rowItems.findIndex(i => i.id === draggingFieldId);
                                          const targetIdx = rowItems.findIndex(i => i.id === si.id);
                                          if ((side === "right" && targetIdx === dragIdx - 1) ||
                                              (side === "left" && targetIdx === dragIdx + 1)) {
                                            setHReorderTarget(null);
                                            return;
                                          }
                                          e.preventDefault();
                                          e.stopPropagation();
                                          e.dataTransfer.dropEffect = "move";
                                          setHReorderTarget({ fieldId: si.id, side });
                                          setDropInsertIdx(null);
                                          setRowJoinTarget(null);
                                          return;
                                        }
                                      }

                                      if (isPalette || isReorder) {
                                        if (isPalette && e.dataTransfer.types.includes("palette-is-action")) return;
                                        if (isPalette && e.dataTransfer.types.includes("palette-is-textarea")) return;
                                        if (isReorder && draggingFieldId) {
                                          const draggedItem = sectionItems.find(i => i.id === draggingFieldId);
                                          if (!draggedItem || draggedItem.kind === "action") return;
                                          if (draggedItem.kind === "field" && draggedItem.type === "textarea") return;
                                          if (draggedItem.rowId === si.rowId) return;
                                        }
                                        if (rowGroup.items.length >= 3) return;
                                        if (rowGroup.items.some(i => i.kind === "action")) return;
                                        if (rowGroup.items.some(i => i.kind === "field" && i.type === "textarea")) return;
                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        if (x > rect.width * 0.7) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          e.dataTransfer.dropEffect = isPalette ? "copy" : "move";
                                          setRowJoinTarget(si.id);
                                          setHReorderTarget(null);
                                          setDropInsertIdx(null);
                                        }
                                        return;
                                      }
                                    }}
                                    onDragLeave={(e) => {
                                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                        if (hReorderTarget?.fieldId === si.id) setHReorderTarget(null);
                                      }
                                    }}
                                    onDrop={(e) => {
                                      if (draggingFieldId && draggingFieldId !== si.id && isMulti) {
                                        const draggedItem = sectionItems.find(i => i.id === draggingFieldId);
                                        if (draggedItem && draggedItem.rowId === si.rowId) {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const side = hReorderTarget?.fieldId === si.id ? hReorderTarget.side : "right";
                                          reorderWithinRow(draggingFieldId, si.id, side);
                                          setHReorderTarget(null);
                                          setDraggingFieldId(null);
                                          return;
                                        }
                                      }
                                      if (rowJoinTarget !== si.id) return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setRowJoinTarget(null);
                                      setHReorderTarget(null);
                                      setDropInsertIdx(null);
                                      const reorderData = e.dataTransfer.getData("field-reorder");
                                      if (reorderData && draggingFieldId) {
                                        moveFieldToRow(draggingFieldId, si.rowId);
                                        setDraggingFieldId(null);
                                        return;
                                      }
                                      const paletteData = e.dataTransfer.getData("palette-component");
                                      if (paletteData) {
                                        try {
                                          const { type, label } = JSON.parse(paletteData) as { type: string; label: string };
                                          addFieldFromPalette(type, label, undefined, si.rowId);
                                        } catch { /* ignore */ }
                                      }
                                    }}
                                  >
                                    {/* Drag handle */}
                                    <div
                                      draggable
                                      onDragStart={(e) => {
                                        const idx = sectionItems.findIndex(i => i.id === si.id);
                                        e.dataTransfer.setData("field-reorder", String(idx));
                                        e.dataTransfer.effectAllowed = "move";
                                        setDraggingFieldId(si.id);
                                        const handleEl = e.currentTarget as HTMLElement;
                                        const fieldEl = handleEl.closest("[data-field-id]") as HTMLElement | null;
                                        if (fieldEl) {
                                          const handleRect = handleEl.getBoundingClientRect();
                                          const fieldRect = fieldEl.getBoundingClientRect();
                                          const offsetX = (handleRect.left + handleRect.width / 2) - fieldRect.left;
                                          const offsetY = (handleRect.top + handleRect.height / 2) - fieldRect.top;
                                          const clone = fieldEl.cloneNode(true) as HTMLElement;
                                          clone.style.width = `${fieldEl.offsetWidth}px`;
                                          clone.style.position = "absolute";
                                          clone.style.top = "-9999px";
                                          clone.style.left = "-9999px";
                                          clone.style.opacity = "0.85";
                                          clone.style.borderRadius = "8px";
                                          clone.style.background = "var(--color-base-surface-primary)";
                                          clone.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                                          document.body.appendChild(clone);
                                          e.dataTransfer.setDragImage(clone, offsetX, offsetY);
                                          requestAnimationFrame(() => clone.remove());
                                        }
                                      }}
                                      onDragEnd={() => { setDropInsertIdx(null); setRowJoinTarget(null); setHReorderTarget(null); setDraggingFieldId(null); }}
                                      className="shrink-0 mt-2.5 cursor-grab active:cursor-grabbing touch-none text-[var(--color-base-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <PreviewDragHandleIcon />
                                    </div>

                                    {/* Field content */}
                                    <div className="flex-1 min-w-0">
                                      {si.kind === "action" ? (
                                        <div className="pt-1 flex items-center gap-2">
                                          <Button variant="secondary" leftIcon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}>{si.label}</Button>
                                          <button
                                            type="button"
                                            onClick={() => removeField(si.id)}
                                            className="shrink-0 p-1 rounded-md text-[var(--color-base-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10 transition-all"
                                            title="Delete"
                                          >
                                            <PreviewDeleteIcon />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="relative flex items-center mb-1.5">
                                            <div className="flex items-center min-w-0 overflow-hidden">
                                              <div className="flex items-center shrink min-w-0">
                                                <input
                                                  type="text"
                                                  value={si.label}
                                                  onChange={(e) => updateField(si.id, { label: e.target.value })}
                                                  className="text-label-normal text-[var(--color-base-primary)] bg-transparent border-0 border-b border-transparent hover:border-[var(--color-base-stroke)] focus:border-[var(--color-brand-primary)] outline-none transition-colors px-0 py-0 min-w-[3ch]"
                                                  size={Math.max(si.label.length || 1, 1)}
                                                  placeholder="Field name"
                                                />
                                                {si.required && <span className="text-[var(--color-status-error)] ml-0.5 shrink-0 leading-none">*</span>}
                                              </div>
                                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 ml-2 text-[var(--color-base-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                                <path d="M8.5 1.5L10.5 3.5M1 11L1.5 8.5L9.5 0.5L11.5 2.5L3.5 10.5L1 11Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            </div>
                                            <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity bg-gradient-to-l from-[var(--color-base-surface-secondary)] from-60% to-transparent pl-5">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  if (openMenuId === si.id) { setOpenMenuId(null); return; }
                                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                  setMenuPos({ top: rect.bottom + 4, left: rect.right - 224 });
                                                  setOpenMenuId(si.id);
                                                }}
                                                className="shrink-0 p-1 rounded-md text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-all"
                                              >
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-90">
                                                  <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                                                  <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                                                  <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                          {si.type === "textarea" ? (
                                            <textarea
                                              disabled={si.readOnly}
                                              placeholder={`Enter ${si.label}...`}
                                              rows={isMulti ? 1 : 3}
                                              className="w-full px-3 py-2 text-sm border border-[var(--color-base-stroke)] rounded-lg bg-[var(--color-base-surface-primary)] text-[var(--color-base-primary)] disabled:opacity-50 resize-none"
                                            />
                                          ) : si.type === "select" || si.type === "multi-select" ? (
                                            <Select
                                              readOnly={!si.readOnly}
                                              disabled={si.readOnly}
                                              placeholder={`Select ${si.label}...`}
                                              options={[{ label: "Option 1", value: "1" }, { label: "Option 2", value: "2" }, { label: "Option 3", value: "3" }]}
                                              multiple={si.type === "multi-select"}
                                            />
                                          ) : si.type === "date-time" ? (
                                            <Input disabled={si.readOnly} placeholder="Select Date and Time" rightIcon={
                                              si.copyable ? <PreviewCopyIcon /> :
                                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
                                                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                                                <path d="M2 7H14M5 1V4M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                              </svg>
                                            } />
                                          ) : si.type === "number" ? (
                                            <Input disabled={si.readOnly} type="number" placeholder="0" rightIcon={si.copyable ? <PreviewCopyIcon /> : undefined} />
                                          ) : (
                                            <Input disabled={si.readOnly} placeholder={`Enter ${si.label}...`} rightIcon={si.copyable ? <PreviewCopyIcon /> : undefined} />
                                          )}
                                        </>
                                      )}
                                    </div>

                                    {/* More menu dropdown (portal) */}
                                    {si.kind === "field" && openMenuId === si.id && createPortal(
                                      <>
                                        <div className="fixed inset-0 z-[10000]" onMouseDown={() => setOpenMenuId(null)} />
                                        <div
                                          className="fixed z-[10001] w-56 rounded-xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] shadow-lg py-1"
                                          style={{ top: menuPos.top, left: menuPos.left }}
                                        >
                                          <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--color-base-surface-secondary)] cursor-pointer transition-colors">
                                            <Checkbox
                                              checked={si.required || false}
                                              onCheckedChange={() => { updateField(si.id, { required: !si.required }); }}
                                            />
                                            <span className="text-sm text-[var(--color-base-primary)]">Required</span>
                                          </label>
                                          <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--color-base-surface-secondary)] cursor-pointer transition-colors">
                                            <Checkbox
                                              checked={si.readOnly === true}
                                              onCheckedChange={() => { updateField(si.id, { readOnly: !si.readOnly }); }}
                                            />
                                            <span className="text-sm text-[var(--color-base-primary)]">Read-only</span>
                                          </label>
                                          <label className={`flex items-center gap-2.5 px-3 py-2 transition-colors ${si.type === "input" ? "hover:bg-[var(--color-base-surface-secondary)] cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
                                            <Checkbox
                                              checked={si.copyable || false}
                                              disabled={si.type !== "input"}
                                              onCheckedChange={() => { if (si.type === "input") updateField(si.id, { copyable: !si.copyable }); }}
                                            />
                                            <span className="text-sm text-[var(--color-base-primary)]">Copy to clipboard</span>
                                          </label>
                                          {isMulti && (
                                            <>
                                              <div className="h-px bg-[var(--color-base-stroke)] my-1" />
                                              <button
                                                type="button"
                                                onClick={() => { splitFromRow(si.id); setOpenMenuId(null); }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--color-base-surface-secondary)] transition-colors text-left"
                                              >
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                  <path d="M8 2V14M3 5L5 2L7 5M9 11L11 14L13 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <span className="text-sm text-[var(--color-base-primary)]">Move to own row</span>
                                              </button>
                                            </>
                                          )}
                                          <div className="h-px bg-[var(--color-base-stroke)] my-1" />
                                          <button
                                            type="button"
                                            onClick={() => { removeField(si.id); setOpenMenuId(null); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--color-status-error)]/10 transition-colors text-left"
                                          >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                              <path d="M2.667 4.667H13.333M6.667 7.333V11.333M9.333 7.333V11.333M3.333 4.667L4 12.667C4 13.403 4.597 14 5.333 14H10.667C11.403 14 12 13.403 12 12.667L12.667 4.667M6 4.667V2.667C6 2.299 6.299 2 6.667 2H9.333C9.701 2 10 2.299 10 2.667V4.667" stroke="var(--color-status-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span className="text-sm text-[var(--color-status-error)]">Delete</span>
                                          </button>
                                        </div>
                                      </>,
                                      document.body
                                    )}

                                    {/* Right-edge join indicator (palette) */}
                                    {rowJoinTarget === si.id && (
                                      <div className="absolute right-0 top-1 bottom-1 w-1 rounded-full bg-[var(--color-brand-primary)]" />
                                    )}
                                    {/* Horizontal reorder indicators */}
                                    {hReorderTarget?.fieldId === si.id && hReorderTarget.side === "left" && (
                                      <div className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-[var(--color-brand-primary)]" />
                                    )}
                                    {hReorderTarget?.fieldId === si.id && hReorderTarget.side === "right" && (
                                      <div className="absolute right-0 top-1 bottom-1 w-1 rounded-full bg-[var(--color-brand-primary)]" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Drop indicator gap AFTER last row */}
                            {rowIdx === rows.length - 1 && (
                              <div className={`rounded-lg transition-all duration-200 ease-in-out overflow-hidden ${
                                dropInsertIdx === rows.length
                                  ? "h-10 border-2 border-dashed border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 opacity-100"
                                  : "h-0 border-0 opacity-0"
                              }`} />
                            )}
                            </React.Fragment>
                          );
                        })}

                        {sectionItems.length === 0 && (
                          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-base-stroke)] py-6 pointer-events-none">
                            <p className="text-sm text-[var(--color-base-tertiary)]">Drag components from the panel</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  </React.Fragment>
                ))}
                {/* Drop indicator AFTER last accordion */}
                <div className={`transition-all duration-200 ease-in-out overflow-hidden mx-0 ${
                  dragOverIdx === items.length
                    ? "h-1.5 mt-1"
                    : "h-0 mt-0"
                }`}>
                  <div className={`h-full rounded-full transition-all duration-200 ${
                    dragOverIdx === items.length
                      ? "bg-[var(--color-brand-primary)]"
                      : "bg-transparent"
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Details panel — під Right Panel */}
          <div
            className="w-[330px] min-w-[330px] shrink-0 rounded-2xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] flex flex-col transition-opacity duration-300 ease-in-out overflow-hidden"
            style={{
              opacity: activeTab === "properties" ? 1 : 0.4,
              pointerEvents: activeTab === "properties" ? "auto" : "none",
            }}
          >
            {/* Status header — 48px */}
            {config.propertiesPanel.statusToggle && (
              <div className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-[var(--color-base-stroke)]">
                <span className="text-sm font-medium text-[var(--color-base-primary)]">
                  {config.propertiesPanel.statusLabel || "Status"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-base-tertiary)]">Live</span>
                  <Toggle checked={false} onChange={() => {}} />
                </div>
              </div>
            )}

            {/* Scrollable content with drag-and-drop */}
            <div
              className="flex-1 overflow-y-auto p-2 space-y-0 hide-scrollbar"
              onDragOver={handleDetailsContainerDragOver}
              onDragLeave={() => setDetailsDropIdx(null)}
              onDrop={handleDetailsContainerDrop}
            >
              {detailsItems.length === 0 && detailsDropIdx === null && (
                <div className="flex items-center justify-center py-10 text-sm text-[var(--color-base-tertiary)]">
                  Drag components here
                </div>
              )}
              {detailsItems.map((si, idx) => (
                <React.Fragment key={si.id}>
                  {/* Drop indicator */}
                  <div className={`rounded-lg transition-all duration-200 ease-in-out overflow-hidden ${
                    detailsDropIdx === idx
                      ? "h-10 border-2 border-dashed border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 opacity-100"
                      : "h-0 border-0 opacity-0"
                  }`} />

                  <div
                    data-details-idx={idx}
                    className={`group relative flex items-start gap-1.5 rounded-lg px-2 py-2 transition-all duration-200 ${
                      detailsDraggingIdx === idx
                        ? "opacity-30 scale-[0.97]"
                        : "hover:bg-[var(--color-base-surface-secondary)]"
                    }`}
                  >
                    {/* Drag handle */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("details-reorder", String(idx));
                        e.dataTransfer.effectAllowed = "move";
                        setDetailsDraggingIdx(idx);
                        const fieldEl = e.currentTarget.parentElement as HTMLElement;
                        const handleRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const fieldRect = fieldEl.getBoundingClientRect();
                        const offsetX = (handleRect.left + handleRect.width / 2) - fieldRect.left;
                        const offsetY = (handleRect.top + handleRect.height / 2) - fieldRect.top;
                        const clone = fieldEl.cloneNode(true) as HTMLElement;
                        clone.style.width = `${fieldEl.offsetWidth}px`;
                        clone.style.position = "absolute";
                        clone.style.top = "-9999px";
                        clone.style.left = "-9999px";
                        clone.style.opacity = "0.85";
                        clone.style.borderRadius = "8px";
                        clone.style.background = "var(--color-base-surface-primary)";
                        clone.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                        document.body.appendChild(clone);
                        e.dataTransfer.setDragImage(clone, offsetX, offsetY);
                        requestAnimationFrame(() => clone.remove());
                      }}
                      onDragEnd={() => { setDetailsDraggingIdx(null); setDetailsDropIdx(null); }}
                      className="shrink-0 mt-2.5 cursor-grab active:cursor-grabbing touch-none text-[var(--color-base-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <PreviewDragHandleIcon />
                    </div>

                    {/* Field content */}
                    <div className="flex-1 min-w-0">
                      {si.kind === "section" ? (
                        <div className="relative flex items-center mb-1 pt-1">
                          <input
                            type="text"
                            value={si.title}
                            onChange={(e) => updateDetailsItem(si.id, { title: e.target.value })}
                            className="text-sm font-medium text-[var(--color-base-primary)] bg-transparent border-0 border-b border-transparent hover:border-[var(--color-base-stroke)] focus:border-[var(--color-brand-primary)] outline-none transition-colors px-0 py-0 min-w-[3ch]"
                            size={Math.max((si.title || "").length || 1, 1)}
                            placeholder="Section title"
                          />
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 ml-2 text-[var(--color-base-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">
                            <path d="M8.5 1.5L10.5 3.5M1 11L1.5 8.5L9.5 0.5L11.5 2.5L3.5 10.5L1 11Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity bg-gradient-to-l from-[var(--color-base-surface-secondary)] from-60% to-transparent pl-5">
                            <button
                              type="button"
                              onClick={() => { removeDetailsItem(si.id); }}
                              className="shrink-0 p-1 rounded-md text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10 transition-all"
                            >
                              <PreviewDeleteIcon />
                            </button>
                          </div>
                        </div>
                      ) : si.kind === "action" ? (
                        <div className="pt-1 flex items-center gap-2">
                          <Button variant="secondary" leftIcon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}>{si.label}</Button>
                          <button
                            type="button"
                            onClick={() => removeDetailsItem(si.id)}
                            className="shrink-0 p-1 rounded-md text-[var(--color-base-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10 transition-all"
                          >
                            <PreviewDeleteIcon />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative flex items-center mb-1.5">
                            <div className="flex items-center min-w-0 overflow-hidden">
                              <div className="flex items-center shrink min-w-0">
                                <input
                                  type="text"
                                  value={si.label}
                                  onChange={(e) => updateDetailsItem(si.id, { label: e.target.value })}
                                  className="text-label-normal text-[var(--color-base-primary)] bg-transparent border-0 border-b border-transparent hover:border-[var(--color-base-stroke)] focus:border-[var(--color-brand-primary)] outline-none transition-colors px-0 py-0 min-w-[3ch]"
                                  size={Math.max(si.label.length || 1, 1)}
                                  placeholder="Field name"
                                />
                                {si.required && <span className="text-[var(--color-status-error)] ml-0.5 shrink-0 leading-none">*</span>}
                              </div>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 ml-2 text-[var(--color-base-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                <path d="M8.5 1.5L10.5 3.5M1 11L1.5 8.5L9.5 0.5L11.5 2.5L3.5 10.5L1 11Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity bg-gradient-to-l from-[var(--color-base-surface-secondary)] from-60% to-transparent pl-5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  if (detailsMenuId === si.id) { setDetailsMenuId(null); return; }
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setDetailsMenuPos({ top: rect.bottom + 4, left: rect.right - 224 });
                                  setDetailsMenuId(si.id);
                                }}
                                className="shrink-0 p-1 rounded-md text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-all"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-90">
                                  <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                                  <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                                  <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                          {si.type === "textarea" ? (
                            <textarea
                              disabled={si.readOnly}
                              placeholder={`Enter ${si.label}...`}
                              rows={3}
                              className="w-full px-3 py-2 text-sm border border-[var(--color-base-stroke)] rounded-lg bg-[var(--color-base-surface-primary)] text-[var(--color-base-primary)] disabled:opacity-50 resize-none"
                            />
                          ) : si.type === "select" ? (
                            <Select
                              readOnly={!si.readOnly}
                              disabled={si.readOnly}
                              placeholder={`Select ${si.label}...`}
                              options={[{ label: "Option 1", value: "1" }, { label: "Option 2", value: "2" }, { label: "Option 3", value: "3" }]}
                            />
                          ) : si.type === "date-time" ? (
                            <Input disabled={si.readOnly} placeholder="Select Date and Time" rightIcon={
                              si.copyable ? <PreviewCopyIcon /> :
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
                                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M2 7H14M5 1V4M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            } />
                          ) : si.type === "number" ? (
                            <Input disabled={si.readOnly} type="number" placeholder="0" rightIcon={si.copyable ? <PreviewCopyIcon /> : undefined} />
                          ) : (
                            <Input disabled={si.readOnly} placeholder={`Enter ${si.label}...`} rightIcon={si.copyable ? <PreviewCopyIcon /> : undefined} />
                          )}
                        </>
                      )}
                    </div>

                    {/* More menu dropdown (portal) */}
                    {si.kind === "field" && detailsMenuId === si.id && createPortal(
                      <>
                        <div className="fixed inset-0 z-[10000]" onMouseDown={() => setDetailsMenuId(null)} />
                        <div
                          className="fixed z-[10001] w-56 rounded-xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] shadow-lg py-1"
                          style={{ top: detailsMenuPos.top, left: detailsMenuPos.left }}
                        >
                          <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--color-base-surface-secondary)] cursor-pointer transition-colors">
                            <Checkbox
                              checked={si.required || false}
                              onCheckedChange={() => { updateDetailsItem(si.id, { required: !si.required }); }}
                            />
                            <span className="text-sm text-[var(--color-base-primary)]">Required</span>
                          </label>
                          <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--color-base-surface-secondary)] cursor-pointer transition-colors">
                            <Checkbox
                              checked={si.readOnly === true}
                              onCheckedChange={() => { updateDetailsItem(si.id, { readOnly: !si.readOnly }); }}
                            />
                            <span className="text-sm text-[var(--color-base-primary)]">Read-only</span>
                          </label>
                          <label className={`flex items-center gap-2.5 px-3 py-2 transition-colors ${si.type === "input" ? "hover:bg-[var(--color-base-surface-secondary)] cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
                            <Checkbox
                              checked={si.copyable || false}
                              disabled={si.type !== "input"}
                              onCheckedChange={() => { if (si.type === "input") updateDetailsItem(si.id, { copyable: !si.copyable }); }}
                            />
                            <span className="text-sm text-[var(--color-base-primary)]">Copy to clipboard</span>
                          </label>
                          <div className="h-px bg-[var(--color-base-stroke)] my-1" />
                          <button
                            type="button"
                            onClick={() => { removeDetailsItem(si.id); setDetailsMenuId(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--color-status-error)]/10 transition-colors text-left"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M2.667 4.667H13.333M6.667 7.333V11.333M9.333 7.333V11.333M3.333 4.667L4 12.667C4 13.403 4.597 14 5.333 14H10.667C11.403 14 12 13.403 12 12.667L12.667 4.667M6 4.667V2.667C6 2.299 6.299 2 6.667 2H9.333C9.701 2 10 2.299 10 2.667V4.667" stroke="var(--color-status-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-sm text-[var(--color-status-error)]">Delete</span>
                          </button>
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </React.Fragment>
              ))}
              {/* Drop indicator at end */}
              <div className={`rounded-lg transition-all duration-200 ease-in-out overflow-hidden ${
                detailsDropIdx === detailsItems.length
                  ? "h-10 border-2 border-dashed border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 opacity-100"
                  : "h-0 border-0 opacity-0"
              }`} />
            </div>

            {/* Delete footer — прибитий до низу */}
            {config.propertiesPanel.showDelete && (
              <div className="shrink-0 h-14 flex items-center border-t border-[var(--color-base-stroke)] px-4">
                <Button variant="secondary" disabled className="w-full opacity-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Delete
                </Button>
              </div>
            )}
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder для Preview Area на кроках 2–5: підсвічує зону роботи
// Step 2 Preview: Table with skeleton rows
const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1.5 3h13M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function FilterChip({ label }: { label: string }) {
  return (
    <div className="shrink-0">
      <Select
        value=""
        onChange={() => {}}
        placeholder={label}
        options={[{ value: "all", label: "All" }]}
        readOnly
      />
    </div>
  );
}

const TRANSITION = "transition-all duration-500 ease-in-out";

function SmartTablePreview({ intent, activeStep }: { intent: WizardIntent; activeStep: 2 | 3 | 4 }) {
  const selectedColumns = (intent.selectedFields?.tableColumns || []).filter(
    (f): f is FieldRef => f != null && typeof f.id === "string"
  );
  const skeletonRows = 6;
  const colWidth = 192;

  const hasSearch = intent.filters?.freeTextSearch ?? false;
  const enabledFilters = selectedColumns.filter(
    (col) => intent.filters?.fieldFilters?.[col.id]
  );

  const showFilters = activeStep >= 3;
  const filtersOpacity = activeStep === 3 ? 1 : activeStep === 4 ? 0.4 : 0;
  const titleOpacity = activeStep <= 3 ? 1 : 0.4;
  const tableOpacity = activeStep === 2 ? 1 : 0.4;

  const rowActions = intent.rowActions;
  const activeActions: { icon: React.ReactNode; label: string }[] = [];
  if (rowActions.viewDetails) activeActions.push({
    label: "View details",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3C4.5 3 1.5 6 1.5 8C1.5 10 4.5 13 8 13C11.5 13 14.5 10 14.5 8C14.5 6 11.5 3 8 3Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  });
  if (rowActions.edit) activeActions.push({
    label: "Edit",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  });
  if (rowActions.duplicate) activeActions.push({
    label: "Duplicate",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  });
  if (rowActions.delete) activeActions.push({
    label: "Delete",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-status-error)]"><path d="M3 4H13M6 4V3C6 2.45 6.45 2 7 2H9C9.55 2 10 2.45 10 3V4M12 4V13C12 13.55 11.55 14 11 14H5C4.45 14 4 13.55 4 13V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  });
  const showActions = activeStep === 4 && activeActions.length > 0;

  const measureRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxVisible, setMaxVisible] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!showFilters) return;
    const measureEl = measureRef.current;
    const containerEl = containerRef.current;
    if (!measureEl || !containerEl) return;

    const measure = () => {
      const searchWidth = hasSearch ? 220 + 8 : 0;
      const availableWidth = containerEl.getBoundingClientRect().width - searchWidth;
      const moreWidth = 80;
      const gap = 8;
      const children = Array.from(measureEl.children) as HTMLElement[];
      let usedWidth = 0;
      let allFit = true;

      for (let i = 0; i < children.length; i++) {
        const childWidth = children[i].getBoundingClientRect().width;
        const nextWidth = usedWidth + childWidth + (i > 0 ? gap : 0);
        if (nextWidth > availableWidth) { allFit = false; break; }
        usedWidth = nextWidth;
      }

      if (allFit) { setMaxVisible(children.length); return; }

      usedWidth = 0;
      let visible = 0;
      for (let i = 0; i < children.length; i++) {
        const childWidth = children[i].getBoundingClientRect().width;
        const nextWidth = usedWidth + childWidth + (i > 0 ? gap : 0);
        if (nextWidth > availableWidth - moreWidth - gap) break;
        usedWidth = nextWidth;
        visible++;
      }
      setMaxVisible(Math.max(visible, 0));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [enabledFilters.length, hasSearch, showFilters]);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  const effectiveMax = maxVisible ?? enabledFilters.length;
  const visibleFilters = maxVisible === null ? [] : enabledFilters.slice(0, effectiveMax);
  const overflowFilters = maxVisible === null ? [] : enabledFilters.slice(effectiveMax);

  return (
    <div className="h-full flex flex-col overflow-visible">
      <p className="text-lg font-medium text-[var(--color-base-primary)] px-0 pt-4 mb-10 shrink-0">
        Preview
      </p>

      <div className="flex-1 min-h-0 pr-6 space-y-4">
        {/* Title */}
        <h2
          className={`text-headline-1 font-semibold text-[var(--color-base-primary)] ${TRANSITION}`}
          style={{ opacity: titleOpacity }}
        >
          {intent.title || "Feature Name"}
        </h2>

        {/* Hidden measurement row (always present for filters) */}
        <div
          ref={measureRef}
          aria-hidden
          className="flex gap-2 items-center pointer-events-none opacity-0 h-0 overflow-hidden whitespace-nowrap absolute left-0"
        >
          {enabledFilters.map((col) => (
            <FilterChip key={col.id} label={col.label} />
          ))}
        </div>

        {/* Filters toolbar — slides in/out and fades */}
        <div
          ref={containerRef}
          className={`flex items-center gap-2 ${TRANSITION} overflow-hidden`}
          style={{
            opacity: filtersOpacity,
            maxHeight: showFilters ? 48 : 0,
            marginTop: showFilters ? undefined : 0,
            marginBottom: showFilters ? undefined : 0,
          }}
        >
          {visibleFilters.map((col) => (
            <FilterChip key={col.id} label={col.label} />
          ))}

          {overflowFilters.length > 0 && (
            <div ref={moreRef} className="relative shrink-0">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] text-sm text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors outline-none"
              >
                More
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}>
                  <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {moreOpen && (
                <div className="absolute top-full mt-1 left-0 bg-[var(--color-base-surface-primary)] border border-[var(--color-base-stroke)] rounded-xl shadow-lg z-50 p-2 flex gap-2 whitespace-nowrap">
                  {overflowFilters.map((col) => (
                    <FilterChip key={col.id} label={col.label} />
                  ))}
                </div>
              )}
            </div>
          )}

          {showFilters && !hasSearch && enabledFilters.length === 0 && (
            <div className="flex items-center h-9 px-3 text-sm text-[var(--color-base-tertiary)]">
              Enable search or filters in the right panel
            </div>
          )}

          {hasSearch && (
            <div className="ml-auto shrink-0 w-[220px]">
              <SearchInput placeholder="Search..." readOnly />
            </div>
          )}
        </div>

        {/* Table */}
        {selectedColumns.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[var(--color-base-tertiary)]">Select columns in the right panel to see the table preview</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-base-stroke)]">
                  {selectedColumns.map((col) => (
                    <th
                      key={col.id}
                      className={`h-8 px-3 text-left text-xs font-medium text-[var(--color-base-secondary)] bg-[var(--color-base-surface-secondary)] ${TRANSITION}`}
                      style={{ width: colWidth, minWidth: colWidth, opacity: tableOpacity }}
                    >
                      {col.label}
                    </th>
                  ))}
                  {/* Actions header — slides in */}
                  <th
                    className={`sticky right-0 z-10 h-8 px-3 text-left text-xs font-medium text-[var(--color-base-primary)] bg-[var(--color-base-surface-secondary)] border-l-2 border-[var(--color-base-stroke)] whitespace-nowrap ${TRANSITION}`}
                    style={{
                      maxWidth: showActions ? 200 : 0,
                      width: showActions ? "auto" : 0,
                      opacity: showActions ? 1 : 0,
                      padding: showActions ? undefined : 0,
                      borderLeftWidth: showActions ? 2 : 0,
                      overflow: "hidden",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-[var(--color-base-stroke)] last:border-b-0">
                    {selectedColumns.map((col) => (
                      <td
                        key={col.id}
                        className={`px-3 ${TRANSITION}`}
                        style={{ width: colWidth, minWidth: colWidth, height: 48, opacity: tableOpacity }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 rounded bg-[var(--color-base-stroke)] flex-1"
                            style={{ width: `${55 + ((rowIdx * 17 + col.id.length * 13) % 35)}%` }}
                          />
                          {col.copyable && (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[var(--color-base-tertiary)]">
                              <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          )}
                        </div>
                      </td>
                    ))}
                    {/* Actions cells */}
                    <td
                      className={`sticky right-0 z-10 bg-[var(--color-base-surface-primary)] border-l-2 border-[var(--color-base-stroke)] ${TRANSITION}`}
                      style={{
                        height: 48,
                        maxWidth: showActions ? 200 : 0,
                        width: showActions ? "auto" : 0,
                        opacity: showActions ? 1 : 0,
                        padding: showActions ? "0 12px" : 0,
                        borderLeftWidth: showActions ? 2 : 0,
                        overflow: "hidden",
                      }}
                    >
                      <ButtonGroup>
                        {activeActions.map((action, i) => (
                          <ButtonGroupItem
                            key={i}
                            icon={action.icon}
                            aria-label={action.label}
                          />
                        ))}
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StepGenericPreview({ step, intent }: { step: number; intent: WizardIntent }) {
  const stepTitles: Record<number, string> = {
    1: "Page structure",
    2: "Table columns",
    3: "Filters",
    4: "Actions",
    5: "Summary",
  };
  return (
    <div className="h-full flex flex-col items-center justify-center rounded-xl p-6 bg-transparent">
      <p className="text-sm text-[var(--color-base-secondary)] uppercase tracking-wider">
        Preview
      </p>
      <p className="text-lg font-medium text-[var(--color-base-primary)] mt-2">
        {stepTitles[step] ?? `Step ${step + 1}`}
      </p>
      <p className="text-sm text-[var(--color-base-tertiary)] mt-1">
        Context for this step will appear here
      </p>
    </div>
  );
}

/** Візуалізація схеми сторінки P-03: підсвічує зону, над якою зараз працює користувач */
function PageLayoutWireframe({ activeZone }: { activeZone: "zoneB" | "properties" }) {
  const zoneBActive = activeZone === "zoneB";
  const propsActive = activeZone === "properties";
  return (
    <div className="rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)] p-3">
      <p className="text-xs font-medium text-[var(--color-base-secondary)] uppercase tracking-wider mb-2">
        Page layout (P-03)
      </p>
      <div className="flex flex-col gap-1.5">
        {/* Zone A — заголовок сторінки */}
        <div className="h-7 rounded border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] flex items-center justify-center">
          <span className="text-xs text-[var(--color-base-tertiary)]">Zone A — Title / breadcrumb</span>
        </div>
        {/* Zone B + Properties Panel */}
        <div className="flex gap-1.5 min-h-[72px]">
          <div
            className={`flex-1 rounded border-2 flex items-center justify-center transition-colors ${
              zoneBActive
                ? "border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)]"
                : "border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]"
            }`}
          >
            <span className={`text-xs ${zoneBActive ? "text-[var(--color-base-primary)] font-medium" : "text-[var(--color-base-tertiary)]"}`}>
              Zone B — Main content
            </span>
          </div>
          <div
            className={`w-[28%] min-w-[80px] rounded border-2 flex items-center justify-center transition-colors ${
              propsActive
                ? "border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)]"
                : "border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]"
            }`}
          >
            <span className={`text-xs text-center px-1 ${propsActive ? "text-[var(--color-base-primary)] font-medium" : "text-[var(--color-base-tertiary)]"}`}>
              Properties Panel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Unified section item: field or action
type SectionItem =
  | { id: string; kind: "field"; label: string; type: string; required?: boolean; autoGenerated?: boolean; placeholder?: string; copyable?: boolean; readOnly?: boolean; rowId: string }
  | { id: string; kind: "action"; label: string; rowId: string };

type RowGroup = { rowId: string; items: SectionItem[] };

function groupByRows(items: SectionItem[]): RowGroup[] {
  const map = new Map<string, RowGroup>();
  const ordered: RowGroup[] = [];
  for (const item of items) {
    const existing = map.get(item.rowId);
    if (existing) {
      existing.items.push(item);
    } else {
      const group: RowGroup = { rowId: item.rowId, items: [item] };
      map.set(item.rowId, group);
      ordered.push(group);
    }
  }
  return ordered;
}

function migrateSectionItems(cfg: Record<string, unknown> | undefined): SectionItem[] {
  if (!cfg) return [];
  if (Array.isArray(cfg.items)) {
    return (cfg.items as SectionItem[]).map(item =>
      item.rowId ? item : { ...item, rowId: item.id }
    );
  }
  const fields = (cfg.fields ?? []) as Array<Record<string, unknown>>;
  const actions = (cfg.customActions ?? []) as Array<Record<string, unknown>>;
  return [
    ...fields.map(f => ({ ...f, kind: "field" as const, rowId: (f.rowId as string) || (f.id as string) })),
    ...actions.map(a => ({ id: a.id as string, kind: "action" as const, label: a.label as string, rowId: a.id as string })),
  ] as SectionItem[];
}

// Palette items for drag-and-drop onto Preview
const PALETTE_ITEMS = [
  { type: "input", label: "Text Field", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { type: "select", label: "Select", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M11 7.5L13 9.5L11 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { type: "date-time", label: "Date Picker", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7.5H16M5.5 1V4M12.5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { type: "number", label: "Number", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7.5H11M11 7.5V11.5M11 7.5L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { type: "textarea", label: "Textarea", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="2" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 6H13M5 9H13M5 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { type: "action", label: "Button", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="8" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
];

// Step 1: Create Page (P-03) — tabbed: Properties Panel + Content Sections
function StepCreatePage({ intent, updateIntent, activeTab, setActiveTab }: StepProps & { activeTab: "sections" | "properties"; setActiveTab: (tab: "sections" | "properties") => void }) {
  const config = intent.createPageConfig;
  const selectedType = config.sections[0]?.type ?? null;
  const section = config.sections[0];
  const sectionConfig = section?.config as { items?: SectionItem[]; fields?: Array<Record<string, unknown>>; customActions?: Array<Record<string, unknown>>; actions?: string[]; titleField?: string; addLabel?: string; hasStatusToggle?: boolean; enableReorder?: boolean } | undefined;
  const accordionActions = sectionConfig?.actions ?? ["copy", "delete"];
  const enableReorder = sectionConfig?.enableReorder !== false;

  const selectPattern = (type: string) => {
    const labels: Record<string, string> = {
      "accordion-list": "Accordion List",
      "master-detail": "List + Details",
      "simple-list": "Simple List",
    };
    const newSection = {
      id: uid("zone-b"),
      type: type as CreatePageConfig["sections"][0]["type"],
      title: labels[type] || type,
      config: getDefaultSectionConfig(type),
    };
    updateIntent({
      createPageConfig: { ...config, sections: [newSection] },
    });
  };

  const updateSectionConfig = (updates: Record<string, unknown>) => {
    if (!section) return;
    updateIntent({
      createPageConfig: {
        ...config,
        sections: [{ ...section, config: { ...sectionConfig, ...updates } }],
      },
    });
  };

  const toggleAccordionAction = (action: string) => {
    const next = accordionActions.includes(action)
      ? accordionActions.filter(a => a !== action)
      : [...accordionActions, action];
    updateSectionConfig({ actions: next });
  };

  return (
    <div className="space-y-6">
      {/* ── General ── */}
      <div className="space-y-4 px-4">
        <p className="text-lg font-medium text-[var(--color-base-primary)]">General</p>

        {/* Tabs: Main Section / Details */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`flex-1 text-center text-paragraph-2 font-medium py-1 rounded-lg transition-colors ${
              activeTab === "sections"
                ? "bg-[var(--color-brand-primary)] text-white"
                : "bg-black/[0.04] text-[var(--color-base-primary)]"
            }`}
          >
            Main Section
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("properties")}
            className={`flex-1 text-center text-paragraph-2 font-medium py-1 rounded-lg transition-colors ${
              activeTab === "properties"
                ? "bg-[var(--color-brand-primary)] text-white"
                : "bg-black/[0.04] text-[var(--color-base-primary)]"
            }`}
          >
            Details
          </button>
        </div>

        {activeTab === "sections" && (
          <>
            {/* Select Layout */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-base-primary)]">Select Layout</p>
              <div className="flex gap-2">
                {/* Accordions */}
                <button
                  type="button"
                  onClick={() => selectPattern("accordion-list")}
                  className={`flex-1 flex flex-col items-center py-2 rounded-2xl border transition-colors ${
                    selectedType === "accordion-list"
                      ? "border-[var(--color-brand-primary)]"
                      : "border-transparent"
                  }`}
                >
                  <div className="h-16 w-full flex flex-col items-center justify-center gap-1">
                    <div className={`h-4 w-12 rounded-sm ${selectedType === "accordion-list" ? "bg-[var(--color-brand-primary)]" : "bg-black/10"}`} />
                    <div className={`h-2 w-12 rounded-sm ${selectedType === "accordion-list" ? "bg-[var(--color-brand-primary)]" : "bg-black/10"}`} />
                    <div className={`h-2 w-12 rounded-sm ${selectedType === "accordion-list" ? "bg-[var(--color-brand-primary)]" : "bg-black/10"}`} />
                  </div>
                  <span className={`text-xs font-bold ${selectedType === "accordion-list" ? "text-[var(--color-brand-primary)]" : "text-[var(--color-base-primary)]"}`}>
                    Accordion
                  </span>
                </button>
                {/* List + Details */}
                <div className="flex-1 flex flex-col items-center py-2 rounded-2xl opacity-40 relative">
                  <div className="h-16 w-full flex items-center justify-center gap-1">
                    <div className="h-9 w-4 rounded-sm bg-black/10" />
                    <div className="h-9 w-8 rounded-sm bg-black/10" />
                  </div>
                  <span className="text-xs text-[var(--color-base-primary)]">List + Details</span>
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-[var(--color-base-stroke)] text-[var(--color-base-secondary)] px-1 rounded">In Progress</span>
                </div>
                {/* Simple List */}
                <div className="flex-1 flex flex-col items-center py-2 rounded-2xl opacity-40 relative">
                  <div className="h-16 w-full flex items-center justify-center">
                    <div className="h-9 w-12 rounded-sm bg-black/10" />
                  </div>
                  <span className="text-xs text-[var(--color-base-primary)]">Simple List</span>
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-[var(--color-base-stroke)] text-[var(--color-base-secondary)] px-1 rounded">In Progress</span>
                </div>
              </div>
            </div>

            {/* Checkboxes: Show Toolbar, Save Button, Save & Exit Button */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-paragraph-2 font-medium text-[var(--color-base-primary)]">
                <WizardCheckbox
                  checked={config.showToolbar}
                  onChange={() => updateIntent({ createPageConfig: { ...config, showToolbar: !config.showToolbar } })}
                />
                Show Toolbar
              </label>
              <label className="flex items-center gap-2 text-paragraph-2 font-medium text-[var(--color-base-primary)]">
                <WizardCheckbox
                  checked={config.saveChanges}
                  onChange={() => updateIntent({ createPageConfig: { ...config, saveChanges: !config.saveChanges } })}
                />
                Save Button
              </label>
              <label className="flex items-center gap-2 text-paragraph-2 font-medium text-[var(--color-base-primary)]">
                <WizardCheckbox
                  checked={config.saveAndClose}
                  onChange={() => updateIntent({ createPageConfig: { ...config, saveAndClose: !config.saveAndClose } })}
                />
                Save &amp; Exit Button
              </label>
            </div>
          </>
        )}

        {activeTab === "properties" && (
          <PropertiesEditor
            config={config}
            updateIntent={updateIntent}
            intent={intent}
          />
        )}
      </div>

      {activeTab === "sections" && selectedType === "accordion-list" && (
        <>
          {/* ── Separator ── */}
          <div className="h-px bg-[var(--color-base-stroke)]" />

          {/* ── Accordion Settings ── */}
          <div className="space-y-4 px-4">
            <p className="text-lg font-medium text-[var(--color-base-primary)]">Accordion Settings</p>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-paragraph-2 font-medium text-[var(--color-base-primary)]">
                <WizardCheckbox checked={enableReorder} onChange={() => updateSectionConfig({ enableReorder: !enableReorder })} />
                Enable Sections Reordering
              </label>
              <label className="flex items-center gap-2 text-paragraph-2 font-medium text-[var(--color-base-primary)]">
                <WizardCheckbox
                  checked={accordionActions.includes("copy")}
                  onChange={() => toggleAccordionAction("copy")}
                />
                Duplicate
              </label>
              <label className="flex items-center gap-2 text-paragraph-2 font-medium text-[var(--color-base-primary)]">
                <WizardCheckbox
                  checked={accordionActions.includes("delete")}
                  onChange={() => toggleAccordionAction("delete")}
                />
                Delete
              </label>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-base font-medium text-[var(--color-base-primary)]">Components</p>
              <p className="text-xs text-[var(--color-base-secondary)]">Drag components to the Preview area</p>
            </div>

            {/* Component palette */}
            <div className="grid grid-cols-2 gap-2">
              {PALETTE_ITEMS.map((pi) => (
                <div
                  key={pi.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("palette-component", JSON.stringify({ type: pi.type, label: pi.label }));
                    if (pi.type === "action") e.dataTransfer.setData("palette-is-action", "1");
                    if (pi.type === "textarea") e.dataTransfer.setData("palette-is-textarea", "1");
                    e.dataTransfer.effectAllowed = "copy";
                    const el = e.currentTarget as HTMLElement;
                    const elRect = el.getBoundingClientRect();
                    const cursorX = e.clientX - elRect.left;
                    const cursorY = e.clientY - elRect.top;
                    const clone = el.cloneNode(true) as HTMLElement;
                    clone.style.width = `${el.offsetWidth}px`;
                    clone.style.position = "absolute";
                    clone.style.top = "-9999px";
                    clone.style.left = "-9999px";
                    clone.style.opacity = "0.9";
                    document.body.appendChild(clone);
                    e.dataTransfer.setDragImage(clone, cursorX, cursorY);
                    requestAnimationFrame(() => clone.remove());
                  }}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] cursor-grab active:cursor-grabbing hover:border-[var(--color-base-tertiary)] hover:shadow-sm transition-all select-none"
                >
                  <span className="shrink-0 size-8 flex items-center justify-center rounded-lg bg-[var(--color-base-surface-secondary)] text-[var(--color-base-secondary)]">
                    {pi.icon}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-base-primary)]">{pi.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Zone B — один паттерн: вибір типу замість списку секцій
function AccordionItemFieldsEditor({
  config,
  sectionConfig,
  updateIntent,
  hoveredFieldId,
  onHoverField,
}: {
  config: CreatePageConfig;
  sectionConfig: Record<string, unknown>;
  updateIntent: StepProps["updateIntent"];
  hoveredFieldId?: string | null;
  onHoverField?: (id: string | null) => void;
}) {
  const section = config.sections[0];
  if (!section || section.type !== "accordion-list") return null;

  const allItems = migrateSectionItems(sectionConfig);
  const fields = allItems.filter((i): i is SectionItem & { kind: "field" } => i.kind === "field");

  const updateConfig = (updates: Record<string, unknown>) => {
    updateIntent({
      createPageConfig: {
        ...config,
        sections: [{ ...section, config: { ...sectionConfig, ...updates } }],
      },
    });
  };

  const setAllItems = (next: SectionItem[]) => {
    updateConfig({ items: next, fields: undefined, customActions: undefined });
  };

  const addField = () => {
    const id = uid("field");
    const newField: SectionItem = { id, kind: "field", label: "New Field", type: "input", rowId: id };
    setAllItems([...allItems, newField]);
  };

  const removeField = (fieldId: string) => {
    setAllItems(allItems.filter(i => i.id !== fieldId));
  };

  const updateField = (fieldId: string, updates: Record<string, unknown>) => {
    setAllItems(allItems.map(i => (i.id === fieldId ? { ...i, ...updates } : i)));
  };

  const reorderFields = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const fieldIds = fields.map(f => f.id);
    const fromId = fieldIds[fromIndex];
    const toId = fieldIds[toIndex];
    const fromGlobal = allItems.findIndex(i => i.id === fromId);
    const toGlobal = allItems.findIndex(i => i.id === toId);
    if (fromGlobal < 0 || toGlobal < 0) return;
    const next = [...allItems];
    const [removed] = next.splice(fromGlobal, 1);
    next.splice(toGlobal, 0, removed);
    setAllItems(next);
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
            dragOverIndex === index ? "bg-[var(--color-base-surface-secondary)] ring-1 ring-[var(--color-base-stroke)]" : ""
          } ${hoveredFieldId === field.id ? "ring-2 ring-[var(--color-base-stroke)]" : ""}`}
          onMouseEnter={() => onHoverField?.(field.id)}
          onMouseLeave={() => onHoverField?.(null)}
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
                ? "text-[var(--color-base-primary)]"
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
        className="flex items-center gap-2 text-sm text-[var(--color-base-primary)] hover:underline"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add field
      </button>
    </div>
  );
}

function SectionsEditor({ config, updateIntent, intent, hoveredFieldId, onHoverField }: { config: CreatePageConfig; updateIntent: StepProps["updateIntent"]; intent: WizardIntent; hoveredFieldId?: string | null; onHoverField?: (id: string | null) => void }) {
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
      id: uid("zone-b"),
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
                  ? "border-[var(--color-base-primary)] bg-[var(--color-base-surface-secondary)]"
                  : "border-[var(--color-base-stroke)] hover:bg-[var(--color-base-surface-secondary)]"
              }`}
            >
              <div className={`relative shrink-0 size-4 rounded-full border mt-0.5 flex items-center justify-center ${
                selectedType === st.value
                  ? "border-[var(--color-base-primary)] bg-[var(--color-base-primary)]"
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
          sectionConfig={config.sections[0].config as Record<string, unknown>}
          updateIntent={updateIntent}
          hoveredFieldId={hoveredFieldId}
          onHoverField={onHoverField}
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

// Properties Panel sub-editor — flat items list
type DetailsItem =
  | { id: string; kind: "field"; label: string; type: string; required?: boolean; readOnly?: boolean; autoGenerated?: boolean; placeholder?: string; copyable?: boolean }
  | { id: string; kind: "action"; label: string }
  | { id: string; kind: "section"; title: string };

function migrateDetailsItems(panel: CreatePageConfig["propertiesPanel"]): DetailsItem[] {
  if (Array.isArray(panel.detailsItems) && panel.detailsItems.length > 0) return panel.detailsItems as DetailsItem[];
  const result: DetailsItem[] = [];
  for (const section of panel.sections) {
    result.push({ id: section.id, kind: "section", title: section.title });
    for (const f of section.fields) {
      result.push({ ...f, kind: "field" as const });
    }
  }
  return result;
}

function detailsItemsToSections(items: DetailsItem[]): CreatePageConfig["propertiesPanel"]["sections"] {
  const sections: CreatePageConfig["propertiesPanel"]["sections"] = [];
  let current: CreatePageConfig["propertiesPanel"]["sections"][0] | null = null;
  for (const item of items) {
    if (item.kind === "section") {
      current = { id: item.id, title: item.title, fields: [] };
      sections.push(current);
    } else if (item.kind === "field" && current) {
      current.fields.push(item as CreatePageConfig["propertiesPanel"]["sections"][0]["fields"][0]);
    }
  }
  if (sections.length === 0) {
    sections.push({ id: "details-fallback", title: "Details", fields: items.filter(i => i.kind === "field") as CreatePageConfig["propertiesPanel"]["sections"][0]["fields"] });
  }
  return sections;
}

const DETAILS_PALETTE_ITEMS = [
  { type: "input", label: "Text Field", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { type: "select", label: "Select", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M11 7.5L13 9.5L11 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { type: "date-time", label: "Date Picker", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7.5H16M5.5 1V4M12.5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { type: "number", label: "Number", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7.5H11M11 7.5V11.5M11 7.5L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { type: "textarea", label: "Textarea", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="2" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 6H13M5 9H13M5 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { type: "action", label: "Button", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="8" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { type: "section", label: "Section Title", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5H15M3 9H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
];

function PropertiesEditor({ config, updateIntent, intent, hoveredFieldId, onHoverField }: { config: CreatePageConfig; updateIntent: StepProps["updateIntent"]; intent: WizardIntent; hoveredFieldId?: string | null; onHoverField?: (id: string | null) => void }) {

  return (
    <div className="space-y-4 px-4">
      {/* Toggles */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-paragraph-2 font-medium text-[var(--color-base-primary)] opacity-50 pointer-events-none">
          <WizardCheckbox checked={config.propertiesPanel.statusToggle} onChange={() => {}} />
          Status Toggle
        </label>
      </div>

      <div className="space-y-1">
        <p className="text-base font-medium text-[var(--color-base-primary)]">Components</p>
        <p className="text-xs text-[var(--color-base-secondary)]">Drag components to the Details panel</p>
      </div>

      {/* Component palette */}
      <div className="grid grid-cols-2 gap-2">
        {DETAILS_PALETTE_ITEMS.map((pi) => (
          <div
            key={pi.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("details-palette-component", JSON.stringify({ type: pi.type, label: pi.label }));
              e.dataTransfer.effectAllowed = "copy";
              const el = e.currentTarget as HTMLElement;
              const elRect = el.getBoundingClientRect();
              const cursorX = e.clientX - elRect.left;
              const cursorY = e.clientY - elRect.top;
              const clone = el.cloneNode(true) as HTMLElement;
              clone.style.width = `${el.offsetWidth}px`;
              clone.style.position = "absolute";
              clone.style.top = "-9999px";
              clone.style.left = "-9999px";
              clone.style.opacity = "0.9";
              document.body.appendChild(clone);
              e.dataTransfer.setDragImage(clone, cursorX, cursorY);
              requestAnimationFrame(() => clone.remove());
            }}
            className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] cursor-grab active:cursor-grabbing hover:border-[var(--color-base-tertiary)] hover:shadow-sm transition-all select-none"
          >
            <span className="shrink-0 size-8 flex items-center justify-center rounded-lg bg-[var(--color-base-surface-secondary)] text-[var(--color-base-secondary)]">
              {pi.icon}
            </span>
            <span className="text-sm font-medium text-[var(--color-base-primary)]">{pi.label}</span>
          </div>
        ))}
      </div>
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
        items: [
          { id: "field-1", kind: "field", label: "Title", type: "input", required: false },
          { id: "field-2", kind: "field", label: "ID", type: "input", required: false, readOnly: true, autoGenerated: true },
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
  const configFields = React.useMemo(
    () => extractFieldsFromConfig(intent.createPageConfig),
    [intent.createPageConfig]
  );

  const tableColumns = (intent.selectedFields?.tableColumns || []).filter(
    (f): f is FieldRef => f != null && typeof f.id === "string"
  );

  const orderedFields = React.useMemo(() => {
    const orderMap = new Map(tableColumns.map((f, i) => [f.id, i]));
    return [...configFields].sort((a, b) => {
      const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : Infinity;
      const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : Infinity;
      if (ai === Infinity && bi === Infinity) return 0;
      return ai - bi;
    });
  }, [configFields, tableColumns]);

  const isSelected = (fieldId: string) => tableColumns.some(f => f.id === fieldId);

  const setColumns = (next: FieldRef[]) => {
    updateIntent({ selectedFields: { ...intent.selectedFields, tableColumns: next } });
  };

  const toggleField = (field: FieldRef) => {
    if (isSelected(field.id)) {
      setColumns(tableColumns.filter(f => f.id !== field.id));
    } else {
      setColumns([...tableColumns, { ...field }]);
    }
  };

  const toggleCopyable = (fieldId: string) => {
    setColumns(tableColumns.map(f => f.id === fieldId ? { ...f, copyable: !f.copyable } : f));
  };

  const canBeCopyable = (field: FieldRef): boolean => {
    if (!field || !field.id) return false;
    return field.id === "id" || field.id === "title" || field.dataType === "id" || field.dataType === "string";
  };

  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      const next = [...orderedFields];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      const selected = next.filter(f => isSelected(f.id)).map(f => {
        const existing = tableColumns.find(tc => tc.id === f.id);
        return existing || f;
      });
      setColumns(selected);
    }
  };

  return (
    <div className="space-y-4 px-4">
      <p className="text-sm font-medium text-[var(--color-base-primary)]">Available Fields</p>

      <div className="space-y-2 -mx-2">
        {orderedFields.map((field, index) => (
          <div
            key={field.id}
            className={`flex items-center gap-3 py-3 px-2 rounded-lg transition-colors ${dragOverIdx === index ? "bg-[var(--color-brand-primary)]/10" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(index); }}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={() => setDragOverIdx(null)}
              className="shrink-0 text-[var(--color-base-tertiary)] cursor-grab active:cursor-grabbing touch-none"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 3H7V5H5V3ZM9 3H11V5H9V3ZM5 7H7V9H5V7ZM9 7H11V9H9V7ZM5 11H7V13H5V11ZM9 11H11V13H9V11Z" fill="currentColor"/>
              </svg>
            </div>

            <WizardCheckbox
              checked={isSelected(field.id)}
              onCheckedChange={() => toggleField(field)}
            />

            <span className="flex-1 text-paragraph-2 font-medium text-[var(--color-base-primary)]">
              {field.label}
            </span>

            {canBeCopyable(field) && (
              <WizardCheckbox
                label="Enable Copy to Clipboard"
                checked={isSelected(field.id) && (tableColumns.find(f => f.id === field.id)?.copyable || false)}
                onCheckedChange={() => toggleCopyable(field.id)}
              />
            )}
          </div>
        ))}
        {orderedFields.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--color-base-tertiary)]">
            No fields available. Configure the Create Page first.
          </div>
        )}
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
              ? "bg-[var(--color-base-primary)] border-[var(--color-base-primary)] text-white"
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
                  ? "bg-[var(--color-base-primary)] border-[var(--color-base-primary)] text-white"
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
            <WizardCheckbox checked={intent.rowActions.delete} onChange={() => toggleRowAction("delete")} />
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
                <path d="M3 4H13M6 4V3C6 2.45 6.45 2 7 2H9C9.55 2 10 2.45 10 3V4M12 4V13C12 13.55 11.55 14 11 14H5C4.45 14 4 13.55 4 13V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-[var(--color-base-primary)]">Delete</span>
            </div>
          </label>
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

      <div className="p-4 rounded-lg bg-[var(--color-base-surface-secondary)] border border-[var(--color-base-stroke)]">
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
