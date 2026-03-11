/**
 * UI Generator Storage
 * Manages draft persistence using localStorage
 */

import type { Draft, TemplateType, ValidationSummary } from './types';

const STORAGE_KEY = 'ui_generator_drafts_v1';

/**
 * Generate a unique ID (UUID v4)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create empty validation summary
 */
function emptyValidationSummary(): ValidationSummary {
  return {
    errorsCount: 0,
    warningsCount: 0,
    infoCount: 0,
    passed: true,
    lastRunAt: null,
  };
}

/**
 * Get all drafts from storage
 */
export function getDrafts(): Draft[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const drafts = JSON.parse(data) as Draft[];
    // Sort by updated_at descending
    return drafts.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Get a single draft by ID
 */
export function getDraft(id: string): Draft | null {
  const drafts = getDrafts();
  return drafts.find(d => d.id === id) || null;
}

/**
 * Save a new draft or update existing
 */
export function saveDraft(
  draft: Partial<Draft> & { requestText: string; uiSpecText: string; templateType?: TemplateType }
): Draft {
  const drafts = getDrafts();
  const now = new Date().toISOString();

  let savedDraft: Draft;

  if (draft.id) {
    // Update existing
    const index = drafts.findIndex(d => d.id === draft.id);
    if (index !== -1) {
      savedDraft = {
        ...drafts[index],
        ...draft,
        validationSummary: draft.validationSummary || drafts[index].validationSummary,
        updatedAt: now,
      };
      drafts[index] = savedDraft;
    } else {
      // ID not found, create new
      savedDraft = {
        id: draft.id,
        title: draft.title || 'Untitled Draft',
        templateType: draft.templateType || 'table',
        requestText: draft.requestText,
        uiSpecText: draft.uiSpecText,
        validationSummary: draft.validationSummary || emptyValidationSummary(),
        createdAt: now,
        updatedAt: now,
      };
      drafts.push(savedDraft);
    }
  } else {
    // Create new
    savedDraft = {
      id: generateUUID(),
      title: draft.title || 'Untitled Draft',
      templateType: draft.templateType || 'table',
      requestText: draft.requestText,
      uiSpecText: draft.uiSpecText,
      validationSummary: draft.validationSummary || emptyValidationSummary(),
      createdAt: now,
      updatedAt: now,
    };
    drafts.push(savedDraft);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }

  return savedDraft;
}

/**
 * Rename a draft
 */
export function renameDraft(id: string, newTitle: string): Draft | null {
  const drafts = getDrafts();
  const index = drafts.findIndex(d => d.id === id);
  
  if (index === -1) return null;
  
  drafts[index].title = newTitle;
  drafts[index].updatedAt = new Date().toISOString();
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }
  
  return drafts[index];
}

/**
 * Delete a draft
 */
export function deleteDraft(id: string): boolean {
  const drafts = getDrafts();
  const index = drafts.findIndex(d => d.id === id);
  
  if (index === -1) return false;
  
  drafts.splice(index, 1);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  }
  
  return true;
}

/**
 * Clear all drafts
 */
export function clearDrafts(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Update validation summary for a draft
 */
export function updateDraftValidation(id: string, summary: ValidationSummary): Draft | null {
  const draft = getDraft(id);
  if (!draft) return null;
  
  return saveDraft({
    ...draft,
    validationSummary: summary,
  });
}

/**
 * Export draft as YAML file download
 */
export function downloadDraftAsYaml(draft: Draft): void {
  if (typeof window === 'undefined') return;
  
  const filename = `${draft.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-ui-spec.yaml`;
  const blob = new Blob([draft.uiSpecText], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download UI Spec text as YAML
 */
export function downloadYaml(uiSpecText: string, filename: string = 'ui-spec.yaml'): void {
  if (typeof window === 'undefined') return;
  
  const blob = new Blob([uiSpecText], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
