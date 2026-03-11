# UI Spec Format Documentation

> Machine-readable specification for generating CRM Back Office interfaces

## What is a UI Spec?

A **UI Spec** is a declarative YAML/JSON document that describes:

- **What patterns** to use (P-01 through P-15)
- **What components** to place in each zone
- **Where data comes from** (datasources)
- **What actions** users can take
- **What permissions** are required
- **What overlays** (modals) can appear

The AI UI generator reads a UI Spec and produces working React/Next.js code.

---

## Structure Overview

```yaml
version: "1.0"
id: unique-page-id
title: "Page Title"
root_pattern: P-XX          # Main pattern (P-01..P-15)
patterns_used: [P-XX, ...]  # All patterns referenced

zones:                      # Component placement
  zone-a:
    pattern_id: P-XX
    components: [...]

datasources: [...]          # Data fetching config
permissions: {...}          # Access control
overlays: [...]             # Modal dialogs
```

---

## How to Reference Patterns & Zones

### Pattern IDs

Use the pattern ID from `patterns.yaml`:

| Pattern | Name | Level |
|---------|------|-------|
| P-01 | Sidebar Navigation Shell | root |
| P-02 | Tabular Data View | page |
| P-03 | Detail Editor | page |
| P-04 | Card Selection Grid | section |
| P-05 | Confirmation Dialog | modal |
| P-06 | Input Dialog | modal |
| P-07 | Selection List Panel | modal |
| P-08 | Device Preview | modal |
| P-09 | Orderable List | section |
| P-10 | Accordion Section | section |
| P-11 | Filter Bar | section |
| P-12 | Pagination Footer | section |
| P-13 | Action Button Group | inline |
| P-14 | Status Toggle Header | inline |
| P-15 | Multi-Select Action Bar | section |

### Zone IDs

Each pattern has specific zones. Reference them by ID:

```yaml
# P-02 zones:
zone-a: page-header
zone-b: filter-bar
zone-c: table-header
zone-d: table-body
zone-e: pagination-footer

# P-03 zones:
zone-a: action-header
zone-b: main-content
zone-c: properties-panel

# P-05 zones:
zone-a: header
zone-b: body
zone-c: actions
```

### Referencing a Zone

```yaml
zones:
  zone-a:                    # Zone ID
    pattern_id: P-02         # Which pattern owns this zone
    components:              # Components to place here
      - id: page-title
        props:
          text: "Users"
```

---

## How to Add Components

### Basic Component

```yaml
- id: page-title              # Component ID from component_definitions
  props:
    text: "My Page"
```

### Component with Key

```yaml
- id: search-input
  key: users-search           # Unique instance key
  props:
    placeholder: "Search..."
```

### Component with Data Binding

```yaml
- id: text-cell
  data_binding:
    source: users-datasource   # Datasource ID
    path: "name"               # Path to data field
```

### Component with Actions

```yaml
- id: icon-button
  props:
    icon: trash
    tooltip: "Delete"
  actions:
    - id: delete-item
      type: open_overlay
      target: confirm-delete
```

### Component with Children

```yaml
- id: table-row
  children:
    - id: checkbox-cell
    - id: text-cell
      props: { field: "name" }
    - id: action-button-group
      children:
        - id: icon-button
          props: { icon: "edit" }
```

### Conditional Component

```yaml
- id: delete-button
  condition:
    permission: items.delete   # Only show if user has permission
```

---

## How to Define Datasources

### REST API

```yaml
datasources:
  - id: users-datasource
    type: rest
    endpoint: "/api/users"
    method: GET
    params:
      page: 1
      limit: 25
    pagination:
      enabled: true
      page_size: 25
      total_path: "meta.total"
      items_path: "data"
```

### Static Data

```yaml
datasources:
  - id: status-options
    type: static
    static_data:
      - { value: "active", label: "Active" }
      - { value: "inactive", label: "Inactive" }
```

### GraphQL

```yaml
datasources:
  - id: campaigns
    type: graphql
    endpoint: "/graphql"
    query: |
      query GetCampaigns($page: Int) {
        campaigns(page: $page) {
          id
          name
          status
        }
      }
```

---

## How Overlays Work

Overlays are modal dialogs (P-05, P-06, P-07, P-08) that appear on top of the page.

### Define an Overlay

```yaml
overlays:
  - id: confirm-delete        # Unique overlay ID
    pattern_id: P-05          # Must be P-05..P-08
    title: "Delete Item"
    variant: danger           # default | danger | info
    size: small               # small | medium | large
    
    zones:
      zone-a:
        pattern_id: P-05
        components:
          - id: title
            props: { text: "Delete Item" }
      zone-b:
        pattern_id: P-05
        components:
          - id: warning-text
            props: { text: "Are you sure?" }
      zone-c:
        pattern_id: P-05
        components:
          - id: cancel-button
            actions:
              - id: close
                type: close_overlay
                target: confirm-delete
          - id: primary-button
            props: { variant: danger, label: "Delete" }
            actions:
              - id: execute
                type: api_call
                method: DELETE
                target: "/api/items/{{id}}"
    
    open_triggers:
      - delete-action         # Action IDs that open this overlay
    close_triggers:
      - close
      - execute
```

