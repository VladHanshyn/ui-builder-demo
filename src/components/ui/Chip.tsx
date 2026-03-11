"use client";

import { forwardRef, HTMLAttributes, ReactNode } from "react";

// ============================================
// TYPES
// ============================================

export type ChipVariant = "filled" | "outlined";

export interface ChipProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Chip text content */
  children: ReactNode;
  /** Visual variant */
  variant?: ChipVariant;
  /** Selected/active state */
  selected?: boolean;
  /** Left icon element */
  leftIcon?: ReactNode;
  /** Show checkmark icon when selected */
  showCheckmark?: boolean;
  /** Badge count */
  badge?: number;
  /** Click handler for interactive chips */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================
// ICONS
// ============================================

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4.166 10.833L7.5 14.166L15.833 5.833"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M5 5L15 15M5 15L15 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================
// STYLES
// ============================================

const baseStyles = `
  inline-flex
  items-center
  justify-center
  gap-1
  h-8
  px-2
  rounded-lg
  text-sm
  leading-5
  font-normal
  transition-all
  duration-200
  ease-out
  select-none
`;

const interactiveStyles = `
  cursor-pointer
  hover:opacity-90
  active:scale-[0.98]
`;

const disabledStyles = `
  opacity-50
  cursor-not-allowed
`;

const variantStyles: Record<ChipVariant, { default: string; selected: string }> = {
  filled: {
    default: `
      bg-[var(--color-base-surface-secondary)]
      text-[var(--color-base-primary)]
    `,
    selected: `
      bg-[var(--color-base-primary)]
      text-[var(--color-base-surface-primary)]
    `,
  },
  outlined: {
    default: `
      bg-[var(--color-base-surface-primary)]
      border
      border-[var(--color-base-stroke)]
      text-[var(--color-base-secondary)]
    `,
    selected: `
      bg-[var(--color-base-surface-primary)]
      border
      border-[var(--color-base-primary)]
      text-[var(--color-base-primary)]
    `,
  },
};

// ============================================
// COMPONENT
// ============================================

export const Chip = forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      children,
      variant = "filled",
      selected = false,
      leftIcon,
      showCheckmark = true,
      badge,
      onClick,
      disabled = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const isInteractive = !!onClick && !disabled;
    const showBadge = badge !== undefined && badge > 0;

    const chipClasses = [
      baseStyles,
      variantStyles[variant][selected ? "selected" : "default"],
      isInteractive ? interactiveStyles : "",
      disabled ? disabledStyles : "",
      className,
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return (
      <div
        ref={ref}
        role={onClick ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? onClick : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        className={chipClasses}
        aria-pressed={onClick ? selected : undefined}
        aria-disabled={disabled}
        {...props}
      >
        {/* Left Icon */}
        {leftIcon && (
          <span className="shrink-0 size-5 flex items-center justify-center">
            {leftIcon}
          </span>
        )}

        {/* Badge (before text) */}
        {showBadge && (
          <span className="shrink-0 min-w-4 h-4 px-1 flex items-center justify-center bg-[var(--color-brand-primary)] text-white text-xs font-medium rounded-full">
            {badge > 99 ? "99+" : badge}
          </span>
        )}

        {/* Text */}
        <span className="flex-1 text-center whitespace-nowrap">{children}</span>

        {/* Checkmark (when selected) */}
        {selected && showCheckmark && (
          <span className="shrink-0 size-5 flex items-center justify-center">
            <CheckIcon />
          </span>
        )}
      </div>
    );
  }
);

Chip.displayName = "Chip";

// ============================================
// CHIP GROUP (for managing multiple chips)
// ============================================

export interface ChipGroupProps {
  /** Chip group items */
  children: ReactNode;
  /** Additional class names */
  className?: string;
  /** Gap between chips */
  gap?: "sm" | "md";
}

export const ChipGroup = forwardRef<HTMLDivElement, ChipGroupProps>(
  ({ children, className = "", gap = "sm" }, ref) => {
    const gapStyles = {
      sm: "gap-2",
      md: "gap-3",
    };

    return (
      <div
        ref={ref}
        className={`flex flex-wrap items-center ${gapStyles[gap]} ${className}`}
        role="group"
      >
        {children}
      </div>
    );
  }
);

ChipGroup.displayName = "ChipGroup";

// ============================================
// REMOVABLE CHIP
// ============================================

export interface RemovableChipProps extends Omit<ChipProps, "showCheckmark" | "selected"> {
  /** Called when remove button is clicked */
  onRemove?: () => void;
}

export const RemovableChip = forwardRef<HTMLDivElement, RemovableChipProps>(
  ({ children, variant = "filled", leftIcon, onRemove, disabled, className = "", ...props }, ref) => {
    const isInteractive = !disabled;

    const chipClasses = [
      baseStyles,
      variantStyles[variant].default,
      disabled ? disabledStyles : "",
      className,
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return (
      <div ref={ref} className={chipClasses} {...props}>
        {/* Left Icon */}
        {leftIcon && (
          <span className="shrink-0 size-5 flex items-center justify-center">
            {leftIcon}
          </span>
        )}

        {/* Text */}
        <span className="flex-1 text-center whitespace-nowrap">{children}</span>

        {/* Remove Button */}
        {onRemove && (
          <button
            type="button"
            onClick={isInteractive ? onRemove : undefined}
            disabled={disabled}
            className="shrink-0 size-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors disabled:hover:bg-transparent"
            aria-label="Remove"
          >
            <CloseIcon className="size-4" />
          </button>
        )}
      </div>
    );
  }
);

RemovableChip.displayName = "RemovableChip";

// ============================================
// EXPORTS
// ============================================

export default Chip;
export { CheckIcon, CloseIcon };
