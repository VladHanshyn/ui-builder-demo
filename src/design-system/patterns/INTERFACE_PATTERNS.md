# Interface Patterns

Extracted from structural analysis of 330+ screens.  
Patterns are technology-agnostic and semantically neutral.

---

## Pattern Index

1. [P-01: Sidebar Navigation Shell](#p-01-sidebar-navigation-shell)
2. [P-02: Tabular Data View](#p-02-tabular-data-view)
3. [P-03: Detail Editor with Properties Panel](#p-03-detail-editor-with-properties-panel)
4. [P-04: Card Selection Grid](#p-04-card-selection-grid)
5. [P-05: Confirmation Dialog](#p-05-confirmation-dialog)
6. [P-06: Input Dialog](#p-06-input-dialog)
7. [P-07: Selection List Panel](#p-07-selection-list-panel)
8. [P-08: Device Preview Overlay](#p-08-device-preview-overlay)
9. [P-09: Orderable List](#p-09-orderable-list)
10. [P-10: Expandable Accordion Section](#p-10-expandable-accordion-section)
11. [P-11: Filter Bar](#p-11-filter-bar)
12. [P-12: Pagination Footer](#p-12-pagination-footer)
13. [P-13: Action Button Group](#p-13-action-button-group)
14. [P-14: Status Toggle Header](#p-14-status-toggle-header)
15. [P-15: Multi-Select Action Bar](#p-15-multi-select-action-bar)

---

## P-01: Sidebar Navigation Shell

### Pattern Name
**Sidebar Navigation Shell** (Primary Application Frame)

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ ZONE-A: Top Bar                                                  │
│ [Brand/Logo]              [Global Actions] [Notifications] [User]│
├─────────────┬────────────────────────────────────────────────────┤
│ ZONE-B      │ ZONE-C: Content Area                               │
│ Sidebar     │                                                    │
│             │ (Contains other patterns)                          │
│ - Nav Group │                                                    │
│ - Nav Group │                                                    │
│ - Nav Item  │                                                    │
│ - Submenu   │                                                    │
│             │                                                    │
│             │                                                    │
│ [Footer]    │                                                    │
└─────────────┴────────────────────────────────────────────────────┘
```

**Zones:**
| Zone | Name | Fixed/Fluid | Typical Width/Height |
|------|------|-------------|----------------------|
| A | Top Bar | Fixed height | 48px |
| B | Sidebar | Fixed width | 236px |
| C | Content Area | Fluid | Remaining space |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Nav Item | Click | Navigate to content, highlight active |
| Nav Group | Click | Expand/collapse submenu |
| Submenu Item | Click | Navigate, highlight both parent and item |
| Logo | Click | Navigate to root/home |
| Footer Link | Click | Navigate to parent application |

### Variations Observed

1. **Collapsed Sidebar** — Icons only, no labels
2. **With Notification Badge** — Indicator on nav items
3. **With Project Selector** — Dropdown in top bar near logo
4. **Scrollable Sidebar** — When nav items exceed viewport

### When to Use

- As the primary application frame
- When hierarchical navigation is required
- When consistent global access is needed
- For multi-section applications

---

## P-02: Tabular Data View

### Pattern Name
**Tabular Data View** (List/Collection Display)

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ ZONE-A: Page Header                                              │
│ [Title]                              [Search] [Filter] [+Action] │
├──────────────────────────────────────────────────────────────────┤
│ ZONE-B: Filter Bar (optional)                                    │
│ [Tab/Segment] [Tab] [Tab]     [Dropdown] [Dropdown] [Dropdown]   │
├──────────────────────────────────────────────────────────────────┤
│ ZONE-C: Table Header                                             │
│ [☐] [Col1 ↕] [Col2 ↕] [Col3 ↕] [Col4 ↕] ... [Actions]           │
├──────────────────────────────────────────────────────────────────┤
│ ZONE-D: Table Body (scrollable)                                  │
│ [☐] [Data]  [Data]   [Data]   [Data]  ... [Icon][Icon][Icon]    │
│ [☐] [Data]  [Data]   [Data]   [Data]  ... [Icon][Icon][Icon]    │
│ [☐] [Data]  [Data]   [Data]   [Data]  ... [Icon][Icon][Icon]    │
├──────────────────────────────────────────────────────────────────┤
│ ZONE-E: Pagination Footer                                        │
│ [Count: 1-N of M]       [Rows/page ▼] [Page: N] [◀][▶]          │
└──────────────────────────────────────────────────────────────────┘
```

**Zones:**
| Zone | Name | Fixed/Fluid | Description |
|------|------|-------------|-------------|
| A | Page Header | Fixed | Title + primary actions |
| B | Filter Bar | Optional | Tabs, dropdowns, toggles |
| C | Table Header | Fixed | Column labels, sort controls |
| D | Table Body | Scrollable | Data rows |
| E | Pagination | Fixed | Navigation, count, settings |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Column Header | Click | Toggle sort direction |
| Row Checkbox | Click | Select/deselect row |
| Header Checkbox | Click | Select/deselect all |
| Row | Hover | Show row actions, highlight |
| Row | Click | Navigate to detail view |
| Action Icon | Click | Execute action (edit/copy/delete) |
| Tab/Segment | Click | Filter data by category |
| Pagination | Click | Navigate pages |

### Variations Observed

1. **With Status Toggle** — Toggle in first data column
2. **With Inline Edit** — Edit button opens inline form
3. **With Copy Actions** — Copy icon next to ID/text fields
4. **With Avatar Column** — User chips/avatars
5. **Without Checkbox Column** — No multi-select needed
6. **With Row Expansion** — Expandable row details

### When to Use

- Displaying collections of similar items
- When sorting/filtering is required
- When bulk operations are needed
- When items have consistent properties

---

## P-03: Detail Editor with Properties Panel

### Pattern Name
**Detail Editor with Properties Panel** (Edit/Configuration View)

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ ZONE-A: Action Header                                            │
│ [← Back] [Title]                   [Secondary] [Primary Action]  │
├────────────────────────────────────────────┬─────────────────────┤
│ ZONE-B: Main Content Area                  │ ZONE-C: Properties  │
│                                            │ Panel               │
│ ┌────────────────────────────────────┐    │                     │
│ │ Section 1                          │    │ Status Section      │
│ │ [Form fields, inputs, controls]    │    │ [Toggle: On/Off]    │
│ └────────────────────────────────────┘    ├─────────────────────┤
│                                            │ Details Section     │
│ ┌────────────────────────────────────┐    │ [Label + Input]     │
│ │ Section 2                          │    │ [Label + Input]     │
│ │ [Form fields, inputs, controls]    │    │ [Label + Textarea]  │
│ └────────────────────────────────────┘    ├─────────────────────┤
│                                            │ Settings Section    │
│ ┌────────────────────────────────────┐    │ [Dropdowns]         │
│ │ Section N                          │    │ [Date pickers]      │
│ │ [Preview, upload, complex input]   │    ├─────────────────────┤
│ └────────────────────────────────────┘    │ [Danger Action]     │
│                                            │                     │
└────────────────────────────────────────────┴─────────────────────┘
```

**Zones:**
| Zone | Name | Fixed/Fluid | Typical Width |
|------|------|-------------|---------------|
| A | Action Header | Fixed height | Full width, 48-64px |
| B | Main Content | Fluid | Remaining - 330px |
| C | Properties Panel | Fixed width | 330px |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Back Button | Click | Navigate to list view |
| Save Changes | Click | Persist changes, stay on page |
| Save & Close | Click | Persist changes, navigate back |
| Status Toggle | Click | Toggle active/inactive state |
| Form Field | Input | Update value, mark as dirty |
| Delete Button | Click | Show confirmation dialog |
| Section Header | Click | Expand/collapse section |

### Variations Observed

1. **Without Properties Panel** — Full-width content only
2. **With Tabs in Content** — Multiple content sections
3. **With Preview Panel** — Live preview in content area
4. **With Nested Lists** — Editable item lists in content
5. **Scrollable Content** — Long forms with fixed header/panel

### When to Use

- Creating or editing single items
- When item has many configurable properties
- When status/metadata should be visible while editing
- When contextual actions are needed

---

## P-04: Card Selection Grid

### Pattern Name
**Card Selection Grid** (Visual Item Picker)

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ ZONE-A: Grid Header                                              │
│ [Tabs: Category1 | Category2]      [Search] [Filter] [View Toggle]│
├──────────────────────────────────────────────────────────────────┤
│ ZONE-B: Card Grid (scrollable)                                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                 │
│ │ [Image] │ │ [Image] │ │ [Image] │ │ [Image] │                 │
│ │ Title   │ │ Title   │ │ Title   │ │ Title   │                 │
│ │ Meta    │ │ Meta    │ │ Meta    │ │ Meta    │                 │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                 │
│ │ [Image] │ │ [Image] │ │ [Image] │ │ [Image] │                 │
│ │ Title   │ │ Title   │ │ Title   │ │ Title   │                 │
│ │ Meta    │ │ Meta    │ │ Meta    │ │ Meta    │                 │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                 │
├──────────────────────────────────────────────────────────────────┤
│ ZONE-C: Action Bar (sticky)                                      │
│ [+ Add Selected (N)]                            [Clear/Cancel]   │
└──────────────────────────────────────────────────────────────────┘
```

**Zones:**
| Zone | Name | Fixed/Fluid | Description |
|------|------|-------------|-------------|
| A | Grid Header | Fixed | Filters, search, view controls |
| B | Card Grid | Scrollable | Selectable card items |
| C | Action Bar | Fixed (sticky) | Selection actions |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Card | Click | Toggle selection state |
| Card | Hover | Show selection indicator |
| Tab | Click | Filter by category |
| Search | Input | Filter cards by text |
| Add Selected | Click | Confirm selection |
| Clear | Click | Deselect all |

### Variations Observed

1. **Single Select** — Only one card selectable
2. **Multi Select** — Checkbox indicator on cards
3. **With Quantity Control** — +/- buttons on selected cards
4. **With Preview on Select** — Preview panel appears
5. **Drag to Target** — Cards draggable to drop zone

### When to Use

- Selecting visual items (images, icons)
- When items benefit from visual representation
- When categorization aids selection
- Building collections or configurations

---

## P-05: Confirmation Dialog

### Pattern Name
**Confirmation Dialog** (Action Verification)

### Layout Structure

```
┌─────────────────────────────────────────┐
│ ZONE-A: Header (optional icon)          │
│ [Title Text]                            │
├─────────────────────────────────────────┤
│ ZONE-B: Body                            │
│ [Description/warning message]           │
│                                         │
├─────────────────────────────────────────┤
│ ZONE-C: Actions                         │
│ [Primary Action]  [Cancel]              │
└─────────────────────────────────────────┘
```

**Zones:**
| Zone | Name | Content |
|------|------|---------|
| A | Header | Question or action name |
| B | Body | Consequence explanation |
| C | Actions | Confirm + Cancel buttons |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Primary Button | Click | Execute action, close dialog |
| Cancel Button | Click | Close dialog, no action |
| Overlay | Click | Close dialog (optional) |
| Escape Key | Press | Close dialog |

### Variations Observed

1. **Danger Variant** — Red primary button (destructive actions)
2. **Info Variant** — Neutral primary button
3. **With Icon** — Warning/info icon in header
4. **Small Size** — Compact (200px width)
5. **Medium Size** — Standard (400px width)

### When to Use

- Before destructive actions (delete, remove)
- Before irreversible operations
- When action affects other data/users
- To prevent accidental actions

---

## P-06: Input Dialog

### Pattern Name
**Input Dialog** (Data Entry Modal)

### Layout Structure

```
┌─────────────────────────────────────────┐
│ ZONE-A: Header                          │
│ [Title Text]                            │
├─────────────────────────────────────────┤
│ ZONE-B: Description                     │
│ [Instruction text]                      │
├─────────────────────────────────────────┤
│ ZONE-C: Input Area                      │
│ [Label]                                 │
│ [Input Field                         ]  │
│                                         │
│ [Label]                                 │
│ [Input Field                         ]  │
├─────────────────────────────────────────┤
│ ZONE-D: Actions                         │
│ [Cancel]                 [Submit]       │
└─────────────────────────────────────────┘
```

**Zones:**
| Zone | Name | Content |
|------|------|---------|
| A | Header | Dialog purpose |
| B | Description | Instructions/context |
| C | Input Area | Form fields |
| D | Actions | Cancel + Submit buttons |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Input Field | Focus | Show focus state |
| Input Field | Input | Validate, enable submit |
| Submit Button | Click | Validate, submit, close |
| Cancel Button | Click | Close, discard input |
| Required Field Empty | Submit | Show error state |

### Variations Observed

1. **Single Input** — One field only
2. **Multi Input** — Multiple fields
3. **With Validation** — Inline error messages
4. **With Helper Text** — Hints below fields
5. **With Separated Footer** — Border above actions

### When to Use

- Quick data entry without page navigation
- Renaming, duplicating items
- Adding simple records
- Capturing single data points

---

## P-07: Selection List Panel

### Pattern Name
**Selection List Panel** (Multi-Item Picker)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ ZONE-A: Panel Header                                            │
│ [Title]                                     Selected (N)        │
├─────────────────────────────────────────────────────────────────┤
│ ZONE-B: Filter Controls                                         │
│ [Filter ▼] [Filter ▼]                       [Search...] [↻]    │
├─────────────────────────────────────────────────────────────────┤
│ ZONE-C: Column Headers                                          │
│ [☐] Column1 | Column2 | Column3 | Column4                      │
├─────────────────────────────────────────────────────────────────┤
│ ZONE-D: Selectable Rows (scrollable)                            │
│ [☑] Data    | Data    | Data    | Data                         │
│ [☐] Data    | Data    | Data    | Data                         │
│ [☑] Data    | Data    | Data    | Data                         │
│ ...                                                             │
├─────────────────────────────────────────────────────────────────┤
│ ZONE-E: Pagination                                              │
│ 1-N of M                              [Page] [◀][▶]            │
├─────────────────────────────────────────────────────────────────┤
│ ZONE-F: Panel Footer                                            │
│ [Cancel]                                     [Add Items (N)]    │
└─────────────────────────────────────────────────────────────────┘
```

**Zones:**
| Zone | Name | Fixed/Fluid | Description |
|------|------|-------------|-------------|
| A | Panel Header | Fixed | Title + selection count |
| B | Filter Controls | Fixed | Search + filters |
| C | Column Headers | Fixed | Sortable columns |
| D | Selectable Rows | Scrollable | Checkbox + data |
| E | Pagination | Fixed | Page navigation |
| F | Panel Footer | Fixed | Cancel + Confirm |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Row Checkbox | Click | Toggle selection |
| Header Checkbox | Click | Select/deselect all visible |
| Filter | Change | Update visible rows |
| Search | Input | Filter by text |
| Add Items | Click | Confirm selection, close |
| Cancel | Click | Discard selection, close |

### Variations Observed

1. **As Modal** — Overlaid on page
2. **As Slide Panel** — Slides from side
3. **With Preview Column** — Image/icon column
4. **With Stats Columns** — Numeric data display
5. **Single Select Mode** — Radio instead of checkbox

### When to Use

- Adding multiple related items
- Selecting from large collections
- When filtering/search is necessary
- Associating items to parent record

---

## P-08: Device Preview Overlay

### Pattern Name
**Device Preview Overlay** (Contextual Preview)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                                                    [× Close]    │
│      ┌───────────────────────────────┐     ZONE-C: Config      │
│      │ ZONE-B: Device Frame          │     Panel               │
│      │ ┌─────────────────────────┐   │     ─────────────────   │
│      │ │                         │   │     [Input fields]      │
│      │ │   Preview Content       │   │     [Dropdowns]         │
│      │ │                         │   │     [Selections]        │
│      │ │                         │   │                         │
│      │ └─────────────────────────┘   │     [Item List]         │
│      │ [Navigation Bar]              │                         │
│      └───────────────────────────────┘                         │
│                                                                 │
│      ZONE-A: Preview Controls                                   │
│      [Tab] [Tab] [Tab]   [Page 1] [2] [3] [4] [5]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Zones:**
| Zone | Name | Description |
|------|------|-------------|
| A | Preview Controls | Tabs, pagination, navigation |
| B | Device Frame | Mockup container |
| C | Config Panel | Settings that affect preview |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Close Button | Click | Exit preview mode |
| Tab | Click | Switch preview section |
| Page Dot | Click | Navigate preview pages |
| Config Input | Change | Update preview in real-time |
| Device Scroll | Scroll | Navigate within preview |

### Variations Observed

1. **Full Overlay** — Covers entire screen
2. **Side Panel** — Preview in sidebar
3. **With Device Selector** — Switch device types
4. **With Tab Navigation** — Multiple preview screens
5. **Interactive Preview** — Clickable preview elements

### When to Use

- Previewing end-user experience
- Testing configurations visually
- When context differs from admin view
- Validating visual content

---

## P-09: Orderable List

### Pattern Name
**Orderable List** (Priority/Sequence Editor)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ ZONE-A: List Header                                             │
│ [Title]                              [Expand All] [Collapse All]│
├─────────────────────────────────────────────────────────────────┤
│ ZONE-B: Filter Tabs (optional)                                  │
│ [All] [Active] [Inactive]                                       │
├─────────────────────────────────────────────────────────────────┤
│ ZONE-C: Column Headers                                          │
│ [≡] [Status] Title | Property | Property | Order Actions       │
├─────────────────────────────────────────────────────────────────┤
│ ZONE-D: Orderable Rows                                          │
│ [≡] [●] Item 1 | Data | Data | [↓ To Bottom] [↑ To Top]       │
│ [≡] [○] Item 2 | Data | Data | [↓ To Bottom] [↑ To Top]       │
│ [≡] [●] Item 3 | Data | Data | [↓ To Bottom] [↑ To Top]       │
├─────────────────────────────────────────────────────────────────┤
│ ZONE-E: Footer Actions                                          │
│ [Cancel]                                    [Save & Close]      │
└─────────────────────────────────────────────────────────────────┘
```

**Zones:**
| Zone | Name | Description |
|------|------|-------------|
| A | List Header | Title + bulk actions |
| B | Filter Tabs | Status filtering |
| C | Column Headers | Labels |
| D | Orderable Rows | Draggable items |
| E | Footer Actions | Save/Cancel |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Drag Handle | Drag | Reorder item position |
| To Top | Click | Move to first position |
| To Bottom | Click | Move to last position |
| Status Toggle | Click | Enable/disable item |
| Save & Close | Click | Persist order, navigate back |

### Variations Observed

1. **With Preview Column** — Visual preview of item
2. **With Expandable Rows** — Additional details on expand
3. **Nested Ordering** — Groups with internal order
4. **With Quick Actions** — Edit/delete per row

### When to Use

- Setting display priority
- Ordering navigation items
- Configuring sequence/workflow
- Managing ranked lists

---

## P-10: Expandable Accordion Section

### Pattern Name
**Expandable Accordion Section** (Collapsible Content Block)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ ZONE-A: Section Header (clickable)                              │
│ [≡] [Toggle] [Title]         [Badge] [Actions] [▼ Expand]      │
├─────────────────────────────────────────────────────────────────┤
│ ZONE-B: Section Content (collapsible)                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Content Area                                                │ │
│ │ - Form fields                                               │ │
│ │ - Lists                                                     │ │
│ │ - Cards                                                     │ │
│ │ - Custom content                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Zones:**
| Zone | Name | Description |
|------|------|-------------|
| A | Section Header | Title, controls, expand toggle |
| B | Section Content | Collapsible content area |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Header | Click | Toggle expand/collapse |
| Expand Icon | Click | Toggle expand/collapse |
| Toggle | Click | Enable/disable section |
| Actions | Click | Section-specific actions |

### Variations Observed

1. **With Drag Handle** — Reorderable sections
2. **With Status Toggle** — Enable/disable section
3. **With Counter Badge** — Item count indicator
4. **With Quick Actions** — Edit/delete/duplicate
5. **Always Expanded** — No collapse, just styled header

### When to Use

- Organizing long forms
- Grouping related settings
- Managing variable-length content
- When space efficiency matters

---

## P-11: Filter Bar

### Pattern Name
**Filter Bar** (Query Controls)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [Filter ▼] [Filter ▼] [Filter ▼] [+All Filters] │ [Search...] [Actions] │
│    ^          ^          ^           ^          │      ^          ^      │
│ Dropdown  Dropdown   Dropdown   Expand btn    │  Search box   Buttons │
└─────────────────────────────────────────────────────────────────┘
  ZONE-A: Filter Controls (left)         ZONE-B: Search + Actions (right)
```

**Zones:**
| Zone | Name | Alignment | Content |
|------|------|-----------|---------|
| A | Filter Controls | Left | Dropdowns, toggles |
| B | Search + Actions | Right | Search input, buttons |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Dropdown | Click | Open options menu |
| Option | Select | Apply filter immediately |
| All Filters | Click | Expand advanced filters |
| Search | Input | Filter after debounce |
| Clear | Click | Reset all filters |

### Variations Observed

1. **With Tabs/Segments** — Mutually exclusive categories
2. **With Date Range Picker** — Date filtering
3. **With Badge Counts** — Show filtered counts per option
4. **Collapsible** — Hide/show filter row
5. **With Saved Filters** — Preset filter combinations

### When to Use

- Above data tables
- When multiple filter dimensions exist
- When search is frequently used
- For complex data querying

---

## P-12: Pagination Footer

### Pattern Name
**Pagination Footer** (Navigation + Info Bar)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [1 – N of M]     │ [Rows per page: 25 ▼] │ [Page: 1 ▼] │ [◀][▶] │
│      ^           │          ^            │       ^      │    ^   │
│   Count info     │   Page size selector  │ Page picker │  Nav   │
└─────────────────────────────────────────────────────────────────┘
  ZONE-A: Info      ZONE-B: Size Control    ZONE-C: Page   ZONE-D: Nav
```

**Zones:**
| Zone | Name | Content |
|------|------|---------|
| A | Info | Current range and total |
| B | Size Control | Rows per page dropdown |
| C | Page Picker | Direct page input/select |
| D | Navigation | Previous/next buttons |

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Previous | Click | Go to previous page |
| Next | Click | Go to next page |
| Page Size | Change | Reload with new size |
| Page Input | Change | Jump to specific page |
| First/Last | Click | Jump to boundary |

### Variations Observed

1. **Simple** — Just prev/next arrows
2. **With Page Numbers** — Clickable page links
3. **With First/Last** — Jump to boundaries
4. **With Row Selection Info** — "5 selected" text
5. **Without Size Selector** — Fixed page size

### When to Use

- Below paginated lists/tables
- When data exceeds viewport
- When page size customization is valuable
- For large data sets

---

## P-13: Action Button Group

### Pattern Name
**Action Button Group** (Inline Action Controls)

### Layout Structure

```
┌────────────────────────────────────────┐
│ [Icon] [Icon] [Icon] │ [▼ More]       │
│   ^      ^      ^    │      ^          │
│ Primary actions      │ Overflow menu   │
└────────────────────────────────────────┘
```

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Icon Button | Click | Execute action |
| Icon Button | Hover | Show tooltip |
| More Button | Click | Open dropdown menu |
| Menu Item | Click | Execute action |

### Variations Observed

1. **Icons Only** — Compact, relies on tooltips
2. **With Labels** — Text under/beside icons
3. **With Dropdown** — Overflow actions in menu
4. **Grouped** — Visual grouping of related actions
5. **Contextual** — Appears on hover only

### When to Use

- Per-row actions in tables
- Toolbar controls
- Card action areas
- When multiple actions apply to one item

---

## P-14: Status Toggle Header

### Pattern Name
**Status Toggle Header** (State Control Section)

### Layout Structure

```
┌─────────────────────────────────────────┐
│ [Label: Status Name]     [Toggle ●───] │
│                          [Active/Live]  │
└─────────────────────────────────────────┘
```

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Toggle | Click | Change state |
| Label | — | Describes current state |

### Variations Observed

1. **With Text Label** — "On"/"Off", "Live"/"Draft"
2. **Without Text** — Toggle only
3. **With Confirmation** — Confirm before toggle
4. **Disabled State** — Unclickable when locked

### When to Use

- At top of edit panels
- When publish/unpublish is primary action
- For boolean configuration states
- When state change has significant impact

---

## P-15: Multi-Select Action Bar

### Pattern Name
**Multi-Select Action Bar** (Bulk Action Controls)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [Selected: N items]    │    [Action] [Action]    │    [Clear]  │
│         ^              │          ^              │       ^      │
│    Selection count     │    Bulk action buttons  │  Clear btn   │
└─────────────────────────────────────────────────────────────────┘
```

### Typical Interactions

| Element | Interaction | Result |
|---------|-------------|--------|
| Action Button | Click | Apply to all selected |
| Clear | Click | Deselect all items |
| Bar | — | Appears when items selected |

### Variations Observed

1. **Sticky** — Stays visible while scrolling
2. **Floating** — Appears near selection
3. **In Header** — Replaces normal header
4. **At Bottom** — Fixed to content bottom

### When to Use

- When bulk operations are common
- In selection grids and tables
- When operating on multiple items at once
- To provide clear selection feedback

---

## Pattern Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     P-01: Sidebar Shell                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │   P-02: Tabular Data View                                  │ │
│  │   ├── P-11: Filter Bar                                     │ │
│  │   ├── P-13: Action Button Group (per row)                  │ │
│  │   ├── P-12: Pagination Footer                              │ │
│  │   └── P-15: Multi-Select Action Bar                        │ │
│  │                                                            │ │
│  │   P-03: Detail Editor                                      │ │
│  │   ├── P-14: Status Toggle Header                           │ │
│  │   ├── P-10: Expandable Accordion                           │ │
│  │   ├── P-04: Card Selection Grid                            │ │
│  │   └── P-09: Orderable List                                 │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Overlays (on any pattern):                                     │
│  ├── P-05: Confirmation Dialog                                  │
│  ├── P-06: Input Dialog                                         │
│  ├── P-07: Selection List Panel                                 │
│  └── P-08: Device Preview Overlay                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Table

| ID | Pattern Name | Type | Nesting Level |
|----|--------------|------|---------------|
| P-01 | Sidebar Navigation Shell | Layout | Root |
| P-02 | Tabular Data View | Layout | Page-level |
| P-03 | Detail Editor with Properties | Layout | Page-level |
| P-04 | Card Selection Grid | Component | Section-level |
| P-05 | Confirmation Dialog | Overlay | Modal |
| P-06 | Input Dialog | Overlay | Modal |
| P-07 | Selection List Panel | Overlay | Modal/Panel |
| P-08 | Device Preview Overlay | Overlay | Modal |
| P-09 | Orderable List | Component | Section-level |
| P-10 | Expandable Accordion | Component | Section-level |
| P-11 | Filter Bar | Component | Section-level |
| P-12 | Pagination Footer | Component | Section-level |
| P-13 | Action Button Group | Component | Inline |
| P-14 | Status Toggle Header | Component | Inline |
| P-15 | Multi-Select Action Bar | Component | Section-level |

---

*Document generated from structural analysis of 330+ screens.*
