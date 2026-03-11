/**
 * UI Spec Repair
 * Automatically fix common validation errors
 */

import type { UISpec, ComponentSpec, OverlaySpec, ValidationResult } from './types';

interface RepairResult {
  spec: UISpec;
  fixes: string[];
}

/**
 * Repair a UI Spec to fix validation errors
 */
export function repairUISpec(spec: UISpec, validation: ValidationResult): RepairResult {
  const fixes: string[] = [];
  let repairedSpec = JSON.parse(JSON.stringify(spec)) as UISpec;

  // Fix missing required zones
  repairedSpec = fixMissingZones(repairedSpec, validation, fixes);

  // Fix multiple primary buttons
  repairedSpec = fixMultiplePrimaryButtons(repairedSpec, validation, fixes);

  // Fix destructive actions without confirmation
  repairedSpec = fixDestructiveActions(repairedSpec, validation, fixes);

  // Fix mutually exclusive patterns
  repairedSpec = fixMutuallyExclusivePatterns(repairedSpec, validation, fixes);

  return { spec: repairedSpec, fixes };
}

/**
 * Add missing required zones
 */
function fixMissingZones(spec: UISpec, validation: ValidationResult, fixes: string[]): UISpec {
  const missingZoneErrors = validation.errors.filter(e => e.ruleId === 'STRUCT-001');
  
  if (missingZoneErrors.length === 0) return spec;

  const zoneDefaults: Record<string, Record<string, ComponentSpec[]>> = {
    'P-02': {
      'zone-c': [
        { id: 'checkbox-column', key: 'select-all' },
        { id: 'column-header', key: 'col-name', props: { label: 'Name' } },
        { id: 'column-header', key: 'col-actions', props: { label: 'Actions' } },
      ],
      'zone-d': [
        {
          id: 'table-row',
          key: 'data-row',
          children: [
            { id: 'checkbox-cell', key: 'row-select' },
            { id: 'text-cell', key: 'cell-name' },
            { id: 'action-button-group', key: 'row-actions', children: [] },
          ],
        },
      ],
      'zone-e': [
        { id: 'count-info', key: 'items-count', props: { template: '1-25 of 100' } },
        { id: 'rows-per-page-selector', key: 'page-size', props: { options: [10, 25, 50], default: 25 } },
        { id: 'prev-next-buttons', key: 'pagination-nav' },
      ],
    },
    'P-03': {
      'zone-a': [
        { id: 'back-button', key: 'back', props: { label: 'Back' } },
        { id: 'page-title', key: 'title', props: { text: 'Edit Item' } },
        { id: 'save-button', key: 'save', props: { label: 'Save' } },
      ],
      'zone-b': [
        {
          id: 'form-section',
          key: 'main-form',
          props: { title: 'Details' },
          children: [
            { id: 'input-field', key: 'name-field', props: { label: 'Name' } },
          ],
        },
      ],
      'zone-c': [
        { id: 'status-toggle', key: 'status', props: { label: 'Status' } },
        { id: 'details-section', key: 'details', props: { title: 'Info' } },
      ],
    },
  };

  for (const error of missingZoneErrors) {
    const match = error.message.match(/zone '(zone-[a-z])'/);
    if (match) {
      const zoneId = match[1];
      const patternDefaults = zoneDefaults[spec.root_pattern];
      
      if (patternDefaults && patternDefaults[zoneId]) {
        spec.zones[zoneId] = {
          pattern_id: spec.root_pattern,
          components: patternDefaults[zoneId],
        };
        fixes.push(`Added missing zone '${zoneId}' with default components`);
      } else {
        spec.zones[zoneId] = {
          pattern_id: spec.root_pattern,
          components: [],
        };
        fixes.push(`Added missing zone '${zoneId}' (empty)`);
      }
    }
  }

  return spec;
}

/**
 * Fix multiple primary buttons by downgrading extras to secondary
 */
function fixMultiplePrimaryButtons(spec: UISpec, validation: ValidationResult, fixes: string[]): UISpec {
  const hasError = validation.errors.some(e => e.ruleId === 'CONS-001');
  
  if (!hasError) return spec;

  let firstFound = false;

  function downgradeButtons(components: ComponentSpec[]): boolean {
    let changed = false;
    
    for (const comp of components) {
      if (comp.id === 'primary-button') {
        if (firstFound) {
          comp.id = 'secondary-button';
          changed = true;
        } else {
          firstFound = true;
        }
      }
      
      if (comp.children) {
        if (downgradeButtons(comp.children)) {
          changed = true;
        }
      }
    }
    
    return changed;
  }

  for (const zone of Object.values(spec.zones || {})) {
    if (downgradeButtons(zone.components || [])) {
      fixes.push('Downgraded extra primary-button(s) to secondary-button');
    }
  }

  return spec;
}

