/**
 * Intent to UI Spec Mapping
 * Converts wizard intent to UI spec format
 * Auto-fixes design system violations and reports what was applied
 */

import type { WizardIntent } from "./wizardTypes";
import type { UISpec, ZoneSpec, ComponentSpec, Permissions, OverlaySpec, ValidationResult } from "./types";
import { getComponentIdForDataType, getFieldById, type FieldRef } from "./fieldCatalog";
import { validateUISpec } from "./validate";

export interface AutoFix {
  ruleId: string;
  description: string;
  severity: "fixed" | "recommendation";
}

export interface IntentToSpecResult {
  spec: UISpec;
  validation: ValidationResult;
  autoFixes: AutoFix[];
}

/**
 * Convert wizard intent to UI spec, auto-fix issues, and validate
 */
export function intentToUiSpecWithValidation(intent: WizardIntent): IntentToSpecResult {
  const autoFixes: AutoFix[] = [];
  const spec = intentToUiSpec(intent, autoFixes);
  const validation = validateUISpec(spec);

  // Convert remaining warnings/info to recommendations
  for (const w of validation.warnings) {
    const alreadyFixed = autoFixes.some(f => f.ruleId === w.ruleId);
    if (!alreadyFixed) {
      autoFixes.push({ ruleId: w.ruleId, description: w.message, severity: "recommendation" });
    }
  }
  for (const i of validation.info) {
    const alreadyFixed = autoFixes.some(f => f.ruleId === i.ruleId);
    if (!alreadyFixed) {
      autoFixes.push({ ruleId: i.ruleId, description: i.message, severity: "recommendation" });
    }
  }

  return { spec, validation, autoFixes };
}

/**
 * Convert wizard intent to UI spec
 */
export function intentToUiSpec(intent: WizardIntent, autoFixes?: AutoFix[]): UISpec {
  const fixes = autoFixes || [];
  const { featureId, title, description, filters, selectedFields, rowActions, bulkActions } = intent;
  const detailsOpen = intent.detailsOpen || "none";
  const confirmations = intent.confirmations || { confirmDelete: true, confirmReject: false };
  const permissions = intent.permissions || { view: ["admin", "moderator"], moderate: ["admin", "moderator"], delete: ["admin"] };

  const id = featureId || "media-moderation";
  
  // Build patterns used
  const patternsUsed: string[] = ["P-02"];
  if (detailsOpen === "side-panel") {
    patternsUsed.push("P-07");
  }
  if (detailsOpen === "modal" || confirmations.confirmDelete || confirmations.confirmReject) {
    patternsUsed.push("P-05");
  }

  // STRUCT-006: If selectable table but no bulk actions pattern, auto-add P-15
  const hasSelection = bulkActions.approveSelected || bulkActions.rejectSelected;
  if (hasSelection) {
    patternsUsed.push("P-15");
  }

  // Build header zone components
  const headerComponents = buildHeaderComponents(title, bulkActions, filters, fixes);
  
  // Build content zone components (table)
  const contentComponents = buildContentComponents(intent, fixes);

  // Build zones
  const zones: Record<string, ZoneSpec> = {
    header: {
      pattern_id: "P-13",
      components: headerComponents,
    },
    content: {
      pattern_id: "P-02",
      components: contentComponents,
    },
  };

  // Add drawer zone if side panel selected
  if (detailsOpen === "side-panel") {
    zones.drawer = {
      pattern_id: "P-07",
      components: buildDrawerComponents(title, selectedFields.detailsFields),
    };
  }

  // DATA-001: Destructive actions require permission gating — auto-add permission rules
  const actionRules: { target: string; permission: string; fallback: "hide" | "disable" }[] = [];
  if (rowActions.edit) {
    actionRules.push({ target: "edit-action", permission: "moderate", fallback: "hide" });
  }
  if (rowActions.approve) {
    actionRules.push({ target: "approve-action", permission: "moderate", fallback: "hide" });
  }
  if (rowActions.reject) {
    actionRules.push({ target: "reject-action", permission: "moderate", fallback: "hide" });
  }
  if (rowActions.delete) {
    actionRules.push({ target: "delete-action", permission: "delete", fallback: "hide" });
    fixes.push({ ruleId: "DATA-001", description: "Added permission gating for delete action", severity: "fixed" });
  }
  const permissionsSpec: Permissions = {
    required_roles: permissions.view,
    action_rules: actionRules,
  };

  // Build overlays with INTR-003/INTR-004 close triggers auto-applied
  const overlays: OverlaySpec[] = [];
  if (confirmations.confirmDelete) {
    overlays.push({
      id: "confirm-delete-overlay",
      pattern_id: "P-05",
      title: "Confirm Delete",
      variant: "danger",
      size: "small",
      close_triggers: ["escape", "backdrop"],
    });
    fixes.push({ ruleId: "INTR-003", description: "Added ESC key close handler to delete confirmation", severity: "fixed" });
    fixes.push({ ruleId: "INTR-004", description: "Added backdrop click close to delete confirmation", severity: "fixed" });
  }
  if (confirmations.confirmReject) {
    overlays.push({
      id: "confirm-reject-overlay",
      pattern_id: "P-05",
      title: "Confirm Rejection",
      variant: "default",
      size: "small",
      close_triggers: ["escape", "backdrop"],
    });
  }

  // CONS-003: Destructive action without confirmation → auto-add overlay
  if (rowActions.delete && !confirmations.confirmDelete) {
    overlays.push({
      id: "confirm-delete-overlay",
      pattern_id: "P-05",
      title: "Confirm Delete",
      variant: "danger",
      size: "small",
      close_triggers: ["escape", "backdrop"],
    });
    fixes.push({ ruleId: "CONS-003", description: "Added confirmation dialog for delete action", severity: "fixed" });
  }

  const spec: UISpec = {
    version: "1.0",
    id,
    title: title || "Media Moderation",
    ...(description ? { description } : {}),
    root_pattern: "P-01",
    patterns_used: patternsUsed,
    zones,
    datasources: [
      {
        id: "media-list",
        type: "rest",
        endpoint: `/api/${id}`,
        method: "GET",
        pagination: {
          enabled: true,
          page_size: 25,
        },
      },
    ],
    permissions: permissionsSpec,
    overlays: overlays.length > 0 ? overlays : undefined,
  };

  return spec;
}

