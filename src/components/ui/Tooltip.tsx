"use client";

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
  cloneElement,
  isValidElement,
  ReactElement,
} from "react";
import { createPortal } from "react-dom";

// ============================================
// TYPES
// ============================================

export type TooltipPosition = "top" | "bottom" | "left" | "right";
export type TooltipAlign = "start" | "center" | "end";

export interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Trigger element */
  children: ReactElement;
  /** Position of tooltip relative to trigger */
  position?: TooltipPosition;
  /** Alignment of tooltip */
  align?: TooltipAlign;
  /** Delay before showing (ms) */
  delayShow?: number;
  /** Delay before hiding (ms) */
  delayHide?: number;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** Additional class for tooltip */
  className?: string;
}

export interface TooltipContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Tooltip text or content */
  children: ReactNode;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
  /** Position for arrow */
  arrowPosition?: TooltipPosition;
  /** Arrow alignment */
  arrowAlign?: TooltipAlign;
}

// ============================================
// ARROW COMPONENT
// ============================================

const TooltipArrow = ({
  position,
  align,
}: {
  position: TooltipPosition;
  align: TooltipAlign;
}) => {
  // For top/bottom - use horizontal alignment
  // For left/right - use vertical alignment
  const getArrowClasses = () => {
    switch (position) {
      case "top":
        // Arrow points down (tooltip is above trigger)
        const topAlignClass = {
          start: "left-3",
          center: "left-1/2 -translate-x-1/2",
          end: "right-3",
        }[align];
        return `absolute -bottom-[5px] ${topAlignClass}`;
      
      case "bottom":
        // Arrow points up (tooltip is below trigger)
        const bottomAlignClass = {
          start: "left-3",
          center: "left-1/2 -translate-x-1/2",
          end: "right-3",
        }[align];
        return `absolute -top-[5px] ${bottomAlignClass} rotate-180`;
      
      case "left":
        // Arrow points right (tooltip is to the left of trigger)
        const leftAlignClass = {
          start: "top-2",
          center: "top-1/2 -translate-y-1/2",
          end: "bottom-2",
        }[align];
        return `absolute -right-[5px] ${leftAlignClass} -rotate-90`;
      
      case "right":
        // Arrow points left (tooltip is to the right of trigger)
        const rightAlignClass = {
          start: "top-2",
          center: "top-1/2 -translate-y-1/2",
          end: "bottom-2",
        }[align];
        return `absolute -left-[5px] ${rightAlignClass} rotate-90`;
      
      default:
        return "";
    }
  };

  return (
    <div className={getArrowClasses()}>
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 6L0 0H10L5 6Z"
          fill="var(--color-base-primary)"
        />
      </svg>
    </div>
  );
};

