"use client";

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useState,
} from "react";

// ============================================
// TYPES
// ============================================

export type ListSize = "sm" | "lg";

export interface ListItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Main title text */
  title: string;
  /** Optional description text (subtitle) */
  description?: string;
  /** Size variant */
  size?: ListSize;
  /** Left content (checkbox, icons, avatar) */
  leftContent?: ReactNode;
  /** Right content (badges, icons, action buttons) */
  rightContent?: ReactNode;
  /** Whether the item is selected */
  selected?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether to show bottom border */
  showBorder?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Hover state styling */
  hoverable?: boolean;
}

export interface ListProps extends HTMLAttributes<HTMLDivElement> {
  /** List items */
  children: ReactNode;
  /** List size variant (applies to all items unless overridden) */
  size?: ListSize;
  /** Whether to show dividers between items */
  showDividers?: boolean;
}

// ============================================
// ICONS (internal)
// ============================================

const LinkIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8.333 11.667L11.667 8.333M7.5 12.5L5.833 14.167C4.912 15.088 3.421 15.088 2.5 14.167C1.579 13.246 1.579 11.755 2.5 10.833L4.167 9.167M12.5 7.5L14.167 5.833C15.088 4.912 15.088 3.421 14.167 2.5C13.246 1.579 11.755 1.579 10.833 2.5L9.167 4.167"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DragIcon = ({ className }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M5 4H11M5 8H11M5 12H11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// ============================================
// HELPER COMPONENTS
// ============================================

/** List Item Checkbox - for selection in lists */
export const ListCheckbox = ({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  // Support both controlled and uncontrolled modes
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent ListItem onClick
    const newValue = !isChecked;
    
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleClick}
      className={`
        shrink-0 size-4 rounded border transition-colors duration-150
        flex items-center justify-center
        ${isChecked
          ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]"
          : "bg-[var(--color-base-surface-primary)] border-[var(--color-base-stroke)]"
        }
        ${disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:border-[var(--color-brand-primary)]"
        }
      `.replace(/\s+/g, " ").trim()}
    >
      {isChecked && (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};

/** List Item Avatar - for user representation */
export const ListAvatar = ({
  src,
  alt = "",
  name,
  size = "sm",
}: {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "lg";
}) => {
  const sizeClasses = size === "sm" ? "size-5" : "size-8";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`
        ${sizeClasses}
        rounded-full overflow-hidden shrink-0
        bg-[var(--color-base-stroke)]
        flex items-center justify-center
        text-[10px] font-medium text-[var(--color-base-secondary)]
      `.replace(/\s+/g, " ").trim()}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : name ? (
        <span>{getInitials(name)}</span>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="10" cy="6.666" r="3.333" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3.333 17.5C3.333 14.278 6.318 11.666 10 11.666C13.682 11.666 16.666 14.278 16.666 17.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
};

/** List Item Icon - wrapper for icons in lists */
export const ListIcon = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`
        shrink-0 size-5 flex items-center justify-center
        text-[var(--color-base-primary)]
        ${className}
      `.replace(/\s+/g, " ").trim()}
    >
      {children}
    </div>
  );
};

/** List Item Icon Group - for multiple icons */
export const ListIconGroup = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`
        flex items-center gap-1 shrink-0
        ${className}
      `.replace(/\s+/g, " ").trim()}
    >
      {children}
    </div>
  );
};

/** List Item Badge - for labels/tags */
export const ListBadge = ({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}) => {
  const variantClasses = {
    default: "bg-[var(--color-base-stroke)] text-[var(--color-base-secondary)]",
    success: "bg-[var(--color-status-success-secondary)] text-[var(--color-status-success-primary)]",
    warning: "bg-[var(--color-status-warning-secondary)] text-[var(--color-status-warning-primary)]",
    error: "bg-[var(--color-status-danger-secondary)] text-[var(--color-status-danger-primary)]",
    info: "bg-[var(--color-status-info-secondary)] text-[var(--color-status-info-primary)]",
  };

  return (
    <span
      className={`
        shrink-0 px-1 rounded
        text-paragraph-3 leading-5
        ${variantClasses[variant]}
      `.replace(/\s+/g, " ").trim()}
    >
      {children}
    </span>
  );
};

