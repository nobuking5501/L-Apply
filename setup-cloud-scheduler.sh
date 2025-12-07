#!/bin/bash

# Cloud Scheduler setup script for L-Apply
# This script creates two Cloud Scheduler jobs for remind and deliverSteps functions

PROJECT_ID="l-apply"
REGION="asia-northeast1"
SERVICE_ACCOUNT="l-apply@appspot.gserviceaccount.com"

echo "Setting up Cloud Scheduler jobs for project: $PROJECT_ID"
echo ""

# Job 1: Remind Scheduler
echo "Creating remind-scheduler job..."
gcloud scheduler jobs create http remind-scheduler \
  --project=$PROJECT_ID \
  --location=$REGION \
  --schedule="*/5 * * * *" \
  --time-zone="Asia/Tokyo" \
  --uri="https://asia-northeast1-l-apply.cloudfunctions.net/remind" \
  --http-method=POST \
  --oidc-service-account-email=$SERVICE_ACCOUNT \
  --oidc-token-audience="https://asia-northeast1-l-apply.cloudfunctions.net/remind" \
  --description="Send reminder messages every 5 minutes"

if [ $? -eq 0 ]; then
  echo "✅ remind-scheduler created successfully"
else
  echo "⚠️  remind-scheduler already exists or failed to create"
fi

echo ""

# Job 2: Deliver Steps Scheduler
echo "Creating deliver-steps-scheduler job..."
gcloud scheduler jobs create http deliver-steps-scheduler \
  --project=$PROJECT_ID \
  --location=$REGION \
  --schedule="*/5 * * * *" \
  --time-zone="Asia/Tokyo" \
  --uri="https://asia-northeast1-l-apply.cloudfunctions.net/deliverSteps" \
  --http-method=POST \
  --oidc-service-account-email=$SERVICE_ACCOUNT \
  --oidc-token-audience="https://asia-northeast1-l-apply.cloudfunctions.net/deliverSteps" \
  --description="Deliver step messages every 5 minutes"

if [ $? -eq 0 ]; then
  echo "✅ deliver-steps-scheduler created successfully"
else
  echo "⚠️  deliver-steps-scheduler already exists or failed to create"
fi

echo ""
echo "Setup complete! You can view the jobs at:"
echo "https://console.cloud.google.com/cloudscheduler?project=$PROJECT_ID"
echo ""
echo "To manually trigger the jobs for testing:"
echo "  gcloud scheduler jobs run remind-scheduler --project=$PROJECT_ID --location=$REGION"
echo "  gcloud scheduler jobs run deliver-steps-scheduler --project=$PROJECT_ID --location=$REGION"
