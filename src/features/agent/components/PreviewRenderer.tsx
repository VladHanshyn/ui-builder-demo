"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/Input";
import { Select, SimpleSelect } from "@/components/ui/Select";
import { ButtonGroup, ButtonGroupItem } from "@/components/ui/ButtonGroup";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { ConfirmModal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { Checkbox } from "@/components/ui/Checkbox";
import type { UISpec, TableColumn, FilterConfig } from "../types";

const SELECT_COL_PX = 32;

/** Відповідає `pl-2` (8px) + ButtonGroup (size-8, −mr-px) + `pr-[12px]` — щоб колонка Actions не розтягувалась на всю таблицю */
const ACTIONS_CELL_PAD_L = 8;
const ACTIONS_CELL_PAD_R = 12;
const ACTIONS_BTN_PX = 32;

function countVisibleRowActions(col: TableColumn): number {
  const a = col.actions ?? {};
  let n = 0;
  if (a.view !== false) n += 1;
  if (a.edit === true) n += 1;
  if (a.duplicate === true) n += 1;
  if (a.delete !== false) n += 1;
  return n;
}

/** Зовнішня ширина комірки Actions (px): тільки контент + 8px зліва + 12px справа (ігноруємо завищений `col.width` у специ, щоб колонка не розтягувалась). */
function getActionsColumnOuterWidthPx(col: TableColumn): number {
  const n = countVisibleRowActions(col);
  if (n <= 0) return ACTIONS_CELL_PAD_L + ACTIONS_CELL_PAD_R;
  const groupW = n * ACTIONS_BTN_PX - Math.max(0, n - 1);
  return ACTIONS_CELL_PAD_L + groupW + ACTIONS_CELL_PAD_R;
}

/** Колонка Duration: ширина за контентом, без переносу діапазону дат */
function isDurationColumn(col: TableColumn): boolean {
  return col.type === "duration";
}

/** Мін. ширина для Title та колонок Audience / General Audience */
const TABLE_COL_WIDE_MIN_PX = "240px";

/** Колонки «Audience» / «General Audience» */
function isAudienceColumn(col: TableColumn): boolean {
  const n = col.label.toLowerCase().trim();
  return n === "audience" || n === "general audience";
}

function formatDurationParts(raw: string | undefined): { date: string; time: string } | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return { date: raw.trim(), time: "" };
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${dd}.${mm}.${yyyy}`, time: `${hh}:${min}` };
}

interface PreviewRendererProps {
  spec: UISpec | null;
  errors?: string[];
  onOpenWizard?: () => void;
  onCreateClick?: () => void;
  /** Phoenix: відкрити візард зі збереженим intent (апрувнута сторінка). */
  onEditInWizard?: () => void;
  /** Немає збереженого intent — показати неактивну кнопку */
  editInWizardUnavailable?: boolean;
  /** Approved pages: open CSV file picker to append rows (Phoenix). */
  onUploadCsvClick?: () => void;
  /** Called when user clicks Edit on a row: (rowData, indexInSavedRows) */
  onEditRow?: (row: Record<string, string>, rowIndex: number) => void;
  /** Called when user clicks Duplicate on a row: (rowData, indexInSavedRows) */
  onDuplicateRow?: (row: Record<string, string>, rowIndex: number) => void;
  savedRows?: Record<string, string>[];
}

export function PreviewRenderer({
  spec,
  errors = [],
  onOpenWizard,
  onCreateClick,
  onEditInWizard,
  editInWizardUnavailable = false,
  onUploadCsvClick,
  onEditRow,
  onDuplicateRow,
  savedRows,
}: PreviewRendererProps) {
  // State for interactivity
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set());
  const [detailsRow, setDetailsRow] = useState<Record<string, string> | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  /** Apply default sort only when spec/page changes — avoids clobbering sort or racing with setSortColumn(null). */
  const prevSpecIdForSortRef = useRef<string | null>(null);

  const columns = spec?.table?.columns ?? [];

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const check = () => setHasHorizontalScroll(el.scrollWidth > el.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [spec?.table?.columns]);

  // Generate table data from saved rows only (no dummy data); newest first via sort
  const allTableData = useMemo(() => {
    if (!columns.length) return [];
    return savedRows ?? [];
  }, [columns.length, savedRows]);

  // Default sort when opening a page/spec: newest first by creation time
  const dateColumnId = useMemo(() => columns.find(c => c.type === "date")?.id ?? null, [columns]);
  const specId = spec?.page?.id ?? (spec?.table?.columns?.map((c: { id: string }) => c.id).join(",") ?? "");
  useEffect(() => {
    if (!columns.length) return;
    const specChanged = prevSpecIdForSortRef.current !== specId;
    prevSpecIdForSortRef.current = specId;
    if (!specChanged) return;

    const hasInternalCreatedAt = allTableData.some(
      (r: Record<string, string>) => r._createdAt != null && String(r._createdAt).trim() !== "",
    );
    if (hasInternalCreatedAt) {
      setSortColumn("_createdAt");
      setSortDirection("desc");
      return;
    }

    const createdAtByLabel =
      columns.find((c) => c.type === "date" && /created\s*at/i.test(c.label || "")) ??
      columns.find((c) => c.type === "date" && /created/i.test(c.id));
    const fallbackDate = createdAtByLabel ?? (dateColumnId ? columns.find((c) => c.id === dateColumnId) : undefined) ?? columns.find((c) => c.type === "date");
    if (fallbackDate) {
      setSortColumn(fallbackDate.id);
      setSortDirection("desc");
      return;
    }

    const first = columns.find((c) => c.type !== "actions");
    if (first) {
      setSortColumn(first.id);
      setSortDirection("desc");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset sort when spec/columns change; allTableData read here is current for that navigation
  }, [specId, columns, dateColumnId]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let data = allTableData.filter((_, idx) => !deletedRows.has(idx));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(query)
        )
      );
    }

    Object.entries(filterValues).forEach(([filterId, values]) => {
      if (values && values.length > 0) {
        data = data.filter((row) => {
          const matchingCol = columns.find(
            (col) => col.id.toLowerCase() === filterId.toLowerCase()
          );
          if (matchingCol) {
            return values.includes(String(row[matchingCol.id]));
          }
          return true;
        });
      }
    });

    if (sortColumn) {
      const col = columns.find(c => c.id === sortColumn);
      const isCreatedAt = sortColumn === "_createdAt";
      if (col || isCreatedAt) {
        data = [...data].sort((a, b) => {
          const valA = a[sortColumn] || "";
          const valB = b[sortColumn] || "";

          if (isCreatedAt) {
            const numA = Number(valA) || 0;
            const numB = Number(valB) || 0;
            return sortDirection === "asc" ? numA - numB : numB - numA;
          }

          if (col?.type === "number") {
            const numA = parseFloat(valA) || 0;
            const numB = parseFloat(valB) || 0;
            return sortDirection === "asc" ? numA - numB : numB - numA;
          }

          if (col?.type === "date") {
            const dateA = new Date(valA).getTime() || 0;
            const dateB = new Date(valB).getTime() || 0;
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
          }

          const cmp = valA.localeCompare(valB);
          return sortDirection === "asc" ? cmp : -cmp;
        });
      }
    }

    return data;
  }, [allTableData, searchQuery, filterValues, deletedRows, spec?.table?.columns, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterValues, sortColumn, sortDirection]);

  const tableData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  /** Checkbox-індекси відносяться до поточної сторінки `tableData`; deletedRows — індекси в `allTableData`. */
  const selectedOriginalIndices = useMemo(() => {
    const out = new Set<number>();
    selectedRows.forEach((pageIdx) => {
      const row = tableData[pageIdx];
      if (!row) return;
      const oi = allTableData.findIndex((r) => r === row);
      if (oi >= 0) out.add(oi);
    });
    return out;
  }, [selectedRows, tableData, allTableData]);

  useEffect(() => {
    setSelectedRows(new Set());
  }, [currentPage, searchQuery, filterValues, sortColumn, sortDirection]);

  const setRowSelected = useCallback((rowIdx: number, selected: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (selected) next.add(rowIdx);
      else next.delete(rowIdx);
      return next;
    });
  }, []);

  /** Вибір усіх рядків на поточній сторінці (узгоджено з Checkbox onCheckedChange) */
  const handlePageSelectAllChange = useCallback((checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) {
        for (let i = 0; i < tableData.length; i++) next.add(i);
      } else {
        for (let i = 0; i < tableData.length; i++) next.delete(i);
      }
      return next;
    });
  }, [tableData]);

  // Handle delete row (with confirmation)
  const handleDeleteRow = useCallback((originalIdx: number) => {
    setDeletedRows((prev) => new Set([...prev, originalIdx]));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      tableData.forEach((row, pageIdx) => {
        const oi = allTableData.findIndex((r) => r === row);
        if (oi === originalIdx) next.delete(pageIdx);
      });
      return next;
    });
  }, [tableData, allTableData]);

  const requestDeleteRow = useCallback((originalIdx: number) => {
    setDeleteConfirmIdx(originalIdx);
  }, []);

  const confirmDeleteRow = useCallback(() => {
    if (deleteConfirmIdx !== null) {
      handleDeleteRow(deleteConfirmIdx);
      setDeleteConfirmIdx(null);
    }
  }, [deleteConfirmIdx, handleDeleteRow]);

  const applyBulkDeleteSelected = useCallback(() => {
    if (selectedOriginalIndices.size === 0) return;
    setDeletedRows((prev) => new Set([...prev, ...selectedOriginalIndices]));
    setSelectedRows(new Set());
    setBulkDeleteConfirmOpen(false);
  }, [selectedOriginalIndices]);

  // Handle bulk actions
  const handleBulkAction = useCallback((action: string) => {
    if (action === "delete") {
      if (selectedOriginalIndices.size === 0) return;
      setDeletedRows((prev) => new Set([...prev, ...selectedOriginalIndices]));
      setSelectedRows(new Set());
    } else {
      // For other actions, just show feedback (clear selection)
      alert(`Action "${action}" applied to ${selectedRows.size} items`);
      setSelectedRows(new Set());
    }
  }, [selectedRows.size, selectedOriginalIndices]);

  // Handle sort
  const handleSort = useCallback((colId: string) => {
    if (sortColumn === colId) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(colId);
      setSortDirection("asc");
    }
  }, [sortColumn]);

  // Handle filter change
  const handleFilterChange = useCallback((filterId: string, values: string[]) => {
    setFilterValues((prev) => ({ ...prev, [filterId]: values }));
  }, []);

  if (errors.length > 0) {
    return <ErrorState errors={errors} />;
  }

  if (!spec) {
    return <EmptyPreviewState onOpenWizard={onOpenWizard} />;
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 bg-[var(--color-base-surface-primary)] overflow-hidden">
      {/* Main Content — min-h-0 обов’язково для flex-1, інакше таблиця роздуває main і з’являється скрол сторінки */}
      <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${detailsRow ? "pr-0" : ""}`}>
        {/* Page Header */}
        <div className="flex-shrink-0 px-6 py-4">
            <h1 className="text-headline-1 text-[var(--color-base-primary)]">
            {spec.page.title}
          </h1>
          {spec.page.description && spec.page.description.trim() !== "" && (
            <p className="text-paragraph-2 text-[var(--color-base-secondary)] mt-1">
              {spec.page.description}
            </p>
          )}
        </div>

        {/* Toolbar */}
        {spec.toolbar && (
          <div className="flex-shrink-0 px-6 pb-3 flex items-center justify-between gap-4">
            {/* Left: Filters */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {spec.toolbar.filters && spec.toolbar.filters.length > 0 && (
                <FilterBar
                  filters={spec.toolbar.filters}
                  filterValues={filterValues}
                  onFilterChange={handleFilterChange}
                  allTableData={allTableData}
                  columns={columns}
                />
              )}

              {/* Bulk selection info */}
              {selectedRows.size > 0 && (
                <span className="text-headline-4 text-[var(--color-brand-primary)]">
                  {selectedRows.size} selected
                </span>
              )}
            </div>
            
            {/* Right: Search + Actions */}
            <div className="flex items-center gap-3 shrink-0">
              {spec.toolbar.search && (
                <div className="w-[220px]">
                  <SearchInput
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => setSearchQuery("")}
                  />
                </div>
              )}

              {(onEditInWizard || editInWizardUnavailable) && (
                <button
                  type="button"
                  title={
                    editInWizardUnavailable
                      ? "Немає збереженої конфігурації візарду для цієї сторінки (створіть фічу через візард і апрувніть знову)"
                      : "Редагувати структуру сторінки та таблиці у візарді"
                  }
                  disabled={editInWizardUnavailable || !onEditInWizard}
                  onClick={() => onEditInWizard?.()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    editInWizardUnavailable || !onEditInWizard
                      ? "border-[var(--color-base-stroke)] text-[var(--color-base-tertiary)] opacity-50 cursor-not-allowed"
                      : "border-[var(--color-base-stroke)] text-[var(--color-base-primary)] hover:bg-[var(--color-base-surface-secondary)]"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden>
                    <path d="M11.333 2L14 4.667L5.333 13.333H2.667V10.667L11.333 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit in Wizard
                </button>
              )}

              {onUploadCsvClick && (
                <button
                  type="button"
                  onClick={onUploadCsvClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/10 transition-colors whitespace-nowrap shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden>
                    <path d="M6.5 9.5L9.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8.5 11.5L7 13C5.9 14.1 4.1 14.1 3 13C1.9 11.9 1.9 10.1 3 9L4.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M7.5 4.5L9 3C10.1 1.9 11.9 1.9 13 3C14.1 4.1 14.1 5.9 13 7L11.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Upload CSV
                </button>
              )}
              
              {spec.toolbar.actions && spec.toolbar.actions.length > 0 && (
                <div className="flex gap-2">
                  {spec.toolbar.actions.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant || "secondary"}
                      onClick={() => action.id === "create" ? (onCreateClick ? onCreateClick() : alert("Create new item - opens form/modal")) : handleBulkAction(action.id)}
                      disabled={action.id.includes("selected") && selectedRows.size === 0}
                    >
                      {action.icon === "plus" && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-1.5">
                          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {spec.table && columns.length > 0 && (
          <div className="mx-6 mb-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]">
              {/* Table Content - Scrollable */}
              <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={tableScrollRef}>
                <table className="w-full">
                  <thead className="sticky top-0 z-30">
                    <tr className="border-b border-[var(--color-base-stroke)]">
                      {/* Selection — фікс 32px, виїжджає зліва */}
                      {spec.table.selectable && (
                        <th
                          className="sticky left-0 z-[25] bg-[var(--color-base-surface-secondary)] h-8"
                          style={{
                            width: SELECT_COL_PX,
                            minWidth: SELECT_COL_PX,
                            maxWidth: SELECT_COL_PX,
                            padding: 0,
                            overflow: "hidden",
                            verticalAlign: "middle",
                            borderRight: "1px solid var(--color-base-stroke)",
                            boxShadow: hasHorizontalScroll
                              ? "inset -1px 0 0 0 var(--color-base-stroke)"
                              : undefined,
                          }}
                        >
                          <div className="flex h-full w-full items-center justify-center" style={{ minWidth: SELECT_COL_PX }}>
                            <Checkbox
                              preventScrollOnFocus
                              hideLabel
                              checked={
                                tableData.length > 0 &&
                                tableData.every((_, idx) => selectedRows.has(idx))
                              }
                              onCheckedChange={handlePageSelectAllChange}
                              aria-label="Select all rows"
                              className="!gap-0 shrink-0"
                            />
                          </div>
                        </th>
                      )}
                      
                      {/* Column headers from spec */}
                      {columns.map((col, colIdx) => (
                        <th
                          key={col.id}
                          className={`h-8 text-left text-label-normal text-[var(--color-base-secondary)] bg-[var(--color-base-surface-secondary)] border-r border-[var(--color-base-stroke)] last:border-r-0 ${
                            spec.table?.selectable && colIdx === 0 ? "border-l-0" : ""
                          } ${
                            col.type === "actions"
                              ? "pl-2 pr-[12px] sticky right-0 z-20"
                              : "px-2"
                          }`}
                          style={{
                            width:
                              col.type === "actions"
                                ? `${getActionsColumnOuterWidthPx(col)}px`
                                : col.type === "live"
                                  ? col.width || "80px"
                                  : isDurationColumn(col)
                                    ? undefined
                                    : col.label.toLowerCase() === "id"
                                      ? "96px"
                                      : col.width,
                            minWidth:
                              col.type === "actions"
                                ? `${getActionsColumnOuterWidthPx(col)}px`
                                : col.type === "live"
                                  ? col.width || "80px"
                                  : isDurationColumn(col)
                                    ? "max-content"
                                    : col.label.toLowerCase() === "title" || isAudienceColumn(col)
                                      ? TABLE_COL_WIDE_MIN_PX
                                      : "128px",
                            maxWidth:
                              col.type === "actions"
                                ? `${getActionsColumnOuterWidthPx(col)}px`
                                : col.type === "live"
                                  ? col.width || "80px"
                                  : isDurationColumn(col)
                                    ? undefined
                                    : col.label.toLowerCase() === "id"
                                      ? "96px"
                                      : col.label.toLowerCase() === "title"
                                        ? "300px"
                                        : undefined,
                            ...(isDurationColumn(col) ? { whiteSpace: "nowrap" as const } : {}),
                            ...(col.type === "actions" ? {
                              boxShadow: hasHorizontalScroll
                                ? "inset 1px 0 0 0 var(--color-base-stroke), -4px 0 8px -4px rgba(0,0,0,0.1)"
                                : "inset 1px 0 0 0 var(--color-base-stroke)",
                            } : {}),
                            ...(spec.table?.selectable && colIdx === 0
                              ? { borderLeftWidth: 0, borderLeftStyle: "none" as const, borderLeftColor: "transparent" }
                              : {}),
                          }}
                        >
                          <span
                            className={`overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-1 ${col.sortable ? "cursor-pointer select-none" : ""}`}
                            onClick={col.sortable ? () => handleSort(col.id) : undefined}
                          >
                            {col.label}
                            {col.sortable && (
                              <span className={`shrink-0 ${sortColumn === col.id ? "text-[var(--color-base-primary)]" : "text-[var(--color-base-tertiary)]"}`}>
                                {sortColumn === col.id ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                              </span>
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length + (spec.table.selectable ? 1 : 0)}
                          className="px-4 py-12 text-center text-paragraph-2 text-[var(--color-base-tertiary)]"
                        >
                          {searchQuery || Object.values(filterValues).some(v => v && v.length > 0)
                            ? "No results found. Try adjusting your filters."
                            : allTableData.length === 0
                              ? "No items yet. Create your first item using the Create button above."
                              : "No data available."}
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row, rowIdx) => {
                        // Find original index for deletion tracking
                        const originalIdx = allTableData.findIndex((r) => r === row);
                        return (
                          <tr
                            key={rowIdx}
                            className={`group border-b border-[var(--color-base-stroke)] hover:bg-[var(--color-base-surface-secondary)] transition-colors ${
                              selectedRows.has(rowIdx) ? "bg-[var(--color-brand-primary)]/5" : ""
                            }`}
                          >
                            {/* Selection — фікс 32px, той самий виїзд */}
                            {spec.table?.selectable && (
                              <td
                                className="sticky left-0 z-[15] h-12 bg-[var(--color-base-surface-primary)] group-hover:bg-[var(--color-base-surface-secondary)]"
                                style={{
                                  width: SELECT_COL_PX,
                                  minWidth: SELECT_COL_PX,
                                  maxWidth: SELECT_COL_PX,
                                  padding: 0,
                                  overflow: "hidden",
                                  verticalAlign: "middle",
                                  borderRight: "1px solid var(--color-base-stroke)",
                                  boxShadow: hasHorizontalScroll
                                    ? "inset -1px 0 0 0 var(--color-base-stroke)"
                                    : undefined,
                                }}
                              >
                                <div className="flex h-full w-full items-center justify-center" style={{ minWidth: SELECT_COL_PX }}>
                                  <Checkbox
                                    preventScrollOnFocus
                                    hideLabel
                                    checked={selectedRows.has(rowIdx)}
                                    onCheckedChange={(checked) => setRowSelected(rowIdx, checked)}
                                    aria-label={`Select row ${rowIdx + 1}`}
                                    className="!gap-0 shrink-0"
                                  />
                                </div>
                              </td>
                            )}
                            
                            {/* Cell data from dummy data */}
                            {columns.map((col, colIdx) => (
                              <td
                                key={col.id}
                                className={`h-12 text-paragraph-2 text-[var(--color-base-primary)] ${
                                  spec.table?.selectable && colIdx === 0 ? "border-l-0" : ""
                                } ${
                                  col.type === "actions"
                                    ? "pl-2 pr-[12px] sticky right-0 z-20 bg-[var(--color-base-surface-primary)] group-hover:bg-[var(--color-base-surface-secondary)] transition-colors"
                                    : "px-2"
                                }`}
                                style={{
                                  width:
                                    col.type === "actions"
                                      ? `${getActionsColumnOuterWidthPx(col)}px`
                                      : col.type === "live"
                                        ? col.width || "80px"
                                        : isDurationColumn(col)
                                          ? undefined
                                          : col.label.toLowerCase() === "id"
                                            ? "96px"
                                            : undefined,
                                  minWidth:
                                    col.type === "actions"
                                      ? `${getActionsColumnOuterWidthPx(col)}px`
                                      : col.type === "live"
                                        ? col.width || "80px"
                                        : isDurationColumn(col)
                                          ? "max-content"
                                          : col.label.toLowerCase() === "title" || isAudienceColumn(col)
                                            ? TABLE_COL_WIDE_MIN_PX
                                            : "128px",
                                  maxWidth:
                                    col.type === "actions"
                                      ? `${getActionsColumnOuterWidthPx(col)}px`
                                      : col.type === "live"
                                        ? col.width || "80px"
                                        : isDurationColumn(col)
                                          ? undefined
                                          : col.label.toLowerCase() === "id"
                                            ? "96px"
                                            : col.label.toLowerCase() === "title"
                                              ? "300px"
                                              : undefined,
                                  ...(isDurationColumn(col) ? { whiteSpace: "nowrap" as const } : {}),
                                  ...(col.type === "actions" ? {
                                    boxShadow: hasHorizontalScroll
                                      ? "inset 1px 0 0 0 var(--color-base-stroke), -4px 0 8px -4px rgba(0,0,0,0.1)"
                                      : "inset 1px 0 0 0 var(--color-base-stroke)",
                                  } : {}),
                                  ...(spec.table?.selectable && colIdx === 0
                                    ? { borderLeftWidth: 0, borderLeftStyle: "none" as const, borderLeftColor: "transparent" }
                                    : {}),
                                }}
                              >
                                {col.type === "actions" ? (
                                  <ActionButtons 
                                    onView={() => setDetailsRow(row)}
                                    onEdit={onEditRow ? () => onEditRow(row, originalIdx) : undefined}
                                    onDuplicate={onDuplicateRow ? () => onDuplicateRow(row, originalIdx) : undefined}
                                    onDelete={() => requestDeleteRow(originalIdx)}
                                    showView={col.actions?.view !== false}
                                    showEdit={col.actions?.edit === true}
                                    showDuplicate={col.actions?.duplicate === true}
                                    showDelete={col.actions?.delete !== false}
                                  />
                                ) : (
                                  <div
                                    className={
                                      col.type === "live"
                                        ? "flex items-center justify-start py-0.5"
                                        : col.type === "duration"
                                          ? "text-left w-max max-w-none shrink-0"
                                          : "overflow-hidden text-ellipsis whitespace-nowrap"
                                    }
                                  >
                                    {renderCell(col, row)}
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Pinned to bottom */}
              {spec.table.pagination && (() => {
                const startItem = (currentPage - 1) * itemsPerPage + 1;
                const endItem = Math.min(currentPage * itemsPerPage, filteredData.length);
                return (
                  <div className="flex h-12 shrink-0 items-center justify-between border-t border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)] px-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-paragraph-2 text-[var(--color-base-secondary)] shrink-0">
                        {startItem} – {endItem} of {filteredData.length}
                      </span>
                      {spec.table.selectable && selectedRows.size > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setBulkDeleteConfirmOpen(true)}
                          className="shrink-0 border-[var(--color-status-error)]/50 text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/5"
                        >
                          Delete Selected ({selectedRows.size})
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-paragraph-2 text-[var(--color-base-secondary)]">The page you on</span>
                        <SimpleSelect
                          value={String(currentPage)}
                          onChange={(val) => setCurrentPage(Number(Array.isArray(val) ? val[0] : val))}
                          options={Array.from({ length: totalPages }, (_, i) => ({
                            label: String(i + 1),
                            value: String(i + 1),
                          }))}
                          disabled={totalPages <= 1}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <IconButton
                          icon={<ChevronLeftIcon size={20} />}
                          aria-label="Previous page"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          size="sm"
                        />
                        <IconButton
                          icon={<ChevronRightIcon size={20} />}
                          aria-label="Next page"
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        )}
      </div>

      {/* Details Drawer */}
      {detailsRow && (
        <div className="flex h-full min-h-0 w-[360px] shrink-0 flex-col overflow-hidden border-l border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-base-stroke)]">
            <h3 className="text-headline-3 text-[var(--color-base-primary)]">
              {spec?.drawer?.title || "Details"}
            </h3>
            <button
              onClick={() => setDetailsRow(null)}
              className="p-1 rounded hover:bg-[var(--color-base-surface-secondary)] text-[var(--color-base-tertiary)] hover:text-[var(--color-base-primary)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Drawer Content */}
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {spec?.table?.columns
                .filter((col) => col.type !== "actions")
                .map((col) => (
                  <div key={col.id} className="space-y-1">
                    <label className="text-label-normal text-[var(--color-base-secondary)]">
                      {col.label}
                    </label>
                    <div className="text-paragraph-2 text-[var(--color-base-primary)]">
                      {col.type === "status" ? (
                        <span className={`px-2 py-0.5 text-paragraph-3 rounded-full ${
                          detailsRow[col.id] === "Active" 
                            ? "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]"
                            : detailsRow[col.id] === "Pending"
                            ? "bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)]"
                            : detailsRow[col.id] === "Suspended"
                            ? "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]"
                            : "bg-[var(--color-base-surface-secondary)] text-[var(--color-base-tertiary)]"
                        }`}>
                          {detailsRow[col.id] || "—"}
                        </span>
                      ) : (
                        detailsRow[col.id] || "—"
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--color-base-stroke)] flex gap-2">
            <Button variant="primary" className="flex-1">
              Approve
            </Button>
            <Button variant="secondary" className="flex-1">
              Reject
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirmIdx !== null}
        onClose={() => setDeleteConfirmIdx(null)}
        onConfirm={confirmDeleteRow}
        title="Delete item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        size="lg"
      />
      <ConfirmModal
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={applyBulkDeleteSelected}
        title="Delete selected rows"
        description={`Delete ${selectedRows.size} selected item(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        size="lg"
      />
    </div>
  );
}

// Filter Bar with "More" overflow
function FilterBar({
  filters,
  filterValues,
  onFilterChange,
  allTableData,
  columns,
}: {
  filters: FilterConfig[];
  filterValues: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  allTableData: Record<string, string>[];
  columns: TableColumn[];
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxVisible, setMaxVisible] = useState(filters.length);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measureContainer = measureRef.current;
    const visibleContainer = containerRef.current;
    if (!measureContainer || !visibleContainer) return;

    const measure = () => {
      const availableWidth = visibleContainer.getBoundingClientRect().width;
      const moreWidth = 80;
      const gap = 8;
      const children = Array.from(measureContainer.children) as HTMLElement[];
      let usedWidth = 0;
      let visible = 0;

      for (let i = 0; i < children.length; i++) {
        const childWidth = children[i].getBoundingClientRect().width;
        const nextWidth = usedWidth + childWidth + (i > 0 ? gap : 0);
        const needsMore = i < filters.length - 1;
        if (nextWidth > availableWidth - (needsMore ? moreWidth + gap : 0)) {
          break;
        }
        usedWidth = nextWidth;
        visible++;
      }

      setMaxVisible(Math.max(1, visible));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(visibleContainer);
    return () => observer.disconnect();
  }, [filters.length, filterValues]);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (moreRef.current && moreRef.current.contains(target)) return;
      // Ignore clicks inside portal-rendered dropdowns (Select renders as fixed direct children of body)
      for (let i = 0; i < document.body.children.length; i++) {
        const el = document.body.children[i] as HTMLElement;
        if (el.contains(target) && getComputedStyle(el).position === "fixed") return;
      }
      setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  // Reposition dropdown if it overflows the viewport
  useEffect(() => {
    const el = moreDropdownRef.current;
    if (!el || !moreOpen) return;
    const reposition = () => {
      el.style.left = "0px";
      el.style.right = "auto";
      const rect = el.getBoundingClientRect();
      const overflow = rect.right - window.innerWidth + 16;
      if (overflow > 0) {
        el.style.left = `-${overflow}px`;
      }
    };
    reposition();
    const observer = new MutationObserver(reposition);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [moreOpen, filterValues]);

  const visibleFilters = filters.slice(0, maxVisible);
  const overflowFilters = filters.slice(maxVisible);

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      {/* Hidden measurement row — renders all filters to measure their widths */}
      <div
        ref={measureRef}
        aria-hidden
        className="flex gap-2 items-center absolute top-0 left-0 pointer-events-none opacity-0 h-0 overflow-hidden whitespace-nowrap"
      >
        {filters.map((filter) => (
          <div key={filter.id} className="shrink-0">
            <FilterDropdown
              id={filter.id}
              label={filter.label}
              value={filterValues[filter.id] || []}
              onChange={() => {}}
              options={getFilterOptions(filter.id, allTableData, columns)}
            />
          </div>
        ))}
      </div>

      {/* Visible filters */}
      <div className="flex gap-2 items-center">
        {visibleFilters.map((filter) => (
          <div key={filter.id} className="shrink-0">
            <FilterDropdown
              id={filter.id}
              label={filter.label}
              value={filterValues[filter.id] || []}
              onChange={(values) => onFilterChange(filter.id, values)}
              options={getFilterOptions(filter.id, allTableData, columns)}
            />
          </div>
        ))}
        {overflowFilters.length > 0 && (
          <div ref={moreRef} className="relative shrink-0" data-more-btn="true">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-1 h-8 px-3 rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] hover:border-[var(--color-base-secondary)] text-paragraph-2 text-[var(--color-base-secondary)] transition-colors"
            >
              More
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}>
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {moreOpen && (
              <div ref={moreDropdownRef} className="absolute top-full mt-1 bg-[var(--color-base-surface-primary)] border border-[var(--color-base-stroke)] rounded-xl shadow-lg z-50 p-2 flex gap-2 whitespace-nowrap" style={{ left: 0 }}>
                {overflowFilters.map((filter) => (
                  <FilterDropdown
                    key={filter.id}
                    id={filter.id}
                    label={filter.label}
                    value={filterValues[filter.id] || []}
                    onChange={(values) => onFilterChange(filter.id, values)}
                    options={getFilterOptions(filter.id, allTableData, columns)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Filter Dropdown Component
function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (values: string[]) => void;
  options: string[];
}) {
  return (
    <Select
      placeholder={label}
      value={value}
      onChange={(val) => onChange(Array.isArray(val) ? val : val ? [val] : [])}
      options={options.map((opt) => ({ label: opt, value: opt }))}
      multiple
      searchable
      renderValue={(selected) => {
        const items = Array.isArray(selected) ? selected : [selected];
        if (items.length === 0) return label;
        return `${label}: Selected ${items.length}`;
      }}
      renderOption={(option, isSelected) => (
        <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--color-base-surface-secondary)] transition-colors">
          <div className={`shrink-0 size-4 rounded border flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]"
              : "bg-[var(--color-base-surface-primary)] border-[var(--color-base-stroke)]"
          }`}>
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="text-paragraph-2 text-[var(--color-base-primary)]">{option.label}</span>
        </div>
      )}
    />
  );
}

// Get filter options from data
function getFilterOptions(
  filterId: string,
  data: Record<string, string>[],
  columns: TableColumn[]
): string[] {
  const col = columns.find((c) => c.id.toLowerCase() === filterId.toLowerCase());
  if (col) {
    return [...new Set(data.map((row) => row[col.id]).filter(Boolean))];
  }
  
  if (filterId.toLowerCase().includes("status")) {
    return ["Active", "Pending", "Inactive", "Suspended"];
  }
  if (filterId.toLowerCase().includes("type") || filterId.toLowerCase().includes("media")) {
    return ["Image", "Video", "Document"];
  }
  
  return ["Option 1", "Option 2", "Option 3"];
}

// Action icons
const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1.333 8C1.333 8 3.333 3.333 8 3.333C12.667 3.333 14.667 8 14.667 8C14.667 8 12.667 12.667 8 12.667C3.333 12.667 1.333 8 1.333 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11.333 2L14 4.667M2 14L2.667 11.333L10.667 3.333L13.333 6L5.333 14H2V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DuplicateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2.667 4.667H13.333M6.667 7.333V11.333M9.333 7.333V11.333M3.333 4.667L4 12.667C4 13.403 4.597 14 5.333 14H10.667C11.403 14 12 13.403 12 12.667L12.667 4.667M6 4.667V2.667C6 2.299 6.299 2 6.667 2H9.333C9.701 2 10 2.299 10 2.667V4.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Action Buttons Component using ButtonGroup from design system
interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showDuplicate?: boolean;
  showDelete?: boolean;
}

function ActionButtons({
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  showView = true,
  showEdit = false,
  showDuplicate = false,
  showDelete = true,
}: ActionButtonsProps) {
  const items: { key: string; icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }[] = [];

  if (showView) {
    items.push({ key: "view", icon: <ViewIcon />, label: "Preview", onClick: onView || (() => {}) });
  }
  if (showEdit) {
    items.push({ key: "edit", icon: <EditIcon />, label: "Edit", onClick: onEdit || (() => alert("Edit")) });
  }
  if (showDuplicate) {
    items.push({ key: "duplicate", icon: <DuplicateIcon />, label: "Duplicate", onClick: onDuplicate || (() => alert("Duplicate")) });
  }
  if (showDelete) {
    items.push({ key: "delete", icon: <DeleteIcon />, label: "Delete", onClick: onDelete || (() => {}), danger: true });
  }

  if (items.length === 0) return <span className="text-[var(--color-base-tertiary)]">—</span>;

  return (
    <ButtonGroup>
      {items.map((item) => (
        <ButtonGroupItem
          key={item.key}
          icon={item.icon}
          aria-label={item.label}
          onClick={item.onClick}
          className={item.danger ? "hover:!border-[var(--color-danger-100)] [&>span]:text-[var(--color-danger-100)]" : ""}
        />
      ))}
    </ButtonGroup>
  );
}

// Empty State
function EmptyPreviewState({ onOpenWizard }: { onOpenWizard?: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 bg-[var(--color-base-surface-secondary)]">
      <div className="w-16 h-16 rounded-xl bg-[var(--color-base-surface-primary)] border border-[var(--color-base-stroke)] flex items-center justify-center mb-4">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[var(--color-base-tertiary)]"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
          <path d="M9 21V9" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      <h3 className="text-headline-4 text-[var(--color-base-primary)] mb-1">
        No preview available
      </h3>
      <p className="text-paragraph-3 text-[var(--color-base-tertiary)] max-w-[220px]">
        Describe what you want to build in the chat or use the Wizard
      </p>
      <div className="mt-4 text-paragraph-3 text-[var(--color-base-tertiary)] space-y-1">
        <p>Try: &quot;Create a users table with search&quot;</p>
        <p>Or: &quot;Build an orders page with filters&quot;</p>
      </div>
      {onOpenWizard && (
        <Button
          variant="primary"
          onClick={onOpenWizard}
          className="mt-6"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create with Wizard
        </Button>
      )}
    </div>
  );
}

// Error State
function ErrorState({ errors }: { errors: string[] }) {
  return (
    <div className="h-full flex flex-col p-6 bg-[var(--color-status-error)]/5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-status-error)]/10 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[var(--color-status-error)]">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M10 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="10" cy="13" r="1" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h3 className="text-headline-4 text-[var(--color-status-error)]">
            Generation Failed
          </h3>
          <p className="text-paragraph-3 text-[var(--color-base-secondary)] mt-0.5">
            The following errors occurred:
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {errors.map((error, i) => (
          <div
            key={i}
            className="px-3 py-2 rounded-md bg-[var(--color-base-surface-primary)] border border-[var(--color-status-error)]/20 text-paragraph-2 text-[var(--color-base-primary)]"
          >
            {error}
          </div>
        ))}
      </div>
    </div>
  );
}

// Copy button component
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 p-0.5 text-[var(--color-base-tertiary)] hover:text-[var(--color-base-secondary)] transition-colors"
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8L6.5 11.5L13 5" stroke="var(--color-status-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )}
    </button>
  );
}

// Cell renderer based on column type
function renderCell(col: TableColumn, row: Record<string, string>): React.ReactNode {
  if (col.type === "live") {
    const v = row[col.id];
    const initialOn = v !== "false" && v !== "0" && v !== "off" && v !== "no";
    return <Toggle size="sm" defaultChecked={initialOn} aria-label={`${col.label} toggle`} />;
  }

  if (col.type === "duration" && col.durationStartFieldId && col.durationEndFieldId) {
    const startRaw = row[col.durationStartFieldId];
    const endRaw = row[col.durationEndFieldId];
    const s = formatDurationParts(startRaw);
    const e = formatDurationParts(endRaw);
    if (!s && !e) return "—";
    const dateLine = `${s?.date ?? "—"} - ${e?.date ?? "—"}`;
    return (
      <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
        <span
          className="size-2 rounded-full bg-[var(--color-status-success)] shrink-0"
          aria-hidden
        />
        <span className="text-paragraph-2 tabular-nums leading-tight whitespace-nowrap">{dateLine}</span>
      </div>
    );
  }

  const value = row[col.id];
  if (!value && col.type !== "actions") return "—";

  const cellContent = (() => {
    switch (col.type) {
      case "date": {
        const parts = formatDurationParts(value);
        if (!parts) return "—";
        return (
          <span className="tabular-nums whitespace-nowrap">
            {parts.date}{parts.time ? ` ${parts.time}` : ""}
          </span>
        );
      }

      case "status":
        const statusColors: Record<string, string> = {
          Active: "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]",
          Pending: "bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)]",
          Inactive: "bg-[var(--color-base-surface-secondary)] text-[var(--color-base-tertiary)]",
          Suspended: "bg-[var(--color-status-error)]/10 text-[var(--color-status-error)]",
        };
        return (
          <span className={`px-2 py-0.5 text-paragraph-3 rounded-full ${statusColors[value || ""] || statusColors.Active}`}>
            {value}
          </span>
        );
        
      case "number":
        return <span className="font-mono">{value}</span>;
        
      default:
        return value;
    }
  })();

  if (col.copyable && value) {
    return (
      <span className="inline-flex items-center">
        {cellContent}
        <CopyButton value={value} />
      </span>
    );
  }

  return cellContent;
}
