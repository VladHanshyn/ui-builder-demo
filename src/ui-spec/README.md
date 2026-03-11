# UI Spec

> Machine-readable specification format for AI-driven UI generation

## Overview

UI Spec is a declarative format (YAML/JSON) that describes CRM Back Office interfaces. It references patterns and components from our design system and can be validated and generated programmatically.

## Quick Start

```yaml
version: "1.0"
id: my-page
title: "My Page"
root_pattern: P-02
patterns_used: [P-02]

zones:
  zone-a:
    pattern_id: P-02
    components:
      - id: page-title
        props:
          text: "Hello World"
```

## Files

| File | Description |
|------|-------------|
| [ui-spec.schema.json](./ui-spec.schema.json) | JSON Schema for validation |
| [ui-spec.md](./ui-spec.md) | Complete documentation |
| [examples/](./examples/) | Example UI Specs |

## Examples

| Example | Pattern | Description |
|---------|---------|-------------|
| [P-02-table-example.yaml](./examples/P-02-table-example.yaml) | P-02 | Users management table |
| [P-03-editor-example.yaml](./examples/P-03-editor-example.yaml) | P-03 | Campaign editor form |
| [P-05-confirm-dialog-example.yaml](./examples/P-05-confirm-dialog-example.yaml) | P-05 | Bulk delete confirmation |

## Key Concepts

### Patterns (P-01..P-15)

Structural templates from `design-system/patterns/patterns.yaml`:

```
Layout:    P-01 (Shell), P-02 (Table), P-03 (Editor)
Section:   P-04, P-09..P-12, P-15
Inline:    P-13, P-14
Overlay:   P-05..P-08
```

### Zones

Named areas within patterns where components are placed:

```yaml
zones:
  zone-a:           # Zone ID (zone-a through zone-f)
    pattern_id: P-02
    components: []
```

### Components

UI elements from `component_definitions`:

```yaml
- id: page-title
  key: my-title     # Unique instance key
  props: {}         # Component props
  data_binding: {}  # Data source reference
  actions: []       # User interactions
```

### Datasources

Where data comes from:

```yaml
datasources:
  - id: users
    type: rest
    endpoint: "/api/users"
```

### Overlays

Modal dialogs (P-05..P-08):

```yaml
overlays:
  - id: confirm-delete
    pattern_id: P-05
    variant: danger
    open_triggers: [delete-action]
```

## Validation

Validate against the JSON Schema:

```bash
# Using ajv-cli
npx ajv validate -s ui-spec.schema.json -d examples/P-02-table-example.yaml
```

## Design System References

- [patterns.yaml](../design-system/patterns/patterns.yaml) — Pattern definitions
- [components.yaml](../design-system/patterns/components.yaml) — Component registry
- [validation.yaml](../design-system/validation/validation.yaml) — Validation rules

## Validation

### CLI Usage

```bash
# Validate all examples
npm run ui:validate

# Validate specific file
npm run ui:validate -- path/to/spec.yaml

# Validate a directory
npm run ui:validate -- src/ui-spec/examples/
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All validations passed (no errors) |
| 1 | One or more files have errors |

### Validation Pipeline

1. **Schema Validation** — Checks structure against `ui-spec.schema.json`
2. **Rules Validation** — Applies rules from `validation.yaml`:
   - Required zones exist
   - Mutually exclusive patterns
   - Allowed nesting
   - Component counts (max 1 primary-button)
   - Destructive actions require confirmation
   - Accessibility (tooltips on icon-buttons)

### Output Example

```
✓ src/ui-spec/examples/P-02-table-example.yaml PASS
  No issues found

✖ src/ui-spec/examples/broken-example.yaml FAIL

  Errors:
  ✖ [ERROR] CONS-001: Screen contains 2 primary buttons. Maximum 1 allowed. (zones)
  ✖ [ERROR] NEST-002: Mutually exclusive patterns used together: P-02, P-03 (patterns_used)

  Warnings:
  ⚠ [WARNING] A11Y-002: icon-button missing tooltip or aria-label (zones.zone-d.components[0].children[1].children[0])

═══════════════════════════════════════════════════
  VALIDATION SUMMARY
═══════════════════════════════════════════════════

  Files:    4 total
  Passed:   3
  Failed:   1

  Errors:   3
  Warnings: 6
  Info:     0

  ✖ 1 file(s) have errors
```

## License

Internal use only.


# Golden UI Spec Examples

This folder contains canonical UI Spec examples for our CRM.

These files represent the expected "correct" state of UI generation.
They are used for:
- regression testing
- validation rule evolution
- AI prompt grounding

## Rules
- All files must pass `ui:validate` with **0 errors**
- Warnings are allowed ONLY if documented per file
- Any change to patterns.yaml or validation.yaml
  must be tested against all golden examples

## How to add a new golden example
1. Generate or fix a UI Spec until it passes validation
2. Move it into this folder
3. Document expected warnings (if any)
4. Run `npm run ui:validate`
5. Commit

## Do NOT:
- Add experimental or edge-case specs
- Silence warnings without understanding them
- Change golden files casually

Golden examples are a contract, not samples.