// Only export the functions you actually want deployed/emulated
export * from './ping';
export * from './plays/reportPlayBatch';
export * from './plays/materializeRaw';
export * from './stripe/webhooks';
export * from './stripe/connect';
export * from './tracks/processTrackUpload';
export * from './payouts/calculateUCPSPayouts';
export * from './auth/onCreate'; // Export the new function