/**
 * Build header zone components
 */
function buildHeaderComponents(
  title: string,
  bulkActions: WizardIntent["bulkActions"],
  filters: WizardIntent["filters"],
  fixes: AutoFix[],
): ComponentSpec[] {
  const components: ComponentSpec[] = [
    {
      id: "page-title",
      props: { text: title },
    },
  ];

  // INTR-001: Search input with debounce >= 300ms auto-applied
  if (filters.freeTextSearch) {
    components.push({
      id: "search-input",
      props: { placeholder: "Search...", debounce_ms: 300 },
    });
    fixes.push({ ruleId: "INTR-001", description: "Set search debounce to 300ms", severity: "fixed" });
  }

  // Add filters
  const filterComponents = buildFilterComponents(filters);
  components.push(...filterComponents);

  // Add bulk action buttons if enabled
  if (bulkActions.approveSelected) {
    components.push({
      id: "bulk-approve-button",
      props: { label: "Approve Selected", variant: "primary" },
      condition: { permission: "moderate" },
    });
  }
  if (bulkActions.rejectSelected) {
    components.push({
      id: "bulk-reject-button",
      props: { label: "Reject Selected", variant: "secondary" },
      condition: { permission: "moderate" },
    });
  }

  return components;
}

/**
 * Build filter components based on dynamic field filters
 */
function buildFilterComponents(filters: WizardIntent["filters"]): ComponentSpec[] {
  const components: ComponentSpec[] = [];
  const fieldFilters = filters.fieldFilters || {};

  // Process each enabled field filter
  Object.entries(fieldFilters).forEach(([fieldId, enabled]) => {
    if (!enabled) return;

    const field = getFieldById(fieldId);
    if (!field) return;

    switch (field.dataType) {
      case "enum":
        components.push({
          id: `${fieldId}-filter`,
          props: {
            label: field.label,
            options: ["All", ...(field.enumValues || []).map((v: string) => 
              v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ")
            )],
            defaultValue: "All",
          },
        });
        break;

      case "date":
        components.push({
          id: `${fieldId}-filter`,
          props: { 
            label: field.label,
            type: "date-range",
          },
        });
        break;

      case "boolean":
        components.push({
          id: `${fieldId}-filter`,
          props: {
            label: field.label,
            options: ["All", "Yes", "No"],
          },
        });
        break;
    }
  });

  return components;
}

/**
 * Build content zone components (table)
 */
