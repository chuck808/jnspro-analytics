# Data Pipeline Technical Specification

**BMX Gate Pro - Unified int16 ×100 Format**  
**Date:** April 26, 2026  
**Version:** 2.1 (Corrected Analytics Server Implementation)

---

## Executive Summary

This document provides byte-level analysis of data flowing through all three pipelines for a typical 3-second, 10-meter BMX sprint. All pipelines now use **unified int16 ×100 format** for acceleration data storage and transmission.

---

## Test Scenario: Typical BMX Sprint

**Rider Profile:** Elite BMX racer  
**Distance:** 10 meters (standard BMX gate distance)  
**Total Time:** 3.038 seconds  
**Reaction Time:** 0.245 seconds  
**Movement Time:** 2.793 seconds  
**Peak Speed:** 42.3 km/h (11.75 m/s)  
**Max G-Force:** 2.85G  
**Average G-Force:** 1.42G  
**Sample Rate:** 200 Hz (5ms intervals)  
**Total Samples:** 608 samples (3.038s × 200 Hz)

---

## Raw Acceleration Profile

### Sample Data Points (first 1 second)

```
Time (s)  | G-Force | int16 ×100 | Hex     | Binary
----------|---------|------------|---------|------------------
0.000     | 0.00    | 0          | 0x0000  | 0000000000000000
0.005     | 0.12    | 12         | 0x000C  | 0000000000001100
0.010     | 0.34    | 34         | 0x0022  | 0000000000100010
0.015     | 0.58    | 58         | 0x003A  | 0000000000111010
0.020     | 0.89    | 89         | 0x0059  | 0000000001011001
0.025     | 1.24    | 124        | 0x007C  | 0000000001111100
0.030     | 1.65    | 165        | 0x00A5  | 0000000010100101
0.040     | 2.12    | 212        | 0x00D4  | 0000000011010100
0.050     | 2.45    | 245        | 0x00F5  | 0000000011110101
0.100     | 2.78    | 278        | 0x0116  | 0000000100010110
0.150     | 2.85    | 285        | 0x011D  | 0000000100011101  ← Peak G
0.200     | 2.67    | 267        | 0x010B  | 0000000100001011
0.500     | 1.89    | 189        | 0x00BD  | 0000000010111101
1.000     | 1.23    | 123        | 0x007B  | 0000000001111011
```

### Full Profile Statistics

**Phase breakdown:**

- **Launch (0-0.5s):** Peak acceleration zone (0-2.85G)
- **Power (0.5-1.5s):** Sustained acceleration (1.5-2.0G)
- **Coast (1.5-3.0s):** Gradual decline (0.8-1.2G)

**Data characteristics:**

- Min value: 0 (start)
- Max value: 285 (2.85G at 0.150s)
- Average: 142 (1.42G)
- Median: 135 (1.35G)
- Range: 285 (0-2.85G)

---

