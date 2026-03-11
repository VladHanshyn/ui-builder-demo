# UI Patterns Documentation

## Overview

This document describes the UI patterns identified from analyzing the back office screens.
Each pattern includes its structure, components used, and implementation guidelines.

---

## Layout Patterns

### LP-001: Standard Page Layout

**Description:** The default page layout with sidebar navigation and content area.

**Structure:**
```
┌─────────────────────────────────────────────────────┐
│                    Top Bar (48px)                   │
├─────────┬───────────────────────────────────────────┤
│         │              Header                       │
│ Sidebar │─────────────────────────────────────────────│
│ (236px) │              Content                      │
│         │                                           │
│         │                                           │
└─────────┴───────────────────────────────────────────┘
```

**Components:**
- `TopBar`: Logo, project selector, user actions
- `Sidebar`: Navigation menu with groups and submenus
- `Header`: Page title, filters, action buttons
- `Content`: Main content area (tables, forms, etc.)

---

### LP-002: Table Page Layout

**Description:** Layout for pages displaying data in table format.

**Structure:**
```
┌─────────────────────────────────────────────────────┐
│ Page Title                                          │
├─────────────────────────────────────────────────────┤
│ Filters Row: [Filter] [Filter] [Search] [Actions]   │
├─────────────────────────────────────────────────────┤
│ Table Header                                        │
├─────────────────────────────────────────────────────┤
│ Table Row 1                                         │
│ Table Row 2                                         │
│ ...                                                 │
├─────────────────────────────────────────────────────┤
│ Pagination: [Count] [Rows per page] [Page nav]      │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Title: `text-headline-1`
- Filters: `Select`, `Input`, `DatePicker`
- Table: Custom table with `Checkbox`, `Toggle`, `Chip`, `ButtonGroup`
- Pagination: Page info, rows selector, navigation buttons

---

### LP-003: Configuration Page Layout

**Description:** Layout for pages with configuration panels.

**Structure:**
```
┌─────────────────────────────────────────────────────┐
│ Header: [Back] Page Title    [Actions...]           │
├───────────────────────────────────┬─────────────────┤
│                                   │   Right Sidebar │
│       Main Content Area           │   (Settings)    │
│       (Forms, Sections)           │                 │
│                                   │                 │
└───────────────────────────────────┴─────────────────┘
```

**Components:**
- Header with back button, title, action buttons
- Main content: Forms, sections with inputs
- Right sidebar: Status toggle, details, schedule

---

## Component Patterns

### CP-001: Filter Row

**Description:** Horizontal row of filter controls.

**Structure:**
```
[Status Filter ▼] [List Filter ▼] [Date Range ▼] [All Filters +] | [Search...] [⚙] [+ Create]
```

**Components:**
- Filter dropdowns: `Select` with `CaretDownIcon`
- All Filters: Button with `PlusIcon`
- Search: `SearchInput`
- Settings: `IconButton`
- Create: `Button` with icon

---

### CP-002: Table Row

**Description:** Standard table row with common elements.

**Structure:**
```
[☐] [Toggle] [Title] [ID] [Date] [User Chip] [Date] [User Chip] [Actions ▼]
```

**Components:**
- Checkbox: `ListCheckbox`
- State toggle: `Toggle`
- Title with copy: Text + `CopyIcon`
- Dates: Formatted datetime
- Users: `Chip` with avatar/initials
- Actions: `ButtonGroup` with Edit, Trash, More

---

### CP-003: Form Section

**Description:** Grouped form inputs with title.

**Structure:**
```
Section Title
┌────────────────────────────────────┐
│ Label*                             │
│ [Input field                     ] │
├────────────────────────────────────┤
│ Label                              │
│ [Textarea                        ] │
│ [                                ] │
└────────────────────────────────────┘
```

**Components:**
- Section title: `text-headline-3`
- Labels: `text-headline-4` with optional * for required
- Inputs: `Input`, `Textarea`, `Select`, `DatePickerInput`

---

### CP-004: Action Header

**Description:** Page header with navigation and actions.

**Structure:**
```
[←] Page Title                    [Action 1] [Action 2] [Primary Action]
```

**Components:**
- Back button: `IconButton` with `ArrowLeftIcon`
- Title: `text-headline-1`
- Actions: `Button` variants (secondary, primary)

---

### CP-005: Card Grid

**Description:** Grid of selectable cards/items.

**Structure:**
```
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ [img] │ │ [img] │ │ [img] │ │ [img] │
│ Title │ │ Title │ │ Title │ │ Title │
│ Meta  │ │ Meta  │ │ Meta  │ │ Meta  │
└───────┘ └───────┘ └───────┘ └───────┘
```

**Components:**
- Card wrapper with hover state
- Image/icon area
- Title: `text-headline-4`
- Metadata: `text-paragraph-3`

---

## Modal Patterns

### MP-001: Confirmation Modal (Large)

**Description:** Large modal for confirmations with optional input.

**Structure:**
```
┌─────────────────────────────────────┐
│                                     │
│  Title                              │
│  Description text...                │
│                                     │
│  [Optional Input Field]             │
│                                     │
│  [Primary Action] [Cancel]          │
│                                     │
└─────────────────────────────────────┘
```

**Size:** 400px width, 16px border-radius, 32px padding

---

### MP-002: Popup (Small)

**Description:** Compact confirmation popup.

**Structure:**
```
┌───────────────────────┐
│ Title                 │
│ Description text...   │
│                       │
│ [Cancel] [Confirm]    │
└───────────────────────┘
```

**Size:** 200px width, 8px border-radius, 16px padding

---

## Spacing Guidelines

### Page Spacing
- Page padding: 24px
- Section gap: 24px
- Component gap: 16px
- Element gap: 8px

### Table Spacing
- Header height: 32px
- Row height: 48px
- Cell padding: 8px horizontal

### Form Spacing
- Field gap: 16px
- Label to input: 4px
- Section gap: 24px

---

## Color Usage

### Interactive States
- Default: `--color-base-surface-primary` with `--color-base-stroke` border
- Hover: `--color-brand-primary` with 0.08 opacity
- Active: `--color-brand-primary` with 0.08 opacity
- Selected: `--color-brand-primary` text color

### Status Colors
- Success: `--color-system-success`
- Warning: `--color-system-warning`
- Error: `--color-system-error`
- Info: `--color-system-info`

---

## Notes

_This document will be updated as more screens are analyzed._
