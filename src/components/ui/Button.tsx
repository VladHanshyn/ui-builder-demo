"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

// ============================================
// TYPES
// ============================================

export type ButtonVariant = "primary" | "secondary";
export type ButtonState = "default" | "hover" | "pressed" | "disabled" | "loading";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual variant */
  variant?: ButtonVariant;
  /** Button text content */
  children: ReactNode;
  /** Left icon element */
  leftIcon?: ReactNode;
  /** Right icon element */
  rightIcon?: ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
}

// ============================================
// ICON COMPONENTS
// ============================================

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 4V16M4 10H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`animate-spin ${className}`}
  >
    <path
      d="M10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// ============================================
// STYLES
// ============================================

const baseStyles = `
  relative
  inline-flex
  items-center
  justify-center
  gap-1
  px-3
  h-8
  rounded-lg
  font-medium
  text-sm
  leading-5
  transition-all
  duration-200
  ease-out
  outline-none
  focus-visible:ring-2
  focus-visible:ring-offset-2
  select-none
  cursor-pointer
  disabled:cursor-not-allowed
`;

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-brand-primary)]
    text-white
    hover:shadow-[0_2px_16px_-8px_rgba(252,61,107,0.6),inset_0_-32px_0_0_rgba(255,255,255,0.15)]
    active:scale-[0.98]
    active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.1)]
    disabled:bg-[var(--color-base-stroke)]
    disabled:text-[var(--color-base-tertiary)]
    disabled:shadow-none
    focus-visible:ring-[var(--color-brand-primary)]
  `,
  secondary: `
    bg-[var(--color-base-surface-primary)]
    text-[var(--color-base-primary)]
    border
    border-[var(--color-base-stroke)]
    hover:shadow-[0_2px_16px_-8px_rgba(0,0,0,0.15),inset_0_-32px_0_0_rgba(255,255,255,0.08)]
    hover:border-[var(--color-base-tertiary)]
    active:scale-[0.98]
    active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.05)]
    disabled:bg-[var(--color-base-surface-secondary)]
    disabled:text-[var(--color-base-tertiary)]
    disabled:border-[var(--color-base-stroke)]
    disabled:shadow-none
    focus-visible:ring-[var(--color-base-stroke)]
  `,
};

const loadingStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-base-stroke)]
    text-[var(--color-base-tertiary)]
    cursor-wait
    pointer-events-none
  `,
  secondary: `
    bg-[var(--color-base-surface-secondary)]
    text-[var(--color-base-tertiary)]
    border-[var(--color-base-stroke)]
    cursor-wait
    pointer-events-none
  `,
};

// ============================================
// COMPONENT
// ============================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      children,
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const buttonClasses = [
      baseStyles,
      isLoading ? loadingStyles[variant] : variantStyles[variant],
      fullWidth ? "w-full" : "",
      className,
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={buttonClasses}
        {...props}
      >
        {/* Left Icon or Loading Spinner */}
        {isLoading ? (
          <LoadingSpinner className="shrink-0" />
        ) : leftIcon ? (
          <span className="shrink-0 size-5 flex items-center justify-center">
            {leftIcon}
          </span>
        ) : null}

        {/* Button Text */}
        <span className="flex items-center gap-1">
          {!leftIcon && !isLoading && (
            <span className="w-0 h-6" aria-hidden="true" />
          )}
          {children}
        </span>

        {/* Right Icon */}
        {rightIcon && !isLoading && (
          <span className="shrink-0 size-5 flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// ============================================
// CONVENIENCE COMPONENTS
// ============================================

export interface ButtonWithIconProps extends Omit<ButtonProps, "rightIcon"> {
  /** Show plus icon on the right */
  showPlusIcon?: boolean;
}

export const ButtonWithPlusIcon = forwardRef<HTMLButtonElement, ButtonWithIconProps>(
  ({ showPlusIcon = true, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        rightIcon={showPlusIcon ? <PlusIcon /> : undefined}
        {...props}
      />
    );
  }
);

ButtonWithPlusIcon.displayName = "ButtonWithPlusIcon";

// ============================================
// EXPORTS
// ============================================

export default Button;
export { PlusIcon, LoadingSpinner };