## Pipeline 1: Live Dashboard (WebSocket/SSE)

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ FIRMWARE (ESP32)                                                │
├─────────────────────────────────────────────────────────────────┤
│ 1. IMU samples @ 200Hz                                          │
│    → Model.UpdateIMU() → stores float in raceAccelerationData   │
│                                                                  │
│ 2. End of race:                                                 │
│    → Convert to int16 ×100:                                     │
│      chartDataFull.push_back(static_cast<int16_t>(g * 100))    │
│                                                                  │
│ 3. Downsample to 300 points (if > 300):                        │
│      chartDataForWeb = downsample(chartDataFull, 300)          │
│                                                                  │
│ 4. Send via WebServerManager::sendSessionComplete():           │
│      JsonArray chartArray = doc.createNestedArray("chartData"); │
│      for (int16_t value : chartDataForWeb) {                   │
│        chartArray.add(value);  // ← int16, not float!          │
│      }                                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ TRANSMISSION (HTTP/SSE)                                         │
├─────────────────────────────────────────────────────────────────┤
│ Content-Type: text/event-stream                                 │
│ Event: session_complete                                         │
│                                                                  │
│ JSON Payload (300 points after downsampling):                   │
│ {                                                               │
│   "reaction": 245,           // uint32 milliseconds             │
│   "maxG": 2.85,              // float                           │
│   "avgG": 1.42,              // float                           │
│   "time": "03:038",          // string                          │
│   "chartData": [0,12,34,...,285,...,123],  // int16[] ×100     │
│   "analytics": {                                                │
│     "peak_speed": 11.75,     // float m/s                       │
│     "end_speed": 10.23,      // float m/s                       │
│     "avg_speed": 9.87,       // float m/s                       │
│     "bias_correction": 0.23  // float m/s²                      │
│   }                                                             │
│ }                                                               │
│                                                                  │
│ Payload size: ~1.2 KB (300 int16 values = 600 bytes + JSON)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ DASHBOARD (JavaScript - index_html.h)                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Receive event:                                               │
│    source.addEventListener('session_complete', e => {           │
│      const data = JSON.parse(e.data);                           │
│                                                                  │
│ 2. ✅ CONVERT int16 ×100 to float:                             │
│      if (data.chartData && Array.isArray(data.chartData)) {    │
│        data.chartData = data.chartData.map(v => v / 100.0);    │
│      }                                                          │
│      // [0,12,34,...,285,...,123] → [0.00,0.12,0.34,...,2.85,  │
│      //                              ...,1.23]                  │
│                                                                  │
│ 3. Render chart with Chart.js:                                 │
│      new Chart(ctx, {                                           │
│        data: {                                                  │
│          datasets: [{                                           │
│            data: data.chartData  // Now float G-units          │
│          }]                                                     │
│        }                                                        │
│      });                                                        │
│                                                                  │
│ 4. Display shows:                                               │
│      Y-axis: 0G to 3G (float scale)                            │
│      Peak: 2.85G at 0.150s                                      │
│      Chart renders correctly ✓                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Bandwidth Analysis

**Before (float transmission):**

```
608 samples × 4 bytes (float32) = 2,432 bytes
+ JSON overhead ~500 bytes
= ~2.9 KB total payload
```

**After (int16 ×100 downsampled):**

```
300 samples × 2 bytes (int16) = 600 bytes
+ JSON overhead ~500 bytes
= ~1.1 KB total payload
```

**Savings: 62% reduction** (2.9 KB → 1.1 KB)

---

## Pipeline 2: SD Card Storage

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ FIRMWARE (ESP32)                                                │
├─────────────────────────────────────────────────────────────────┤
│ 1. Full resolution data (no downsampling):                      │
│      chartDataFull = [0,12,34,58,89,...,285,...,123]           │
│      (608 samples × int16 ×100)                                │
│                                                                  │
│ 2. DataManager::saveSessionDataToSD():                         │
│      doc["chartData"] = chartDataFull;  // int16[] array       │
│                                                                  │
│ 3. Write to SD card as JSON:                                    │
│      File file = SD.open("/session_12345.json", FILE_WRITE);   │
│      serializeJson(doc, file);                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SD CARD FILE (/session_12345.json) — Schema v2                  │
├─────────────────────────────────────────────────────────────────┤
│ {                                                               │
│   "schemaVersion": 2,                                           │
│   "sessionMetadata": {                                          │
│     "startTime": 1735234567890,                                 │
│     "endTime": 1735234570928,                                   │
│     "totalRuns": 5,                                             │
│     "isSessionMode": true,                                      │
│     "distance": 10                                              │
│   },                                                            │
│   "runs": [                                                     │
│     {                                                           │
│       "timestamp": 1735234567890,                               │
│       "reactionTime": 0.245,         // float seconds           │
│       "elapsedMs": 3038,             // uint32 milliseconds     │
│       "maxG": 2.85,                  // float                   │
│       "avgG": 1.42,                  // float                   │
│       "distance": 10.0,              // float metres            │
│       "chartData": [0,12,34,58,89,124,165,212,245,278,285,     │
│                     267,189,123,...],  // 608 × int16 ×100     │
│       "firmwareAnalytics": {                                    │
│         "valid": true,                                          │
│         "peakSpeedMs": 11.75,        // float m/s               │
│         "endSpeedMs": 10.23,         // float m/s               │
│         "avgSpeedMs": 9.87,          // float m/s               │
│         "biasCorrectionMs2": 0.23,   // float m/s²              │
│         "timeToPeakSpeedMs": 150,    // uint32 milliseconds     │
│         "maxPitchDeg": 12.3,         // float degrees           │
│         "avgPitchDeg": 8.7,          // float degrees           │
│         "pitchAtPeakGDeg": 9.1,      // float degrees           │
│         "timeToWheelieMs": 234,      // uint32 milliseconds     │
│         "wheelieDurationMs": 456,    // uint32 milliseconds     │
│         "frontWheelLifted": true     // bool                    │
│       },                                                        │
│       "timeSeries": {                // optional                │
│         "sampleRateHz": 200,                                    │
│         "sampleCount": 608,                                     │
│         "pitchRad": [0.0123, ...],   // float[] radians (raw)  │
│         "rollRad": [-0.0034, ...],   // float[] radians (raw)  │
│         "linearAccelG": [0.45, ...], // float[] G              │
│         "rawAccelG": [1.23, ...]     // float[] G              │
│       }                                                         │
│     }                                                           │
│   ]                                                             │
│ }                                                               │
│                                                                  │
│ File size: ~4.5 KB per run (608 samples × 2 bytes + metadata)  │
│ 5-run session: ~22.5 KB total                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Binary Layout (First 20 Bytes)

```
Offset | Hex Values                                      | Decoded
-------|------------------------------------------------|----------
0x0000 | 00 00 0C 00 22 00 3A 00 59 00 7C 00 A5 00 D4 00 | 0, 12, 34, 58, 89, 124, 165, 212
0x0010 | F5 00 16 01 1D 01 0B 01 BD 00 7B 00 ... ...    | 245, 278, 285, 267, 189, 123, ...
```

**Notes:**

- Little-endian format (ESP32 native)
- 2 bytes per sample (int16)
- Example: `0x011D` = 285 decimal = 2.85G

---

## Pipeline 3: SD Card Upload to Web Analytics

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ BETA PHASE: SD Card → Manual Upload                             │
├─────────────────────────────────────────────────────────────────┤
│ User copies session_12345.json from SD card                     │
│ Uploads via AppGatePro web app upload page                      │
│ POST /api/upload (SvelteKit server route)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SVELTE KIT UPLOAD ENDPOINT (src/routes/api/upload/+server.ts)  │
├─────────────────────────────────────────────────────────────────┤
│ 1. Receive multipart form data (JSON file)                      │
│                                                                  │
│ 2. Pass to ingest service:                                      │
│      import { ingestSDCardFile } from '$lib/services/ingest';  │
│      const result = await ingestSDCardFile(jsonContent);        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ INGEST SERVICE (src/lib/services/ingest.ts)                     │
├─────────────────────────────────────────────────────────────────┤
│ 1. Validate schema version                                      │
│      if (file.schemaVersion !== 2) throw error;                 │
│                                                                  │
│ 2. ✅ CONVERT chartData int16 ×100 → float G:                  │
│      const chartData = run.chartData.map(v => v / 100);        │
│      // [0,12,34,...,285,...,123] → [0.00,0.12,...,2.85,...,1.23]│
│                                                                  │
│ 3. Convert reactionTime seconds → milliseconds:                 │
│      reaction_time_ms = run.reactionTime * 1000                 │
│      // 0.245 → 245ms                                           │
│                                                                  │
│ 4. Convert timeSeries radians → degrees (if present):          │
│      pitchDeg = run.timeSeries.pitchRad.map(r => r * RAD_TO_DEG)│
│      rollDeg  = run.timeSeries.rollRad.map(r => r * RAD_TO_DEG) │
│                                                                  │
│ 5. All other fields passed through unchanged:                   │
│      maxG, avgG, elapsedMs, distance                           │
│      firmwareAnalytics (speeds already in m/s)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SUPABASE (PostgreSQL)                                           │
├─────────────────────────────────────────────────────────────────┤
│ Stored in runs + gate_runs tables:                              │
│                                                                  │
│ runs:                                                           │
│   chart_data:       float[] G-units  [0.00, 0.12, ..., 2.85]  │
│   elapsed_time_ms:  integer           3038                      │
│   distance_m:       float             10.0                      │
│                                                                  │
│ gate_runs:                                                      │
│   reaction_time_ms: integer           245                       │
│   max_g:            float             2.85                      │
│   avg_g:            float             1.42                      │
│   peak_speed_ms:    float             11.75  (m/s)              │
│   end_speed_ms:     float             10.23  (m/s)              │
│   avg_speed_ms_calc:float             9.87   (m/s)              │
│   bias_correction_ms2: float          0.23                      │
│   time_to_peak_speed_ms: integer      150                       │
│   analytics_valid:  boolean           true                      │
│   max_pitch_deg:    float             12.3                      │
│   avg_pitch_deg:    float             8.7                       │
│   pitch_at_peak_g_deg: float          9.1                       │
│   time_to_wheelie_ms: integer         234                       │
│   wheelie_duration_ms: integer        456                       │
│   front_wheel_lifted: boolean         true                      │
│                                                                  │
│ Database stores CORRECT DATA ✓                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PERFORMANCE ENGINE (src/lib/performance-engine/)                │
├─────────────────────────────────────────────────────────────────┤
│ Reads from Supabase via page server load functions              │
│                                                                  │
│ Receives:                                                       │
│   chart_data:       float[] G-units  ← already converted ✓     │
│   reaction_time_ms: integer ms       ← already converted ✓     │
│   max_g:            float            ← no conversion needed ✓   │
│   speeds:           float m/s        ← display layer converts   │
│                                                                  │
│ Runs session intelligence, cross-session analysis,             │
│ technique scoring, recommendations                              │
└─────────────────────────────────────────────────────────────────┘
```

### Future: Direct WiFi Upload (Post-Beta)

```
NOTE: Direct firmware → analytics upload (DataManager::uploadToAnalytics())
is not used during beta. SD card manual upload is the only active pipeline.

When direct upload is enabled post-beta:
- Firmware will POST int16 ×100 chartData directly
- A SvelteKit API endpoint will handle conversion (same ingest.ts logic)
- No Python/FastAPI server involved — stack is SvelteKit + Supabase throughout
```

---

## Side-by-Side Data Comparison Table

| Metric                          | Old (×1000 bug)        | New (×100 unified) | Result            |
| ------------------------------- | ---------------------- | ------------------ | ----------------- |
| **Dashboard receives**          | `float[]` direct       | `int16[] ×100`     | ✓ Same after ÷100 |
| **Dashboard displays**          | 2.85G at 0.150s        | 2.85G at 0.150s    | ✓ Identical       |
| **SD card stores**              | `int16[] ×1000` ❌     | `int16[] ×100` ✓   | ✅ FIXED          |
| **ingest.ts converts**          | `÷100` (wrong!)        | `÷100` (correct)   | ✅ FIXED          |
| **Supabase stores**             | 28.50G ❌              | 2.85G ✓            | ✅ FIXED          |
| **Performance Engine receives** | 28.50G ❌              | 2.85G ✓            | ✅ FIXED          |
| **Dashboard payload**           | 2.9 KB (float)         | 1.1 KB (int16)     | ✅ 62% smaller    |
| **Data consistency**            | 3 different formats ❌ | 1 unified format ✓ | ✅ FIXED          |
| **Precision**                   | 0.001G overkill        | 0.01G sufficient   | ✓ Appropriate     |

---

## Precision Analysis

### int16 ×100 Format Specifications

**Range:**

- Min: -32768 → -327.68G
- Max: +32767 → +327.67G
- **BMX typical:** 0-4G (well within range)

**Precision:**

- Step size: 0.01G
- **BMX requirement:** 0.05G minimum resolution
- **Margin:** 5× better than required ✓

**Example values:**

```
G-Force  | int16 ×100 | Stored Value
---------|------------|-------------
0.00G    | 0          | Perfect zero
0.05G    | 5          | Minimum detectable
1.00G    | 100        | Gravity reference
2.85G    | 285        | Typical BMX peak
4.00G    | 400        | Maximum BMX
8.00G    | 800        | Display range max
```

### Why Not ×1000?

1. **Unnecessary precision:** 0.001G steps not measurable by BMI270 — noise floor ~0.01G
2. **Reduced range:** ±32.767G barely covers the 8G chart ceiling
3. **Caused the bug:** Mixing ×1000 storage with ÷100 conversion = 10× inflation

---

## Validation Test Case

### Input (SD Card JSON — first 10 samples)

```json
{
	"chartData": [0, 12, 34, 58, 89, 124, 165, 212, 245, 278]
}
```

### After ingest.ts conversion

```typescript
const chartData = [0, 12, 34, 58, 89, 124, 165, 212, 245, 278].map((v) => v / 100);
// → [0.00, 0.12, 0.34, 0.58, 0.89, 1.24, 1.65, 2.12, 2.45, 2.78]
```

### Stored in Supabase

```
chart_data: [0.00, 0.12, 0.34, 0.58, 0.89, 1.24, 1.65, 2.12, 2.45, 2.78]
```

### Performance Engine receives

```typescript
// RunLike.chart_data — already float G-units, no further conversion needed
chartData: [0.0, 0.12, 0.34, 0.58, 0.89, 1.24, 1.65, 2.12, 2.45, 2.78];
```

### Verification

✅ SD card stores correct int16 ×100  
✅ ingest.ts converts correctly (÷100)  
✅ Supabase stores correct float G values  
✅ Performance Engine receives physically accurate data  
✅ Dashboard converts correctly (÷100 in JavaScript)

---

## Tech Stack Summary

| Layer                   | Technology                                     |
| ----------------------- | ---------------------------------------------- |
| **Firmware**            | ESP32 / M5Stack CoreS3, C++                    |
| **Device dashboard**    | index_html.h (embedded HTML/JS)                |
| **Upload endpoint**     | SvelteKit (`src/routes/api/upload/+server.ts`) |
| **Ingest / conversion** | TypeScript (`src/lib/services/ingest.ts`)      |
| **Database**            | Supabase (PostgreSQL + RLS)                    |
| **Analytics web app**   | SvelteKit 2 / Svelte 5 / Tailwind CSS 4        |
| **Performance Engine**  | TypeScript (`src/lib/performance-engine/`)     |
| **Hosting**             | Vercel                                         |

---

## Conclusion

The unified int16 ×100 format provides:

1. **Data Consistency:** Same raw format across all three pipelines
2. **Accuracy:** Correct scaling — Performance Engine receives physically accurate G values
3. **Efficiency:** 62% bandwidth reduction for dashboard transmission
4. **Precision:** 0.01G resolution appropriate for BMX / BMI270 IMU
5. **Simplicity:** Single conversion point per pipeline (ingest.ts, dashboard JS)
6. **Reliability:** No mixing of formats or scales

**Status:** Production-ready for field testing ✅
