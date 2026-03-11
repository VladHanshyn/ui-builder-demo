"use client";

import React, { useState, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input, SearchInput } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Toggle } from "@/components/ui/Toggle";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import type { UISpec, ZoneSpec, ComponentSpec, OverlaySpec } from "./types";

// ============================================
// DUMMY DATA GENERATORS
// ============================================

const dummyNames = [
  "John Smith", "Jane Doe", "Alex Johnson", "Maria Garcia", 
  "David Lee", "Sarah Wilson", "Michael Brown", "Emily Davis"
];

const dummyEmails = dummyNames.map(name => 
  `${name.toLowerCase().replace(" ", ".")}@example.com`
);

const dummyStatuses = ["Active", "Inactive", "Pending", "Suspended"];
const dummyDates = [
  "2024-01-15", "2024-02-20", "2024-03-10", "2024-04-05",
  "2024-05-18", "2024-06-22", "2024-07-30", "2024-08-12"
];

function generateDummyRows(count: number = 5) {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i + 1}`,
    name: dummyNames[i % dummyNames.length],
    email: dummyEmails[i % dummyEmails.length],
    status: dummyStatuses[i % dummyStatuses.length],
    created_at: dummyDates[i % dummyDates.length],
    role: ["Admin", "User", "Editor", "Viewer"][i % 4],
  }));
}

// ============================================
// ICONS
// ============================================

const Icons: Record<string, () => ReactNode> = {
  plus: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  pencil: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.5 2.5L13.5 4.5M2 14L2.5 11.5L11 3L13 5L4.5 13.5L2 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  eye: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  trash: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4H14M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4H12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  back: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  warning: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

function getIcon(name: string): ReactNode {
  return Icons[name]?.() || null;
}

// ============================================
// COMPONENT RENDERERS
// ============================================

interface RenderContext {
  spec: UISpec;
  data: Record<string, unknown>;
  openOverlay: (id: string) => void;
  closeOverlay: () => void;
}

function renderComponent(comp: ComponentSpec, ctx: RenderContext, key: string): ReactNode {
  const props = comp.props || {};
  
  switch (comp.id) {
    // Layout
    case "page-title":
      return (
        <h1 key={key} className="text-2xl font-semibold text-[var(--color-base-primary)]">
          {String(props.text || "Page Title")}
        </h1>
      );

    case "back-button":
      return (
        <button
          key={key}
          className="flex items-center gap-1 text-sm text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)]"
        >
          {getIcon("back")}
          {String(props.label || "Back")}
        </button>
      );

    // Buttons
    case "create-button":
    case "primary-button":
      return (
        <Button
          key={key}
          variant="primary"
          onClick={() => {
            const action = comp.actions?.[0];
            if (action?.type === "open_overlay" && action.target) {
              ctx.openOverlay(action.target);
            }
          }}
        >
          {String(props.label || "Button")}
        </Button>
      );

    case "secondary-button":
    case "save-button":
    case "save-close-button":
    case "cancel-button":
      return (
        <Button
          key={key}
          variant="secondary"
          onClick={() => {
            const action = comp.actions?.[0];
            if (action?.type === "close_overlay") {
              ctx.closeOverlay();
            }
          }}
        >
          {String(props.label || "Button")}
        </Button>
      );

    case "delete-button":
      return (
        <Button
          key={key}
          variant="secondary"
          className="text-[var(--color-status-error)] border-[var(--color-status-error)]"
          onClick={() => {
            const action = comp.actions?.[0];
            if (action?.type === "open_overlay" && action.target) {
              ctx.openOverlay(action.target);
            }
          }}
        >
          {String(props.label || "Delete")}
        </Button>
      );

    // Inputs
    case "search-input":
      return (
        <SearchInput
          key={key}
          placeholder={String(props.placeholder || "Search...")}
          className="w-64"
        />
      );

    case "input-field":
      return (
        <div key={key} className="space-y-1">
          <label className="text-sm font-medium text-[var(--color-base-primary)]">
            {String(props.label || "Field")}
          </label>
          <Input placeholder={`Enter ${String(props.label || "value").toLowerCase()}...`} />
        </div>
      );

    case "textarea-field":
      return (
        <div key={key} className="space-y-1">
          <label className="text-sm font-medium text-[var(--color-base-primary)]">
            {String(props.label || "Field")}
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-md border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] text-[var(--color-base-primary)] text-sm resize-none h-24"
            placeholder={`Enter ${String(props.label || "text").toLowerCase()}...`}
          />
        </div>
      );

    case "select-field":
      return (
        <div key={key} className="space-y-1">
          <label className="text-sm font-medium text-[var(--color-base-primary)]">
            {String(props.label || "Select")}
          </label>
          <select className="w-full px-3 py-2 rounded-md border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] text-[var(--color-base-primary)] text-sm">
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
        </div>
      );

    case "toggle-field":
      return (
        <div key={key} className="flex items-center justify-between py-2">
          <span className="text-sm text-[var(--color-base-primary)]">
            {String(props.label || "Toggle")}
          </span>
          <Toggle defaultChecked />
        </div>
      );

    // Table components
    case "tab-group":
      const tabs = (props.tabs as Array<{ id: string; label: string }>) || [
        { id: "all", label: "All" },
        { id: "active", label: "Active" },
      ];
      return (
        <div key={key} className="flex gap-1 border-b border-[var(--color-base-stroke)]">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                i === 0
                  ? "text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]"
                  : "text-[var(--color-base-secondary)] border-transparent hover:text-[var(--color-base-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      );

    case "checkbox-column":
      return (
        <th key={key} className="w-10 px-3 py-2">
          <Checkbox />
        </th>
      );

    case "column-header":
    case "sortable-column-header":
      return (
        <th
          key={key}
          className={`px-3 py-2 text-left text-sm font-medium text-[var(--color-base-secondary)] ${
            props.align === "right" ? "text-right" : ""
          }`}
        >
          {String(props.label || "Column")}
          {comp.id === "sortable-column-header" && (
            <span className="ml-1 text-[var(--color-base-tertiary)]">↕</span>
          )}
        </th>
      );

    case "table-row":
      const rows = generateDummyRows(5);
      return (
        <React.Fragment key={key}>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className="border-b border-[var(--color-base-stroke)] hover:bg-[var(--color-brand-primary)]/[0.04]"
            >
              {comp.children?.map((child, j) =>
                renderTableCell(child, row, ctx, `${key}-${i}-${j}`)
              )}
            </tr>
          ))}
        </React.Fragment>
      );

    case "checkbox-cell":
      return (
        <td key={key} className="w-10 px-3 py-3">
          <Checkbox />
        </td>
      );

    case "text-cell":
      return (
        <td key={key} className="px-3 py-3 text-sm text-[var(--color-base-primary)]">
          Dummy Text
        </td>
      );

    case "date-cell":
      return (
        <td key={key} className="px-3 py-3 text-sm text-[var(--color-base-secondary)]">
          2024-01-15
        </td>
      );

    case "status-badge":
      return (
        <td key={key} className="px-3 py-3">
          <Chip variant="filled" color="success">Active</Chip>
        </td>
      );

    case "action-button-group":
      return (
        <td key={key} className="px-3 py-3">
          <div className="flex items-center justify-end gap-1">
            {comp.children?.map((action, i) =>
              renderComponent(action, ctx, `${key}-action-${i}`)
            )}
          </div>
        </td>
      );

    case "icon-button":
      const iconName = String(props.icon || "eye");
      const isDanger = props.variant === "danger";
      return (
        <button
          key={key}
          className={`p-1.5 rounded-md transition-colors ${
            isDanger 
              ? "text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10" 
              : "text-[var(--color-base-secondary)] hover:bg-[var(--color-brand-primary)]/[0.08] hover:text-[var(--color-base-primary)]"
          }`}
          onClick={() => {
            const action = comp.actions?.[0];
            if (action?.type === "open_overlay" && action.target) {
              ctx.openOverlay(action.target);
            }
          }}
          title={String(props.tooltip || iconName)}
        >
          {getIcon(iconName)}
        </button>
      );

    // Pagination
    case "count-info":
      return (
        <span key={key} className="text-sm text-[var(--color-base-secondary)]">
          1-5 of 25
        </span>
      );

    case "rows-per-page-selector":
      return (
        <div key={key} className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-base-secondary)]">Rows per page:</span>
          <select className="px-2 py-1 rounded border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] text-sm">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
        </div>
      );

    case "prev-next-buttons":
      return (
        <div key={key} className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-[var(--color-brand-primary)]/[0.08] text-[var(--color-base-secondary)]">
            ←
          </button>
          <button className="p-1 rounded hover:bg-[var(--color-brand-primary)]/[0.08] text-[var(--color-base-secondary)]">
            →
          </button>
        </div>
      );

    // Form sections
    case "form-section":
      return (
        <div key={key} className="space-y-4">
          {typeof props.title === "string" && props.title && (
            <h3 className="text-lg font-medium text-[var(--color-base-primary)]">
              {props.title}
            </h3>
          )}
          <div className="space-y-4">
            {comp.children?.map((child, i) =>
              renderComponent(child, ctx, `${key}-child-${i}`)
            )}
          </div>
        </div>
      );

    case "accordion-section":
      const [isOpen, setIsOpen] = useState(props.default_expanded !== false);
      return (
        <div key={key} className="border border-[var(--color-base-stroke)] rounded-lg">
          <button
            className="w-full flex items-center justify-between p-4 text-left"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="font-medium text-[var(--color-base-primary)]">
              {String(props.title || "Section")}
            </span>
            <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
          </button>
          {isOpen && (
            <div className="p-4 pt-0 space-y-4">
              {comp.children?.map((child, i) =>
                renderComponent(child, ctx, `${key}-acc-${i}`)
              )}
            </div>
          )}
        </div>
      );

    case "status-toggle":
      return (
        <div key={key} className="flex items-center justify-between p-4 bg-[var(--color-base-surface-secondary)] rounded-lg">
          <div>
            <div className="text-sm font-medium text-[var(--color-base-primary)]">
              {String(props.label || "Status")}
            </div>
            <div className="text-xs text-[var(--color-base-secondary)]">
              {String(props.on_label || "Active")} / {String(props.off_label || "Inactive")}
            </div>
          </div>
          <Toggle defaultChecked />
        </div>
      );

    case "details-section":
    case "schedule-section":
      return (
        <div key={key} className="space-y-3 p-4 bg-[var(--color-base-surface-secondary)] rounded-lg">
          {typeof props.title === "string" && props.title && (
            <h4 className="text-sm font-medium text-[var(--color-base-secondary)]">
              {props.title}
            </h4>
          )}
          {comp.children?.map((child, i) =>
            renderComponent(child, ctx, `${key}-detail-${i}`)
          )}
        </div>
      );

    case "date-range-picker":
      return (
        <div key={key} className="flex gap-2">
          <Input type="date" className="flex-1" />
          <span className="text-[var(--color-base-secondary)] self-center">→</span>
          <Input type="date" className="flex-1" />
        </div>
      );

    // Overlay components
    case "title":
      return (
        <span key={key} className="text-lg font-semibold text-[var(--color-base-primary)]">
          {String(props.text || "Title")}
        </span>
      );

    case "icon":
      return (
        <div
          key={key}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            props.variant === "danger"
              ? "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]"
              : "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
          }`}
        >
          {getIcon(String(props.name || "warning"))}
        </div>
      );

    case "warning-text":
      return (
        <p key={key} className="text-sm text-[var(--color-base-secondary)]">
          {String(props.text || "Are you sure?")}
        </p>
      );

    default:
      return (
        <div key={key} className="p-2 border border-dashed border-[var(--color-base-stroke)] rounded text-xs text-[var(--color-base-tertiary)]">
          [{comp.id}]
        </div>
      );
  }
}

