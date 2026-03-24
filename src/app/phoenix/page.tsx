"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/Modal";
import { type WizardIntent, type NavSection } from "@/ui-generator";
import { getNavigation, saveNavigation, addPageToSection, addNewSection, updatePageLabel, DEFAULT_SECTIONS } from "@/ui-generator/navigationTree";
import { titleToFeatureId } from "@/ui-generator/wizardTypes";
import { PreviewRenderer } from "@/features/agent/components/PreviewRenderer";
import { CreatePageRenderer } from "@/features/agent/components/CreatePageRenderer";
import { generateDummyData } from "@/features/agent/agentMock";
import type {
  UISpec,
  TableColumn,
  CreatePageSpec,
  SectionSpec,
  AccordionContentBlock,
  PropertyField,
  PropertyFieldType,
  EditableTableSpec,
} from "@/features/agent/types";
import type { NavigationConfig } from "@/ui-generator";

/** Phoenix demo persistence (approved pages, specs, queue) — cleared by debug reset */
const PHOENIX_CLEARABLE_STORAGE_KEYS = [
  "phoenix-page-specs",
  "phoenix-create-page-specs",
  "phoenix-saved-table-rows",
  "phoenix-feature-requests",
  "phoenix-pending-wizard-intent",
  "phoenix-page-wizard-intents",
] as const;

// ============================================
// CSV UTILITIES
// ============================================

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);

  const splitRow = (line: string): string[] => {
    const cols: string[] = [];
    let buf = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { buf += '"'; i++; }
        else q = !q;
      } else if (ch === "," && !q) {
        cols.push(buf.trim());
        buf = "";
      } else {
        buf += ch;
      }
    }
    cols.push(buf.trim());
    return cols;
  };

  const nonEmpty = lines.filter(l => l.trim().length > 0);
  if (nonEmpty.length === 0) return { headers: [], rows: [] };
  const headers = splitRow(nonEmpty[0]);
  const rows = nonEmpty.slice(1).map(splitRow);
  return { headers, rows };
}

interface TargetField {
  label: string;
  id: string;
  storageKeys: string[];
}

/**
 * Зводить назву колонки CSV / лейбл візарда / field id до одного ключа:
 * ігнорує регістр, пробіли, _, - та зводить % до «percent» (Native % ≈ Native_Percent, Progress_From ≈ % Progress from).
 */
function fuzzyFieldKey(raw: string): string {
  let x = raw.toLowerCase().trim().replace(/%/g, "percent");
  x = x.replace(/[^a-z0-9]+/g, "");
  x = x.replace(/^percent+/, "");
  x = x.replace(/percent+$/, "");
  return x;
}

/**
 * Додаткове порівняння після fuzzyFieldKey: «CC %» дає суфікс ...percent, який зрізається → «cc»,
 * тоді як CSV «CC_Percent» лишається «ccpercent» — без цього Seed Price / відсотки не мапляться.
 */
function fuzzyKeysMatch(a: string, b: string): boolean {
  const fa = fuzzyFieldKey(a);
  const fb = fuzzyFieldKey(b);
  if (!fa || !fb) return false;
  if (fa === fb) return true;
  if (fa + "percent" === fb || fb + "percent" === fa) return true;
  if ("percent" + fa === fb || "percent" + fb === fa) return true;
  return false;
}

function collectTargetFields(spec: UISpec, createSpec: CreatePageSpec): TargetField[] {
  const targets: TargetField[] = [];
  const seen = new Set<string>();

  const add = (label: string, id: string, keys: string[]) => {
    const norm = label.toLowerCase().trim();
    const existing = targets.find(t => t.label.toLowerCase().trim() === norm);
    if (existing) {
      for (const k of keys) if (!existing.storageKeys.includes(k)) existing.storageKeys.push(k);
    } else {
      targets.push({ label, id, storageKeys: [...keys] });
    }
    seen.add(norm);
  };

  // Table columns
  if (spec.table?.columns) {
    for (const col of spec.table.columns) {
      if (col.id === "actions") continue;
      if (col.type === "duration" && col.durationStartFieldId && col.durationEndFieldId) {
        add(col.label, col.id, [col.id, col.durationStartFieldId, col.durationEndFieldId]);
      } else {
        add(col.label, col.id, [col.id]);
      }
    }
  }

  // Create page sections
  const walkAccordionBlocks = (blocks: AccordionContentBlock[], accordionId: string, pathPrefix: string) => {
    for (const b of blocks) {
      if (b.type === "field-row") {
        for (const f of b.fields) {
          if (f.type === "section-heading" || f.type === "action-button") continue;
          add(f.label, f.id, [`accordion-${accordionId}-${f.id}`, f.id]);
        }
      } else if (b.type === "child-section") {
        walkSections([b.section], pathPrefix);
      } else if (b.type === "tabbed") {
        for (const t of b.tabs) walkAccordionBlocks(t.blocks, accordionId, pathPrefix);
      }
    }
  };

  const walkSections = (sections: SectionSpec[], prefix: string) => {
    for (const sec of sections) {
      switch (sec.type) {
        case "accordion-list":
          if (sec.itemTemplate.blocks?.length) {
            walkAccordionBlocks(sec.itemTemplate.blocks, sec.id, prefix);
          } else if (sec.itemTemplate.fields) {
            for (const f of sec.itemTemplate.fields) {
              add(f.label, f.id, [`accordion-${sec.id}-${f.id}`, f.id]);
            }
          }
          if (sec.itemTemplate.children) walkSections(sec.itemTemplate.children, prefix);
          break;
        case "form":
          for (const f of sec.fields) {
            add(f.label, f.id, [f.id, `section-${sec.id}-${f.id}`]);
          }
          break;
        case "simple-list":
          for (const f of sec.itemTemplate.fields) {
            add(f.label, f.id, [f.id]);
          }
          break;
        case "editable-table":
          for (const col of sec.columns) {
            add(col.label, col.id, [col.id, `${sec.id}-${col.id}`]);
          }
          break;
      }
    }
  };

  if (createSpec.sections) walkSections(createSpec.sections, "");

  // Properties panel
  if (createSpec.properties?.sections) {
    for (const sec of createSpec.properties.sections) {
      for (const f of sec.fields) {
        add(f.label, f.id, [`prop-${sec.id}-${f.id}`, f.id]);
      }
    }
  }

  return targets;
}

/**
 * Resolve a table cell / field value from Save & Close formData (keys like prop-section-fieldId, accordion-*, etc.)
 */
