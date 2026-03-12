"use client";

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { SearchIcon, CheckIcon, CloseIcon, ChevronDownIcon } from "@/components/icons";
import { Button } from "./Button";

// ============================================
// TYPES
// ============================================

export interface SelectOption {
  /** Unique value for the option */
  value: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional left content (icon, avatar) */
  leftContent?: ReactNode;
  /** Optional right content (badge, value) */
  rightContent?: ReactNode;
  /** Whether option is disabled */
  disabled?: boolean;
}

export interface SelectProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Available options */
  options: SelectOption[];
  /** Selected value(s) */
  value?: string | string[];
  /** Default selected value(s) */
  defaultValue?: string | string[];
  /** Change handler */
  onChange?: (value: string | string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Show mandatory indicator */
  mandatory?: boolean;
  /** Error message */
  error?: string;
  /** Hint text */
  hint?: string;
  /** Whether multi-select is enabled */
  multiple?: boolean;
  /** Whether search is enabled */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Whether to show action buttons (Clear/Apply) - primarily for multiselect */
  showActions?: boolean;
  /** Clear button text */
  clearText?: string;
  /** Apply button text */
  applyText?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Read-only mode — looks normal but doesn't open dropdown */
  readOnly?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Maximum height of the dropdown */
  maxHeight?: number;
  /** Custom render for option */
  renderOption?: (option: SelectOption, isSelected: boolean) => ReactNode;
  /** Custom render for selected value display */
  renderValue?: (selected: SelectOption | SelectOption[]) => ReactNode;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** On search change */
  onSearchChange?: (search: string) => void;
}

export interface SelectMenuProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether menu is open */
  isOpen: boolean;
  /** Reference to trigger element for positioning */
  triggerRef: React.RefObject<HTMLElement | null>;
  /** Close handler */
  onClose: () => void;
  /** Children (menu content) */
  children: ReactNode;
  /** Maximum height */
  maxHeight?: number;
}

// ============================================
// CONTEXT
// ============================================

interface SelectContextType {
  value: string[];
  multiple: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const SelectContext = createContext<SelectContextType | null>(null);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select");
  }
  return context;
};

// ============================================
// SELECT MENU (PORTAL)
// ============================================

export const SelectMenu = forwardRef<HTMLDivElement, SelectMenuProps>(
  ({ isOpen, triggerRef, onClose, children, maxHeight = 300, className = "", ...props }, ref) => {
    const [mounted, setMounted] = useState(false);
    const [isPositioned, setIsPositioned] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Calculate position synchronously
    const calculatePosition = useCallback(() => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = Math.min(maxHeight, 400);
      const menuWidth = Math.max(rect.width, 320);

      // Decide whether to show above or below
      const showAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      // Prevent horizontal overflow — align to right edge of trigger if it would overflow
      let left = rect.left;
      const rightOverflow = left + menuWidth - window.innerWidth + 16;
      if (rightOverflow > 0) {
        left = Math.max(8, rect.right - menuWidth);
      }

      setCoords({
        top: showAbove ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left,
        width: rect.width,
      });
    }, [triggerRef, maxHeight]);

    // Position menu and keep it attached to trigger
    useEffect(() => {
      if (!isOpen || !mounted) {
        setIsPositioned(false);
        return;
      }
      
      // Calculate position after layout is stable
      calculatePosition();
      setIsPositioned(true);
      // Recalculate to catch any layout shifts
      const rafId = requestAnimationFrame(() => {
        calculatePosition();
      });
      
      // Recalculate on resize and scroll to stay attached to trigger
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition, true);

      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", calculatePosition);
        window.removeEventListener("scroll", calculatePosition, true);
      };
    }, [isOpen, mounted, calculatePosition]);

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          menuRef.current &&
          !menuRef.current.contains(target) &&
          triggerRef.current &&
          !triggerRef.current.contains(target)
        ) {
          onClose();
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen, onClose, triggerRef]);

    if (!mounted || !isOpen || !isPositioned) return null;

    return createPortal(
      <div
        data-select-portal
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          (menuRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={`
          fixed z-[9999]
          bg-[var(--color-base-surface-primary)]
          rounded-lg
          shadow-[0px_4px_8px_-4px_rgba(0,0,0,0.12),0px_7px_40px_-8px_rgba(0,0,0,0.05)]
          border border-[var(--color-base-stroke)]
          overflow-hidden
          ${className}
        `.replace(/\s+/g, " ").trim()}
        style={{
          top: coords.top,
          left: coords.left,
          width: Math.max(coords.width, 320),
          minWidth: 320,
          maxHeight,
        }}
        {...props}
      >
        {children}
      </div>,
      document.body
    );
  }
);

SelectMenu.displayName = "SelectMenu";

// ============================================
// SELECT OPTION ITEM
// ============================================

