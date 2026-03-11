# Interface Patterns Documentation

> Machine-readable specification for CRM Back Office UI generation

## Overview

`patterns.yaml` — це основний файл, що описує структурні патерни інтерфейсу для генерації UI. Він містить:

- **15 патернів інтерфейсу** (P-01 — P-15)
- **121 визначення компонентів**
- **Правила класифікації** для аналізу екранів

---

## Структура файлу

```yaml
patterns.yaml
├── version                    # Версія схеми
├── classification_rules       # Правила класифікації екранів
├── patterns[]                 # 15 патернів інтерфейсу
│   ├── Layout Patterns        # P-01, P-02, P-03
│   ├── Component Patterns     # P-04, P-09—P-15
│   └── Overlay Patterns       # P-05—P-08
└── component_definitions[]    # 121 визначення компонентів
```

---

## 1. Classification Rules

Правила для класифікації екранів за домінантною структурою.

```yaml
classification_rules:
  dominant_surface:
    description: "Classify by where user spends most interaction time"
    priority: 1
  hybrid:
    description: "If no single pattern dominates, mark as Hybrid"
    priority: 2
  overlay:
    description: "Secondary structures (modals, dialogs) do not define pattern"
    priority: 3
```

### Як використовувати:

1. Визначте, де користувач проводить найбільше часу
2. Якщо домінує один патерн — класифікуйте за ним
3. Overlay-патерни (модалки) не визначають основний патерн сторінки
4. Якщо немає чіткого домінанту — позначте як Hybrid

---

## 2. Patterns

### Типи патернів

| Type | Level | Description |
|------|-------|-------------|
| `layout` | `root` / `page` | Основні структури сторінок |
| `component` | `section` / `inline` | Переиспользуемые блоки всередині сторінок |
| `overlay` | `modal` | Модальні вікна та діалоги |

### Ієрархія патернів

```
P-01 (Sidebar Shell) — root
├── P-02 (Tabular Data View) — page
│   ├── P-11 (Filter Bar) — section
│   ├── P-12 (Pagination Footer) — section
│   ├── P-13 (Action Button Group) — inline
│   └── P-15 (Multi-Select Action Bar) — section
│
└── P-03 (Detail Editor) — page
    ├── P-04 (Card Selection Grid) — section
    ├── P-09 (Orderable List) — section
    ├── P-10 (Accordion Section) — section
    └── P-14 (Status Toggle Header) — inline

Overlays (can appear on any pattern):
├── P-05 (Confirmation Dialog)
├── P-06 (Input Dialog)
├── P-07 (Selection List Panel)
└── P-08 (Device Preview Overlay)
```

---

## 3. Pattern Structure

Кожен патерн має уніфіковану структуру:

```yaml
- id: P-XX                    # Унікальний ідентифікатор
  name: Pattern Name          # Назва патерну
  type: layout|component|overlay
  level: root|page|section|inline|modal
  description: "..."          # Опис призначення
  
  zones: []                   # Зони розміщення компонентів
  interactions: []            # Описи взаємодій
  constraints: []             # Обмеження та правила
  usage:                      # Рекомендації по використанню
    when: []                  # Коли використовувати
    avoid: []                 # Коли уникати
```

### Zones

Зони — це області всередині патерну, де можна розміщувати компоненти.

```yaml
zones:
  - id: zone-a                # Ідентифікатор зони
    name: header              # Назва зони
    position: top             # Позиція: top, left, right, center, bottom
    sizing:
      height: fixed           # fixed | fluid | auto
      value: 48px             # Розмір (якщо fixed)
      scrollable: true        # Чи скролиться зона
    optional: false           # Чи обов'язкова зона
    allowed_components:       # Дозволені компоненти
      - component-id-1
      - component-id-2
```

### Interactions

Описи взаємодій користувача з елементами.

```yaml
interactions:
  - element: button-id        # ID елемента
    action: click             # Тип дії: click, hover, drag, change, focus
    result: "What happens"    # Результат дії
```

### Constraints

Обов'язкові правила для патерну.

```yaml
constraints:
  - "Checkbox column always leftmost if present"
  - "Actions column always rightmost"
  - "Maximum 1 data column required"
```

---

## 4. All Patterns Reference

### Layout Patterns (Root/Page level)

| ID | Name | Level | Description |
|----|------|-------|-------------|
| **P-01** | Sidebar Navigation Shell | root | Основний каркас з бічним меню |
| **P-02** | Tabular Data View | page | Табличний вигляд даних з фільтрацією |
| **P-03** | Detail Editor with Properties Panel | page | Форма редагування з правою панеллю властивостей |

### Component Patterns (Section/Inline level)

| ID | Name | Level | Description |
|----|------|-------|-------------|
| **P-04** | Card Selection Grid | section | Сітка карток для вибору |
| **P-09** | Orderable List | section | Список з drag-and-drop сортуванням |
| **P-10** | Expandable Accordion Section | section | Складні секції (accordion) |
| **P-11** | Filter Bar | section | Панель фільтрів |
| **P-12** | Pagination Footer | section | Футер з пагінацією |
| **P-13** | Action Button Group | inline | Група кнопок дій (для рядків таблиці) |
| **P-14** | Status Toggle Header | inline | Перемикач статусу |
| **P-15** | Multi-Select Action Bar | section | Панель bulk-дій при виборі |

