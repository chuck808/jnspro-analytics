# Uploading Sessions

---

## What Upload Does

The upload process takes the JSON file your AppGatePro device wrote to the SD card and turns it into the analytics you see on screen. It validates every field, converts raw sensor values into usable units, and stores everything in a structured database. When it works, you don't think about it. When it doesn't, understanding what's happening helps you fix it quickly.

---

## Getting the File Into the System

After a training session, your device saves a file to the SD card named something like `session_1714389845.json` — the number is a timestamp, it doesn't matter. That file contains everything the firmware recorded: reaction times, the full acceleration trace at 200 samples per second, peak and average G-force, the firmware's own speed calculations if they're valid, and optionally the pitch and roll orientation data.

To upload it:

1. Remove the SD card from the device and put it into your computer
2. Log into your AppGatePro Analytics account and go to **Upload**
3. Drag the session file into the upload zone, or click to browse and select it

The system reads the file in your browser, validates it, and sends it to the server for processing. Your original file on the SD card is never touched.

---

## What the System Does With Your Data

There's a bit of work happening behind the scenes during upload that's worth understanding, because it explains why the numbers you see on screen look different from what's stored in the raw file.

**Acceleration values** are stored in the firmware as integers — 2.85G is written as `285`. During upload the system divides everything by 100 to give you actual G-force values. This is a deliberate firmware design decision to save space without losing precision.

**Reaction time** is stored by the firmware in seconds. The platform converts it to milliseconds because that's more intuitive for gate start analysis. Your 0.245 second reaction time becomes 245ms.

**Orientation data** (pitch and roll) is stored in radians by the firmware. These get converted to degrees during upload because degrees are what coaches and riders actually think in.

**Speed values** are stored in metres per second and displayed in km/h. The conversion happens in the display layer, not at storage — so if you export your data to CSV, you'll see km/h.

**Elapsed time** is the recording window you set on the device — long enough to capture your full run at your chosen distance. Without the breakbeam module, this is just the duration the device recorded for. With the breakbeam, it becomes a precision measurement of exactly when you crossed the line, to ±1ms. The system stores it as-is but what it means analytically is very different depending on your setup.

**Distance** is what you entered on the device before the session. The system stores and displays it exactly as set. If you set 10m on the device but were actually running 12m, your speed calculations will be wrong — the physics uses your declared distance as a known value. Make sure it matches your actual setup before each session.

**The analytics valid flag** is important. The firmware calculates its own speed and pitch analytics, and it knows when that data isn't reliable. If the sensor quality was poor, the firmware flags those analytics as invalid. When that happens, speed-based metrics are set to null in the database rather than showing you numbers that can't be trusted. G-force values always appear because they come directly from the sensor — it's only the derived calculations that get suppressed.

---

## The Success Screen

When upload works, you see a summary showing how many runs were imported, whether timeseries data came through, and whether the session linked to your active bike.

**Runs imported** is the number of individual gate runs successfully processed. Each one is separately viewable in the session detail.

**Time series** tells you whether the high-frequency sensor data (pitch angles, roll angles, detailed acceleration) came through. If it says "None," you only have basic metrics — which is fine for most analysis. If it shows "5 runs (3 failed)," three runs are missing their orientation data but everything else is fine.

**Bike linked** confirms whether the session was automatically associated with your active bike. If it says "No active bike," power calculations won't appear until you configure one in Settings. The session is otherwise fully usable.

Once you see the success screen, your data is in the system. There's a direct link to view the session — click it to go straight to the analysis.

---

## Warnings

Warnings mean the upload succeeded but something wasn't ideal. Your session is fully imported and usable. The warning tells you what might be limited.

**Timeseries failures** — "3 run(s) had timeseries data that failed to import." You keep reaction time, G-force, speed, and all the core analytics. You lose pitch angle charts, wheelie detection, and roll data for those specific runs. This usually happens when the SD card write was interrupted or that particular run's data got corrupted. One or two failures per session is normal. Every single run failing consistently across multiple sessions is worth investigating.

**Unusual reaction times** — a reaction time of 12 seconds gets flagged because it suggests a sensor issue rather than a real delayed start. The data is imported as-is. Check that run when you view the session — if it's clearly wrong (device was sitting idle, sensor glitch), archive it so it doesn't affect your analytics.

