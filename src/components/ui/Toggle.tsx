"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, useId, useState } from "react";

// ============================================
// TYPES
// ============================================

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Toggle label */
  label?: ReactNode;
  /** Checked/on state (controlled) */
  checked?: boolean;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Change handler */
  onCheckedChange?: (checked: boolean) => void;
  /** Hide the label visually */
  hideLabel?: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

// ============================================
// COMPONENT
// ============================================

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      label,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      hideLabel = false,
      disabled = false,
      size = "md",
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    
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

    // Size configuration
    const sizes = {
      sm: {
        track: "w-7 h-4",       // 28x16
        knob: "size-3",         // 12x12
        onLeft: "left-[14px]",  // 28-12-2 = 14px
      },
      md: {
        track: "w-8 h-4",       // 32x16
        knob: "size-3",         // 12x12
        onLeft: "left-[18px]",  // 32-12-2 = 18px
      },
    };

    const sizeConfig = sizes[size];

    // Track styles based on state
    const getTrackClasses = () => {
      const base = `relative shrink-0 rounded-full transition-colors duration-200 ease-out ${sizeConfig.track}`;
      
      if (disabled) {
        if (isChecked) {
          return `${base} bg-[var(--color-brand-primary)] opacity-50`;
        }
        return `${base} bg-[var(--color-base-surface-secondary)]`;
      }
      
      if (isChecked) {
        return `${base} bg-[var(--color-brand-primary)]`;
      }
      
      return `${base} bg-[var(--color-base-tertiary)]`;
    };

    // Knob styles - use simple left positioning to avoid bounce
    const getKnobClasses = () => {
      const base = `absolute top-1/2 -translate-y-1/2 ${sizeConfig.knob} rounded-full bg-white transition-[left] duration-150 ease-linear shadow-[0_4px_8px_-4px_rgba(0,0,0,0.12),0_7px_40px_-8px_rgba(0,0,0,0.05)]`;
      
      if (isChecked) {
        return `${base} ${sizeConfig.onLeft}`;
      }
      
      return `${base} left-[2px]`;
    };

    return (
      <label
        htmlFor={inputId}
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
          ref={ref}
          type="checkbox"
          role="switch"
          aria-checked={isChecked}
          id={inputId}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />

        {/* Custom toggle track */}
        <span className={getTrackClasses()}>
          {/* Toggle knob */}
          <span className={getKnobClasses()} />
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

Toggle.displayName = "Toggle";

// ============================================
// EXPORTS
// ============================================

export default Toggle;
