/**
 * UI Generator Types
 */

export type TemplateType = 'table' | 'editor' | 'overlay';

export interface GenerateRequest {
  template: TemplateType;
  title: string;
  entityName: string;
  fields?: FieldConfig[];
  actions?: ActionConfig[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'toggle' | 'textarea';
  sortable?: boolean;
  filterable?: boolean;
  required?: boolean;
}

export interface ActionConfig {
  id: string;
  icon: string;
  label: string;
  type: 'navigate' | 'api_call' | 'open_overlay';
  destructive?: boolean;
}

export interface UISpec {
  version: string;
  id: string;
  title?: string;
  description?: string;
  root_pattern: string;
  patterns_used: string[];
  zones: Record<string, ZoneSpec>;
  datasources?: Datasource[];
  permissions?: Permissions;
  overlays?: OverlaySpec[];
}

export interface ZoneSpec {
  pattern_id: string;
  components: ComponentSpec[];
}

export interface ComponentSpec {
  id: string;
  key?: string;
  props?: Record<string, unknown>;
  data_binding?: {
    source: string;
    path?: string;
  };
  actions?: ActionSpec[];
  children?: ComponentSpec[];
  condition?: {
    permission?: string;
  };
}

export interface ActionSpec {
  id: string;
  type: string;
  target?: string;
  method?: string;
  payload?: Record<string, unknown>;
  requires_permission?: string;
  on_success?: ActionSpec;
}

export interface Datasource {
  id: string;
  type: 'rest' | 'graphql' | 'static';
  endpoint?: string;
  method?: string;
  pagination?: {
    enabled: boolean;
    page_size: number;
  };
  response_mapping?: Record<string, string>;
}

export interface Permissions {
  required_roles?: string[];
  component_rules?: PermissionRule[];
  action_rules?: PermissionRule[];
}

export interface PermissionRule {
  target: string;
  permission: string;
  fallback: 'hide' | 'disable';
}

export interface OverlaySpec {
  id: string;
  pattern_id: string;
  title?: string;
  variant?: 'default' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
  zones?: Record<string, ZoneSpec>;
  open_triggers?: string[];
  close_triggers?: string[];
}

export interface ValidationViolation {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationViolation[];
  warnings: ValidationViolation[];
  info: ValidationViolation[];
}

export interface ValidationSummary {
  errorsCount: number;
  warningsCount: number;
  infoCount: number;
  passed: boolean;
  lastRunAt: string | null;
}

export interface Draft {
  id: string;
  title: string;
  templateType: TemplateType;
  requestText: string;
  uiSpecText: string;
  validationSummary: ValidationSummary;
  createdAt: string;
  updatedAt: string;
}
