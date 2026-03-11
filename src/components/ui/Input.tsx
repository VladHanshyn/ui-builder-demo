"use client";

import {
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  useState,
  useId,
} from "react";
import { CloseIcon, SearchIcon, ChevronDownIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

// ============================================
// TYPES
// ============================================

export type InputState = "default" | "error" | "disabled";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Input label/title text */
  label?: string;
  /** Show mandatory indicator (red asterisk) */
  mandatory?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text displayed inside input (right side) */
  helperText?: string;
  /** Error message - sets error state */
  error?: string;
  /** Hint text displayed below input */
  hint?: string;
  /** Top hint badges (displayed next to title) */
  topHints?: string[];
  /** Left icon or element */
  leftIcon?: ReactNode;
  /** Right icon or element */
  rightIcon?: ReactNode;
  /** Show clear button */
  showClear?: boolean;
  /** Clear button click handler */
  onClear?: () => void;
  /** Show as dropdown (adds chevron icon) */
  dropdown?: boolean;
  /** Dropdown click handler */
  onDropdownClick?: () => void;
  /** Show as search input */
  search?: boolean;
  /** Show password toggle */
  passwordToggle?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Input wrapper className */
  wrapperClassName?: string;
}

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  /** Input label/title text */
  label?: string;
  /** Show mandatory indicator (red asterisk) */
  mandatory?: boolean;
  /** Error message - sets error state */
  error?: string;
  /** Hint text displayed below input */
  hint?: string;
  /** Top hint badges (displayed next to title) */
  topHints?: string[];
  /** Full width */
  fullWidth?: boolean;
  /** Input wrapper className */
  wrapperClassName?: string;
  /** Number of rows */
  rows?: number;
}

// ============================================
// HINT BADGE COMPONENT
// ============================================

