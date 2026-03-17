"use client";

import { WizardPage } from "@/ui-generator";
import type { WizardIntent } from "@/ui-generator";

export default function WizardRoute() {
  const handleSubmit = (intent: WizardIntent) => {
    localStorage.setItem("phoenix-pending-wizard-intent", JSON.stringify(intent));
    window.location.href = "/phoenix";
  };

  const handleBack = () => {
    window.history.back();
  };

  return <WizardPage onSubmit={handleSubmit} onBack={handleBack} />;
}
