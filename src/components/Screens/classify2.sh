#!/bin/bash

# P-03: Detail Editor with Properties Panel (edit pages with right sidebar)
# Auctions edit screens (05+)
for i in $(seq -w 05 22); do
  mv "Auctions $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Daily Rewards edit screens
for i in $(seq -w 02 12); do
  mv "Daily Rewards $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Daily Quests edit screens  
for i in $(seq -w 03 07); do
  mv "Daily Quests $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Legal Documents edit screens
for i in $(seq -w 03 27); do
  mv "Legal Documents $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Pricing Templates edit screens
for i in $(seq -w 02 29); do
  mv "Pricing Templates $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Promo edit screens (most are detail editors)
for i in $(seq -w 02 37); do
  mv "Promo $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Lucky Store edit screens
for i in $(seq -w 02 13); do
  mv "Lucky Store $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Manage Free Spins edit screens
for i in $(seq -w 02 06); do
  mv "Manage Free Spins $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Games Campaigns edit screens
for i in $(seq -w 03 13); do
  mv "Games Campaigns $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# VIP Store Ribbons edit screens
for i in $(seq -w 01 07); do
  mv "VIP Store - Ribbons $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Vector Configuration edit screens
for i in $(seq -w 02 27); do
  mv "Vector Configuration $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Tagged Configs edit screens
for i in $(seq -w 03 05); do
  mv "Tagged Configs $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Loyalty Offer edit screens
for i in $(seq -w 02 03); do
  mv "Loyalty Offer $i.png" P-03_Detail-Editor/ 2>/dev/null
done

# Landing Pages edit screens
for i in $(seq -w 02 03); do
  mv "Landing Pages $i.png" P-03_Detail-Editor/ 2>/dev/null
done

echo "P-03 done"
