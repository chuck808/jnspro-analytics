# Uploading Sessions

---

## What actually happens when you upload

![Upload page](/docs/upload-page.png)

Your AppGatePro device writes a JSON file to its SD card during your session. Pull the card, copy that file off, drop it here — that's the whole process from your side. Behind the scenes, the file gets validated field by field, raw sensor values get converted into the units you actually see on screen, and everything lands in the database in a structured form. When it works, you don't think about it. When it doesn't, it's worth knowing what's actually happening so you can fix it fast rather than guess.

---

## Duplicate detection is real, not a guess

Every uploaded file gets a SHA-256 checksum calculated from its contents. If you (or someone else on the account) try to upload the same file twice, the system recognises it immediately and tells you — including which existing session it matches and how many runs are in it — rather than silently creating a duplicate session or silently rejecting it with no explanation.

This is genuinely useful if you're not sure whether a session already made it in: just try uploading it again. If it's already there, you'll know exactly which one.

---

## What can actually go wrong

**Invalid JSON.** If the file can't be parsed at all — corrupted during copy, or not actually a session file — you'll get told plainly rather than a cryptic failure. Worth a re-copy from the SD card if this happens; it's usually a transfer issue, not a device issue.

**A run fails to import.** Occasionally one specific run within an otherwise-good session file will fail — the rest of the session still imports; the system tells you which run number had the problem rather than failing the whole upload silently.

**Server-side hiccup.** Rare, but if something goes wrong on the database side during import, you'll see an error rather than a session that looks uploaded but is actually incomplete.

None of these fail silently. If a session doesn't show up the way you expect, there's a message somewhere explaining why — that's a deliberate choice, because a partially-imported session with no explanation is worse than an honest error.

---

## Before you've filled in your profile

You'll notice a **Profile incomplete** nudge on this page if you haven't entered your weight, height, and bike details yet. You can upload and use the platform perfectly well without any of that — reaction time, G-force, and technique scoring all work regardless. What's gated behind a complete profile specifically is power estimation and the more detailed biomechanical analytics, because those calculations need real mass data to mean anything. Rather than show you a power number based on a guess, the system just doesn't show one until it has something real to work with.

---

_For upload errors not covered here, use the Help & Troubleshooting section, or the feedback button to report a bug directly._
