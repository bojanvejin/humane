import { detectSuspiciousPlay, checkFraudReasons } from '../../functions/src/plays/reportPlayBatch';

describe('Fraud Detection', () => {
  describe('detectSuspiciousPlay', () => {
    it('should flag plays with insufficient duration', () => {
      const play = {
        duration: 10, // Less than 20 seconds
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
        },
      };
      
      expect(detectSuspiciousPlay(play)).toBe(true);
    });

    it('should not flag plays with sufficient duration', () => {
      const play = {
        duration: 30, // More than 20 seconds
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '192.168.1.1',
        },
      };
      
      expect(detectSuspiciousPlay(play)).toBe(false);
    });

    it('should flag bot user agents', () => {
      const play = {
        duration: 30,
        deviceInfo: {
          userAgent: 'Googlebot/2.1',
          ipAddress: '192.168.1.1',
        },
      };
      
      expect(detectSuspiciousPlay(play)).toBe(true);
    });

    it('should flag local IP addresses', () => {
      const play = {
        duration: 30,
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          ipAddress: '127.0.0.1',
        },
      };
      
      expect(detectSuspiciousPlay(play)).toBe(true);
    });
  });

  describe('checkFraudReasons', () => {
    it('should return correct fraud reasons', () => {
      const play = {
        duration: 10,
        deviceInfo: {
          userAgent: 'Googlebot/2.1',
          ipAddress: '127.0.0.1',
        },
      };
      
      const reasons = checkFraudReasons(play);
      expect(reasons).toContain('insufficient_listen_duration');
      expect(reasons).toContain('bot_user_agent');
      expect(reasons).toContain('local_ip_address');
    });
  });
});