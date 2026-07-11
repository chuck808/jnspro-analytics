# Profile and Bike Setup

---

## Why This Matters

You can use the analytics platform without filling in your profile. You'll see reaction times, G-force charts, and basic metrics. But several things only work when the system knows more about you and your equipment.

Power calculations need your weight and bike weight — without both, the physics doesn't have enough information to work with. Technique scoring calibrates against your declared rider level — without it, the system uses generic intermediate benchmarks that might not be appropriate for where you actually are. Age-group analytics need your date of birth. Biomechanical calculations benefit from crank length.

Think of your profile as calibration. The sensor records what happened. Your profile tells the system how to interpret those measurements in physically meaningful terms.

---

## Your Rider Profile

### Weight

The single most important field for unlocking analytics. Power is calculated as force times velocity, and force is mass times acceleration. Without your body weight, the maths doesn't work. Power features simply don't appear until this is filled in.

Enter your weight in kilograms, to the nearest kg. Your weight fluctuates day to day — don't obsess over updating after every meal. Update it when it changes meaningfully and stays there (more than 2–3kg).

One thing worth knowing: power is proportional to mass. If you gain 5kg, your power estimates will increase for the same acceleration. That's correct — a heavier rider producing the same acceleration is actually generating more force. The system accounts for this properly.

### Height

Used in some biomechanical calculations. Enter it in centimetres. If you're used to feet and inches, convert first — 5'9" is 175cm, not 5.9. Entering your height in feet will tell the system you're about the size of a large house cat, which won't produce useful biomechanics.

### Date of Birth

Used for two things: calculating your UCI category automatically (it updates as you age, so your category might change mid-season), and enabling age-group filtering on the leaderboard. Your exact age is never shown publicly — only your age bracket (e.g., 26–35).

### Rider Level

This calibrates what "excellent," "good," and "needs work" mean for your technique scores. A 0.28 second reaction time is excellent for a novice and needs work for an elite rider. Setting this wrong makes your scores either falsely encouraging or needlessly harsh.

The options are Novice (new to gate starts, under six months training), Intermediate (regular club training, six months to two years), Expert (competitive regional or national level), and Elite (professional or international level).

Be honest about where you actually are. The system doesn't care about your ambitions — it needs accurate calibration to give you useful feedback. If in doubt, go one level lower rather than higher. You can always update it when you move up.

If you don't set a rider level, the system defaults to Intermediate.

### Sex

Tracked but not currently used heavily in analytics. Planned for future sex-specific performance benchmarking.

### Display Name

This is what appears on the leaderboard if you opt in. Everything else in your profile is private — this is the only thing that can become public. Either leave it blank (the system uses your first name) or set something you're comfortable having visible.

---

## Bike Setup

The system supports multiple bikes, but only one is active at a time. When you upload a session, it automatically links to whichever bike is currently active. Sessions stay linked to the bike that was active when they were uploaded — they don't retroactively switch if you change your active bike later.

### Bike Weight

Required for power calculations alongside your body weight. The system adds rider weight and bike weight together as total system mass. Both are needed — one without the other isn't enough.

Weigh yourself holding the bike, then weigh yourself without it, and subtract. Or use a luggage scale. Enter the result in kilograms.

Typical BMX bikes are 9–12kg. If you're getting a number significantly outside that range, double-check the measurement.

### Crank Length

The length of your crank arms in millimetres, usually stamped on the back of the crank. Used in kinematic calculations — pedal velocity, hip and knee angle estimates. It contributes to biomechanical analysis accuracy but doesn't affect core metrics like reaction time, G-force, or speed.

Common values: 140–155mm for youth and small frames, 165–170mm for juniors and women, 175mm for most adult men (the most common value by far), 180mm for cruiser or tall riders.

If you don't know and can't check, 175mm is the most statistically likely value for an adult rider. But measuring is better.

### Chainring and Sprocket

The number of teeth on your front chainring and rear sprocket. The system uses these to calculate your gear ratio (chainring ÷ sprocket), which feeds into pedal cadence estimates and gear development calculations.

Count the teeth or look for the number stamped on the components. Common chainring sizes are 41–45 teeth, common sprocket sizes are 13–18 teeth.

### Tyres

You can select your front and rear tyres from a library of common BMX tyres with their actual measured diameters. This enables wheel rollout calculations and gear development (rollout × gear ratio). If your exact tyre isn't in the library, pick the closest match by size, or enter a custom wheel diameter if you've measured yours.

If you're not interested in gear development metrics, you can skip tyre setup entirely. Speed and distance calculations come from the IMU, not wheel rotation, so they work without tyre data.

### Notes

A free-text field for anything you want to track — "new chain fitted March 2024," "lowered front end," "setup for indoor track." For your reference only, not used in calculations.

---

## Multiple Bikes

If you train on one bike and race on another, or you're experimenting with different setups, you can add multiple bikes and switch between them. Set up each bike with its own details, and the most recently saved one becomes active. Newly uploaded sessions will link to the current active bike.

This lets you compare performance across different equipment setups, keep accurate power calculations for each bike's weight, and maintain a historical record of what you were riding when.

If you update a bike's weight after uploading sessions with it, those sessions will use the updated weight next time you view them. This is usually a correction that makes historical data more accurate, but it means your historical power numbers can change retroactively if you fix an error. Worth knowing if you're tracking records.

---

## Common Mistakes

**Setting rider level too high.** If you set Elite when you're actually Intermediate, your technique scores will look terrible because they're being compared against Elite benchmarks. Be honest — the system works better with accurate calibration than flattering calibration.

**Leaving weight blank until you've lost some.** Power calculations need your actual weight right now, not your target weight. Enter what you actually weigh or leave it blank and accept that power features won't appear.

**Forgetting to update after equipment changes.** Changed cranks from 175mm to 180mm but forgot to update the profile? The biomechanical calculations are still using the old value. Update equipment fields when you change equipment.

**Entering height in feet and inches.** The system uses centimetres. 5'9" is 175cm, not 5.9. Convert before you enter.

**Putting combined mass in one field.** Bike weight goes in the bike section. Rider weight goes in biometrics. The system adds them together — if you put your combined mass in either field, the maths will be wrong.

---

## What's Sensitive to Profile Errors

Power calculations are directly proportional to mass. A 5% error in total mass creates a 5% error in estimated power. If your combined rider and bike weight is off by 5kg, your power readings will be off by a similar proportion across every session.

Technique scores are sensitive to rider level. Getting this wrong affects how every session is interpreted.

Biomechanical analysis is sensitive to crank length — a 10mm error affects pedal velocity and kinematic estimates noticeably.

Reaction time doesn't use any profile data. It's a pure sensor measurement.

G-force doesn't use profile data in any way that affects the raw values.

Speed from IMU integration doesn't depend on weight or bike configuration.

---

## Privacy

Everything in your profile is private. Your weight, height, date of birth, club, team, bike details — none of it is visible to other users or anyone else.

The only exception is your display name, which becomes visible on the leaderboard if you opt in. Your age group (not your exact age) becomes inferable from age-group leaderboard filters if you opt in and that filter is active.

When you export session data to CSV, the export includes your name and weight (used in the power calculations shown in the export). That file lives on your computer — the platform doesn't send your profile data anywhere automatically.

---

_For help with specific profile fields, use the Help section on the profile page._
