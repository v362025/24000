
import React, { useEffect, useState, useRef } from 'react';
import { User, ViewState, SystemSettings, Subject, Chapter, MCQItem, RecoveryRequest, ActivityLogEntry, RecycleBinItem, Stream, Board, ClassLevel, GiftCode, SubscriptionPlan } from '../types';
import { Users, Search, Trash2, Save, X, Eye, Shield, Megaphone, CheckCircle, ListChecks, Database, FileText, Monitor, Sparkles, Banknote, BrainCircuit, AlertOctagon, ArrowLeft, Key, Bell, ShieldCheck, Zap, RefreshCw, RotateCcw, Plus, LogOut, Download, Upload, Video, Link, Gift, Book, Mail, Edit3, MessageSquare, ShoppingBag, Cloud, Rocket, Code2, Layers as LayersIcon, Wifi, WifiOff, Copy, ClipboardPaste, Table, Trophy, Clock, Lock, Gamepad2 } from 'lucide-react';
import { getSubjectsList, DEFAULT_SUBJECTS } from '../constants';
import { fetchChapters } from '../services/gemini';
import { saveChapterData, bulkSaveLinks, checkFirebaseConnection } from '../services/firebase';
// @ts-ignore
import JSZip from 'jszip';

interface Props {
  onNavigate: (view: ViewState) => void;
  settings?: SystemSettings;
  onUpdateSettings?: (s: SystemSettings) => void;
  onImpersonate?: (user: User) => void;
  logActivity: (action: string, details: string) => void;
}

// --- MERGED TAB DEFINITIONS ---
type AdminTab = 
  | 'DASHBOARD' | 'USERS' | 'CODES' | 'SUBJECTS_MGR' | 'MEGA_TEST' 
  | 'LEADERBOARD' | 'NOTICES' | 'DATABASE' | 'DEPLOY' | 'ACCESS' 
  | 'LOGS' | 'DEMAND' | 'RECYCLE' | 'SYLLABUS_MANAGER' 
  | 'CONTENT_PDF' | 'CONTENT_MCQ' | 'CONTENT_TEST' | 'BULK_UPLOAD'    
  | 'CONFIG_GENERAL' | 'CONFIG_SECURITY' | 'CONFIG_VISIBILITY' | 'CONFIG_AI' | 'CONFIG_ADS' | 'CONFIG_PAYMENT' | 'CONFIG_GAME';

interface ContentConfig {
    freeLink?: string;
    premiumLink?: string;
    price?: number;
    manualMcqData?: MCQItem[];
    weeklyTestMcqData?: MCQItem[];
    videoLinks?: string[];
}