function renderTableCell(
  comp: ComponentSpec,
  row: Record<string, unknown>,
  ctx: RenderContext,
  key: string
): ReactNode {
  const binding = comp.data_binding;
  const value = binding?.path ? row[binding.path] : null;

  switch (comp.id) {
    case "checkbox-cell":
      return (
        <td key={key} className="w-10 px-3 py-3">
          <Checkbox />
        </td>
      );

    case "text-cell":
      return (
        <td key={key} className="px-3 py-3 text-sm text-[var(--color-base-primary)]">
          {String(value || "—")}
        </td>
      );

    case "date-cell":
      return (
        <td key={key} className="px-3 py-3 text-sm text-[var(--color-base-secondary)]">
          {String(value || "—")}
        </td>
      );

    case "status-badge":
      const status = String(value || "Active");
      const statusColor = status === "Active" ? "success" : status === "Inactive" ? "default" : "warning";
      return (
        <td key={key} className="px-3 py-3">
          <Chip variant="filled" color={statusColor}>{status}</Chip>
        </td>
      );

    case "action-button-group":
      return (
        <td key={key} className="px-3 py-3">
          <div className="flex items-center justify-end gap-1">
            {comp.children?.map((action, i) =>
              renderComponent(action, ctx, `${key}-action-${i}`)
            )}
          </div>
        </td>
      );

    default:
      return renderComponent(comp, ctx, key);
  }
}

