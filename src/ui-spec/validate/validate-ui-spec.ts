/**
 * Core UI Spec Validation Logic
 */

import Ajv from 'ajv';
import type {
  UISpec,
  ComponentSpec,
  ValidationConfig,
  PatternsConfig,
  ValidationRule,
  ZoneSpec,
} from './loaders';

// Violation types
export interface Violation {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
}

export interface ValidationResult {
  file: string;
  passed: boolean;
  errors: Violation[];
  warnings: Violation[];
  info: Violation[];
}

/**
 * Validate UI Spec against JSON Schema
 */
export function validateSchema(
  spec: unknown,
  schema: object
): { valid: boolean; errors: Violation[] } {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(spec);

  const errors: Violation[] = [];
  
  if (!valid && validate.errors) {
    for (const error of validate.errors) {
      errors.push({
        ruleId: 'SCHEMA-001',
        severity: 'error',
        message: `${error.instancePath || '/'}: ${error.message}`,
        path: error.instancePath || '/',
      });
    }
  }

  return { valid, errors };
}

/**
 * Validate UI Spec against custom rules
 */
export function validateRules(
  spec: UISpec,
  validationConfig: ValidationConfig,
  patternsConfig: PatternsConfig
): Violation[] {
  const violations: Violation[] = [];
  const context = createValidationContext(spec, patternsConfig);

  // Run built-in structural validations
  violations.push(...validateRequiredZones(spec, validationConfig, patternsConfig));
  violations.push(...validateMutuallyExclusive(spec, validationConfig));
  violations.push(...validateAllowedNesting(spec, validationConfig));
  violations.push(...validateComponentCounts(spec, validationConfig));
  violations.push(...validateDestructiveActions(spec));
  violations.push(...validateAccessibility(spec, context));

  // Run rules from validation.yaml
  for (const rule of validationConfig.rules) {
    const ruleViolations = evaluateRule(rule, spec, context);
    violations.push(...ruleViolations);
  }

  return violations;
}

/**
 * Create validation context with helper data
 */
function createValidationContext(spec: UISpec, patternsConfig: PatternsConfig) {
  const componentIds = new Set(patternsConfig.component_definitions.map(c => c.id));
  const patternMap = new Map(patternsConfig.patterns.map(p => [p.id, p]));
  
  // Collect all components from spec
  const allComponents: Array<{ component: ComponentSpec; zonePath: string }> = [];
  
  for (const [zoneId, zone] of Object.entries(spec.zones || {})) {
    collectComponents(zone.components || [], `zones.${zoneId}`, allComponents);
  }
  
  for (const overlay of spec.overlays || []) {
    for (const [zoneId, zone] of Object.entries(overlay.zones || {})) {
      collectComponents(
        zone.components || [],
        `overlays.${overlay.id}.zones.${zoneId}`,
        allComponents
      );
    }
  }

  return {
    componentIds,
    patternMap,
    allComponents,
  };
}

/**
 * Recursively collect all components
 */
function collectComponents(
  components: ComponentSpec[],
  basePath: string,
  result: Array<{ component: ComponentSpec; zonePath: string }>
) {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    const path = `${basePath}.components[${i}]`;
    result.push({ component: comp, zonePath: path });
    
    if (comp.children) {
      collectComponents(comp.children, `${path}.children`, result);
    }
  }
}

/**
 * Validate required zones exist for patterns
 */