export const AdminDashboard: React.FC<Props> = ({ onNavigate, settings, onUpdateSettings, onImpersonate, logActivity }) => {
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  
  // --- DATA LISTS ---
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);
  const [recoveryRequests, setRecoveryRequests] = useState<RecoveryRequest[]>([]);
  const [demands, setDemands] = useState<{id:string, details:string, timestamp:string}[]>([]);
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);

  // --- MEGA TEST STATE ---
  const [megaQuestions, setMegaQuestions] = useState<MCQItem[]>([]);
  
  // --- IMPORT MODAL STATE ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [importTarget, setImportTarget] = useState<'MEGA' | 'CHAPTER_MCQ' | 'CHAPTER_TEST'>('MEGA');

  // --- DATABASE EDITOR ---
  const [dbKey, setDbKey] = useState('nst_users');
  const [dbContent, setDbContent] = useState('');

  // --- SETTINGS STATE ---
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings || {
      appName: 'NST', themeColor: '#3b82f6', maintenanceMode: false,
      maintenanceMessage: 'Upgrading servers...', customCSS: '', apiKeys: [],
      adminCode: '', adminEmail: '', adminPhone: '', footerText: 'Nadim Anwar',
      welcomeTitle: 'AI Study', welcomeMessage: 'Welcome',
      aiModel: 'gemini-2.5-flash', aiInstruction: '',
      marqueeLines: ["Welcome to NST"],
      wheelRewards: [0,1,2,5], chatCost: 1, dailyReward: 3, signupBonus: 2,
      isChatEnabled: true, isGameEnabled: true, allowSignup: true, loginMessage: '',
      allowedClasses: ['9', '10', '11', '12'], allowedBoards: ['CBSE', 'BSEB'], allowedStreams: ['Science', 'Arts'],
      isPaymentEnabled: true, upiId: '', packages: [],
      // Global Defaults
      globalContentPrices: { pdf: 5, notes: 2, test: 10, video: 0 },
      chatCooldownMinutes: 60,
      subscriptionPlans: [
          { id: 'plan-default-1', name: 'Weekly Pro', duration: 'WEEKLY', price: 49, originalPrice: 99, discountPercent: 50, description: '7 Days Access', features: ['PDF Downloads', 'No Ads'], isActive: true },
          { id: 'plan-default-2', name: 'Monthly Pro', duration: 'MONTHLY', price: 199, originalPrice: 499, discountPercent: 60, description: '30 Days Access', features: ['All Content', 'Priority Support'], isActive: true },
          { id: 'plan-default-3', name: 'Yearly Elite', duration: 'YEARLY', price: 999, originalPrice: 2999, discountPercent: 65, description: 'Full Year Access', features: ['Everything Unlocked', 'VIP Badge'], isActive: true }
      ],
      startupAd: { enabled: true, title: "Premium App", bgColor: "#1e293b", textColor: "#ffffff" },
      // Mega Test Defaults
      isMegaTestLive: false, megaTestQuestionLimit: 50,
      megaTestPrizes: { rank1: 100, rank2: 50, rank3: 25, above60: 10, above45: 5, above30: 2 },
      // Game Defaults
      spinLimitFree: 1, spinLimitPremium: 5
  } as any);

  // --- SUBSCRIPTION STATE ---
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [newPlanPrice, setNewPlanPrice] = useState(199);
  const [newPlanOriginalPrice, setNewPlanOriginalPrice] = useState(499);
  
  // Subscription Grant State (User Edit)
  const [selectedGrantPlanId, setSelectedGrantPlanId] = useState('');

  // --- PACKAGE & SUBJECT STATE ---
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgCredits, setNewPkgCredits] = useState('');
  const [customSubjects, setCustomSubjects] = useState<any>({});
  const [newSubName, setNewSubName] = useState('');
  const [newSubIcon, setNewSubIcon] = useState('book');
  const [newSubColor, setNewSubColor] = useState('bg-slate-50 text-slate-600');

  // --- CONTENT SELECTION STATE ---
  const [selBoard, setSelBoard] = useState<Board>('CBSE');
  const [selClass, setSelClass] = useState<ClassLevel>('10');
  const [selStream, setSelStream] = useState<Stream>('Science');
  const [selSubject, setSelSubject] = useState<Subject | null>(null);
  const [selChapters, setSelChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [bulkData, setBulkData] = useState<Record<string, {free: string, premium: string, price: number}>>({});

  // --- EDITING STATE ---
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<ContentConfig>({ freeLink: '', premiumLink: '', price: 0, videoLinks: [] });
  const [editingMcqs, setEditingMcqs] = useState<MCQItem[]>([]);
  const [editingTestMcqs, setEditingTestMcqs] = useState<MCQItem[]>([]);
  const [newVideoLink, setNewVideoLink] = useState('');
  
  // --- USER EDIT MODAL STATE ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserCredits, setEditUserCredits] = useState(0);
  const [editUserPass, setEditUserPass] = useState('');
  const [dmText, setDmText] = useState('');
  const [dmUser, setDmUser] = useState<User | null>(null);

  // --- GIFT CODE STATE ---
  const [newCodeAmount, setNewCodeAmount] = useState(10);
  const [newCodeCount, setNewCodeCount] = useState(1);

  // --- INITIAL LOAD ---
  useEffect(() => {
      loadData();
      setIsFirebaseConnected(checkFirebaseConnection());
      const interval = setInterval(loadData, 5000); 
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (activeTab === 'DATABASE') setDbContent(localStorage.getItem(dbKey) || '');
  }, [activeTab, dbKey]);

  useEffect(() => {
      if (!['SYLLABUS_MANAGER', 'CONTENT_PDF', 'CONTENT_MCQ', 'CONTENT_TEST', 'BULK_UPLOAD'].includes(activeTab)) {
          setSelSubject(null); setEditingChapterId(null);
      }
  }, [activeTab]);

  const loadData = () => {
      const storedUsersStr = localStorage.getItem('nst_users');
      if (storedUsersStr) setUsers(JSON.parse(storedUsersStr));
      const demandStr = localStorage.getItem('nst_demand_requests');
      if (demandStr) setDemands(JSON.parse(demandStr));
      const reqStr = localStorage.getItem('nst_recovery_requests');
      if (reqStr) setRecoveryRequests(JSON.parse(reqStr));
      const codesStr = localStorage.getItem('nst_admin_codes');
      if (codesStr) setGiftCodes(JSON.parse(codesStr));
      const subStr = localStorage.getItem('nst_custom_subjects_pool');
      if (subStr) setCustomSubjects(JSON.parse(subStr));
      
      // Load Mega Test
      const megaStr = localStorage.getItem('nst_mega_test_questions');
      if (megaStr) setMegaQuestions(JSON.parse(megaStr));

      const binStr = localStorage.getItem('nst_recycle_bin');
      if (binStr) {
          const binItems: RecycleBinItem[] = JSON.parse(binStr);
          const validItems = binItems.filter(item => new Date(item.expiresAt) > new Date());
          if (validItems.length !== binItems.length) localStorage.setItem('nst_recycle_bin', JSON.stringify(validItems));
          setRecycleBin(validItems);
      }
  };

  // --- HANDLERS ---
  const handleSaveSettings = () => {
      if (onUpdateSettings) {
          onUpdateSettings(localSettings);
          localStorage.setItem('nst_system_settings', JSON.stringify(localSettings));
          logActivity("SETTINGS_UPDATE", "Updated system settings");
          alert("✅ Settings Saved!");
      }
  };

  const toggleSetting = (key: keyof SystemSettings) => {
      const newVal = !localSettings[key];
      const updated = { ...localSettings, [key]: newVal };
      setLocalSettings(updated);
      if(onUpdateSettings) onUpdateSettings(updated);
  };

  const addSubscriptionPlan = () => {
      if (!newPlanName) return;
      const discount = newPlanOriginalPrice > newPlanPrice 
          ? Math.round(((newPlanOriginalPrice - newPlanPrice) / newPlanOriginalPrice) * 100) 
          : 0;
      const newPlan: SubscriptionPlan = {
          id: `plan-${Date.now()}`,
          name: newPlanName,
          duration: newPlanDuration,
          price: newPlanPrice,
          originalPrice: newPlanOriginalPrice,
          discountPercent: discount,
          description: `Access for 1 ${newPlanDuration.toLowerCase().slice(0, -2)}`,
          features: ['All Premium PDF', 'Unlimited Chat', 'Exam Access'],
          isActive: true
      };
      const updated = { ...localSettings, subscriptionPlans: [...(localSettings.subscriptionPlans || []), newPlan] };
      setLocalSettings(updated);
      setNewPlanName(''); setNewPlanPrice(199); setNewPlanOriginalPrice(499);
  };

  const removeSubscriptionPlan = (id: string) => {
      const updated = { ...localSettings, subscriptionPlans: localSettings.subscriptionPlans?.filter(p => p.id !== id) };
      setLocalSettings(updated);
  };

  const addPackage = () => { 
      if (!newPkgName || !newPkgPrice || !newPkgCredits) return; 
      const newPkg = { id: `pkg-${Date.now()}`, name: newPkgName, price: Number(newPkgPrice), credits: Number(newPkgCredits) }; 
      const currentPkgs = localSettings.packages || []; 
      const updatedPkgs = [...currentPkgs, newPkg]; 
      setLocalSettings({ ...localSettings, packages: updatedPkgs }); 
      setNewPkgName(''); setNewPkgPrice(''); setNewPkgCredits(''); 
  };
  const removePackage = (id: string) => { 
      const currentPkgs = localSettings.packages || []; 
      setLocalSettings({ ...localSettings, packages: currentPkgs.filter(p => p.id !== id) }); 
  };

  // --- IMPORT LOGIC ---
  const openImportModal = (target: 'MEGA' | 'CHAPTER_MCQ' | 'CHAPTER_TEST') => {
      setImportTarget(target); setShowImportModal(true);
  };

  const handleBulkImport = () => {
    if (!pasteData.trim()) return;
    const rows = pasteData.trim().split('\n');
    const newMcqs: MCQItem[] = [];
    rows.forEach(row => {
        const columns = row.includes('\t') ? row.split('\t') : row.split(',');
        if (columns.length >= 6) {
            const question = columns[0].trim();
            const options = [columns[1].trim(), columns[2].trim(), columns[3].trim(), columns[4].trim()];
            let correctChar = columns[5].trim().toUpperCase();
            let correctIdx = 0;
            if (['A', '1'].includes(correctChar)) correctIdx = 0;
            else if (['B', '2'].includes(correctChar)) correctIdx = 1;
            else if (['C', '3'].includes(correctChar)) correctIdx = 2;
            else if (['D', '4'].includes(correctChar)) correctIdx = 3;
            newMcqs.push({ question, options, correctAnswer: correctIdx, explanation: columns[6] ? columns[6].trim() : "Verified" });
        }
    });

    if (importTarget === 'MEGA') {
        const final = [...megaQuestions, ...newMcqs];
        setMegaQuestions(final); localStorage.setItem('nst_mega_test_questions', JSON.stringify(final));
    } else if (importTarget === 'CHAPTER_MCQ') {
        setEditingMcqs([...editingMcqs, ...newMcqs]);
    } else {
        setEditingTestMcqs([...editingTestMcqs, ...newMcqs]);
    }
    setPasteData(''); setShowImportModal(false);
    alert(`✅ Successfully imported ${newMcqs.length} questions!`);
  };

  // --- DEPLOYMENT ---
  const handleDownloadSource = async () => {
      const zip = new JSZip();
      const currentData: any = {};
      const dataVersion = Date.now().toString();
      currentData['nst_data_version'] = dataVersion;
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nst_')) {
              try { currentData[key] = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { currentData[key] = localStorage.getItem(key); }
          }
      }
      zip.file("README.md", `# NST AI App v${dataVersion}`);
      const src = zip.folder("src");
      src?.file("initialData.json", JSON.stringify(currentData, null, 2));
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(content);
      link.download = `NST_App_v${dataVersion}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("✅ Update Package Downloaded! Upload to Vercel.");
  };

  // --- RECYCLE BIN ---
  const softDelete = (type: RecycleBinItem['type'], name: string, data: any, originalKey?: string, originalId?: string) => {
      if (!window.confirm(`Delete "${name}"?`)) return false;
      const newItem: RecycleBinItem = { id: Date.now().toString(), originalId: originalId || Date.now().toString(), type, name, data, deletedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), restoreKey: originalKey };
      const newBin = [...recycleBin, newItem];
      setRecycleBin(newBin);
      localStorage.setItem('nst_recycle_bin', JSON.stringify(newBin));
      return true;
  };
  const handleRestoreItem = (item: RecycleBinItem) => {
      if (!window.confirm(`Restore "${item.name}"?`)) return;
      if (item.type === 'USER') {
          const stored = localStorage.getItem('nst_users');
          const users: User[] = stored ? JSON.parse(stored) : [];
          if (!users.some(u => u.id === item.data.id)) { users.push(item.data); localStorage.setItem('nst_users', JSON.stringify(users)); } 
          else { alert("User ID already exists."); return; }
      } else if (item.restoreKey) {
          if (item.type === 'CHAPTER') { const list = JSON.parse(localStorage.getItem(item.restoreKey) || '[]'); list.push(item.data); localStorage.setItem(item.restoreKey, JSON.stringify(list)); }
          else { localStorage.setItem(item.restoreKey, JSON.stringify(item.data)); }
      }
      const newBin = recycleBin.filter(i => i.id !== item.id);
      setRecycleBin(newBin); localStorage.setItem('nst_recycle_bin', JSON.stringify(newBin)); loadData(); 
  };

  // --- USER MANAGEMENT ---
  const deleteUser = (userId: string) => {
      const u = users.find(user => user.id === userId);
      if (u && softDelete('USER', u.name, u, undefined, u.id)) {
          const updated = users.filter(user => user.id !== userId);
          setUsers(updated); localStorage.setItem('nst_users', JSON.stringify(updated));
      }
  };
  const saveEditedUser = () => { 
      if (!editingUser) return; 
      const updatedList = users.map(u => u.id === editingUser.id ? { ...editingUser, credits: editUserCredits, password: editUserPass } : u); 
      setUsers(updatedList); localStorage.setItem('nst_users', JSON.stringify(updatedList)); setEditingUser(null); 
  };
  
  // NEW: GRANT SUBSCRIPTION LOGIC
  const handleGrantSubscription = () => {
      if(!editingUser || !selectedGrantPlanId) return;
      const plan = localSettings.subscriptionPlans?.find(p => p.id === selectedGrantPlanId);
      if(!plan) return;

      const expiry = new Date();
      if(plan.duration === 'WEEKLY') expiry.setDate(expiry.getDate() + 7);
      if(plan.duration === 'MONTHLY') expiry.setMonth(expiry.getMonth() + 1);
      if(plan.duration === 'YEARLY') expiry.setFullYear(expiry.getFullYear() + 1);

      const updatedUser: User = { 
          ...editingUser, 
          credits: editUserCredits, // Ensure credits are also saved from state
          password: editUserPass,
          subscriptionPlanId: plan.id,
          subscriptionExpiry: expiry.toISOString(),
          isPremium: true
      };

      const updatedList = users.map(u => u.id === editingUser.id ? updatedUser : u);
      setUsers(updatedList);
      localStorage.setItem('nst_users', JSON.stringify(updatedList));
      setEditingUser(updatedUser); // Update local modal state
      alert(`✅ Granted ${plan.name} to ${updatedUser.name}`);
  };

  const handleRevokeSubscription = () => {
      if(!editingUser) return;
      if(!window.confirm("Are you sure you want to remove the subscription?")) return;
      
      const updatedUser: User = {
          ...editingUser,
          credits: editUserCredits,
          password: editUserPass,
          subscriptionPlanId: undefined,
          subscriptionExpiry: undefined,
          isPremium: false
      };

      const updatedList = users.map(u => u.id === editingUser.id ? updatedUser : u);
      setUsers(updatedList);
      localStorage.setItem('nst_users', JSON.stringify(updatedList));
      setEditingUser(updatedUser);
      alert("Subscription Removed.");
  };

  // --- GIFT CODES ---
  const generateCodes = () => {
      const newCodes: GiftCode[] = [];
      for (let i = 0; i < newCodeCount; i++) {
          newCodes.push({ id: Date.now().toString() + i, code: `NST-${Math.random().toString(36).substring(2,7).toUpperCase()}-${newCodeAmount}`, amount: newCodeAmount, createdAt: new Date().toISOString(), isRedeemed: false, generatedBy: 'ADMIN' });
      }
      const updated = [...newCodes, ...giftCodes];
      setGiftCodes(updated); localStorage.setItem('nst_admin_codes', JSON.stringify(updated));
      alert(`${newCodeCount} Codes Generated!`);
  };
  const deleteCode = (id: string) => {
      const c = giftCodes.find(x => x.id === id);
      if(c && softDelete('POST', `Code: ${c.code}`, c, 'nst_admin_codes', c.id)) {
           const updated = giftCodes.filter(x => x.id !== id);
           setGiftCodes(updated); localStorage.setItem('nst_admin_codes', JSON.stringify(updated));
      }
  };

  // --- CONTENT LOGIC ---
  const handleSubjectClick = async (s: Subject) => {
      setSelSubject(s); setIsLoadingChapters(true);
      try {
          const ch = await fetchChapters(selBoard, selClass, selStream, s, 'English');
          setSelChapters(ch);
      } catch (e) { setSelChapters([]); }
      setIsLoadingChapters(false);
  };

  const loadChapterContent = (chId: string) => {
      const key = `nst_content_${selBoard}_${selClass}-${selStream}_${selSubject?.name}_${chId}`;
      const stored = localStorage.getItem(key);
      if (stored) { 
          const data = JSON.parse(stored); 
          setEditConfig({ ...data, videoLinks: data.videoLinks || [] }); 
          setEditingMcqs(data.manualMcqData || []); 
          setEditingTestMcqs(data.weeklyTestMcqData || []); 
      }
      else { 
          setEditConfig({ freeLink: '', premiumLink: '', price: localSettings.globalContentPrices?.pdf || 5, videoLinks: [] }); 
          setEditingMcqs([]); 
          setEditingTestMcqs([]); 
      }
      setEditingChapterId(chId);
  };

  const saveChapterContent = () => {
      if (!editingChapterId || !selSubject) return;
      const key = `nst_content_${selBoard}_${selClass}-${selStream}_${selSubject.name}_${editingChapterId}`;
      const newData = { ...editConfig, manualMcqData: editingMcqs, weeklyTestMcqData: editingTestMcqs };
      localStorage.setItem(key, JSON.stringify(newData));
      if (isFirebaseConnected) { saveChapterData(key, newData); alert("✅ Saved to Firebase!"); } else alert("⚠️ Saved Locally.");
  };

  const addVideoLink = () => {
      if(!newVideoLink.trim()) return;
      setEditConfig({...editConfig, videoLinks: [...(editConfig.videoLinks || []), newVideoLink.trim()]});
      setNewVideoLink('');
  };

  const removeVideoLink = (idx: number) => {
      setEditConfig({...editConfig, videoLinks: editConfig.videoLinks?.filter((_, i) => i !== idx)});
  };

  // --- RENDER HELPERS ---
  const DashboardCard = ({ icon: Icon, label, onClick, color, count }: any) => (
      <button onClick={onClick} className={`p-4 rounded-[32px] border-2 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 bg-white border-slate-100 hover:border-${color}-400 hover:bg-${color}-50 shadow-sm`}>
          <div className={`p-3 rounded-2xl bg-${color}-100 text-${color}-600`}><Icon size={24} /></div>
          <span className="font-black text-[10px] uppercase text-slate-600 tracking-wider">{label}</span>
          {count !== undefined && <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500">{count}</span>}
      </button>
  );

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      
      {/* IMPORT MODAL */}
      {showImportModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in">
                  <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><ClipboardPaste className="text-blue-600" /> Import Questions ({importTarget})</h3>
                      <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="p-6">
                      <textarea value={pasteData} onChange={e => setPasteData(e.target.value)} className="w-full h-64 p-4 border-2 border-dashed border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Paste: Question | A | B | C | D | Correct (A/B/C/D)" />
                      <button onClick={handleBulkImport} className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Zap size={18} /> Process Import</button>
                  </div>
              </div>
          </div>
      )}

      {/* USER EDIT MODAL */}
      {editingUser && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in">
                  <div className="bg-slate-50 p-6 border-b flex justify-between items-center">
                      <h3 className="text-lg font-black text-slate-800">Edit User: {editingUser.name}</h3>
                      <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div><label className="text-xs font-bold uppercase text-slate-500">Credits</label><input type="number" value={editUserCredits} onChange={e => setEditUserCredits(Number(e.target.value))} className="w-full p-3 border rounded-xl" /></div>
                      <div><label className="text-xs font-bold uppercase text-slate-500">Password</label><input type="text" value={editUserPass} onChange={e => setEditUserPass(e.target.value)} className="w-full p-3 border rounded-xl" /></div>
                      
                      {/* SUBSCRIPTION MANAGEMENT */}
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                          <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2"><Zap size={16} /> Manage Subscription</h4>
                          {editingUser.isPremium && editingUser.subscriptionPlanId ? (
                             <div className="mb-3 p-3 bg-white rounded-lg border border-purple-100 shadow-sm">
                                 <p className="text-xs font-bold text-slate-600">Active Plan: <span className="text-purple-600">{localSettings.subscriptionPlans?.find(p => p.id === editingUser.subscriptionPlanId)?.name || 'Unknown'}</span></p>
                                 <p className="text-[10px] text-slate-400">Expires: {new Date(editingUser.subscriptionExpiry || '').toLocaleDateString()}</p>
                                 <button onClick={handleRevokeSubscription} className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-700 underline">Revoke Subscription</button>
                             </div>
                          ) : (
                             <div className="mb-3"><p className="text-xs text-slate-400 italic">No active subscription.</p></div>
                          )}
                          
                          <div className="flex gap-2">
                              <select value={selectedGrantPlanId} onChange={e => setSelectedGrantPlanId(e.target.value)} className="flex-1 p-2 text-xs border rounded-lg bg-white">
                                  <option value="">Select Plan...</option>
                                  {localSettings.subscriptionPlans?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.duration})</option>)}
                              </select>
                              <button onClick={handleGrantSubscription} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-bold">Grant Free</button>
                          </div>
                      </div>

                      <button onClick={saveEditedUser} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Save Changes</button>
                  </div>
              </div>
          </div>
      )}

      {/* DASHBOARD HOME */}
      {activeTab === 'DASHBOARD' && (
          <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-200 mb-6 animate-in fade-in">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                      <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl ring-4 ring-blue-50"><Shield size={24} /></div>
                      <div>
                          <h2 className="font-black text-slate-800 text-2xl leading-none tracking-tight">Master Console</h2>
                          <div className="flex items-center gap-2 mt-2">
                              {isFirebaseConnected ? <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-black uppercase tracking-wider">Online</span> : <span className="text-[10px] bg-red-100 text-red-700 px-3 py-1 rounded-full font-black uppercase tracking-wider">Offline</span>}
                          </div>
                      </div>
                  </div>
                  <button onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg flex items-center gap-2 transition-all active:scale-95"><Save size={18} /> SAVE SYSTEM</button>
              </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <button onClick={() => setActiveTab('MEGA_TEST')} className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-orange-100 transition-colors">
                      <Trophy size={24} className="text-orange-500" />
                      <span className="text-xs font-black text-orange-700 uppercase">Mega Test</span>
                  </button>
                  <button onClick={() => setActiveTab('USERS')} className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-blue-100 transition-colors">
                      <Users size={24} className="text-blue-500" />
                      <span className="text-xs font-black text-blue-700 uppercase">Users ({users.length})</span>
                  </button>
                  <button onClick={() => setActiveTab('SUBJECTS_MGR')} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-100 transition-colors">
                      <Book size={24} className="text-emerald-500" />
                      <span className="text-xs font-black text-emerald-700 uppercase">Subjects</span>
                  </button>
                  <button onClick={() => setActiveTab('CONTENT_MCQ')} className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-purple-100 transition-colors">
                      <ListChecks size={24} className="text-purple-500" />
                      <span className="text-xs font-black text-purple-700 uppercase">Question Bank</span>
                  </button>
              </div>
              
              <div className="border-t border-slate-100 my-8"></div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DashboardCard icon={Monitor} label="General" onClick={() => setActiveTab('CONFIG_GENERAL')} color="slate" />
                  <DashboardCard icon={ShieldCheck} label="Security" onClick={() => setActiveTab('CONFIG_SECURITY')} color="red" />
                  <DashboardCard icon={Eye} label="Visibility" onClick={() => setActiveTab('CONFIG_VISIBILITY')} color="cyan" />
                  <DashboardCard icon={BrainCircuit} label="AI Brain" onClick={() => setActiveTab('CONFIG_AI')} color="violet" />
                  
                  <DashboardCard icon={Gamepad2} label="Game Config" onClick={() => setActiveTab('CONFIG_GAME')} color="orange" />
                  <DashboardCard icon={Sparkles} label="Ads Config" onClick={() => setActiveTab('CONFIG_ADS')} color="pink" />
                  <DashboardCard icon={Banknote} label="Payment" onClick={() => setActiveTab('CONFIG_PAYMENT')} color="emerald" />
                  <DashboardCard icon={Cloud} label="Deploy App" onClick={() => setActiveTab('DEPLOY')} color="sky" />
                  <DashboardCard icon={Gift} label="Gift Codes" onClick={() => setActiveTab('CODES')} color="orange" />
                  
                  <DashboardCard icon={Database} label="Database" onClick={() => setActiveTab('DATABASE')} color="gray" />
                  <DashboardCard icon={Trash2} label="Recycle Bin" onClick={() => setActiveTab('RECYCLE')} color="red" count={recycleBin.length} />
                  <div className="col-span-2 md:col-span-2">
                     <button onClick={() => onNavigate('BOARDS')} className="w-full h-full p-4 rounded-[32px] border-2 border-slate-200 bg-slate-50 flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors">
                        <LogOut size={24} className="text-slate-400" />
                        <span className="font-black text-xs uppercase text-slate-500">Exit Console</span>
                     </button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIG TABS */}
      {activeTab === 'CONFIG_PAYMENT' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-8 border-b pb-6">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-3 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-2xl font-black text-slate-800">Financial & Content Pricing</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* GLOBAL PRICING */}
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200">
                      <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Banknote size={20} className="text-green-600" /> Payment & Pricing</h4>
                      <div className="mb-6">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Admin WhatsApp Number</label>
                          <input type="text" value={localSettings.adminPhone || '8227070298'} onChange={e => setLocalSettings({...localSettings, adminPhone: e.target.value})} className="w-full p-3 border rounded-xl font-bold" />
                      </div>
                      <div className="mb-6">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Global Credit Discount (% Off)</label>
                          <input type="number" value={localSettings.globalDiscountPercent || 0} onChange={e => setLocalSettings({...localSettings, globalDiscountPercent: Number(e.target.value)})} className="w-full p-3 border rounded-xl font-bold" />
                      </div>
                      <p className="text-xs text-slate-500 mb-4 font-bold uppercase">Default Item Costs (Credits)</p>
                      <div className="grid grid-cols-2 gap-4">
                          {[{ label: 'PDF Download', key: 'pdf' }, { label: 'Premium Notes', key: 'notes' }, { label: 'Weekly Test', key: 'test' }, { label: 'Video Lecture', key: 'video' }].map(item => (
                              <div key={item.key}><label className="text-[10px] font-bold uppercase text-slate-400">{item.label}</label><input type="number" value={localSettings.globalContentPrices?.[item.key as keyof typeof localSettings.globalContentPrices] ?? 0} onChange={e => setLocalSettings({...localSettings, globalContentPrices: { ...localSettings.globalContentPrices!, [item.key]: Number(e.target.value) }})} className="w-full p-3 border rounded-xl font-bold" /></div>
                          ))}
                      </div>
                  </div>
                  {/* MEMBERSHIP PLANS */}
                  <div className="lg:col-span-2 bg-purple-50 p-8 rounded-[32px] border border-purple-100">
                      <h4 className="font-black text-purple-900 mb-6 flex items-center gap-2"><Zap size={24} /> Prime Membership Plans</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          {localSettings.subscriptionPlans?.map(plan => (
                              <div key={plan.id} className="bg-white p-6 rounded-[24px] border border-purple-100 shadow-xl relative overflow-hidden">
                                  {plan.discountPercent > 0 && <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase">{plan.discountPercent}% OFF</div>}
                                  <h5 className="font-black text-lg text-slate-800 mt-2">{plan.name}</h5>
                                  <div className="flex items-baseline gap-2 mt-2 mb-1"><div className="text-3xl font-black text-purple-600">₹{plan.price}</div>{plan.originalPrice > plan.price && <div className="text-sm font-bold text-slate-400 line-through">₹{plan.originalPrice}</div>}</div>
                                  <div className="text-xs text-slate-400 font-bold uppercase mb-4">{plan.duration}</div>
                                  <button onClick={() => removeSubscriptionPlan(plan.id)} className="w-full py-3 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2"><Trash2 size={14} /> Remove Plan</button>
                              </div>
                          ))}
                      </div>
                      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-purple-100 flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 w-full"><label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Plan Name</label><input type="text" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} className="w-full p-3 border rounded-xl font-bold" placeholder="Gold Pass" /></div>
                          <div className="w-full md:w-32"><label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Original</label><input type="number" value={newPlanOriginalPrice} onChange={e => setNewPlanOriginalPrice(Number(e.target.value))} className="w-full p-3 border rounded-xl font-bold" /></div>
                          <div className="w-full md:w-32"><label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Price</label><input type="number" value={newPlanPrice} onChange={e => setNewPlanPrice(Number(e.target.value))} className="w-full p-3 border rounded-xl font-bold text-purple-600" /></div>
                          <div className="w-full md:w-40"><label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Duration</label><select value={newPlanDuration} onChange={e => setNewPlanDuration(e.target.value as any)} className="w-full p-3 border rounded-xl font-bold bg-white"><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select></div>
                          <button onClick={addSubscriptionPlan} className="w-full md:w-auto px-8 py-3 bg-purple-600 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2"><Plus size={18} /> Add</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'CONFIG_AI' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-8 border-b pb-6"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-3 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button><h3 className="text-2xl font-black text-slate-800">AI Brain & Chat Config</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                       <div><label className="text-xs font-bold uppercase text-slate-500 mb-2 block">AI Model Engine</label><select value={localSettings.aiModel} onChange={e => setLocalSettings({...localSettings, aiModel: e.target.value})} className="w-full p-4 border rounded-2xl bg-slate-50 font-bold text-slate-700"><option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option><option value="gemini-3-pro-preview">Gemini 3 Pro (Smart)</option></select></div>
                       <div><label className="text-xs font-bold uppercase text-slate-500 mb-2 block">System Instruction</label><textarea value={localSettings.aiInstruction || ''} onChange={e => setLocalSettings({...localSettings, aiInstruction: e.target.value})} className="w-full p-4 border rounded-2xl h-40 bg-slate-50 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="You are a helpful study assistant..." /></div>
                   </div>
              </div>
          </div>
      )}

      {activeTab === 'CONFIG_GAME' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-8 border-b pb-6">
                  <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-3 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button>
                  <h3 className="text-2xl font-black text-slate-800">Spin Wheel Game Config</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                      <h4 className="font-black text-orange-900 mb-6 flex items-center gap-2"><Gamepad2 size={24} /> Game Settings</h4>
                      
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-orange-200 mb-6">
                          <span className="font-bold text-slate-700">Enable Game</span>
                          <input type="checkbox" checked={localSettings.isGameEnabled} onChange={e => setLocalSettings({...localSettings, isGameEnabled: e.target.checked})} className="w-6 h-6 accent-orange-500" />
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="text-[10px] font-bold uppercase text-slate-500">Free User Spin Limit (Daily)</label>
                              <div className="relative mt-1">
                                  <input type="number" value={localSettings.spinLimitFree || 1} onChange={e => setLocalSettings({...localSettings, spinLimitFree: Number(e.target.value)})} className="w-full p-3 pl-10 border rounded-xl font-bold bg-white" />
                                  <div className="absolute left-3 top-3.5 text-slate-400"><Clock size={16} /></div>
                              </div>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold uppercase text-purple-600">Premium User Spin Limit (Daily)</label>
                              <div className="relative mt-1">
                                  <input type="number" value={localSettings.spinLimitPremium || 5} onChange={e => setLocalSettings({...localSettings, spinLimitPremium: Number(e.target.value)})} className="w-full p-3 pl-10 border border-purple-200 rounded-xl font-bold bg-white text-purple-700" />
                                  <div className="absolute left-3 top-3.5 text-purple-400"><Zap size={16} /></div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200">
                      <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Trophy size={24} className="text-yellow-500" /> Reward Config</h4>
                      <p className="text-xs text-slate-400 mb-4">Comma separated list of credit amounts. 0 = No Prize.</p>
                      
                      <textarea 
                          value={localSettings.wheelRewards?.join(', ') || '0, 1, 2, 5, 10, 50'} 
                          onChange={e => {
                              const rewards = e.target.value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                              setLocalSettings({...localSettings, wheelRewards: rewards});
                          }} 
                          className="w-full h-32 p-4 border rounded-xl font-mono font-bold text-slate-600 bg-slate-50"
                          placeholder="0, 1, 2, 5, 10, 50"
                      />
                      
                      <div className="mt-4">
                          <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Preview Segments</p>
                          <div className="flex flex-wrap gap-2">
                              {localSettings.wheelRewards?.map((r, i) => (
                                  <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${r >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {r}
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'MEGA_TEST' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                  <div className="flex items-center gap-4"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><ArrowLeft size={20} /></button><div><h3 className="text-xl font-black text-slate-800">Mega Exam Live</h3></div></div>
                  <button onClick={() => openImportModal('MEGA')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2"><Upload size={16} /> Import Questions</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Monitor size={18} /> Exam Controls</h4>
                          <div className="flex items-center justify-between p-4 bg-white rounded-xl border mb-4"><span className="font-bold text-sm">Live Status</span><input type="checkbox" checked={localSettings.isMegaTestLive} onChange={e => setLocalSettings({...localSettings, isMegaTestLive: e.target.checked})} className="w-6 h-6 accent-green-600" /></div>
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Question Limit</label><input type="number" value={localSettings.megaTestQuestionLimit} onChange={e => setLocalSettings({...localSettings, megaTestQuestionLimit: Number(e.target.value)})} className="w-full p-3 border rounded-xl font-bold" /></div>
                      </div>
                  </div>
                  <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800">
                      <div className="flex justify-between items-center mb-4"><h4 className="font-bold flex items-center gap-2"><Table size={18} /> Question Bank ({megaQuestions.length})</h4><button onClick={() => { if(window.confirm("Clear all?")) { setMegaQuestions([]); localStorage.removeItem('nst_mega_test_questions'); } }} className="text-red-400 text-xs font-bold hover:underline">RESET</button></div>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {megaQuestions.map((q, i) => (<div key={i} className="bg-slate-800 p-3 rounded-xl border border-slate-700"><p className="text-sm font-bold mb-2"><span className="text-blue-400">{i+1}.</span> {q.question}</p><div className="flex gap-2 text-[10px] text-slate-400">{q.options.map((o, oi) => <span key={oi} className={oi === q.correctAnswer ? "text-green-400 font-bold" : ""}>{o}</span>)}</div></div>))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'USERS' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-4"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full"><ArrowLeft size={20} /></button><h3 className="text-xl font-black">User Management</h3></div>
                   <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 p-2 border rounded-xl text-sm w-64" /></div>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.mobile.includes(searchTerm)).map(user => (
                      <div key={user.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-slate-50">
                           <div>
                               <div className="font-bold text-slate-800 flex items-center gap-2">{user.name} {user.role === 'ADMIN' && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase">Admin</span>}</div>
                               <div className="text-xs text-slate-500 font-mono">{user.mobile} | Credits: {user.credits}</div>
                               {user.subscriptionPlanId && <div className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full inline-block mt-1 font-bold">💎 {localSettings.subscriptionPlans?.find(p => p.id === user.subscriptionPlanId)?.name} (Exp: {new Date(user.subscriptionExpiry||'').toLocaleDateString()})</div>}
                           </div>
                           <div className="flex gap-2">
                               <button onClick={() => { setEditingUser(user); setEditUserCredits(user.credits); setEditUserPass(user.password); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Edit</button>
                               {onImpersonate && user.role !== 'ADMIN' && <button onClick={() => onImpersonate(user)} className="p-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold">Login As</button>}
                               <button onClick={() => deleteUser(user.id)} className="p-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold">Delete</button>
                           </div>
                      </div>
                  ))}
                  {users.length === 0 && <p className="text-center text-slate-400 py-10">No users found.</p>}
              </div>
          </div>
      )}
      
      {/* CODES TAB */}
      {activeTab === 'CODES' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
               <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-4"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full"><ArrowLeft size={20} /></button><h3 className="text-xl font-black">Gift Codes</h3></div></div>
               <div className="flex gap-2 mb-6 bg-slate-50 p-4 rounded-xl">
                   <input type="number" value={newCodeAmount} onChange={e => setNewCodeAmount(Number(e.target.value))} className="p-2 border rounded-lg w-24" placeholder="Amount" />
                   <input type="number" value={newCodeCount} onChange={e => setNewCodeCount(Number(e.target.value))} className="p-2 border rounded-lg w-24" placeholder="Count" />
                   <button onClick={generateCodes} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Generate Codes</button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {giftCodes.map(c => (
                       <div key={c.id} className={`p-3 border rounded-xl relative ${c.isRedeemed ? 'bg-slate-100 opacity-50' : 'bg-white'}`}>
                           <div className="font-mono text-xs font-bold text-slate-700">{c.code}</div>
                           <div className="text-xs text-green-600 font-black">{c.amount} Credits</div>
                           {!c.isRedeemed && <button onClick={() => deleteCode(c.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}
                           {c.isRedeemed && <div className="text-[10px] text-slate-400 mt-1">Redeemed</div>}
                       </div>
                   ))}
               </div>
          </div>
      )}

      {/* RECYCLE BIN */}
      {activeTab === 'RECYCLE' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-4"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full"><ArrowLeft size={20} /></button><h3 className="text-xl font-black">Recycle Bin</h3></div></div>
              <div className="space-y-2">
                  {recycleBin.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded-xl bg-red-50">
                          <div><div className="font-bold text-red-900">{item.name}</div><div className="text-xs text-red-400 uppercase">{item.type} • Expires: {new Date(item.expiresAt).toLocaleDateString()}</div></div>
                          <button onClick={() => handleRestoreItem(item)} className="px-3 py-1 bg-white border text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">Restore</button>
                      </div>
                  ))}
                  {recycleBin.length === 0 && <p className="text-center text-slate-400 py-10">Recycle Bin Empty</p>}
              </div>
          </div>
      )}
      
      {/* DATABASE */}
      {activeTab === 'DATABASE' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-4"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full"><ArrowLeft size={20} /></button><h3 className="text-xl font-black">Database Editor</h3></div></div>
              <div className="mb-4"><select value={dbKey} onChange={e => setDbKey(e.target.value)} className="w-full p-2 border rounded"><option value="nst_users">Users</option><option value="nst_system_settings">System Settings</option><option value="nst_admin_codes">Gift Codes</option></select></div>
              <textarea value={dbContent} onChange={e => setDbContent(e.target.value)} className="w-full h-96 p-4 font-mono text-xs border rounded-xl bg-slate-900 text-green-400" />
              <button onClick={() => { try { JSON.parse(dbContent); localStorage.setItem(dbKey, dbContent); alert("Saved!"); } catch(e) { alert("Invalid JSON"); } }} className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Save Changes (Dangerous)</button>
          </div>
      )}

      {['CONTENT_MCQ', 'CONTENT_TEST', 'CONTENT_PDF'].includes(activeTab) && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
             <div className="flex items-center gap-4 mb-6 border-b pb-4"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full"><ArrowLeft size={20} /></button><h3 className="text-xl font-black text-slate-800">Content Manager</h3></div>
             <div className="mb-4 flex flex-wrap gap-2">
                 <select value={selBoard} onChange={e => setSelBoard(e.target.value as any)} className="p-2 border rounded"><option value="CBSE">CBSE</option><option value="BSEB">BSEB</option></select>
                 
                 <select value={selClass} onChange={e => setSelClass(e.target.value as any)} className="p-2 border rounded">
                     {['6','7','8','9','10','11','12','COMPETITION'].map(c => <option key={c} value={c}>{c === 'COMPETITION' ? 'Competition' : `Class ${c}`}</option>)}
                 </select>
                 
                 {(selClass === '11' || selClass === '12') && (
                     <select value={selStream} onChange={e => setSelStream(e.target.value as any)} className="p-2 border rounded">
                         <option value="Science">Science</option><option value="Commerce">Commerce</option><option value="Arts">Arts</option>
                     </select>
                 )}

                 <select value={selSubject?.name || ''} onChange={e => { const s = getSubjectsList(selClass, selStream).find(sub => sub.name === e.target.value); if(s) handleSubjectClick(s); }} className="p-2 border rounded"><option value="">Select Subject</option>{getSubjectsList(selClass, selStream).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
             </div>

             {selSubject && !editingChapterId && (
                 <div className="space-y-2">
                     {selChapters.map(ch => (
                         <div key={ch.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                             <span className="font-bold text-sm">{ch.title}</span>
                             <button onClick={() => loadChapterContent(ch.id)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold">Edit</button>
                         </div>
                     ))}
                 </div>
             )}

             {editingChapterId && (
                 <div className="bg-slate-50 p-4 rounded-xl border">
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold">Editing: {selChapters.find(c => c.id === editingChapterId)?.title}</h4>
                        <div className="flex gap-2">
                            {['CONTENT_MCQ', 'CONTENT_TEST'].includes(activeTab) && <button onClick={() => openImportModal(activeTab === 'CONTENT_MCQ' ? 'CHAPTER_MCQ' : 'CHAPTER_TEST')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><ClipboardPaste size={14} /> Import</button>}
                            <button onClick={saveChapterContent} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Save</button>
                            <button onClick={() => setEditingChapterId(null)} className="text-slate-500 text-xs underline">Close</button>
                        </div>
                     </div>
                     
                     <div className="max-h-[400px] overflow-y-auto">
                         {['CONTENT_MCQ', 'CONTENT_TEST'].includes(activeTab) ? (
                             (activeTab === 'CONTENT_MCQ' ? editingMcqs : editingTestMcqs).map((q, i) => (
                                 <div key={i} className="bg-white p-3 rounded mb-2 border">
                                     <p className="font-bold text-sm">{i+1}. {q.question}</p>
                                     <p className="text-xs text-green-600">Ans: {q.options[q.correctAnswer as number]}</p>
                                 </div>
                             ))
                         ) : activeTab === 'CONTENT_PDF' ? (
                             <div className="space-y-4">
                                 {/* VIDEO LINKS MANAGER */}
                                 <div className="bg-white p-4 rounded-xl border border-slate-200">
                                     <h5 className="font-bold text-xs text-slate-500 uppercase mb-3 flex items-center gap-2"><Video size={16} /> Video Lectures (Unlimited)</h5>
                                     <div className="flex gap-2 mb-3">
                                         <input type="text" value={newVideoLink} onChange={e => setNewVideoLink(e.target.value)} className="flex-1 p-2 border rounded text-xs" placeholder="Paste Google Drive Video Link..." />
                                         <button onClick={addVideoLink} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Add</button>
                                     </div>
                                     <div className="space-y-2">
                                         {editConfig.videoLinks?.map((link, idx) => (
                                             <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border text-xs">
                                                 <span className="truncate flex-1 font-mono text-slate-600">{link}</span>
                                                 <button onClick={() => removeVideoLink(idx)} className="text-red-500 hover:text-red-700 ml-2"><Trash2 size={14} /></button>
                                             </div>
                                         ))}
                                         {(!editConfig.videoLinks || editConfig.videoLinks.length === 0) && <p className="text-xs text-slate-400 italic">No videos added.</p>}
                                     </div>
                                 </div>

                                 {/* PDF LINKS */}
                                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Free PDF Link</label><input type="text" value={editConfig.freeLink || ''} onChange={e => setEditConfig({...editConfig, freeLink: e.target.value})} className="w-full p-2 border rounded" placeholder="https://..." /></div>
                                 <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Premium PDF Link</label><input type="text" value={editConfig.premiumLink || ''} onChange={e => setEditConfig({...editConfig, premiumLink: e.target.value})} className="w-full p-2 border rounded" placeholder="https://..." /></div>
                             </div>
                         ) : null}
                     </div>
                 </div>
             )}
          </div>
      )}

      {activeTab === 'CONFIG_GENERAL' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-6"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full"><ArrowLeft size={20} /></button><h3 className="text-xl font-black">General Settings</h3></div>
              <div className="space-y-4">
                  <div><label className="text-xs font-bold uppercase">App Name</label><input type="text" value={localSettings.appName} onChange={e => setLocalSettings({...localSettings, appName: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                  
                  <div>
                      <label className="text-xs font-bold uppercase">Chapter Unlock Threshold (MCQs)</label>
                      <input type="number" value={localSettings.mcqUnlockThreshold || 100} onChange={e => setLocalSettings({...localSettings, mcqUnlockThreshold: Number(e.target.value)})} className="w-full p-3 border rounded-xl" />
                      <p className="text-[10px] text-slate-400 mt-1">Number of MCQs a student must solve in a chapter to unlock the next one.</p>
                  </div>

                  <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-100"><span>Maintenance Mode</span><input type="checkbox" checked={localSettings.maintenanceMode} onChange={() => toggleSetting('maintenanceMode')} className="w-6 h-6" /></div>
              </div>
          </div>
      )}

      {activeTab === 'CONFIG_VISIBILITY' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in slide-in-from-right">
              <div className="flex items-center gap-4 mb-6"><button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-100 p-2 rounded-full"><ArrowLeft size={20} /></button><h3 className="text-xl font-black">Visibility & Locks</h3></div>
              
              <div className="space-y-6">
                  <div>
                      <h4 className="font-bold text-slate-700 mb-2">Class Access Control</h4>
                      <p className="text-xs text-slate-400 mb-3">Uncheck to lock a class (Coming Soon overlay).</p>
                      <div className="grid grid-cols-3 gap-3">
                          {['6','7','8','9','10','11','12','COMPETITION'].map(cls => (
                              <label key={cls} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${localSettings.allowedClasses?.includes(cls as any) ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                                  <input 
                                      type="checkbox" 
                                      checked={localSettings.allowedClasses?.includes(cls as any)} 
                                      onChange={e => {
                                          const current = localSettings.allowedClasses || [];
                                          let updated;
                                          if (e.target.checked) updated = [...current, cls];
                                          else updated = current.filter(c => c !== cls);
                                          setLocalSettings({...localSettings, allowedClasses: updated as any});
                                      }}
                                      className="w-5 h-5 accent-green-600 rounded"
                                  />
                                  <span className="text-xs font-bold">{cls === 'COMPETITION' ? 'Competition' : `Class ${cls}`}</span>
                              </label>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
      
    </div>
  );
};
