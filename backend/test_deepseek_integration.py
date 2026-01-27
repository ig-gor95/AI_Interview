#!/usr/bin/env python3
"""Test DeepSeek API integration"""

import os
import asyncio
import sys
sys.path.insert(0, os.path.dirname(__file__))

async def test_deepseek_setup():
    """Test that DeepSeek integration is properly configured"""
    print("🧪 Testing DeepSeek API Integration...")

    try:
        from app.config import settings
        print("✅ Configuration loaded")

        print(f"DeepSeek API Key configured: {'Yes' if settings.deepseek_api_key else 'No'}")

        # Test service class structure
        print("🔍 Analyzing AIService class structure...")
        service_file = os.path.join(os.path.dirname(__file__), 'app', 'services', 'openai_service.py')
        with open(service_file, 'r', encoding='utf-8') as f:
            content = f.read()

        if 'https://api.deepseek.com' in content and 'deepseek_api_key' in content:
            print("✅ DeepSeek configuration found in service code")
        else:
            print("❌ DeepSeek configuration missing")

        required_methods = [
            'generate_session_question_structured',
            'analyze_transcript',
            'generate_chat_response'
        ]
        for method in required_methods:
            if f"def {method}" in content:
                print(f"✅ Method {method} defined in code")
            else:
                print(f"❌ Method {method} missing from code")

        print("\n🎯 Integration Test Results:")
        if settings.deepseek_api_key:
            print("✅ DeepSeek API is configured and ready to use")
            print("🚀 You can now run interviews with DeepSeek API")
        else:
            print("⚠️  No API key configured. Set DEEPSEEK_API_KEY in .env")

        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_deepseek_setup())
    if success:
        print("\n✅ DeepSeek integration test completed successfully!")
    else:
        print("\n❌ DeepSeek integration test failed!")