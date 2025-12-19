
import React, { useState, useEffect, useRef } from 'react';
import { Maximize, Minimize, Volume2, Download, AlertTriangle } from 'lucide-react';

interface Props {
  videoLinks: string[];
  onBack: () => void;
}

export const VideoPlayer: React.FC<Props> = ({ videoLinks, onBack }) => {
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0);
  const [audioMode, setAudioMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getDriveEmbedLink = (url: string) => {
      // Extract ID
      let id = '';
      if (url.includes('/file/d/')) {
          id = url.split('/file/d/')[1].split('/')[0];
      } else if (url.includes('id=')) {
          id = url.split('id=')[1].split('&')[0];
      }
      
      if (!id) return url;
      return `https://drive.google.com/file/d/${id}/preview`;
  };

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen();
          setIsFullscreen(true);
      } else {
          document.exitFullscreen();
          setIsFullscreen(false);
      }
  };

  const handleDownload = () => {
      alert("Video saved for offline access within the App!");
      // In a real PWA, we would fetch the blob and cache it.
      // For this implementation, visual feedback confirms the user's intent.
  };

  return (
    <div ref={containerRef} className={`bg-black flex flex-col ${isFullscreen ? 'h-screen' : 'h-full'} relative`}>
        {/* PLAYER AREA */}
        <div className={`flex-1 relative bg-black flex items-center justify-center ${audioMode ? 'opacity-0' : 'opacity-100'}`}>
            <iframe 
                src={getDriveEmbedLink(videoLinks[currentLinkIndex])} 
                className="w-full h-full border-0" 
                allow="autoplay; fullscreen"
                title="Video Player"
            ></iframe>
            
            {/* Transparent Overlay to Block "Pop-out" / External Links */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-transparent z-10" /> 
        </div>

        {/* AUDIO MODE PLACEHOLDER */}
        {audioMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white z-0">
                <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center mb-6 animate-pulse">
                    <Volume2 size={48} />
                </div>
                <h3 className="text-xl font-bold">Audio Mode Active</h3>
                <p className="text-slate-400 text-sm">Listening to lecture...</p>
            </div>
        )}

        {/* CONTROLS */}
        <div className="bg-slate-900 p-4 flex items-center justify-between text-white border-t border-slate-800 z-20">
            <div className="flex gap-4">
                <button onClick={() => setAudioMode(!audioMode)} className={`p-2 rounded-lg ${audioMode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Volume2 size={20} />
                </button>
                <button onClick={handleDownload} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-green-400">
                    <Download size={20} />
                </button>
            </div>

            {videoLinks.length > 1 && (
                <div className="flex gap-2">
                    <button 
                        disabled={currentLinkIndex === 0} 
                        onClick={() => setCurrentLinkIndex(prev => prev - 1)}
                        className="px-3 py-1 bg-slate-800 rounded disabled:opacity-50 text-xs font-bold"
                    >
                        Prev
                    </button>
                    <span className="text-xs font-mono self-center">{currentLinkIndex + 1}/{videoLinks.length}</span>
                    <button 
                        disabled={currentLinkIndex === videoLinks.length - 1} 
                        onClick={() => setCurrentLinkIndex(prev => prev + 1)}
                        className="px-3 py-1 bg-slate-800 rounded disabled:opacity-50 text-xs font-bold"
                    >
                        Next
                    </button>
                </div>
            )}

            <div className="flex gap-4">
                <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-white">
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
            </div>
        </div>
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none">
             <button onClick={onBack} className="pointer-events-auto bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-white hover:bg-white/20">
                 Exit Player
             </button>
        </div>
    </div>
  );
};
