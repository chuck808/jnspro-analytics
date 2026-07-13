# Help & Troubleshooting

---

## Where to actually go for what

This chapter is the catch-all — the stuff that doesn't belong to one specific page. If you're looking for something more specific, it's probably better answered elsewhere:

- Upload failing or a duplicate-file message → **Uploading Sessions**
- A chart or metric not showing up → **Your Session Data** (data quality section)
- Confused about a rating or threshold → the Help button right next to that specific chart, wherever you're looking at it

Everything below is genuinely general — account issues, data quality troubleshooting that spans multiple pages, and how to report something that's actually broken.

---

## "Why don't I see [metric]?"

The single most common source of confusion, and it's almost always one of these:

**Speed, power, or efficiency numbers missing.** These are calculated metrics, not direct sensor readings, and the system won't show a calculation it doesn't trust. Check the data quality badge on that run — if it says the analytics aren't valid, that's the firmware itself flagging the underlying data as unreliable, not the app being overly cautious for no reason.

**Power specifically missing.** This one's simple: it needs your weight and bike weight from your profile. No mass data, no power estimate — because a power number built on a guessed weight is worse than no number at all.

**Trend charts not appearing on Analytics.** You need at least 3 sessions logged before any trend line will show, and the deeper Insights-tab charts need 5. This is a floor, not a bug — a "trend" built from one or two data points isn't a trend.

**Speed numbers that feel off.** If you don't have the breakbeam timing module, speed is *estimated* from IMU integration, not measured directly. Check the bias correction value — under 0.5 m/s² is trustworthy, above 3.0 m/s² means treat that run's speed figures as rough at best. High bias correction almost always means the device wasn't calibrated properly, or wasn't mounted securely, before that specific run.

---

## Account & access

**Signed in but the app feels stuck in a loop.** This is almost always a stale session — sign out fully, close the tab, and sign back in fresh rather than just refreshing.

**Under-18 accounts and parental consent.** Accounts belonging to minors require a parent or guardian to confirm (or explicitly decline) consent before the account can be used — this is a hard gate, not a formality, and the account stays locked until it's resolved. If you're stuck at a consent screen, that's exactly what's happening; it's not an error.

**Forgotten password.** Use the "Forgot password?" link on the sign-in page rather than creating a second account — a second account starts you from zero, with none of your session history attached.

---

## When something's actually broken

Use the feedback button — the small chat icon that follows you around the app — and describe what happened. A good bug report includes what you were trying to do, what you expected, what actually happened, and whether it's happened every time or just once. That last one matters more than it sounds like it should: a one-off glitch and a consistent, repeatable bug get triaged completely differently.

If it's specifically an upload problem, mention roughly when the session was recorded and what the device settings were (distance, recording window, breakbeam fitted or not) — that context usually gets to the actual cause faster than the error message alone.

---

## The honesty principle behind all of this

If you take one thing from this chapter: this system would rather show you nothing than show you something confidently wrong. Every "missing" metric, every data-quality warning, every low-confidence label is the same underlying decision applied consistently — a gap you can question is more useful than a number you can't trust. If something looks like it's being unnecessarily withheld, there's very likely a real reason sitting just underneath it, and it's almost always explained in the data quality section of whichever page you're on.