function buildContentComponents(intent: WizardIntent, fixes: AutoFix[]): ComponentSpec[] {
  const { rowActions, bulkActions, selectedFields } = intent;
  const primaryView = intent.primaryView || "table";
  
  // Build table columns from selected fields
  const tableColumns: ComponentSpec[] = selectedFields.tableColumns.map((field) => {
    const componentId = getComponentIdForDataType(field.dataType, "table");
    return {
      id: `column-${field.id}`,
      props: {
        key: field.id,
        label: field.label,
        type: componentId,
        sortable: ["date", "number"].includes(field.dataType),
        ...(field.dataType === "id" ? { width: "80px" } : {}),
        ...(field.dataType === "media" ? { type: "image" } : {}),
        ...(field.copyable ? { copyable: true } : {}),
      },
    };
  });

  // A11Y-002: All row action buttons get labels automatically
  const rowActionsList: ComponentSpec[] = [];
  if (rowActions.viewDetails) {
    rowActionsList.push({ id: "view-action", props: { icon: "eye", label: "View" } });
  }
  if (rowActions.edit) {
    rowActionsList.push({ 
      id: "edit-action", 
      props: { icon: "pencil", label: "Edit" },
      condition: { permission: "moderate" },
    });
  }
  if (rowActions.duplicate) {
    rowActionsList.push({ 
      id: "duplicate-action", 
      props: { icon: "copy", label: "Duplicate" },
    });
  }
  if (rowActions.approve) {
    rowActionsList.push({ 
      id: "approve-action", 
      props: { icon: "check", label: "Approve" },
      condition: { permission: "moderate" },
    });
  }
  if (rowActions.reject) {
    rowActionsList.push({ 
      id: "reject-action", 
      props: { icon: "x", label: "Reject", requiresReason: rowActions.rejectRequiresReason },
      condition: { permission: "moderate" },
    });
  }
  if (rowActions.delete) {
    rowActionsList.push({ 
      id: "delete-action", 
      props: { icon: "trash", label: "Delete", destructive: true },
      condition: { permission: "delete" },
    });
  }

  // CONS-002: If more than 4 visible actions, log a recommendation
  if (rowActionsList.length > 4) {
    fixes.push({ ruleId: "CONS-002", description: `${rowActionsList.length} row actions — consider moving some to overflow menu (max 4 recommended)`, severity: "recommendation" });
  }

  // A11Y-002: Ensure all action buttons have accessible labels
  if (rowActionsList.length > 0) {
    fixes.push({ ruleId: "A11Y-002", description: "Added accessible labels to all action buttons", severity: "fixed" });
  }

  // STRUCT-004: Actions column always rightmost (enforced by adding last)
  if (rowActionsList.length > 0) {
    tableColumns.push({
      id: "column-actions",
      props: { key: "actions", label: "", width: "140px" },
      children: rowActionsList,
    });
    fixes.push({ ruleId: "STRUCT-004", description: "Actions column positioned rightmost", severity: "fixed" });
  }

  return [
    {
      id: "data-table",
      props: {
        view: primaryView,
        selectable: bulkActions.approveSelected || bulkActions.rejectSelected,
        pagination: true,
      },
      data_binding: {
        source: "media-list",
        path: "items",
      },
      children: tableColumns,
    },
  ];
}

/**
 * Build drawer components for detail view
 */
function buildDrawerComponents(title: string, detailsFields: FieldRef[]): ComponentSpec[] {
  // Build detail fields from selected fields
  const fieldComponents: ComponentSpec[] = detailsFields.map((field) => {
    const componentId = getComponentIdForDataType(field.dataType, "details");
    return {
      id: `detail-${field.id}`,
      props: {
        key: field.id,
        label: field.label,
        type: componentId,
      },
    };
  });

  return [
    {
      id: "drawer-header",
      props: { title: `${title} Details` },
    },
    {
      id: "drawer-content",
      props: {},
      data_binding: { source: "selected-item" },
      children: fieldComponents,
    },
  ];
}

/**
 * Convert intent to YAML string for display
 */
