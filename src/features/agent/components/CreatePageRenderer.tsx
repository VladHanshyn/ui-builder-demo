"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DatePickerInput } from "@/components/ui/DatePicker";
import { Toggle } from "@/components/ui/Toggle";
import { IconButton } from "@/components/ui/IconButton";
import { ButtonGroup, ButtonGroupItem } from "@/components/ui/ButtonGroup";
import type {
  CreatePageSpec,
  SectionSpec,
  FormGroupSpec,
  AccordionListSpec,
  EditableTableSpec,
  MasterDetailSpec,
  MediaUploadSpec,
  SimpleListSpec,
  FormField,
  EditableColumn,
  PropertiesPanelSpec,
  PropertyField,
  PropertySection,
} from "../types";

// ============================================
// Icons
// ============================================

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DragHandleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
    <path d="M5 3H7V5H5V3ZM9 3H11V5H9V3ZM5 7H7V9H5V7ZM9 7H11V9H9V7ZM5 11H7V13H5V11ZM9 11H11V13H9V11Z" fill="currentColor"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

function CopyToClipboardButton({ value }: { value: string | (() => string) }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = typeof value === "function" ? value() : value;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 p-1.5 text-[var(--color-base-tertiary)] hover:text-[var(--color-base-secondary)] transition-colors"
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8L6.5 11.5L13 5" stroke="var(--color-status-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <CopyIcon />
      )}
    </button>
  );
}

const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1.333 8C1.333 8 3.333 3.333 8 3.333C12.667 3.333 14.667 8 14.667 8C14.667 8 12.667 12.667 8 12.667C3.333 12.667 1.333 8 1.333 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.667 4.667H13.333M6.667 7.333V11.333M9.333 7.333V11.333M3.333 4.667L4 12.667C4 13.403 4.597 14 5.333 14H10.667C11.403 14 12 13.403 12 12.667L12.667 4.667M6 4.667V2.667C6 2.299 6.299 2 6.667 2H9.333C9.701 2 10 2.299 10 2.667V4.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-base-tertiary)]">
    <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 14V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ============================================
// PROPS
// ============================================

type FormDataContextValue = {
  formData: Record<string, string>;
  setFieldValue: (id: string, value: string) => void;
} | null;

const FormDataContext = createContext<FormDataContextValue>(null);

interface CreatePageRendererProps {
  spec: CreatePageSpec;
  onBack?: () => void;
  /** Pre-fill form when editing an existing row */
  initialFormData?: Record<string, string>;
  /** When set, Save & Close updates this row index instead of adding new */
  editRowIndex?: number;
  /** Called with form data; when editRowIndex is set, parent should update that row */
  onSaveAndClose?: (rowData: Record<string, string>, editRowIndex?: number) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CreatePageRenderer({ spec, onBack, onSaveAndClose, initialFormData, editRowIndex }: CreatePageRendererProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(true);
  const [statusLive, setStatusLive] = useState(false);
  const [activeTab, setActiveTab] = useState(spec.tabs?.[0]?.id ?? null);
  const [selectedMaster, setSelectedMaster] = useState<Record<string, number>>({});
  const [formData, setFormDataState] = useState<Record<string, string>>(() => {
    if (!initialFormData || Object.keys(initialFormData).length === 0) return {};
    const normalized: Record<string, string> = { ...initialFormData };
    ["title", "name", "id"].forEach((key) => {
      const v = (initialFormData as Record<string, string>)[key]
        ?? (initialFormData as Record<string, string>)[key.charAt(0).toUpperCase() + key.slice(1)]
        ?? (key === "id" ? (initialFormData as Record<string, string>)["ID"] : undefined);
      if (v !== undefined) normalized[key] = v;
    });
    return normalized;
  });
  const addFromSectionRef = useRef<(() => void) | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Helper: get effective title from formData (for validation and table column)
  const getEffectiveTitle = useCallback((data: Record<string, string>) => {
    const direct = (data["title"] ?? data["Title"] ?? "").trim();
    if (direct) return direct;
    const bySuffix = Object.entries(data).find(([k]) => k.toLowerCase().endsWith("-title"));
    return (bySuffix?.[1] ?? "").trim();
  }, []);

  // Sync initial form data when opening for edit (e.g. when initialFormData changes)
  useEffect(() => {
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      const normalized: Record<string, string> = { ...initialFormData };
      ["title", "name", "id"].forEach((key) => {
        const v = (initialFormData as Record<string, string>)[key]
          ?? (initialFormData as Record<string, string>)[key.charAt(0).toUpperCase() + key.slice(1)]
          ?? (key === "id" ? (initialFormData as Record<string, string>)["ID"] : undefined);
        if (v !== undefined) normalized[key] = v;
      });
      setFormDataState(normalized);
    }
  }, [initialFormData]);

  const setFieldValue = useCallback((id: string, value: string) => {
    setFormDataState(prev => ({ ...prev, [id]: value }));
  }, []);

