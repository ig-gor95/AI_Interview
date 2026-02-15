import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Mic, MicOff, PhoneOff, MessageSquare, Users, Settings, ChevronUp, AlertCircle, X } from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import { publicAPI } from '@/lib/api';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface TranscriptMessage {
  role: 'ai' | 'user';
  message: string;
  timestamp: string;
  audioUrl?: string;
}

interface WebSocketMessage {
  type: string;
  message?: string;
  role?: 'ai' | 'user';
  session_id?: string;
  transcript?: TranscriptMessage[];
  nextQuestionIndex?: number;
  audio_url?: string;
  timestamp?: string;
  metadata?: any;
  questionType?: string;
  timeExpired?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// For WebSocket, use relative path - Vite proxy will handle it
const WS_BASE_URL = import.meta.env.VITE_WS_URL || '/ws';

function fullAudioUrl(relativeOrAbsolute: string | undefined): string | undefined {
  if (!relativeOrAbsolute) return undefined;
  if (relativeOrAbsolute.startsWith('http://') || relativeOrAbsolute.startsWith('https://')) return relativeOrAbsolute;
  const base = typeof API_BASE_URL === 'string' && API_BASE_URL.startsWith('http') ? API_BASE_URL.replace(/\/$/, '').replace(/\/api\/?$/, '') : window.location.origin;
  return base + (relativeOrAbsolute.startsWith('/') ? relativeOrAbsolute : '/' + relativeOrAbsolute);
}

export function InterviewSessionView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResume, setIsResume] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [typingMessageTimestamp, setTypingMessageTimestamp] = useState<string | null>(null);
  const [visibleCharCount, setVisibleCharCount] = useState(0);
  const [sttMethod, setSttMethod] = useState<'backend' | 'browser' | null>(null);
  const [showSttWarning, setShowSttWarning] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const typewriterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTranscriptRef = useRef('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUserTurnRef = useRef(false); // Таймер работает только когда пользователь должен отвечать
  const sessionDurationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const wsConnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userRequestedStopRef = useRef(false); // true только когда пользователь нажал «Стоп»
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Таймер для автоматической остановки при молчании
  const lastSpeechActivityRef = useRef<number | null>(null); // Время последней активности распознавания
  const fillerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fillerAudioRef = useRef<HTMLAudioElement | null>(null);
  const fillerIndexRef = useRef(0);
  const sttWsRef = useRef<WebSocket | null>(null);
  const useBackendSttRef = useRef(false);
  const sttAudioContextRef = useRef<AudioContext | null>(null);
  const sttScriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sttMediaStreamRef = useRef<MediaStream | null>(null);
  const sttInt16BufferRef = useRef<number[]>([]);
  const handleWebSocketMessageRef = useRef<((data: any) => void) | null>(null);
  const STT_CHUNK_BYTES = 3200; // 100 ms at 16kHz mono 16-bit

  const SILENCE_TIMEOUT_MS = 6000; // 6 секунд молчания = автоматическая остановка

  const FILLER_PHRASE_COUNT = 5;
  const FILLER_DELAY_MS = 3500;

  const stopFillerAudio = () => {
    if (fillerTimerRef.current) {
      clearTimeout(fillerTimerRef.current);
      fillerTimerRef.current = null;
    }
    if (fillerAudioRef.current) {
      fillerAudioRef.current.pause();
      fillerAudioRef.current = null;
    }
  };

  const playFillerAudio = () => {
    const idx = fillerIndexRef.current % FILLER_PHRASE_COUNT;
    fillerIndexRef.current = idx + 1;
    const url = fullAudioUrl(`/api/audio/filler/${idx}`) ?? `${window.location.origin}/api/audio/filler/${idx}`;
    const audio = new Audio(url);
    fillerAudioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => {
      fillerAudioRef.current = null;
      // Don't loop - wait for next delay or response
    };
  };

  const startFillerTimer = () => {
    stopFillerAudio();
    fillerTimerRef.current = setTimeout(() => {
      fillerTimerRef.current = null;
      if (fillerAudioRef.current) return; // Response already arrived
      playFillerAudio();
    }, FILLER_DELAY_MS);
  };

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      if (!token) {
        setError('Токен не указан');
        setIsLoading(false);
        return;
      }

      try {
        const response = await publicAPI.startSession(token);
        setSessionId(response.sessionId);
        setIsResume(response.isResume);
        
        // Initialize timer with duration from backend
        if (response.duration) {
          sessionDurationRef.current = response.duration * 60; // convert to seconds
          
          if (response.isResume && response.remainingSeconds !== undefined) {
            // Resumed session - use remaining time
            setTimeRemaining(response.remainingSeconds);
            if (response.startedAt) {
              startTimeRef.current = new Date(response.startedAt).getTime();
            }
          } else {
            // New session - start timer from beginning
            setTimeRemaining(response.duration * 60);
            startTimeRef.current = Date.now();
          }
        }
        
        // Always connect to WebSocket
        connectWebSocket(response.sessionId);
        
        if (response.isResume) {
          // Resumed session - show dialog or auto-resume
          if (response.transcript.length > 0) {
            setTranscript(response.transcript);
            // Determine if it's user's turn based on last message
            const lastMessage = response.transcript[response.transcript.length - 1];
            if (lastMessage && lastMessage.role === 'ai') {
              // Last message is from AI, so user should respond
              isUserTurnRef.current = true;
            }
          }
          // Show resume dialog (will be auto-closed when WebSocket sends 'resume' message)
          setShowResumeDialog(true);
        }
      } catch (error) {
        console.error('Ошибка при загрузке сессии:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке сессии');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [token]);

  // Connect to WebSocket
  const connectWebSocket = (sid: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return; // Already connected
    }

    // Build WebSocket URL - use Vite proxy for consistent routing
    // Vite proxy maps /ws/* to ws://localhost:8000/ws/*
    let wsUrl: string;
    if (WS_BASE_URL.startsWith('ws://') || WS_BASE_URL.startsWith('wss://')) {
      // Absolute WebSocket URL (if explicitly set)
      wsUrl = `${WS_BASE_URL}/ws/session/${sid}?candidate_name=Гость`;
    } else {
      // Use relative path - browser will use current protocol and host
      // Vite dev server will proxy /ws/* to ws://localhost:8000/ws/*
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}${WS_BASE_URL}/session/${sid}?candidate_name=Гость`;
    }

    console.log('[Frontend] Connecting to WebSocket:', wsUrl);

    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    // Set timeout for connection (10 seconds)
    wsConnectionTimeoutRef.current = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection timeout');
        setError('Таймаут подключения к серверу. Проверьте, что backend запущен и доступен.');
        ws.close();
      }
    }, 10000);

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      setError(null); // Clear any connection errors
      
      // Clear connection timeout
      if (wsConnectionTimeoutRef.current) {
        clearTimeout(wsConnectionTimeoutRef.current);
        wsConnectionTimeoutRef.current = null;
      }
      
      // If this is a resumed session, WebSocket will send 'resume' message
      // If it's a new session, wait for user to click "Войти в интервью"
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message received:', data.type, data);
        handleWebSocketMessageRef.current?.(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('[Frontend] WebSocket error event:', error);
      console.error('[Frontend] WebSocket error details:', {
        type: error.type,
        target: error.target,
        currentTarget: error.currentTarget,
        wsState: ws.readyState
      });
      
      // Check if this is a send error or connection error
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        setError('WebSocket соединение закрыто. Попробуйте переподключиться.');
      } else {
        setError('Ошибка WebSocket соединения. Проверьте, что backend запущен и доступен.');
      }
      
      // Clear connection timeout
      if (wsConnectionTimeoutRef.current) {
        clearTimeout(wsConnectionTimeoutRef.current);
        wsConnectionTimeoutRef.current = null;
      }
    };

    ws.onclose = (event) => {
      console.log('[Frontend] WebSocket disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setIsConnected(false);

      // Clear connection timeout
      if (wsConnectionTimeoutRef.current) {
        clearTimeout(wsConnectionTimeoutRef.current);
        wsConnectionTimeoutRef.current = null;
      }

      // Attempt reconnection for unexpected disconnections
      if (event.code !== 1000 && event.code !== 1001 && event.code !== 1005) {
        // Not a normal closure, going away, or empty close
        console.log('[Frontend] Attempting WebSocket reconnection in 3 seconds...');
        setIsReconnecting(true);
        setError('Соединение потеряно. Попытка переподключения...');

        // Attempt reconnection after 3 seconds
        setTimeout(() => {
          if (!isConnected && sessionId) { // Only reconnect if still not connected and we have sessionId
            console.log('[Frontend] Reconnecting WebSocket...');
            connectWebSocket(sessionId);
          }
          setIsReconnecting(false);
        }, 3000);
      } else {
        // Normal closure or empty close - don't attempt reconnection
        if (!error) { // Only set error if not already set
          const errorMsg = `Соединение закрыто: ${event.reason || `Код: ${event.code}`}`;
          console.error('[Frontend]', errorMsg);
          setError(errorMsg);
        }
      }
    };

    wsRef.current = ws;
  };

  // Manual reconnect function
  const reconnectWebSocket = () => {
    if (sessionId && !isReconnecting) {
      console.log('[Frontend] Manual WebSocket reconnection requested');
      setIsReconnecting(true);
      setError('Переподключение...');

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Attempt reconnection after a short delay
      setTimeout(() => {
        connectWebSocket(sessionId);
        setIsReconnecting(false);
      }, 1000);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case 'connected':
        console.log('Connected to session');
        // If it's a resumed session, we'll get 'resume' message next
        // If it's a new session, wait for user to click start
        break;
      
      case 'resume':
        // Session resumed - WebSocket sent resume message with transcript
        console.log('[Frontend] Resume message received, transcript length:', data.transcript?.length || 0);
        setShowResumeDialog(false);
        setSessionStarted(true);
        
        if (data.transcript && data.transcript.length > 0) {
          console.log('[Frontend] Loading transcript history');
          setTranscript(data.transcript);
          // Determine if it's user's turn based on last message
          const lastMessage = data.transcript[data.transcript.length - 1];
          if (lastMessage && lastMessage.role === 'ai') {
            isUserTurnRef.current = true;
            // Start timer if it's user's turn
            if (timeRemaining !== null && timeRemaining > 0 && !timeExpired) {
              startTimer();
            }
          }
        } else {
          // Empty transcript but resumed - session just started
          // Wait for greeting message from AI (will come as 'message' type)
          console.log('[Frontend] Empty transcript, waiting for greeting from AI...');
          // Session is already started, just waiting for AI to send greeting
        }
        break;
      
      case 'message':
        console.log('[Frontend] Message received:', data.role, data.message?.substring(0, 50));
        stopFillerAudio();
        if (data.role === 'ai') {
          // Останавливаем микрофон когда AI начинает говорить
          if (isListening) {
            console.log('[Frontend] AI speaking - stopping microphone');
            userRequestedStopRef.current = true;
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }
            if (speechPauseTimeoutRef.current) {
              clearTimeout(speechPauseTimeoutRef.current);
              speechPauseTimeoutRef.current = null;
            }
            if (useBackendSttRef.current) {
              stopBackendStt(false);
            } else {
              const recognition = (window as any).currentSpeechRecognition;
              if (recognition) {
                try { recognition.stop(); } catch (_) {}
              }
              (window as any).currentSpeechRecognition = null;
              setIsListening(false);
              lastSpeechActivityRef.current = null;
            }
            // Очищаем текст
            finalTranscriptRef.current = '';
            setInterimTranscript('');
          }

          setIsSpeaking(true);
          setIsProcessing(false);
          isUserTurnRef.current = false;
          startTimer(); // Timer runs during TTS playback

          const fullText = data.message || '';
          const audioUrlResolved = fullAudioUrl(data.audio_url) ?? data.audio_url;
          const newMessage: TranscriptMessage = {
            role: 'ai',
            message: fullText,
            timestamp: data.timestamp || new Date().toISOString(),
            audioUrl: audioUrlResolved
          };

          setTranscript(prev => [...prev, newMessage]);
          setTypingMessageTimestamp(newMessage.timestamp);
          setVisibleCharCount(0);

          if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
          }

          const startTypewriter = (durationSec: number) => {
            const intervalMs = 50;
            const steps = Math.ceil((durationSec * 1000) / intervalMs);
            const step = steps > 0 ? Math.ceil(fullText.length / steps) : fullText.length;
            let n = 0;
            typewriterIntervalRef.current = setInterval(() => {
              n += step;
              setVisibleCharCount(c => {
                const next = Math.min(fullText.length, c + step);
                if (next >= fullText.length && typewriterIntervalRef.current) {
                  clearInterval(typewriterIntervalRef.current);
                  typewriterIntervalRef.current = null;
                  setTypingMessageTimestamp(null);
                }
                return next;
              });
            }, intervalMs);
          };

          const interviewComplete = data.metadata?.interviewComplete === true;
          const onAudioOrTypewriterDone = () => {
            if (typewriterIntervalRef.current) {
              clearInterval(typewriterIntervalRef.current);
              typewriterIntervalRef.current = null;
            }
            setVisibleCharCount(fullText.length);
            setTypingMessageTimestamp(null);
            setIsSpeaking(false);
            if (interviewComplete) {
              handleEndSession();
            } else {
              isUserTurnRef.current = true;
              startTimer();
            }
          };

          if (newMessage.audioUrl) {
            const audioSrc = newMessage.audioUrl;
            if (typeof window !== 'undefined' && !audioSrc.startsWith('http')) {
              console.warn('[Frontend] Audio URL relative, full URL:', (window.location.origin + (audioSrc.startsWith('/') ? '' : '/') + audioSrc));
            }
            const audio = new Audio(audioSrc);

            audio.onloadedmetadata = () => {
              const durationSec = audio.duration;
              startTypewriter(durationSec);
              audio.play().catch((err) => {
                console.warn('[Frontend] Audio play failed (autoplay?), enabling mic:', err);
                startTypewriter(fullText.length / 18);
                const fallbackMs = Math.max(500, (fullText.length / 18) * 1000);
                setTimeout(onAudioOrTypewriterDone, fallbackMs);
              });
            };
            audio.load();

            audio.onended = onAudioOrTypewriterDone;

            audio.onerror = (e) => {
              console.warn('[Frontend] Audio load/play error:', e);
              onAudioOrTypewriterDone();
            };
          } else {
            startTypewriter(fullText.length / 18);
            const delayMs = (fullText.length / 18) * 1000 + (interviewComplete ? 2000 : 200);
            setTimeout(onAudioOrTypewriterDone, delayMs);
          }
        }
        break;
      
      case 'audio_received':
        // Backend confirmed that audio was received
        console.log('[Frontend] Backend confirmed audio received:', data.message);
        setIsProcessing(true);
        break;
      
      case 'transcription':
        // User message transcription confirmed - add to transcript
        console.log('[Frontend] Transcription received:', data.message);
        if (data.message) {
          const userMessage: TranscriptMessage = {
            role: 'user',
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString()
          };
          setTranscript(prev => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(msg => 
              msg.role === 'user' && 
              msg.message === data.message && 
              Math.abs(new Date(msg.timestamp).getTime() - new Date(userMessage.timestamp).getTime()) < 5000
            );
            if (exists) {
              console.log('[Frontend] Message already in transcript, skipping');
              return prev;
            }
            console.log('[Frontend] Adding user message to transcript');
            return [...prev, userMessage];
          });
        }
        setIsProcessing(true);
        break;
      
      case 'time_expired':
        setTimeExpired(true);
        stopTimer();
        isUserTurnRef.current = true; // Позволяем пользователю задать дополнительный вопрос
        // Таймер уже остановлен, но можно задать вопрос
        break;
      
      case 'ended':
        // Session ended
        stopTimer();
        navigate(`/interview/thank-you`);
        break;
      
      case 'error':
        setError(data.message || 'Произошла ошибка');
        setIsProcessing(false);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  };
  // Keep ref in sync so WebSocket always calls the latest handler (avoids stale closure)
  handleWebSocketMessageRef.current = handleWebSocketMessage;

  // Timer management — runs during TTS playback and user's turn, stops only during GPT processing
  const startTimer = () => {
    if (timerIntervalRef.current) return; // Already running
    if (timeExpired) return; // Time already expired
    
    if (timeRemaining !== null && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            stopTimer();
            setTimeExpired(true);
            isUserTurnRef.current = false;
            // Notify backend about time expiration
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'time_expired' }));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Start session
  const handleStartSession = () => {
    if (!sessionId) {
      setError('Сессия не загружена. Попробуйте обновить страницу.');
      return;
    }

    // Если WebSocket не подключен, попробуем подключиться
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected, attempting to connect...');
      connectWebSocket(sessionId);
      
      // Ждем подключения (максимум 5 секунд)
      let attempts = 0;
      const checkConnection = setInterval(() => {
        attempts++;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          clearInterval(checkConnection);
          // WebSocket подключен, отправляем start
          sendStartMessage();
        } else if (attempts >= 10) {
          // 5 секунд прошло (10 попыток по 500мс)
          clearInterval(checkConnection);
          setError('Не удалось подключиться к серверу. Проверьте, что backend запущен.');
        }
      }, 500);
      
      return;
    }

    sendStartMessage();
  };

  const sendStartMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket не подключен');
      return;
    }

    setShowResumeDialog(false);
    setSessionStarted(true);
    setError(null); // Clear any previous errors
    
    // Send start message
    try {
      wsRef.current.send(JSON.stringify({ type: 'start' }));
      console.log('Start message sent to WebSocket');
    } catch (error) {
      console.error('Error sending start message:', error);
      setError('Ошибка при отправке команды начала сессии');
    }
    
    // Timer will start when AI finishes speaking (in handleWebSocketMessage)
    // Duration and remaining time are already set from loadSession
  };

  // Resume session
  const handleResumeSession = () => {
    if (!sessionId) return;
    
    // WebSocket should already be connected from loadSession
    // Backend will send 'resume' message with transcript
    // Just close the dialog, session will start when 'resume' message arrives
    setShowResumeDialog(false);
    
    // If transcript is already loaded, start session immediately
    if (transcript.length > 0) {
      setSessionStarted(true);
      const lastMessage = transcript[transcript.length - 1];
      if (lastMessage && lastMessage.role === 'ai') {
        isUserTurnRef.current = true;
        if (timeRemaining !== null && timeRemaining > 0 && !timeExpired) {
          startTimer();
        }
      }
    }
    // Otherwise wait for 'resume' message from WebSocket
  };


  // Send current accumulated text and stop mic (it's AI's turn after sending)
  const sendCurrentTranscript = () => {
    const text = (interimTranscript || finalTranscriptRef.current || '').trim();
    if (!text) return;

    // Stop mic if still recording
    if (isListening) {
      userRequestedStopRef.current = true;
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (speechPauseTimeoutRef.current) {
        clearTimeout(speechPauseTimeoutRef.current);
        speechPauseTimeoutRef.current = null;
      }
      if (useBackendSttRef.current) {
        stopBackendStt(false);
      } else {
        const recognition = (window as any).currentSpeechRecognition;
        if (recognition) {
          try { recognition.stop(); } catch (_) {}
        }
        (window as any).currentSpeechRecognition = null;
        setIsListening(false);
        lastSpeechActivityRef.current = null;
      }
    }

    finalTranscriptRef.current = '';
    setInterimTranscript('');
    sendTextMessage(text);
  };

  // Send text message
  const sendTextMessage = (text: string) => {
    if (!text || text.trim() === '') {
      return; // Don't send empty messages
    }

    // Clear pause timeout
    if (speechPauseTimeoutRef.current) {
      clearTimeout(speechPauseTimeoutRef.current);
      speechPauseTimeoutRef.current = null;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'text',
      text: text.trim()
    }));

    // Add user message to transcript
    const userMessage: TranscriptMessage = {
      role: 'user',
      message: text.trim(),
      timestamp: new Date().toISOString()
    };
    setTranscript(prev => [...prev, userMessage]);
    
    setIsProcessing(true);
    isUserTurnRef.current = false; // Пользователь отправил сообщение - останавливаем таймер
    stopTimer();
    // Filler audio disabled per user request
    // startFillerTimer();
  };

  // Toggle listening (microphone) - using Web Speech API
  const toggleListening = () => {
    // Блокируем включение микрофона если: выключен звук, время истекло, или AI говорит
    if (isMuted || timeExpired || isSpeaking) return;

    // Проверяем реальное состояние через ref, чтобы избежать проблем с асинхронностью setState
    const recognition = (window as any).currentSpeechRecognition;
    const isActuallyListening = recognition && isListening;

    if (isActuallyListening) {
      console.log('[Frontend] User clicked to stop recording');
      userRequestedStopRef.current = true;
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (speechPauseTimeoutRef.current) {
        clearTimeout(speechPauseTimeoutRef.current);
        speechPauseTimeoutRef.current = null;
      }
      if (useBackendSttRef.current) {
        stopBackendStt(false); // Only stop recording, don't send — user sends via button
        return;
      }
      // Keep text visible for user to send via button
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        console.log('[Frontend] Mic stopped, text preserved for manual send:', finalText);
        setInterimTranscript(finalText);
      } else {
        console.log('[Frontend] No text recorded');
      }
      try {
        recognition.stop();
      } catch (e) {
        console.log('[Frontend] Recognition already stopped:', e);
      }
      setIsListening(false);
      setSttMethod(null);
      lastSpeechActivityRef.current = null;
      return;
    }

    // If we have pending text (mic turned off earlier), do NOT send — resume recording and append to it
    const isResume = finalTranscriptRef.current.trim().length > 0;

    // Not recording: block start when processing or not user's turn
    if (isProcessing || (!isUserTurnRef.current && !timeExpired)) {
      console.log('[Frontend] Cannot start recording: isProcessing=', isProcessing, 'isUserTurn=', isUserTurnRef.current);
      return;
    }

    console.log('[Frontend] Starting recording (try backend STT first)', isResume ? '(resume)' : '');
    userRequestedStopRef.current = false;
    lastSpeechActivityRef.current = Date.now();
    const sid = sessionId;
    if (sid) {
      const wsUrl = buildSttWsUrl(sid);
      const probe = new WebSocket(wsUrl);
      const fallbackTimer = setTimeout(() => {
        if (probe.readyState !== WebSocket.OPEN) {
          console.warn('[Frontend] Backend STT connection timeout, falling back to Web Speech API (may have issues with English terms)');
          probe.close();
          setSttMethod('browser');
          setShowSttWarning(true);
          startSpeechRecognition(!isResume);
        }
      }, 5000); // Increased from 2500ms to 5000ms for more reliable backend STT connection
      probe.onopen = () => {
        clearTimeout(fallbackTimer);
        probe.close();
        sttWsRef.current = null;
        setSttMethod('backend');
        setShowSttWarning(false);
        startBackendStt(isResume);
      };
      probe.onerror = () => {
        clearTimeout(fallbackTimer);
        probe.close();
        setSttMethod('browser');
        setShowSttWarning(true);
        startSpeechRecognition(!isResume);
      };
    } else {
      startSpeechRecognition(!isResume);
    }
  };

  function buildSttWsUrl(sid: string): string {
    if (WS_BASE_URL.startsWith('ws://') || WS_BASE_URL.startsWith('wss://')) {
      return `${WS_BASE_URL.replace(/\/$/, '')}/ws/stt/${sid}`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${WS_BASE_URL}/stt/${sid}`;
  }

  function stopBackendStt(shouldSend = true) {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (sttMediaStreamRef.current) {
      sttMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      sttMediaStreamRef.current = null;
    }
    if (sttScriptNodeRef.current && sttAudioContextRef.current) {
      try {
        sttScriptNodeRef.current.disconnect();
      } catch (_) {}
      sttScriptNodeRef.current = null;
    }
    if (sttAudioContextRef.current) {
      sttAudioContextRef.current.close().catch(() => {});
      sttAudioContextRef.current = null;
    }
    if (sttWsRef.current) {
      try {
        sttWsRef.current.send('stop');
        sttWsRef.current.close();
      } catch (_) {}
      sttWsRef.current = null;
    }
    if (shouldSend) {
      const text = finalTranscriptRef.current.trim();
      if (text) {
        sendTextMessage(text);
        finalTranscriptRef.current = '';
      }
      setInterimTranscript('');
    } else {
      const text = finalTranscriptRef.current.trim();
      if (text) setInterimTranscript(text);
    }
    useBackendSttRef.current = false;
    setIsListening(false);
    setSttMethod(null);
    lastSpeechActivityRef.current = null;
  }

  function startBackendStt(isResume?: boolean) {
    const sid = sessionId;
    if (!sid) return;
    const wsUrl = buildSttWsUrl(sid);
    const ws = new WebSocket(wsUrl);
    sttWsRef.current = ws;

    ws.onopen = () => {
      useBackendSttRef.current = true;
      setIsListening(true);
      if (!isResume) {
        setInterimTranscript('');
        finalTranscriptRef.current = '';
      } else {
        setInterimTranscript(finalTranscriptRef.current.trim());
      }
      lastSpeechActivityRef.current = Date.now();

      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        sttMediaStreamRef.current = stream;
        const sampleRate = 16000;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
        sttAudioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const bufferSize = 4096;
        const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);
        sttScriptNodeRef.current = scriptNode;
        sttInt16BufferRef.current = [];

        scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
          if (!sttWsRef.current || sttWsRef.current.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const rate = ctx.sampleRate;
          const targetRate = 16000;
          for (let i = 0; i < input.length; i++) {
            let s = input[i];
            if (rate !== targetRate) {
              const srcIdx = (i * targetRate) / rate;
              const j = Math.floor(srcIdx);
              const frac = srcIdx - j;
              s = j < input.length - 1 ? input[j] * (1 - frac) + input[j + 1] * frac : input[j];
            }
            const n = Math.max(-32768, Math.min(32767, Math.floor(s * 32767)));
            sttInt16BufferRef.current.push(n & 0xff, (n >> 8) & 0xff);
          }
          while (sttInt16BufferRef.current.length >= STT_CHUNK_BYTES) {
            const chunk = new Uint8Array(sttInt16BufferRef.current.splice(0, STT_CHUNK_BYTES));
            try {
              sttWsRef.current?.send(chunk.buffer);
            } catch (_) {}
          }
        };
        source.connect(scriptNode);
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        scriptNode.connect(gainNode);
        gainNode.connect(ctx.destination);
      }).catch((err) => {
        console.error('[Frontend] STT mic error:', err);
        setError('Нет доступа к микрофону');
        stopBackendStt();
      });
    };

    ws.onmessage = (event) => {
      lastSpeechActivityRef.current = Date.now();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : null;
        if (!data) return;
        if (data.type === 'error') {
          console.warn('[Frontend] STT error, fallback to Web Speech API:', data.message);
          stopBackendStt(false); // Don't send, preserve text
          const hadPending = finalTranscriptRef.current.trim().length > 0;
          startSpeechRecognition(!hadPending);
          return;
        }
        const text = (data.text || '').trim();
        if (!text) return;
        if (data.type === 'final') {
          finalTranscriptRef.current += text + ' ';
        }
        const acc = finalTranscriptRef.current.trim();
        setInterimTranscript(acc ? `${acc} ${text}` : text);
      } catch (_) {}
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        if (!userRequestedStopRef.current && useBackendSttRef.current) {
          const finalText = finalTranscriptRef.current.trim();
          if (finalText) {
            userRequestedStopRef.current = true;
            stopBackendStt(false); // только остановить запись, не отправлять
          }
        }
        silenceTimeoutRef.current = null;
      }, SILENCE_TIMEOUT_MS);
    };

    ws.onerror = () => {
      if (!useBackendSttRef.current) return;
      console.log('[Frontend] STT WebSocket error, fallback to Web Speech API');
      stopBackendStt(false); // Don't send, preserve text
      startSpeechRecognition(false);
    };

    ws.onclose = () => {
      sttWsRef.current = null;
    };
  }

  // Вынесено в отдельную функцию, чтобы перезапускать при onend (пауза 2–3 сек не означает конец речи)
  function startSpeechRecognition(isInitialStart?: boolean) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Web Speech API не поддерживается в вашем браузере. Используйте Chrome или Edge.');
      return;
    }
    if (isInitialStart) {
      finalTranscriptRef.current = '';
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Language setting for speech recognition
    // Note: Web Speech API doesn't support multiple languages simultaneously like Google Cloud Speech
    // Using ru-RU as primary language. English words may be transcribed incorrectly (e.g., "Фигма" instead of "Figma")
    // The backend AI is configured to understand and correct common transcription errors in technical terms
    recognition.lang = 'ru-RU';

    recognition.onstart = () => {
      console.log('[Frontend] Speech recognition started');
      setIsListening(true);
      setSttMethod('browser');
      if (isInitialStart) {
        setInterimTranscript('');
      } else {
        setInterimTranscript(finalTranscriptRef.current.trim());
      }
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      
      // Обновляем время последней активности
      lastSpeechActivityRef.current = Date.now();
      
      // Очищаем таймер молчания при получении результатов
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      if (speechPauseTimeoutRef.current) {
        clearTimeout(speechPauseTimeoutRef.current);
        speechPauseTimeoutRef.current = null;
      }
      
      for (let i = event.resultIndex || 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result.length > 0 && result[0]) {
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscriptRef.current += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }
      }
      const accumulatedText = finalTranscriptRef.current.trim();
      setInterimTranscript(accumulatedText ? `${accumulatedText} ${currentInterim}` : currentInterim);
      
      // Таймер молчания: через 6 сек только останавливаем запись, не отправляем — отправит пользователь кнопкой
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      silenceTimeoutRef.current = setTimeout(() => {
        if (!userRequestedStopRef.current && isListening) {
          const finalText = finalTranscriptRef.current.trim();
          console.log('[Frontend] Silence timeout: stopping mic (text not sent), user can Send or resume:', finalText ? 'has text' : 'no text');
          userRequestedStopRef.current = true;
          const currentRecognition = (window as any).currentSpeechRecognition;
          if (currentRecognition) {
            try {
              currentRecognition.stop();
            } catch (e) {
              console.log('[Frontend] Error stopping recognition on silence timeout:', e);
            }
          }
          if (finalText) {
            setInterimTranscript(finalText);
          }
          setIsListening(false);
          lastSpeechActivityRef.current = null;
        }
        silenceTimeoutRef.current = null;
      }, SILENCE_TIMEOUT_MS);
    };

    recognition.onspeechend = () => {
      if (speechPauseTimeoutRef.current) {
        clearTimeout(speechPauseTimeoutRef.current);
        speechPauseTimeoutRef.current = null;
      }
    };

    recognition.onend = () => {
      if (speechPauseTimeoutRef.current) {
        clearTimeout(speechPauseTimeoutRef.current);
        speechPauseTimeoutRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      (window as any).currentSpeechRecognition = null;

      if (userRequestedStopRef.current) {
        // User clicked stop or silence timeout — stay stopped, keep text visible
        userRequestedStopRef.current = false;
        setIsListening(false);
        setSttMethod(null);
        lastSpeechActivityRef.current = null;
      } else {
        // Browser auto-ended recognition (pause, no-speech, etc.)
        // Do NOT restart automatically - user must click mic button to start again
        console.log('[Frontend] Browser auto-ended recognition, staying stopped (no auto-restart)');
        setIsListening(false);
        setSttMethod(null);
        lastSpeechActivityRef.current = null;
      }
    };

    recognition.onerror = (event: any) => {
      if (speechPauseTimeoutRef.current) {
        clearTimeout(speechPauseTimeoutRef.current);
        speechPauseTimeoutRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (event.error === 'no-speech' && !userRequestedStopRef.current) {
        // Часто при паузе браузер шлёт no-speech — не считаем ошибкой, перезапуск сделает onend
        return;
      }
      // Keep text visible — user sends via button only
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        setInterimTranscript(finalText);
      }
      if (event.error !== 'no-speech') {
        setError(`Ошибка распознавания речи: ${event.error}`);
      }
      setIsListening(false);
      setSttMethod(null);
      lastSpeechActivityRef.current = null;
    };

    try {
      recognition.start();
      (window as any).currentSpeechRecognition = recognition;
    } catch (error) {
      console.error('[Frontend] Error starting speech recognition:', error);
      setError('Ошибка запуска распознавания речи');
    }
  }

  // End session
  const handleEndSession = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end' }));
    }
    stopTimer();
    navigate(`/interview/thank-you`);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopFillerAudio();
      if (wsConnectionTimeoutRef.current) {
        clearTimeout(wsConnectionTimeoutRef.current);
      }
      if (speechPauseTimeoutRef.current) {
        clearTimeout(speechPauseTimeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (useBackendSttRef.current) {
        if (sttWsRef.current) {
          try {
            sttWsRef.current.send('stop');
            sttWsRef.current.close();
          } catch (_) {}
        }
        if (sttMediaStreamRef.current) {
          sttMediaStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (sttAudioContextRef.current) {
          sttAudioContextRef.current.close().catch(() => {});
        }
      }
      const recognition = (window as any).currentSpeechRecognition;
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  // Scroll chat to bottom when messages or interim transcript changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimTranscript]);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <p className="text-gray-600">Загрузка сессии интервью...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate(`/interview/${token}`)}>
            Вернуться к регистрации
          </Button>
        </div>
      </div>
    );
  }

  // Resume dialog
  if (showResumeDialog && isResume) {
    return (
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Продолжить сессию?</DialogTitle>
            <DialogDescription>
              Обнаружена незавершенная сессия интервью. Хотите продолжить?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => navigate(`/interview/${token}`)}>
              Отмена
            </Button>
            <Button onClick={handleResumeSession}>
              Продолжить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Pre-session screen
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Интервью
            </h2>
            <p className="text-gray-600">
              {isConnected ? 'Готово к началу' : error ? 'Ошибка подключения' : 'Подключение...'}
            </p>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            onClick={handleStartSession}
            disabled={!sessionId}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5" />
            Войти в интервью
          </button>
          
          {!isConnected && !error && (
            <p className="text-gray-500 text-sm mt-4 text-center">
              {sessionId ? 'Подключение к серверу...' : 'Загрузка сессии...'}
            </p>
          )}
          
          {error && sessionId && (
            <div className="mt-4">
              <p className="text-red-600 text-sm text-center mb-2">{error}</p>
              <button
                onClick={reconnectWebSocket}
                disabled={isReconnecting}
                className="w-full py-2 text-blue-600 hover:text-blue-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isReconnecting ? 'Переподключение...' : 'Переподключиться'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main session view
  return (
    <div className="fixed inset-0 bg-[#1c1c1c] flex flex-col">
      {/* Top Bar */}
      <div className="bg-[#232323] border-b border-gray-800/50 px-2 sm:px-6 py-2 sm:py-3 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Timer */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-800/60 rounded-lg backdrop-blur-sm">
              {/* Connection Status */}
              <div className="flex items-center mr-1">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : isReconnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                }`}></div>
              </div>

              <div className="relative flex items-center">
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                  isUserTurnRef.current ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                }`}></div>
                {isUserTurnRef.current && (
                  <div className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-ping"></div>
                )}
              </div>
              <span className="text-xs sm:text-sm text-white font-medium tabular-nums tracking-wide">
                {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
              </span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2.5 rounded-lg transition-all ${
                showChat ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-700/50 text-gray-300'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Gallery */}
        <div className="flex-1 p-3 sm:p-6 flex flex-col lg:flex-row gap-3 sm:gap-6">
          {/* AI Interviewer */}
          <div className="relative bg-black rounded-2xl overflow-hidden flex-1 shadow-2xl border border-gray-800/50">
            <AIAvatar isListening={isListening} isSpeaking={isSpeaking} />
            
            {/* Name Tag */}
            <div className="absolute bottom-4 left-4 px-4 py-2.5 bg-black/80 backdrop-blur-md rounded-xl flex items-center gap-3 z-10 border border-white/10">
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
              <div>
                <span className="text-sm text-white font-semibold">AI Интервьюер</span>
              </div>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="absolute top-4 left-4 px-4 py-2.5 bg-blue-600/90 backdrop-blur-md rounded-xl z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                  <span className="text-sm text-white font-medium">Анализирую ответ</span>
                </div>
              </div>
            )}

            {/* STT Warning */}
            {showSttWarning && sttMethod === 'browser' && (
              <div className="absolute top-4 right-4 px-4 py-2.5 bg-amber-600/90 backdrop-blur-md rounded-xl z-10 max-w-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-white font-medium">Внимание</p>
                    <p className="text-xs text-white/90 mt-0.5">Английские термины могут распознаваться с ошибками</p>
                  </div>
                  <button
                    onClick={() => setShowSttWarning(false)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Candidate Video */}
          <div className="relative bg-black rounded-2xl overflow-hidden flex-1 shadow-2xl border border-gray-800/50">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-2xl flex items-center justify-center">
                <span className="text-6xl font-light text-white/95">
                  В
                </span>
              </div>
            </div>

            {/* Name Tag */}
            <div className="absolute bottom-4 left-4 px-4 py-2.5 bg-black/80 backdrop-blur-md rounded-xl flex items-center gap-3 z-10">
              {isListening && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                </div>
              )}
              <div>
                <span className="text-sm text-white font-semibold">Вы</span>
                {isMuted && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MicOff className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400">Микрофон выкл</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 sm:w-96 bg-[#232323] border-l border-gray-800/50 flex flex-col flex-shrink-0">
            <div className="px-5 py-4 border-b border-gray-800/50 flex items-center justify-between">
              <h3 className="text-white font-semibold">Транскрипт</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg"
              >
                <ChevronUp className="w-4 h-4 text-gray-400 rotate-90" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {transcript.map((msg, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      msg.role === 'ai' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}>
                      {msg.role === 'ai' ? 'AI' : 'В'}
                    </div>
                    <span className="text-xs font-semibold text-gray-300">
                      {msg.role === 'ai' ? 'AI Интервьюер' : 'Вы'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className={`text-sm leading-relaxed rounded-xl p-4 ${
                    msg.role === 'ai'
                      ? 'bg-blue-600/10 text-gray-100 border border-blue-500/20'
                      : 'bg-gray-800/80 text-gray-200 border border-gray-700/50'
                  }`}>
                    {msg.role === 'ai' && msg.timestamp === typingMessageTimestamp
                      ? msg.message.slice(0, visibleCharCount)
                      : msg.message}
                  </div>
                </div>
              ))}

              {/* Interim transcript display */}
              {interimTranscript && (
                <div className="space-y-2 opacity-70">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-700 text-gray-200">
                      В
                    </div>
                    <span className="text-xs font-semibold text-gray-300">Вы</span>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed rounded-xl p-4 bg-gray-800/80 text-gray-400 border border-gray-700/50 italic">
                    {interimTranscript}...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-[#232323] border-t border-gray-800/50 px-2 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto gap-2 sm:gap-4">
          {/* Time Expired Alert */}
          {timeExpired && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Время интервью истекло. Если у вас есть дополнительный вопрос или дополнение, вы можете его задать.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700/50 hover:bg-gray-700 text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              {sttMethod && isListening && (
                <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  sttMethod === 'backend'
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-amber-600/20 text-amber-400'
                }`}>
                  {sttMethod === 'backend' ? 'AI STT' : 'Browser'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={sendCurrentTranscript}
              disabled={!(interimTranscript?.trim() || finalTranscriptRef.current?.trim())}
              className="px-3 sm:px-5 py-2 sm:py-4 rounded-xl font-semibold transition-all bg-gray-700 hover:bg-gray-600 text-white disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
              title="Отправить сообщение"
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs font-bold ml-1">ОТПРАВИТЬ</span>
            </button>
            <button
              onClick={toggleListening}
              disabled={isMuted || isSpeaking || (!isListening && (isProcessing || (!isUserTurnRef.current && !timeExpired)))}
              className={`px-4 sm:px-8 py-2 sm:py-4 rounded-xl transition-all font-semibold ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isMuted || isSpeaking || (!isListening && (isProcessing || (!isUserTurnRef.current && !timeExpired)))
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
              }`}
              title={isSpeaking ? 'Подождите, пока AI закончит говорить' : undefined}
            >
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs font-bold">
                {isListening ? 'ГОВОРЮ' : isSpeaking ? 'AI ГОВОРИТ' : 'ОТВЕТ'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={handleEndSession}
              className="px-3 sm:px-6 py-2 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm hidden sm:inline">Конец</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
