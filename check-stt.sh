#!/bin/bash
# Diagnostic script for Google Cloud Speech-to-Text issues

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== Google Cloud Speech-to-Text Diagnostic ===${NC}"
echo ""

# Check if gcp-credentials.json exists
echo -e "${YELLOW}1. Checking Google Cloud credentials file...${NC}"
if [ -f "gcp-credentials.json" ]; then
    echo -e "${GREEN}✓ gcp-credentials.json found${NC}"
    # Check if file is valid JSON
    if python3 -m json.tool gcp-credentials.json > /dev/null 2>&1; then
        echo -e "${GREEN}✓ JSON format is valid${NC}"
    else
        echo -e "${RED}✗ JSON format is invalid!${NC}"
    fi
else
    echo -e "${RED}✗ gcp-credentials.json NOT found!${NC}"
    echo "  Create it with your Google Cloud service account key"
fi

echo ""
echo -e "${YELLOW}2. Checking environment variables...${NC}"
if [ -f ".env" ]; then
    if grep -q "GOOGLE_APPLICATION_CREDENTIALS" .env; then
        echo -e "${GREEN}✓ GOOGLE_APPLICATION_CREDENTIALS is set in .env${NC}"
    else
        echo -e "${YELLOW}⚠ GOOGLE_APPLICATION_CREDENTIALS not found in .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
fi

echo ""
echo -e "${YELLOW}3. Checking backend logs for STT errors...${NC}"
if docker ps | grep -q ai_hr_backend; then
    echo "Last 20 STT-related log entries:"
    docker logs ai_hr_backend 2>&1 | grep -i "stt\|speech\|google" | tail -20
else
    echo -e "${RED}✗ Backend container is not running${NC}"
fi

echo ""
echo -e "${YELLOW}4. Testing backend STT WebSocket endpoint...${NC}"
SESSION_ID="test-diagnostic-$(date +%s)"
echo "Attempting to connect to ws://localhost:8000/ws/stt/$SESSION_ID"
timeout 3 wscat -c "ws://localhost:8000/ws/stt/$SESSION_ID" 2>&1 || echo "Connection test complete (expected timeout)"

echo ""
echo -e "${YELLOW}=== Recommendations ===${NC}"
echo ""
echo "If STT is not working:"
echo ""
echo "1. Verify Google Cloud credentials:"
echo "   - File exists: gcp-credentials.json"
echo "   - File is mounted in docker-compose.timeweb.yml"
echo "   - Service account has 'Cloud Speech-to-Text API' enabled"
echo ""
echo "2. Check backend logs for errors:"
echo "   docker logs ai_hr_backend --tail 100 | grep -i error"
echo ""
echo "3. Common issues:"
echo "   - Missing Google Cloud API key"
echo "   - Insufficient permissions on service account"
echo "   - Audio format mismatch (must be LINEAR16, 16kHz, mono)"
echo "   - Audio stream too slow (timeout if gaps > 5 seconds)"
echo ""
echo "4. Recent fixes (deploy to apply):"
echo "   - Reduced audio chunk size from 100ms to 50ms"
echo "   - Reduced buffer size from 4096 to 2048"
echo "   - Audio now streams faster to prevent timeout"
echo ""
