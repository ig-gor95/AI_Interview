"""Google Cloud Speech-to-Text streaming service for Russian + English (mixed) recognition."""
import queue
import threading
from typing import Optional, Generator, Tuple, Callable

try:
    from google.cloud import speech
    from google.oauth2 import service_account
except ImportError:
    speech = None
    service_account = None

_STT_LOG_PREFIX = "[STT]"

# Audio format expected by Google: LINEAR16, 16 kHz, mono
SAMPLE_RATE_HZ = 16000
# Chunk ~100 ms
CHUNK_BYTES = int(SAMPLE_RATE_HZ * 0.1 * 2)  # 3200 bytes


def _audio_generator(audio_queue: queue.Queue) -> Generator[bytes, None, None]:
    """Yield audio chunks from queue until None is put."""
    while True:
        chunk = audio_queue.get()
        if chunk is None:
            return
        yield chunk


def _run_streaming_recognize(
    credentials_path: Optional[str],
    audio_queue: queue.Queue,
    result_queue: queue.Queue,
) -> None:
    """Run blocking streaming recognize; put (is_final, transcript) into result_queue."""
    if speech is None or service_account is None:
        print(f"{_STT_LOG_PREFIX} google-cloud-speech not installed")
        result_queue.put(("error", "google-cloud-speech not installed"))
        return
    try:
        creds_msg = f"credentials={credentials_path!r}" if credentials_path else "default credentials"
        print(f"{_STT_LOG_PREFIX} streaming_recognize start ({creds_msg}, ru-RU + en-US)")
        if credentials_path:
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            client = speech.SpeechClient(credentials=credentials)
        else:
            client = speech.SpeechClient()

        # Speech context hints - список часто используемых технических терминов
        # Это помогает Google Cloud Speech лучше распознавать специфические слова
        speech_contexts = [
            speech.SpeechContext(
                phrases=[
                    # Design & Collaboration tools
                    "Figma", "Sketch", "Adobe XD", "InVision", "Miro", "Notion",
                    # Project Management
                    "Jira", "Trello", "Asana", "Monday", "ClickUp", "Confluence",
                    # Development tools
                    "GitHub", "GitLab", "Bitbucket", "Docker", "Kubernetes",
                    # Frameworks & Libraries
                    "React", "Vue", "Angular", "Next.js", "Nuxt", "Redux",
                    "TypeScript", "JavaScript", "Python", "Java", "Golang",
                    # Cloud & Infrastructure
                    "AWS", "Azure", "Google Cloud", "Heroku", "Vercel", "Netlify",
                    # Databases
                    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
                    # Analytics & Marketing
                    "Google Analytics", "Amplitude", "Mixpanel", "Segment",
                    "Meta Ads", "Facebook Ads", "Google Ads", "TikTok Ads",
                    # CRM & Sales
                    "Salesforce", "HubSpot", "Pipedrive", "Zoho",
                    # Communication
                    "Slack", "Discord", "Telegram", "Zoom", "Teams",
                    # Other common terms
                    "API", "REST", "GraphQL", "WebSocket", "Postman",
                    "CI/CD", "DevOps", "Agile", "Scrum", "Kanban",
                ]
            )
        ]

        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=SAMPLE_RATE_HZ,
            language_code="ru-RU",
            alternative_language_codes=["en-US"],
            speech_contexts=speech_contexts,
        )
        streaming_config = speech.StreamingRecognitionConfig(
            config=config,
            interim_results=True,
        )
        requests = (
            speech.StreamingRecognizeRequest(audio_content=content)
            for content in _audio_generator(audio_queue)
        )
        responses = client.streaming_recognize(streaming_config, requests)
        result_count = 0

        for response in responses:
            if not response.results:
                continue
            result = response.results[0]
            if not result.alternatives:
                continue
            transcript = result.alternatives[0].transcript.strip()
            if not transcript:
                continue
            kind = "final" if result.is_final else "interim"
            result_count += 1
            preview = (transcript[:50] + "…") if len(transcript) > 50 else transcript
            if result_count <= 2 or kind == "final" or result_count % 15 == 0:
                print(f"{_STT_LOG_PREFIX} Google -> {kind}: {preview!r}")
            result_queue.put((kind, transcript))
        print(f"{_STT_LOG_PREFIX} streaming_recognize finished, results={result_count}")
    except Exception as e:
        print(f"{_STT_LOG_PREFIX} streaming_recognize error: {e}")
        result_queue.put(("error", str(e)))
    finally:
        result_queue.put((None, None))  # signal end


class StreamingSpeechToText:
    """Streaming STT: feed audio via add_audio(), consume results via get_result() or callback."""

    def __init__(
        self,
        credentials_path: Optional[str] = None,
        on_result: Optional[Callable[[str, str], None]] = None,
    ):
        self.credentials_path = credentials_path
        self.on_result = on_result  # (is_final|interim|error, text)
        self._audio_queue: queue.Queue = queue.Queue()
        self._result_queue: queue.Queue = queue.Queue()
        self._thread: Optional[threading.Thread] = None
        self._closed = False

    def start(self) -> None:
        if self._thread is not None:
            return
        self._closed = False
        self._thread = threading.Thread(
            target=_run_streaming_recognize,
            args=(self.credentials_path, self._audio_queue, self._result_queue),
            daemon=True,
        )
        self._thread.start()

    def add_audio(self, data: bytes) -> None:
        if self._closed:
            return
        self._audio_queue.put(data)

    def stop(self) -> None:
        self._closed = True
        self._audio_queue.put(None)

    def get_result(self, timeout: float = 0.1) -> Optional[Tuple[str, str]]:
        """Get one result (is_final|interim|error, text) or None. (None, None) means stream ended."""
        try:
            return self._result_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def join(self, timeout: Optional[float] = 5.0) -> None:
        if self._thread:
            self._thread.join(timeout=timeout)


def create_streaming_stt(credentials_path: Optional[str]) -> Optional[StreamingSpeechToText]:
    """Create streaming STT if Google Cloud Speech is available."""
    if speech is None:
        return None
    return StreamingSpeechToText(credentials_path=credentials_path)
