"""Lightweight STT quality metrics - no external dependencies, just logging."""
import time
from typing import Dict, Optional
from collections import defaultdict
import threading


class STTMetrics:
    """
    Thread-safe metrics collector for STT quality monitoring.
    Tracks:
    - Response times (interim vs final)
    - Result counts
    - Enhancement rates
    - Error rates
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._sessions: Dict[str, Dict] = defaultdict(lambda: {
            'start_time': time.time(),
            'interim_count': 0,
            'final_count': 0,
            'enhanced_count': 0,
            'error_count': 0,
            'first_result_time': None,
            'total_chars_interim': 0,
            'total_chars_final': 0,
        })

    def track_result(
        self,
        session_id: str,
        kind: str,
        text_length: int,
        was_enhanced: bool = False
    ) -> None:
        """
        Track STT result.

        Args:
            session_id: Session identifier
            kind: 'interim' | 'final' | 'error'
            text_length: Length of transcribed text
            was_enhanced: Whether text was enhanced
        """
        with self._lock:
            session = self._sessions[session_id]

            # First result timing
            if session['first_result_time'] is None:
                session['first_result_time'] = time.time()
                first_result_delay = session['first_result_time'] - session['start_time']
                print(f"[STT-Metrics] {session_id[:8]} First result after {first_result_delay:.2f}s")

            # Count by type
            if kind == 'interim':
                session['interim_count'] += 1
                session['total_chars_interim'] += text_length
            elif kind == 'final':
                session['final_count'] += 1
                session['total_chars_final'] += text_length
                if was_enhanced:
                    session['enhanced_count'] += 1
            elif kind == 'error':
                session['error_count'] += 1

    def get_session_stats(self, session_id: str) -> Optional[Dict]:
        """Get current stats for session."""
        with self._lock:
            if session_id not in self._sessions:
                return None
            return dict(self._sessions[session_id])

    def log_session_summary(self, session_id: str) -> None:
        """Print summary stats for completed session."""
        stats = self.get_session_stats(session_id)
        if not stats:
            return

        duration = time.time() - stats['start_time']
        first_result = stats['first_result_time']
        first_result_delay = (first_result - stats['start_time']) if first_result else 0

        print(f"\n[STT-Metrics] Session {session_id[:8]} Summary:")
        print(f"  Duration: {duration:.1f}s")
        print(f"  First result delay: {first_result_delay:.2f}s")
        print(f"  Interim results: {stats['interim_count']} ({stats['total_chars_interim']} chars)")
        print(f"  Final results: {stats['final_count']} ({stats['total_chars_final']} chars)")
        print(f"  Enhanced: {stats['enhanced_count']}/{stats['final_count']} final results")
        print(f"  Errors: {stats['error_count']}")

        # Quality indicators
        if stats['final_count'] > 0:
            avg_final_length = stats['total_chars_final'] / stats['final_count']
            print(f"  Avg final text length: {avg_final_length:.0f} chars")

        # Cleanup
        with self._lock:
            del self._sessions[session_id]

    def track_session_start(self, session_id: str) -> None:
        """Mark session start time."""
        with self._lock:
            self._sessions[session_id]['start_time'] = time.time()


# Global instance
stt_metrics = STTMetrics()
