import React from 'react';

interface SafetyVisualProps {
  imageUrl: string | null;
  isLoading: boolean;
}

const SafetyVisual: React.FC<SafetyVisualProps> = ({ imageUrl, isLoading }) => {
  return (
    <div className="fixed inset-0 -z-10 bg-slate-900 overflow-hidden">
      {/* Loading State Background */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black z-10">
          <div className="flex flex-col items-center p-8 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-blue-400 font-mono animate-pulse">GENERATING SAFETY VISUALIZATION...</p>
          </div>
        </div>
      )}

      {/* Generated Image Background */}
      {imageUrl ? (
        <>
          <img 
            src={imageUrl} 
            alt="Safety Background" 
            className="w-full h-full object-cover animate-kenburns opacity-80"
          />
          {/* Vignette & Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/40"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
        </>
      ) : (
        // Fallback Gradient if no image
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black"></div>
      )}
    </div>
  );
};

export default SafetyVisual;