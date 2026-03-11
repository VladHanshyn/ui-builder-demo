"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, createContext, useContext, useId, useState } from "react";

// ============================================
// TYPES
// ============================================

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Radio label */
  label?: ReactNode;
  /** Radio value */
  value: string;
  /** Hide the label visually */
  hideLabel?: boolean;
}

export interface RadioGroupProps {
  /** Group name (required for radio functionality) */
  name: string;
  /** Currently selected value */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Group label */
  label?: ReactNode;
  /** Radio items */
  children: ReactNode;
  /** Additional class names */
  className?: string;
  /** Orientation */
  orientation?: "horizontal" | "vertical";
  /** Disabled state for all radios */
  disabled?: boolean;
}

// ============================================
// CONTEXT
// ============================================

interface RadioGroupContextType {
  name: string;
  value?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextType | null>(null);

const useRadioGroup = () => {
  return useContext(RadioGroupContext);
};

// ============================================
// RADIO COMPONENT
// ============================================

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      value,
      hideLabel = false,
      disabled: localDisabled = false,
      defaultChecked = false,
      className = "",
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const group = useRadioGroup();
    const generatedId = useId();
    const inputId = id || generatedId;
    const name = group?.name || props.name;
    const isDisabled = localDisabled || group?.disabled || false;
    
    // For standalone radio (not in group)
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    
    // Determine checked state
    const isChecked = group ? group.value === value : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        if (group) {
          group.onValueChange?.(value);
        } else {
          setInternalChecked(true);
        }
      }
      onChange?.(e);
    };

    // Box styles based on state
    const getBoxClasses = () => {
      const base = "relative shrink-0 size-4 rounded-full border transition-all duration-200 ease-out flex items-center justify-center";
      
      if (isDisabled) {
        if (isChecked) {
          return `${base} bg-[var(--color-base-tertiary)] border-[var(--color-base-tertiary)]`;
        }
        return `${base} bg-[var(--color-base-surface-secondary)] border-[var(--color-base-surface-secondary)]`;
      }
      
      if (isChecked) {
        return `${base} bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] shadow-[inset_0_1px_2px_-1px_rgba(0,0,0,0.16)]`;
      }
      
      return `${base} bg-[var(--color-base-surface-primary)] border-[var(--color-base-stroke)] group-hover:border-[var(--color-base-tertiary)]`;
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
          ${isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        {/* Hidden native radio */}
        <input
          ref={ref}
          type="radio"
          id={inputId}
          name={name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={handleChange}
          className="sr-only peer"
          {...props}
        />

        {/* Custom radio circle */}
        <span className={getBoxClasses()}>
          {/* Inner white dot - shown when checked */}
          {isChecked && (
            <span className="size-2 rounded-full bg-white shadow-[0_4px_8px_-4px_rgba(0,0,0,0.12),0_7px_40px_-8px_rgba(0,0,0,0.05)]" />
          )}
        </span>

        {/* Label */}
        {label && !hideLabel && (
          <span
            className={`
              text-sm font-medium leading-5 transition-colors duration-200
              ${isDisabled ? "text-[var(--color-base-tertiary)]" : "text-[var(--color-base-primary)]"}
            `.replace(/\s+/g, " ").trim()}
          >
            {label}
          </span>
        )}
      </label>
    );
  }
);

Radio.displayName = "Radio";

// ============================================
// RADIO GROUP COMPONENT
// ============================================

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      name,
      value: controlledValue,
      defaultValue,
      onValueChange,
      label,
      children,
      className = "",
      orientation = "vertical",
      disabled = false,
    },
    ref
  ) => {
    // Internal state for uncontrolled mode
    const [internalValue, setInternalValue] = useState(defaultValue);
    
    // Determine if controlled or uncontrolled
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    
    const handleValueChange = (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <RadioGroupContext.Provider value={{ name, value, disabled, onValueChange: handleValueChange }}>
        <div ref={ref} className={`flex flex-col gap-2 ${className}`} role="radiogroup">
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
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

// ============================================
// EXPORTS
// ============================================

export default Radio;
