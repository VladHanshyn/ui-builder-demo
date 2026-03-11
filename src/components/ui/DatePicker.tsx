"use client";

import {
  forwardRef,
  HTMLAttributes,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Button } from "./Button";
import { Toggle } from "./Toggle";

// ============================================
// TYPES
// ============================================

export interface DatePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Selected date */
  value?: Date | null;
  /** Default selected date */
  defaultValue?: Date | null;
  /** Change handler */
  onChange?: (date: Date | null) => void;
  /** Whether to show period selector (Custom, Today, etc.) */
  showPeriodSelector?: boolean;
  /** Whether to allow range selection */
  allowRange?: boolean;
  /** Range start date */
  startDate?: Date | null;
  /** Range end date */
  endDate?: Date | null;
  /** Range change handler */
  onRangeChange?: (start: Date | null, end: Date | null) => void;
  /** Label for the date input */
  label?: string;
  /** End date label */
  endLabel?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** First day of week (0 = Sunday, 1 = Monday) */
  firstDayOfWeek?: 0 | 1;
  /** Date format display function */
  formatDate?: (date: Date) => string;
  /** Clear button text */
  clearText?: string;
  /** Apply button text */
  applyText?: string;
  /** Show action buttons */
  showActions?: boolean;
  /** On clear */
  onClear?: () => void;
  /** On apply */
  onApply?: () => void;
}

// ============================================
// HELPERS
// ============================================

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const DAYS_OF_WEEK_SUNDAY = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const formatDateDefault = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
};

const isSameDay = (a: Date | null | undefined, b: Date | null | undefined): boolean => {
  if (!a || !b) return false;
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
};

const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

