/**
 * Спільне позиціонування випадаючих панелей (Select, DatePicker, тощо):
 * якщо знизу не вистачає місця — відкриваємо над тригером.
 */

export const DROPDOWN_VIEWPORT_PADDING = 8;
export const DROPDOWN_GAP = 4;

export type VerticalPlacement = "above" | "below";

export interface VerticalDropdownArgs {
  triggerRect: DOMRectReadOnly;
  /** Висота панелі (оцінка до рендеру або виміряна) */
  panelHeight: number;
  gap?: number;
  viewportPadding?: number;
}

/**
 * Обчислює `top` у координатах viewport для `position: fixed`.
 * Якщо панель була б обрізана знизу — ставимо над інпутом (коли це має сенс).
 */
export function computeVerticalDropdownPosition(
  args: VerticalDropdownArgs,
): { top: number; placement: VerticalPlacement } {
  const gap = args.gap ?? DROPDOWN_GAP;
  const pad = args.viewportPadding ?? DROPDOWN_VIEWPORT_PADDING;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  const spaceBelow = vh - pad - args.triggerRect.bottom;
  const spaceAbove = args.triggerRect.top - pad;
  const h = Math.max(0, args.panelHeight);

  const wouldClipBelow = h + gap > spaceBelow;
  const fitsAbove = spaceAbove >= h + gap;
  const openAbove = wouldClipBelow && (fitsAbove || spaceAbove > spaceBelow);

  if (openAbove) {
    const top = Math.max(pad, args.triggerRect.top - h - gap);
    return { top, placement: "above" };
  }

  let top = args.triggerRect.bottom + gap;
  if (top + h + pad > vh) {
    top = Math.max(pad, vh - pad - h);
  }
  return { top, placement: "below" };
}

export function clampHorizontalLeft(
  left: number,
  panelWidth: number,
  viewportPadding = DROPDOWN_VIEWPORT_PADDING,
): number {
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  if (vw <= 0) return left;
  const maxLeft = vw - panelWidth - viewportPadding;
  if (maxLeft < viewportPadding) return viewportPadding;
  return Math.min(Math.max(viewportPadding, left), maxLeft);
}
