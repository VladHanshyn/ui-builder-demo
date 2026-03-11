"use client";

import React, { useState, createContext, useContext, ReactNode, forwardRef } from "react";

// ============================================
// TYPES
// ============================================

interface SidebarContextValue {
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
  expandedItems: Set<string>;
  toggleExpanded: (id: string) => void;
  collapsed: boolean;
}

interface SidebarProps {
  children: ReactNode;
  defaultActiveItem?: string | null;
  collapsed?: boolean;
  className?: string;
}

interface SidebarGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

interface SidebarItemProps {
  id: string;
  icon?: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  children?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

interface SidebarSubmenuProps {
  children: ReactNode;
  className?: string;
}

interface SidebarSubmenuItemProps {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

interface SidebarFooterProps {
  children: ReactNode;
  className?: string;
}

interface SidebarBackLinkProps {
  icon?: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

// ============================================
// CONTEXT
// ============================================

const SidebarContext = createContext<SidebarContextValue | null>(null);

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar components must be used within a Sidebar");
  }
  return context;
};

// ============================================
// ICONS
// ============================================

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================
// SIDEBAR
// ============================================

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ children, defaultActiveItem = null, collapsed = false, className = "" }, ref) => {
    const [activeItem, setActiveItem] = useState<string | null>(defaultActiveItem);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleExpanded = (id: string) => {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    };

    return (
      <SidebarContext.Provider
        value={{ activeItem, setActiveItem, expandedItems, toggleExpanded, collapsed }}
      >
        <aside
          ref={ref}
          className={`
            flex flex-col h-full
            bg-[var(--color-base-surface-primary)]
            border-r border-[var(--color-base-stroke)]
            ${collapsed ? "w-[56px]" : "w-[280px]"}
            transition-[width] duration-200 ease-in-out
            ${className}
          `.replace(/\s+/g, " ").trim()}
        >
          {children}
        </aside>
      </SidebarContext.Provider>
    );
  }
);

Sidebar.displayName = "Sidebar";

// ============================================
// SIDEBAR GROUP
// ============================================

export const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ title, children, className = "" }, ref) => {
    const { collapsed } = useSidebar();

    return (
      <div
        ref={ref}
        className={`
          flex flex-col flex-1 min-h-0 p-2
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        {title && !collapsed && (
          <div className="px-2 py-1.5">
            <span className="text-label-normal text-[var(--color-base-secondary)]">
              {title}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-0.5 overflow-y-auto">
          {children}
        </div>
      </div>
    );
  }
);

SidebarGroup.displayName = "SidebarGroup";

// ============================================
// SIDEBAR ITEM
// ============================================

export const SidebarItem = forwardRef<HTMLDivElement, SidebarItemProps>(
  ({ id, icon, label, href, onClick, children, badge, className = "" }, ref) => {
    const { activeItem, setActiveItem, expandedItems, toggleExpanded, collapsed } = useSidebar();
    const isActive = activeItem === id;
    const hasChildren = Boolean(children);
    const isExpanded = expandedItems.has(id);

    const handleClick = () => {
      if (hasChildren) {
        toggleExpanded(id);
      }
      setActiveItem(id);
      onClick?.();
    };

    const Component = href ? "a" : "button";
    const componentProps = href ? { href } : { type: "button" as const };

    return (
      <div ref={ref} className={`flex flex-col ${className}`}>
        <Component
          {...componentProps}
          onClick={handleClick}
          className={`
            flex items-center gap-1 w-full pr-2 py-1 rounded-lg
            transition-colors duration-150
            ${isActive
              ? "bg-[var(--color-brand-primary)]/[0.08] text-[var(--color-brand-primary)]"
              : "text-[var(--color-base-primary)] hover:bg-[var(--color-brand-primary)]/[0.08]"
            }
            ${collapsed ? "justify-center px-3" : ""}
          `.replace(/\s+/g, " ").trim()}
        >
          {/* Icon */}
          {icon && (
            <div
              className={`
                flex items-center justify-center size-8 shrink-0
                ${isActive ? "text-[var(--color-brand-primary)]" : "text-[var(--color-base-secondary)]"}
              `.replace(/\s+/g, " ").trim()}
            >
              {icon}
            </div>
          )}

          {/* Label */}
          {!collapsed && (
            <span
              className={`
                flex-1 text-left text-paragraph-2
                ${isActive ? "font-medium" : "font-normal"}
              `.replace(/\s+/g, " ").trim()}
            >
              {label}
            </span>
          )}

          {/* Badge */}
          {badge && !collapsed && (
            <div className="shrink-0">{badge}</div>
          )}

          {/* Chevron for expandable items */}
          {hasChildren && !collapsed && (
            <div
              className={`
                shrink-0 text-[var(--color-base-secondary)]
                transition-transform duration-200
                ${isExpanded ? "rotate-180" : ""}
              `.replace(/\s+/g, " ").trim()}
            >
              <ChevronDownIcon />
            </div>
          )}
        </Component>

        {/* Submenu */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="flex flex-col">
            {children}
          </div>
        )}
      </div>
    );
  }
);

SidebarItem.displayName = "SidebarItem";

// ============================================
// SIDEBAR SUBMENU
// ============================================

export const SidebarSubmenu = forwardRef<HTMLDivElement, SidebarSubmenuProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          flex flex-col gap-2 pl-9 pr-2 py-2
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        {children}
      </div>
    );
  }
);

SidebarSubmenu.displayName = "SidebarSubmenu";

// ============================================
// SIDEBAR SUBMENU ITEM
// ============================================

export const SidebarSubmenuItem = forwardRef<HTMLButtonElement, SidebarSubmenuItemProps>(
  ({ id, label, href, onClick, className = "" }, ref) => {
    const { activeItem, setActiveItem } = useSidebar();
    const isActive = activeItem === id;

    const handleClick = () => {
      setActiveItem(id);
      onClick?.();
    };

    const Component = href ? "a" : "button";
    const componentProps = href ? { href } : { type: "button" as const };

    return (
      <Component
        ref={ref as React.Ref<HTMLButtonElement & HTMLAnchorElement>}
        {...componentProps}
        onClick={handleClick}
        className={`
          text-left text-paragraph-2
          transition-colors duration-150
          ${isActive
            ? "text-[var(--color-brand-primary)] font-medium"
            : "text-[var(--color-base-primary)] hover:text-[var(--color-brand-primary)]"
          }
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        {label}
      </Component>
    );
  }
);