### Overlay Patterns (Modal level)

| ID | Name | Description |
|----|------|-------------|
| **P-05** | Confirmation Dialog | Діалог підтвердження дії |
| **P-06** | Input Dialog | Діалог введення даних |
| **P-07** | Selection List Panel | Панель вибору з пагінацією |
| **P-08** | Device Preview Overlay | Превью на пристрої |

---

## 5. Component Definitions

Визначення всіх компонентів, що можуть використовуватись в патернах.

### Формат визначення

```yaml
- id: component-id            # Унікальний ID (використовується в allowed_components)
  element: button | div       # HTML-елемент
  states: [default, hover]    # Можливі стани
  variants: [primary, danger] # Варіанти стилю
  requires: [icon, tooltip]   # Залежності
  contains: [child-1, child-2]# Що містить (composition)
  children: [child-type]      # Дочірні елементи (list)
```

### Категорії компонентів

| Category | Count | Examples |
|----------|-------|----------|
| Navigation | 6 | nav-item, nav-group, nav-submenu |
| Header/Top-bar | 6 | logo, app-title, user-avatar |
| Page Header | 3 | page-title, title, section-title |
| Form Elements | 10 | input-field, select-field, checkbox |
| Buttons | 22 | primary-button, save-button, delete-button |
| Filter Components | 7 | search-input, filter-dropdown |
| Tab Components | 2 | tab-group, tab |
| Table Components | 15 | table-row, column-header, checkbox-cell |
| Card Components | 6 | card, card-image, selectable-card |
| Selection | 4 | selected-count, selection-indicator |
| Accordion | 5 | accordion-section, accordion-header |
| Pagination | 13 | pagination, prev-button, page-input |
| Status/Toggle | 4 | status-toggle, status-badge |
| Menu | 3 | dropdown-menu, option |
| Preview | 4 | device-mockup, preview-content |
| Other | 16 | icon, description-text, drag-handle |

---

## 6. Usage Examples

### Приклад: Генерація P-02 (Tabular Data View)

```yaml
pattern: P-02
zones:
  zone-a:  # page-header
    - page-title: "Users"
    - search-input
    - create-button
    
  zone-b:  # filter-bar (optional)
    - tab-group: ["All", "Active", "Inactive"]
    - filter-dropdown: "Role"
    
  zone-c:  # table-header
    - checkbox-column
    - sortable-column-header: ["Name", "Email", "Role", "Created"]
    - column-header: "Actions"
    
  zone-d:  # table-body
    - table-row:
        - checkbox-cell
        - text-cell
        - user-chip-cell
        - date-cell
        - action-button-group: [edit, delete]
        
  zone-e:  # pagination-footer
    - count-info: "1-25 of 150"
    - rows-per-page-selector
    - prev-next-buttons
```

### Приклад: Генерація P-03 (Detail Editor)

```yaml
pattern: P-03
zones:
  zone-a:  # action-header
    - back-button
    - page-title: "Edit Campaign"
    - status-badge: "Active"
    - save-button
    - save-close-button
    
  zone-b:  # main-content
    - form-section: "Basic Info"
        - input-field: "Name"
        - textarea-field: "Description"
    - accordion-section: "Settings"
        - toggle-field: "Enable notifications"
        - select-field: "Priority"
        
  zone-c:  # properties-panel
    - status-toggle: "Active/Inactive"
    - details-section
    - schedule-section
    - delete-button
```

---

## 7. Validation

Правила валідації винесені в окремий файл:

```
src/design-system/validation/validation.yaml
```

### Типи правил:

- **Structure** — обов'язкові зони та компоненти
- **Nesting** — що в що можна вкладати
- **Consistency** — кількість primary-button, позиція actions
- **Interaction** — debounce, ESC для модалок
- **Accessibility** — focus trap, aria-label

---

## 8. Related Files

| File | Purpose |
|------|---------|
| `patterns.yaml` | Патерни та компоненти |
| `components.yaml` | Реєстр компонентів (existing + required) |
| `validation.yaml` | Правила валідації |
| `INTERFACE_PATTERNS.md` | Детальний опис патернів |

---

## Quick Reference Card

```
LAYOUT PATTERNS (wrap page content):
  P-01  Shell        → contains P-02 or P-03
  P-02  Table View   → contains P-11, P-12, P-13, P-15
  P-03  Detail Form  → contains P-04, P-09, P-10, P-14

COMPONENT PATTERNS (reusable blocks):
  P-04  Card Grid    │ P-11  Filter Bar
  P-09  Order List   │ P-12  Pagination
  P-10  Accordion    │ P-13  Action Buttons
  P-14  Status Toggle│ P-15  Bulk Actions

OVERLAY PATTERNS (modal dialogs):
  P-05  Confirm      → danger actions
  P-06  Input        → quick data entry
  P-07  Select List  → multi-item picker
  P-08  Preview      → device mockup
```

---

## Changelog

- **2026-01-25**: Added 107 missing component definitions
- **2026-01-25**: Initial pattern extraction from 430 screens
