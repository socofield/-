import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, AlertTriangle, ShieldCheck, Bell, Zap } from 'lucide-react';
import Countdown from './components/Countdown';
import SafetyVisual from './components/SafetyVisual';
import { generateReminderText, generateSpeech, generateSafetyImage } from './services/geminiService';
import { UrgencyLevel } from './types';

// Hardcoded deadline: November 30 of the current year (or next if passed)
const getDeadline = () => {
  const now = new Date();
  let year = now.getFullYear();
  const deadline = new Date(year, 10, 30, 23, 59, 59); // Month is 0-indexed (10 = Nov)
  
  if (now > deadline) {
    // If today is Dec 1st, set deadline to next year's Nov 30
    deadline.setFullYear(year + 1);
  }
  return deadline;
};

const DEADLINE = getDeadline();

const App: React.FC = () => {
  // State
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>("Initializing Safety Protocols...");
  const [safetyImageUrl, setSafetyImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.LOW);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Refs for checking time intervals without causing re-renders
  const lastHourCheckRef = useRef<number>(new Date().getHours());

  // Initialize Audio Context on user interaction (required by browsers)
  const initAudio = useCallback(() => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      setAudioContext(ctx);
    }
  }, [audioContext]);

  // Logic to determine urgency based on time remaining
  const calculateUrgency = useCallback(() => {
    const now = new Date();
    const diffTime = Math.abs(DEADLINE.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    let level = UrgencyLevel.LOW;
    if (diffDays <= 2) level = UrgencyLevel.CRITICAL;
    else if (diffDays <= 7) level = UrgencyLevel.HIGH;
    else if (diffDays <= 14) level = UrgencyLevel.MEDIUM;

    setUrgency(level);
    return { level, diffDays, diffHours };
  }, []);

  // Trigger the specific reminder flow (Text -> Audio -> Popup)
  const triggerReminder = useCallback(async (manual = false) => {
    if (!manual) {
        console.log("Auto-triggering reminder...");
    }

    const { level, diffDays, diffHours } = calculateUrgency();
    
    // 1. Get Text
    const text = await generateReminderText(level, diffDays, diffHours);
    setCurrentMessage(text);
    setShowPopup(true);

    // 2. Play Audio if enabled
    if (isSoundEnabled) {
      const buffer = await generateSpeech(text);
      if (buffer) {
         const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
         const source = ctx.createBufferSource();
         source.buffer = buffer;
         source.connect(ctx.destination);
         source.start(0);
      }
    }
  }, [isSoundEnabled, calculateUrgency]);

  // Initial Data Load
  useEffect(() => {
    const { level } = calculateUrgency();
    setIsImageLoading(true);
    generateSafetyImage(level).then((res) => {
      setSafetyImageUrl(res.imageUrl);
      setIsImageLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hourly Timer Check
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();

      // Check if hour has changed
      if (currentHour !== lastHourCheckRef.current) {
        lastHourCheckRef.current = currentHour;
        triggerReminder();
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [triggerReminder]);

  return (
    <div className={`min-h-screen text-white relative overflow-hidden flex flex-col items-center p-4 sm:p-8`}>
      
      {/* Full Screen Animated Background */}
      <SafetyVisual imageUrl={safetyImageUrl} isLoading={isImageLoading} />

      {/* Header */}
      <header className="z-10 w-full max-w-4xl flex justify-between items-center mb-16 mt-4">
        <div className="flex items-center gap-3 backdrop-blur-md bg-black/30 p-3 rounded-2xl border border-white/10">
          <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Safety Course</h1>
            <p className="text-[10px] sm:text-xs text-blue-300 uppercase tracking-widest font-bold">Deadline Guardian System</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            initAudio();
            setIsSoundEnabled(!isSoundEnabled);
          }}
          className={`p-3 rounded-full transition-all duration-300 backdrop-blur-md border shadow-lg ${isSoundEnabled ? 'bg-green-500/20 border-green-400 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 border-red-400 text-red-400 hover:bg-red-500/30'}`}
          title="Toggle Voice Alerts"
        >
          {isSoundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="z-10 w-full max-w-4xl flex flex-col items-center justify-center flex-grow gap-12">
        
        {/* Countdown Section */}
        <div className="w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6 justify-center bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-lg">
            <AlertTriangle className={`w-5 h-5 ${urgency === UrgencyLevel.CRITICAL ? 'animate-bounce text-red-500' : 'text-amber-400'}`} />
            <span className="font-mono text-sm sm:text-base font-bold tracking-wider">DEADLINE: 2024-11-30</span>
          </div>
          
          <div className="scale-110 sm:scale-125 transform transition-transform duration-500">
             <Countdown 
                targetDate={DEADLINE} 
                urgencyColor={urgency === UrgencyLevel.CRITICAL ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]'} 
             />
          </div>
        </div>

        {/* Manual Trigger for Demo */}
        <button 
          onClick={() => { initAudio(); triggerReminder(true); }}
          className="mt-12 flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 transition-all hover:scale-105 active:scale-95 text-sm font-bold tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] group"
        >
          <Bell className="w-4 h-4 group-hover:animate-swing" />
          TEST REMINDER
        </button>

      </main>

      {/* Popup Modal with Punishment Animation */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300" onClick={() => setShowPopup(false)}></div>
          
          {/* Main Card with Shake Animation */}
          <div className="bg-slate-900/90 border-2 border-red-500/50 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.4)] p-8 max-w-md w-full relative z-10 animate-shake overflow-hidden">
            
            {/* Punishment Visuals: Flashing Background Overlay */}
            <div className="absolute inset-0 animate-red-flash pointer-events-none z-0"></div>
            
            {/* Punishment Visuals: Large Watermark/Icon */}
            <div className="absolute -right-12 -top-12 text-red-600/20 rotate-12 pointer-events-none z-0">
                <Zap className="w-64 h-64" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6 text-red-500">
                   <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                     <AlertTriangle className="w-8 h-8 animate-pulse" />
                   </div>
                   <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Deadline Alert</h2>
                </div>
                
                <div className="bg-black/60 rounded-xl p-6 mb-8 border-l-4 border-red-500 backdrop-blur-sm">
                  <p className="text-lg text-slate-200 leading-relaxed font-bold">
                    {currentMessage}
                  </p>
                </div>

                <button 
                  onClick={() => setShowPopup(false)}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] uppercase tracking-wider"
                >
                  I Will Complete It / 我会完成
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="z-10 mt-auto py-6 text-white/40 text-[10px] sm:text-xs text-center font-mono uppercase tracking-widest">
        <p>Safety Management System • AI Powered by Gemini</p>
      </footer>

    </div>
  );
};

export default App;