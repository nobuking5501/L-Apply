// Import and re-export functions
// Note: Firebase Admin is initialized lazily in each function via ensureFirebaseInitialized()
import { apply as applyFn } from './apply-prod';
import { webhook as webhookFn } from './webhook-prod';
// Temporarily disable event triggers to fix deployment timeout
// import { onEventCreated as onEventCreatedFn, onEventDeleted as onEventDeletedFn } from './count-events-trigger';
// Temporarily disable remind and deliverSteps to simplify deployment
// import { remind as remindFn } from './remind-prod';
// import { deliverSteps as deliverStepsFn } from './deliver-steps-prod';

export const apply = applyFn;
export const webhook = webhookFn;
// export const onEventCreated = onEventCreatedFn;
// export const onEventDeleted = onEventDeletedFn;
// export const remind = remindFn;
// export const deliverSteps = deliverStepsFn;
