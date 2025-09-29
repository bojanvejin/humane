import { FraudReason } from '../types';

export interface PlayEventDataForDetection {
  duration: number; // ms played
  trackFullDurationMs: number; // full track duration
  deviceInfo: {
    userAgent: string;
    ipAddress: string; // Hashed IP
  };
}

export function detectSuspiciousPlay(play: PlayEventDataForDetection): { isSuspicious: boolean; reasons: FraudReason[]; fraudScore: number } {
  const reasons: FraudReason[] = [];
  let isSuspicious = false;
  let fraudScore = 0;

  // Rule 1: Minimum 20 seconds (20000ms) or 50% of track duration
  const minListenDurationMs = Math.min(20000, play.trackFullDurationMs * 0.5);
  if (play.duration < minListenDurationMs) {
    reasons.push('insufficient_listen_duration');
    isSuspicious = true;
  }

  // Rule 2: Bot user agent detection
  if (play.deviceInfo.userAgent.toLowerCase().includes('bot')) {
    reasons.push('bot_user_agent');
    isSuspicious = true;
  }

  if (isSuspicious) {
    fraudScore = 1;
  }

  return { isSuspicious, reasons, fraudScore };
}