// ============================================
// ZONE RENDERERS
// ============================================

function renderZone(zone: ZoneSpec, zoneId: string, ctx: RenderContext): ReactNode {
  const components = zone.components || [];

  // Table header (zone-c for P-02)
  if (zoneId === "zone-c" && ctx.spec.root_pattern === "P-02") {
    return (
      <thead className="bg-[var(--color-base-surface-secondary)]">
        <tr>
          {components.map((comp, i) => renderComponent(comp, ctx, `${zoneId}-${i}`))}
        </tr>
      </thead>
    );
  }

  // Table body (zone-d for P-02)
  if (zoneId === "zone-d" && ctx.spec.root_pattern === "P-02") {
    return (
      <tbody>
        {components.map((comp, i) => renderComponent(comp, ctx, `${zoneId}-${i}`))}
      </tbody>
    );
  }

  // Default zone rendering
  return (
    <div className="flex flex-wrap items-center gap-3">
      {components.map((comp, i) => renderComponent(comp, ctx, `${zoneId}-${i}`))}
    </div>
  );
}

// ============================================
// OVERLAY RENDERER
// ============================================

function renderOverlay(
  overlay: OverlaySpec,
  ctx: RenderContext,
  onClose: () => void
): ReactNode {
  const isDanger = overlay.variant === "danger";

  return (
    <Modal isOpen onClose={onClose} size={overlay.size === "large" ? "lg" : "sm"}>
      <ModalHeader>
        <div className="flex items-center gap-3">
          {overlay.zones?.["zone-a"]?.components.map((comp, i) =>
            renderComponent(comp, ctx, `overlay-header-${i}`)
          )}
        </div>
      </ModalHeader>
      <ModalBody>
        {overlay.zones?.["zone-b"]?.components.map((comp, i) =>
          renderComponent(comp, ctx, `overlay-body-${i}`)
        )}
      </ModalBody>
      <ModalFooter>
        <div className="flex justify-end gap-2">
          {overlay.zones?.["zone-c"]?.components.map((comp, i) =>
            renderComponent(comp, ctx, `overlay-footer-${i}`)
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}

// ============================================
// MAIN RENDERER
// ============================================

interface UISpecRendererProps {
  spec: UISpec;
}

export function UISpecRenderer({ spec }: UISpecRendererProps) {
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  const ctx: RenderContext = {
    spec,
    data: {},
    openOverlay: (id) => setActiveOverlay(id),
    closeOverlay: () => setActiveOverlay(null),
  };

  const overlaySpec = activeOverlay
    ? spec.overlays?.find((o) => o.id === activeOverlay)
    : null;

  // P-02: Table View
  if (spec.root_pattern === "P-02") {
    return (
      <div className="flex flex-col h-full bg-[var(--color-base-surface-primary)]">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-base-stroke)]">
          <div className="flex items-center justify-between mb-4">
            {renderZone(spec.zones["zone-a"], "zone-a", ctx)}
          </div>
          {spec.zones["zone-b"] && renderZone(spec.zones["zone-b"], "zone-b", ctx)}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full">
            {spec.zones["zone-c"] && renderZone(spec.zones["zone-c"], "zone-c", ctx)}
            {spec.zones["zone-d"] && renderZone(spec.zones["zone-d"], "zone-d", ctx)}
          </table>
        </div>

        {/* Pagination */}
        {spec.zones["zone-e"] && (
          <div className="p-4 border-t border-[var(--color-base-stroke)] flex items-center justify-between">
            {renderZone(spec.zones["zone-e"], "zone-e", ctx)}
          </div>
        )}

        {/* Overlay */}
        {overlaySpec && renderOverlay(overlaySpec, ctx, () => setActiveOverlay(null))}
      </div>
    );
  }

  // P-03: Editor View
  if (spec.root_pattern === "P-03") {
    return (
      <div className="flex flex-col h-full bg-[var(--color-base-surface-secondary)]">
        {/* Header */}
        <div className="p-4 bg-[var(--color-base-surface-primary)] border-b border-[var(--color-base-stroke)]">
          <div className="flex items-center justify-between">
            {renderZone(spec.zones["zone-a"], "zone-a", ctx)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-auto">
          {/* Main form */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl space-y-6">
              {spec.zones["zone-b"]?.components.map((comp, i) =>
                renderComponent(comp, ctx, `form-${i}`)
              )}
            </div>
          </div>

          {/* Sidebar */}
          {spec.zones["zone-c"] && (
            <div className="w-80 p-6 bg-[var(--color-base-surface-primary)] border-l border-[var(--color-base-stroke)] space-y-4">
              {spec.zones["zone-c"].components.map((comp, i) =>
                renderComponent(comp, ctx, `sidebar-${i}`)
              )}
            </div>
          )}
        </div>

        {/* Overlay */}
        {overlaySpec && renderOverlay(overlaySpec, ctx, () => setActiveOverlay(null))}
      </div>
    );
  }

  // P-05: Confirmation Dialog (standalone)
  if (spec.root_pattern === "P-05") {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--color-base-surface-secondary)]">
        <div className="bg-[var(--color-base-surface-primary)] rounded-xl shadow-lg p-6 max-w-sm w-full">
          <div className="flex flex-col items-center text-center gap-4">
            {spec.zones["zone-a"]?.components.map((comp, i) =>
              renderComponent(comp, ctx, `dialog-header-${i}`)
            )}
            {spec.zones["zone-b"]?.components.map((comp, i) =>
              renderComponent(comp, ctx, `dialog-body-${i}`)
            )}
            <div className="flex gap-2 mt-2">
              {spec.zones["zone-c"]?.components.map((comp, i) =>
                renderComponent(comp, ctx, `dialog-footer-${i}`)
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-6">
      <div className="text-[var(--color-base-secondary)]">
        Unsupported pattern: {spec.root_pattern}
      </div>
      <pre className="mt-4 p-4 bg-[var(--color-base-surface-secondary)] rounded text-xs overflow-auto">
        {JSON.stringify(spec, null, 2)}
      </pre>
    </div>
  );
}
