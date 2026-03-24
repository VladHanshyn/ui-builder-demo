/**
 * Agent Mock Generator
 * Deterministic UI spec generation based on prompt parsing
 */

import type { UISpec, FilterConfig, TableColumn, ActionConfig } from "./types";

/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Convert string to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Parse entity/page name from prompt
 */
function parseEntityName(prompt: string): string {
  const lower = prompt.toLowerCase();
  
  // Pattern: "Create a X page" or "Build X table" or "X management"
  const patterns = [
    /(?:create|build|make|generate)\s+(?:a\s+)?([a-z]+(?:\s+[a-z]+)?)\s+(?:page|table|list|view|screen)/i,
    /([a-z]+(?:\s+[a-z]+)?)\s+(?:management|dashboard|overview|directory|queue)/i,
    /(?:create|build|make|generate)\s+(?:a\s+)?([a-z]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      const entity = match[1].trim();
      // Skip common words
      if (!["a", "an", "the", "page", "table", "with"].includes(entity)) {
        return toTitleCase(entity);
      }
    }
  }
  
  // Fallback: look for capitalized words
  const capitalizedMatch = prompt.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (capitalizedMatch) {
    return capitalizedMatch[1];
  }
  
  return "Data";
}

/**
 * Parse custom filters from prompt
 * Looks for patterns like: filters "A, B, C" or filters: A, B, C
 */
