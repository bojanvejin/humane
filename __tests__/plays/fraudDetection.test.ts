import { detectSuspiciousPlay } from '../../functions/src/plays/reportPlayBatch';

describe('Fraud Detection', () => {
  describe('detectSuspiciousPlay', () => {
    it('should flag plays with insufficient duration (less than 20s)', () => {
      const play = {
        duration: 10000, // 10 seconds
        trackFullDurationMs: 120000, // 2 minutes
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
        },
      };
      
      const { isSuspicious, reasons } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(true);
      expect(reasons).toContain('insufficient_listen_duration');
    });

    it('should flag plays with insufficient duration (less than 50% of track)', () => {
      const play = {
        duration: 30000, // 30 seconds
        trackFullDurationMs: 120000, // 2 minutes (50% is 60s)
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
        },
      };
      
      const { isSuspicious, reasons } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(true);
      expect(reasons).toContain('insufficient_listen_duration');
    });

    it('should not flag plays with sufficient duration (more than 20s and 50%)', () => {
      const play = {
        duration: 70000, // 70 seconds
        trackFullDurationMs: 120000, // 2 minutes
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
        },
      };
      
      const { isSuspicious, reasons } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(false);
      expect(reasons).not.toContain('insufficient_listen_duration');
    });

    it('should flag bot user agents', () => {
      const play = {
        duration: 30000,
        trackFullDurationMs: 60000,
        deviceInfo: {
          userAgent: 'Googlebot/2.1',
          ipAddress: '192.168.1.1',
        },
      };
      
      const { isSuspicious, reasons } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(true);
      expect(reasons).toContain('bot_user_agent');
    });

    it('should flag local IP addresses', () => {
      const play = {
        duration: 30000,
        trackFullDurationMs: 60000,
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '127.0.0.1',
        },
      };
      
      const { isSuspicious, reasons } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(true);
      expect(reasons).toContain('local_ip_address');
    });

    it('should flag multiple fraud reasons', () => {
      const play = {
        duration: 5000, // 5 seconds
        trackFullDurationMs: 60000,
        deviceInfo: {
          userAgent: 'Botty/1.0',
          ipAddress: '127.0.0.1',
        },
      };
      
      const { isSuspicious, reasons } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(true);
      expect(reasons).toContain('insufficient_listen_duration');
      expect(reasons).toContain('bot_user_agent');
      expect(reasons).toContain('local_ip_address');
    });

    it('should not flag a legitimate play', () => {
      const play = {
        duration: 45000,
        trackFullDurationMs: 60000,
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          ipAddress: '203.0.113.45',
        },
      };
      
      const { isSuspicious, reasons } = detectSuspiciousPlay(play);
      expect(isSuspicious).toBe(false);
      expect(reasons).toEqual([]);
    });
  });
});