#!/bin/bash

# P-05: Confirmation Dialog (screens with visible delete/confirm modals)
# Opt-in Configs 01 has delete modal
mv "Opt-in Configs 01.png" P-05_Confirmation-Dialog/ 2>/dev/null
# Promo 01 has delete modal
mv "Promo 01.png" P-05_Confirmation-Dialog/ 2>/dev/null
# MOS Campaigns 10 has delete modal
mv "MOS Campaigns 10.png" P-05_Confirmation-Dialog/ 2>/dev/null
# Opt-in screens with modals
for i in 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18; do
  mv "Opt-in Configs $i.png" P-05_Confirmation-Dialog/ 2>/dev/null
done

echo "P-05 done"

# P-09: Orderable List (priority/ordering screens with drag handles)
# Priority Settings (all are orderable lists)
for i in $(seq -w 01 10); do
  mv "Priority Settings $i.png" P-09_Orderable-List/ 2>/dev/null
done

# Ribbons (priority ordering screens)
for i in $(seq -w 01 10); do
  mv "Ribbons $i.png" P-09_Orderable-List/ 2>/dev/null
done

# Audience Priority
mv "Audience Priority 01.png" "Audience Priority 02.png" P-09_Orderable-List/ 2>/dev/null

echo "P-09 done"
