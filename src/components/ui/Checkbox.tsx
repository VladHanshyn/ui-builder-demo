"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, useCallback, useId, useRef, useState } from "react";

// ============================================
// TYPES
// ============================================

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Checkbox label */
  label?: ReactNode;
  /** Checked state (controlled) */
  checked?: boolean;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Change handler */
  onCheckedChange?: (checked: boolean) => void;
  /** Hide the label visually */
  hideLabel?: boolean;
  /** Prevent browser from scrolling to bring checkbox into view on focus (fixes scroll jump in modals) */
  preventScrollOnFocus?: boolean;
}

// ============================================
// CHECK ICON
// ============================================

const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 6.5L4.5 8.5L9.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================
// COMPONENT
// ============================================

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      hideLabel = false,
      disabled = false,
      preventScrollOnFocus = false,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const inputRef = useRef<HTMLInputElement>(null);

    const setRef = useCallback(
      (el: HTMLInputElement | null) => {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
      },
      [ref]
    );
    
    // Internal state for uncontrolled mode
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    
    // Determine if controlled or uncontrolled
    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : internalChecked;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      
      onCheckedChange?.(newChecked);
      props.onChange?.(e);
    };

    // Box styles based on state
    const getBoxClasses = () => {
      const base = "relative shrink-0 size-4 rounded border transition-all duration-200 ease-out flex items-center justify-center";
      
      if (disabled) {
        if (isChecked) {
          return `${base} bg-[var(--color-base-tertiary)] border-[var(--color-base-tertiary)] text-white`;
        }
        return `${base} bg-[var(--color-base-surface-secondary)] border-[var(--color-base-surface-secondary)]`;
      }
      
      if (isChecked) {
        return `${base} bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white shadow-[inset_0_1px_2px_-1px_rgba(0,0,0,0.16)]`;
      }
      
      return `${base} bg-[var(--color-base-surface-primary)] border-[var(--color-base-stroke)] group-hover:border-[var(--color-base-tertiary)]`;
    };

    return (
      <label
        htmlFor={inputId}
        onPointerDown={
          preventScrollOnFocus && !disabled
            ? (e) => {
                const el = inputRef.current ?? document.getElementById(inputId) as HTMLInputElement | null;
                el?.focus({ preventScroll: true });
              }
            : undefined
        }
        onClick={
          preventScrollOnFocus && !disabled
            ? (e) => {
                e.preventDefault();
                inputRef.current?.focus({ preventScroll: true });
                const nextChecked = !isChecked;
                if (!isControlled) setInternalChecked(nextChecked);
                onCheckedChange?.(nextChecked);
                const target = Object.assign(document.createElement("input"), {
                  type: "checkbox",
                  checked: nextChecked,
                }) as HTMLInputElement;
                props.onChange?.({ target, type: "change", bubbles: true } as React.ChangeEvent<HTMLInputElement>);
              }
            : undefined
        }
        className={`
          group
          inline-flex
          items-center
          gap-2
          select-none
          ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        {/* Hidden native checkbox */}
        <input
          ref={setRef}
          type="checkbox"
          id={inputId}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />

        {/* Custom checkbox box */}
        <span className={getBoxClasses()}>
          {/* Checkmark - shown when checked */}
          {isChecked && <CheckIcon />}
        </span>

        {/* Label */}
        {label && !hideLabel && (
          <span
            className={`
              text-sm font-medium leading-5 transition-colors duration-200
              ${disabled ? "text-[var(--color-base-tertiary)]" : "text-[var(--color-base-primary)]"}
            `.replace(/\s+/g, " ").trim()}
          >
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

// ============================================
// CHECKBOX GROUP
// ============================================

export interface CheckboxGroupProps {
  /** Group label */
  label?: ReactNode;
  /** Checkbox items */
  children: ReactNode;
  /** Additional class names */
  className?: string;
  /** Orientation */
  orientation?: "horizontal" | "vertical";
}

export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ label, children, className = "", orientation = "vertical" }, ref) => {
    return (
      <div ref={ref} className={`flex flex-col gap-2 ${className}`} role="group">
        {label && (
          <span className="text-sm font-medium text-[var(--color-base-primary)]">
            {label}
          </span>
        )}
        <div
          className={`
            flex
            ${orientation === "vertical" ? "flex-col gap-3" : "flex-row flex-wrap gap-4"}
          `.replace(/\s+/g, " ").trim()}
        >
          {children}
        </div>
      </div>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

// ============================================
// EXPORTS
// ============================================

export default Checkbox;
