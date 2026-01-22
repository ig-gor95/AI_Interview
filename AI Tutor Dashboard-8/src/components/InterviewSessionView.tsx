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
const WS_BASE_URL = import.meta.env.VITE_WS_URL || (API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://'));

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
  
  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUserTurnRef = useRef(false); // Таймер работает только когда пользователь должен отвечать
  const sessionDurationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

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
        
        if (response.isResume && response.transcript.length > 0) {
          setTranscript(response.transcript);
          setShowResumeDialog(true);
          
          // Determine if it's user's turn based on last message
          const lastMessage = response.transcript[response.transcript.length - 1];
          if (lastMessage && lastMessage.role === 'ai') {
            // Last message is from AI, so user should respond
            isUserTurnRef.current = true;
          }
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
      return; // Already connected
    }

    const wsUrl = `${WS_BASE_URL}/ws/session/${sid}?candidate_name=Гость`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Ошибка подключения к серверу');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    wsRef.current = ws;
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case 'connected':
        console.log('Connected to session');
        break;
      
      case 'resume':
        // Session resumed - transcript already loaded from startSession
        setShowResumeDialog(false);
        setSessionStarted(true);
        if (data.transcript && data.transcript.length > 0) {
          setTranscript(data.transcript);
        }
        // Timer will be managed based on user turn
        break;
      
      case 'message':
        if (data.role === 'ai') {
          setIsSpeaking(true);
          setIsProcessing(false);
          isUserTurnRef.current = false; // AI говорит - останавливаем таймер
          stopTimer();
          
          const newMessage: TranscriptMessage = {
            role: 'ai',
            message: data.message || '',
            timestamp: data.timestamp || new Date().toISOString(),
            audioUrl: data.audio_url
          };
          
          setTranscript(prev => [...prev, newMessage]);
          
          // После того как AI закончил говорить, запускаем таймер
          // Предполагаем, что AI говорит ~3 секунды (можно улучшить, слушая audioUrl)
          setTimeout(() => {
            setIsSpeaking(false);
            isUserTurnRef.current = true; // Теперь пользователь должен отвечать
            startTimer();
          }, 3000);
        }
        break;
      
      case 'transcription':
        // User message transcription confirmed
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
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket не подключен');
      return;
    }

    setShowResumeDialog(false);
    setSessionStarted(true);
    
    // Send start message
    wsRef.current.send(JSON.stringify({ type: 'start' }));
    
    // Timer will start when AI finishes speaking (in handleWebSocketMessage)
    // Duration and remaining time are already set from loadSession
  };

  // Resume session
  const handleResumeSession = () => {
    if (!sessionId) return;
    
    // WebSocket should already be connected from loadSession
    setShowResumeDialog(false);
    setSessionStarted(true);
    
    // Timer is already initialized from loadSession
    // Start timer if it's user's turn
    if (isUserTurnRef.current && timeRemaining !== null && timeRemaining > 0 && !timeExpired) {
      startTimer();
    }
  };

  // Send audio chunk
  const sendAudioChunk = (audioData: ArrayBuffer) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Convert ArrayBuffer to base64
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(audioData))
    );

    wsRef.current.send(JSON.stringify({
      type: 'audio',
      data: base64
    }));
  };

  // Send text message
  const sendTextMessage = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'text',
      text: text
    }));

    // Add user message to transcript
    const userMessage: TranscriptMessage = {
      role: 'user',
      message: text,
      timestamp: new Date().toISOString()
    };
    setTranscript(prev => [...prev, userMessage]);
    
    setIsProcessing(true);
    isUserTurnRef.current = false; // Пользователь отправил сообщение - останавливаем таймер
    stopTimer();
  };

  // Toggle listening (microphone)
  const toggleListening = () => {
    if (isMuted || isProcessing || timeExpired) return;

    if (!isListening) {
      // Start recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          const audioChunks: Blob[] = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioBlob.arrayBuffer().then(buffer => {
              sendAudioChunk(buffer);
              setIsListening(false);
            });
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsListening(true);

          // Store MediaRecorder reference for manual stop
          (window as any).currentMediaRecorder = mediaRecorder;
          
          // Auto-stop after 30 seconds
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 30000);
        })
        .catch(error => {
          console.error('Error accessing microphone:', error);
          setError('Не удалось получить доступ к микрофону');
        });
    } else {
      // Stop recording manually
      const recorder = (window as any).currentMediaRecorder;
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
      }
      setIsListening(false);
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
      if (wsRef.current) {
        wsRef.current.close();
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
              {isConnected ? 'Готово к началу' : 'Подключение...'}
            </p>
          </div>

          <button
            onClick={handleStartSession}
            disabled={!isConnected}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5" />
            Войти в интервью
          </button>
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
                    {msg.message}
                  </div>
                </div>
              ))}
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
              disabled={isMuted || isProcessing || (!isUserTurnRef.current && !timeExpired)}
              className={`px-4 sm:px-8 py-2 sm:py-4 rounded-xl transition-all font-semibold ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isMuted || isProcessing || (!isUserTurnRef.current && !timeExpired)
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
