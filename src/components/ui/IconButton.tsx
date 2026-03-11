"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

// ============================================
// TYPES
// ============================================

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon element to display */
  icon: ReactNode;
  /** Badge count (shows notification badge if > 0) */
  badge?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Aria label for accessibility */
  "aria-label": string;
}

// ============================================
// LOADING SPINNER
// ============================================

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
  bg-[var(--color-base-surface-primary)]
  border
  border-[var(--color-base-stroke)]
  rounded-lg
  transition-all
  duration-200
  ease-out
  outline-none
  cursor-pointer
  hover:border-[var(--color-base-tertiary)]
  hover:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]
  active:scale-95
  disabled:cursor-not-allowed
  disabled:opacity-50
  disabled:hover:shadow-none
  disabled:hover:border-[var(--color-base-stroke)]
  focus-visible:ring-2
  focus-visible:ring-[var(--color-base-stroke)]
  focus-visible:ring-offset-2
`;

const sizeStyles = {
  sm: "size-7", // 28px
  md: "size-8", // 32px
};

// ============================================
// COMPONENT
// ============================================

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      badge,
      isLoading = false,
      size = "md",
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const showBadge = badge !== undefined && badge > 0 && !isLoading;

    const buttonClasses = [
      baseStyles,
      sizeStyles[size],
      isLoading ? "cursor-wait" : "",
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
        {/* Icon or Loading Spinner */}
        <span className="size-5 flex items-center justify-center text-[var(--color-base-primary)]">
          {isLoading ? <LoadingSpinner /> : icon}
        </span>

        {/* Notification Badge */}
        {showBadge && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 flex items-center justify-center bg-[var(--color-brand-primary)] text-white text-xs font-medium rounded-full">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

// ============================================
// EXPORTS
// ============================================

export default IconButton;
