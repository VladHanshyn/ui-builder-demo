/**
 * Loaders for UI Spec validation
 * Loads YAML/JSON files and schema definitions
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Types
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
    transform?: string;
  };
  actions?: ActionSpec[];
  children?: ComponentSpec[];
  condition?: {
    if?: string;
    show?: boolean;
    permission?: string;
  };
}

export interface ActionSpec {
  id: string;
  type: string;
  target?: string;
  method?: string;
  payload?: Record<string, unknown>;
  confirm?: string;
  requires_permission?: string;
  on_success?: ActionSpec;
  on_error?: ActionSpec;
}

export interface Datasource {
  id: string;
  type: 'rest' | 'graphql' | 'static';
  endpoint?: string;
  query?: string;
  method?: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  response_mapping?: Record<string, string>;
  static_data?: unknown;
  refresh_interval?: number;
  pagination?: {
    enabled?: boolean;
    page_size?: number;
    page_param?: string;
    size_param?: string;
    total_path?: string;
    items_path?: string;
  };
}

export interface Permissions {
  required_roles?: string[];
  component_rules?: PermissionRule[];
  action_rules?: PermissionRule[];
}

export interface PermissionRule {
  target: string;
  permission: string;
  fallback?: 'hide' | 'disable' | 'redirect';
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
  on_confirm?: ActionSpec;
  on_cancel?: ActionSpec;
}

export interface PatternDefinition {
  id: string;
  name: string;
  type: 'layout' | 'component' | 'overlay';
  level: string;
  zones?: Array<{
    id: string;
    name: string;
    allowed_components?: string[];
    optional?: boolean;
  }>;
}

export interface ValidationRule {
  id: string;
  title: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  applies_to?: {
    patterns?: string[];
    components?: string[];
    zones?: string[];
  };
  when?: Record<string, unknown>;
  assert?: Record<string, unknown>;
  message: string;
}

export interface ValidationConfig {
  layout_nesting: Record<string, { can_contain?: string[]; level?: string }>;
  required_zones: Record<string, { required: string[]; optional?: string[] }>;
  mutually_exclusive: {
    page_level?: string[][];
    overlays?: string[][];
  };
  rules: ValidationRule[];
}

export interface PatternsConfig {
  patterns: PatternDefinition[];
  component_definitions: Array<{ id: string; [key: string]: unknown }>;
}

/**
 * Load a YAML or JSON file
 */
export function loadFile<T>(filePath: string): T {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (ext === '.json') {
    return JSON.parse(content) as T;
  } else if (ext === '.yaml' || ext === '.yml') {
    return yaml.load(content) as T;
  } else {
    throw new Error(`Unsupported file extension: ${ext}`);
  }
}

/**
 * Load UI Spec schema
 */
export function loadSchema(schemaPath: string): object {
  return loadFile<object>(schemaPath);
}

/**
 * Load validation rules
 */
export function loadValidationConfig(validationPath: string): ValidationConfig {
  return loadFile<ValidationConfig>(validationPath);
}

/**
 * Load patterns config
 */
export function loadPatternsConfig(patternsPath: string): PatternsConfig {
  return loadFile<PatternsConfig>(patternsPath);
}

/**
 * Load UI Spec file
 */
export function loadUISpec(specPath: string): UISpec {
  return loadFile<UISpec>(specPath);
}

/**
 * Get all UI Spec files from a directory
 */
export function getUISpecFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.yaml', '.yml', '.json'].includes(ext)) {
        files.push(fullPath);
      }
    } else if (entry.isDirectory()) {
      files.push(...getUISpecFiles(fullPath));
    }
  }
  
  return files;
}

/**
 * Resolve paths relative to project root
 */
export function resolvePath(...segments: string[]): string {
  // Find project root by looking for package.json
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return path.join(dir, ...segments);
    }
    dir = path.dirname(dir);
  }
  // Fallback to current directory
  return path.join(process.cwd(), ...segments);
}