/** List Item Value - for displaying values with icons */
export const ListValue = ({
  value,
  icon,
}: {
  value: string | number;
  icon?: ReactNode;
}) => {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {icon && (
        <div className="size-5 flex items-center justify-center text-[var(--color-base-secondary)]">
          {icon}
        </div>
      )}
      <span className="text-paragraph-2 text-[var(--color-base-primary)]">
        {value}
      </span>
    </div>
  );
};

/** List Action Button - for action buttons in list items */
export const ListActionButton = ({
  icon,
  onClick,
  disabled = false,
  label,
}: {
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      aria-label={label}
      className={`
        shrink-0 size-8 rounded-lg
        flex items-center justify-center
        bg-[var(--color-base-surface-primary)]
        border border-[var(--color-base-stroke)]
        text-[var(--color-base-primary)]
        transition-colors duration-150
        ${disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-[var(--color-base-surface-secondary)] cursor-pointer"
        }
      `.replace(/\s+/g, " ").trim()}
    >
      <div className="size-5 flex items-center justify-center">
        {icon}
      </div>
    </button>
  );
};

/** List Action Group - wrapper for action buttons */
export const ListActionGroup = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`
        flex items-center gap-1 shrink-0
        ${className}
      `.replace(/\s+/g, " ").trim()}
    >
      {children}
    </div>
  );
};

// ============================================
// LIST ITEM COMPONENT
// ============================================

export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      title,
      description,
      size = "sm",
      leftContent,
      rightContent,
      selected = false,
      disabled = false,
      showBorder = true,
      onClick,
      hoverable = true,
      className = "",
      ...props
    },
    ref
  ) => {
    // Size configurations
    const sizeConfig = {
      sm: {
        height: description ? "h-auto min-h-9" : "h-9",
        padding: "px-3 py-2",
        avatar: "size-5",
      },
      lg: {
        height: description ? "h-auto min-h-12" : "h-12",
        padding: "px-3 py-2",
        avatar: "size-8",
      },
    };

    const isClickable = !!onClick;

    return (
      <div
        ref={ref}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable && !disabled ? 0 : undefined}
        onClick={!disabled ? onClick : undefined}
        onKeyDown={(e) => {
          if (isClickable && !disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick?.();
          }
        }}
        className={`
          flex items-center gap-2
          bg-[var(--color-base-surface-primary)]
          ${sizeConfig[size].height}
          ${sizeConfig[size].padding}
          ${showBorder ? "border-b border-[var(--color-base-surface-secondary)]" : ""}
          ${selected ? "bg-[var(--color-brand-secondary)]" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${isClickable && !disabled && hoverable ? "cursor-pointer hover:bg-[var(--color-base-surface-secondary)]" : ""}
          transition-colors duration-150
          ${className}
        `.replace(/\s+/g, " ").trim()}
        {...props}
      >
        {/* Left Content */}
        {leftContent && (
          <div className="flex items-center gap-2 shrink-0">
            {leftContent}
          </div>
        )}

        {/* Main Text Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p
            className={`
              text-paragraph-2 text-[var(--color-base-primary)]
              truncate leading-5
            `.replace(/\s+/g, " ").trim()}
          >
            {title}
          </p>
          {description && (
            <p
              className={`
                text-paragraph-3 text-[var(--color-base-secondary)]
                truncate leading-5
              `.replace(/\s+/g, " ").trim()}
            >
              {description}
            </p>
          )}
        </div>

        {/* Right Content */}
        {rightContent && (
          <div className="flex items-center gap-1 shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    );
  }
);

ListItem.displayName = "ListItem";

// ============================================
// LIST COMPONENT
// ============================================

export const List = forwardRef<HTMLDivElement, ListProps>(
  (
    {
      children,
      size = "sm",
      showDividers = true,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="list"
        className={`
          flex flex-col w-full
          bg-[var(--color-base-surface-primary)]
          ${className}
        `.replace(/\s+/g, " ").trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

List.displayName = "List";

// ============================================
// EXPORTS
// ============================================

export {
  LinkIcon as ListLinkIcon,
  DragIcon as ListDragIcon,
};
