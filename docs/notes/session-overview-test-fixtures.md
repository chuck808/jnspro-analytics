# Session overview test-fixture caveat

Synthetic database fixtures that insert `gate_runs` without realistic `chart_data` do not exercise the same physics-analysis path as real device-ingested sessions.

`analyseRun()` can return `physics: null` when `chart_data` is empty. Components that deliberately source peak speed from analysed physics (for example the Session Overview hero) can therefore omit peak speed in a synthetic fixture even when the raw `gate_runs.peak_speed_ms` value exists.

This is a fixture limitation, not proof of a production-data bug. If peak speed is missing on a real device-ingested session, investigate it normally rather than assuming this caveat applies.