**G-force out of range** — readings significantly above 3.5G suggest the sensor maxed out or data is corrupt. The firmware does some sensor fusion that extends the usable range slightly beyond the sensor's rated ±2G, but very high readings warrant a look at the G-force chart to see if the shape looks plausible.

**Empty chart data** — a run with no acceleration samples. You'll still have reaction time and basic metrics, but no G-force chart or speed curve for that run.

---

## Errors

Errors stop the upload completely. Nothing gets imported. The message tells you what went wrong.

**"File is not valid JSON"** — the file is corrupted or incomplete. Usually happens when the device powered off mid-save, the SD card was removed too early, or the card itself has a fault. Try re-reading the file from the card. If it fails repeatedly, the session data wasn't fully written and can't be recovered.

**"Unsupported schema version: 1"** — your firmware is old. Update the device firmware and future sessions will use the current format. Old v1 sessions can't be imported automatically.

**"Unsupported schema version: 3"** — your firmware is newer than the platform. This shouldn't happen in normal circumstances. Check for platform updates or contact support.

**"Missing required fields: reactionTime, chartData"** — the file parsed successfully but one or more runs are missing critical data. Usually means the firmware didn't finish writing the session. There's no recovery for data that wasn't captured.

**"Session file contains no runs"** — valid file format, but the runs array is empty. The device created the session file but recorded nothing. This could be an accidental session trigger on the device.

**"Failed to create session record" / "Failed to insert run"** — the file was fine but the database write failed. This is a server-side issue, not your file. Wait 30 seconds and try again. If it fails consistently, the platform is having issues.

**"Network error"** — your connection dropped or the upload timed out. Check your connection and try again. Large sessions with many runs and full timeseries data can take 20–30 seconds, which occasionally times out on slow connections.

---

## Profile and Bike Linking

When you upload a session, the system checks for an active bike in your profile and links the session to it automatically. This enables power calculations (which need bike weight) and keeps your equipment history organised.

If you don't have an active bike configured, set one up in Settings → Bikes, then refresh the session page. Power calculations run when the page loads, using whichever bike is currently linked.

Your rider profile (weight, skill level, age) isn't frozen at upload time. If you update your profile later, the technique scores and threshold ratings adjust when you view old sessions. The only exception is age-group analytics, which use your date of birth and effectively stay fixed.

---

## Your Files

The upload process reads your SD card file but never modifies or deletes it. Your original session files stay on the card until you remove them yourself.

You can re-upload the same file as many times as you want — each upload creates a new session in your account. If you accidentally uploaded twice, archive the duplicate.

A few sensible habits around SD card management: don't delete files immediately after upload in case you need to troubleshoot something. Periodically copy them to your computer for backup before clearing the card. Reformat the card occasionally (after backing up) to keep the filesystem healthy. Use a decent quality card — cheap ones fail more often, and a mid-session write failure means lost data.

---

## Common Problems

**Session isn't appearing after upload** — sessions are sorted by the date they were recorded, not when they were uploaded. If you uploaded an old session, it'll appear further down the list sorted by session date. Click the "View Session" link on the success screen to go directly to it.

**Timeseries failing consistently across all sessions** — one or two failures per session is normal. Every run in every session failing points to a firmware issue, slow SD card, or card slot problem. Update your firmware first, then try a different SD card.

**G-force chart looks wrong** — the chart shows exactly what was recorded. Check the bias correction value in the run details. Above 0.5 m/s² suggests the sensor baseline was off. Above 2.0 means the integrated speed will be unreliable. If the chart shows spikes or impossible values, the data is probably corrupt.

**Power calculations missing** — you need a bike configured with weight entered. Add one in Settings → Bikes, mark it as active, refresh the session page.

**Speed showing as N/A** — the firmware flagged those analytics as invalid. You'll still see G-force. Speed calculations are suppressed when the firmware can't trust them.

---

## Privacy

Sessions upload to your personal account only. Nobody else can see your data. Even if you're opted into leaderboards, only your best aggregate metrics are shared — individual session details, run-by-run data, and timeseries information stay private.

You can delete sessions at any time from the session page. Deletion is immediate and permanent on the platform. Your original SD card file is unaffected — if you delete a session and change your mind, re-upload from the card.

---

_If upload isn't working and this chapter didn't help, use the feedback button on the upload page. Include the exact error message and your firmware version._
