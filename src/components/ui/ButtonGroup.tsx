"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode, Children, cloneElement, isValidElement } from "react";

// ============================================
// TYPES
// ============================================

export interface ButtonGroupItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon element to display */
  icon: ReactNode;
  /** Position in group (set automatically) */
  position?: "first" | "middle" | "last" | "only";
  /** Aria label for accessibility */
  "aria-label": string;
}

export interface ButtonGroupProps {
  /** Button group items */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

// ============================================
// STYLES
// ============================================

const baseItemStyles = `
  relative
  inline-flex
  items-center
  justify-center
  size-8
  bg-[var(--color-base-surface-primary)]
  border
  border-[var(--color-base-stroke)]
  -mr-px
  transition-all
  duration-200
  ease-out
  outline-none
  cursor-pointer
  hover:z-10
  hover:border-[var(--color-base-tertiary)]
  hover:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]
  active:scale-95
  disabled:cursor-not-allowed
  disabled:opacity-50
  disabled:hover:shadow-none
  focus-visible:z-10
  focus-visible:ring-2
  focus-visible:ring-[var(--color-base-stroke)]
`;

const positionStyles = {
  first: "rounded-l-lg",
  middle: "rounded-none",
  last: "rounded-r-lg mr-0",
  only: "rounded-lg mr-0",
};

// ============================================
// BUTTON GROUP ITEM
// ============================================

export const ButtonGroupItem = forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ icon, position = "middle", className = "", ...props }, ref) => {
    const buttonClasses = [
      baseItemStyles,
      positionStyles[position],
      className,
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return (
      <button ref={ref} className={buttonClasses} {...props}>
        <span className="size-5 flex items-center justify-center text-[var(--color-base-primary)]">
          {icon}
        </span>
      </button>
    );
  }
);

ButtonGroupItem.displayName = "ButtonGroupItem";

// ============================================
// BUTTON GROUP
// ============================================

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ children, className = "" }, ref) => {
    const childArray = Children.toArray(children).filter(isValidElement);
    const count = childArray.length;

    const getPosition = (index: number): "first" | "middle" | "last" | "only" => {
      if (count === 1) return "only";
      if (index === 0) return "first";
      if (index === count - 1) return "last";
      return "middle";
    };

    return (
      <div
        ref={ref}
        className={`inline-flex items-center ${className}`}
        role="group"
      >
        {childArray.map((child, index) => {
          if (isValidElement<ButtonGroupItemProps>(child)) {
            return cloneElement(child, {
              position: getPosition(index),
            });
          }
          return child;
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";

// ============================================
// EXPORTS
// ============================================

export default ButtonGroup;
