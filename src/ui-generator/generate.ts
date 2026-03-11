/**
 * UI Spec Generator
 * Deterministic generation of UI specs based on templates
 */

import type { TemplateType, UISpec, ComponentSpec, OverlaySpec } from './types';

interface GenerateOptions {
  template: TemplateType;
  title: string;
  entityName: string;
  entityNamePlural?: string;
  fields?: Array<{
    name: string;
    label: string;
    type: string;
    sortable?: boolean;
  }>;
  hasDelete?: boolean;
  hasCreate?: boolean;
  hasEdit?: boolean;
}

/**
 * Generate a UI Spec based on template type
 */
export function generateUISpec(options: GenerateOptions): UISpec {
  const {
    template,
    title,
    entityName,
    entityNamePlural = `${entityName}s`,
    fields = [
      { name: 'name', label: 'Name', type: 'text', sortable: true },
      { name: 'status', label: 'Status', type: 'badge' },
      { name: 'created_at', label: 'Created', type: 'date', sortable: true },
    ],
    hasDelete = true,
    hasCreate = true,
    hasEdit = true,
  } = options;

  const entityId = entityName.toLowerCase().replace(/\s+/g, '-');

  switch (template) {
    case 'table':
      return generateTableSpec(entityId, title, entityNamePlural, fields, { hasDelete, hasCreate, hasEdit });
    case 'editor':
      return generateEditorSpec(entityId, title, entityName, fields, { hasDelete });
    case 'overlay':
      return generateOverlaySpec(entityId, title);
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

/**
 * Generate P-02 Table View spec
 */
function generateTableSpec(
  entityId: string,
  title: string,
  entityNamePlural: string,
  fields: Array<{ name: string; label: string; type: string; sortable?: boolean }>,
  options: { hasDelete: boolean; hasCreate: boolean; hasEdit: boolean }
): UISpec {
  const datasourceId = `${entityId}-datasource`;
  
  // Build table columns
  const tableHeaderComponents: ComponentSpec[] = [
    { id: 'checkbox-column', key: 'select-all' },
  ];
  
  const tableRowChildren: ComponentSpec[] = [
    { id: 'checkbox-cell', key: 'row-select' },
  ];

  for (const field of fields) {
    if (field.sortable) {
      tableHeaderComponents.push({
        id: 'sortable-column-header',
        key: `col-${field.name}`,
        props: { label: field.label, field: field.name, sortable: true },
      });
    } else {
      tableHeaderComponents.push({
        id: 'column-header',
        key: `col-${field.name}`,
        props: { label: field.label },
      });
    }

    const cellType = field.type === 'date' ? 'date-cell' : 
                     field.type === 'badge' ? 'status-badge' : 'text-cell';
    
    tableRowChildren.push({
      id: cellType,
      key: `cell-${field.name}`,
      data_binding: { source: datasourceId, path: field.name },
    });
  }

  // Actions column
  tableHeaderComponents.push({
    id: 'column-header',
    key: 'col-actions',
    props: { label: 'Actions', align: 'right' },
  });

  // Action buttons
  const actionButtons: ComponentSpec[] = [];
  
  if (options.hasEdit) {
    actionButtons.push({
      id: 'icon-button',
      key: 'edit-btn',
      props: { icon: 'pencil', tooltip: 'Edit' },
      actions: [{ id: 'edit-item', type: 'navigate', target: `/${entityId}/{{id}}/edit` }],
    });
  }

  actionButtons.push({
    id: 'icon-button',
    key: 'view-btn',
    props: { icon: 'eye', tooltip: 'View details' },
    actions: [{ id: 'view-item', type: 'navigate', target: `/${entityId}/{{id}}` }],
  });

  if (options.hasDelete) {
    actionButtons.push({
      id: 'icon-button',
      key: 'delete-btn',
      props: { icon: 'trash', tooltip: 'Delete', variant: 'danger' },
      actions: [{ id: 'delete-item', type: 'open_overlay', target: 'confirm-delete' }],
      condition: { permission: `${entityId}.delete` },
    });
  }

  tableRowChildren.push({
    id: 'action-button-group',
    key: 'row-actions',
    children: actionButtons,
  });

  const spec: UISpec = {
    version: '1.0',
    id: `${entityId}-list`,
    title,
    description: `Table view for managing ${entityNamePlural.toLowerCase()}`,
    root_pattern: 'P-02',
    patterns_used: ['P-02', 'P-13', 'P-15'],
    zones: {
      'zone-a': {
        pattern_id: 'P-02',
        components: [
          { id: 'page-title', props: { text: title } },
          {
            id: 'search-input',
            key: 'search',
            props: { placeholder: `Search ${entityNamePlural.toLowerCase()}...`, debounce_ms: 300 },
          },
          ...(options.hasCreate ? [{
            id: 'create-button',
            key: 'create-btn',
            props: { label: `Add ${entityId}`, icon: 'plus' },
            actions: [{ id: 'create-new', type: 'navigate', target: `/${entityId}/new` }],
            condition: { permission: `${entityId}.create` },
          } as ComponentSpec] : []),
        ],
      },
      'zone-b': {
        pattern_id: 'P-02',
        components: [
          {
            id: 'tab-group',
            key: 'status-tabs',
            props: {
              tabs: [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
              ],
              default: 'all',
            },
          },
        ],
      },
      'zone-c': {
        pattern_id: 'P-02',
        components: tableHeaderComponents,
      },
      'zone-d': {
        pattern_id: 'P-02',
        components: [
          {
            id: 'table-row',
            key: 'data-row',
            data_binding: { source: datasourceId, path: 'items[]' },
            children: tableRowChildren,
          },
        ],
      },
      'zone-e': {
        pattern_id: 'P-02',
        components: [
          {
            id: 'count-info',
            key: 'items-count',
            data_binding: { source: datasourceId, path: 'pagination' },
            props: { template: '{{from}}-{{to}} of {{total}}' },
          },
          {
            id: 'rows-per-page-selector',
            key: 'page-size',
            props: { options: [10, 25, 50, 100], default: 25 },
          },
          { id: 'prev-next-buttons', key: 'pagination-nav' },
        ],
      },
    },
    datasources: [
      {
        id: datasourceId,
        type: 'rest',
        endpoint: `/api/${entityId}`,
        method: 'GET',
        pagination: { enabled: true, page_size: 25 },
        response_mapping: { items: 'data', total: 'meta.total' },
      },
    ],
    permissions: {
      required_roles: ['admin', 'manager'],
      component_rules: [
        { target: 'create-btn', permission: `${entityId}.create`, fallback: 'hide' },
        { target: 'delete-btn', permission: `${entityId}.delete`, fallback: 'hide' },
      ],
    },
  };

  // Add delete confirmation overlay
  if (options.hasDelete) {
    spec.patterns_used.push('P-05');
    spec.overlays = [generateDeleteConfirmOverlay(entityId, entityId)];
  }

  return spec;
}

/**
 * Generate P-03 Editor spec
 */
function generateEditorSpec(
  entityId: string,
  title: string,
  entityName: string,
  fields: Array<{ name: string; label: string; type: string }>,
  options: { hasDelete: boolean }
): UISpec {
  const datasourceId = `${entityId}-datasource`;

  // Build form fields
  const formFields: ComponentSpec[] = fields.map((field) => {
    const fieldType = field.type === 'textarea' ? 'textarea-field' :
                      field.type === 'select' ? 'select-field' :
                      field.type === 'toggle' ? 'toggle-field' : 'input-field';
    
    return {
      id: fieldType,
      key: `field-${field.name}`,
      props: { label: field.label },
      data_binding: { source: datasourceId, path: field.name },
    };
  });

  const spec: UISpec = {
    version: '1.0',
    id: `${entityId}-editor`,
    title,
    description: `Editor for ${entityName.toLowerCase()} configuration`,
    root_pattern: 'P-03',
    patterns_used: ['P-03', 'P-10', 'P-14'],
    zones: {
      'zone-a': {
        pattern_id: 'P-03',
        components: [
          {
            id: 'back-button',
            key: 'back',
            props: { label: 'Back' },
            actions: [{ id: 'go-back', type: 'navigate', target: `/${entityId}` }],
          },
          {
            id: 'page-title',
            key: 'title',
            data_binding: { source: datasourceId, path: 'name' },
            props: { fallback: `New ${entityName}` },
          },
          {
            id: 'status-badge',
            key: 'status',
            data_binding: { source: datasourceId, path: 'status' },
          },
          {
            id: 'save-button',
            key: 'save',
            props: { label: 'Save' },
            actions: [{
              id: 'save-item',
              type: 'api_call',
              method: 'PUT',
              target: `/api/${entityId}/{{id}}`,
            }],
          },
          {
            id: 'save-close-button',
            key: 'save-close',
            props: { label: 'Save & Close' },
            actions: [{
              id: 'save-and-close',
              type: 'api_call',
              method: 'PUT',
              target: `/api/${entityId}/{{id}}`,
              on_success: { id: 'go-back', type: 'navigate', target: `/${entityId}` },
            }],
          },
        ],
      },
      'zone-b': {
        pattern_id: 'P-03',
        components: [
          {
            id: 'form-section',
            key: 'basic-info',
            props: { title: 'Basic Information' },
            children: formFields,
          },
          {
            id: 'accordion-section',
            key: 'settings',
            props: { title: 'Settings', default_expanded: false },
            children: [
              {
                id: 'toggle-field',
                key: 'active-toggle',
                props: { label: 'Enable notifications' },
              },
            ],
          },
        ],
      },
      'zone-c': {
        pattern_id: 'P-03',
        components: [
          {
            id: 'status-toggle',
            key: 'status-toggle',
            props: { label: 'Status', on_label: 'Active', off_label: 'Inactive' },
            data_binding: { source: datasourceId, path: 'is_active' },
          },
          {
            id: 'details-section',
            key: 'details',
            props: { title: 'Details' },
            children: [
              {
                id: 'text-cell',
                key: 'id-display',
                props: { label: 'ID' },
                data_binding: { source: datasourceId, path: 'id' },
              },
              {
                id: 'text-cell',
                key: 'created-display',
                props: { label: 'Created' },
                data_binding: { source: datasourceId, path: 'created_at' },
              },
            ],
          },
          {
            id: 'schedule-section',
            key: 'schedule',
            props: { title: 'Schedule' },
            children: [
              {
                id: 'date-range-picker',
                key: 'schedule-dates',
                data_binding: { source: datasourceId, path: 'schedule' },
              },
            ],
          },
          ...(options.hasDelete ? [{
            id: 'delete-button',
            key: 'delete-btn',
            props: { label: `Delete ${entityName}` },
            actions: [{ id: 'open-delete', type: 'open_overlay', target: 'confirm-delete' }],
            condition: { permission: `${entityId}.delete` },
          } as ComponentSpec] : []),
        ],
      },
    },
    datasources: [
      {
        id: datasourceId,
        type: 'rest',
        endpoint: `/api/${entityId}/{{route.id}}`,
        method: 'GET',
        response_mapping: { data: 'data' },
      },
    ],
    permissions: {
      required_roles: ['admin', 'manager'],
      action_rules: [
        { target: 'save-item', permission: `${entityId}.update`, fallback: 'disable' },
        { target: 'open-delete', permission: `${entityId}.delete`, fallback: 'hide' },
      ],
    },
  };

  if (options.hasDelete) {
    spec.patterns_used.push('P-05');
    spec.overlays = [generateDeleteConfirmOverlay(entityId, entityName)];
  }

  return spec;
}

/**
 * Generate standalone overlay spec
 */
function generateOverlaySpec(entityId: string, title: string): UISpec {
  return {
    version: '1.0',
    id: `${entityId}-confirm`,
    title,
    description: 'Confirmation dialog',
    root_pattern: 'P-05',
    patterns_used: ['P-05'],
    zones: {
      'zone-a': {
        pattern_id: 'P-05',
        components: [
          { id: 'icon', props: { name: 'warning', variant: 'danger' } },
          { id: 'title', props: { text: title } },
        ],
      },
      'zone-b': {
        pattern_id: 'P-05',
        components: [
          {
            id: 'warning-text',
            props: { text: 'Are you sure you want to proceed? This action cannot be undone.' },
          },
        ],
      },
      'zone-c': {
        pattern_id: 'P-05',
        components: [
          {
            id: 'cancel-button',
            key: 'cancel',
            props: { label: 'Cancel' },
            actions: [{ id: 'close', type: 'close_overlay', target: `${entityId}-confirm` }],
          },
          {
            id: 'primary-button',
            key: 'confirm',
            props: { label: 'Confirm', variant: 'danger' },
            actions: [{ id: 'execute', type: 'custom', target: 'onConfirm' }],
          },
        ],
      },
    },
  };
}

/**
 * Generate delete confirmation overlay
 */
function generateDeleteConfirmOverlay(entityId: string, entityName: string): OverlaySpec {
  return {
    id: 'confirm-delete',
    pattern_id: 'P-05',
    title: `Delete ${entityName}`,
    variant: 'danger',
    size: 'small',
    zones: {
      'zone-a': {
        pattern_id: 'P-05',
        components: [
          { id: 'title', props: { text: `Delete ${entityName}` } },
        ],
      },
      'zone-b': {
        pattern_id: 'P-05',
        components: [
          {
            id: 'warning-text',
            props: { text: `Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.` },
          },
        ],
      },
      'zone-c': {
        pattern_id: 'P-05',
        components: [
          {
            id: 'cancel-button',
            key: 'cancel-delete',
            props: { label: 'Cancel' },
            actions: [{ id: 'close-confirm', type: 'close_overlay', target: 'confirm-delete' }],
          },
          {
            id: 'primary-button',
            key: 'confirm-delete-btn',
            props: { label: 'Delete', variant: 'danger' },
            actions: [{
              id: 'execute-delete',
              type: 'api_call',
              method: 'DELETE',
              target: `/api/${entityId}/{{id}}`,
              on_success: { id: 'refresh', type: 'custom', target: 'refreshList' },
            }],
          },
        ],
      },
    },
    open_triggers: ['delete-item', 'open-delete'],
    close_triggers: ['close-confirm', 'execute-delete'],
  };
}

/**
 * Parse a simple request YAML to extract generation options
 */
export function parseRequest(requestText: string): GenerateOptions {
  const lines = requestText.split('\n');
  const options: GenerateOptions = {
    template: 'table',
    title: 'Items',
    entityName: 'Item',
  };

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    switch (key.trim().toLowerCase()) {
      case 'template':
        options.template = value.toLowerCase() as TemplateType;
        break;
      case 'title':
        options.title = value;
        break;
      case 'entity':
      case 'entityname':
        options.entityName = value;
        break;
      case 'entitynameplural':
        options.entityNamePlural = value;
        break;
    }
  }

  return options;
}
