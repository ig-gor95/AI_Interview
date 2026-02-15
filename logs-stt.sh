#!/bin/bash
# Show real-time STT logs from backend

echo "=== Live STT logs from backend ==="
echo "Press Ctrl+C to stop"
echo ""
echo "What to look for:"
echo "  ✓ [STT-WS] connect - Client connected"
echo "  ✓ [STT-WS] streaming started - Google STT started"
echo "  ✓ [STT] Google -> final: \"...\" - Text recognized"
echo "  ✗ [STT] streaming_recognize error - Google error"
echo "  ✗ Speech-to-Text not available - No credentials"
echo ""

docker logs -f ai_hr_backend 2>&1 | grep --line-buffered -i "stt\|speech\|google"