### Open an Overlay

```yaml
- id: icon-button
  props:
    icon: trash
  actions:
    - id: delete-action        # This matches open_triggers
      type: open_overlay
      target: confirm-delete   # Overlay ID
```

### Require Confirmation for Destructive Actions

```yaml
actions:
  - id: delete-item
    type: api_call
    method: DELETE
    target: "/api/items/{{id}}"
    confirm: confirm-delete    # Show this overlay first
```

---

## Permissions

### Page-Level Roles

```yaml
permissions:
  required_roles:
    - admin
    - manager
```

### Component-Level Permissions

```yaml
permissions:
  component_rules:
    - target: delete-btn       # Component key
      permission: items.delete
      fallback: hide           # hide | disable | redirect
```

### Action-Level Permissions

```yaml
permissions:
  action_rules:
    - target: delete-action    # Action ID
      permission: items.delete
      fallback: disable
```

---

## Request → UI Spec Examples

### Example 1: "Create a users table"

**Request:**
> "Create a table page to manage users. Show name, email, role, and status columns. 
> Allow creating new users, editing, and deleting existing ones."

**UI Spec (simplified):**

```yaml
version: "1.0"
id: users-list
title: "Users"
root_pattern: P-02
patterns_used: [P-02, P-13, P-05]

zones:
  zone-a:  # Header
    pattern_id: P-02
    components:
      - id: page-title
        props: { text: "Users" }
      - id: search-input
      - id: create-button
        actions:
          - { id: create, type: navigate, target: "/users/new" }

  zone-c:  # Table header
    pattern_id: P-02
    components:
      - id: checkbox-column
      - id: sortable-column-header
        props: { label: "Name", field: "name" }
      - id: sortable-column-header
        props: { label: "Email", field: "email" }
      - id: column-header
        props: { label: "Role" }
      - id: column-header
        props: { label: "Status" }
      - id: column-header
        props: { label: "Actions" }

  zone-d:  # Table body
    pattern_id: P-02
    components:
      - id: table-row
        data_binding: { source: users, path: "items[]" }
        children:
          - id: checkbox-cell
          - id: text-cell
          - id: text-cell
          - id: text-cell
          - id: status-badge
          - id: action-button-group
            children:
              - id: icon-button
                props: { icon: edit }
              - id: icon-button
                props: { icon: trash }
                actions:
                  - { id: delete, type: open_overlay, target: confirm }

datasources:
  - id: users
    type: rest
    endpoint: "/api/users"

overlays:
  - id: confirm
    pattern_id: P-05
    variant: danger
    # ... zones for confirmation dialog
```

---

### Example 2: "Campaign edit form"

**Request:**
> "Create an edit form for campaigns with name, description, targeting settings, 
> and a status toggle on the right panel."

**UI Spec (simplified):**

```yaml
version: "1.0"
id: campaign-edit
title: "Edit Campaign"
root_pattern: P-03
patterns_used: [P-03, P-10, P-14, P-05]

zones:
  zone-a:  # Action header
    pattern_id: P-03
    components:
      - id: back-button
      - id: page-title
        data_binding: { source: campaign, path: "name" }
      - id: save-button
      - id: save-close-button

  zone-b:  # Main content
    pattern_id: P-03
    components:
      - id: form-section
        props: { title: "Basic Info" }
        children:
          - id: input-field
            props: { label: "Name" }
          - id: textarea-field
            props: { label: "Description" }
      - id: accordion-section
        props: { title: "Targeting" }
        children:
          - id: select-field
            props: { label: "Audience", multi: true }

  zone-c:  # Properties panel
    pattern_id: P-03
    components:
      - id: status-toggle
        props: { label: "Active" }
      - id: details-section
      - id: schedule-section
      - id: delete-button

datasources:
  - id: campaign
    type: rest
    endpoint: "/api/campaigns/{{id}}"

overlays:
  - id: confirm-delete
    pattern_id: P-05
    variant: danger
```

---

## Validation

UI Specs are validated against:

1. **JSON Schema** (`ui-spec.schema.json`) — structure validation
2. **patterns.yaml** — valid pattern and zone IDs
3. **validation.yaml** — component placement rules

Run validation:
```bash
# TODO: Add validation script
npx ajv validate -s ui-spec.schema.json -d my-page.yaml
```

---

## Related Files

| File | Purpose |
|------|---------|
| `ui-spec.schema.json` | JSON Schema for validation |
| `examples/*.yaml` | Example UI Specs |
| `../design-system/patterns/patterns.yaml` | Pattern definitions |
| `../design-system/validation/validation.yaml` | Validation rules |
