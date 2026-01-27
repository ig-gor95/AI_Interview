import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Mic, MicOff, PhoneOff, MessageSquare, Users, Settings, ChevronUp, AlertCircle } from 'lucide-react';
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
        handleWebSocketMessage(data);
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
        if (data.role === 'ai') {
          setIsSpeaking(true);
          setIsProcessing(false);
          isUserTurnRef.current = false;
          stopTimer();

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

          if (newMessage.audioUrl) {
            const audioSrc = newMessage.audioUrl;
            if (typeof window !== 'undefined' && !audioSrc.startsWith('http')) {
              console.warn('[Frontend] Audio URL relative, full URL:', (window.location.origin + (audioSrc.startsWith('/') ? '' : '/') + audioSrc));
            }
            const audio = new Audio(audioSrc);

            const enableMicAndCleanup = () => {
              if (typewriterIntervalRef.current) {
                clearInterval(typewriterIntervalRef.current);
                typewriterIntervalRef.current = null;
              }
              setVisibleCharCount(fullText.length);
              setTypingMessageTimestamp(null);
              setIsSpeaking(false);
              isUserTurnRef.current = true;
              startTimer();
            };

            audio.onloadedmetadata = () => {
              const durationSec = audio.duration;
              startTypewriter(durationSec);
              audio.play().catch((err) => {
                console.warn('[Frontend] Audio play failed (autoplay?), enabling mic:', err);
                enableMicAndCleanup();
                startTypewriter(fullText.length / 18);
                const fallbackMs = Math.max(500, (fullText.length / 18) * 1000);
                setTimeout(enableMicAndCleanup, fallbackMs);
              });
            };
            audio.load();

            audio.onended = enableMicAndCleanup;

            audio.onerror = (e) => {
              console.warn('[Frontend] Audio load/play error:', e);
              enableMicAndCleanup();
            };
          } else {
            startTypewriter(fullText.length / 18);
            setTimeout(() => {
              if (typewriterIntervalRef.current) {
                clearInterval(typewriterIntervalRef.current);
                typewriterIntervalRef.current = null;
              }
              setVisibleCharCount(fullText.length);
              setTypingMessageTimestamp(null);
              setIsSpeaking(false);
              isUserTurnRef.current = true;
              startTimer();
            }, (fullText.length / 18) * 1000 + 200);
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
        navigate(`/interview/${token}`);
        break;
      
      case 'error':
        setError(data.message || 'Произошла ошибка');
        setIsProcessing(false);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  // Timer management
  const startTimer = () => {
    if (timerIntervalRef.current) return; // Already running
    if (!isUserTurnRef.current) return; // Not user's turn
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
  };

  // Toggle listening (microphone) - using Web Speech API
  const toggleListening = () => {
    if (isMuted || timeExpired) return;

    if (isListening) {
      // Stop recording: send accumulated text and stop recognition
      const recognition = (window as any).currentSpeechRecognition;
      if (recognition) {
        if (speechPauseTimeoutRef.current) {
          clearTimeout(speechPauseTimeoutRef.current);
          speechPauseTimeoutRef.current = null;
        }
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          console.log('[Frontend] Sending accumulated text (user stopped):', finalText);
          sendTextMessage(finalText);
          finalTranscriptRef.current = '';
          setInterimTranscript('');
        }
        recognition.stop();
      }
      setIsListening(false);
      return;
    }

    // If we have pending text (recognition ended by itself earlier), send it on this click — never erase
    const pending = finalTranscriptRef.current.trim();
    if (pending) {
      console.log('[Frontend] Sending pending text from previous session:', pending);
      sendTextMessage(pending);
      finalTranscriptRef.current = '';
      setInterimTranscript('');
      return;
    }

    // Not recording and no pending: block start when processing or not user's turn
    if (isProcessing || (!isUserTurnRef.current && !timeExpired)) return;

    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('[Frontend] Web Speech API not supported');
      setError('Web Speech API не поддерживается в вашем браузере. Используйте Chrome или Edge.');
      return;
    }

    // Create SpeechRecognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ru-RU'; // Russian language for interviews

    console.log('[Frontend] SpeechRecognition created:', {
      continuous: recognition.continuous,
      interimResults: recognition.interimResults,
      lang: recognition.lang
    });

    // Reset final transcript for new session
    finalTranscriptRef.current = '';

      recognition.onstart = () => {
        console.log('[Frontend] Speech recognition started');
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';

        // Reset pause timeout when we get new results (user is speaking)
        if (speechPauseTimeoutRef.current) {
          clearTimeout(speechPauseTimeoutRef.current);
          speechPauseTimeoutRef.current = null;
        }

        // Handle Web Speech API results structure
        for (let i = event.resultIndex || 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result.length > 0 && result[0]) {
            const transcript = result[0].transcript;
            if (result.isFinal) {
              finalTranscriptRef.current += transcript + ' ';
              console.log('[Frontend] Final result added:', transcript);
              console.log('[Frontend] Final transcript so far:', finalTranscriptRef.current.trim());

              // Don't send immediately - wait for pause or manual stop
              // This allows user to continue speaking across pauses
            } else {
              currentInterim += transcript;
              console.log('[Frontend] Interim result:', transcript);
            }
          } else {
            console.log('[Frontend] Result structure unexpected:', result);
          }
        }

        // Update UI with interim text + accumulated final text
        const accumulatedText = finalTranscriptRef.current.trim();
        setInterimTranscript(accumulatedText ? `${accumulatedText} ${currentInterim}` : currentInterim);
      };

      recognition.onspeechend = () => {
        console.log('[Frontend] Speech paused (not stopping recognition)');
        // Manual-only: do not auto-send. Clear any lingering pause timeout.
        if (speechPauseTimeoutRef.current) {
          clearTimeout(speechPauseTimeoutRef.current);
          speechPauseTimeoutRef.current = null;
        }
        // User must press the button to finish and send.
      };

      recognition.onend = () => {
        console.log('[Frontend] Speech recognition ended');
        if (speechPauseTimeoutRef.current) {
          clearTimeout(speechPauseTimeoutRef.current);
          speechPauseTimeoutRef.current = null;
        }
        setIsListening(false);
        // Если есть накопленный текст — отправить, чтобы диалог продолжался без повторного нажатия
        const text = finalTranscriptRef.current.trim();
        if (text && wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('[Frontend] Auto-sending on recognition end:', text);
          sendTextMessage(text);
          finalTranscriptRef.current = '';
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event) => {
        console.error('[Frontend] Speech recognition error:', event.error);
        
        // Clear pause timeout
        if (speechPauseTimeoutRef.current) {
          clearTimeout(speechPauseTimeoutRef.current);
          speechPauseTimeoutRef.current = null;
        }

        // Send any accumulated text before error
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          console.log('[Frontend] Sending accumulated text on error:', finalText);
          sendTextMessage(finalText);
          finalTranscriptRef.current = '';
          setInterimTranscript('');
        }

        setError(`Ошибка распознавания речи: ${event.error}`);
        setIsListening(false);
      };

      // Start recognition
      try {
        recognition.start();
        console.log('[Frontend] Starting speech recognition...');

        // Store recognition reference for manual stop
        (window as any).currentSpeechRecognition = recognition;

      } catch (error) {
        console.error('[Frontend] Error starting speech recognition:', error);
        setError('Ошибка запуска распознавания речи');
      }
  };

  // End session
  const handleEndSession = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end' }));
    }
    stopTimer();
    navigate(`/interview/${token}`);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (wsConnectionTimeoutRef.current) {
        clearTimeout(wsConnectionTimeoutRef.current);
      }
      if (speechPauseTimeoutRef.current) {
        clearTimeout(speechPauseTimeoutRef.current);
      }
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      const recognition = (window as any).currentSpeechRecognition;
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

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
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleListening}
              disabled={isMuted || (!isListening && (isProcessing || (!isUserTurnRef.current && !timeExpired)))}
              className={`px-4 sm:px-8 py-2 sm:py-4 rounded-xl transition-all font-semibold ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isMuted || (!isListening && (isProcessing || (!isUserTurnRef.current && !timeExpired)))
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
              }`}
            >
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs font-bold">
                {isListening ? 'ГОВОРЮ' : 'ОТВЕТ'}
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