/**
 * Fix destructive actions by adding confirmation overlay
 */
function fixDestructiveActions(spec: UISpec, validation: ValidationResult, fixes: string[]): UISpec {
  const hasError = validation.errors.some(e => e.ruleId === 'CONS-003');
  
  if (!hasError) return spec;

  // Check if we already have a confirmation overlay
  const hasConfirmOverlay = spec.overlays?.some(o => o.pattern_id === 'P-05');

  function fixComponents(components: ComponentSpec[]): boolean {
    let changed = false;
    
    for (const comp of components) {
      const isDestructive = comp.id === 'delete-button' || 
        (comp.props && (comp.props as Record<string, unknown>).variant === 'danger');

      if (isDestructive && comp.actions) {
        const hasConfirm = comp.actions.some(a => a.type === 'open_overlay');
        const hasDirectDelete = comp.actions.some(a => a.type === 'api_call' && a.method === 'DELETE');

        if (!hasConfirm && hasDirectDelete) {
          // Change the action to open overlay
          for (const action of comp.actions) {
            if (action.type === 'api_call' && action.method === 'DELETE') {
              const originalTarget = action.target;
              action.type = 'open_overlay';
              action.target = 'confirm-delete';
              delete action.method;
              
              // Store original target for the overlay
              (comp as { _originalDeleteTarget?: string })._originalDeleteTarget = originalTarget;
              changed = true;
            }
          }
        }
      }
      
      if (comp.children) {
        if (fixComponents(comp.children)) {
          changed = true;
        }
      }
    }
    
    return changed;
  }

  for (const zone of Object.values(spec.zones || {})) {
    if (fixComponents(zone.components || [])) {
      fixes.push('Changed destructive action to open confirmation overlay');
    }
  }

  // Add confirmation overlay if not present
  if (!hasConfirmOverlay) {
    const confirmOverlay: OverlaySpec = {
      id: 'confirm-delete',
      pattern_id: 'P-05',
      title: 'Confirm Delete',
      variant: 'danger',
      size: 'small',
      zones: {
        'zone-a': {
          pattern_id: 'P-05',
          components: [
            { id: 'title', props: { text: 'Confirm Delete' } },
          ],
        },
        'zone-b': {
          pattern_id: 'P-05',
          components: [
            { id: 'warning-text', props: { text: 'Are you sure? This action cannot be undone.' } },
          ],
        },
        'zone-c': {
          pattern_id: 'P-05',
          components: [
            {
              id: 'cancel-button',
              key: 'cancel',
              props: { label: 'Cancel' },
              actions: [{ id: 'close', type: 'close_overlay', target: 'confirm-delete' }],
            },
            {
              id: 'primary-button',
              key: 'confirm',
              props: { label: 'Delete', variant: 'danger' },
              actions: [{ id: 'execute', type: 'api_call', method: 'DELETE', target: '/api/item/{{id}}' }],
            },
          ],
        },
      },
      open_triggers: ['delete-item'],
      close_triggers: ['close', 'execute'],
    };

    if (!spec.overlays) {
      spec.overlays = [];
    }
    spec.overlays.push(confirmOverlay);

    if (!spec.patterns_used.includes('P-05')) {
      spec.patterns_used.push('P-05');
    }

    fixes.push('Added P-05 confirmation overlay for destructive action');
  }

  return spec;
}

/**
 * Fix mutually exclusive patterns
 */
function fixMutuallyExclusivePatterns(spec: UISpec, validation: ValidationResult, fixes: string[]): UISpec {
  const hasError = validation.errors.some(e => e.ruleId === 'NEST-002');
  
  if (!hasError) return spec;

  // Determine dominant pattern based on root_pattern
  const dominantPattern = spec.root_pattern;
  const exclusivePatterns = ['P-02', 'P-03'];
  
  // Remove non-dominant patterns
  const removed = spec.patterns_used.filter(p => 
    exclusivePatterns.includes(p) && p !== dominantPattern
  );

  spec.patterns_used = spec.patterns_used.filter(p => 
    !exclusivePatterns.includes(p) || p === dominantPattern
  );

  if (removed.length > 0) {
    fixes.push(`Removed mutually exclusive pattern(s): ${removed.join(', ')}`);
  }

  return spec;
}
