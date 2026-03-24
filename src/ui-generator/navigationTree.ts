/**
 * Navigation Tree — shared sidebar structure for Phoenix app
 * Used by Wizard to place new pages and by Phoenix to render sidebar
 */

export interface NavSection {
  id: string;
  label: string;
  icon: string;
  children: NavPage[];
}

export interface NavPage {
  id: string;
  label: string;
  parentId: string;
}

export interface NavigationState {
  sections: NavSection[];
}

const STORAGE_KEY = "phoenix-navigation";

/**
 * Default navigation sections (matching Figma design)
 */
export const DEFAULT_SECTIONS: NavSection[] = [
  { id: "audiences", label: "Audiences", icon: "audiences", children: [] },
  { id: "push-chat", label: "Push & Chat", icon: "chat", children: [] },
  { id: "banners", label: "Banners", icon: "banners", children: [] },
  {
    id: "gifts",
    label: "Gifts",
    icon: "gifts",
    children: [
      { id: "gifts-manager", label: "Gifts Manager", parentId: "gifts" },
      { id: "custom-gifts", label: "Custom Gifts", parentId: "gifts" },
      { id: "gift-row-on-screen", label: "Gift Row on Screen", parentId: "gifts" },
      { id: "gift-drawers", label: "Gift Drawers", parentId: "gifts" },
      { id: "gift-challenge", label: "Gift Challenge", parentId: "gifts" },
      { id: "daily-quest", label: "Daily Quest", parentId: "gifts" },
    ],
  },
  { id: "in-stream-message", label: "In-Stream Message", icon: "chat", children: [] },
  { id: "bottom-sheets", label: "Bottom Sheets", icon: "banners", children: [] },
  { id: "in-app-offers", label: "In-App Offers", icon: "gifts", children: [] },
  { id: "features", label: "Features", icon: "features", children: [] },
  { id: "tags", label: "Tags", icon: "tags", children: [] },
  { id: "calendar", label: "Calendar", icon: "calendar", children: [] },
  { id: "audit-log", label: "Audit Log", icon: "history", children: [] },
  { id: "history", label: "History", icon: "history", children: [] },
];

/** One page id per section (last occurrence wins) — fixes duplicate keys / bad localStorage merges */
function dedupePagesById(pages: NavPage[]): NavPage[] {
  const map = new Map<string, NavPage>();
  for (const p of pages) {
    if (!p || typeof p.id !== "string") continue;
    map.set(p.id, { ...p });
  }
  return Array.from(map.values());
}

/** Dedupes child pages per section; use after loading from storage or merging. */
export function normalizeNavigationState(state: NavigationState): NavigationState {
  if (!state?.sections || !Array.isArray(state.sections)) {
    return { sections: DEFAULT_SECTIONS };
  }
  return {
    sections: state.sections.map((section) => ({
      ...section,
      children: Array.isArray(section.children) ? dedupePagesById(section.children) : [],
    })),
  };
}

export function getNavigation(): NavigationState {
  if (typeof window === "undefined") return { sections: DEFAULT_SECTIONS };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as NavigationState;
      return normalizeNavigationState(parsed);
    }
  } catch {
    // ignore
  }
  return { sections: DEFAULT_SECTIONS };
}

export function saveNavigation(state: NavigationState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeNavigationState(state)));
}

/**
 * Add a new page to an existing section
 */
/**
 * Update sidebar label for an existing page (e.g. after renaming in Wizard «Edit approved»).
 */
export function updatePageLabel(
  state: NavigationState,
  pageId: string,
  newLabel: string,
): NavigationState {
  return {
    sections: state.sections.map((section) => ({
      ...section,
      children: section.children.map((p) =>
        p.id === pageId ? { ...p, label: newLabel } : p,
      ),
    })),
  };
}

export function addPageToSection(
  state: NavigationState,
  sectionId: string,
  page: NavPage,
): NavigationState {
  const pageWithParent = { ...page, parentId: sectionId };
  return {
    sections: state.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            children: section.children.some((p) => p.id === page.id)
              ? section.children.map((p) => (p.id === page.id ? pageWithParent : p))
              : [...section.children, pageWithParent],
          }
        : section
    ),
  };
}

/**
 * Add a new section with a page inside it
 */
export function addNewSection(
  state: NavigationState,
  section: NavSection,
): NavigationState {
  return {
    sections: [...state.sections, section],
  };
}

/**
 * Get all sections that can contain sub-pages (for the Wizard picker)
 */
export function getSectionsForPicker(state: NavigationState): { id: string; label: string; childCount: number; icon: string }[] {
  return state.sections.map((s) => ({
    id: s.id,
    label: s.label,
    childCount: s.children.length,
    icon: s.icon,
  }));
}