  const hasAccordions = useMemo(() => {
    const sections = activeTab
      ? spec.tabs?.find(t => t.id === activeTab)?.sections ?? []
      : spec.sections;
    return sections.some(s => s.type === "accordion-list" || s.type === "simple-list");
  }, [spec, activeTab]);

  const toggleItem = useCallback((key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleAllExpanded = useCallback(() => {
    setAllExpanded(prev => !prev);
    setExpandedItems({});
  }, []);

  const isExpanded = useCallback((key: string) => {
    return expandedItems[key] !== undefined ? expandedItems[key] : allExpanded;
  }, [expandedItems, allExpanded]);

  const activeSections = activeTab
    ? spec.tabs?.find(t => t.id === activeTab)?.sections ?? []
    : spec.sections;

  return (
    <FormDataContext.Provider value={{ formData, setFieldValue }}>
    <div className="flex flex-col h-full bg-[var(--color-base-surface-primary)]">
      {saveError && (
        <div className="flex-shrink-0 px-6 py-2 bg-[var(--color-status-error)]/10 border-b border-[var(--color-status-error)]/30 text-sm text-[var(--color-status-error)]">
          {saveError}
        </div>
      )}
      {/* Zone H: Action Header */}
      <div className="flex-shrink-0 flex items-center justify-between h-14 px-6 border-b border-[var(--color-base-stroke)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded-lg text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <h1 className="text-headline-2 text-[var(--color-base-primary)]">
            Create {spec.entityName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {spec.actions.saveChanges && (
            <Button variant="secondary">Save Changes</Button>
          )}
          {spec.actions.saveAndClose && (
            <Button
              variant="primary"
              onClick={() => {
                setSaveError(null);
                const title = getEffectiveTitle(formData);
                if (!title) {
                  setSaveError("Please enter a Title. Items cannot be added without a title.");
                  return;
                }
                onSaveAndClose?.(formData, editRowIndex);
              }}
            >
              Save &amp; Close
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1.5">
                <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          )}
          {spec.actions.customActions?.map(a => (
            <Button key={a.label} variant={a.variant || "primary"}>{a.label}</Button>
          ))}
        </div>
      </div>

      {/* Body: Zone B + Zone C */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zone B: Main Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Toolbar */}
          {spec.toolbar && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {spec.toolbar.showAddButton && (
                  <Button variant="secondary" onClick={() => addFromSectionRef.current?.()}>
                    <span>Add</span>
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {spec.toolbar.showPreview && (
                  <Button variant="secondary">
                    <ViewIcon />
                    <span className="ml-1.5">Preview</span>
                  </Button>
                )}
                {spec.toolbar.showExpandCollapse && hasAccordions && (
                  <>
                    <Button variant="secondary" onClick={toggleAllExpanded}>
                      {allExpanded ? "Collapse All" : "Expand All"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          {spec.tabs && spec.tabs.length > 0 && (
            <div className="flex border-b border-[var(--color-base-stroke)] mb-4">
              {spec.tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-[var(--color-brand-primary)] border-b-2 border-[var(--color-brand-primary)]"
                      : "text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Sections */}
          <div className="space-y-4">
            {activeSections.map(section => (
              <SectionRenderer
                key={section.id}
                section={section}
                isExpanded={isExpanded}
                toggleItem={toggleItem}
                selectedMaster={selectedMaster}
                setSelectedMaster={setSelectedMaster}
                registerAddHandler={addFromSectionRef}
              />
            ))}
          </div>
        </div>

        {/* Zone C: Properties Panel */}
        <PropertiesPanel
          spec={spec.properties}
          statusLive={statusLive}
          onStatusChange={setStatusLive}
        />
      </div>
    </div>
    </FormDataContext.Provider>
  );
}

// ============================================
// SECTION ROUTER
// ============================================

function SectionRenderer({
  section,
  isExpanded,
  toggleItem,
  selectedMaster,
  setSelectedMaster,
  registerAddHandler,
}: {
  section: SectionSpec;
  isExpanded: (key: string) => boolean;
  toggleItem: (key: string) => void;
  selectedMaster: Record<string, number>;
  setSelectedMaster: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  registerAddHandler?: React.MutableRefObject<(() => void) | null>;
}) {
  switch (section.type) {
    case "form":
      return <FormGroupRenderer spec={section} isExpanded={isExpanded} toggleItem={toggleItem} />;
    case "accordion-list":
      return <AccordionListRenderer spec={section} isExpanded={isExpanded} toggleItem={toggleItem} selectedMaster={selectedMaster} setSelectedMaster={setSelectedMaster} registerAddHandler={registerAddHandler} />;
    case "editable-table":
      return <EditableTableRenderer spec={section} />;
    case "master-detail":
      return <MasterDetailRenderer spec={section} isExpanded={isExpanded} toggleItem={toggleItem} selectedMaster={selectedMaster} setSelectedMaster={setSelectedMaster} />;
    case "media-upload":
      return <MediaUploadRenderer spec={section} />;
    case "simple-list":
      return <SimpleListRenderer spec={section} registerAddHandler={registerAddHandler} />;
    default:
      return null;
  }
}

// ============================================
// B-02: FORM GROUP
// ============================================

function FormGroupRenderer({
  spec,
  isExpanded,
  toggleItem,
}: {
  spec: FormGroupSpec;
  isExpanded: (key: string) => boolean;
  toggleItem: (key: string) => void;
}) {
  const expanded = spec.collapsible ? isExpanded(`form-${spec.id}`) : true;

  return (
    <div className="border-b border-[var(--color-base-stroke)] pb-4 last:border-b-0">
      <button
        onClick={spec.collapsible ? () => toggleItem(`form-${spec.id}`) : undefined}
        className={`flex items-center gap-2 mb-3 ${spec.collapsible ? "cursor-pointer" : ""}`}
      >
        <h3 className="text-label-normal font-semibold text-[var(--color-base-primary)]">
          {spec.title}
        </h3>
        {spec.collapsible && <ChevronIcon expanded={expanded} />}
      </button>

      {expanded && (
        <div className="space-y-4">
          <FieldGrid fields={spec.fields} sectionId={spec.id} />
          {spec.inlineActions?.map(action => (
            <button
              key={action.label}
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-primary)] hover:opacity-80 transition-opacity"
            >
              <PlusIcon />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldGrid({ fields, sectionId }: { fields: FormField[]; sectionId: string }) {
  const rows: FormField[][] = [];
  let currentRow: FormField[] = [];
  let currentWidth = 0;

  for (const field of fields) {
    const w = field.width === "half" ? 0.5 : field.width === "third" ? 0.333 : 1;
    if (currentWidth + w > 1.01 && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [field];
      currentWidth = w;
    } else {
      currentRow.push(field);
      currentWidth += w;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return (
    <div className="space-y-4">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-4">
          {row.map(field => (
            <div
              key={field.id}
              className={
                field.width === "half" ? "flex-1" :
                field.width === "third" ? "w-1/3" :
                "w-full"
              }
            >
              <FormFieldRenderer field={field} sectionKey={sectionId ? `section-${sectionId}-` : undefined} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FormFieldRenderer({ field, sectionKey }: { field: FormField; sectionKey?: string }) {
  const ctx = useContext(FormDataContext);
  const dataKey = sectionKey ? `${sectionKey}${field.id}` : field.id;
  const columnFallback = field.id === "title" || field.id === "Title" ? "title" : field.id === "name" || field.id === "Name" ? "name" : null;
  const useGlobalColumn = columnFallback && !sectionKey;
  const isTitleOrNameInSection = !!sectionKey && (field.id === "title" || field.id === "Title" || field.id === "name" || field.id === "Name");
  const boundValue = ctx
    ? (isTitleOrNameInSection
        ? (ctx.formData[dataKey] ?? "")
        : (ctx.formData[dataKey] ?? (useGlobalColumn
            ? (ctx.formData[columnFallback] ?? ctx.formData[columnFallback.charAt(0).toUpperCase() + columnFallback.slice(1)] ?? "")
            : (ctx.formData[field.id] ?? ctx.formData[field.id.charAt(0).toUpperCase() + field.id.slice(1)] ?? ctx.formData[field.id.charAt(0).toLowerCase() + field.id.slice(1)] ?? ""))))
    : undefined;
  const setBoundValue = ctx
    ? (v: string) => {
        ctx.setFieldValue(dataKey, v);
        if (useGlobalColumn && columnFallback) ctx.setFieldValue(columnFallback, v);
      }
    : undefined;

  const label = (
    <label className="block text-label-normal text-[var(--color-base-primary)] mb-1.5">
      {field.label}
      {field.required && <span className="text-[var(--color-status-error)]">*</span>}
    </label>
  );

  if (field.readOnly) {
    return (
      <div>
        {label}
        <div className="flex items-center gap-2">
          <Input
            value={boundValue ?? ""}
            placeholder={field.autoGenerated ? "Will be generated after save" : ""}
            disabled
          />
          {field.id === "id" && (
            <button className="shrink-0 p-2 text-[var(--color-base-tertiary)] hover:text-[var(--color-base-secondary)] transition-colors">
              <CopyIcon />
            </button>
          )}
        </div>
      </div>
    );
  }

  switch (field.type) {
    case "input":
    case "url": {
      const [local, setLocal] = useState("");
      const value = boundValue !== undefined ? boundValue : local;
      const setValue = setBoundValue ?? setLocal;
      return (
        <div>
          {label}
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={field.placeholder || `Enter ${field.label}...`} />
        </div>
      );
    }
    case "number": {
      const [local, setLocal] = useState("");
      const value = boundValue !== undefined ? boundValue : local;
      const setValue = setBoundValue ?? setLocal;
      return (
        <div>
          {label}
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={field.placeholder || "0"} />
        </div>
      );
    }
    case "textarea": {
      const [local, setLocal] = useState("");
      const value = boundValue !== undefined ? boundValue : local;
      const setValue = setBoundValue ?? setLocal;
      return (
        <div>
          {label}
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={field.placeholder || `Enter ${field.label}...`} rows={3} />
        </div>
      );
    }
    case "select":
    case "multi-select": {
      const [local, setLocal] = useState("");
      const value = boundValue !== undefined ? boundValue : local;
      const setValue = setBoundValue ?? setLocal;
      return (
        <div>
          {label}
          <Select
            value={value || undefined}
            onChange={(v) => setValue(String(v ?? ""))}
            placeholder={field.placeholder || `Select ${field.label}...`}
            options={(field.options || ["Option 1", "Option 2", "Option 3"]).map(o => ({ label: o, value: o }))}
            multiple={field.type === "multi-select"}
          />
        </div>
      );
    }
    case "date-time": {
      const [local, setLocal] = useState("");
      const value = boundValue !== undefined ? boundValue : local;
      const setValue = setBoundValue ?? setLocal;
      return (
        <div>
          {label}
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Select Date and Time" rightIcon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-base-tertiary)]">
              <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          } />
        </div>
      );
    }
    case "toggle":
      return (
        <div className="flex items-center gap-3 py-2">
          <Toggle label={field.label} />
        </div>
      );
    case "readonly":
      return (
        <div>
          {label}
          <div className="flex items-center gap-2">
            <Input
              value={boundValue ?? ""}
              placeholder={field.autoGenerated ? "Will be generated after save" : ""}
              disabled
            />
            {field.id === "id" && (
              <button className="shrink-0 p-2 text-[var(--color-base-tertiary)] hover:text-[var(--color-base-secondary)] transition-colors">
                <CopyIcon />
              </button>
            )}
          </div>
        </div>
      );
    default: {
      const [local, setLocal] = useState("");
      const value = boundValue !== undefined ? boundValue : local;
      const setValue = setBoundValue ?? setLocal;
      return (
        <div>
          {label}
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={field.placeholder || ""} />
        </div>
      );
    }
  }
}

// ============================================
// B-01: ACCORDION LIST
// ============================================

function AccordionListRenderer({
  spec,
  isExpanded,
  toggleItem,
  selectedMaster,
  setSelectedMaster,
  registerAddHandler,
}: {
  spec: AccordionListSpec;
  isExpanded: (key: string) => boolean;
  toggleItem: (key: string) => void;
  selectedMaster: Record<string, number>;
  setSelectedMaster: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  registerAddHandler?: React.MutableRefObject<(() => void) | null>;
}) {
  const ctx = useContext(FormDataContext);
  const [items, setItems] = useState([{ id: 1 }]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [itemTitles, setItemTitles] = useState<Record<number, string>>({});

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { id: prev.length + 1 }]);
  }, []);

  useEffect(() => {
    if (registerAddHandler) {
      registerAddHandler.current = addItem;
      return () => { registerAddHandler.current = null; };
    }
  }, [addItem, registerAddHandler]);

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const reorderItems = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setItems(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
      next.splice(insertIndex, 0, removed);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ index }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json")) as { index: number };
      reorderItems(data.index, toIndex);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const itemKey = `accordion-${spec.id}-${item.id}`;
        const expanded = isExpanded(itemKey);
        const defaultTitle = `${spec.itemTemplate.titleField.charAt(0).toUpperCase() + spec.itemTemplate.titleField.slice(1)} ${item.id}`;
        const titleKey = `accordion-item-${item.id}-title`;
        const titleValue = itemTitles[item.id] ?? ctx?.formData[titleKey] ?? defaultTitle;

        const setTitleValue = (value: string) => {
          setItemTitles(prev => ({ ...prev, [item.id]: value }));
          if (ctx) ctx.setFieldValue(titleKey, value);
        };

        return (
          <div
            key={item.id}
            className={`border border-[var(--color-base-stroke)] rounded-lg overflow-hidden transition-colors ${
              dragOverIndex === index ? "ring-2 ring-[var(--color-brand-primary)]/50" : ""
            }`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverIndex(index); }}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* Accordion Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--color-base-surface-primary)] border-b border-[var(--color-base-stroke)]">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={() => setDragOverIndex(null)}
                className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)]"
              >
                <DragHandleIcon />
              </div>
              {spec.itemTemplate.hasStatusToggle && (
                <Toggle size="sm" className="shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <Input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  className="w-full !border-0 !bg-transparent !shadow-none !ring-0 font-medium"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ButtonGroup>
                  {spec.itemTemplate.actions.includes("view") && (
                    <ButtonGroupItem icon={<ViewIcon />} aria-label="View" onClick={() => {}} />
                  )}
                  {spec.itemTemplate.actions.includes("delete") && (
                    <ButtonGroupItem
                      icon={<DeleteIcon />}
                      aria-label="Delete"
                      onClick={() => removeItem(item.id)}
                      className="hover:!border-[var(--color-danger-100)] [&>span]:text-[var(--color-danger-100)]"
                    />
                  )}
                </ButtonGroup>
                <button
                  onClick={() => toggleItem(itemKey)}
                  className="p-1 rounded text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] transition-colors"
                >
                  <ChevronIcon expanded={expanded} />
                </button>
              </div>
            </div>

            {/* Accordion Body */}
            {expanded && (
              <div className="p-4 space-y-4">
                {spec.itemTemplate.fields && spec.itemTemplate.fields.length > 0 && (
                  <div className="space-y-4">
                    {(() => {
                      const fields = spec.itemTemplate.fields!;
                      const rows: Array<typeof fields> = [];
                      const seen = new Set<string>();
                      for (const field of fields) {
                        const rid = field.rowId ?? field.id;
                        if (seen.has(rid)) continue;
                        seen.add(rid);
                        const group = fields.filter(f => (f.rowId ?? f.id) === rid);
                        rows.push(group);
                      }
                      return rows.map((rowFields) =>
                        rowFields.length === 1 ? (
                          <PropertyFieldRenderer key={rowFields[0].id} field={rowFields[0]} sectionKey={`accordion-${spec.id}-`} />
                        ) : (
                          <div key={rowFields.map(f => f.id).join("-")} className="flex gap-2">
                            {rowFields.map(field => (
                              <div key={field.id} className="flex-1 min-w-0">
                                <PropertyFieldRenderer field={field} sectionKey={`accordion-${spec.id}-`} />
                              </div>
                            ))}
                          </div>
                        )
                      );
                    })()}
                  </div>
                )}
                {spec.itemTemplate.children.map(child => (
                  <SectionRenderer
                    key={child.id}
                    section={child}
                    isExpanded={isExpanded}
                    toggleItem={toggleItem}
                    selectedMaster={selectedMaster}
                    setSelectedMaster={setSelectedMaster}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add is handled by toolbar button above — no duplicate Add Item here */}
    </div>
  );
}
// ============================================

function EditableTableRenderer({ spec }: { spec: EditableTableSpec }) {
  const [rows, setRows] = useState([{ id: 1 }]);

  const addRow = () => {
    setRows(prev => [...prev, { id: prev.length + 1 }]);
  };

  const removeRow = (id: number) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="border-b border-[var(--color-base-stroke)] pb-4 last:border-b-0">
      <h3 className="text-label-normal font-semibold text-[var(--color-base-primary)] mb-3">
        {spec.title}
      </h3>

      <div className="border border-[var(--color-base-stroke)] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-base-stroke)]">
              {spec.hasDragHandle && (
                <th className="w-8 px-2 bg-[var(--color-base-surface-secondary)] h-8" />
              )}
              {spec.columns.map(col => (
                <th
                  key={col.id}
                  className="px-2 h-8 text-left text-label-normal text-[var(--color-base-secondary)] bg-[var(--color-base-surface-secondary)] border-r border-[var(--color-base-stroke)] last:border-r-0"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-16 px-2 bg-[var(--color-base-surface-secondary)] h-8 text-left text-label-normal text-[var(--color-base-secondary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b border-[var(--color-base-stroke)] last:border-b-0">
                {spec.hasDragHandle && (
                  <td className="w-8 px-2 h-10">
                    <div className="cursor-grab"><DragHandleIcon /></div>
                  </td>
                )}
                {spec.columns.map(col => (
                  <td key={col.id} className="px-1 h-10 border-r border-[var(--color-base-stroke)] last:border-r-0">
                    <EditableCellRenderer column={col} rowId={row.id} />
                  </td>
                ))}
                <td className="w-16 px-2 h-10">
                  <ButtonGroup>
                    <ButtonGroupItem
                      icon={<DeleteIcon />}
                      aria-label="Delete"
                      onClick={() => removeRow(row.id)}
                      className="hover:!border-[var(--color-danger-100)] [&>span]:text-[var(--color-danger-100)]"
                    />
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        className="flex items-center gap-1.5 px-3 py-2 mt-2 text-sm font-medium text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 rounded-lg transition-colors"
      >
        <PlusIcon />
        {spec.addLabel}
      </button>
    </div>
  );
}

function EditableCellRenderer({ column, rowId }: { column: EditableColumn; rowId: number }) {
  switch (column.type) {
    case "select":
      return (
        <Select
          placeholder="Select..."
          options={(column.options || ["Option 1", "Option 2"]).map(o => ({ label: o, value: o }))}
        />
      );
    case "number":
      return <Input type="number" placeholder="0" className="!border-0 !bg-transparent !shadow-none !ring-0 h-8 text-sm" />;
    case "input":
      return <Input placeholder="" className="!border-0 !bg-transparent !shadow-none !ring-0 h-8 text-sm" />;
    case "readonly":
      return <span className="text-paragraph-2 text-[var(--color-base-tertiary)] px-2">{column.label} {rowId}</span>;
    default:
      return <Input placeholder="" className="!border-0 !bg-transparent !shadow-none !ring-0 h-8 text-sm" />;
  }
}

// ============================================
// B-04: MASTER-DETAIL
// ============================================

function MasterDetailRenderer({
  spec,
  isExpanded,
  toggleItem,
  selectedMaster,
  setSelectedMaster,
}: {
  spec: MasterDetailSpec;
  isExpanded: (key: string) => boolean;
  toggleItem: (key: string) => void;
  selectedMaster: Record<string, number>;
  setSelectedMaster: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const [items, setItems] = useState([{ id: 1, title: `${spec.masterList.titleField} 1` }]);
  const selected = selectedMaster[spec.id] ?? 0;

  const addItem = () => {
    const newId = items.length + 1;
    setItems(prev => [...prev, { id: newId, title: `${spec.masterList.titleField} ${newId}` }]);
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (items[selected]?.id === id) {
      setSelectedMaster(prev => ({ ...prev, [spec.id]: 0 }));
    }
  };

  return (
    <div className="flex gap-4 border border-[var(--color-base-stroke)] rounded-lg overflow-hidden min-h-[300px]">
      {/* Master List */}
      <div className="w-[220px] shrink-0 border-r border-[var(--color-base-stroke)] flex flex-col bg-[var(--color-base-surface-secondary)]">
        <div className="flex-1 overflow-y-auto">
          {items.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setSelectedMaster(prev => ({ ...prev, [spec.id]: idx }))}
              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-[var(--color-base-stroke)] transition-colors ${
                selected === idx
                  ? "bg-[var(--color-base-surface-primary)]"
                  : "hover:bg-[var(--color-base-surface-primary)]/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--color-base-primary)] truncate">{item.title}</div>
                {spec.masterList.subtitleTemplate && (
                  <div className="text-xs text-[var(--color-base-tertiary)]">
                    {spec.masterList.subtitleTemplate.replace("{count}", "1")}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {spec.masterList.actions.includes("delete") && (
                  <button
                    onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                    className="p-1 text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)] transition-colors"
                  >
                    <DeleteIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-[var(--color-base-stroke)]">
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 rounded-lg transition-colors"
          >
            <PlusIcon />
            {spec.addLabel}
          </button>
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 p-4 overflow-y-auto">
        {items.length > 0 && items[selected] ? (
          <div className="space-y-4">
            <h3 className="text-headline-3 text-[var(--color-base-primary)]">
              {items[selected].title}
            </h3>
            {spec.detailSections.map(section => (
              <SectionRenderer
                key={section.id}
                section={section}
                isExpanded={isExpanded}
                toggleItem={toggleItem}
                selectedMaster={selectedMaster}
                setSelectedMaster={setSelectedMaster}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-[var(--color-base-tertiary)]">
            Select an item from the list
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// B-05: MEDIA UPLOAD
// ============================================

function MediaUploadRenderer({ spec }: { spec: MediaUploadSpec }) {
  const [activeMode, setActiveMode] = useState<"upload" | "url">(spec.modes[0]);
  const [preview, setPreview] = useState(false);

  return (
    <div className="border-b border-[var(--color-base-stroke)] pb-4 last:border-b-0">
      <h3 className="text-label-normal font-semibold text-[var(--color-base-primary)] mb-3">
        {spec.title}
      </h3>

      {spec.modes.length > 1 && (
        <div className="flex border-b border-[var(--color-base-stroke)] mb-3">
          {spec.modes.map(mode => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                activeMode === mode
                  ? "text-[var(--color-brand-primary)] border-b-2 border-[var(--color-brand-primary)]"
                  : "text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)]"
              }`}
            >
              {mode === "upload" ? "Upload" : "URL"}
            </button>
          ))}
        </div>
      )}

      {activeMode === "upload" ? (
        <div className="border-2 border-dashed border-[var(--color-base-stroke)] rounded-lg p-8 flex flex-col items-center justify-center gap-3 bg-[var(--color-base-surface-secondary)]">
          <UploadIcon />
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-base-primary)]">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-[var(--color-base-tertiary)] mt-1">
              {spec.accept === "image" ? "PNG, JPG, GIF up to 10MB" : "Any file up to 50MB"}
            </p>
          </div>
        </div>
      ) : (
        <Input placeholder="https://..." />
      )}

      {spec.showPreview && (
        <div className="flex items-center gap-3 mt-3">
          <Button variant="secondary" onClick={() => setPreview(!preview)}>
            <ViewIcon />
            <span className="ml-1.5">Preview</span>
          </Button>
          <Button variant="secondary">
            <DeleteIcon />
            <span className="ml-1.5">Remove</span>
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// B-06: SIMPLE LIST
// ============================================

function SimpleListRenderer({ spec, registerAddHandler }: { spec: SimpleListSpec; registerAddHandler?: React.MutableRefObject<(() => void) | null> }) {
  const [items, setItems] = useState([{ id: 1 }]);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { id: prev.length + 1 }]);
  }, []);

  useEffect(() => {
    if (registerAddHandler) {
      registerAddHandler.current = addItem;
      return () => { registerAddHandler.current = null; };
    }
  }, [addItem, registerAddHandler]);

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-2 p-2 border border-[var(--color-base-stroke)] rounded-lg">
          <div className="cursor-grab"><DragHandleIcon /></div>
          <div className="flex-1 flex items-center gap-2">
            {spec.itemTemplate.fields.map(field => (
              <div key={field.id} className="flex-1 min-w-0">
                <FormFieldRenderer field={field} />
              </div>
            ))}
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="p-1.5 text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)] transition-colors"
          >
            <DeleteIcon />
          </button>
        </div>
      ))}

      {spec.itemTemplate.childList && (
        <div className="ml-8 space-y-1.5">
          <div className="flex items-center gap-3 py-1.5 px-3 text-sm text-[var(--color-base-secondary)] bg-[var(--color-base-surface-secondary)] rounded">
            {spec.itemTemplate.childList.hasImage && (
              <div className="w-8 h-8 rounded bg-[var(--color-base-surface-secondary)] border border-[var(--color-base-stroke)]" />
            )}
            <span className="flex-1">Sample child item</span>
            <button className="p-1 text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)]">
              <DeleteIcon />
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-brand-primary)]">
            <PlusIcon />
            {spec.itemTemplate.childList.addLabel}
          </button>
        </div>
      )}

      {/* Add is handled by toolbar button above */}
    </div>
  );
}

// ============================================
// ZONE C: PROPERTIES PANEL
// ============================================

function PropertiesPanel({
  spec,
  statusLive,
  onStatusChange,
}: {
  spec: PropertiesPanelSpec;
  statusLive: boolean;
  onStatusChange: (v: boolean) => void;
}) {
  return (
    <div className="w-[330px] shrink-0 border-l border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] flex flex-col overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Status Toggle */}
        {spec.statusToggle && (
          <div className="flex items-center justify-between">
            <span className="text-label-normal font-semibold text-[var(--color-base-primary)]">
              {spec.statusLabel || "Status"}
            </span>
            <div className="flex items-center gap-2">
              <Toggle
                checked={statusLive}
                onCheckedChange={onStatusChange}
              />
              <span className={`text-sm font-medium ${statusLive ? "text-[var(--color-status-success)]" : "text-[var(--color-base-tertiary)]"}`}>
                {statusLive ? "Live" : "Draft"}
              </span>
            </div>
          </div>
        )}

        {/* Property Sections */}
        {spec.sections.map(section => (
          <PropertySectionRenderer key={section.id} section={section} />
        ))}

        {/* Extra Actions */}
        {spec.extraActions?.map(action => (
          <Button
            key={action.label}
            variant={action.variant === "primary" ? "primary" : "secondary"}
            className={`w-full ${action.variant === "danger" ? "text-[var(--color-status-error)]" : ""}`}
          >
            {action.label}
          </Button>
        ))}

        {/* Delete */}
        {spec.showDelete && (
          <div className="pt-2 border-t border-[var(--color-base-stroke)]">
            <Button variant="secondary" className="w-full text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/5">
              <DeleteIcon />
              <span className="ml-1.5">Delete</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertySectionRenderer({ section }: { section: PropertySection }) {
  return (
    <div className="space-y-3">
      <h4 className="text-label-normal font-semibold text-[var(--color-base-primary)]">
        {section.title}
      </h4>
      {section.fields.map(field => (
        <PropertyFieldRenderer key={field.id} field={field} sectionKey={`prop-${section.id}-`} />
      ))}
    </div>
  );
}

function PropertyFieldRenderer({ field, sectionKey }: { field: PropertyField; sectionKey?: string }) {
  const ctx = useContext(FormDataContext);
  const dataKey = sectionKey ? `${sectionKey}${field.id}` : field.id;

  const label = (
    <label className="block text-xs text-[var(--color-base-secondary)] mb-1">
      {field.label}
      {field.required && <span className="text-[var(--color-status-error)]">*</span>}
    </label>
  );

  const wrapWithCopy = (content: React.ReactNode, value: string) =>
    field.copyable ? (
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">{content}</div>
        <CopyToClipboardButton value={value} />
      </div>
    ) : (
      content
    );

  // When context is present, sync value with formData for Save & Close.
  // Only sync to global formData["title"]/["name"] when in main Properties panel (prop-*), not inside accordion (accordion-*).
  const columnFallback = field.id === "title" || field.id === "Title" ? "title" : field.id === "name" || field.id === "Name" ? "name" : null;
  const useGlobalColumn = columnFallback && sectionKey?.startsWith("prop-");
  const isTitleOrNameInAccordion = sectionKey?.startsWith("accordion-") && (field.id === "title" || field.id === "Title" || field.id === "name" || field.id === "Name");
  const boundValue = ctx
    ? (isTitleOrNameInAccordion
        ? (ctx.formData[dataKey] ?? "")
        : (ctx.formData[dataKey] ?? (useGlobalColumn
            ? (ctx.formData[columnFallback] ?? ctx.formData[columnFallback.charAt(0).toUpperCase() + columnFallback.slice(1)] ?? "")
            : (ctx.formData[field.id] ?? ctx.formData[field.id.charAt(0).toUpperCase() + field.id.slice(1)] ?? ctx.formData[field.id.charAt(0).toLowerCase() + field.id.slice(1)] ?? ""))))
    : undefined;
  const setBoundValue = ctx
    ? (v: string) => {
        ctx.setFieldValue(dataKey, v);
        if (field.id === "title" || field.id === "Title") {
          if (useGlobalColumn) ctx.setFieldValue("title", v);
        } else if (field.id === "name" || field.id === "Name") {
          if (useGlobalColumn) ctx.setFieldValue("name", v);
        }
      }
    : undefined;

  if (field.readOnly) {
    const inputRef = useRef<HTMLInputElement>(null);
    const getCopyValue = () => (inputRef.current?.value ?? "").trim() || (field.autoGenerated ? "Will be generated after save" : "");
    const readOnlyValue = boundValue !== undefined ? boundValue : "";
    return (
      <div>
        {label}
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={readOnlyValue}
            placeholder={field.autoGenerated ? "Will be generated after save" : ""}
            disabled
            className="flex-1 min-w-0"
          />
          {(field.copyable || field.id === "id" || field.id?.toLowerCase().includes("id")) && (
            <CopyToClipboardButton value={getCopyValue} />
          )}
        </div>
        {field.autoGenerated && (
          <p className="text-xs text-[var(--color-base-secondary)] mt-1">Will be generated after save</p>
        )}
      </div>
    );
  }

  switch (field.type) {
    case "input": {
      const [localValue, setLocalValue] = useState("");
      const value = boundValue !== undefined ? boundValue : localValue;
      const setValue = setBoundValue ?? setLocalValue;
      return (
        <div>
          {label}
          {wrapWithCopy(
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={field.placeholder || ""} />,
            value
          )}
        </div>
      );
    }
    case "textarea": {
      const [localValue, setLocalValue] = useState("");
      const value = boundValue !== undefined ? boundValue : localValue;
      const setValue = setBoundValue ?? setLocalValue;
      return (
        <div>
          {label}
          {wrapWithCopy(
            <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={field.placeholder || "Provide additional information..."} rows={3} />,
            value
          )}
        </div>
      );
    }
    case "select": {
      const [localValue, setLocalValue] = useState("");
      const value = boundValue !== undefined ? boundValue : localValue;
      const setValue = setBoundValue ?? setLocalValue;
      return (
        <div>
          {label}
          <Select
            value={value || undefined}
            onChange={(v) => setValue(String(v ?? ""))}
            placeholder={field.placeholder || "Select..."}
            options={(field.options || []).map(o => ({ label: o, value: o }))}
          />
        </div>
      );
    }
    case "date-time": {
      const [dateValue, setDateValue] = useState<Date | null>(null);
      const formatDateForDisplay = (d: Date) =>
        d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
      const copyValue = dateValue ? formatDateForDisplay(dateValue) : "";
      const handleDateChange = useCallback((date: Date | null) => {
        setDateValue(date);
        if (setBoundValue) setBoundValue(date ? formatDateForDisplay(date) : "");
      }, [setBoundValue]);
      const content = (
        <DatePickerInput
          placeholder="Select Date and Time"
          value={dateValue}
          onChange={handleDateChange}
          fullWidth
          showActions={true}
        />
      );
      return (
        <div>
          {label}
          {field.copyable
            ? wrapWithCopy(content, copyValue)
            : content}
        </div>
      );
    }
    case "readonly": {
      const inputRef = useRef<HTMLInputElement>(null);
      const getCopyValue = () => (inputRef.current?.value ?? "").trim() || (field.autoGenerated ? "Will be generated after save" : "");
      const readOnlyValue = boundValue !== undefined ? boundValue : "";
      return (
        <div>
          {label}
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={readOnlyValue}
              placeholder={field.autoGenerated ? "Will be generated after save" : ""}
              disabled
              className="flex-1 min-w-0"
            />
            {(field.copyable || field.id === "id" || field.id?.toLowerCase().includes("id")) && (
              <CopyToClipboardButton value={getCopyValue} />
            )}
          </div>
          {field.autoGenerated && (
            <p className="text-xs text-[var(--color-base-secondary)] mt-1">Will be generated after save</p>
          )}
        </div>
      );
    }
    case "user-count":
      return (
        <div>
          {label}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-base-primary)]">300 Users</span>
            <Button variant="secondary" className="text-xs">Update</Button>
          </div>
        </div>
      );
    case "file-upload":
      return (
        <div>
          {label}
          <div className="flex items-center gap-2">
            <Input placeholder="No file selected" disabled className="flex-1" />
            <Button variant="secondary" className="text-xs shrink-0">Upload</Button>
          </div>
        </div>
      );
    default:
      const [localDefault, setLocalDefault] = useState("");
      const defaultVal = boundValue !== undefined ? boundValue : localDefault;
      const setDefaultVal = setBoundValue ?? setLocalDefault;
      return (
        <div>
          {label}
          <Input value={defaultVal} onChange={(e) => setDefaultVal(e.target.value)} placeholder={field.placeholder || ""} />
        </div>
      );
  }
}