SidebarSubmenuItem.displayName = "SidebarSubmenuItem";

// ============================================
// SIDEBAR FOOTER
// ============================================

export const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          mt-auto
          border-t border-[var(--color-base-stroke)]
          bg-[var(--color-base-surface-secondary)]
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        {children}
      </div>
    );
  }
);

SidebarFooter.displayName = "SidebarFooter";

// ============================================
// SIDEBAR BACK LINK
// ============================================

export const SidebarBackLink = forwardRef<HTMLButtonElement, SidebarBackLinkProps>(
  ({ icon, label, href, onClick, className = "" }, ref) => {
    const { collapsed } = useSidebar();

    const Component = href ? "a" : "button";
    const componentProps = href ? { href } : { type: "button" as const };

    return (
      <Component
        ref={ref as React.Ref<HTMLButtonElement & HTMLAnchorElement>}
        {...componentProps}
        onClick={onClick}
        className={`
          flex items-center gap-1 w-full px-2 py-1
          text-[var(--color-base-secondary)]
          hover:text-[var(--color-base-primary)]
          transition-colors duration-150
          ${collapsed ? "justify-center" : ""}
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        <div className="flex items-center justify-center size-8 shrink-0">
          {icon || <ArrowLeftIcon />}
        </div>
        {!collapsed && (
          <span className="text-paragraph-2">
            {label}
          </span>
        )}
      </Component>
    );
  }
);

SidebarBackLink.displayName = "SidebarBackLink";

// ============================================
// SIDEBAR DIVIDER
// ============================================

export const SidebarDivider = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          h-px mx-2 my-2
          bg-[var(--color-base-stroke)]
          ${className}
        `.replace(/\s+/g, " ").trim()}
      />
    );
  }
);

SidebarDivider.displayName = "SidebarDivider";

// ============================================
// SIDEBAR LOGO
// ============================================

interface SidebarLogoProps {
  logo: ReactNode;
  collapsedLogo?: ReactNode;
  className?: string;
}

export const SidebarLogo = forwardRef<HTMLDivElement, SidebarLogoProps>(
  ({ logo, collapsedLogo, className = "" }, ref) => {
    const { collapsed } = useSidebar();

    return (
      <div
        ref={ref}
        className={`
          flex items-center px-4 py-4
          ${collapsed ? "justify-center" : ""}
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        {collapsed ? (collapsedLogo || logo) : logo}
      </div>
    );
  }
);

SidebarLogo.displayName = "SidebarLogo";