// ============================================
// TOOLTIP CONTENT
// ============================================

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      children,
      leftIcon,
      rightIcon,
      arrowPosition = "top",
      arrowAlign = "center",
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          relative
          inline-flex
          items-center
          gap-1
          px-2
          py-1
          rounded
          bg-[var(--color-base-primary)]
          text-[var(--color-base-surface-primary)]
          text-xs
          leading-5
          whitespace-nowrap
          shadow-lg
          ${className}
        `.replace(/\s+/g, " ").trim()}
        {...props}
      >
        {leftIcon && (
          <span className="shrink-0 size-4 flex items-center justify-center text-[var(--color-base-surface-primary)]">
            {leftIcon}
          </span>
        )}
        <span className="min-w-[40px] text-center">{children}</span>
        {rightIcon && (
          <span className="shrink-0 size-4 flex items-center justify-center text-[var(--color-base-surface-primary)]">
            {rightIcon}
          </span>
        )}
        <TooltipArrow position={arrowPosition} align={arrowAlign} />
      </div>
    );
  }
);

TooltipContent.displayName = "TooltipContent";

// ============================================
// TOOLTIP COMPONENT
// ============================================

export const Tooltip = ({
  content,
  children,
  position = "top",
  align = "center",
  delayShow = 200,
  delayHide = 0,
  disabled = false,
  className = "",
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    // Calculate position based on placement
    switch (position) {
      case "top":
        top = triggerRect.top - tooltipRect.height - gap;
        break;
      case "bottom":
        top = triggerRect.bottom + gap;
        break;
      case "left":
        left = triggerRect.left - tooltipRect.width - gap;
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        break;
      case "right":
        left = triggerRect.right + gap;
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        break;
    }

    // Calculate alignment for top/bottom
    if (position === "top" || position === "bottom") {
      switch (align) {
        case "start":
          left = triggerRect.left;
          break;
        case "center":
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case "end":
          left = triggerRect.right - tooltipRect.width;
          break;
      }
    }

    // Calculate alignment for left/right
    if (position === "left" || position === "right") {
      switch (align) {
        case "start":
          top = triggerRect.top;
          break;
        case "center":
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          break;
        case "end":
          top = triggerRect.bottom - tooltipRect.height;
          break;
      }
    }

    setCoords({ top, left });
    setIsPositioned(true);
  }, [position, align]);

  // Calculate position after tooltip is rendered
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        calculatePosition();
      });
    } else {
      setIsPositioned(false);
    }
  }, [isVisible, calculatePosition]);

  const showTooltip = () => {
    if (disabled) return;
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  };

  const hideTooltip = () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, delayHide);
  };

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Clone child with ref and event handlers
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ ref?: React.Ref<HTMLElement>; onMouseEnter?: () => void; onMouseLeave?: () => void; onFocus?: () => void; onBlur?: () => void }>, {
        ref: triggerRef,
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
      })
    : children;

  // Get arrow position (opposite of tooltip position)
  const getArrowPosition = (): TooltipPosition => {
    switch (position) {
      case "top":
        return "top";
      case "bottom":
        return "bottom";
      case "left":
        return "left";
      case "right":
        return "right";
      default:
        return "top";
    }
  };

  const tooltipElement = isVisible && mounted && (
    createPortal(
      <div
        ref={tooltipRef}
        className={`
          fixed
          z-[9999]
          pointer-events-none
          transition-opacity
          duration-150
          ${isPositioned ? "opacity-100" : "opacity-0"}
          ${className}
        `.replace(/\s+/g, " ").trim()}
        style={{
          top: coords.top,
          left: coords.left,
        }}
      >
        {typeof content === "string" ? (
          <TooltipContent arrowPosition={getArrowPosition()} arrowAlign={align}>
            {content}
          </TooltipContent>
        ) : (
          content
        )}
      </div>,
      document.body
    )
  );

  return (
    <>
      {trigger}
      {tooltipElement}
    </>
  );
};

Tooltip.displayName = "Tooltip";

// ============================================
// SIMPLE TOOLTIP (Static, non-portal version)
// ============================================

export interface SimpleTooltipProps extends HTMLAttributes<HTMLDivElement> {
  /** Tooltip text */
  text: string;
  /** Position of arrow */
  position?: "top" | "bottom";
  /** Alignment of arrow */
  align?: TooltipAlign;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
}

export const SimpleTooltip = forwardRef<HTMLDivElement, SimpleTooltipProps>(
  (
    {
      text,
      position = "top",
      align = "center",
      leftIcon,
      rightIcon,
      className = "",
      ...props
    },
    ref
  ) => {
    // Arrow alignment classes
    const getArrowAlignClass = () => {
      switch (align) {
        case "start":
          return "left-3";
        case "center":
          return "left-1/2 -translate-x-1/2";
        case "end":
          return "right-3";
      }
    };

    return (
      <div
        ref={ref}
        className={`inline-flex flex-col items-center ${className}`}
        {...props}
      >
        {/* Arrow top */}
        {position === "bottom" && (
          <div className={`relative w-full h-[6px]`}>
            <div className={`absolute ${getArrowAlignClass()}`}>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 0L10 6H0L5 0Z"
                  fill="var(--color-base-primary)"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Body */}
        <div
          className="
            inline-flex
            items-center
            gap-1
            px-2
            py-1
            rounded
            bg-[var(--color-base-primary)]
            text-[var(--color-base-surface-primary)]
            text-xs
            leading-5
            whitespace-nowrap
          "
        >
          {leftIcon && (
            <span className="shrink-0 size-4 flex items-center justify-center text-[var(--color-base-surface-primary)]">
              {leftIcon}
            </span>
          )}
          <span className="min-w-[40px] text-center">{text}</span>
          {rightIcon && (
            <span className="shrink-0 size-4 flex items-center justify-center text-[var(--color-base-surface-primary)]">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Arrow bottom */}
        {position === "top" && (
          <div className={`relative w-full h-[6px]`}>
            <div className={`absolute ${getArrowAlignClass()}`}>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 6L0 0H10L5 6Z"
                  fill="var(--color-base-primary)"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }
);

SimpleTooltip.displayName = "SimpleTooltip";

// ============================================
// EXPORTS
// ============================================

export default Tooltip;
