#!/bin/bash
# Script to monitor environment status and alert when it's ready

echo "Monitoring environment status. Press Ctrl+C to stop."
echo "Waiting for environment to be in 'Ready' state..."
echo ""

while true; do
  STATUS=$(eb status 2>/dev/null | grep "Status:" | awk '{print $2}')
  
  if [ "$STATUS" = "Ready" ]; then
    echo ""
    echo "✅ Environment is now Ready!"
    echo "You can now run: ./set-env-and-deploy.sh"
    break
  elif [ "$STATUS" = "Updating" ]; then
    echo -n "."
    sleep 10
  else
    echo ""
    echo "Current status: $STATUS"
    sleep 10
  fi
done

