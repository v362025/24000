
import React, { useState } from 'react';
import { BrainCircuit, Book, MessageCircle, Trophy, ShoppingBag, Video, Globe, X, Zap } from 'lucide-react';

interface Props {
  onStart: () => void;
  isResume: boolean;
  title?: string;
  message?: string;
  footerText?: string;
  isManualTrigger?: boolean;
}

export const WelcomePopup: React.FC<Props> = ({ onStart, isResume, title, message, footerText, isManualTrigger = false }) => {
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');

  const content = {
      EN: {
          title: "Complete App Guide",
          subtitle: "Explore all features of NST AI",
          features: [
              { icon: Book, title: "Smart Syllabus", desc: "Access Subject-wise Chapters, AI Notes, and PDFs." },
              { icon: Trophy, title: "Mega Exam", desc: "Weekly Global Live Exam. Compete & Win Prizes." },
              { icon: MessageCircle, title: "Universal Chat", desc: "Discuss with AI & Friends. Clear doubts instantly." },
              { icon: Zap, title: "Spin Wheel", desc: "Daily Rewards! Spin to earn free Credits." },
              { icon: ShoppingBag, title: "Premium Store", desc: "Buy Credit Packs & Memberships securely." },
              { icon: Video, title: "Video Lectures", desc: "Exclusive HD Video Classes & Audio Mode." },
          ],
          btn: isResume ? "Continue to App" : "Get Started",
          footer: "Powered by AI"
      },
      HI: {
          title: "ऐप गाइड (App Guide)",
          subtitle: "NST AI के सभी फीचर्स जानें",
          features: [
              { icon: Book, title: "स्मार्ट सिलेबस", desc: "विषयवार अध्याय, एआई नोट्स और पीडीएफ प्राप्त करें।" },
              { icon: Trophy, title: "मेगा एग्जाम", desc: "साप्ताहिक ग्लोबल लाइव परीक्षा। भाग लें और इनाम जीतें।" },
              { icon: MessageCircle, title: "यूनिवर्सल चैट", desc: "एआई और दोस्तों के साथ चर्चा करें। तुरंत डाउट क्लियर करें।" },
              { icon: Zap, title: "स्पिन व्हील", desc: "दैनिक पुरस्कार! मुफ्त क्रेडिट पाने के लिए स्पिन करें।" },
              { icon: ShoppingBag, title: "प्रीमियम स्टोर", desc: "सुरक्षित रूप से क्रेडिट पैक और मेंबरशिप खरीदें।" },
              { icon: Video, title: "वीडियो लेक्चर", desc: "एक्सक्लूसिव एचडी वीडियो क्लास और ऑडियो मोड।" },
          ],
          btn: isResume ? "ऐप पर जाएं" : "शुरू करें",
          footer: "एआई द्वारा संचालित"
      }
  };

  const current = content[lang];

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
       <div className="max-w-4xl w-full bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-[600px]">
          
          {/* LEFT SIDE (Brand) */}
          <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-800 p-8 text-center relative flex flex-col items-center justify-center text-white">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             
             <div className="relative z-10 mb-6 animate-bounce-slow">
                 <div className="bg-white p-6 rounded-[30px] shadow-2xl">
                    <BrainCircuit size={64} className="text-blue-600" />
                 </div>
             </div>
             
             <h1 className="relative z-10 text-4xl font-extrabold mb-2 tracking-tight">NST</h1>
             <p className="relative z-10 text-blue-100 font-bold tracking-[0.3em] text-xs uppercase mb-8">AI Education Revolution</p>

             <div className="relative z-10 flex gap-2 bg-white/10 p-1 rounded-xl backdrop-blur-sm">
                 <button onClick={() => setLang('EN')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${lang === 'EN' ? 'bg-white text-blue-800 shadow-lg' : 'text-blue-100 hover:bg-white/5'}`}>English</button>
                 <button onClick={() => setLang('HI')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${lang === 'HI' ? 'bg-white text-blue-800 shadow-lg' : 'text-blue-100 hover:bg-white/5'}`}>हिंदी</button>
             </div>
          </div>

          {/* RIGHT SIDE (Content) */}
          <div className="md:w-2/3 p-8 flex flex-col bg-slate-50 relative">
             <div className="flex justify-between items-center mb-6">
                 <div>
                     <h2 className="text-2xl font-black text-slate-800">{current.title}</h2>
                     <p className="text-slate-500 font-medium text-sm">{current.subtitle}</p>
                 </div>
                 {isManualTrigger && <button onClick={onStart} className="p-2 hover:bg-slate-200 rounded-full"><X size={24} /></button>}
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {current.features.map((f, i) => (
                         <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                 <f.icon size={20} />
                             </div>
                             <div>
                                 <h3 className="font-bold text-slate-800 text-sm">{f.title}</h3>
                                 <p className="text-[11px] text-slate-500 leading-tight mt-1">{f.desc}</p>
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-xs text-yellow-800 font-medium leading-relaxed">
                     {lang === 'EN' ? "Note: All payments and credits are managed by the Admin. Please use the WhatsApp support button for any queries." : "नोट: सभी भुगतान और क्रेडिट व्यवस्थापक द्वारा प्रबंधित किए जाते हैं। किसी भी प्रश्न के लिए कृपया व्हाट्सएप सहायता बटन का उपयोग करें।"}
                 </div>
             </div>

             <div className="pt-6 mt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{footerText || current.footer}</p>
                <button 
                    onClick={onStart}
                    className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                    {current.btn} <Globe size={16} />
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};