export function intentToYaml(intent: WizardIntent): string {
  const lines: string[] = [];

  lines.push(`# Generated by Wizard`);
  lines.push(`# Feature: ${intent.title}`);
  lines.push(``);
  lines.push(`title: ${intent.title}`);
  if (intent.description) {
    lines.push(`description: ${intent.description}`);
  }
  lines.push(``);
  lines.push(`# Create Page (P-03)`);
  lines.push(`createPage:`);
  lines.push(`  sections: ${intent.createPageConfig.sections.length}`);
  lines.push(`  propertiesPanel: ${intent.createPageConfig.propertiesPanel.sections.length} sections`);
  lines.push(``);
  lines.push(`# Table (P-02)`);
  lines.push(`tableColumns:`);
  intent.selectedFields.tableColumns.forEach((f) => lines.push(`  - ${f.id}`));
  lines.push(``);
  lines.push(`# Filters`);
  lines.push(`filters:`);
  if (intent.filters.freeTextSearch) lines.push(`  - search`);
  const fieldFilters = intent.filters.fieldFilters || {};
  Object.entries(fieldFilters)
    .filter(([, enabled]) => enabled)
    .forEach(([fieldId]) => lines.push(`  - ${fieldId}`));
  lines.push(``);
  lines.push(`# Row Actions`);
  lines.push(`rowActions:`);
  if (intent.rowActions.viewDetails) lines.push(`  - viewDetails`);
  if (intent.rowActions.edit) lines.push(`  - edit`);
  if (intent.rowActions.duplicate) lines.push(`  - duplicate`);
  if (intent.rowActions.approve) lines.push(`  - approve`);
  if (intent.rowActions.reject) {
    lines.push(`  - reject${intent.rowActions.rejectRequiresReason ? " (requires reason)" : ""}`);
  }
  if (intent.rowActions.delete) lines.push(`  - delete (confirmation required)`);
  lines.push(``);
  lines.push(`# Bulk Actions`);
  lines.push(`bulkActions:`);
  if (intent.bulkActions.approveSelected) lines.push(`  - approveSelected`);
  if (intent.bulkActions.rejectSelected) {
    lines.push(`  - rejectSelected${intent.bulkActions.rejectRequiresReason ? " (requires reason)" : ""}`);
  }

  return lines.join("\n");
}

/**
 * Generate human-readable summary
 */
export function intentToSummary(intent: WizardIntent): string[] {
  const summary: string[] = [];

  summary.push(`Feature: ${intent.title}`);
  if (intent.description) {
    summary.push(`  ${intent.description}`);
  }
  summary.push(``);

  // Create Page (P-03)
  const cfg = intent.createPageConfig;
  summary.push(`Create Page (P-03):`);
  summary.push(`  Content sections: ${cfg.sections.length}`);
  if (cfg.sections.length > 0) {
    cfg.sections.forEach(s => summary.push(`    - ${s.title} (${s.type})`));
  }
  summary.push(`  Properties panel: ${cfg.propertiesPanel.sections.length} section(s)`);
  summary.push(`  Status toggle: ${cfg.propertiesPanel.statusToggle ? "Yes" : "No"}`);
  summary.push(`  Save Changes: ${cfg.saveChanges ? "Yes" : "No"}`);
  summary.push(`  Save & Close: ${cfg.saveAndClose ? "Yes" : "No"}`);
  summary.push(``);

  // Table (P-02)
  summary.push(`Table (P-02):`);
  summary.push(`  Columns: ${intent.selectedFields.tableColumns.length}`);
  if (intent.selectedFields.tableColumns.length > 0) {
    intent.selectedFields.tableColumns.forEach(f => summary.push(`    - ${f.label} (${f.dataType})`));
  }
  summary.push(``);

  // Filters
  const activeFilters: string[] = [];
  if (intent.filters.freeTextSearch) activeFilters.push("Search");
  const fieldFilters = intent.filters.fieldFilters || {};
  Object.entries(fieldFilters)
    .filter(([, enabled]) => enabled)
    .forEach(([fieldId]) => {
      const col = intent.selectedFields.tableColumns.find(f => f.id === fieldId);
      activeFilters.push(col?.label || fieldId);
    });
  summary.push(`Filters: ${activeFilters.length > 0 ? activeFilters.join(", ") : "None"}`);

  // Row actions
  const rowActionsList = [];
  if (intent.rowActions.viewDetails) rowActionsList.push("View");
  if (intent.rowActions.edit) rowActionsList.push("Edit");
  if (intent.rowActions.duplicate) rowActionsList.push("Duplicate");
  if (intent.rowActions.approve) rowActionsList.push("Approve");
  if (intent.rowActions.reject) rowActionsList.push("Reject" + (intent.rowActions.rejectRequiresReason ? "*" : ""));
  if (intent.rowActions.delete) rowActionsList.push("Delete");
  summary.push(`Row Actions: ${rowActionsList.length > 0 ? rowActionsList.join(", ") : "None"}`);

  // Bulk actions
  const bulkActionsList = [];
  if (intent.bulkActions.approveSelected) bulkActionsList.push("Approve Selected");
  if (intent.bulkActions.rejectSelected) bulkActionsList.push("Reject Selected");
  summary.push(`Bulk Actions: ${bulkActionsList.length > 0 ? bulkActionsList.join(", ") : "None"}`);

  return summary;
}
