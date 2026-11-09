import React from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isPlaying, barCount = 28 }) => {
  return (
    <div className="flex items-center gap-[3px] h-10 px-2 py-1 justify-center">
      {Array.from({ length: barCount }).map((_, idx) => {
        // Generate varying heights for natural waveform look
        const baseHeight = 15 + Math.sin(idx * 0.45) * 12 + ((idx % 3) * 6);
        const dynamicHeight = isPlaying
          ? Math.max(12, Math.min(38, baseHeight + Math.sin(idx + Date.now() / 200) * 12))
          : Math.max(6, baseHeight * 0.35);

        return (
          <div
            key={idx}
            className={`w-1 rounded-full transition-all duration-200 ${
              isPlaying
                ? 'bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-300 animate-pulse'
                : 'bg-slate-700/60'
            }`}
            style={{
              height: `${dynamicHeight}px`,
              animationDelay: `${idx * 45}ms`,
            }}
          />
        );
      })}
    </div>
  );
};
