# Uploading Sessions

---

## Two ways a session can arrive

![Upload page](/docs/upload-page.png)

AppGatePro uses the same evidence-ingest path whether a session arrives directly from the device bridge or from a JSON file you import manually. If direct Wi-Fi upload is enabled on your hardware, a saved session can be sent to your account without keeping the Upload page open. The Upload page is the manual fallback: copy the JSON session file from the SD card and select it there.

Both transports validate and persist the same session evidence. The transport changes; the evidence contract does not.

---

## Duplicate detection uses the source evidence

Before a new session is created, the ingest path calculates a SHA-256 checksum from the submitted session evidence and checks your existing sessions for the same checksum. If that evidence is already in your account, AppGatePro returns the existing session instead of creating a second copy.

That also means a manual SD import can safely follow a device upload when you are unsure whether the Wi-Fi transfer completed: if the same evidence already arrived, you are pointed back to the session that exists.

---

## What can actually go wrong

**Invalid JSON or invalid session evidence.** If the submitted file cannot be parsed or does not satisfy the session-data contract, the import is rejected before a session is created. Re-copy the JSON from the SD card if the file itself may have been damaged during transfer.

**A required run or gate record fails to persist.** A session is not kept half-imported. Required run and gate evidence is imported as one session boundary; if one of those required inserts fails, the newly created session is rolled back rather than leaving the remaining runs behind as if the import succeeded.

**Optional timeseries data fails for a run.** Timeseries is allowed to degrade separately. The session and its required run/gate evidence can still be kept, but AppGatePro records a warning and pitch/wheelie analytics may be limited for the affected run.

**Server-side failure.** If the ingest path cannot complete the required persistence work, the request fails rather than reporting a successful session that is missing required evidence.

The important distinction is between required evidence and optional enrichment: required run/gate failures roll the new session back; optional timeseries failures are surfaced as warnings.

---

## Before you've filled in your profile

You do not need a complete rider or bike profile to import a recorded session. The ingest path links the active bike and latest rider profile when they exist, but it can store the sensor evidence without them.

Some derived metrics still need real setup context. In particular, rider mass and bike mass are required for power and related biomechanical calculations to be meaningful. Complete those details when you can; do not delay preserving the recorded session evidence just because the profile is incomplete.

---

_For upload errors not covered here, use the Help & Troubleshooting section, or the feedback button to report a bug directly._
