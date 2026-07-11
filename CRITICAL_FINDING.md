# CRITICAL FINDING - chart_data is Wrong Data for Speed

## The Problem

`chart_data` contains **linearAccelG** (forward acceleration only, after gravity removed).

These values are ~0.01-0.04 G, which is **correct for forward-only acceleration**, but **cannot be used to calculate total speed** because:
1. Gravity component already removed
2. Only forward vector
3. Heavily processed/filtered

## The Solution  

**Use firmware-calculated speeds** from the database:
- `peak_speed_ms` ← Firmware calculated this correctly (→ 44 km/h)
- `avg_speed_ms_calc` 
- `speed_ms` (end speed)

**DO NOT recalculate speed from chart_data in the web layer!**

## Why This Happened

The web systems were trying to recalculate physics that the firmware already calculated correctly.

`chart_data` is meant for:
- ✅ G-force chart visualization  
- ❌ NOT for speed integration

## Action Required

1. Remove all `computeSpeedCurve()` calls for speed metrics
2. Use firmware values: `gate_runs.peak_speed_ms * 3.6` for km/h
3. Keep `chart_data` for G-force charts only
4. Trust the firmware's speed calculations

The firmware has the raw sensor data and calculates speeds correctly.
We should display those values, not recalculate them incorrectly.