function pickFieldValueFromRowData(
  rowData: Record<string, string>,
  fieldId: string,
  targets: TargetField[],
): string {
  const colId = fieldId;
  const lowerCol = colId.toLowerCase();

  const nonEmpty = (v: string | undefined) => (v !== undefined && v !== "" ? v : "");

  const keyVariants = new Set<string>([colId]);
  if (colId.length > 0) {
    keyVariants.add(colId.charAt(0).toUpperCase() + colId.slice(1));
    keyVariants.add(colId.charAt(0).toLowerCase() + colId.slice(1));
  }
  for (const key of keyVariants) {
    const val = nonEmpty(rowData[key]);
    if (val) return val;
  }

  const target = targets.find((t) => t.id === colId);
  if (target) {
    for (const key of target.storageKeys) {
      const found = nonEmpty(rowData[key]);
      if (found) return found;
    }
  }

  for (const t of targets) {
    if (t.storageKeys.includes(colId)) {
      for (const key of t.storageKeys) {
        const found = nonEmpty(rowData[key]);
        if (found) return found;
      }
    }
  }

  for (const [k, val] of Object.entries(rowData)) {
    if (!nonEmpty(val)) continue;
    const kl = k.toLowerCase();
    if (kl === lowerCol) return val;
    if (kl.endsWith(`-${lowerCol}`)) return val;
  }

  const wantFk = fuzzyFieldKey(colId);
  if (wantFk) {
    for (const [k, val] of Object.entries(rowData)) {
      if (nonEmpty(val) && fuzzyKeysMatch(k, colId)) return val;
    }
  }

  return "";
}

// --- Wizard → CreatePageSpec (accordion blocks: sections, buttons, tables, tabs) ---

function mapWizardRawToPropertyType(rawType: string, forceReadOnly: boolean): PropertyFieldType {
  if (forceReadOnly) return "readonly";
  const m: Record<string, PropertyFieldType> = {
    input: "input",
    textarea: "textarea",
    select: "select",
    "multi-select": "multi-select",
    "date-time": "date-time",
    number: "number",
    coins: "coins",
    diamonds: "diamonds",
    percents: "percents",
    url: "url",
    toggle: "toggle",
    readonly: "readonly",
  };
  return m[rawType] ?? "input";
}

function wizardFieldToPropertyField(f: Record<string, unknown>): PropertyField {
  const rawType = String(f.type ?? "input");
  const isReadOnly = rawType === "readonly" || Boolean(f.readOnly);
  const type = mapWizardRawToPropertyType(rawType === "readonly" ? "input" : rawType, isReadOnly);
  return {
    id: String(f.id ?? ""),
    label: String(f.label ?? ""),
    type,
    required: Boolean(f.required),
    placeholder: f.placeholder ? String(f.placeholder) : undefined,
    autoGenerated: Boolean(f.autoGenerated),
    copyable: Boolean(f.copyable),
    readOnly: isReadOnly || undefined,
    rowId: f.rowId ? String(f.rowId) : undefined,
  };
}

function groupPropertyFieldsIntoRows(fields: PropertyField[]): PropertyField[][] {
  const rows: PropertyField[][] = [];
  const seen = new Set<string>();
  for (const field of fields) {
    const rid = field.rowId ?? field.id;
    if (seen.has(rid)) continue;
    seen.add(rid);
    rows.push(fields.filter(fi => (fi.rowId ?? fi.id) === rid));
  }
  return rows;
}

function flushFieldBufferToBlocks(buf: PropertyField[]): AccordionContentBlock[] {
  if (buf.length === 0) return [];
  return groupPropertyFieldsIntoRows(buf).map(fields => ({ type: "field-row" as const, fields }));
}

function wizardTableToEditableSection(tableItem: Record<string, unknown>, sectionId: string): EditableTableSpec {
  const id = String(tableItem.id ?? "table");
  const cols = (tableItem.columns as Array<Record<string, unknown>>) ?? [];
  const allowedCol = new Set(["input", "number", "select", "readonly", "coins", "diamonds", "custom-picker"]);
  return {
    type: "editable-table",
    id: `${sectionId}-nested-${id}`,
    title: "",
    addLabel: "+ Add Row",
    columns: cols.map((col: Record<string, unknown>) => {
      const ct = String(col.type ?? "input");
      const type = (allowedCol.has(ct) ? ct : "input") as import("@/features/agent/types").EditableColumnType;
      return {
        id: String(col.id ?? ""),
        label: String(col.label ?? ""),
        type,
      };
    }),
    hasDragHandle: true,
  };
}

function wizardItemsToAccordionBlocks(rawItems: Array<Record<string, unknown>>, sectionId: string): AccordionContentBlock[] {
  const blocks: AccordionContentBlock[] = [];
  let fieldBuf: PropertyField[] = [];

  const flush = () => {
    blocks.push(...flushFieldBufferToBlocks(fieldBuf));
    fieldBuf = [];
  };

  for (const it of rawItems) {
    const kind = String(it.kind ?? "field");
    if (kind === "field" || !it.kind) {
      fieldBuf.push(wizardFieldToPropertyField(it));
      continue;
    }
    flush();
    if (kind === "section") {
      blocks.push({
        type: "field-row",
        fields: [{ id: String(it.id ?? "section"), type: "section-heading", label: String(it.title ?? "") }],
      });
    } else if (kind === "action") {
      blocks.push({
        type: "field-row",
        fields: [{ id: String(it.id ?? "action"), type: "action-button", label: String(it.label ?? "Button") }],
      });
    } else if (kind === "table") {
      blocks.push({ type: "child-section", section: wizardTableToEditableSection(it, sectionId) });
    } else if (kind === "tabs") {
      const tabDefs = (it.tabs as Array<Record<string, unknown>>) ?? [];
      blocks.push({
        type: "tabbed",
        tabs: tabDefs.map(tab => ({
          id: String(tab.id ?? ""),
          label: String(tab.label ?? "Tab"),
          blocks: wizardItemsToAccordionBlocks((tab.items as Array<Record<string, unknown>>) ?? [], `${sectionId}-${String(tab.id)}`),
        })),
      });
    }
  }
  flush();
  return blocks;
}

function autoMapHeaders(csvHeaders: string[], targets: TargetField[]): Map<number, TargetField[]> {
  const mapping = new Map<number, TargetField[]>();
  const normHeaders = csvHeaders.map(h => h.toLowerCase().trim());
  const matched = new Set<TargetField>();

  // Pass 1: exact label match
  for (let i = 0; i < normHeaders.length; i++) {
    for (const t of targets) {
      if (matched.has(t)) continue;
      if (t.label.toLowerCase().trim() === normHeaders[i]) {
        mapping.set(i, [...(mapping.get(i) || []), t]);
        matched.add(t);
      }
    }
  }

  // Pass 2: exact ID match
  for (let i = 0; i < normHeaders.length; i++) {
    for (const t of targets) {
      if (matched.has(t)) continue;
      if (t.id.toLowerCase() === normHeaders[i]) {
        mapping.set(i, [...(mapping.get(i) || []), t]);
        matched.add(t);
      }
    }
  }

  // Pass 2.5: fuzzy key — CSV Snake_Case vs візард ("Price Point", "% Progress from", kebab-case id)
  for (let i = 0; i < csvHeaders.length; i++) {
    const fk = fuzzyFieldKey(csvHeaders[i]);
    if (!fk) continue;
    for (const t of targets) {
      if (matched.has(t)) continue;
      if (fuzzyKeysMatch(csvHeaders[i], t.label) || fuzzyKeysMatch(csvHeaders[i], t.id)) {
        mapping.set(i, [...(mapping.get(i) || []), t]);
        matched.add(t);
      }
    }
  }

  // Pass 3: contains match
  for (let i = 0; i < normHeaders.length; i++) {
    for (const t of targets) {
      if (matched.has(t)) continue;
      const normLabel = t.label.toLowerCase().trim();
      if (normHeaders[i].includes(normLabel) || normLabel.includes(normHeaders[i])) {
        mapping.set(i, [...(mapping.get(i) || []), t]);
        matched.add(t);
      }
    }
  }

  return mapping;
}

