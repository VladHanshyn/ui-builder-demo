"use client";

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";

// ============================================
// TYPES
// ============================================

export type NotificationVariant =
  | "success"
  | "success-blue"
  | "deleted"
  | "rejected"
  | "info"
  | "ban"
  | "warning";

export interface NotificationProps extends HTMLAttributes<HTMLDivElement> {
  /** Notification title (required) */
  title: string;
  /** Optional description text */
  description?: string;
  /** Notification variant/type */
  variant?: NotificationVariant;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close button click handler */
  onClose?: () => void;
  /** Show undo button */
  showUndo?: boolean;
  /** Undo button click handler */
  onUndo?: () => void;
  /** Custom undo button text */
  undoText?: string;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Auto-dismiss after duration (ms). Set to 0 to disable. Default: 5000 */
  autoDismiss?: number;
  /** Custom left icon */
  icon?: ReactNode;
  /** Hide the default left icon */
  hideIcon?: boolean;
}

// ============================================
// VARIANT CONFIGURATIONS
// ============================================

interface VariantConfig {
  iconBg: string;
  iconColor: string;
  icon: ReactNode;
}

const CheckIconSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.333 8.666L6 11.333L12.666 4.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIconSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2.666 4.666H13.333M6.666 7.333V11.333M9.333 7.333V11.333M3.333 4.666L4 12.666C4 13.55 4.716 14 5.6 14H10.4C11.284 14 12 13.55 12 12.666L12.666 4.666M6 4.666V2.666C6 2.298 6.298 2 6.666 2H9.333C9.701 2 10 2.298 10 2.666V4.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIconSvg = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 4L12 12M4 12L12 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InfoIconSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 7.2V11.2M8 5.2V5.6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const BanIconSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M3.757 12.243L12.243 3.757"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const WarningIconSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 5.6V8.4M8 10.4V10.8M2.8 14H13.2L8 2.8L2.8 14Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExclamationIconSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 4.8V8.8M8 10.8V11.2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const variantConfigs: Record<NotificationVariant, VariantConfig> = {
  success: {
    iconBg: "bg-[rgba(75,183,58,0.15)]",
    iconColor: "text-[#4BB73A]",
    icon: <CheckIconSvg />,
  },
  "success-blue": {
    iconBg: "bg-[rgba(84,102,255,0.15)]",
    iconColor: "text-[#5466FF]",
    icon: <CheckIconSvg />,
  },
  deleted: {
    iconBg: "bg-[rgba(255,62,20,0.1)]",
    iconColor: "text-[#FF3E14]",
    icon: <TrashIconSvg />,
  },
  rejected: {
    iconBg: "bg-[rgba(255,62,20,0.1)]",
    iconColor: "text-[#FF3E14]",
    icon: <CloseIconSvg />,
  },
  info: {
    iconBg: "bg-[rgba(84,102,255,0.15)]",
    iconColor: "text-[#5466FF]",
    icon: <InfoIconSvg />,
  },
  ban: {
    iconBg: "bg-[rgba(255,62,20,0.1)]",
    iconColor: "text-[#FF3E14]",
    icon: <BanIconSvg />,
  },
  warning: {
    iconBg: "bg-[rgba(230,185,4,0.15)]",
    iconColor: "text-[#E6B904]",
    icon: <WarningIconSvg />,
  },
};

// ============================================
// STYLES
// ============================================

const containerStyles = `
  flex
  flex-col
  items-start
  w-[292px]
  px-4
  py-3
  bg-[var(--color-base-primary)]
  rounded-lg
  shadow-[0_8px_24px_-4px_rgba(0,0,0,0.25),0_4px_8px_-4px_rgba(0,0,0,0.15)]
`;

const titleStyles = `
  font-medium
  text-sm
  leading-6
  text-[var(--color-base-surface-primary)]
  overflow-hidden
  text-ellipsis
`;

const descriptionStyles = `
  font-normal
  text-sm
  leading-5
  text-[var(--color-base-secondary)]
`;

const undoButtonStyles = `
  font-medium
  text-sm
  leading-5
  text-[var(--color-brand-primary)]
  cursor-pointer
  hover:opacity-80
  transition-opacity
`;

