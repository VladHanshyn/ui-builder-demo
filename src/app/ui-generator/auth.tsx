"use client";

import React, { createContext, useContext, ReactNode } from "react";

/**
 * User and Auth Types
 */
interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Mock user for development
 * In production, this would come from your auth system
 */
const mockUser: User = {
  id: "1",
  name: "Admin User",
  email: "admin@example.com",
  roles: ["admin", "developer"],
  permissions: [
    "ui-generator.access",
    "ui-generator.create",
    "ui-generator.edit",
  ],
};

/**
 * Auth Provider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const user = mockUser; // In production: fetch from session/token

  const hasRole = (role: string) => user?.roles.includes(role) ?? false;
  const hasPermission = (permission: string) => user?.permissions.includes(permission) ?? false;
  const hasAnyRole = (roles: string[]) => roles.some((role) => hasRole(role));

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    hasRole,
    hasPermission,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Access Denied Component
 */
export function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-[var(--color-base-primary)] mb-2">
          Access Denied
        </h1>
        <p className="text-[var(--color-base-secondary)]">
          You don&apos;t have permission to access the UI Generator.
        </p>
        <p className="text-sm text-[var(--color-base-tertiary)] mt-2">
          Required roles: admin, designer, or developer
        </p>
      </div>
    </div>
  );
}

/**
 * RBAC Gate Component
 */
interface RBACGateProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RBACGate({ roles, children, fallback = <AccessDenied /> }: RBACGateProps) {
  const { hasAnyRole } = useAuth();
  
  if (!hasAnyRole(roles)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
