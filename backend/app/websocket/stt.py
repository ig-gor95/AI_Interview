"""WebSocket handler for streaming speech-to-text (Google Cloud)."""
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from app.config import settings
from app.services.speech_to_text_service import StreamingSpeechToText, create_streaming_stt
from app.services.transcript_enhancer import enhance_transcript_fast, should_enhance
from app.services.stt_metrics import stt_metrics

_STT_LOG_PREFIX = "[STT-WS]"


async def handle_stt_websocket(websocket: WebSocket, session_id: str) -> None:
    """
    Accept binary audio (LINEAR16, 16kHz, mono) and send JSON:
    { "type": "interim"|"final", "text": "..." } or { "type": "error", "message": "..." }.
    """
    print(f"{_STT_LOG_PREFIX} session_id={session_id} connect")
    await websocket.accept()

    # Track session start for metrics
    stt_metrics.track_session_start(session_id)

    stt = create_streaming_stt(getattr(settings, "google_application_credentials", None))
    if not stt:
        print(f"{_STT_LOG_PREFIX} session_id={session_id} Speech-to-Text not available (google-cloud-speech or credentials)")
        await websocket.send_json({"type": "error", "message": "Speech-to-Text not available"})
        await websocket.close()
        return

    stt.start()
    print(f"{_STT_LOG_PREFIX} session_id={session_id} streaming started (ru-RU + en-US)")
    result_task: asyncio.Task | None = None
    loop = asyncio.get_event_loop()
    chunk_count = 0

    async def send_results() -> None:
        result_count = 0
        while True:
            try:
                result = await loop.run_in_executor(None, lambda: stt._result_queue.get())
            except Exception as e:
                print(f"{_STT_LOG_PREFIX} session_id={session_id} result_task get error: {e}")
                break
            kind, text = result
            if kind is None:
                print(f"{_STT_LOG_PREFIX} session_id={session_id} stream end, results_sent={result_count}")
                break
            if kind == "error":
                print(f"{_STT_LOG_PREFIX} session_id={session_id} error -> client: {text[:200]}")
                await websocket.send_json({"type": "error", "message": text})
                break

            # Enhance transcript (только для final results, не тормозит interim)
            enhanced_text = text
            was_enhanced = False
            if should_enhance(text, is_final=(kind == "final")):
                enhanced_text = enhance_transcript_fast(text)
                was_enhanced = (enhanced_text != text)
                if was_enhanced:
                    # Логируем только когда есть изменения
                    print(f"{_STT_LOG_PREFIX} session_id={session_id} enhanced: {text[:40]!r} -> {enhanced_text[:40]!r}")

            # Track metrics
            stt_metrics.track_result(
                session_id=session_id,
                kind=kind,
                text_length=len(enhanced_text),
                was_enhanced=was_enhanced
            )

            result_count += 1
            preview = (enhanced_text[:60] + "…") if len(enhanced_text) > 60 else enhanced_text
            if result_count <= 3 or kind == "final" or result_count % 10 == 0:
                print(f"{_STT_LOG_PREFIX} session_id={session_id} -> {kind}: {preview!r}")
            await websocket.send_json({"type": kind, "text": enhanced_text})

    try:
        result_task = asyncio.create_task(send_results())
        while True:
            msg = await websocket.receive()
            if "bytes" in msg and msg["bytes"]:
                data = msg["bytes"]
                stt.add_audio(data)
                chunk_count += 1
                if chunk_count == 1:
                    print(f"{_STT_LOG_PREFIX} session_id={session_id} first audio chunk, len={len(data)}")
                elif chunk_count % 50 == 0:
                    print(f"{_STT_LOG_PREFIX} session_id={session_id} audio chunks received={chunk_count}")
            if msg.get("text") == "stop":
                print(f"{_STT_LOG_PREFIX} session_id={session_id} client sent stop, chunks={chunk_count}")
                break
    except WebSocketDisconnect:
        print(f"{_STT_LOG_PREFIX} session_id={session_id} client disconnected, chunks={chunk_count}")
    except Exception as e:
        print(f"{_STT_LOG_PREFIX} session_id={session_id} receive error: {e}")
    finally:
        stt.stop()
        if result_task:
            result_task.cancel()
            try:
                await result_task
            except asyncio.CancelledError:
                pass
        stt.join(timeout=2.0)

        # Log session metrics summary
        stt_metrics.log_session_summary(session_id)

        print(f"{_STT_LOG_PREFIX} session_id={session_id} closed")