function buildRowsFromCsv(
  csvRows: string[][],
  mapping: Map<number, TargetField[]>,
): Record<string, string>[] {
  return csvRows.map(row => {
    const now = new Date().toISOString();
    const obj: Record<string, string> = { _createdAt: String(Date.now() + Math.random() * 1000) };
    for (const [csvIdx, targets] of mapping.entries()) {
      const val = row[csvIdx] ?? "";
      for (const t of targets) {
        for (const key of t.storageKeys) {
          obj[key] = val;
        }
      }
    }
    if (!obj["created-at"]) obj["created-at"] = now;
    if (!obj["updated-at"]) obj["updated-at"] = now;
    return obj;
  });
}

interface FeatureRequest {
  id: string;
  pageId: string;
  title: string;
  description: string;
  navigation: NavigationConfig;
  parentSectionLabel: string;
  spec: UISpec;
  createPageSpec: CreatePageSpec;
  /** Повний стан візарду для кнопки «Edit in Wizard» */
  wizardIntent?: WizardIntent;
  createdAt: string;
  columnCount: number;
  actionCount: number;
}

// Icons
const PhoenixIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2C6 2 3 5 3 9C3 11 4 13 6 14L5 18L10 16L15 18L14 14C16 13 17 11 17 9C17 5 14 2 10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7" cy="8" r="1" fill="currentColor"/>
    <circle cx="13" cy="8" r="1" fill="currentColor"/>
    <path d="M8 11C8 11 9 12 10 12C11 12 12 11 12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const AgentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L2 6L10 10L18 6L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 14L10 18L18 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 10L10 14L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ComponentsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AudiencesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 17C4 14 6.5 12 10 12C13.5 12 16 14 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V12C17 13.1046 16.1046 14 15 14H7L3 17V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BannersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 9H17" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const GiftsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 8V18" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 11H17" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 8C6 6 7.5 4 10 4C12.5 4 14 6 14 8" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const FeaturesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const TagsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 10V4C3 3.44772 3.44772 3 4 3H10L17 10L10 17L3 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="7" cy="7" r="1" fill="currentColor"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 6V10L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/**
 * App Switcher Dropdown
 */
function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    { id: "phoenix", name: "Phoenix", icon: <PhoenixIcon />, active: true, href: "/phoenix" },
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
 * Navigation Item
 */
function NavItem({ 
  icon, 
  label, 
  active = false,
  hasSubmenu = false,
  expanded = false,
  onClick,
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  hasSubmenu?: boolean;
  expanded?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-medium"
          : "text-[var(--color-base-secondary)] hover:bg-[var(--color-base-surface-secondary)] hover:text-[var(--color-base-primary)]"
      }`}
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {hasSubmenu && (
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

/**
 * Sub Navigation Item
 */
function SubNavItem({ label, active = false, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left pl-11 pr-3 py-1.5 text-sm rounded-lg transition-colors ${
        active
          ? "text-[var(--color-brand-primary)] font-medium"
          : "text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Feature Requests Dropdown
 */
function FeatureRequestsDropdown({
  requests,
  onApprove,
  onReject,
  onPreview,
}: {
  requests: FeatureRequest[];
  onApprove: (request: FeatureRequest) => void;
  onReject: (requestId: string) => void;
  onPreview: (request: FeatureRequest) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
          requests.length > 0
            ? "border-[var(--color-status-warning)] text-[var(--color-status-warning)] hover:bg-[var(--color-status-warning)]/5"
            : "border-[var(--color-base-stroke)] text-[var(--color-base-secondary)] hover:bg-[var(--color-base-surface-secondary)]"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 3H13V11L10 9H3V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M5 11V13L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        Feature Requests
        {requests.length > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-status-warning)] text-white text-xs font-bold">
            {requests.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-[380px] bg-[var(--color-base-surface-primary)] border border-[var(--color-base-stroke)] rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-[var(--color-base-stroke)]">
            <h3 className="text-sm font-semibold text-[var(--color-base-primary)]">
              Feature Requests
            </h3>
            <p className="text-xs text-[var(--color-base-tertiary)] mt-0.5">
              Pages awaiting approval before being added to navigation
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-[var(--color-base-tertiary)]">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <p className="text-sm text-[var(--color-base-tertiary)]">No pending requests</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="px-4 py-3 border-b border-[var(--color-base-stroke)] last:border-b-0 hover:bg-[var(--color-base-surface-secondary)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--color-base-primary)]">
                          {request.title}
                        </span>
                        <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)]">
                          Pending
                        </span>
                      </div>
                      {request.description && (
                        <p className="text-xs text-[var(--color-base-tertiary)] mt-0.5 truncate">
                          {request.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--color-base-tertiary)]">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-base-surface-secondary)]">
                          Table + Create Page
                        </span>
                        <span>{request.columnCount} columns</span>
                        <span>{request.actionCount} actions</span>
                        <span>
                          {request.navigation.isNewSection
                            ? `New section: ${request.parentSectionLabel}`
                            : `Section: ${request.parentSectionLabel}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => {
                        onApprove(request);
                        if (requests.length <= 1) setIsOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-status-success)] text-white hover:opacity-90 transition-opacity"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        onReject(request.id);
                        if (requests.length <= 1) setIsOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-base-stroke)] text-[var(--color-base-secondary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        onPreview(request);
                        setIsOpen(false);
                      }}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3C4.5 3 1.5 6.5 1 8C1.5 9.5 4.5 13 8 13C11.5 13 14.5 9.5 15 8C14.5 6.5 11.5 3 8 3Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ICON_MAP: Record<string, React.ReactNode> = {
  audiences: <AudiencesIcon />,
  chat: <ChatIcon />,
  banners: <BannersIcon />,
  gifts: <GiftsIcon />,
  features: <FeaturesIcon />,
  tags: <TagsIcon />,
  calendar: <CalendarIcon />,
  history: <HistoryIcon />,
};

function getIconForSection(iconKey: string): React.ReactNode {
  return ICON_MAP[iconKey] || <FeaturesIcon />;
}

