# Fraud Detection Playbook

## Suspicious Play Detection Rules

### Current Rules Implemented:
1.  **Minimum Duration (`insufficient_listen_duration`)**: Play duration must be at least 20 seconds (20000ms) or 50% of the track's full duration (whichever is smaller).
2.  **Bot Detection (`bot_user_agent`)**: User agent string contains "bot" (case-insensitive).
3.  **Deduplication Window (`duplicate_play_within_window`)**: Plays of the same track by the same user within a window of `max(30s, track_duration / 4)` are marked as suspicious duplicates. This is handled in the `materializeRaw` Cloud Function using a `userTrackAgg` document.
4.  **Track Not Found (`track_not_found`)**: If the track referenced in a raw play event cannot be found in the `/tracks` collection, the play is marked as suspicious.

### Planned Enhancements:
1.  **Frequency Analysis (`new_user_burst`)**: Detect abnormal play frequencies per session/user, especially for new users.
2.  **Geographic Consistency (`ip_cluster`)**: Check for rapid geographic location changes based on IP address.
3.  **Device Fingerprinting (`device_multiple_accounts`)**: Track unique devices across sessions and identify if a single device is associated with multiple accounts.
4.  **Pattern Recognition**: Machine learning for anomalous behavior.

### Response Actions:
-   **Suspicious plays**: Flagged with `suspicious: true`, `fraudReasons` (normalized codes), and `fraudScore` (0-1). These plays are excluded from UCPS calculations.
-   **Repeat offenders**: Temporary account suspension.
-   **Confirmed fraud**: Permanent ban and payout withholding.

### Monitoring:
-   Daily review of suspicious play reports.
-   Monthly fraud analysis reports.
-   Real-time alerts for attack patterns.