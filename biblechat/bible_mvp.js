import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BookOpen, 
  MessageCircle, 
  Puzzle, 
  Heart, 
  User, 
  Search, 
  Send, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Share2, 
  MoreHorizontal,
  Lock,
  Plus,
  ArrowLeft,
  Book,
  Headphones,
  Settings,
  Sparkles,
  StopCircle,
  Loader2,
  Volume2,
  Globe,
  LayoutGrid,
  List,
  ChevronLeft
} from 'lucide-react';

// --- API Configuration ---
// Note: In a production environment, API calls should go through a backend to protect the key.
const apiKey = ""; 

// --- Gemini API Helpers ---

const callGeminiText = async (prompt, systemInstruction = "") => {
  if (!apiKey) {
    // Fallback for demo if no key is provided in environment
    return "API Key 未设置。请在代码中配置您的 Gemini API Key 以使用 AI 功能。";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        }),
      }
    );

    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "抱歉，我现在无法回答。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，网络连接似乎有问题，请稍后再试。";
  }
};

const callGeminiTTS = async (text) => {
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Aoede" } // Aoede is calm and suitable for reading
              }
            }
          }
        })
      }
    );

    if (!response.ok) throw new Error('TTS API Error');
    const data = await response.json();
    const audioContent = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (audioContent) {
      // Convert base64 to blob and play
      const audioBytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
      const blob = new Blob([audioBytes], { type: 'audio/wav' }); // Gemini returns raw PCM/WAV usually wrapped
      return URL.createObjectURL(blob); // Simplification for the prototype
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

// --- Mock Data ---

const DAILY_VERSE = {
  text: "应当一无挂虑，只要凡事藉着祷告、祈求和感谢，将你们所要的告诉神。",
  reference: "腓立比书 4:6",
  image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
};

// Real content for Genesis 1
const GENESIS_1 = [
  { v: 1, text: "起初，神创造天地。" },
  { v: 2, text: "地是空虚混沌，渊面黑暗；神的灵运行在水面上。" },
  { v: 3, text: "神说：“要有光”，就有了光。" },
  { v: 4, text: "神看光是好的，就把光暗分开了。" },
  { v: 5, text: "神称光为“昼”，称暗为“夜”。有晚上，有早晨，这是头一日。" },
  { v: 6, text: "神说：“诸水之间要有空气，将水分为上下。”" },
  { v: 7, text: "神就造出空气，将空气以下的水、空气以上的水分开了。事就这样成了。" },
];

// Helper to generate text for other chapters
const getBibleText = (book, chapter) => {
  if (book === "创世记" && chapter === 1) {
    return GENESIS_1;
  }
  // Mock generator for other chapters
  return Array.from({ length: 8 }, (_, i) => ({
    v: i + 1,
    text: `这是【${book}】第 ${chapter} 章第 ${i + 1} 节的经文内容。在真实应用中，这里将从数据库加载完整的圣经文本。神的话语是我们脚前的灯，路上的光。`
  }));
};

const BIBLE_VERSIONS = [
  { id: 'CUV', name: 'CUV 和合本', lang: '中文' },
  { id: 'RCUV', name: 'RCUV 和合本修订版', lang: '中文' },
  { id: 'CNV', name: 'CNV 新译本', lang: '中文' },
  { id: 'NIV', name: 'NIV English', lang: 'English' },
  { id: 'ESV', name: 'ESV English', lang: 'English' },
  { id: 'KJV', name: 'KJV King James', lang: 'English' },
];

const BIBLE_BOOKS = [
  { 
    category: "旧约", 
    books: ["创世记", "出埃及记", "利未记", "民数记", "申命记", "约书亚记", "士师记", "路得记", "撒母耳记上", "撒母耳记下", "列王纪上", "列王纪下", "诗篇", "箴言", "传道书"] 
  },
  { 
    category: "新约", 
    books: ["马太福音", "马可福音", "路加福音", "约翰福音", "使徒行传", "罗马书", "哥林多前书", "哥林多后书", "加拉太书", "以弗所书", "腓立比书", "歌罗西书", "启示录"] 
  }
];

const DEVOTIONAL_TOPICS = [
  { id: 1, title: "在焦虑中寻找平安", duration: "5 分钟", completed: true },
  { id: 2, title: "学习饶恕的功课", duration: "7 分钟", completed: false },
];

const PUZZLE_LEVELS = [
  { 
    id: 1, 
    title: "诺亚方舟", 
    status: "active", 
    progress: 75, 
    totalPieces: 12, 
    collectedPieces: 9,
    image: "https://images.unsplash.com/photo-1597926661138-062e7399859f?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" 
  },
  { 
    id: 2, 
    title: "大卫与歌利亚", 
    status: "locked", 
    progress: 0, 
    totalPieces: 15, 
    collectedPieces: 0,
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" 
  }
];

const PRAYERS = [
  { id: 1, user: "Grace L.", text: "请为我即将到来的手术祷告，求神赐下平安。", amenCount: 124, prayed: false },
  { id: 2, user: "David W.", text: "希望能找到一份合适的工作，供应家庭的需要。", amenCount: 89, prayed: true },
];

const CHAT_HISTORY = [
  { id: 1, sender: 'ai', text: "平安！我是你的 AI 牧师。无论你在生活、信仰或情感上遇到什么困惑，我都在这里倾听并基于圣经为你解答。" }
];

// --- Components ---

const TabBar = ({ currentView, setCurrentView }) => {
  const mainViews = ['home', 'bible', 'chat', 'profile'];
  if (!mainViews.includes(currentView)) return null;

  const tabs = [
    { id: 'home', icon: BookOpen, label: '首页' },
    { id: 'bible', icon: Book, label: '圣经' },
    { id: 'chat', icon: MessageCircle, label: 'AI 牧师' },
    { id: 'profile', icon: User, label: '我的' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center z-50 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setCurrentView(tab.id)}
          className={`flex flex-col items-center justify-center w-16 transition-colors duration-200 ${
            currentView === tab.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <tab.icon size={24} strokeWidth={currentView === tab.id ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

const Header = ({ title, rightIcon: RightIcon, onRightIconClick, onBack }) => (
  <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-5 py-4 flex justify-between items-center border-b border-gray-50">
    <div className="flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="p-1 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
    </div>
    {RightIcon && (
      <button 
        onClick={onRightIconClick}
        className="p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <RightIcon size={20} />
      </button>
    )}
  </div>
);

// --- Views ---

const HomeView = ({ navigateTo }) => (
  <div className="pb-24 animate-in fade-in duration-500">
    <Header title="每日灵修" rightIcon={Share2} />
    
    <div className="p-5 space-y-8">
      {/* Daily Verse Card */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl h-80 group">
        <img 
          src={DAILY_VERSE.image} 
          alt="Daily Verse" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 flex flex-col justify-end p-6 text-white">
          <div className="mb-auto pt-2">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">今日金句</span>
          </div>
          <p className="text-lg font-serif leading-relaxed mb-3">"{DAILY_VERSE.text}"</p>
          <p className="text-sm font-medium opacity-90">— {DAILY_VERSE.reference}</p>
        </div>
      </div>

      {/* Feature Grid - Entry Points */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">特色活动</h2>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigateTo('puzzle')}
            className="bg-indigo-50 p-4 rounded-2xl flex flex-col items-start hover:bg-indigo-100 transition-colors border border-indigo-100 group"
          >
            <div className="bg-white p-2 rounded-xl shadow-sm mb-3 text-indigo-600 group-hover:scale-110 transition-transform">
              <Puzzle size={24} />
            </div>
            <span className="font-bold text-gray-800">圣经拼图</span>
            <span className="text-xs text-gray-500 mt-1">寓教于乐</span>
          </button>

          <button 
            onClick={() => navigateTo('prayer')}
            className="bg-purple-50 p-4 rounded-2xl flex flex-col items-start hover:bg-purple-100 transition-colors border border-purple-100 group"
          >
            <div className="bg-white p-2 rounded-xl shadow-sm mb-3 text-purple-600 group-hover:scale-110 transition-transform">
              <Heart size={24} />
            </div>
            <span className="font-bold text-gray-800">每日祷告墙</span>
            <span className="text-xs text-gray-500 mt-1">彼此代祷</span>
          </button>
        </div>
      </div>

      {/* Mood Check-in */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">今日心情</h2>
        <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['🙏 感恩', '😔 忧伤', '😟 焦虑', '😊 喜乐', '🤔 困惑'].map((mood, i) => (
            <button key={i} className="flex-shrink-0 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors">
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Devotional Plan */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-lg font-bold text-gray-800">学习计划</h2>
          <span className="text-xs text-indigo-600 font-semibold">查看全部</span>
        </div>
        <div className="space-y-3">
          {DEVOTIONAL_TOPICS.map((topic) => (
            <div key={topic.id} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${topic.completed ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {topic.completed ? <CheckCircle2 size={20} /> : <Play size={20} fill="currentColor" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-sm">{topic.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{topic.duration} • 灵修</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const BookSelectionView = ({ currentBook, onSelectBook, onBack }) => {
  const [bookViewMode, setBookViewMode] = useState('grid'); // 'list' | 'grid'

  return (
    <div className="flex flex-col h-screen bg-gray-50 animate-in slide-in-from-right duration-300">
       {/* Page Header */}
       <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
               <ArrowLeft size={24} />
            </button>
            <span className="text-xl font-bold text-gray-900">选择书卷</span>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
               onClick={() => setBookViewMode('grid')}
               className={`p-1.5 rounded-md transition-all ${bookViewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
               <LayoutGrid size={18} />
            </button>
            <button 
               onClick={() => setBookViewMode('list')}
               className={`p-1.5 rounded-md transition-all ${bookViewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
               <List size={18} />
            </button>
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-4 pb-20">
         {BIBLE_BOOKS.map((section, idx) => (
           <div key={idx} className="mb-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{section.category}</h3>
              <div className={
                bookViewMode === 'grid' 
                  ? "grid grid-cols-3 sm:grid-cols-4 gap-3" 
                  : "flex flex-col gap-2"
              }>
                {section.books.map((book) => (
                  <button
                     key={book}
                     onClick={() => onSelectBook(book)}
                     className={`
                       ${bookViewMode === 'grid' 
                         ? "h-12 rounded-xl flex items-center justify-center text-sm font-medium border shadow-sm"
                         : "h-12 px-4 rounded-xl flex items-center text-sm font-medium border shadow-sm text-left"
                       }
                       ${currentBook === book 
                         ? "bg-indigo-600 text-white border-indigo-600" 
                         : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                       }
                       transition-all active:scale-95
                     `}
                  >
                    {book}
                  </button>
                ))}
              </div>
           </div>
         ))}
       </div>
    </div>
  );
};

const BibleReaderView = ({ 
  currentBook, 
  currentChapter,
  currentVersion, 
  onNavigateToBookSelection, 
  onVersionChange,
  onChapterChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isVersionSelectorOpen, setIsVersionSelectorOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  
  const audioRef = useRef(null);
  
  // Dynamic Content based on Chapter
  const bibleText = getBibleText(currentBook, currentChapter);
  const textToRead = bibleText.map(t => t.text).join(" ");

  // Scroll to top when chapter changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentChapter, currentBook]);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      audioRef.current?.play();
      setIsPlaying(true);
      return;
    }

    setIsLoadingAudio(true);
    const url = await callGeminiTTS(textToRead);
    setIsLoadingAudio(false);
    
    if (url) {
      setAudioUrl(url);
      setIsPlaying(true);
    } else {
      alert("TTS 生成失败，请检查 API 设置。");
    }
  };

  useEffect(() => {
    if (audioUrl && isPlaying && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  }, [audioUrl]);

  return (
    <div className="pb-24 animate-in fade-in duration-500 h-full flex flex-col relative">
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
      />
      
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 border-b border-gray-100">
        <div className="px-4 py-3 flex justify-between items-center">
           <div className="flex items-center gap-2">
              {/* Book/Chapter Selector (Triggers Page Navigation) */}
              <button
                onClick={onNavigateToBookSelection}
                className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
              >
                  <span className="font-bold text-gray-800 text-sm">{currentBook} {currentChapter}</span>
                  <ChevronRight size={16} className="text-gray-500" />
              </button>

              {/* Version Selector */}
              <button 
                onClick={() => setIsVersionSelectorOpen(!isVersionSelectorOpen)}
                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                {currentVersion.id}
                <ChevronRight size={14} className={`transition-transform duration-200 ${isVersionSelectorOpen ? '-rotate-90' : 'rotate-90'}`} />
              </button>
           </div>
           
           <div className="flex gap-2">
              <button 
                onClick={handleTogglePlay}
                className={`p-2 rounded-full transition-colors ${isPlaying || isLoadingAudio ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {isLoadingAudio ? <Loader2 size={20} className="animate-spin" /> : 
                 isPlaying ? <StopCircle size={20} /> : <Headphones size={20} />}
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><Settings size={20} /></button>
           </div>
        </div>

        {/* Version Dropdown (Still a modal/dropdown) */}
        {isVersionSelectorOpen && (
          <>
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsVersionSelectorOpen(false)}></div>
            <div className="absolute top-12 left-28 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 w-56 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
              <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider flex items-center gap-2">
                <Globe size={12} />
                选择版本
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-hide">
                {BIBLE_VERSIONS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onVersionChange(v);
                      setIsVersionSelectorOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-between items-center group ${
                      currentVersion.id === v.id 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{v.name}</span>
                      <span className="text-[10px] text-gray-400 font-normal group-hover:text-gray-500">{v.lang}</span>
                    </div>
                    {currentVersion.id === v.id && <CheckCircle2 size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {isPlaying && (
           <div className="px-4 py-1 bg-indigo-50 text-indigo-600 text-xs flex items-center justify-center gap-2">
             <Volume2 size={12} />
             <span>AI 正在为你朗读圣经 ({currentVersion.id})...</span>
           </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-5" ref={scrollContainerRef}>
        <h2 className="text-2xl font-serif font-bold text-center mb-8 mt-2">{currentBook} 第{currentChapter}章</h2>
        <div className="space-y-4">
          {bibleText.map((verse) => (
            <p key={verse.v} className="text-lg leading-8 text-gray-800 font-serif">
              <span className="text-xs font-sans text-gray-400 align-top mr-1 select-none">{verse.v}</span>
              {verse.text}
            </p>
          ))}
          <p className="text-lg leading-8 text-gray-800 font-serif">
            <span className="text-xs font-sans text-gray-400 align-top mr-1 select-none">{bibleText.length + 1}</span>
            ...
          </p>
        </div>
        
        <div className="flex justify-between items-center mt-12 mb-8">
           <button 
             onClick={() => onChapterChange(currentChapter - 1)}
             disabled={currentChapter <= 1}
             className={`px-4 py-2 text-sm font-medium rounded-full flex items-center gap-1 transition-colors ${
               currentChapter <= 1 
                 ? 'text-gray-300 cursor-not-allowed' 
                 : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
             }`}
           >
             <ChevronLeft size={16} /> 上一章
           </button>
           
           <button 
             onClick={() => onChapterChange(currentChapter + 1)}
             className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-1"
           >
             下一章 <ChevronRight size={16} />
           </button>
        </div>
      </div>
    </div>
  );
};

const ChatView = () => {
  const [messages, setMessages] = useState(CHAT_HISTORY);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const systemPrompt = "你是一位充满同情心、智慧的基督徒AI牧师。你需要用温柔、鼓励的语气，基于圣经真理来回答用户的困惑。请引用具体的经文来支持你的观点。回答要简洁有力，富有同理心。";
    
    // Call Gemini Text API
    const aiResponseText = await callGeminiText(input, systemPrompt);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { 
      id: Date.now() + 1, 
      sender: 'ai', 
      text: aiResponseText
    }]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      <Header title="AI 牧师" rightIcon={MoreHorizontal} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 safe-area-bottom">
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-shadow">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="向牧师倾诉或提问..."
            disabled={isTyping}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-2 rounded-full transition-colors ${input.trim() && !isTyping ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PuzzleView = ({ onBack }) => (
  <div className="pb-8 animate-in slide-in-from-right duration-300 bg-white min-h-screen">
    <Header title="故事拼图" rightIcon={null} onBack={onBack} />
    
    <div className="p-5">
      <div className="bg-indigo-50 rounded-2xl p-4 mb-6 flex items-center justify-between border border-indigo-100">
        <div>
          <h3 className="font-bold text-indigo-900">今日挑战</h3>
          <p className="text-xs text-indigo-700 mt-1">阅读《创世记》第6章获取碎片</p>
        </div>
        <button className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-indigo-200">去完成</button>
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-4">我的拼图集</h2>
      <div className="grid grid-cols-1 gap-4">
        {PUZZLE_LEVELS.map((level) => (
          <div key={level.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
              <img src={level.image} alt={level.title} className={`w-full h-full object-cover ${level.status === 'locked' ? 'opacity-40 blur-[2px]' : ''}`} />
              {level.status === 'locked' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock size={24} className="text-gray-500" />
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800">{level.title}</h3>
                {level.status === 'active' && (
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">进行中</span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>收集进度</span>
                  <span>{level.collectedPieces}/{level.totalPieces}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${(level.collectedPieces / level.totalPieces) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PrayerView = ({ onBack }) => {
  const [prayers, setPrayers] = useState(PRAYERS);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrayer, setGeneratedPrayer] = useState("");

  const toggleAmen = (id) => {
    setPrayers(prayers.map(p => {
      if (p.id === id) {
        return {
          ...p,
          prayed: !p.prayed,
          amenCount: p.prayed ? p.amenCount - 1 : p.amenCount + 1
        };
      }
      return p;
    }));
  };

  const handleGeneratePrayer = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedPrayer("");
    
    const systemInstruction = "你是一个祷告助手。请根据用户提供的关键词或情况，写一段简短、真诚、感人的祷告词（100字以内）。";
    const result = await callGeminiText(`请为这个主题写一段祷告: ${aiPrompt}`, systemInstruction);
    
    setGeneratedPrayer(result);
    setIsGenerating(false);
  };

  const handleUsePrayer = () => {
    // Add to prayer list
    const newPrayer = {
      id: Date.now(),
      user: "我",
      text: generatedPrayer,
      amenCount: 0,
      prayed: false
    };
    setPrayers([newPrayer, ...prayers]);
    setShowAiModal(false);
    setAiPrompt("");
    setGeneratedPrayer("");
  };

  return (
    <div className="pb-8 animate-in slide-in-from-right duration-300 bg-gray-50 min-h-screen relative">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">祷告墙</h1>
        </div>
        <button onClick={() => setShowAiModal(true)} className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
          <Plus size={20} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* AI Prayer Generator Trigger */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
               <Sparkles size={20} className="text-yellow-300" />
               <h3 className="font-bold text-lg">AI 祷告助手</h3>
            </div>
            <p className="text-indigo-100 text-sm mb-4">不知道如何开口祷告？告诉 AI 你的烦恼，让它为你代笔。</p>
            <button 
              onClick={() => setShowAiModal(true)}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              ✨ 生成祷告词
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <h3 className="font-bold text-gray-800 ml-1">社区代祷</h3>
        {prayers.map((prayer) => (
          <div key={prayer.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in duration-500">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">
                {prayer.user.charAt(0)}
              </div>
              <span className="text-sm font-medium text-gray-700">{prayer.user}</span>
              <span className="text-xs text-gray-400 ml-auto">刚刚</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-line">{prayer.text}</p>
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
              <div className="text-xs text-gray-400">
                {prayer.amenCount} 人已代祷
              </div>
              <button 
                onClick={() => toggleAmen(prayer.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  prayer.prayed 
                    ? 'bg-red-50 text-red-600 border border-red-100' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Heart size={16} fill={prayer.prayed ? "currentColor" : "none"} />
                {prayer.prayed ? "已代祷" : "阿们"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Prayer Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="text-indigo-500" size={24} /> 
              AI 祷告助手
            </h3>
            <p className="text-sm text-gray-500 mb-4">输入你的代祷事项（例如：工作面试、家人健康），AI 将为你生成一段祷告。</p>
            
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              rows={3}
              placeholder="我想为..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />

            {generatedPrayer && (
              <div className="bg-indigo-50 p-4 rounded-xl text-sm text-indigo-900 mb-4 italic border border-indigo-100">
                "{generatedPrayer}"
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setShowAiModal(false)}
                className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl"
              >
                取消
              </button>
              {generatedPrayer ? (
                 <button 
                  onClick={handleUsePrayer}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                >
                  发布祷告
                </button>
              ) : (
                <button 
                  onClick={handleGeneratePrayer}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={20} /> : "✨ 生成"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function BibleApp() {
  const [currentView, setCurrentView] = useState('home');
  // 提升书卷和版本状态到顶层
  const [currentBook, setCurrentBook] = useState("创世记");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentVersion, setCurrentVersion] = useState(BIBLE_VERSIONS[0]);

  // Helper to render content based on view state
  const renderContent = () => {
    switch(currentView) {
      case 'home': return <HomeView navigateTo={setCurrentView} />;
      case 'bible': 
        return (
          <BibleReaderView 
             currentBook={currentBook} 
             currentChapter={currentChapter}
             currentVersion={currentVersion}
             onNavigateToBookSelection={() => setCurrentView('book-selection')}
             onVersionChange={setCurrentVersion}
             onChapterChange={setCurrentChapter}
          />
        );
      case 'book-selection':
        return (
          <BookSelectionView 
            currentBook={currentBook}
            onSelectBook={(book) => {
               setCurrentBook(book);
               setCurrentChapter(1); // 切换书卷时重置为第1章
               setCurrentView('bible');
            }}
            onBack={() => setCurrentView('bible')}
          />
        );
      case 'chat': return <ChatView />;
      case 'puzzle': return <PuzzleView onBack={() => setCurrentView('home')} />;
      case 'prayer': return <PrayerView onBack={() => setCurrentView('home')} />;
      case 'profile': 
        return (
          <div className="flex items-center justify-center h-screen pb-20 text-gray-400">
            <div className="text-center">
              <User size={48} className="mx-auto mb-2 opacity-50" />
              <p>个人中心 (开发中)</p>
            </div>
          </div>
        );
      default: return <HomeView navigateTo={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 md:max-w-md md:mx-auto md:shadow-2xl md:min-h-screen md:overflow-hidden relative">
      <main className="h-full overflow-y-auto scrollbar-hide bg-white">
        {renderContent()}
      </main>

      <TabBar currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<BibleApp />);
}