export default function PhoenixPage() {
  const [navState, setNavState] = useState({ sections: DEFAULT_SECTIONS });
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    gifts: true,
  });
  const [activePage, setActivePage] = useState<string | null>(null);
  const [pageSpecs, setPageSpecs] = useState<Record<string, UISpec>>({});
  const [createPageSpecs, setCreatePageSpecs] = useState<Record<string, CreatePageSpec>>({});
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [previewingRequest, setPreviewingRequest] = useState<FeatureRequest | null>(null);
  const [activeCreatePage, setActiveCreatePage] = useState<string | null>(null);
  const [savedTableRows, setSavedTableRows] = useState<Record<string, Record<string, string>[]>>({});
  /** Збережений WizardIntent після апруву — для «Edit in Wizard» на сторінці */
  const [pageWizardIntents, setPageWizardIntents] = useState<Record<string, WizardIntent>>({});
  /** When set, create form is in edit mode for this row; Save & Close updates instead of appending */
  const [editingRow, setEditingRow] = useState<{ pageId: string; rowIndex: number } | null>(null);
  const [debugResetOpen, setDebugResetOpen] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleDebugResetConfirm = useCallback(() => {
    const freshNav = JSON.parse(JSON.stringify({ sections: DEFAULT_SECTIONS })) as { sections: NavSection[] };
    saveNavigation(freshNav);
    for (const k of PHOENIX_CLEARABLE_STORAGE_KEYS) {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    }
    setNavState(freshNav);
    setPageSpecs({});
    setCreatePageSpecs({});
    setSavedTableRows({});
    setPageWizardIntents({});
    setFeatureRequests([]);
    setActivePage(null);
    setPreviewingRequest(null);
    setActiveCreatePage(null);
    setEditingRow(null);
    setExpandedMenus({ gifts: true });
    setDebugResetOpen(false);
  }, []);

  type CsvImportContext = {
    spec: UISpec;
    createPageSpec: CreatePageSpec;
    storagePageId: string;
  };

  const handleCsvImport = useCallback((csvText: string, ctx: CsvImportContext) => {
    const { headers, rows } = parseCsv(csvText);
    if (headers.length === 0 || rows.length === 0) return;

    const targets = collectTargetFields(ctx.spec, ctx.createPageSpec);
    const mapping = autoMapHeaders(headers, targets);
    const newRows = buildRowsFromCsv(rows, mapping);

    setSavedTableRows(prev => ({
      ...prev,
      [ctx.storagePageId]: [...(prev[ctx.storagePageId] || []), ...newRows],
    }));
  }, []);

  const handleCsvFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return;
        if (previewingRequest) {
          handleCsvImport(reader.result, {
            spec: previewingRequest.spec,
            createPageSpec: previewingRequest.createPageSpec,
            storagePageId: `preview-${previewingRequest.pageId}`,
          });
        } else if (activePage && pageSpecs[activePage] && createPageSpecs[activePage]) {
          handleCsvImport(reader.result, {
            spec: pageSpecs[activePage],
            createPageSpec: createPageSpecs[activePage],
            storagePageId: activePage,
          });
        } else {
          alert("Немає контексту для імпорту CSV (відкрийте прев’ю або сторінку з таблицею та create page).");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [previewingRequest, activePage, pageSpecs, createPageSpecs, handleCsvImport],
  );

  useEffect(() => {
    setPreviewingRequest(prev => {
      if (!prev) return prev;
      const fresh = featureRequests.find(r => r.id === prev.id);
      return fresh ?? prev;
    });
  }, [featureRequests]);

  const hydrated = useRef(false);
  const skipFirstWrite = useRef({
    featureRequests: true,
    pageSpecs: true,
    createPageSpecs: true,
    savedTableRows: true,
    pageWizardIntents: true,
  });

  useEffect(() => {
    setNavState(getNavigation());
    let loadedRequests: FeatureRequest[] = [];
    try {
      const storedRequests = localStorage.getItem("phoenix-feature-requests");
      if (storedRequests) {
        loadedRequests = JSON.parse(storedRequests);
        setFeatureRequests(loadedRequests);
      }
      const storedSpecs = localStorage.getItem("phoenix-page-specs");
      if (storedSpecs) setPageSpecs(JSON.parse(storedSpecs));
      const storedCreateSpecs = localStorage.getItem("phoenix-create-page-specs");
      if (storedCreateSpecs) setCreatePageSpecs(JSON.parse(storedCreateSpecs));
      const storedRows = localStorage.getItem("phoenix-saved-table-rows");
      if (storedRows) setSavedTableRows(JSON.parse(storedRows));
      const storedWizardIntents = localStorage.getItem("phoenix-page-wizard-intents");
      if (storedWizardIntents) setPageWizardIntents(JSON.parse(storedWizardIntents));
    } catch {}

    try {
      const pendingRaw = localStorage.getItem("phoenix-pending-wizard-intent");
      console.log("[Phoenix] Checking pending intent:", pendingRaw ? "FOUND" : "NOT FOUND");
      if (pendingRaw) {
        localStorage.removeItem("phoenix-pending-wizard-intent");
        const parsed = JSON.parse(pendingRaw) as
          | WizardIntent
          | { intent: WizardIntent; replaceRequestId?: string; editApprovedPageId?: string };
        const intent = parsed && typeof parsed === "object" && "intent" in parsed
          ? (parsed as { intent: WizardIntent }).intent
          : (parsed as WizardIntent);
        const replaceRequestId = parsed && typeof parsed === "object" && "intent" in parsed && "replaceRequestId" in parsed
          ? String((parsed as { replaceRequestId?: string }).replaceRequestId || "")
          : "";
        const editApprovedPageId = parsed && typeof parsed === "object" && "intent" in parsed && "editApprovedPageId" in parsed
          ? String((parsed as { editApprovedPageId?: string }).editApprovedPageId || "")
          : "";

        if (editApprovedPageId && intent) {
          const spec = buildSpecFromIntent(intent);
          const createSpec = buildCreatePageSpec(intent);
          setPageSpecs(prev => ({ ...prev, [editApprovedPageId]: spec }));
          if (createSpec) {
            setCreatePageSpecs(prev => ({ ...prev, [editApprovedPageId]: createSpec }));
          }
          setPageWizardIntents(prev => ({ ...prev, [editApprovedPageId]: intent }));
          setNavState(prev => {
            const next = updatePageLabel(prev, editApprovedPageId, intent.title);
            saveNavigation(next);
            return next;
          });
          setActivePage(editApprovedPageId);
          setPreviewingRequest(null);
        } else {
          console.log("[Phoenix] Parsed intent:", {
            title: intent.title,
            replaceRequestId: replaceRequestId || undefined,
            tableColumns: intent.selectedFields?.tableColumns?.length,
            columns: intent.selectedFields?.tableColumns?.map(c => c.label),
            actions: Object.entries(intent.rowActions || {}).filter(([, v]) => v).map(([k]) => k),
            sections: intent.createPageConfig?.sections?.length,
            propertiesFields: intent.createPageConfig?.propertiesPanel?.sections?.flatMap((s: { fields: Array<{ label: string }> }) => s.fields.map(f => f.label)),
          });
          const nav = getNavigation();
          const pageId = titleToFeatureId(intent.title);
          const spec = buildSpecFromIntent(intent);
          const createSpec = buildCreatePageSpec(intent);
          const actionCount = Object.values(intent.rowActions).filter(Boolean).length;
          const parentLabel = intent.navigation.isNewSection
            ? intent.navigation.newSectionName
            : nav.sections.find((s: NavSection) => s.id === intent.navigation.parentSection)?.label || intent.navigation.parentSection || "";

          const baseRequest: Omit<FeatureRequest, "id" | "createdAt"> = {
            pageId,
            title: intent.title,
            description: intent.description,
            navigation: intent.navigation,
            parentSectionLabel: parentLabel,
            spec,
            createPageSpec: createSpec!,
            wizardIntent: intent,
            columnCount: intent.selectedFields.tableColumns.length,
            actionCount,
          };

          let updatedRequests: FeatureRequest[];
          if (replaceRequestId) {
            const idx = loadedRequests.findIndex(r => r.id === replaceRequestId);
            if (idx >= 0) {
              const prev = loadedRequests[idx];
              updatedRequests = [...loadedRequests];
              updatedRequests[idx] = {
                ...prev,
                ...baseRequest,
                id: prev.id,
                createdAt: prev.createdAt,
              };
            } else {
              updatedRequests = [{ id: `fr-${Date.now()}`, createdAt: new Date().toISOString(), ...baseRequest }, ...loadedRequests];
            }
          } else {
            updatedRequests = [{ id: `fr-${Date.now()}`, createdAt: new Date().toISOString(), ...baseRequest }, ...loadedRequests];
          }

          setFeatureRequests(updatedRequests);
          localStorage.setItem("phoenix-feature-requests", JSON.stringify(updatedRequests));
        }
      }
    } catch {}

    hydrated.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (skipFirstWrite.current.featureRequests) {
      skipFirstWrite.current.featureRequests = false;
      return;
    }
    localStorage.setItem("phoenix-feature-requests", JSON.stringify(featureRequests));
  }, [featureRequests]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (skipFirstWrite.current.savedTableRows) {
      skipFirstWrite.current.savedTableRows = false;
      return;
    }
    localStorage.setItem("phoenix-saved-table-rows", JSON.stringify(savedTableRows));
  }, [savedTableRows]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (skipFirstWrite.current.pageSpecs) {
      skipFirstWrite.current.pageSpecs = false;
      return;
    }
    localStorage.setItem("phoenix-page-specs", JSON.stringify(pageSpecs));
  }, [pageSpecs]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (skipFirstWrite.current.createPageSpecs) {
      skipFirstWrite.current.createPageSpecs = false;
      return;
    }
    localStorage.setItem("phoenix-create-page-specs", JSON.stringify(createPageSpecs));
  }, [createPageSpecs]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (skipFirstWrite.current.pageWizardIntents) {
      skipFirstWrite.current.pageWizardIntents = false;
      return;
    }
    localStorage.setItem("phoenix-page-wizard-intents", JSON.stringify(pageWizardIntents));
  }, [pageWizardIntents]);

  const openApprovedPageInWizard = useCallback(() => {
    if (!activePage) return;
    const intent = pageWizardIntents[activePage];
    if (!intent) return;
    try {
      sessionStorage.setItem(
        "phoenix-wizard-bootstrap",
        JSON.stringify({ intent, editApprovedPageId: activePage }),
      );
    } catch {
      return;
    }
    window.location.href = "/wizard";
  }, [activePage, pageWizardIntents]);

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const buildSpecFromIntent = useCallback((intent: WizardIntent): UISpec => {
    const pageId = titleToFeatureId(intent.title);

    const dataTypeToColumnType = (dataType: string): TableColumn["type"] => {
      const mapping: Record<string, TableColumn["type"]> = {
        string: "text", number: "number", date: "date",
        enum: "status", boolean: "text", user: "text",
        media: "text", id: "text",
        duration: "duration", live: "live",
      };
      return mapping[dataType] || "text";
    };

    const columns: TableColumn[] = intent.selectedFields.tableColumns.map((field) => {
      const base: TableColumn = {
        id: field.id,
        label: field.label,
        type: dataTypeToColumnType(field.dataType),
        sortable: ["date", "number", "string", "user"].includes(field.dataType),
        ...(field.dataType === "id" ? { width: "80px" } : {}),
        ...(field.copyable ? { copyable: true } : {}),
      };
      if (field.dataType === "duration" && field.durationStartFieldId && field.durationEndFieldId) {
        return {
          ...base,
          type: "duration",
          durationStartFieldId: field.durationStartFieldId,
          durationEndFieldId: field.durationEndFieldId,
          sortable: false,
        };
      }
      if (field.dataType === "live") {
        return { ...base, type: "live", sortable: false, width: "80px" };
      }
      return base;
    });

    const hasAnyRowAction = intent.rowActions.viewDetails || intent.rowActions.edit ||
      intent.rowActions.duplicate || intent.rowActions.approve ||
      intent.rowActions.reject || intent.rowActions.delete;

    if (hasAnyRowAction) {
      columns.push({
        id: "actions", label: "Actions", type: "actions", width: "140px",
        actions: {
          view: intent.rowActions.viewDetails,
          edit: intent.rowActions.edit,
          duplicate: intent.rowActions.duplicate,
          delete: intent.rowActions.delete,
        },
      });
    }

    return {
      version: "1.0",
      page: { id: pageId, title: intent.title, description: intent.description },
      toolbar: {
        search: intent.filters.freeTextSearch,
        filters: Object.entries(intent.filters.fieldFilters || {})
          .filter(([, enabled]) => enabled)
          .map(([fieldId]) => {
            const field = intent.selectedFields.tableColumns.find(f => f.id === fieldId);
            return {
              id: fieldId,
              label: field?.label || fieldId.charAt(0).toUpperCase() + fieldId.slice(1).replace(/-/g, " "),
              type: "select" as const,
            };
          }),
        actions: [
          { id: "create", label: "Create", variant: "primary" as const, icon: "plus" },
        ],
      },
      table: {
        columns,
        pagination: true,
        selectable:
          (intent.bulkActions.multiselect ?? false) ||
          intent.bulkActions.approveSelected ||
          intent.bulkActions.rejectSelected,
      },
    };
  }, []);

  const buildCreatePageSpec = useCallback((intent: WizardIntent): CreatePageSpec | null => {
    const cfg = intent.createPageConfig;
    if (!cfg) return null;

    const convertSections = (cfgSections: typeof cfg.sections): import("@/features/agent/types").SectionSpec[] => {
      return cfgSections.map(s => {
        const c = s.config as Record<string, unknown>;
        switch (s.type) {
          case "form":
            return {
              type: "form" as const,
              id: s.id,
              title: s.title,
              fields: (c.fields as Array<Record<string, unknown>> || []).map((f: Record<string, unknown>) => {
                const rawType = String(f.type || "input");
                const isReadOnly = rawType === "readonly" || Boolean(f.readOnly);
                const type = (isReadOnly ? "input" : rawType) as import("@/features/agent/types").FormFieldType;
                return {
                  id: String(f.id || ""),
                  label: String(f.label || ""),
                  type,
                  required: Boolean(f.required),
                  width: (f.width as "full" | "half" | "third") || "full",
                  autoGenerated: Boolean(f.autoGenerated),
                  placeholder: f.placeholder ? String(f.placeholder) : undefined,
                  readOnly: isReadOnly || undefined,
                };
              }),
            };
          case "accordion-list": {
            const rawItems = (c.items ?? c.fields ?? []) as Array<Record<string, unknown>>;
            const fieldItems = rawItems.filter((it: Record<string, unknown>) => !it.kind || it.kind === "field");
            const blocks = wizardItemsToAccordionBlocks(rawItems, s.id);

            const existingChildren = c.children
              ? convertSections((c.children as typeof cfg.sections).map((ch: Record<string, unknown>) => ({
                  id: `${s.id}-child-${ch.title || "section"}`,
                  type: String(ch.type || "form") as typeof s.type,
                  title: String(ch.title || "Section"),
                  config: ch.fields ? { fields: ch.fields } : {},
                })))
              : [];

            const legacyFields = fieldItems.map((f: Record<string, unknown>) => {
              const rawType = String(f.type ?? "input");
              const isReadOnly = rawType === "readonly" || Boolean(f.readOnly);
              const type = mapWizardRawToPropertyType(rawType === "readonly" ? "input" : rawType, isReadOnly);
              return {
                id: String(f.id ?? ""),
                label: String(f.label ?? ""),
                type,
                required: Boolean(f.required),
                placeholder: f.placeholder ? String(f.placeholder) : undefined,
                autoGenerated: Boolean(f.autoGenerated),
                copyable: Boolean(f.copyable),
                readOnly: isReadOnly || undefined,
                rowId: f.rowId ? String(f.rowId) : undefined,
              };
            });

            return {
              type: "accordion-list" as const,
              id: s.id,
              addLabel: String(c.addLabel || "+ Add Item"),
              itemTemplate: {
                titleField: s.title,
                hasStatusToggle: Boolean(c.hasStatusToggle),
                actions: (c.actions as ("copy" | "view" | "delete")[]) || ["copy", "delete"],
                ...(blocks.length > 0 ? { blocks } : { fields: legacyFields }),
                ...(existingChildren.length > 0 ? { children: existingChildren } : {}),
              },
            };
          }
          case "editable-table":
            return {
              type: "editable-table" as const,
              id: s.id,
              title: s.title,
              addLabel: String(c.addLabel || "+ Add Row"),
              columns: (c.columns as Array<Record<string, unknown>> || []).map((col: Record<string, unknown>) => ({
                id: String(col.id || ""),
                label: String(col.label || ""),
                type: String(col.type || "input") as import("@/features/agent/types").EditableColumnType,
              })),
              hasDragHandle: Boolean(c.hasDragHandle),
            };
          case "master-detail":
            return {
              type: "master-detail" as const,
              id: s.id,
              masterList: {
                titleField: String(c.titleField || "Item"),
                subtitleTemplate: c.subtitleTemplate ? String(c.subtitleTemplate) : undefined,
                actions: (c.actions as ("view" | "delete")[]) || ["delete"],
              },
              detailSections: c.detailChildren
                ? convertSections((c.detailChildren as typeof cfg.sections).map((ch: Record<string, unknown>) => ({
                    id: `${s.id}-detail-${ch.title || "section"}`,
                    type: String(ch.type || "form") as typeof s.type,
                    title: String(ch.title || "Section"),
                    config: ch.fields ? { fields: ch.fields } : {},
                  })))
                : [],
              addLabel: String(c.addLabel || "+ Add Item"),
            };
          case "media-upload":
            return {
              type: "media-upload" as const,
              id: s.id,
              title: s.title,
              accept: (c.accept as "image" | "file") || "image",
              modes: (c.modes as ("upload" | "url")[]) || ["upload", "url"],
              showPreview: Boolean(c.showPreview),
            };
          case "simple-list":
            return {
              type: "simple-list" as const,
              id: s.id,
              addLabel: String(c.addLabel || "+ Add Item"),
              itemTemplate: {
                fields: ((c.items ?? c.fields ?? []) as Array<Record<string, unknown>>).filter((it: Record<string, unknown>) => !it.kind || it.kind === "field").map((f: Record<string, unknown>) => {
                  const rawType = String(f.type || "input");
                  const isReadOnly = rawType === "readonly" || Boolean(f.readOnly);
                  const type = (isReadOnly ? "input" : rawType) as import("@/features/agent/types").FormFieldType;
                  return {
                    id: String(f.id || ""),
                    label: String(f.label || ""),
                    type,
                    width: "full" as const,
                    readOnly: isReadOnly || undefined,
                  };
                }),
              },
            };
          default:
            return {
              type: "form" as const,
              id: s.id,
              title: s.title,
              fields: [],
            };
        }
      });
    };

    return {
      entityName: intent.title,
      sections: convertSections(cfg.sections),
      properties: {
        statusToggle: cfg.propertiesPanel.statusToggle,
        statusLabel: cfg.propertiesPanel.statusLabel,
        sections: cfg.propertiesPanel.sections.map(s => ({
          id: s.id,
          title: s.title,
          fields: s.fields.map(f => {
            const rawType = String(f.type);
            const isReadOnly = rawType === "readonly" || Boolean(f.readOnly);
            const type = mapWizardRawToPropertyType(rawType === "readonly" ? "input" : rawType, isReadOnly);
            return {
              id: f.id,
              label: f.label,
              type,
              required: f.required,
              autoGenerated: f.autoGenerated,
              placeholder: f.placeholder,
              readOnly: isReadOnly || undefined,
            };
          }),
        })),
        showDelete: cfg.propertiesPanel.showDelete,
      },
      actions: {
        saveChanges: cfg.saveChanges,
        saveAndClose: cfg.saveAndClose,
      },
      toolbar: cfg.showToolbar ? {
        showAddButton: true,
        addLabel: `+ Add ${intent.title}`,
        showExpandCollapse: true,
      } : undefined,
    };
  }, []);


  const handleApproveRequest = useCallback((request: FeatureRequest) => {
    const nav = request.navigation;
    let updated = navState;

    if (nav.isNewSection && nav.newSectionName) {
      const sectionId = titleToFeatureId(nav.newSectionName);
      const newSection: NavSection = {
        id: sectionId,
        label: nav.newSectionName,
        icon: "features",
        children: [{ id: request.pageId, label: request.title, parentId: sectionId }],
      };
      updated = addNewSection(updated, newSection);
      setExpandedMenus(prev => ({ ...prev, [sectionId]: true }));
    } else if (nav.parentSection) {
      updated = addPageToSection(updated, nav.parentSection, {
        id: request.pageId,
        label: request.title,
        parentId: nav.parentSection,
      });
      setExpandedMenus(prev => ({ ...prev, [nav.parentSection!]: true }));
    }

    setPageSpecs(prev => ({ ...prev, [request.pageId]: request.spec }));
    if (request.createPageSpec) {
      setCreatePageSpecs(prev => ({ ...prev, [request.pageId]: request.createPageSpec }));
    }
    if (request.wizardIntent) {
      setPageWizardIntents(prev => ({ ...prev, [request.pageId]: request.wizardIntent! }));
    }
    setNavState(updated);
    saveNavigation(updated);
    setActivePage(request.pageId);
    setFeatureRequests(prev => prev.filter(r => r.id !== request.id));
  }, [navState]);

  const handleRejectRequest = useCallback((requestId: string) => {
    setFeatureRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  const activePageLabel = activePage
    ? navState.sections.find(s => s.id === activePage)?.label
      || navState.sections.flatMap(s => s.children).find(p => p.id === activePage)?.label
      || null
    : null;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-[var(--color-base-surface-secondary)]">
      {/* Header */}
      <header className="h-14 flex-shrink-0 bg-[var(--color-base-surface-primary)] border-b border-[var(--color-base-stroke)] flex items-center justify-between pl-[6px] pr-4">
        <div className="flex items-center gap-3">
          <AppSwitcher />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDebugResetOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-base-stroke)] text-[var(--color-base-tertiary)] hover:text-[var(--color-status-error)] hover:border-[var(--color-status-error)]/40 hover:bg-[var(--color-status-error)]/5 transition-colors"
            title="Скинути всі апрувнуті сторінки, спеки таблиць, create pages, збережені рядки та чергу запитів (localStorage)"
          >
            Debug reset
          </button>
          <FeatureRequestsDropdown
            requests={featureRequests}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            onPreview={(req) => {
              setPreviewingRequest(req);
              setActivePage(null);
            }}
          />
          <Link
            href="/wizard"
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create with Wizard
          </Link>
        </div>
      </header>

      <ConfirmModal
        isOpen={debugResetOpen}
        onClose={() => setDebugResetOpen(false)}
        onConfirm={handleDebugResetConfirm}
        title="Reset Phoenix (debug)?"
        description="Default navigation will be restored, all approved pages, UISpec / Create page specs, saved table rows, and the feature requests queue will be removed. Wizard drafts (stored elsewhere) will not be affected."
        confirmText="Reset all"
        cancelText="Cancel"
        variant="danger"
      />

      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        aria-hidden
        onChange={handleCsvFileChange}
      />

      {/* Main Layout — min-h-0 щоб flex-дочірні елементи не роздували висоту документа (зайвий скрол body) */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex w-[220px] min-h-0 shrink-0 flex-col bg-[var(--color-base-surface-secondary)] border-r border-[var(--color-base-stroke)]">
          <div className="p-2 flex-1 overflow-y-auto">
            {navState.sections.map((section) => (
              <React.Fragment key={section.id}>
                {section.children.length > 0 ? (
                  <>
                    <NavItem
                      icon={getIconForSection(section.icon)}
                      label={section.label}
                      hasSubmenu
                      expanded={expandedMenus[section.id] || false}
                      onClick={() => toggleMenu(section.id)}
                    />
                    {expandedMenus[section.id] && (
                      <div className="ml-2">
                        {section.children.map((page, pageIndex) => (
                          <SubNavItem
                            key={`${section.id}-${pageIndex}-${page.id}`}
                            label={page.label}
                            active={activePage === page.id}
                            onClick={() => { setPreviewingRequest(null); setActiveCreatePage(null); setEditingRow(null); setActivePage(page.id); }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavItem
                    icon={getIconForSection(section.icon)}
                    label={section.label}
                    active={activePage === section.id}
                    onClick={() => { setPreviewingRequest(null); setActiveCreatePage(null); setEditingRow(null); setActivePage(section.id); }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="p-2 border-t border-[var(--color-base-stroke)]">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Tango Internal
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-base-surface-primary)]">
          {activeCreatePage && createPageSpecs[activeCreatePage] ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <CreatePageRenderer
              spec={createPageSpecs[activeCreatePage]}
              onBack={() => { setActiveCreatePage(null); setEditingRow(null); }}
              initialFormData={editingRow && editingRow.pageId === activeCreatePage
                ? savedTableRows[editingRow.pageId]?.[editingRow.rowIndex]
                : undefined}
              editRowIndex={editingRow && editingRow.pageId === activeCreatePage ? editingRow.rowIndex : undefined}
              onSaveAndClose={(rowData, editRowIndex) => {
                const pageId = activeCreatePage;
                if (!pageId) return;
                const spec = pageId.startsWith("preview-")
                  ? previewingRequest?.spec
                  : pageSpecs[pageId];
                const createSpec = pageId.startsWith("preview-")
                  ? previewingRequest?.createPageSpec
                  : createPageSpecs[pageId];
                const columns = pageId.startsWith("preview-")
                  ? (previewingRequest?.spec?.table?.columns?.filter((c: { id: string }) => c.id !== "actions") ?? [])
                  : (pageSpecs[pageId]?.table?.columns?.filter((c: { id: string }) => c.id !== "actions") ?? []);
                let newRow: Record<string, string>;
                if (rowData && Object.keys(rowData).length > 0 && columns.length > 0 && spec && createSpec) {
                  const targets = collectTargetFields(spec, createSpec);
                  // Keep all form keys (prop-*, accordion-*, …) for Edit roundtrip; add canonical table column keys for the grid.
                  newRow = { ...rowData };
                  for (const col of columns as TableColumn[]) {
                    if (col.type === "duration" && col.durationStartFieldId && col.durationEndFieldId) {
                      const s = pickFieldValueFromRowData(rowData, col.durationStartFieldId, targets);
                      const e = pickFieldValueFromRowData(rowData, col.durationEndFieldId, targets);
                      newRow[col.id] = s && e ? `${s} - ${e}` : pickFieldValueFromRowData(rowData, col.id, targets);
                    } else if (col.type === "live") {
                      newRow[col.id] = pickFieldValueFromRowData(rowData, col.id, targets) || "true";
                    } else {
                      newRow[col.id] = pickFieldValueFromRowData(rowData, col.id, targets);
                    }
                  }
                } else if (columns.length > 0) {
                  newRow = generateDummyData(columns as TableColumn[], 1)[0];
                } else {
                  newRow = { id: String(Date.now()), title: "New item" };
                }
                const now = new Date().toISOString();
                if (editRowIndex !== undefined) {
                  newRow._createdAt = savedTableRows[pageId]?.[editRowIndex]?._createdAt ?? String(Date.now());
                  if (!newRow["created-at"]) {
                    newRow["created-at"] = savedTableRows[pageId]?.[editRowIndex]?.["created-at"] ?? now;
                  }
                  newRow["updated-at"] = now;
                  setSavedTableRows(prev => {
                    const list = [...(prev[pageId] || [])];
                    if (editRowIndex >= 0 && editRowIndex < list.length) list[editRowIndex] = newRow;
                    return { ...prev, [pageId]: list };
                  });
                  setEditingRow(null);
                  setActiveCreatePage(null);
                } else {
                  newRow._createdAt = String(Date.now());
                  if (!newRow["created-at"]) newRow["created-at"] = now;
                  if (!newRow["updated-at"]) newRow["updated-at"] = now;
                  setSavedTableRows(prev => ({
                    ...prev,
                    [pageId]: [...(prev[pageId] || []), newRow],
                  }));
                  setActiveCreatePage(null);
                }
              }}
            />
            </div>
          ) : previewingRequest ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-3 bg-[var(--color-status-warning)]/5 border-b border-[var(--color-status-warning)]/20">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-[var(--color-status-warning)]/10">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-status-warning)]">
                      <path d="M8 3C4.5 3 1.5 6.5 1 8C1.5 9.5 4.5 13 8 13C11.5 13 14.5 9.5 15 8C14.5 6.5 11.5 3 8 3Z" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-base-primary)] truncate">
                      Preview: {previewingRequest.title}
                    </p>
                    <p className="text-xs text-[var(--color-base-tertiary)] truncate">
                      This page is pending approval and not yet in the sidebar navigation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    title={previewingRequest.wizardIntent ? "Відкрити візард з поточною конфігурацією" : "Немає збереженого стану візарду (старий реквест)"}
                    disabled={!previewingRequest.wizardIntent}
                    onClick={() => {
                      if (!previewingRequest.wizardIntent) return;
                      try {
                        sessionStorage.setItem(
                          "phoenix-wizard-bootstrap",
                          JSON.stringify({
                            intent: previewingRequest.wizardIntent,
                            replaceRequestId: previewingRequest.id,
                          }),
                        );
                      } catch {
                        return;
                      }
                      window.location.href = "/wizard";
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      previewingRequest.wizardIntent
                        ? "border-[var(--color-base-stroke)] text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)]"
                        : "border-[var(--color-base-stroke)] text-[var(--color-base-tertiary)] opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                      <path d="M11.333 2L14 4.667L5.333 13.333H2.667V10.667L11.333 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit in Wizard
                  </button>
                  <button
                    onClick={() => {
                      handleRejectRequest(previewingRequest.id);
                      setPreviewingRequest(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--color-base-stroke)] text-[var(--color-base-secondary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Reject
                  </button>
                  <button
                    onClick={() => setPreviewingRequest(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--color-base-stroke)] text-[var(--color-base-secondary)] hover:bg-[var(--color-base-surface-secondary)] transition-colors whitespace-nowrap"
                  >
                    Close Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => csvInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10 transition-colors whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                      <path d="M6.5 9.5L9.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M8.5 11.5L7 13C5.9 14.1 4.1 14.1 3 13C1.9 11.9 1.9 10.1 3 9L4.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M7.5 4.5L9 3C10.1 1.9 11.9 1.9 13 3C14.1 4.1 14.1 5.9 13 7L11.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Upload CSV
                  </button>
                  <button
                    onClick={() => {
                      handleApproveRequest(previewingRequest);
                      setPreviewingRequest(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--color-status-success)] text-white hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                      <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Approve Feature
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <PreviewRenderer
                  spec={previewingRequest.spec}
                  onOpenWizard={() => { window.location.href = "/wizard"; }}
                  savedRows={savedTableRows[`preview-${previewingRequest.pageId}`]}
                  onEditRow={(row, rowIndex) => {
                    const pageId = `preview-${previewingRequest.pageId}`;
                    setCreatePageSpecs(prev => ({ ...prev, [pageId]: previewingRequest.createPageSpec }));
                    setEditingRow({ pageId, rowIndex });
                    setActiveCreatePage(pageId);
                  }}
                  onDuplicateRow={(row, _rowIndex) => {
                    const pageId = `preview-${previewingRequest.pageId}`;
                    const dupNow = new Date().toISOString();
                    const copy: Record<string, unknown> = { ...row, _createdAt: String(Date.now()), "created-at": dupNow, "updated-at": dupNow };
                    const titleKey = Object.keys(copy).find(k => k.toLowerCase() === "title" || k.toLowerCase() === "name");
                    if (titleKey && copy[titleKey]) copy[titleKey] = `${copy[titleKey]} (copy)`;
                    setSavedTableRows(prev => ({ ...prev, [pageId]: [...(prev[pageId] || []), copy as Record<string, string>] }));
                  }}
                  onCreateClick={() => {
                    if (previewingRequest.createPageSpec) {
                      setCreatePageSpecs(prev => ({ ...prev, [`preview-${previewingRequest.pageId}`]: previewingRequest.createPageSpec }));
                      setActiveCreatePage(`preview-${previewingRequest.pageId}`);
                    }
                  }}
                />
              </div>
            </div>
          ) : activePage && pageSpecs[activePage] ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <PreviewRenderer
                spec={pageSpecs[activePage]}
                onOpenWizard={() => { window.location.href = "/wizard"; }}
                onEditInWizard={pageWizardIntents[activePage] ? openApprovedPageInWizard : undefined}
                editInWizardUnavailable={!pageWizardIntents[activePage]}
                savedRows={savedTableRows[activePage]}
                onEditRow={(row, rowIndex) => {
                  setEditingRow({ pageId: activePage, rowIndex });
                  setActiveCreatePage(activePage);
                }}
                onDuplicateRow={(row, _rowIndex) => {
                  const dupNow = new Date().toISOString();
                  const copy: Record<string, unknown> = { ...row, _createdAt: String(Date.now()), "created-at": dupNow, "updated-at": dupNow };
                  const titleKey = Object.keys(copy).find(k => k.toLowerCase() === "title" || k.toLowerCase() === "name");
                  if (titleKey && copy[titleKey]) copy[titleKey] = `${copy[titleKey]} (copy)`;
                  setSavedTableRows(prev => ({ ...prev, [activePage]: [...(prev[activePage] || []), copy as Record<string, string>] }));
                }}
                onCreateClick={() => {
                  if (createPageSpecs[activePage]) {
                    setActiveCreatePage(activePage);
                  } else {
                    alert("No create page configured for this section.");
                  }
                }}
                onUploadCsvClick={() => {
                  if (!createPageSpecs[activePage]) {
                    alert("Немає create page — неможливо зіставити колонки CSV.");
                    return;
                  }
                  csvInputRef.current?.click();
                }}
              />
            </div>
          ) : activePage ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <h2 className="text-lg font-semibold text-[var(--color-base-primary)] mb-2">
                {activePageLabel || activePage}
              </h2>
              <p className="text-sm text-[var(--color-base-tertiary)] mb-4">
                No table configured yet
              </p>
              <Link
                href="/wizard"
                className="px-4 py-2 bg-[var(--color-brand-primary)] text-white text-sm rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create with Wizard
              </Link>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm text-[var(--color-base-tertiary)] mb-4">No preview available. Create a new feature to get started.</p>
              <Link
                href="/wizard"
                className="px-5 py-2.5 bg-[var(--color-brand-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create with Wizard
              </Link>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
