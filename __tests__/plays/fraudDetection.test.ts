import { detectSuspiciousPlay } from '../../functions/src/utils/fraudDetection';
import { FraudReason } from '../../functions/src/types'; // Import FraudReason type

describe('Fraud Detection', () => {
  describe('detectSuspiciousPlay', () => {
    const MOCKED_HASHED_IP = 'hashed-ip-address-123'; // Consistent hashed IP for tests

    it('should flag plays with insufficient duration (less than 20s)', () => {
      const play = {
        duration: 10000, // 10 seconds
        trackFullDurationMs: 120000, // 2 minutes
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: MOCKED_HASHED_IP,
        },
      };
      
      const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(true);
      expect(reasons).toContain('insufficient_listen_duration' as FraudReason);
      expect(fraudScore).toBe(1);
    });

    it('should flag plays with insufficient duration (less than 50% of track)', () => {
      const play = {
        duration: 30000, // 30 seconds
        trackFullDurationMs: 120000, // 2 minutes (50% is 60s)
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: MOCKED_HASHED_IP,
        },
      };
      
      const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(true);
      expect(reasons).toContain('insufficient_listen_duration' as FraudReason);
      expect(fraudScore).toBe(1);
    });

    it('should not flag plays with sufficient duration (more than 20s and 50%)', () => {
      const play = {
        duration: 70000, // 70 seconds
        trackFullDurationMs: 120000, // 2 minutes
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: MOCKED_HASHED_IP,
        },
      };
      
      const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(false);
      expect(reasons).toEqual([]);
      expect(fraudScore).toBe(0);
    });

    it('should flag bot user agents', () => {
      const play = {
        duration: 30000,
        trackFullDurationMs: 60000,
        deviceInfo: {
          userAgent: 'Googlebot/2.1',
          ipAddress: MOCKED_HASHED_IP,
        },
      };
      
      const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(true);
      expect(reasons).toContain('bot_user_agent' as FraudReason);
      expect(fraudScore).toBe(1);
    });

    it('should flag multiple fraud reasons', () => {
      const play = {
        duration: 5000, // 5 seconds
        trackFullDurationMs: 60000,
        deviceInfo: {
          userAgent: 'Botty/1.0',
          ipAddress: MOCKED_HASHED_IP,
        },
      };
      
      const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(true);
      expect(reasons).toContain('insufficient_listen_duration' as FraudReason);
      expect(reasons).toContain('bot_user_agent' as FraudReason);
      expect(fraudScore).toBe(1);
    });

    it('should not flag a legitimate play', () => {
      const play = {
        duration: 45000,
        trackFullDurationMs: 60000,
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          ipAddress: MOCKED_HASHED_IP,
        },
      };
      
      const { isSuspicious, reasons, fraudScore } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(false);
      expect(reasons).toEqual([]);
      expect(fraudScore).toBe(0);
    });
  });
});