function validateRequiredZones(
  spec: UISpec,
  validationConfig: ValidationConfig,
  patternsConfig: PatternsConfig
): Violation[] {
  const violations: Violation[] = [];
  const requiredZones = validationConfig.required_zones;

  // Check root pattern zones
  const rootPattern = spec.root_pattern;
  if (requiredZones[rootPattern]) {
    const required = requiredZones[rootPattern].required || [];
    const specZones = Object.keys(spec.zones || {});
    
    for (const zoneId of required) {
      // Check if zone exists and has the correct pattern_id
      const zone = spec.zones?.[zoneId];
      if (!zone) {
        violations.push({
          ruleId: 'STRUCT-001',
          severity: 'error',
          message: `Pattern ${rootPattern} requires zone '${zoneId}' but it is missing`,
          path: `zones`,
        });
      } else if (zone.pattern_id !== rootPattern) {
        // Allow the zone to belong to any pattern in patterns_used
        if (!spec.patterns_used.includes(zone.pattern_id)) {
          violations.push({
            ruleId: 'STRUCT-002',
            severity: 'warning',
            message: `Zone '${zoneId}' has pattern_id '${zone.pattern_id}' which is not in patterns_used`,
            path: `zones.${zoneId}`,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Validate mutually exclusive patterns
 */
function validateMutuallyExclusive(
  spec: UISpec,
  validationConfig: ValidationConfig
): Violation[] {
  const violations: Violation[] = [];
  const mutuallyExclusive = validationConfig.mutually_exclusive;

  // Check page-level exclusions
  if (mutuallyExclusive.page_level) {
    for (const exclusionGroup of mutuallyExclusive.page_level) {
      const foundPatterns = exclusionGroup.filter(p => spec.patterns_used.includes(p));
      
      if (foundPatterns.length > 1) {
        violations.push({
          ruleId: 'NEST-002',
          severity: 'error',
          message: `Mutually exclusive patterns used together: ${foundPatterns.join(', ')}`,
          path: 'patterns_used',
        });
      }
    }
  }

  // Check overlay exclusions (only if multiple overlays could be open)
  // This is more of a runtime check, but we can warn about it
  if (mutuallyExclusive.overlays && spec.overlays) {
    for (const exclusionGroup of mutuallyExclusive.overlays) {
      const foundOverlays = spec.overlays.filter(o => exclusionGroup.includes(o.pattern_id));
      
      if (foundOverlays.length > 1) {
        // Check if they share open_triggers (would be opened simultaneously)
        const allTriggers = foundOverlays.flatMap(o => o.open_triggers || []);
        const uniqueTriggers = new Set(allTriggers);
        
        if (allTriggers.length !== uniqueTriggers.size) {
          violations.push({
            ruleId: 'NEST-004',
            severity: 'warning',
            message: `Mutually exclusive overlay patterns (${exclusionGroup.join(', ')}) may conflict`,
            path: 'overlays',
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Validate allowed nesting
 */
function validateAllowedNesting(
  spec: UISpec,
  validationConfig: ValidationConfig
): Violation[] {
  const violations: Violation[] = [];
  const nesting = validationConfig.layout_nesting;

  // Check if page patterns are used without root shell
  const pagePatterns = ['P-02', 'P-03'];
  const rootPatterns = ['P-01'];
  const overlayPatterns = ['P-05', 'P-06', 'P-07', 'P-08'];

  // If root_pattern is a page pattern, warn about missing shell
  if (pagePatterns.includes(spec.root_pattern) && !spec.patterns_used.includes('P-01')) {
    violations.push({
      ruleId: 'NEST-001',
      severity: 'warning',
      message: `Page pattern ${spec.root_pattern} should typically be inside P-01 (Sidebar Shell)`,
      path: 'root_pattern',
    });
  }

  // Validate that patterns can contain each other
  for (const [patternId, config] of Object.entries(nesting)) {
    if (patternId === 'overlays') continue;
    
    if (config.can_contain && spec.patterns_used.includes(patternId)) {
      const usedPatterns = spec.patterns_used.filter(p => !overlayPatterns.includes(p) && p !== patternId);
      
      for (const used of usedPatterns) {
        if (!config.can_contain.includes(used) && !overlayPatterns.includes(used)) {
          // Check if this pattern can be contained by others
          let canBeNested = false;
          for (const [otherId, otherConfig] of Object.entries(nesting)) {
            if (otherId !== 'overlays' && otherConfig.can_contain?.includes(used)) {
              canBeNested = true;
              break;
            }
          }
          
          if (!canBeNested && nesting[used] && nesting[used].level !== 'root') {
            violations.push({
              ruleId: 'NEST-005',
              severity: 'info',
              message: `Pattern ${used} nesting may be incorrect with ${patternId}`,
              path: 'patterns_used',
            });
          }
        }
      }
    }
  }

  return violations;
}

/**
 * Validate component counts (e.g., max 1 primary-button)
 */
function validateComponentCounts(
  spec: UISpec,
  validationConfig: ValidationConfig
): Violation[] {
  const violations: Violation[] = [];
  
  // Count all components by id
  const componentCounts = new Map<string, number>();
  
  function countComponents(components: ComponentSpec[]) {
    for (const comp of components) {
      componentCounts.set(comp.id, (componentCounts.get(comp.id) || 0) + 1);
      if (comp.children) {
        countComponents(comp.children);
      }
    }
  }
  
  // Count in main zones
  for (const zone of Object.values(spec.zones || {})) {
    countComponents(zone.components || []);
  }
  
  // Count in overlays
  for (const overlay of spec.overlays || []) {
    for (const zone of Object.values(overlay.zones || {})) {
      countComponents(zone.components || []);
    }
  }

  // Check for max 1 primary-button per screen (excluding overlays)
  let primaryButtonCount = 0;
  for (const zone of Object.values(spec.zones || {})) {
    primaryButtonCount += countComponentsById(zone.components || [], 'primary-button');
  }
  
  if (primaryButtonCount > 1) {
    violations.push({
      ruleId: 'CONS-001',
      severity: 'error',
      message: `Screen contains ${primaryButtonCount} primary buttons. Maximum 1 allowed.`,
      path: 'zones',
    });
  }

  // Check for max 4 icon-buttons in action-button-group
  for (const [zoneId, zone] of Object.entries(spec.zones || {})) {
    checkActionButtonGroups(zone.components || [], `zones.${zoneId}`, violations);
  }

  return violations;
}

function countComponentsById(components: ComponentSpec[], id: string): number {
  let count = 0;
  for (const comp of components) {
    if (comp.id === id) count++;
    if (comp.children) {
      count += countComponentsById(comp.children, id);
    }
  }
  return count;
}

function checkActionButtonGroups(
  components: ComponentSpec[],
  basePath: string,
  violations: Violation[]
) {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    
    if (comp.id === 'action-button-group' && comp.children) {
      const visibleActions = comp.children.filter(c => c.id === 'icon-button').length;
      if (visibleActions > 4) {
        violations.push({
          ruleId: 'CONS-002',
          severity: 'warning',
          message: `Action button group has ${visibleActions} visible actions. Maximum 4 recommended.`,
          path: `${basePath}.components[${i}]`,
        });
      }
    }
    
    if (comp.children) {
      checkActionButtonGroups(comp.children, `${basePath}.components[${i}].children`, violations);
    }
  }
}

/**
 * Validate destructive actions have confirmation
 */
function validateDestructiveActions(spec: UISpec): Violation[] {
  const violations: Violation[] = [];
  
  // Skip validation for overlay patterns (P-05..P-08) - they ARE the confirmation
  const overlayPatterns = ['P-05', 'P-06', 'P-07', 'P-08'];
  if (overlayPatterns.includes(spec.root_pattern)) {
    return violations;
  }
  
  // Find all delete actions in main zones (not in overlays - those are confirmations)
  function checkActions(
    components: ComponentSpec[],
    basePath: string,
    overlayIds: Set<string>
  ) {
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      
      // Check if this is a destructive action
      const isDestructive = comp.id === 'delete-button' || 
        (comp.props && (comp.props as Record<string, unknown>).variant === 'danger');
      
      if (isDestructive && comp.actions) {
        // Check if any action triggers a confirmation
        const hasConfirmation = comp.actions.some(action => 
          action.type === 'open_overlay' || action.confirm
        );
        
        if (!hasConfirmation) {
          // Check if the action type is directly destructive (DELETE method)
          const directDelete = comp.actions.some(action => 
            action.type === 'api_call' && action.method === 'DELETE'
          );
          
          if (directDelete) {
            violations.push({
              ruleId: 'CONS-003',
              severity: 'error',
              message: `Destructive action without confirmation dialog`,
              path: `${basePath}.components[${i}]`,
            });
          }
        }
      }
      
      if (comp.children) {
        checkActions(comp.children, `${basePath}.components[${i}].children`, overlayIds);
      }
    }
  }
  
  const overlayIds = new Set((spec.overlays || []).map(o => o.id));
  
  // Only check main zones, not overlay zones
  for (const [zoneId, zone] of Object.entries(spec.zones || {})) {
    checkActions(zone.components || [], `zones.${zoneId}`, overlayIds);
  }
  
  return violations;
}

/**
 * Validate accessibility requirements
 */
function validateAccessibility(
  spec: UISpec,
  context: ReturnType<typeof createValidationContext>
): Violation[] {
  const violations: Violation[] = [];
  
  // Check icon-buttons have tooltip or aria-label
  for (const { component, zonePath } of context.allComponents) {
    if (component.id === 'icon-button') {
      const props = component.props as Record<string, unknown> | undefined;
      const hasTooltip = props?.tooltip;
      const hasAriaLabel = props?.['aria-label'];
      
      if (!hasTooltip && !hasAriaLabel) {
        violations.push({
          ruleId: 'A11Y-002',
          severity: 'warning',
          message: `icon-button missing tooltip or aria-label`,
          path: zonePath,
        });
      }
    }
  }

  // Check overlays have focus trap (this is more of a runtime thing, but we can note it)
  for (const overlay of spec.overlays || []) {
    // Just info that focus trap is required
    // Actual implementation would be in the generator
  }

  return violations;
}

/**
 * Evaluate a single rule from validation.yaml
 */
function evaluateRule(
  rule: ValidationRule,
  spec: UISpec,
  context: ReturnType<typeof createValidationContext>
): Violation[] {
  const violations: Violation[] = [];
  
  // Check if rule applies to this spec
  if (rule.applies_to?.patterns) {
    const hasMatchingPattern = rule.applies_to.patterns.some(p => 
      spec.patterns_used.includes(p) || spec.root_pattern === p
    );
    if (!hasMatchingPattern) {
      return violations;
    }
  }

  // Evaluate based on assert conditions
  // This is a simplified implementation - extend as needed
  const assert = rule.assert;
  if (!assert) return violations;

  // zones_present assertion
  if (assert.zones_present) {
    // Already handled by validateRequiredZones
  }

  // visible_actions assertion for P-13
  if (assert.visible_actions) {
    // Already handled by validateComponentCounts
  }

  // triggers_overlay assertion
  if (assert.triggers_overlay) {
    // Already handled by validateDestructiveActions
  }

  return violations;
}

/**
 * Main validation function
 */
export function validateUISpec(
  spec: UISpec,
  schema: object,
  validationConfig: ValidationConfig,
  patternsConfig: PatternsConfig,
  filePath: string
): ValidationResult {
  const errors: Violation[] = [];
  const warnings: Violation[] = [];
  const info: Violation[] = [];

  // Schema validation
  const schemaResult = validateSchema(spec, schema);
  if (!schemaResult.valid) {
    errors.push(...schemaResult.errors);
    // Return early on schema errors
    return {
      file: filePath,
      passed: false,
      errors,
      warnings,
      info,
    };
  }

  // Rules validation
  const ruleViolations = validateRules(spec, validationConfig, patternsConfig);
  
  // Categorize violations
  for (const violation of ruleViolations) {
    switch (violation.severity) {
      case 'error':
        errors.push(violation);
        break;
      case 'warning':
        warnings.push(violation);
        break;
      case 'info':
        info.push(violation);
        break;
    }
  }

  return {
    file: filePath,
    passed: errors.length === 0,
    errors,
    warnings,
    info,
  };
}
