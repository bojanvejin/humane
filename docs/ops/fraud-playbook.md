# Fraud Detection Playbook

## Suspicious Play Detection Rules

### Current Rules Implemented:
1. **Minimum Duration**: 20 seconds or 50% of track duration (whichever is smaller)
2. **Bot Detection**: User agent contains "bot"
3. **Local IP**: IP address is 127.0.0.1 (localhost)

### Planned Enhancements:
1. **Frequency Analysis**: Detect abnormal play frequencies per session
2. **Geographic Consistency**: Check for rapid geographic location changes
3. **Device Fingerprinting**: Track unique devices across sessions
4. **Pattern Recognition**: Machine learning for anomalous behavior

### Response Actions:
- **Suspicious plays**: Flagged and excluded from UCPS calculations
- **Repeat offenders**: Temporary account suspension
- **Confirmed fraud**: Permanent ban and payout withholding

### Monitoring:
- Daily review of suspicious play reports
- Monthly fraud analysis reports
- Real-time alerts for attack patterns