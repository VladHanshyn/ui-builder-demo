/**
 * Field Catalog - Available data fields for UI generation
 */

export interface FieldCategory {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface FieldDefinition {
  id: string;
  label: string;
  categoryId: string;
  description: string;
  dataType: "string" | "number" | "date" | "enum" | "boolean" | "user" | "media" | "id";
  suggestedPlacements: ("table" | "grid" | "details")[];
  defaultInPresets?: {
    minimal?: boolean;
    standard?: boolean;
    moderationHeavy?: boolean;
  };
  enumValues?: string[];
}

export interface FieldRef {
  id: string;
  label: string;
  dataType: FieldDefinition["dataType"];
  copyable?: boolean;
}

// Categories
export const categories: FieldCategory[] = [
  {
    id: "identity",
    label: "Identity",
    description: "Unique identifiers and references",
  },
  {
    id: "timestamps",
    label: "Timestamps",
    description: "Date and time fields",
  },
  {
    id: "ownership",
    label: "Ownership",
    description: "User ownership and attribution",
  },
  {
    id: "moderation",
    label: "Moderation",
    description: "Moderation status and decisions",
  },
  {
    id: "media",
    label: "Media",
    description: "Media content properties",
  },
  {
    id: "system",
    label: "System",
    description: "Technical and system metadata",
  },
  {
    id: "metrics",
    label: "Metrics",
    description: "Counts and statistics",
  },
];

// Field definitions
export const fields: FieldDefinition[] = [
  // Identity
  {
    id: "id",
    label: "ID",
    categoryId: "identity",
    description: "Unique identifier",
    dataType: "id",
    suggestedPlacements: ["table", "details"],
    defaultInPresets: { minimal: true, standard: true, moderationHeavy: true },
  },
  {
    id: "title",
    label: "Title",
    categoryId: "identity",
    description: "Display name or title",
    dataType: "string",
    suggestedPlacements: ["table", "grid", "details"],
    defaultInPresets: { minimal: true, standard: true, moderationHeavy: true },
  },
  {
    id: "slug",
    label: "Slug",
    categoryId: "identity",
    description: "URL-friendly identifier",
    dataType: "string",
    suggestedPlacements: ["details"],
  },

  // Timestamps
  {
    id: "created-at",
    label: "Created At",
    categoryId: "timestamps",
    description: "Creation timestamp",
    dataType: "date",
    suggestedPlacements: ["table", "details"],
    defaultInPresets: { standard: true, moderationHeavy: true },
  },
  {
    id: "updated-at",
    label: "Updated At",
    categoryId: "timestamps",
    description: "Last update timestamp",
    dataType: "date",
    suggestedPlacements: ["table", "details"],
    defaultInPresets: { standard: true },
  },
  {
    id: "uploaded-at",
    label: "Uploaded At",
    categoryId: "timestamps",
    description: "Upload timestamp",
    dataType: "date",
    suggestedPlacements: ["table", "grid", "details"],
    defaultInPresets: { moderationHeavy: true },
  },
  {
    id: "decided-at",
    label: "Decided At",
    categoryId: "timestamps",
    description: "Moderation decision timestamp",
    dataType: "date",
    suggestedPlacements: ["table", "details"],
    defaultInPresets: { moderationHeavy: true },
  },

  // Ownership
  {
    id: "created-by",
    label: "Created By",
    categoryId: "ownership",
    description: "User who created the item",
    dataType: "user",
    suggestedPlacements: ["table", "details"],
    defaultInPresets: { standard: true },
  },
  {
    id: "updated-by",
    label: "Updated By",
    categoryId: "ownership",
    description: "User who last updated",
    dataType: "user",
    suggestedPlacements: ["details"],
  },
  {
    id: "uploader-user",
    label: "Uploader",
    categoryId: "ownership",
    description: "User who uploaded the content",
    dataType: "user",
    suggestedPlacements: ["table", "grid", "details"],
    defaultInPresets: { moderationHeavy: true },
  },
  {
    id: "user-id",
    label: "User ID",
    categoryId: "ownership",
    description: "Associated user identifier",
    dataType: "id",
    suggestedPlacements: ["table", "details"],
  },
  {
    id: "owner",
    label: "Owner",
    categoryId: "ownership",
    description: "Current owner",
    dataType: "user",
    suggestedPlacements: ["table", "details"],
  },

  // Moderation
  {
    id: "status",
    label: "Status",
    categoryId: "moderation",
    description: "Current moderation status",
    dataType: "enum",
    enumValues: ["pending", "approved", "rejected", "under_review"],
    suggestedPlacements: ["table", "grid", "details"],
    defaultInPresets: { minimal: true, standard: true, moderationHeavy: true },
  },
  {
    id: "decision-reason",
    label: "Decision Reason",
    categoryId: "moderation",
    description: "Reason for moderation decision",
    dataType: "string",
    suggestedPlacements: ["details"],
    defaultInPresets: { moderationHeavy: true },
  },
  {
    id: "decided-by",
    label: "Decided By",
    categoryId: "moderation",
    description: "Moderator who made decision",
    dataType: "user",
    suggestedPlacements: ["table", "details"],
    defaultInPresets: { moderationHeavy: true },
  },
  {
    id: "reports-count",
    label: "Reports Count",
    categoryId: "moderation",
    description: "Number of user reports",
    dataType: "number",
    suggestedPlacements: ["table", "grid", "details"],
    defaultInPresets: { moderationHeavy: true },
  },
  {
    id: "has-reports",
    label: "Has Reports",
    categoryId: "moderation",
    description: "Whether item has been reported",
    dataType: "boolean",
    suggestedPlacements: ["table", "grid"],
    defaultInPresets: { moderationHeavy: true },
  },
  {
    id: "priority",
    label: "Priority",
    categoryId: "moderation",
    description: "Review priority level",
    dataType: "enum",
    enumValues: ["low", "medium", "high", "urgent"],
    suggestedPlacements: ["table", "grid", "details"],
    defaultInPresets: { moderationHeavy: true },
  },
  {
    id: "review-notes",
    label: "Review Notes",
    categoryId: "moderation",
    description: "Internal review notes",
    dataType: "string",
    suggestedPlacements: ["details"],
  },

  // Media
  {
    id: "preview",
    label: "Preview",
    categoryId: "media",
    description: "Media thumbnail or preview",
    dataType: "media",
    suggestedPlacements: ["table", "grid", "details"],
    defaultInPresets: { minimal: true, standard: true, moderationHeavy: true },
  },
  {
    id: "media-type",
    label: "Media Type",
    categoryId: "media",
    description: "Type of media content",
    dataType: "enum",
    enumValues: ["image", "video", "audio", "document"],
    suggestedPlacements: ["table", "grid", "details"],
    defaultInPresets: { standard: true, moderationHeavy: true },
  },
  {
    id: "duration",
    label: "Duration",
    categoryId: "media",
    description: "Media duration (for video/audio)",
    dataType: "string",
    suggestedPlacements: ["table", "grid", "details"],
  },
  {
    id: "resolution",
    label: "Resolution",
    categoryId: "media",
    description: "Image/video resolution",
    dataType: "string",
    suggestedPlacements: ["details"],
  },
  {
    id: "file-size",
    label: "File Size",
    categoryId: "media",
    description: "Size of the file",
    dataType: "string",
    suggestedPlacements: ["table", "details"],
  },
  {
    id: "format",
    label: "Format",
    categoryId: "media",
    description: "File format (jpg, mp4, etc.)",
    dataType: "string",
    suggestedPlacements: ["details"],
  },
  {
    id: "alt-text",
    label: "Alt Text",
    categoryId: "media",
    description: "Alternative text for accessibility",
    dataType: "string",
    suggestedPlacements: ["details"],
  },

  // System
  {
    id: "source",
    label: "Source",
    categoryId: "system",
    description: "Origin or source of the item",
    dataType: "string",
    suggestedPlacements: ["table", "details"],
  },
  {
    id: "device",
    label: "Device",
    categoryId: "system",
    description: "Device used for upload",
    dataType: "string",
    suggestedPlacements: ["details"],
  },
  {
    id: "app-version",
    label: "App Version",
    categoryId: "system",
    description: "Application version",
    dataType: "string",
    suggestedPlacements: ["details"],
  },
  {
    id: "platform",
    label: "Platform",
    categoryId: "system",
    description: "Platform (iOS, Android, Web)",
    dataType: "enum",
    enumValues: ["ios", "android", "web", "api"],
    suggestedPlacements: ["table", "details"],
  },
  {
    id: "ip-address",
    label: "IP Address",
    categoryId: "system",
    description: "Origin IP address",
    dataType: "string",
    suggestedPlacements: ["details"],
  },
  {
    id: "geo-location",
    label: "Location",
    categoryId: "system",
    description: "Geographic location",
    dataType: "string",
    suggestedPlacements: ["details"],
  },

  // Metrics
  {
    id: "views-count",
    label: "Views",
    categoryId: "metrics",
    description: "Number of views",
    dataType: "number",
    suggestedPlacements: ["table", "grid", "details"],
  },
  {
    id: "likes-count",
    label: "Likes",
    categoryId: "metrics",
    description: "Number of likes",
    dataType: "number",
    suggestedPlacements: ["table", "grid", "details"],
  },
  {
    id: "comments-count",
    label: "Comments",
    categoryId: "metrics",
    description: "Number of comments",
    dataType: "number",
    suggestedPlacements: ["table", "details"],
  },
  {
    id: "shares-count",
    label: "Shares",
    categoryId: "metrics",
    description: "Number of shares",
    dataType: "number",
    suggestedPlacements: ["table", "details"],
  },
];

// Preset configurations
export type PresetType = "minimal" | "standard" | "moderationHeavy";

export function getPresetFields(preset: PresetType): {
  tableColumns: FieldRef[];
  gridFields: FieldRef[];
  detailsFields: FieldRef[];
} {
  const presetKey = preset === "moderationHeavy" ? "moderationHeavy" : preset;
  
  const selectedFields = fields.filter(
    (f) => f.defaultInPresets?.[presetKey]
  );

  const toFieldRef = (f: FieldDefinition): FieldRef => ({
    id: f.id,
    label: f.label,
    dataType: f.dataType,
  });

  return {
    tableColumns: selectedFields
      .filter((f) => f.suggestedPlacements.includes("table"))
      .map(toFieldRef),
    gridFields: selectedFields
      .filter((f) => f.suggestedPlacements.includes("grid"))
      .map(toFieldRef),
    detailsFields: selectedFields
      .filter((f) => f.suggestedPlacements.includes("details"))
      .map(toFieldRef),
  };
}

// Map data types to component IDs
export function getComponentIdForDataType(
  dataType: FieldDefinition["dataType"],
  placement: "table" | "grid" | "details"
): string {
  const mapping: Record<FieldDefinition["dataType"], string> = {
    string: "text-cell",
    number: "number-cell",
    date: "date-cell",
    enum: "status-badge",
    boolean: "boolean-badge",
    user: "user-chip-cell",
    media: "media-thumbnail-cell",
    id: "id-cell",
  };

  // For details panel, use different components
  if (placement === "details") {
    const detailsMapping: Record<FieldDefinition["dataType"], string> = {
      string: "text-field",
      number: "number-field",
      date: "date-field",
      enum: "status-field",
      boolean: "boolean-field",
      user: "user-field",
      media: "media-preview",
      id: "id-field",
    };
    return detailsMapping[dataType] || "text-field";
  }

  return mapping[dataType] || "text-cell";
}

// Get field by ID
export function getFieldById(fieldId: string): FieldDefinition | undefined {
  return fields.find((f) => f.id === fieldId);
}

// Search fields
export function searchFields(query: string): FieldDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return fields;
  
  return fields.filter(
    (f) =>
      f.label.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.id.includes(q)
  );
}

// Get fields by category
export function getFieldsByCategory(categoryId: string): FieldDefinition[] {
  return fields.filter((f) => f.categoryId === categoryId);
}