export const SelectOptionItem = ({
  option,
  isSelected,
  onClick,
  renderOption,
}: {
  option: SelectOption;
  isSelected: boolean;
  onClick: () => void;
  renderOption?: (option: SelectOption, isSelected: boolean) => ReactNode;
}) => {
  if (renderOption) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        {renderOption(option, isSelected)}
      </div>
    );
  }

  return (
    <div
      onClick={option.disabled ? undefined : onClick}
      className={`
        flex items-center gap-2 px-3 py-2
        transition-colors duration-150
        ${option.disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-[var(--color-base-surface-secondary)]"
        }
        ${isSelected ? "" : ""}
      `.replace(/\s+/g, " ").trim()}
    >
      {/* Checkbox for multiselect */}
      <div
        className={`
          shrink-0 size-4 rounded border transition-colors duration-150
          flex items-center justify-center
          ${isSelected
            ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]"
            : "bg-[var(--color-base-surface-primary)] border-[var(--color-base-stroke)]"
          }
        `.replace(/\s+/g, " ").trim()}
      >
        {isSelected && (
          <CheckIcon className="size-3 text-white" />
        )}
      </div>

      {/* Left Content */}
      {option.leftContent && (
        <div className="shrink-0">{option.leftContent}</div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <p className="text-paragraph-2 text-[var(--color-base-primary)] truncate">
          {option.label}
        </p>
        {option.description && (
          <p className="text-paragraph-3 text-[var(--color-base-secondary)] truncate">
            {option.description}
          </p>
        )}
      </div>

      {/* Right Content */}
      {option.rightContent && (
        <div className="shrink-0">{option.rightContent}</div>
      )}
    </div>
  );
};

// ============================================
// SELECT COMPONENT
// ============================================

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      defaultValue,
      onChange,
      placeholder = "Select...",
      label,
      mandatory = false,
      error,
      hint,
      multiple = false,
      searchable = true,
      searchPlaceholder = "Type to search...",
      showActions = false,
      clearText = "Clear",
      applyText = "Apply",
      disabled = false,
      readOnly = false,
      fullWidth = false,
      maxHeight = 300,
      renderOption,
      renderValue,
      emptyMessage = "No options found",
      loading = false,
      onSearchChange,
      className = "",
      ...props
    },
    ref
  ) => {
    const id = useId();
    const triggerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [pendingValue, setPendingValue] = useState<string[]>([]);

    // Controlled vs uncontrolled
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string[]>(() => {
      if (defaultValue) {
        return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      }
      return [];
    });

    const selectedValues = isControlled
      ? Array.isArray(value) ? value : (value ? [value] : [])
      : internalValue;

    // For multiselect with actions, we use pending value
    const workingValues = showActions && multiple ? pendingValue : selectedValues;

    // Filter options based on search
    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get selected options
    const getSelectedOptions = () => {
      return options.filter((opt) => selectedValues.includes(opt.value));
    };

    // Display value
    const getDisplayValue = () => {
      const selected = getSelectedOptions();
      if (selected.length === 0) return "";

      if (renderValue) {
        return renderValue(multiple ? selected : selected[0]);
      }

      if (multiple) {
        if (selected.length === 1) return selected[0].label;
        return `${selected.length} selected`;
      }

      return selected[0].label;
    };

    // Handle open
    const handleOpen = () => {
      if (disabled || readOnly) return;
      setIsOpen(true);
      setSearchQuery("");
      if (showActions && multiple) {
        setPendingValue([...selectedValues]);
      }
    };

    // Toggle open/close on trigger click (close when clicking trigger again)
    const handleTriggerClick = () => {
      if (disabled || readOnly) return;
      if (isOpen) {
        handleClose();
      } else {
        handleOpen();
      }
    };

    // Handle close
    const handleClose = () => {
      setIsOpen(false);
      setSearchQuery("");
    };

    // Handle select
    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const newValues = workingValues.includes(optionValue)
          ? workingValues.filter((v) => v !== optionValue)
          : [...workingValues, optionValue];

        if (showActions) {
          setPendingValue(newValues);
        } else {
          if (!isControlled) setInternalValue(newValues);
          onChange?.(newValues);
        }
      } else {
        if (!isControlled) setInternalValue([optionValue]);
        onChange?.(optionValue);
        handleClose();
      }
    };

    // Handle clear
    const handleClear = () => {
      if (showActions && multiple) {
        setPendingValue([]);
      } else {
        if (!isControlled) setInternalValue([]);
        onChange?.(multiple ? [] : "");
      }
    };

    // Handle apply
    const handleApply = () => {
      if (!isControlled) setInternalValue(pendingValue);
      onChange?.(multiple ? pendingValue : pendingValue[0] || "");
      handleClose();
    };

    // Handle search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchQuery(newValue);
      onSearchChange?.(newValue);
    };

    // Focus search on open
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }, [isOpen, searchable]);

    // Determine error/focus states
    const isError = !!error;

    const getBorderClasses = () => {
      if (disabled) {
        return "border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)]";
      }
      if (isError) {
        return "border border-[var(--color-semantic-danger-100)] bg-[var(--color-base-surface-primary)]";
      }
      if (isOpen) {
        return "border border-[var(--color-base-secondary)] ring-2 ring-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]";
      }
      return "border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] hover:border-[var(--color-base-secondary)]";
    };

    // Clear button visibility
    const showClearButton = multiple && selectedValues.length > 0 && !disabled;

    return (
      <SelectContext.Provider
        value={{
          value: workingValues,
          multiple,
          onSelect: handleSelect,
          onClose: handleClose,
        }}
      >
        <div
          ref={ref}
          className={`flex flex-col gap-1 ${fullWidth ? "w-full" : ""} ${className}`}
          {...props}
        >
          {/* Label */}
          {label && (
            <div className="flex items-center gap-4 h-5">
              <label className="text-headline-4 text-[var(--color-base-primary)]">
                {label}
                {mandatory && (
                  <span className="ml-0.5 text-[var(--color-semantic-danger-100)]">*</span>
                )}
              </label>
            </div>
          )}

          {/* Trigger */}
          <div
            ref={triggerRef}
            onClick={handleTriggerClick}
            className={`
              flex items-center gap-1 rounded-lg transition-all duration-150 cursor-pointer
              h-8 px-2 py-1.5
              ${getBorderClasses()}
              ${disabled ? "cursor-not-allowed" : ""}
            `.replace(/\s+/g, " ").trim()}
          >
            {/* Display Value */}
            <div className="flex-1 min-w-0">
              {getDisplayValue() ? (
                <span className="text-paragraph-2 text-[var(--color-base-primary)] truncate block">
                  {getDisplayValue()}
                </span>
              ) : (
                <span className="text-paragraph-2 text-[var(--color-base-secondary)] truncate block">
                  {placeholder}
                </span>
              )}
            </div>

            {/* Clear Button (multiselect) */}
            {showClearButton && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="shrink-0 text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] transition-colors"
              >
                <CloseIcon size={20} />
              </button>
            )}

            {/* Dropdown Icon */}
            <div
              className={`
                shrink-0 text-[var(--color-base-primary)] transition-transform duration-150
                ${isOpen ? "rotate-180" : ""}
              `.replace(/\s+/g, " ").trim()}
            >
              <ChevronDownIcon size={20} />
            </div>
          </div>

          {/* Error/Hint */}
          {(error || hint) && (
            <span
              className={`
                inline-flex items-center gap-0.5 px-1 rounded text-paragraph-3
                ${isError
                  ? "bg-[var(--color-semantic-danger-10)] text-[var(--color-semantic-danger-100)]"
                  : "bg-[var(--color-base-stroke)] text-[var(--color-base-secondary)]"
                }
              `.replace(/\s+/g, " ").trim()}
            >
              {error || hint}
            </span>
          )}

          {/* Dropdown Menu */}
          <SelectMenu
            isOpen={isOpen}
            triggerRef={triggerRef}
            onClose={handleClose}
            maxHeight={maxHeight}
          >
            {/* Search */}
            {searchable && (
              <div className="p-2 pb-1 border-b border-[var(--color-base-stroke)]">
                <div className="flex items-center gap-1 h-8 px-2 rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]">
                  <SearchIcon size={20} className="text-[var(--color-base-secondary)] shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={searchPlaceholder}
                    className="flex-1 min-w-0 bg-transparent outline-none text-paragraph-2 text-[var(--color-base-primary)] placeholder:text-[var(--color-base-secondary)]"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div
              className="overflow-y-auto py-2"
              style={{ maxHeight: maxHeight - (searchable ? 56 : 0) - (showActions ? 56 : 0) }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="size-5 border-2 border-[var(--color-base-stroke)] border-t-[var(--color-brand-primary)] rounded-full animate-spin" />
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-paragraph-2 text-[var(--color-base-secondary)]">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <SelectOptionItem
                    key={option.value}
                    option={option}
                    isSelected={workingValues.includes(option.value)}
                    onClick={() => handleSelect(option.value)}
                    renderOption={renderOption}
                  />
                ))
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center justify-between p-2 border-t border-[var(--color-base-stroke)]">
                <Button
                  variant="secondary"
                  onClick={handleClear}
                >
                  {clearText}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApply}
                >
                  {applyText}
                </Button>
              </div>
            )}
          </SelectMenu>
        </div>
      </SelectContext.Provider>
    );
  }
);

Select.displayName = "Select";

// ============================================
// SIMPLE SELECT (Single select without search)
// ============================================

export interface SimpleSelectProps extends Omit<SelectProps, "multiple" | "searchable" | "showActions"> {}

export const SimpleSelect = forwardRef<HTMLDivElement, SimpleSelectProps>(
  (props, ref) => {
    return (
      <Select
        ref={ref}
        {...props}
        multiple={false}
        searchable={false}
        showActions={false}
      />
    );
  }
);

SimpleSelect.displayName = "SimpleSelect";

// ============================================
// MULTISELECT
// ============================================

export interface MultiSelectProps extends Omit<SelectProps, "multiple"> {
  /** Whether to show action buttons */
  showActions?: boolean;
}

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ showActions = true, ...props }, ref) => {
    return (
      <Select
        ref={ref}
        {...props}
        multiple
        showActions={showActions}
      />
    );
  }
);

MultiSelect.displayName = "MultiSelect";