const closeButtonStyles = `
  flex
  items-center
  justify-center
  size-5
  text-[var(--color-base-secondary)]
  cursor-pointer
  hover:text-[var(--color-base-tertiary)]
  transition-colors
`;

const primaryButtonStyles = `
  flex
  items-center
  justify-center
  px-4
  py-1
  bg-[var(--color-brand-primary)]
  text-white
  font-medium
  text-sm
  leading-6
  rounded-lg
  cursor-pointer
  hover:opacity-90
  active:scale-[0.98]
  transition-all
`;

const secondaryButtonStyles = `
  flex
  items-center
  justify-center
  px-4
  py-1
  border
  border-[var(--color-base-secondary)]
  text-[var(--color-base-surface-primary)]
  font-medium
  text-sm
  leading-6
  rounded-lg
  cursor-pointer
  hover:bg-white/5
  active:scale-[0.98]
  transition-all
`;

// ============================================
// COMPONENT
// ============================================

export const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      title,
      description,
      variant = "success",
      showCloseButton = false,
      onClose,
      showUndo = false,
      onUndo,
      undoText = "Undo",
      primaryAction,
      secondaryAction,
      autoDismiss = 5000,
      icon,
      hideIcon = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);
    const config = variantConfigs[variant];
    const hasButtons = primaryAction || secondaryAction;

    // Auto-dismiss functionality
    useEffect(() => {
      if (autoDismiss > 0 && !hasButtons) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, autoDismiss);
        return () => clearTimeout(timer);
      }
    }, [autoDismiss, hasButtons, onClose]);

    const handleClose = useCallback(() => {
      setIsVisible(false);
      onClose?.();
    }, [onClose]);

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={`
          ${containerStyles}
          animate-in
          slide-in-from-right-full
          fade-in
          duration-300
          ${className}
        `.replace(/\s+/g, " ").trim()}
        {...props}
      >
        {/* Main Content Row */}
        <div className="flex items-start w-full">
          {/* Left Icon + Text Content */}
          <div className="flex flex-1 gap-2 items-start min-w-0">
            {/* Left Icon */}
            {!hideIcon && (
              <div
                className={`
                  shrink-0
                  flex
                  items-center
                  justify-center
                  size-6
                  rounded-full
                  ${config.iconBg}
                  ${config.iconColor}
                `.replace(/\s+/g, " ").trim()}
              >
                {icon || config.icon}
              </div>
            )}

            {/* Text Content */}
            <div className={`flex flex-col flex-1 min-w-0 ${description ? "gap-1" : ""} pt-0.5`}>
              {/* Title */}
              <p className={titleStyles.replace(/\s+/g, " ").trim()}>
                {title}
              </p>

              {/* Description */}
              {description && (
                <p className={descriptionStyles.replace(/\s+/g, " ").trim()}>
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right Actions (Undo + Close) */}
          <div className="flex items-start gap-1 shrink-0">
            {showUndo && (
              <button
                type="button"
                onClick={onUndo}
                className={undoButtonStyles.replace(/\s+/g, " ").trim()}
              >
                {undoText}
              </button>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                className={closeButtonStyles.replace(/\s+/g, " ").trim()}
                aria-label="Close notification"
              >
                <CloseIconSvg size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        {hasButtons && (
          <div className={`flex items-center gap-2 pt-3 ${!hideIcon ? "pl-8" : ""}`}>
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className={primaryButtonStyles.replace(/\s+/g, " ").trim()}
              >
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className={secondaryButtonStyles.replace(/\s+/g, " ").trim()}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

Notification.displayName = "Notification";

// ============================================
// NOTIFICATION CONTAINER (for stacking multiple notifications)
// ============================================

export interface NotificationContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Position of the container */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  /** Gap between notifications */
  gap?: "sm" | "md" | "lg";
  children: ReactNode;
}

const positionStyles = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

const gapStyles = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
};

export const NotificationContainer = forwardRef<HTMLDivElement, NotificationContainerProps>(
  ({ position = "top-right", gap = "md", children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          fixed
          z-50
          flex
          flex-col
          ${positionStyles[position]}
          ${gapStyles[gap]}
          ${className}
        `.replace(/\s+/g, " ").trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NotificationContainer.displayName = "NotificationContainer";

// ============================================
// EXPORTS
// ============================================

export default Notification;
