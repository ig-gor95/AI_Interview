#!/bin/bash
# Force stop hung containers

echo "Checking container status..."
docker ps -a | grep -E "ai_hr_|ai_interview_"

echo ""
echo "Force stopping all project containers..."
docker ps -a | grep -E "ai_hr_|ai_interview_" | awk '{print $1}' | xargs -r docker stop -t 5 2>/dev/null || true

echo ""
echo "Force killing if still running..."
docker ps -a | grep -E "ai_hr_|ai_interview_" | awk '{print $1}' | xargs -r docker kill 2>/dev/null || true

echo ""
echo "Removing stopped containers..."
docker ps -a | grep -E "ai_hr_|ai_interview_" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

echo ""
echo "Done! Now you can run ./deploy.sh again"