const isInRange = (date: Date, start: Date | null, end: Date | null): boolean => {
  if (!start || !end) return false;
  const time = date.getTime();
  return time > start.getTime() && time < end.getTime();
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

// ============================================
// DAY CELL
// ============================================

interface DayCellProps {
  day: number | null;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const DayCell = ({
  day,
  isCurrentMonth,
  isSelected,
  isToday: isTodayDate,
  isRangeStart,
  isRangeEnd,
  isInRange: isInRangeDate,
  isDisabled,
  onClick,
}: DayCellProps) => {
  if (day === null) {
    return <div className="size-6" />;
  }

  const getDayClasses = () => {
    const base = `
      relative z-10 size-6 flex items-center justify-center text-paragraph-3 rounded-full
      cursor-pointer transition-colors duration-150
    `;

    if (isDisabled) {
      return `${base} text-[var(--color-base-tertiary)] cursor-not-allowed`;
    }

    if (isSelected || isRangeStart || isRangeEnd) {
      return `${base} bg-[var(--color-brand-primary)] text-white`;
    }

    if (isTodayDate) {
      return `${base} border border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/[0.08]`;
    }

    if (!isCurrentMonth) {
      return `${base} text-[var(--color-base-secondary)] hover:bg-[var(--color-brand-primary)]/[0.08]`;
    }

    return `${base} text-[var(--color-base-primary)] hover:bg-[var(--color-brand-primary)]/[0.08]`;
  };

  // Range line background classes
  const getRangeLineClasses = () => {
    if (!isInRangeDate && !isRangeStart && !isRangeEnd) return "";
    
    let classes = "absolute inset-y-0 bg-[var(--color-brand-primary)]/[0.08]";
    
    if (isRangeStart) {
      // Start of range - rounded left, extends to right edge
      classes += " left-1/2 right-[-4px] rounded-l-full";
    } else if (isRangeEnd) {
      // End of range - rounded right, extends from left edge
      classes += " left-[-4px] right-1/2 rounded-r-full";
    } else if (isInRangeDate) {
      // Middle of range - full width, extends to neighbors
      classes += " left-[-4px] right-[-4px]";
    }
    
    return classes;
  };

  const rangeLineClasses = getRangeLineClasses();

  return (
    <div className="relative flex items-center justify-center">
      {/* Range line background */}
      {rangeLineClasses && (
        <div className={rangeLineClasses} />
      )}
      {/* Day button */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={onClick}
        className={getDayClasses().replace(/\s+/g, " ").trim()}
      >
        {day}
      </button>
    </div>
  );
};

// ============================================
// DATE PICKER
// ============================================

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      showPeriodSelector = false,
      allowRange = false,
      startDate: controlledStartDate,
      endDate: controlledEndDate,
      onRangeChange,
      label = "Date",
      endLabel = "End Date",
      disabled = false,
      minDate,
      maxDate,
      firstDayOfWeek = 1,
      formatDate = formatDateDefault,
      clearText = "Clear",
      applyText = "Apply",
      showActions = true,
      onClear,
      onApply,
      className = "",
      ...props
    },
    ref
  ) => {
    // State
    const [currentMonth, setCurrentMonth] = useState(() => {
      const initial = value || defaultValue || new Date();
      return new Date(initial.getFullYear(), initial.getMonth(), 1);
    });

    const [selectedDate, setSelectedDate] = useState<Date | null>(
      value !== undefined ? value : (defaultValue || null)
    );

    const [rangeStart, setRangeStart] = useState<Date | null>(
      controlledStartDate !== undefined ? controlledStartDate : null
    );

    const [rangeEnd, setRangeEnd] = useState<Date | null>(
      controlledEndDate !== undefined ? controlledEndDate : null
    );

    const [showEndDate, setShowEndDate] = useState(allowRange);

    // Sync with controlled props
    useEffect(() => {
      if (value !== undefined) {
        setSelectedDate(value);
      }
    }, [value]);

    useEffect(() => {
      if (controlledStartDate !== undefined) {
        setRangeStart(controlledStartDate);
      }
    }, [controlledStartDate]);

    useEffect(() => {
      if (controlledEndDate !== undefined) {
        setRangeEnd(controlledEndDate);
      }
    }, [controlledEndDate]);

    // Navigation
    const goToPreviousMonth = useCallback(() => {
      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    // Calendar grid
    const calendarDays = useMemo(() => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const daysInPrevMonth = getDaysInMonth(year, month - 1);
      let firstDay = getFirstDayOfMonth(year, month);

      // Adjust for first day of week
      if (firstDayOfWeek === 1) {
        firstDay = firstDay === 0 ? 6 : firstDay - 1;
      }

      const days: Array<{
        day: number | null;
        isCurrentMonth: boolean;
        date: Date | null;
      }> = [];

      // Previous month days (to fill the first row)
      for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        days.push({
          day,
          isCurrentMonth: false,
          date: new Date(year, month - 1, day),
        });
      }

      // Current month days
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          day: i,
          isCurrentMonth: true,
          date: new Date(year, month, i),
        });
      }

      // Fill remaining cells in the last row with empty cells (no next month days)
      const remainingInLastRow = days.length % 7;
      if (remainingInLastRow > 0) {
        const emptyCells = 7 - remainingInLastRow;
        for (let i = 0; i < emptyCells; i++) {
          days.push({
            day: null,
            isCurrentMonth: false,
            date: null,
          });
        }
      }

      return days;
    }, [currentMonth, firstDayOfWeek]);

    // Handle day click
    const handleDayClick = useCallback(
      (date: Date) => {
        if (disabled) return;

        // Check min/max
        if (minDate && date < minDate) return;
        if (maxDate && date > maxDate) return;

        if (showEndDate) {
          // Range selection
          if (!rangeStart || (rangeStart && rangeEnd)) {
            // Start new range
            setRangeStart(date);
            setRangeEnd(null);
          } else {
            // Complete range
            if (date < rangeStart) {
              setRangeEnd(rangeStart);
              setRangeStart(date);
            } else {
              setRangeEnd(date);
            }
          }
        } else {
          // Single date selection
          setSelectedDate(date);
          if (value === undefined) {
            onChange?.(date);
          }
        }
      },
      [disabled, minDate, maxDate, showEndDate, rangeStart, rangeEnd, value, onChange]
    );

    // Handle clear
    const handleClear = useCallback(() => {
      setSelectedDate(null);
      setRangeStart(null);
      setRangeEnd(null);
      onChange?.(null);
      onRangeChange?.(null, null);
      onClear?.();
    }, [onChange, onRangeChange, onClear]);

    // Handle apply
    const handleApply = useCallback(() => {
      if (showEndDate) {
        onRangeChange?.(rangeStart, rangeEnd);
      } else {
        onChange?.(selectedDate);
      }
      onApply?.();
    }, [showEndDate, rangeStart, rangeEnd, selectedDate, onChange, onRangeChange, onApply]);

    // Check if date is disabled
    const isDateDisabled = useCallback(
      (date: Date) => {
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
      },
      [minDate, maxDate]
    );

    const daysOfWeek = firstDayOfWeek === 1 ? DAYS_OF_WEEK : DAYS_OF_WEEK_SUNDAY;

    return (
      <div
        ref={ref}
        className={`
          inline-flex flex-col
          min-w-[216px]
          bg-[var(--color-base-surface-primary)]
          rounded-lg
          shadow-[0px_4px_8px_-4px_rgba(0,0,0,0.12),0px_7px_40px_-8px_rgba(0,0,0,0.05)]
          overflow-hidden
          ${disabled ? "opacity-50 pointer-events-none" : ""}
          ${className}
        `.replace(/\s+/g, " ").trim()}
        {...props}
      >
        {/* Content */}
        <div className="flex flex-col gap-2 p-3 pb-1">
          {/* Period Selector (optional) */}
          {showPeriodSelector && (
            <div className="w-full">
              <div className="flex items-center justify-between h-8 px-2 rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]">
                <span className="text-paragraph-2 text-[var(--color-base-primary)]">Custom</span>
                <ChevronRightIcon size={20} className="text-[var(--color-base-primary)] rotate-90" />
              </div>
            </div>
          )}

          {/* Date Inputs - horizontal layout when range is enabled */}
          <div className={`flex ${showEndDate ? "flex-row gap-2" : "flex-col"}`}>
            {/* Start Date Input */}
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-headline-4 text-[var(--color-base-primary)]">{label}</span>
              <div className="flex items-center h-8 px-2 rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]">
                <span className="text-paragraph-2 text-[var(--color-base-primary)]">
                  {selectedDate ? formatDate(selectedDate) : (rangeStart ? formatDate(rangeStart) : "DD/MM/YY")}
                </span>
              </div>
            </div>

            {/* End Date Input (if range) */}
            {showEndDate && (
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-headline-4 text-[var(--color-base-primary)]">{endLabel}</span>
                <div className="flex items-center h-8 px-2 rounded-lg border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]">
                  <span className="text-paragraph-2 text-[var(--color-base-primary)]">
                    {rangeEnd ? formatDate(rangeEnd) : "DD/MM/YY"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="pt-2">
            {/* Month/Year Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-paragraph-2 text-[var(--color-base-primary)]">
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="p-0.5 rounded hover:bg-[var(--color-base-surface-secondary)] transition-colors"
                >
                  <ChevronLeftIcon size={16} className="text-[var(--color-base-secondary)]" />
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="p-0.5 rounded hover:bg-[var(--color-base-surface-secondary)] transition-colors"
                >
                  <ChevronRightIcon size={16} className="text-[var(--color-base-secondary)]" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="size-6 flex items-center justify-center text-paragraph-3 text-[var(--color-base-secondary)]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 overflow-visible">
              {calendarDays.map((dayInfo, index) => (
                <DayCell
                  key={index}
                  day={dayInfo.day}
                  isCurrentMonth={dayInfo.isCurrentMonth}
                  isSelected={!showEndDate && dayInfo.date ? isSameDay(dayInfo.date, selectedDate) : false}
                  isToday={dayInfo.date ? isToday(dayInfo.date) : false}
                  isRangeStart={showEndDate && dayInfo.date ? isSameDay(dayInfo.date, rangeStart) : false}
                  isRangeEnd={showEndDate && dayInfo.date ? isSameDay(dayInfo.date, rangeEnd) : false}
                  isInRange={showEndDate && dayInfo.date ? isInRange(dayInfo.date, rangeStart, rangeEnd) : false}
                  isDisabled={dayInfo.date ? isDateDisabled(dayInfo.date) : true}
                  onClick={() => dayInfo.date && handleDayClick(dayInfo.date)}
                />
              ))}
            </div>
          </div>

          {/* End Date Toggle */}
          {allowRange && (
            <div className="flex items-center gap-2 py-1">
              <Toggle
                checked={showEndDate}
                onChange={(e) => setShowEndDate(e.target.checked)}
                size="sm"
              />
              <span className="text-headline-4 text-[var(--color-base-primary)]">End Date</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--color-base-stroke)]">
            <Button variant="secondary" onClick={handleClear}>
              {clearText}
            </Button>
            <Button variant="primary" onClick={handleApply}>
              {applyText}
            </Button>
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

// ============================================
// DATE PICKER INPUT
// ============================================

export interface DatePickerInputProps extends Omit<DatePickerProps, "className"> {
  /** Input label */
  inputLabel?: string;
  /** Show mandatory indicator */
  mandatory?: boolean;
  /** Error message */
  error?: string;
  /** Hint text */
  hint?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Input class name */
  inputClassName?: string;
  /** Picker class name */
  pickerClassName?: string;
}

export const DatePickerInput = forwardRef<HTMLDivElement, DatePickerInputProps>(
  (
    {
      inputLabel,
      mandatory = false,
      error,
      hint,
      fullWidth = false,
      placeholder = "Select date...",
      inputClassName = "",
      pickerClassName = "",
      value,
      defaultValue,
      onChange,
      formatDate = formatDateDefault,
      ...pickerProps
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(
      value !== undefined ? value : (defaultValue || null)
    );

    useEffect(() => {
      if (value !== undefined) {
        setSelectedDate(value);
      }
    }, [value]);

    const handleDateChange = (date: Date | null) => {
      setSelectedDate(date);
      onChange?.(date);
    };

    const handleApply = () => {
      setIsOpen(false);
      pickerProps.onApply?.();
    };

    const isError = !!error;

    const getBorderClasses = () => {
      if (isError) {
        return "border border-[var(--color-semantic-danger-100)] bg-[var(--color-base-surface-primary)]";
      }
      if (isOpen) {
        return "border border-[var(--color-base-secondary)] ring-2 ring-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]";
      }
      return "border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] hover:border-[var(--color-base-secondary)]";
    };

    return (
      <div
        ref={ref}
        className={`relative flex flex-col gap-1 ${fullWidth ? "w-full" : ""}`}
      >
        {/* Label */}
        {inputLabel && (
          <div className="flex items-center gap-4 h-5">
            <label className="text-headline-4 text-[var(--color-base-primary)]">
              {inputLabel}
              {mandatory && (
                <span className="ml-0.5 text-[var(--color-semantic-danger-100)]">*</span>
              )}
            </label>
          </div>
        )}

        {/* Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-1 rounded-lg transition-all duration-150 cursor-pointer
            h-8 px-2 py-1.5
            ${getBorderClasses()}
            ${inputClassName}
          `.replace(/\s+/g, " ").trim()}
        >
          <span className={`flex-1 text-left text-paragraph-2 ${selectedDate ? "text-[var(--color-base-primary)]" : "text-[var(--color-base-secondary)]"}`}>
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </span>
          <ChevronRightIcon size={20} className="text-[var(--color-base-primary)] rotate-90" />
        </button>

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

        {/* Picker Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 z-50">
            <DatePicker
              {...pickerProps}
              value={selectedDate}
              onChange={handleDateChange}
              formatDate={formatDate}
              onApply={handleApply}
              onClear={() => {
                handleDateChange(null);
                pickerProps.onClear?.();
              }}
              className={pickerClassName}
            />
          </div>
        )}
      </div>
    );
  }
);

DatePickerInput.displayName = "DatePickerInput";
