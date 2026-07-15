# Help & Documentation — Worklist

Status snapshot from the inventory pass. Nothing here has been actioned yet — this is the punch list to work from.

---

## Fix

1. **Docs generator writes to the wrong file.** `scripts/generate-docs.py`'s `OUTPUT_FILE` is `src/lib/docs/content.ts` (no "s"), but every route imports from `contents.ts` (with the "s"). Editing a chapter markdown file and re-running the script will silently create a second, unused file instead of updating the live one — no error, just stale docs. One-line fix, but must happen before any chapter gets edited, or the edit will appear to do nothing.

---

## Decide, then add or remove

2. **Admin FAQ system has no public consumer.** `/admin/help-faqs` is a fully working CRUD panel backed by a real `help_faqs` table, but nothing anywhere reads from it for riders to see. Two options:
   - **Add** a public-facing FAQ page/section that queries `help_faqs` (published only), or
   - **Remove** the admin panel and table if the plan is to fold FAQs into the `/docs` chapters instead, rather than maintain two separate systems.

   Worth deciding this before writing any new FAQ content, since it determines where that content should even live.

---

## Add — missing coverage for features built this session

3. **No documentation exists for the video sync feature at all** (confirmed: zero mentions of "video" anywhere in `contents.ts`). Needs a chapter or a section within an existing one covering: attaching a video to a run, what the flash-sync does and why some clips fail to sync, the merged scrub bar, the HUD tiers, and that video is entirely optional/per-run.
4. **No documentation exists for the social/achievement share card** (zero mentions of "social" or "achievement"). Needs a short explainer: what triggers a card, why one doesn't appear every session (the "selective celebration" philosophy is worth surfacing to users, not just kept internal), and the privacy/sharing controls.

---

## Update — existing chapters likely stale against current UI

5. **"Your Session Data" chapter** describes the three-page layout (Overview / Analysis / Deep Dive) and where things live. Since the video hero moved from Deep Dive to Analysis, and the run-selector tag UI changed (only the selected run shows the full tag control now), this chapter's descriptions of those areas should be checked line-by-line against the current UI before publishing anything new, so it doesn't contradict itself.
6. **"Help & Troubleshooting" chapter** — worth a pass to confirm it references current features and doesn't point to anything that's moved or changed.

---

## Not investigated yet, flagging for awareness

- Whether the **contextual help buttons** (`helpContent.ts`, 32 topics × 3 rider levels) have any gaps for the newer features — I only confirmed the big docs chapters lack coverage, not this system.
- Whether `/about`, `/contact`, `/privacy`, `/terms` need any content updates now that video/social features exist (e.g., privacy policy mentioning video storage, social sharing data).
