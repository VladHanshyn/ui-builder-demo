"use client";

import { useEffect, useState } from "react";
import { WizardPage } from "@/ui-generator";
import type { WizardIntent } from "@/ui-generator";

type WizardBootstrap = {
  intent: WizardIntent;
  replaceRequestId?: string;
  /** Оновлення вже апрувнутої сторінки в Phoenix (не черга реквестів) */
  editApprovedPageId?: string;
};

export default function WizardRoute() {
  const [boot, setBoot] = useState<WizardBootstrap | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("phoenix-wizard-bootstrap");
      if (raw) {
        sessionStorage.removeItem("phoenix-wizard-bootstrap");
        const parsed = JSON.parse(raw) as WizardBootstrap;
        if (parsed?.intent) {
          setBoot({
            intent: parsed.intent,
            replaceRequestId: parsed.replaceRequestId,
            editApprovedPageId: parsed.editApprovedPageId,
          });
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setBoot(null);
  }, []);

  const handleSubmit = (intent: WizardIntent) => {
    let payload: unknown = intent;
    if (boot?.editApprovedPageId) {
      payload = { intent, editApprovedPageId: boot.editApprovedPageId };
    } else if (boot?.replaceRequestId != null && boot.replaceRequestId !== "") {
      payload = { intent, replaceRequestId: boot.replaceRequestId };
    }
    localStorage.setItem("phoenix-pending-wizard-intent", JSON.stringify(payload));
    window.location.href = "/phoenix";
  };

  const handleBack = () => {
    window.history.back();
  };

  if (boot === undefined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--color-base-stroke)] text-sm text-[var(--color-base-secondary)]">
        Завантаження…
      </div>
    );
  }

  return (
    <WizardPage
      onSubmit={handleSubmit}
      onBack={handleBack}
      initialIntent={boot?.intent}
    />
  );
}
