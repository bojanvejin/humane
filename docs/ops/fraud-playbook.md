# Fraud Detection Playbook

## Suspicious Play Detection Rules

### Current Rules Implemented:
1.  **Minimum Duration**: Play duration must be at least 20 seconds (20000ms) or 50% of the track's full duration (whichever is smaller).
2.  **Bot Detection**: User agent string contains "bot" (case-insensitive).
3.  **Local IP**: IP address is `127.0.0.1` or `::1` (localhost).
4.  **Deduplication Window**: Plays of the same track by the same user within a window of `max(30s, track_duration / 4)` are marked as suspicious duplicates.

### Planned Enhancements:
1.  **Frequency Analysis**: Detect abnormal play frequencies per session/user.
2.  **Geographic Consistency**: Check for rapid geographic location changes.
3.  **Device Fingerprinting**: Track unique devices across sessions.
4.  **Pattern Recognition**: Machine learning for anomalous behavior.

### Response Actions:
-   **Suspicious plays**: Flagged and excluded from UCPS calculations.
-   **Repeat offenders**: Temporary account suspension.
-   **Confirmed fraud**: Permanent ban and payout withholding.

### Monitoring:
-   Daily review of suspicious play reports.
-   Monthly fraud analysis reports.
-   Real-time alerts for attack patterns.