/**
 * UI Generator - Public API
 */

export { generateUISpec, parseRequest } from './generate';
export { validateUISpec } from './validate';
export { repairUISpec } from './repair';
export { 
  getDrafts, 
  getDraft, 
  saveDraft, 
  deleteDraft, 
  clearDrafts, 
  renameDraft,
  downloadDraftAsYaml,
  downloadYaml,
} from './storage';
export { UISpecRenderer } from './renderer';
export { WizardModal, WizardPage } from './WizardModal';
export { intentToUiSpec, intentToUiSpecWithValidation, intentToYaml, intentToSummary } from './intentToUiSpec';
export type { IntentToSpecResult, AutoFix } from './intentToUiSpec';
export type {
  TemplateType,
  UISpec,
  ValidationResult,
  ValidationViolation,
  ValidationSummary,
  Draft,
} from './types';
export type {
  WizardIntent,
  NavigationConfig,
  ScopeType,
  PrimaryViewType,
  DetailsOpenType,
  PermissionRole,
  FiltersConfig,
  RowActionsConfig,
  BulkActionsConfig,
  ConfirmationsConfig,
  PermissionsConfig,
  SelectedFieldsConfig,
  CreatePageConfig,
} from './wizardTypes';
export { createDefaultWizardIntent, WIZARD_STEPS, titleToFeatureId } from './wizardTypes';

// Navigation Tree
export type { NavSection, NavPage, NavigationState } from './navigationTree';
export { DEFAULT_SECTIONS, getNavigation, saveNavigation, addPageToSection, addNewSection, getSectionsForPicker } from './navigationTree';

// Field Catalog
export type { FieldDefinition, FieldRef, FieldCategory, PresetType } from './fieldCatalog';
export { categories, fields, getPresetFields, getFieldById, searchFields, getFieldsByCategory, getComponentIdForDataType } from './fieldCatalog';
