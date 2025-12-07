// Import and re-export functions
// Note: Firebase Admin is initialized lazily in each function via ensureFirebaseInitialized()
import { apply as applyFn } from './apply-prod';
import { webhook as webhookFn } from './webhook-prod';
import { remind as remindFn } from './remind-prod';
import { deliverSteps as deliverStepsFn } from './deliver-steps-prod';

export const apply = applyFn;
export const webhook = webhookFn;
export const remind = remindFn;
export const deliverSteps = deliverStepsFn;
