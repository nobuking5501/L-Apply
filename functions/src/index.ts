// Import and re-export functions
// Note: Firebase Admin is initialized lazily in each function via ensureFirebaseInitialized()
import { apply as applyFn } from './apply-prod';
import { webhook as webhookFn } from './webhook-prod';
import { remind as remindFn } from './remind-prod';
import { deliverSteps as deliverStepsFn } from './deliver-steps-prod';
// Temporarily disable event triggers to fix deployment timeout
// import { onEventCreated as onEventCreatedFn, onEventDeleted as onEventDeletedFn } from './count-events-trigger';

export const apply = applyFn;
export const webhook = webhookFn;
export const remind = remindFn;
export const deliverSteps = deliverStepsFn;
// export const onEventCreated = onEventCreatedFn;
// export const onEventDeleted = onEventDeletedFn;
