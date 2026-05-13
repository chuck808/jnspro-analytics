# Help and Troubleshooting

---

## Start Here

Most problems fall into one of these categories. Find yours and go to the relevant section.

**Upload problems** — see the Upload chapter. It covers every error message, what caused it, and what to do about it.

**Numbers look wrong** — check your profile first. Missing weight data means no power calculations. Wrong rider level means miscalibrated technique scores. The Profile chapter explains what each field affects.

**Something looks right in one place and wrong in another** — the dashboard shows all-time bests, Analytics shows trends, individual sessions show run-level detail. They're calculating different things and they're supposed to look different. The chapters for each page explain what each one shows.

**Features are missing or showing N/A** — usually a profile completeness issue. Power needs rider weight and bike weight. Age-group analytics need a date of birth. Speed suppression happens when the firmware flags a run as unreliable. Check the relevant chapter for what each feature requires.

**Can't log in** — see the account section below.

**Something is broken that should work** — see the bug reporting section below.

---

## Common Problems

### Sessions

**I uploaded a session but can't find it.** Sessions sort by when they were recorded (the device timestamp), not when you uploaded them. If your device clock was wrong, or you uploaded an old session, it'll appear sorted by its actual date rather than at the top of the list. Use the date filter to search, or click the "View Session" link on the upload success screen before navigating away.

**A session shows in the list but clicking it gives an error.** Try navigating to it from the Sessions list rather than a direct URL or bookmark. If the problem persists, the session record may be corrupted — contact support.

**Some runs are missing from a session.** Check the upload success screen — timeseries warnings don't remove runs, they only affect orientation data. If core runs are missing, they weren't in the file. The firmware didn't record them, and upload can't create data that doesn't exist.

### Data

**Reaction times show as thousands of milliseconds.** The firmware is writing reaction time in milliseconds instead of seconds, then the upload system multiplies by 1000 again. This is a firmware bug. Update the firmware and re-upload.

**Speed shows as N/A or is clearly wrong.** The firmware flagged those analytics as unreliable — high bias correction, insufficient data, or sensor error. Speed gets suppressed rather than showing numbers that can't be trusted. Reaction time and G-force still work. See the Session chapter for what the bias correction value tells you.

**Power shows N/A.** Both rider weight and bike weight need to be set in your profile. One without the other isn't enough. Set both, then refresh the session page.

**G-force chart has spikes or jumps.** Usually sensor noise, a device movement during the run, or an SD card write error creating gaps. If a run looks clearly corrupt, archive it — it won't help your analytics and it can set false personal bests on the dashboard.

### Account

**Can't log in despite correct password.** Try copy-pasting rather than typing. Try a different browser. Clear cache and cookies. Use "Forgot password" if you're not certain the password is right.

**Keeps logging you out.** Session tokens expire after about 30 days. Log back in — your data is safe. If it's happening much more frequently, check whether your browser is blocking cookies.

**Settings won't save.** The platform doesn't auto-save. Make sure you're clicking Save and watching for error messages. If saves consistently fail, try a different browser.

### Performance

**Platform is slow.** Large sessions with full timeseries data take longer to process and render. Charts in particular are GPU-dependent — older or lower-powered devices will struggle. Try on a desktop or laptop if you're on mobile. Closing other browser tabs helps.

**Upload times out.** Session files with many runs and full timeseries can be several megabytes and take 20–30 seconds on a slow connection. Try again, or try on a faster connection. If it consistently times out, contact support.

**Charts don't appear.** Check that JavaScript is enabled and that browser extensions (particularly ad blockers) aren't interfering with Canvas rendering. Try incognito mode to isolate the issue.

---

## If Everything Seems Broken

Work through this in order:

1. **Try incognito or private browsing mode.** If it works there, the issue is a browser extension, cached data, or a cookie. Clear cache, or disable extensions one by one to find the culprit.

2. **Try a different browser.** Chrome tends to work best. Firefox is a reliable second. If switching browser fixes it, your original browser has a configuration issue.

3. **Try a different device.** Desktop vs laptop vs mobile. If it works on one but not another, the issue is device-specific.

4. **Check your internet connection.** Try other websites. Restart your router. Try a mobile hotspot.

5. **Contact support.** If none of the above helps, something is wrong with the platform or your account specifically.

---

## Reporting a Bug

A bug is something that should work but doesn't. A feature request is something that doesn't exist but you wish it did. Both are welcome, but they go through different processes.

When reporting a bug, include:
- What you were trying to do
- What you expected to happen
- What actually happened
- Your browser and operating system
- Whether it happens every time or just occasionally

The more specific you are, the faster it gets resolved. "Upload is broken" is hard to act on. "Upload fails with 'Failed to insert run 3' error on sessions with more than 5 runs, using Chrome on Windows 11" is actionable.

Don't include your actual session files in bug reports — they contain your performance data and are private. If support needs a file to diagnose something, they'll ask for it specifically.

Use the feedback button on whichever page the issue occurred. It captures the page context automatically, which helps with diagnosis.

---

## When to Contact Support

Try the self-service options first — check the relevant chapter, refresh the page, try a different browser. Most things resolve with basic troubleshooting.

Contact support when:
- You can't log in and the password reset isn't working
- You've lost access to your two-factor authentication device
- You uploaded sessions and the data looks corrupted or lost
- A bug persists after you've tried basic troubleshooting
- You have a privacy concern — something visible that shouldn't be
- You want to delete your account and can't find the option

Support typically responds within one to two business days. For account access or data loss issues, same-day response where possible.

Email support@appgatepro.com, or use the in-app feedback button.

---

## Browser Console Errors

If support asks you to check the browser console: press F12 (or Cmd+Option+I on Mac), click the Console tab, reproduce the issue, and screenshot any red error messages. You don't need to understand what they say — support will interpret them.

The most common ones and what they mean:

**"Failed to fetch" or "Network error"** — your connection dropped, or the server is temporarily unreachable.

**"401 Unauthorized"** — your session expired. Log in again.

**"404 Not Found"** — the page or resource doesn't exist at that URL. Usually a broken link or deleted content.

**"500 Internal Server Error"** — something went wrong on the server side. Not your fault. Report it.

---

## Quick Answers

**Can I upload sessions out of order?** Yes — they sort by device timestamp regardless of upload order.

**Can I re-upload the same file?** Yes — each upload creates a new session. If you accidentally deleted one, re-upload the file and archive the duplicate.

**Does upload modify my SD card?** No — the file is read but never touched.

**Can I share a session with my coach?** Export it as CSV and send the file. There's no built-in sharing — sessions are private by default.

**What happens if I stop using the platform?** Your data stays in your account indefinitely. Nothing expires or gets deleted unless you delete it yourself.

**Can I use it on mobile?** Yes, but the platform is designed desktop-first. Charts in particular are easier to read on a larger screen. Upload works fine on mobile.

---

*If your problem isn't covered here, use the feedback button on the relevant page or email support@appgatepro.com.*
