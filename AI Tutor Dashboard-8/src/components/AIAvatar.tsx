import { useEffect, useState } from 'react';

interface Props {
  isListening?: boolean;
  isSpeaking?: boolean;
}

export function AIAvatar({ isListening = false, isSpeaking = false }: Props) {
  const [breathScale, setBreathScale] = useState(1);

  // Subtle breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() * 0.001;
      setBreathScale(1 + Math.sin(time * 0.8) * 0.02);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Subtle background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-3xl" />
      </div>

      {/* Center avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative"
          style={{
            transform: `scale(${breathScale})`,
            transition: 'transform 0.3s ease-out'
          }}
        >
          {/* Main avatar circle with gradient - фиксированный размер для десктопа */}
          <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 shadow-2xl shadow-indigo-500/30 flex items-center justify-center">
            
            {/* Inner glow layer */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
            
            {/* Avatar initials */}
            <div className="relative z-10">
              <span className="text-6xl font-light text-white/95 tracking-tight">С</span>
            </div>

            {/* Subtle shine effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/30 via-white/10 to-transparent rounded-full blur-xl" />
            </div>

            {/* Active state ring */}
            {(isSpeaking || isListening) && (
              <>
                <div 
                  className={`absolute inset-0 rounded-full ${
                    isSpeaking 
                      ? 'ring-4 ring-emerald-400/60' 
                      : 'ring-4 ring-blue-400/60'
                  }`}
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                />
                <div 
                  className={`absolute -inset-2 rounded-full ${
                    isSpeaking 
                      ? 'ring-2 ring-emerald-300/40' 
                      : 'ring-2 ring-blue-300/40'
                  }`}
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    animationDelay: '0.3s'
                  }}
                />
              </>
            )}
          </div>

          {/* Floating particles when speaking */}
          {isSpeaking && (
            <div className="absolute inset-0">
              <div 
                className="absolute top-1/4 left-0 w-3 h-3 bg-emerald-400/60 rounded-full blur-sm"
                style={{
                  animation: 'float-up-left 3s ease-in-out infinite'
                }}
              />
              <div 
                className="absolute top-1/3 right-0 w-2.5 h-2.5 bg-teal-400/60 rounded-full blur-sm"
                style={{
                  animation: 'float-up-right 3.5s ease-in-out infinite',
                  animationDelay: '0.5s'
                }}
              />
              <div 
                className="absolute top-1/2 left-8 w-2 h-2 bg-cyan-400/60 rounded-full blur-sm"
                style={{
                  animation: 'float-up-left 4s ease-in-out infinite',
                  animationDelay: '1s'
                }}
              />
              <div 
                className="absolute top-1/2 right-8 w-2 h-2 bg-emerald-300/60 rounded-full blur-sm"
                style={{
                  animation: 'float-up-right 3.8s ease-in-out infinite',
                  animationDelay: '1.5s'
                }}
              />
            </div>
          )}

          {/* Sound wave visualization when speaking */}
          {isSpeaking && (
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-2">
              <div className="w-1.5 h-8 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full opacity-70">
                <div 
                  className="w-full h-full bg-gradient-to-t from-emerald-400 to-emerald-200 rounded-full"
                  style={{ animation: 'sound-wave 0.8s ease-in-out infinite' }}
                />
              </div>
              <div className="w-1.5 h-12 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full opacity-70">
                <div 
                  className="w-full h-full bg-gradient-to-t from-emerald-400 to-emerald-200 rounded-full"
                  style={{ animation: 'sound-wave 0.8s ease-in-out infinite', animationDelay: '0.1s' }}
                />
              </div>
              <div className="w-1.5 h-16 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full opacity-70">
                <div 
                  className="w-full h-full bg-gradient-to-t from-emerald-400 to-emerald-200 rounded-full"
                  style={{ animation: 'sound-wave 0.8s ease-in-out infinite', animationDelay: '0.2s' }}
                />
              </div>
              <div className="w-1.5 h-12 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full opacity-70">
                <div 
                  className="w-full h-full bg-gradient-to-t from-emerald-400 to-emerald-200 rounded-full"
                  style={{ animation: 'sound-wave 0.8s ease-in-out infinite', animationDelay: '0.3s' }}
                />
              </div>
              <div className="w-1.5 h-8 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full opacity-70">
                <div 
                  className="w-full h-full bg-gradient-to-t from-emerald-400 to-emerald-200 rounded-full"
                  style={{ animation: 'sound-wave 0.8s ease-in-out infinite', animationDelay: '0.4s' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes float-up-left {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(-60px, -120px) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes float-up-right {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(60px, -120px) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes sound-wave {
          0%, 100% {
            transform: scaleY(0.4);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}