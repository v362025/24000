
import React, { useState } from 'react';
import { Chapter, ContentType } from '../types';
import { Crown, BookOpen, Lock, X, HelpCircle, FileText, Printer, Star, Zap, ChevronRight, PlayCircle, BarChart } from 'lucide-react';

interface Props {
  chapter: Chapter;
  credits: number;
  isAdmin: boolean;
  isSubscriber: boolean;
  onSelect: (type: ContentType, count?: number) => void;
  onClose: () => void;
}

export const PremiumModal: React.FC<Props> = ({ chapter, credits, isAdmin, isSubscriber, onSelect, onClose }) => {
  const [mcqCount, setMcqCount] = useState(20);

  // Check if user can afford
  const canAccess = (cost: number) => credits >= cost || isAdmin || isSubscriber;

  // Render Action Button
  const ActionButton = ({ 
      icon: Icon, 
      label, 
      sublabel, 
      cost, 
      type, 
      color, 
      isPrimary = false 
  }: { icon: any, label: string, sublabel: string, cost: number, type: ContentType, color: string, isPrimary?: boolean }) => {
      
      const accessible = canAccess(cost);
      
      return (
          <button 
              onClick={() => accessible && onSelect(type)}
              disabled={!accessible}
              className={`relative group w-full flex items-center p-4 rounded-[20px] border-2 transition-all duration-300 ${
                  accessible 
                  ? `bg-white border-slate-100 hover:border-${color}-400 hover:shadow-lg hover:-translate-y-1` 
                  : 'bg-slate-50 border-slate-100 opacity-60 grayscale cursor-not-allowed'
              }`}
          >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-md text-white bg-gradient-to-br ${
                  color === 'blue' ? 'from-blue-500 to-indigo-600' :
                  color === 'purple' ? 'from-purple-500 to-pink-600' :
                  color === 'green' ? 'from-emerald-500 to-green-600' :
                  color === 'orange' ? 'from-orange-500 to-red-600' :
                  'from-slate-500 to-slate-700'
              }`}>
                  <Icon size={24} />
              </div>

              {/* Text */}
              <div className="flex-1 text-left">
                  <div className="font-black text-slate-800 text-sm">{label}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sublabel}</div>
              </div>

              {/* Cost Badge */}
              <div className={`px-3 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1 ${
                  isSubscriber && cost > 0 ? 'bg-purple-100 text-purple-700' : 
                  cost === 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
              }`}>
                  {isSubscriber && cost > 0 ? 'INCLUDED' : cost === 0 ? 'FREE' : <>{cost} <Zap size={10} className="text-yellow-500 fill-yellow-500" /></>}
              </div>

              {/* Lock Overlay if locked */}
              {!accessible && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-[20px] z-10">
                      <Lock className="text-slate-400" size={24} />
                  </div>
              )}
          </button>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-md rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-white">
            
            {/* Header with Chapter Title */}
            <div className="bg-slate-50 p-8 pb-6 text-center relative border-b border-slate-100">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-200 rounded-full hover:bg-slate-300 text-slate-500 transition-colors"><X size={20} /></button>
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <BookOpen size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1 px-4">{chapter.title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Study Mode</p>
            </div>
            
            <div className="p-6 space-y-3 bg-white">
                <ActionButton 
                    icon={FileText} 
                    label="Basic Notes" 
                    sublabel="Standard PDF Viewer" 
                    cost={0} 
                    type="PDF_FREE" 
                    color="green" 
                />
                
                <ActionButton 
                    icon={Crown} 
                    label="Premium Material" 
                    sublabel="High Quality Notes" 
                    cost={5} 
                    type="PDF_PREMIUM" 
                    color="purple" 
                />

                <ActionButton 
                    icon={PlayCircle} 
                    label="Start Practice" 
                    sublabel="MCQ Test Series" 
                    cost={2} 
                    type="MCQ_ANALYSIS" 
                    color="blue" 
                />

                <ActionButton 
                    icon={Star} 
                    label="AI Smart Notes" 
                    sublabel="Generated Summary" 
                    cost={2} 
                    type="NOTES_PREMIUM" 
                    color="orange" 
                />

                <ActionButton 
                    icon={Video} 
                    label="Video Classes" 
                    sublabel="HD Video Lectures" 
                    cost={0} 
                    type="VIDEO_LIST" 
                    color="red" 
                />
            </div>

            {/* Footer with Credits */}
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <Zap className="text-yellow-400 fill-yellow-400" size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Your Balance</div>
                        <div className="font-black text-lg leading-none">{credits} Credits</div>
                    </div>
                </div>
                {!isAdmin && credits < 5 && (
                    <button className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors">
                        Add +
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};
