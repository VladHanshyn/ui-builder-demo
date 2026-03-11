# Hybrid Screen Manifest

## Classification Rules Applied

1. **Dominant Surface Rule**: Classify by where user spends most time
2. **Hybrid Rule**: If no single pattern dominates, mark as Hybrid
3. **Overlay Rule**: Secondary structures (modals, dialogs) don't define pattern

---

## Identified Hybrid Screens

### MOS Campaigns 01
- **Location**: P-08_Device-Preview/
- **Patterns Combined**: P-02 + P-08 + P-03
- **Description**: 
  - Left: Partial table with campaign data (P-02)
  - Center: Device preview with phone mockup (P-08)
  - Right: Configuration panel with inputs and item list (P-03)
- **Dominant Surface**: None clear - all three are equally interactive
- **Action**: Should be moved to Hybrid/

### Cold Start Emilator Series
- **Location**: P-08_Device-Preview/
- **Some screens combine**:
  - Modal table overlay (P-07-like)
  - Background detail editor (P-03)
  - Device preview (P-08)
- **Action**: Review each file individually

---

## Misclassified Screens (Require Correction)

### Jackpot Drop Series in P-07
Many Jackpot Drop files were classified as P-07 (Selection List Panel) but are actually:

| File | Actual Pattern | Reason |
|------|----------------|--------|
| Jackpot Drop 10.png | P-03 | Full detail editor visible |
| Jackpot Drop 15.png | P-03 | Full detail editor visible |
| (others TBD) | P-03 or Hybrid | Need individual review |

**Correctly classified as P-07**:
- Jackpot Drop 03.png - Pure selection modal
- Jackpot Drop 05.png - Selection modal (dominant)

---

## Files Requiring Manual Review

The following series have mixed content and need individual file review:

1. **Jackpot Drop** (28 files in P-07)
   - Mix of: P-03 detail editors, P-07 selection modals, Hybrids
   
2. **Cold Start Emilator** (17 files in P-08)
   - Mix of: P-03 editors, P-08 previews, Hybrids with modal overlays

3. **MOS Campaigns** (4 files in P-08)
   - Most are Hybrids with multiple equal surfaces

4. **Resellers Manager** (16 files in P-07)
   - Need verification: pure selection panels or mixed?

---

## Pattern Combination Examples

### Hybrid: P-02 + P-08 (Table + Preview)
Screen shows both data table AND device preview as primary interaction areas.

### Hybrid: P-03 + P-07 (Editor + Selection Modal)
Detail editor with selection panel overlay where BOTH are substantially visible.

### Hybrid: P-03 + P-08 + P-07 (Triple)
Complex builder screens with editor, preview, AND selection panel.

---

## Recommended Actions

1. [ ] Create Hybrid subfolder
2. [ ] Move clearly identified hybrids
3. [ ] Review Jackpot Drop series - separate P-03 from P-07
4. [ ] Review Cold Start Emilator series
5. [ ] Update CLASSIFICATION_REPORT.txt with corrections

---

*Last updated: 2026-01-25*
