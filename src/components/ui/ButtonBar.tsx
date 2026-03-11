"use client";

import { forwardRef, ReactNode } from "react";
import { IconButton, IconButtonProps } from "./IconButton";

// ============================================
// TYPES
// ============================================

export interface ButtonBarProps {
  /** Button bar items */
  children: ReactNode;
  /** Additional class names */
  className?: string;
  /** Gap between buttons */
  gap?: "sm" | "md";
}

// ============================================
// COMPONENT
// ============================================

export const ButtonBar = forwardRef<HTMLDivElement, ButtonBarProps>(
  ({ children, className = "", gap = "sm" }, ref) => {
    const gapStyles = {
      sm: "gap-1",
      md: "gap-2",
    };

    return (
      <div
        ref={ref}
        className={`inline-flex items-center ${gapStyles[gap]} ${className}`}
        role="group"
      >
        {children}
      </div>
    );
  }
);

ButtonBar.displayName = "ButtonBar";

// ============================================
// CONVENIENCE: BUTTON BAR ITEM (re-export IconButton)
// ============================================

export const ButtonBarItem = IconButton;
export type ButtonBarItemProps = IconButtonProps;

// ============================================
// EXPORTS
// ============================================

export default ButtonBar;