function parseFilters(prompt: string): FilterConfig[] {
  const filters: FilterConfig[] = [];
  
  // Pattern: filters "A, B, C" or filters: A, B, C or filter by A, B and C
  const filterPatterns = [
    /filters?\s*[:\s]["']?([^"'\n]+)["']?/i,
    /filter\s+by\s+([^.]+)/i,
    /with\s+filters?\s+([^.]+)/i,
  ];
  
  for (const pattern of filterPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      // Split by comma, "and", or other separators
      const filterNames = match[1]
        .split(/[,]|\s+and\s+/i)
        .map(f => f.trim().replace(/["']/g, ""))
        .filter(f => f.length > 0 && f.length < 30);
      
      for (const name of filterNames) {
        const cleanName = toTitleCase(name);
        filters.push({
          id: toKebabCase(name),
          label: cleanName,
          type: name.toLowerCase().includes("date") ? "date" : "select",
        });
      }
      break;
    }
  }
  
  return filters;
}

/**
 * Parse custom columns from prompt
 * Looks for patterns like: table with A, B, C columns or columns: A, B, C
 */
function parseColumns(prompt: string): TableColumn[] {
  const columns: TableColumn[] = [];
  
  // Patterns for column definitions
  const columnPatterns = [
    /table\s+with\s+([^.]+?)(?:\.\s|$|on\s+the\s+table)/i,
    /columns?\s*[:\s]["']?([^"'\n.]+)["']?/i,
    /(?:with|has|having)\s+columns?\s+([^.]+)/i,
    /the\s+table\s+(?:with|has)\s+([^.]+)/i,
  ];
  
  for (const pattern of columnPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      const columnNames = match[1]
        .split(/[,]|\s+and\s+/i)
        .map(c => c.trim().replace(/["']/g, ""))
        .filter(c => c.length > 0 && c.length < 40);
      
      for (const name of columnNames) {
        const cleanName = toTitleCase(name);
        const id = toKebabCase(name);
        
        // Determine column type based on name
        let type: TableColumn["type"] = "text";
        const lowerName = name.toLowerCase();
        
        if (lowerName.includes("status") || lowerName.includes("state")) {
          type = "status";
        } else if (lowerName.includes("date") || lowerName.includes("created") || lowerName.includes("updated") || lowerName.includes("at")) {
          type = "date";
        } else if (lowerName.includes("amount") || lowerName.includes("price") || lowerName.includes("count") || lowerName.includes("priority")) {
          type = "number";
        }
        
        const isCopyable = id === "id" || lowerName.includes("title") || lowerName.includes("name");
        columns.push({
          id,
          label: cleanName,
          type,
          sortable: ["date", "number"].includes(type) || lowerName.includes("name") || lowerName.includes("title"),
          width: id === "id" ? "80px" : undefined,
          ...(isCopyable ? { copyable: true } : {}),
        });
      }
      break;
    }
  }
  
  // If no columns found, return default columns
  if (columns.length === 0) {
    return getDefaultColumns(prompt);
  }
  
  // Always add actions column if edit/delete mentioned
  const hasActions = /edit|delete|remove|action/i.test(prompt);
  if (hasActions && !columns.some(c => c.id === "actions")) {
    columns.push({ 
      id: "actions", 
      label: "", 
      type: "actions", 
      width: "120px",
      actions: { view: true, edit: true, duplicate: false, delete: true },
    });
  }
  
  return columns;
}

/**
 * Get default columns based on entity type
 */
function getDefaultColumns(prompt: string): TableColumn[] {
  const lower = prompt.toLowerCase();
  
  // Default actions config for generated tables
  const defaultActions = { view: true, edit: false, duplicate: false, delete: true };

  // Entity-specific defaults
  if (lower.includes("user") || lower.includes("member")) {
    return [
      { id: "id", label: "ID", type: "text", width: "80px", copyable: true },
      { id: "name", label: "Name", type: "text", sortable: true, copyable: true },
      { id: "email", label: "Email", type: "text", sortable: true },
      { id: "role", label: "Role", type: "text" },
      { id: "status", label: "Status", type: "status" },
      { id: "actions", label: "", type: "actions", width: "100px", actions: defaultActions },
    ];
  }
  
  if (lower.includes("order")) {
    return [
      { id: "orderId", label: "Order ID", type: "text", width: "120px", copyable: true },
      { id: "customer", label: "Customer", type: "text", sortable: true },
      { id: "amount", label: "Amount", type: "number", sortable: true },
      { id: "status", label: "Status", type: "status" },
      { id: "created", label: "Created", type: "date", sortable: true },
      { id: "actions", label: "", type: "actions", width: "100px", actions: defaultActions },
    ];
  }
  
  if (lower.includes("transaction") || lower.includes("payment")) {
    return [
      { id: "txId", label: "Tx ID", type: "text", width: "140px", copyable: true },
      { id: "user", label: "User", type: "text", sortable: true },
      { id: "type", label: "Type", type: "text" },
      { id: "amount", label: "Amount", type: "number", sortable: true },
      { id: "date", label: "Date", type: "date", sortable: true },
      { id: "actions", label: "", type: "actions", width: "80px", actions: defaultActions },
    ];
  }
  
  if (lower.includes("payout") || lower.includes("withdrawal")) {
    return [
      { id: "payoutId", label: "Payout ID", type: "text", width: "120px", copyable: true },
      { id: "streamer", label: "Streamer", type: "text", sortable: true },
      { id: "amount", label: "Amount", type: "number", sortable: true },
      { id: "method", label: "Method", type: "text" },
      { id: "status", label: "Status", type: "status" },
      { id: "actions", label: "", type: "actions", width: "100px", actions: defaultActions },
    ];
  }
  
  if (lower.includes("moderation") || lower.includes("report") || lower.includes("flagged")) {
    return [
      { id: "item", label: "Item", type: "text", sortable: true, copyable: true },
      { id: "reason", label: "Reason", type: "text" },
      { id: "reporter", label: "Reporter", type: "text" },
      { id: "status", label: "Status", type: "status" },
      { id: "created", label: "Created", type: "date", sortable: true },
      { id: "actions", label: "", type: "actions", width: "120px", actions: defaultActions },
    ];
  }
  
  if (lower.includes("streamer") || lower.includes("creator")) {
    return [
      { id: "name", label: "Name", type: "text", sortable: true, copyable: true },
      { id: "category", label: "Category", type: "text" },
      { id: "viewers", label: "Viewers", type: "number", sortable: true },
      { id: "gifts", label: "Gifts", type: "number", sortable: true },
      { id: "status", label: "Status", type: "status" },
      { id: "actions", label: "", type: "actions", width: "100px", actions: defaultActions },
    ];
  }
  
  // Generic default
  return [
    { id: "id", label: "ID", type: "text", width: "80px", copyable: true },
    { id: "name", label: "Name", type: "text", sortable: true, copyable: true },
    { id: "status", label: "Status", type: "status" },
    { id: "created", label: "Created", type: "date", sortable: true },
    { id: "actions", label: "", type: "actions", width: "100px", actions: defaultActions },
  ];
}

/**
 * Parse CTA button text from prompt
 */
function parseCTAButton(prompt: string, entityName: string): ActionConfig | null {
  // Look for CTA/button patterns
  const ctaPatterns = [
    /(?:cta|button)\s+(?:called\s+)?["']?([^"'\n,]+)["']?/i,
    /add\s+(?:a\s+)?(?:cta|button)\s+["']?([^"'\n,]+)["']?/i,
    /(?:cta|button)\s*[:\s]+["']?([^"'\n,]+)["']?/i,
  ];
  
  for (const pattern of ctaPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      const label = match[1].trim();
      return {
        id: toKebabCase(label),
        label: label,
        variant: "primary",
      };
    }
  }
  
  // Check for "create" keyword
  if (/\bcreate\b/i.test(prompt) && !/create\s+(?:a\s+)?[a-z]+\s+(?:page|table)/i.test(prompt)) {
    return {
      id: "create",
      label: `Create ${entityName}`,
      variant: "primary",
    };
  }
  
  return null;
}

/**
 * Check if prompt contains keyword
 */
function hasKeyword(prompt: string, ...keywords: string[]): boolean {
  const lower = prompt.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

/**
 * Generate UI Spec from prompt (deterministic)
 */
export function generateUiSpec(prompt: string): UISpec {
  const entityName = parseEntityName(prompt);
  const title = `${entityName} Management`;
  const id = toKebabCase(title);
  
  // Parse custom elements from prompt
  const customFilters = parseFilters(prompt);
  const customColumns = parseColumns(prompt);
  const ctaButton = parseCTAButton(prompt, entityName);
  
  // Determine toolbar options
  const hasSearch = hasKeyword(prompt, "search", "find", "lookup");
  const hasDrawer = hasKeyword(prompt, "drawer", "details", "detail", "sidebar", "panel");
  const hasExport = hasKeyword(prompt, "export", "download", "csv");
  const hasPagination = true; // default true
  const hasSelect = hasKeyword(prompt, "select", "selection", "checkbox", "bulk");
  
  // Build actions
  const actions: ActionConfig[] = [];
  if (ctaButton) {
    actions.push(ctaButton);
  }
  if (hasExport) {
    actions.push({ id: "export", label: "Export", variant: "secondary" });
  }
  
  // Use custom filters or default status filter
  const filters: FilterConfig[] = customFilters.length > 0 
    ? customFilters 
    : (hasKeyword(prompt, "filter") ? [{ id: "status", label: "Status", type: "select" as const }] : []);
  
  const spec: UISpec = {
    version: "1.0",
    page: {
      id,
      title,
    },
    layout: {
      type: "shell-with-content",
      zones: {
        header: { title },
        content: { type: "table" },
        ...(hasDrawer ? { drawer: { type: "detail-panel" } } : {}),
      },
    },
    toolbar: {
      search: hasSearch,
      filters: filters,
      actions: actions,
    },
    table: {
      columns: customColumns,
      pagination: hasPagination,
      selectable: hasSelect,
    },
    drawer: {
      enabled: hasDrawer,
      title: hasDrawer ? `${entityName} Details` : undefined,
    },
  };
  
  return spec;
}

/**
 * Validate UI Spec (return array of errors)
 */
export function validateSpec(spec: UISpec): string[] {
  const errors: string[] = [];
  
  if (!spec.version) {
    errors.push("Missing required field: version");
  }
  
  if (!spec.page?.id) {
    errors.push("Missing required field: page.id");
  }
  
  if (!spec.page?.title) {
    errors.push("Missing required field: page.title");
  }
  
  if (!spec.table?.columns || spec.table.columns.length === 0) {
    errors.push("Table must have at least one column");
  }
  
  // Check for duplicate column IDs
  if (spec.table?.columns) {
    const ids = spec.table.columns.map(c => c.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicates.length > 0) {
      errors.push(`Duplicate column IDs: ${duplicates.join(", ")}`);
    }
  }
  
  return errors;
}

/**
 * Generate dummy data for table based on columns
 */
export function generateDummyData(columns: TableColumn[], count: number = 5): Record<string, string>[] {
  const data: Record<string, string>[] = [];
  
  const names = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson", "Diana Prince", "Edward Norton", "Fiona Apple"];
  const emails = ["john@example.com", "jane@example.com", "bob@example.com", "alice@example.com", "charlie@example.com"];
  const statuses = ["Active", "Pending", "Inactive", "Suspended"];
  const roles = ["Admin", "User", "Moderator", "Guest"];
  const categories = ["Gaming", "Music", "Talk Show", "Sports", "Art"];
  const methods = ["Bank Transfer", "PayPal", "Crypto", "Check"];
  const types = ["Deposit", "Withdrawal", "Transfer", "Refund"];
  const reasons = ["Spam", "Inappropriate", "Copyright", "Harassment"];
  const titles = ["Summer Sale", "Black Friday", "New User", "Loyalty Bonus", "Flash Deal"];
  const audiences = ["All Users", "Premium", "New Users", "Returning", "VIP"];
  const durations = ["7 days", "14 days", "30 days", "Permanent", "Until stock lasts"];
  const priorities = ["High", "Medium", "Low", "Critical", "Normal"];
  
  for (let i = 0; i < count; i++) {
    const row: Record<string, string> = {};
    
    for (const col of columns) {
      const colId = col.id.toLowerCase();

      if (col.type === "live") {
        row[col.id] = "true";
        continue;
      }

      if (col.type === "duration" && col.durationStartFieldId && col.durationEndFieldId) {
        const start = new Date();
        start.setDate(start.getDate() - i);
        start.setHours(8, 0, 0, 0);
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        end.setHours(11, 0, 0, 0);
        row[col.durationStartFieldId] = row[col.durationStartFieldId] || start.toISOString();
        row[col.durationEndFieldId] = row[col.durationEndFieldId] || end.toISOString();
        row[col.id] = `${row[col.durationStartFieldId]} - ${row[col.durationEndFieldId]}`;
        continue;
      }
      
      // Match by column ID or label
      if (colId === "id" || colId.includes("id")) {
        row[col.id] = String(1000 + i);
      } else if (colId === "title" || colId.includes("title")) {
        row[col.id] = titles[i % titles.length];
      } else if (colId === "name" || colId.includes("name") || colId === "customer" || colId === "user" || colId === "streamer" || colId === "reporter") {
        row[col.id] = names[i % names.length];
      } else if (colId === "email" || colId.includes("email")) {
        row[col.id] = emails[i % emails.length];
      } else if (colId === "role" || colId.includes("role")) {
        row[col.id] = roles[i % roles.length];
      } else if (colId === "status" || colId.includes("status") || colId === "state") {
        row[col.id] = statuses[i % statuses.length];
      } else if (colId === "category" || colId.includes("category")) {
        row[col.id] = categories[i % categories.length];
      } else if (colId === "method" || colId.includes("method")) {
        row[col.id] = methods[i % methods.length];
      } else if (colId === "type" || colId.includes("type")) {
        row[col.id] = types[i % types.length];
      } else if (colId === "reason" || colId.includes("reason")) {
        row[col.id] = reasons[i % reasons.length];
      } else if (colId === "audience" || colId.includes("audience")) {
        row[col.id] = audiences[i % audiences.length];
      } else if (colId === "duration" || colId.includes("duration")) {
        row[col.id] = durations[i % durations.length];
      } else if (colId === "priority" || colId.includes("priority")) {
        row[col.id] = priorities[i % priorities.length];
      } else if (colId === "amount" || colId.includes("amount") || colId.includes("price")) {
        row[col.id] = `$${(Math.floor((i + 1) * 123.45)).toLocaleString()}`;
      } else if (colId === "viewers" || colId.includes("viewers") || colId.includes("count")) {
        row[col.id] = String((i + 1) * 1234);
      } else if (colId === "gifts" || colId.includes("gifts")) {
        row[col.id] = String((i + 1) * 56);
      } else if (colId.includes("updated-by") || colId.includes("created-by") || colId.includes("by")) {
        row[col.id] = names[i % names.length];
      } else if (colId.includes("date") || colId.includes("created") || colId.includes("updated") || colId.includes("-at")) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        row[col.id] = date.toISOString().split("T")[0];
      } else if (colId === "actions") {
        row[col.id] = "";
      } else if (colId === "item" || colId.includes("item")) {
        row[col.id] = `Content Item #${1000 + i}`;
      } else {
        row[col.id] = `Value ${i + 1}`;
      }
    }
    
    data.push(row);
  }
  
  return data;
}
