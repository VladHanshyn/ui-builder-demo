#!/bin/bash

# P-04: Card Selection Grid (builder with card grids)
# Auction Creation (all have card grids)
for i in $(seq -w 01 16); do
  mv "Auction Creation $i.png" P-04_Card-Selection-Grid/ 2>/dev/null
done

# MOS Campaigns with card selection grids (06-37 mostly have card builders)
for i in 06 07 08 09 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37; do
  mv "MOS Campaigns $i.png" P-04_Card-Selection-Grid/ 2>/dev/null
done

echo "P-04 done"

# P-07: Selection List Panel (selection modals/panels with checkbox lists)
# Resellers Manager (selection list panels)
mv "Resellers Manager 01.png" P-07_Selection-List-Panel/ 2>/dev/null
for i in $(seq -w 04 18); do
  mv "Resellers Manager $i.png" P-07_Selection-List-Panel/ 2>/dev/null
done

# Jackpot Drop selection panels (03-30 have selection dialogs)
for i in $(seq -w 03 30); do
  mv "Jackpot Drop $i.png" P-07_Selection-List-Panel/ 2>/dev/null
done

echo "P-07 done"

# P-08: Device Preview Overlay (phone mockup screens)
# Cold Start Emilator (all have phone preview)
for i in $(seq -w 01 17); do
  mv "Cold Start Emilator $i.png" P-08_Device-Preview/ 2>/dev/null
done

# Bottom Sheet with phone previews
for i in $(seq -w 01 16); do
  mv "Bottom Sheet $i.png" P-08_Device-Preview/ 2>/dev/null
done

# MOS Campaigns with phone preview (01, 03, 04, 05)
mv "MOS Campaigns 01.png" "MOS Campaigns 03.png" "MOS Campaigns 04.png" "MOS Campaigns 05.png" P-08_Device-Preview/ 2>/dev/null

echo "P-08 done"
