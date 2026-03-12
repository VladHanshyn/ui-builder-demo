"use client";

import { useRouter } from "next/navigation";
import { WizardPage } from "@/ui-generator";
import type { WizardIntent } from "@/ui-generator";

export default function WizardRoute() {
  const router = useRouter();

  const handleSubmit = (intent: WizardIntent) => {
    localStorage.setItem("phoenix-pending-wizard-intent", JSON.stringify(intent));
    router.push("/phoenix");
  };

  const handleBack = () => {
    router.back();
  };

  return <WizardPage onSubmit={handleSubmit} onBack={handleBack} />;
}
