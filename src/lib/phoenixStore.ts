import type { WizardIntent, NavSection } from "@/ui-generator";
import type { UISpec, CreatePageSpec } from "@/features/agent/types";

export interface FeatureRequestStoreItem {
  id: string;
  pageId: string;
  title: string;
  description: string;
  navigation: {
    parentSection: string | null;
    newSectionName: string;
    newSectionIcon: string;
    isNewSection: boolean;
    customSections: Array<{ id: string; label: string; icon: string }>;
  };
  parentSectionLabel: string;
  spec: UISpec;
  createPageSpec: CreatePageSpec;
  wizardIntent?: WizardIntent;
  createdAt: string;
  columnCount: number;
  actionCount: number;
}

export interface PhoenixStoreSnapshot {
  navState: { sections: NavSection[] };
  pageSpecs: Record<string, UISpec>;
  createPageSpecs: Record<string, CreatePageSpec>;
  savedTableRows: Record<string, Record<string, string>[]>;
  pageWizardIntents: Record<string, WizardIntent>;
  featureRequests: FeatureRequestStoreItem[];
  updatedAt: string;
}

export const PHOENIX_STORE_FILE = "data/phoenix-store.json";
