"use client";

import { forwardRef, HTMLAttributes, ReactNode, ImgHTMLAttributes } from "react";

// ============================================
// TYPES
// ============================================

export type AvatarSize = "xs" | "sm" | "md" | "lg";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** User's name (used for initials fallback) */
  name?: string;
  /** Avatar size: xs=20px, sm=24px, md=32px, lg=40px */
  size?: AvatarSize;
  /** Custom fallback content */
  fallback?: ReactNode;
  /** Whether to show the white ring border */
  showRing?: boolean;
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Avatar elements */
  children: ReactNode;
  /** Maximum avatars to show before +N */
  max?: number;
  /** Avatar size */
  size?: AvatarSize;
}

// ============================================
// HELPERS
// ============================================

const sizeConfig = {
  xs: {
    container: "size-5",      // 20px
    text: "text-[8px]",
    icon: "size-3",
    overlap: "-ml-1",         // -4px
    ring: "ring-[1.5px]",
  },
  sm: {
    container: "size-6",      // 24px
    text: "text-[10px]",
    icon: "size-3.5",
    overlap: "-ml-1.5",       // -6px
    ring: "ring-[1.5px]",
  },
  md: {
    container: "size-8",      // 32px
    text: "text-xs",
    icon: "size-4",
    overlap: "-ml-2",         // -8px
    ring: "ring-2",
  },
  lg: {
    container: "size-10",     // 40px
    text: "text-sm",
    icon: "size-5",
    overlap: "-ml-3",         // -12px
    ring: "ring-2",
  },
};

/** Get initials from a name */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ============================================
// USER ICON (FALLBACK)
// ============================================

const UserIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M4 17C4 14.239 6.686 12 10 12C13.314 12 16 14.239 16 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// ============================================
// AVATAR IMAGE
// ============================================

interface AvatarImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: "loading" | "loaded" | "error") => void;
}

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ src, alt, onLoadingStatusChange, className, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={`size-full object-cover ${className || ""}`}
        onLoad={() => onLoadingStatusChange?.("loaded")}
        onError={() => onLoadingStatusChange?.("error")}
        {...props}
      />
    );
  }
);

AvatarImage.displayName = "AvatarImage";

// ============================================
// AVATAR COMPONENT
// ============================================

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = "",
      name,
      size = "md",
      fallback,
      showRing = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const config = sizeConfig[size];
    
    // Determine what to show
    const renderContent = () => {
      // If we have a valid image source, show it
      if (src) {
        return (
          <AvatarImage
            src={src}
            alt={alt || name || "Avatar"}
          />
        );
      }
      
      // If we have a name, show initials
      if (name) {
        return (
          <span className={`font-medium text-white ${config.text}`}>
            {getInitials(name)}
          </span>
        );
      }
      
      // If we have a custom fallback, show it
      if (fallback) {
        return fallback;
      }
      
      // Default: show user icon
      return <UserIcon className={`${config.icon} text-white`} />;
    };

    return (
      <div
        ref={ref}
        className={`
          relative
          inline-flex
          items-center
          justify-center
          shrink-0
          rounded-full
          overflow-hidden
          bg-[var(--color-base-tertiary)]
          ${config.container}
          ${showRing ? `ring-white ${config.ring}` : ""}
          ${className}
        `.replace(/\s+/g, " ").trim()}
        {...props}
      >
        {renderContent()}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

// ============================================
// AVATAR GROUP COMPONENT
// ============================================

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      children,
      max,
      size = "md",
      className = "",
      ...props
    },
    ref
  ) => {
    const config = sizeConfig[size];
    
    // Convert children to array
    const childArray = Array.isArray(children) 
      ? children.filter(Boolean) 
      : [children].filter(Boolean);
    
    // Determine how many to show
    const visibleChildren = max && childArray.length > max 
      ? childArray.slice(0, max) 
      : childArray;
    
    const remainingCount = max && childArray.length > max 
      ? childArray.length - max 
      : 0;

    return (
      <div
        ref={ref}
        className={`flex items-center ${className}`}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            className={index > 0 ? config.overlap : ""}
            style={{ zIndex: visibleChildren.length - index }}
          >
            {child}
          </div>
        ))}
        
        {/* +N indicator */}
        {remainingCount > 0 && (
          <div
            className={config.overlap}
            style={{ zIndex: 0 }}
          >
            <div
              className={`
                inline-flex
                items-center
                justify-center
                shrink-0
                rounded-full
                bg-[var(--color-base-surface-secondary)]
                border-2
                border-white
                ${config.container}
              `.replace(/\s+/g, " ").trim()}
            >
              <span className={`font-medium text-[var(--color-base-secondary)] ${config.text}`}>
                +{remainingCount}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = "AvatarGroup";

// ============================================
// EXPORTS
// ============================================

export default Avatar;