const HintBadge = ({ 
  children, 
  variant = "default" 
}: { 
  children: ReactNode; 
  variant?: "default" | "error";
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-0.5 px-1 rounded text-paragraph-3";
  
  const variantClasses = {
    default: "bg-[var(--color-base-stroke)] text-[var(--color-base-secondary)]",
    error: "bg-[var(--color-semantic-danger-10)] text-[var(--color-semantic-danger-100)]",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

// ============================================
// INPUT COMPONENT
// ============================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      mandatory = false,
      placeholder,
      helperText,
      error,
      hint,
      topHints,
      leftIcon,
      rightIcon,
      showClear = false,
      onClear,
      dropdown = false,
      onDropdownClick,
      search = false,
      passwordToggle = false,
      fullWidth = false,
      disabled = false,
      className = "",
      wrapperClassName = "",
      type = "text",
      value,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const inputId = props.id || id;
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Determine state
    const isError = !!error;
    const isDisabled = disabled;

    // Get border classes based on state
    const getBorderClasses = () => {
      if (isDisabled) {
        return "border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)]";
      }
      if (isError) {
        return "border border-[var(--color-semantic-danger-100)] bg-[var(--color-base-surface-primary)]";
      }
      if (isFocused) {
        return "border border-[var(--color-base-secondary)] ring-2 ring-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]";
      }
      return "border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] hover:border-[var(--color-base-secondary)]";
    };

    // Get text color based on state
    const getTextColor = () => {
      if (isDisabled) return "text-[var(--color-base-secondary)]";
      return "text-[var(--color-base-primary)]";
    };

    // Handle focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    // Handle blur
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // Determine actual input type for password toggle
    const actualType = passwordToggle ? (showPassword ? "text" : "password") : type;

    // Check if there's any value for clear button
    const hasValue = value !== undefined ? !!value : false;

    return (
      <div className={`flex flex-col gap-1 ${fullWidth ? "w-full" : ""} ${wrapperClassName}`}>
        {/* Title Row */}
        {(label || topHints?.length) && (
          <div className="flex items-center justify-between gap-4 h-5">
            {/* Label */}
            {label && (
              <div className="flex items-center">
                <label 
                  htmlFor={inputId}
                  className="text-headline-4 text-[var(--color-base-primary)]"
                >
                  {label}
                </label>
                {mandatory && (
                  <span className="ml-0.5 text-[var(--color-semantic-danger-100)]">*</span>
                )}
              </div>
            )}
            
            {/* Top Hints */}
            {topHints && topHints.length > 0 && (
              <div className="flex items-center gap-1">
                {topHints.map((hint, index) => (
                  <HintBadge key={index}>{hint}</HintBadge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Container */}
        <div
          className={`
            flex items-center gap-1 rounded-lg transition-all duration-150
            h-8 px-2 py-1.5
            ${getBorderClasses()}
          `.replace(/\s+/g, " ").trim()}
        >
          {/* Left Icon / Search Icon */}
          {(leftIcon || search) && (
            <div className="flex items-center justify-center shrink-0 text-[var(--color-base-secondary)]">
              {search ? <SearchIcon size={20} /> : leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            placeholder={placeholder}
            disabled={isDisabled}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              flex-1 min-w-0 bg-transparent outline-none
              text-paragraph-2
              ${getTextColor()}
              placeholder:text-[var(--color-base-secondary)]
              disabled:cursor-not-allowed
              ${className}
            `.replace(/\s+/g, " ").trim()}
            {...props}
          />

          {/* Helper Text */}
          {helperText && (
            <span className="shrink-0 text-paragraph-2 text-[var(--color-base-secondary)]">
              {helperText}
            </span>
          )}

          {/* Right Icon */}
          {rightIcon && (
            <div className="flex items-center justify-center shrink-0 text-[var(--color-base-secondary)]">
              {rightIcon}
            </div>
          )}

          {/* Clear Button */}
          {showClear && hasValue && !isDisabled && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center justify-center shrink-0 text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] transition-colors"
            >
              <CloseIcon size={20} />
            </button>
          )}

          {/* Password Toggle */}
          {passwordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center justify-center shrink-0 text-[var(--color-base-secondary)] hover:text-[var(--color-base-primary)] transition-colors"
            >
              {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
            </button>
          )}

          {/* Dropdown Icon */}
          {dropdown && (
            <button
              type="button"
              onClick={onDropdownClick}
              disabled={isDisabled}
              className="flex items-center justify-center shrink-0 text-[var(--color-base-primary)] disabled:text-[var(--color-base-secondary)]"
            >
              <ChevronDownIcon size={20} />
            </button>
          )}
        </div>

        {/* Bottom Hint / Error */}
        {(hint || error) && (
          <div className="flex flex-col items-start">
            <HintBadge variant={isError ? "error" : "default"}>
              {error || hint}
            </HintBadge>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ============================================
// TEXTAREA COMPONENT
// ============================================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      mandatory = false,
      placeholder,
      error,
      hint,
      topHints,
      fullWidth = false,
      disabled = false,
      className = "",
      wrapperClassName = "",
      rows = 3,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const textareaId = props.id || id;
    const [isFocused, setIsFocused] = useState(false);

    // Determine state
    const isError = !!error;
    const isDisabled = disabled;

    // Get border classes based on state
    const getBorderClasses = () => {
      if (isDisabled) {
        return "border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-secondary)]";
      }
      if (isError) {
        return "border border-[var(--color-semantic-danger-100)] bg-[var(--color-base-surface-primary)]";
      }
      if (isFocused) {
        return "border border-[var(--color-base-secondary)] ring-2 ring-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)]";
      }
      return "border border-[var(--color-base-stroke)] bg-[var(--color-base-surface-primary)] hover:border-[var(--color-base-secondary)]";
    };

    // Get text color based on state
    const getTextColor = () => {
      if (isDisabled) return "text-[var(--color-base-secondary)]";
      return "text-[var(--color-base-primary)]";
    };

    // Handle focus
    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    // Handle blur
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={`flex flex-col gap-1 ${fullWidth ? "w-full" : ""} ${wrapperClassName}`}>
        {/* Title Row */}
        {(label || topHints?.length) && (
          <div className="flex items-center justify-between gap-4 h-5">
            {/* Label */}
            {label && (
              <div className="flex items-center">
                <label 
                  htmlFor={textareaId}
                  className="text-headline-4 text-[var(--color-base-primary)]"
                >
                  {label}
                </label>
                {mandatory && (
                  <span className="ml-0.5 text-[var(--color-semantic-danger-100)]">*</span>
                )}
              </div>
            )}
            
            {/* Top Hints */}
            {topHints && topHints.length > 0 && (
              <div className="flex items-center gap-1">
                {topHints.map((hint, index) => (
                  <HintBadge key={index}>{hint}</HintBadge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Textarea Container */}
        <div
          className={`
            flex rounded-lg transition-all duration-150 px-2 py-1.5
            ${getBorderClasses()}
          `.replace(/\s+/g, " ").trim()}
        >
          {/* Textarea Field */}
          <textarea
            ref={ref}
            id={textareaId}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={rows}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              flex-1 min-w-0 bg-transparent outline-none resize-none
              text-paragraph-2
              ${getTextColor()}
              placeholder:text-[var(--color-base-secondary)]
              disabled:cursor-not-allowed
              ${className}
            `.replace(/\s+/g, " ").trim()}
            {...props}
          />
        </div>

        {/* Bottom Hint / Error */}
        {(hint || error) && (
          <div className="flex flex-col items-start">
            <HintBadge variant={isError ? "error" : "default"}>
              {error || hint}
            </HintBadge>
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

// ============================================
// SEARCH INPUT COMPONENT
// ============================================

export interface SearchInputProps extends Omit<InputProps, "search" | "leftIcon"> {
  /** Loading state */
  loading?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ loading = false, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        search
        placeholder={props.placeholder || "Search..."}
        showClear
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";

// ============================================
// PASSWORD INPUT COMPONENT
// ============================================

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type" | "passwordToggle">>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="password"
        passwordToggle
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";

// ============================================
// SELECT INPUT COMPONENT (Dropdown style)
// ============================================

export interface SelectInputProps extends Omit<InputProps, "dropdown"> {
  /** Whether the dropdown is open */
  isOpen?: boolean;
}

export const SelectInput = forwardRef<HTMLInputElement, SelectInputProps>(
  ({ isOpen = false, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        dropdown
        readOnly
        {...props}
      />
    );
  }
);

SelectInput.displayName = "SelectInput";
