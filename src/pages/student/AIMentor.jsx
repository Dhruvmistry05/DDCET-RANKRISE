import { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, ChevronRight, RotateCcw 
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';

const SUGGESTED_QUERIES = [
  {
    topic: 'Exam Strategy',
    question: 'How should I allocate my 120 minutes across sections?',
    answer: 'For the 100-question DDCET exam:\n• Section 1 (Basics of Science & Engineering, 50 Qs): Allocate ~55 minutes.\n• Section 2 (Aptitude & Mathematics, 50 Qs): Allocate ~55 minutes.\n• Buffer & Review: Keep the remaining 10 minutes to revisit marked questions.\n\nTip: First attempt all direct conceptual questions (e.g. definitions, SI units) to secure guaranteed marks early.'
  },
  {
    topic: 'Negative Marking',
    question: 'How do I avoid negative marks during the exam?',
    answer: 'In DDCET, each correct answer earns +2.0 marks, while an incorrect attempt deducts 0.5 marks.\n\nRules of thumb:\n1. If you can eliminate 2 out of 4 options, the probability favors attempting the question.\n2. If you are guessing blindly with no idea, SKIP it. 4 wrong guesses cancel out 1 correct answer (+2 - 2 = 0).'
  },
  {
    topic: 'Weightage',
    question: 'Which Engineering Science units carry maximum weightage?',
    answer: 'The primary scoring sections in Basics of Science & Engineering are:\n1. Classical Mechanics (12 marks)\n2. Units & Measurement (12 marks)\n3. Wave Motion, Optics & Acoustics (12 marks)\n4. Thermodynamics & Heat (10 marks)\n\nMastering fundamental SI units and mechanics formulas gives you an immediate scoring base.'
  },
  {
    topic: 'Revision Technique',
    question: 'How should I use Weak Spot effectively?',
    answer: 'After every mock test:\n1. Do not just look at your score — inspect your incorrect attempts in Weak Spot.\n2. Identify whether the mistake was conceptual, calculation-based, or due to rushing.\n3. Write down the one-line formula or "Memory Cheat Code" in your notes before taking the next test.'
  }
];

function getLocalFallbackResponse(query) {
  const q = query.toLowerCase();
  const match = SUGGESTED_QUERIES.find(
    sq => sq.question.toLowerCase().includes(q) || q.includes(sq.topic.toLowerCase())
  );
  if (match) return match.answer;

  if (/formula|cheat|units/i.test(q)) {
    return 'Formula Quick Check for DDCET:\n• Force: F = m × a (Newton, [M L T⁻²])\n• Kinetic Energy: KE = ½mv² = p²/(2m)\n• Wave speed: v = f × λ\n• 2×2 Matrix Determinant: ad - bc\n• Carnot Efficiency: η = 1 - (T_sink / T_source) [Kelvin]\nCheck our Practice Lab for question-by-question cheat codes!';
  }
  if (/syllabus|topics|chapters|pattern/i.test(q)) {
    return 'DDCET 2027 Official Structure:\n• 100 MCQs in 120 minutes | 200 Total Marks\n• Marking: +2.0 marks for correct, -0.5 marks for wrong attempt.\n• Section 1 (50 Qs): Physics, Chemistry, Environmental Sciences.\n• Section 2 (50 Qs): Engineering Mathematics, Computer Basics, Technical English.\nVisit the Syllabus tab to track your unit-by-unit progress!';
  }
  return `That is an important topic for DDCET preparation. To master "${query}", I recommend solving 10-15 targeted MCQs in the Practice Lab and checking related notes in the Study Library. Remember to review incorrect answers in your Weak Spot.`;
}

export default function AIMentor() {
  const { user, token } = useAuth();
  const storageKey = user?.id ? `rankrise_mentor_chat_${user.id}` : 'rankrise_mentor_chat_guest';

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        sender: 'mentor',
        text: 'Hello! I am your DDCET Academic Mentor. You can ask me questions about syllabus topics, exam time management, formula cheat codes, and score improvement strategies.'
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  const handleClearChat = () => {
    const defaultMsg = [
      {
        sender: 'mentor',
        text: 'Hello! I am your DDCET Academic Mentor. You can ask me questions about syllabus topics, exam time management, formula cheat codes, and score improvement strategies.'
      }
    ];
    setMessages(defaultMsg);
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultMsg));
    } catch {}
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isThinking) return;

    // Append student message
    const newMessages = [...messages, { sender: 'student', text: query }];
    setMessages(newMessages);
    setInputText('');
    setIsThinking(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/student/mentor/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          history: newMessages.slice(-6).map(m => ({
            role: m.sender === 'mentor' ? 'model' : 'user',
            text: m.text
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setMessages(prev => [...prev, { sender: 'mentor', text: data.reply }]);
          setIsThinking(false);
          return;
        }
      }
      throw new Error('Server response unhandled');
    } catch {
      // Robust client fallback
      const reply = getLocalFallbackResponse(query);
      setMessages(prev => [...prev, { sender: 'mentor', text: reply }]);
      setIsThinking(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900">
            <Bot size={13} className="text-[#2563EB]" />
            <span>Academic Guidance & Strategy</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            AI Academic Mentor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Get quick answers on DDCET syllabus weightage, time management, and problem-solving techniques.
          </p>
        </div>

        <button
          onClick={handleClearChat}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-2xs cursor-pointer"
          title="Reset conversation"
        >
          <RotateCcw size={13} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Suggested Strategy Topics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SUGGESTED_QUERIES.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.question)}
            className="text-left p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors shadow-2xs group flex items-start justify-between gap-2 cursor-pointer"
          >
            <div>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">
                {item.topic}
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-300">
                {item.question}
              </p>
            </div>
            <ChevronRight size={14} className="text-slate-400 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>

      {/* Chat Conversation Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col h-[440px] overflow-hidden">
        
        {/* Messages History */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isMentor = m.sender === 'mentor';
            return (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${isMentor ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  isMentor 
                    ? 'bg-[#1E3A8A] text-white border border-blue-900 shadow-2xs' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  {isMentor ? <Bot size={15} /> : <User size={15} />}
                </div>

                <div className={`rounded-xl p-3.5 text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
                  isMentor 
                    ? 'bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-750 text-slate-800 dark:text-slate-200' 
                    : 'bg-[#1E3A8A] text-white'
                }`}>
                  {m.text}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex gap-3 max-w-[85%] self-start">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-[#1E3A8A] text-white border border-blue-900 shadow-2xs">
                <Bot size={15} />
              </div>
              <div className="rounded-xl p-3 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-750 text-slate-500 flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] font-medium text-slate-400">Mentor is preparing your guidance...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Bar */}
        <div className="p-3 border-t border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask mentor a question about DDCET exam preparation..."
              disabled={isThinking}
              className="flex-1 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              <Send size={13} />
              <span className="hidden xs:inline">Ask</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
