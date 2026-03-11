"use client";

import React, { ReactNode, useEffect, useCallback, forwardRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

// ============================================
// TYPES
// ============================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "lg";
  className?: string;
}

export interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center" | "between";
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  size?: "sm" | "lg";
  children?: ReactNode;
}

export interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
}

// ============================================
// MODAL BASE COMPONENT
// ============================================

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, children, size = "lg", className = "" }, ref) => {
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Handle escape key
    const handleEscape = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      },
      [onClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [isOpen, handleEscape]);

    if (!mounted || !isOpen) return null;

    const sizeClasses = {
      sm: "max-w-[200px] rounded-lg p-4 gap-4",
      lg: "max-w-[400px] rounded-2xl",
    };

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/20"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          ref={ref}
          className={`
            relative
            bg-[var(--color-base-surface-primary)]
            border border-[var(--color-base-stroke)]
            shadow-[0px_4px_8px_-4px_rgba(0,0,0,0.12),0px_7px_40px_-8px_rgba(0,0,0,0.05)]
            overflow-hidden
            flex flex-col
            ${sizeClasses[size]}
            ${className}
          `.replace(/\s+/g, " ").trim()}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);

Modal.displayName = "Modal";

// ============================================
// MODAL CONTENT
// ============================================

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col gap-2 p-8 ${className}`.trim()}
      >
        {children}
      </div>
    );
  }
);

ModalContent.displayName = "ModalContent";

// ============================================
// MODAL HEADER
// ============================================

export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ children, className = "" }, ref) => {
    return (
      <h2
        ref={ref}
        className={`text-headline-1 text-[var(--color-base-primary)] ${className}`.trim()}
      >
        {children}
      </h2>
    );
  }
);

ModalHeader.displayName = "ModalHeader";

// ============================================
// MODAL BODY
// ============================================

export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`text-paragraph-2 text-[var(--color-base-primary)] ${className}`.trim()}
      >
        {children}
      </div>
    );
  }
);

ModalBody.displayName = "ModalBody";

// ============================================
// MODAL FOOTER
// ============================================

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className = "", align = "left" }, ref) => {
    const alignClasses = {
      left: "justify-start",
      right: "justify-end",
      center: "justify-center",
      between: "justify-between",
    };

    return (
      <div
        ref={ref}
        className={`
          flex items-center gap-2 pt-4
          ${alignClasses[align]}
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = "ModalFooter";

// ============================================
// MODAL WITH FOOTER SEPARATOR
// ============================================

export const ModalFooterSeparated = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className = "", align = "between" }, ref) => {
    const alignClasses = {
      left: "justify-start",
      right: "justify-end",
      center: "justify-center",
      between: "justify-between",
    };

    return (
      <div
        ref={ref}
        className={`
          flex items-center gap-2 p-4
          border-t border-[var(--color-base-stroke)]
          bg-[var(--color-base-surface-primary)]
          ${alignClasses[align]}
          ${className}
        `.replace(/\s+/g, " ").trim()}
      >
        {children}
      </div>
    );
  }
);

ModalFooterSeparated.displayName = "ModalFooterSeparated";

// ============================================
// CONFIRM MODAL (PRE-BUILT)
// ============================================

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  size = "lg",
  children,
}: ConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        {description && <ModalBody>{description}</ModalBody>}
        {children}
        <ModalFooter align="left" className="gap-3">
          <Button
            variant="primary"
            onClick={onConfirm}
            className={variant === "danger"
              ? "!bg-[var(--color-danger-100)] !text-white hover:!bg-[#e63610] hover:!shadow-none active:!scale-[0.98] focus-visible:!ring-[var(--color-danger-100)]"
              : undefined}
          >
            {confirmText}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ============================================
// POPUP (SMALL CONFIRMATION)
// ============================================

export const Popup = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: PopupProps) => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!mounted || !isOpen) return null;

  const confirmButtonClasses =
    variant === "danger"
      ? "bg-[var(--color-system-error)] text-white hover:bg-[#d32f2f]"
      : "bg-[var(--color-brand-primary)] text-white hover:opacity-90";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div
        className="
          relative
          w-[200px]
          bg-[var(--color-base-surface-primary)]
          border border-[var(--color-base-stroke)]
          rounded-lg
          shadow-[0px_4px_8px_-4px_rgba(0,0,0,0.05),0px_7px_40px_-8px_rgba(0,0,0,0.03)]
          overflow-hidden
          p-4
          flex flex-col gap-4
        "
      >
        {/* Content */}
        <div className="flex flex-col gap-1">
          <h3 className="text-headline-3 text-[var(--color-base-primary)]">
            {title}
          </h3>
          {description && (
            <p className="text-paragraph-2 text-[var(--color-base-secondary)]">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="
              flex-1 h-8 px-4 rounded-lg text-headline-4
              bg-[var(--color-base-surface-primary)]
              border border-[var(--color-base-stroke)]
              text-[var(--color-base-primary)]
              hover:bg-[var(--color-brand-primary)]/[0.08]
              transition-colors duration-150
            "
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`
              flex-1 h-8 px-4 rounded-lg text-headline-4
              transition-colors duration-150
              ${confirmButtonClasses}
            `.replace(/\s+/g, " ").trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================
// ALERT POPUP (INLINE VERSION)
// ============================================

export interface AlertPopupProps {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "danger";
}

export const AlertPopup = ({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: AlertPopupProps) => {
  const confirmButtonClasses =
    variant === "danger"
      ? "bg-[var(--color-system-error)] text-white hover:bg-[#d32f2f]"
      : "bg-[var(--color-brand-primary)] text-white hover:opacity-90";

  return (
    <div
      className="
        w-[200px]
        bg-[var(--color-base-surface-primary)]
        border border-[var(--color-base-stroke)]
        rounded-lg
        shadow-[0px_4px_8px_-4px_rgba(0,0,0,0.05),0px_7px_40px_-8px_rgba(0,0,0,0.03)]
        overflow-hidden
        p-4
        flex flex-col gap-4
      "
    >
      {/* Content */}
      <div className="flex flex-col gap-1">
        <h3 className="text-headline-3 text-[var(--color-base-primary)]">
          {title}
        </h3>
        {description && (
          <p className="text-paragraph-2 text-[var(--color-base-secondary)]">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="
            flex-1 h-8 px-4 rounded-lg text-headline-4
            bg-[var(--color-base-surface-primary)]
            border border-[var(--color-base-stroke)]
            text-[var(--color-base-primary)]
            hover:bg-[var(--color-brand-primary)]/[0.08]
            transition-colors duration-150
          "
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`
            flex-1 h-8 px-4 rounded-lg text-headline-4
            transition-colors duration-150
            ${confirmButtonClasses}
          `.replace(/\s+/g, " ").trim()}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};
