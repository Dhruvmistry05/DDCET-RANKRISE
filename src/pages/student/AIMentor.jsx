import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Bot, User, ChevronRight, RotateCcw, Copy, Check, 
  Calculator, BookOpen, Code2, Languages, HelpCircle,
  CheckCircle2, Terminal
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../store/AuthContext';

// ChatGPT-style DDCET academic prompt categories
const PROMPT_CATEGORIES = [
  {
    id: 'math',
    label: 'Math & Numericals',
    icon: Calculator,
    prompts: [
      {
        topic: 'Algebra',
        title: 'Solve Linear Equation Step by Step',
        query: 'Solve step by step: Solve 2x + 5 = 15'
      },
      {
        topic: 'Matrices',
        title: '2x2 Matrix Determinant & Inverse',
        query: 'Find the determinant and inverse step by step for matrix [[2, -1], [4, 3]].'
      },
      {
        topic: 'Calculus',
        title: 'Product Rule Differentiation',
        query: 'Find the derivative step by step of f(x) = x^2 * sin(x) using the product rule.'
      },
      {
        topic: 'Quadratic Equations',
        title: 'Quadratic Formula Solution',
        query: 'Solve 2x^2 - 7x + 3 = 0 step by step using the quadratic formula with verification.'
      }
    ]
  },
  {
    id: 'concepts',
    label: 'Concept Explainer',
    icon: BookOpen,
    prompts: [
      {
        topic: 'Physics',
        title: "Newton's 3 Laws of Motion",
        query: "Explain Newton's 3 laws of motion with real-world engineering examples and formulas."
      },
      {
        topic: 'Electronics',
        title: 'P-N Junction Diode Operation',
        query: 'Explain how a P-N junction diode works in forward and reverse bias with a clear summary.'
      },
      {
        topic: 'Thermodynamics',
        title: 'Carnot Cycle Efficiency',
        query: 'Explain the Carnot cycle efficiency formula eta = 1 - (T_C / T_H) and its significance.'
      },
      {
        topic: 'Chemistry',
        title: 'Faraday’s Laws of Electrolysis',
        query: "Explain Faraday's first and second laws of electrolysis with formulas and units."
      }
    ]
  },
  {
    id: 'coding',
    label: 'Computer & Programming',
    icon: Code2,
    prompts: [
      {
        topic: 'C Language',
        title: 'Prime Number Checker in C',
        query: 'Write a well-commented C program to check whether a given number is prime, and explain the logic line by line.'
      },
      {
        topic: 'Digital Logic',
        title: 'Logic Gates & Truth Tables',
        query: 'Explain basic logic gates (AND, OR, NOT, NAND, NOR, XOR) with their boolean expressions and truth tables.'
      },
      {
        topic: 'C Pointers',
        title: 'Pointers & Memory Addresses',
        query: 'Explain pointers in C with a simple example showing address-of (&) and dereference (*) operators.'
      },
      {
        topic: 'Number Systems',
        title: 'Binary to Hexadecimal Conversion',
        query: 'How do you convert binary (11011010)_2 into hexadecimal and decimal step by step?'
      }
    ]
  },
  {
    id: 'languages',
    label: 'ગુજરાતી / हिंदी',
    icon: Languages,
    prompts: [
      {
        topic: 'ગુજરાતી (ભૌતિક વિજ્ઞાન)',
        title: 'ન્યૂટનના નિયમો (સરળ ઉદાહરણ)',
        query: 'ન્યૂટનના ગતિના ત્રણેય નિયમો રોજિંદા જીવનના સરળ ઉદાહરણો સાથે ગુજરાતીમાં સમજાવો.'
      },
      {
        topic: 'ગુજરાતી (ગણિત)',
        title: 'શ્રેણિક અને નિશ્ચાયક પદ્ધતિ',
        query: 'શ્રેણિકના ગુણધર્મો અને 2x2 તથા 3x3 નિશ્ચાયક (Determinant) શોધવાની સરળ રીત સ્ટેપ બાય સ્ટેપ સમજાવો.'
      },
      {
        topic: 'हिंदी (गणित)',
        title: 'कैलकुलस फॉर्मूला व नियम',
        query: 'डिफरेंशियल कैलकुलस (अवकलन) के मुख्य नियम और महत्वपूर्ण सूत्र हिंदी में आसान उदाहरण के साथ बताएं।'
      },
      {
        topic: 'हिंदी (भौतिकी)',
        title: 'कार्य, ऊर्जा और शक्ति',
        query: 'कार्य (Work), ऊर्जा (Energy) और शक्ति (Power) की परिभाषा, मात्रक (Units) और सूत्र हिंदी में समझाएं।'
      }
    ]
  },
  {
    id: 'mcqs',
    label: 'MCQ & Doubt Solver',
    icon: HelpCircle,
    prompts: [
      {
        topic: 'Dimensional Analysis',
        title: 'Work vs Torque Dimensions',
        query: 'Why do Work and Torque have the exact same dimensional formula [M L^2 T^-2] yet represent different quantities?'
      },
      {
        topic: 'Optics',
        title: 'Refraction & Speed of Light',
        query: 'Why does light bend and change speed when passing from air to glass, but frequency remains constant?'
      },
      {
        topic: 'Exam Strategy',
        title: '120-Minute Exam Allocation',
        query: 'How should I allocate my 120 minutes across Section 1 (50 Qs) and Section 2 (50 Qs) in DDCET to avoid negative marks?'
      },
      {
        topic: 'Practice MCQs',
        title: 'Integration by Parts MCQs',
        query: 'Generate 3 DDCET-style MCQs for Integration by Parts (ILATE rule) with 4 options and detailed step-by-step solutions.'
      }
    ]
  }
];

// Rich Markdown Message Formatter
function FormattedMessage({ text }) {
  if (!text) return null;

  // Split into lines
  const rawLines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = '';
  let inTable = false;
  let tableRows = [];

  const flushTable = (key) => {
    if (tableRows.length === 0) return;
    const headerRow = tableRows[0];
    const dataRows = tableRows.slice(1).filter(r => !r.every(c => /^[-:]+$/.test(c.trim())));

    elements.push(
      <div key={`table_${key}`} className="my-2.5 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">
            <tr>
              {headerRow.map((cell, cIdx) => (
                <th key={cIdx} className="px-3 py-1.5 text-left">{renderInline(cell.trim())}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-slate-850/50'}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{renderInline(cell.trim())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  const flushCode = (key) => {
    if (codeBuffer.length === 0 && !codeLang) return;
    const codeContent = codeBuffer.join('\n');
    elements.push(
      <div key={`code_${key}`} className="my-2.5 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs">
        {codeLang && (
          <div className="flex items-center justify-between px-3 py-1 bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] font-sans">
            <span className="flex items-center gap-1.5">
              <Terminal size={12} className="text-blue-400" />
              <span>{codeLang}</span>
            </span>
          </div>
        )}
        <pre className="p-3 overflow-x-auto text-xs leading-relaxed selection:bg-blue-600">
          <code>{codeContent}</code>
        </pre>
      </div>
    );
    codeBuffer = [];
    codeLang = '';
    inCodeBlock = false;
  };

  // Inline formatting: bold, inline code, math expressions
  function renderInline(str) {
    if (!str) return '';
    
    // Split by inline code `...`
    const codeParts = str.split(/(`[^`]+`)/g);
    return codeParts.map((part, pIdx) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
        return (
          <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-blue-700 dark:text-blue-300 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }

      // Inside normal text, process **bold**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, bIdx) => {
        if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 3) {
          const inner = bPart.slice(2, -2);
          const isFinalAnswer = inner.toLowerCase().includes('final answer') || inner.toLowerCase().includes('answer:');
          return (
            <strong 
              key={`${pIdx}_${bIdx}`} 
              className={isFinalAnswer ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-bold text-slate-900 dark:text-white'}
            >
              {inner}
            </strong>
          );
        }
        return bPart;
      });
    });
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Code block toggle ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCode(i);
      } else {
        if (inTable) flushTable(i);
        inCodeBlock = true;
        codeLang = trimmed.replace(/^```/, '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown Table Detection (| col | col |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cells = trimmed.slice(1, -1).split('|');
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={`empty_${i}`} className="h-1.5" />);
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h3_${i}`} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-2 pb-0.5">
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h2_${i}`} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-2.5 pb-1">
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h1_${i}`} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-3 pb-1">
          {renderInline(trimmed.replace(/^#\s+/, ''))}
        </h2>
      );
      continue;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr_${i}`} className="my-2 border-slate-200 dark:border-slate-700" />);
      continue;
    }

    // Bullet Point
    const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    // Numbered List / Step 1: / Step 2:
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    const stepMatch = trimmed.match(/^(Step\s+\d+:?|પગલું\s+\d+:?|चरण\s+\d+:?)\s*(.*)/i);

    if (isBullet) {
      const content = trimmed.replace(/^[•\-*]\s+/, '');
      elements.push(
        <div key={`bullet_${i}`} className="flex items-start gap-2 pl-2">
          <span className="text-[#2563EB] font-bold shrink-0 mt-0.5">•</span>
          <div className="flex-1">{renderInline(content)}</div>
        </div>
      );
      continue;
    }

    if (stepMatch) {
      elements.push(
        <div key={`step_${i}`} className="flex items-start gap-2 pl-2 py-0.5 bg-blue-50/40 dark:bg-slate-800/60 rounded-md border-l-2 border-[#2563EB]">
          <span className="text-[#1E3A8A] dark:text-blue-400 font-bold shrink-0 pl-1">{stepMatch[1]}</span>
          <div className="flex-1">{renderInline(stepMatch[2])}</div>
        </div>
      );
      continue;
    }

    if (numMatch) {
      elements.push(
        <div key={`num_${i}`} className="flex items-start gap-2 pl-2">
          <span className="text-[#1E3A8A] dark:text-blue-400 font-bold shrink-0">{numMatch[1]}.</span>
          <div className="flex-1">{renderInline(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={`p_${i}`} className="leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  if (inCodeBlock) flushCode('end');
  if (inTable) flushTable('end');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed select-text">
      {elements}
    </div>
  );
}

export default function AIMentor() {
  const { user, token } = useAuth();
  const storageKey = user?.id ? `rankrise_mentor_chat_${user.id}` : 'rankrise_mentor_chat_guest';

  // State
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
        id: 'welcome',
        sender: 'mentor',
        text: `Hello ${user?.name ? user.name : 'there'}! I am your AI Study Assistant for DDCET, powered by Groq.

I work just like ChatGPT to help you learn, solve problems, and clear doubts in every subject:
• **Mathematics & Numericals**: Step-by-step solutions with clear formulas, calculations, and verification.
• **Physics & Chemistry**: Deep concept explanations, laws, units, and real-world engineering applications.
• **Computer & Programming**: C programming, logic gates, algorithms, and commented code walkthroughs.
• **Multilingual Support**: Ask and get answers in English, Gujarati (ગુજરાતી), or Hindi (हिंदी).
• **MCQs & Revision**: Instant doubt resolution, formula summaries, and practice problems.

Ask me any question below to get started!`
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeCategory, setActiveCategory] = useState('math');
  const [copiedId, setCopiedId] = useState(null);
  const [apiStatus, setApiStatus] = useState({ configured: true, model: 'qwen/qwen3.8-27b' });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  // Fetch mentor status on mount
  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/api/student/mentor/status`)
      .then(res => res.json())
      .then(statusData => {
        if (isMounted && statusData) {
          setApiStatus(statusData);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Copy message text to clipboard
  const handleCopy = useCallback((text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  }, []);

  // Clear chat conversation
  const handleClearChat = () => {
    const defaultMsg = [
      {
        id: 'welcome_reset',
        sender: 'mentor',
        text: `Conversation reset. What would you like to solve or learn today? Ask any mathematics, science, engineering, or programming question!`
      }
    ];
    setMessages(defaultMsg);
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultMsg));
    } catch {}
  };

  // Send message
  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isThinking) return;

    const studentMsgId = `student_${Date.now()}`;
    const newMessages = [...messages, { id: studentMsgId, sender: 'student', text: query }];
    setMessages(newMessages);
    setInputText('');
    setIsThinking(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/student/mentor/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          history: newMessages.slice(-10).map(m => ({
            role: m.sender === 'mentor' ? 'assistant' : 'user',
            content: m.text
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setMessages(prev => [
            ...prev, 
            { 
              id: `mentor_${Date.now()}`, 
              sender: 'mentor', 
              text: data.reply,
              source: data.source,
              model: data.model 
            }
          ]);
          setIsThinking(false);
          return;
        }
      }

      if (res.status === 429) {
        setMessages(prev => [
          ...prev,
          {
            id: `error_${Date.now()}`,
            sender: 'mentor',
            text: '⚠️ **AI Rate Limit**: The AI service received too many requests in a short time. Please wait 10-15 seconds and try sending your question again.'
          }
        ]);
        setIsThinking(false);
        return;
      }

      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || 'Unable to get response from Groq AI service.';

      setMessages(prev => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          sender: 'mentor',
          text: `⚠️ **Error**: ${errMsg}`
        }
      ]);
      setIsThinking(false);
    } catch (_networkErr) {
      setMessages(prev => [
        ...prev,
        {
          id: `network_error_${Date.now()}`,
          sender: 'mentor',
          text: `⚠️ **Connection Error**: Unable to reach the server. Please check your internet connection and try again.`
        }
      ]);
      setIsThinking(false);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleTextareaInput = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 font-sans">
      
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-900">
              <Bot size={13} className="text-[#2563EB]" />
              <span>DDCET AI Assistant</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{apiStatus?.model ? `Groq Active (${apiStatus.model.split('/').pop()})` : 'Groq API Active'}</span>
            </span>
            <span className="text-xs text-slate-400">All Subjects • Step-by-Step Solutions</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Study Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Ask any question across Mathematics, Physics, Chemistry, and Engineering. Get detailed step-by-step solutions, code explanations, and answers in English, Gujarati (ગુજરાતી), or Hindi (हिंदी).
          </p>
        </div>

        {/* Reset Chat Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer"
            title="Start a new chat conversation"
          >
            <RotateCcw size={13} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Suggested Topic Tabs & Quick Prompts */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {PROMPT_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={12} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Prompts Grid for Active Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {(PROMPT_CATEGORIES.find(c => c.id === activeCategory)?.prompts || []).map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              className="text-left p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-slate-50/70 transition shadow-2xs group flex items-start justify-between gap-2 cursor-pointer"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#2563EB] dark:text-blue-400 uppercase tracking-wider block mb-0.5">
                  {p.topic}
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-300 truncate">
                  {p.title}
                </p>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {p.query}
                </p>
              </div>
              <ChevronRight size={14} className="text-slate-400 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation Box */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 shadow-xs flex flex-col h-[560px] overflow-hidden">
        
        {/* Messages History List */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isMentor = m.sender === 'mentor';
            const msgId = m.id || `msg_${idx}`;

            return (
              <div 
                key={msgId} 
                className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${isMentor ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs ${
                  isMentor 
                    ? 'bg-[#1E3A8A] text-white border border-blue-900' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  {isMentor ? <Bot size={16} /> : <User size={16} />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1 min-w-0">
                  <div className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-2xs relative group ${
                    isMentor 
                      ? 'bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-750 text-slate-800 dark:text-slate-200' 
                      : 'bg-[#1E3A8A] text-white'
                  }`}>
                    <FormattedMessage text={m.text} />

                    {/* Copy Response Button for Mentor Messages */}
                    {isMentor && (
                      <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <CheckCircle2 size={11} className="text-emerald-500" />
                          <span>AI Assistant • Groq</span>
                        </span>
                        
                        <button
                          onClick={() => handleCopy(m.text, msgId)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                          title="Copy response to clipboard"
                        >
                          {copiedId === msgId ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy Answer</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

          {/* Loading / Thinking Indicator */}
          {isThinking && (
            <div className="flex gap-3 max-w-[85%] self-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 bg-[#1E3A8A] text-white border border-blue-900 shadow-2xs">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl p-3.5 bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-750 text-slate-600 dark:text-slate-300 flex items-center gap-2.5 text-xs shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Solving and generating explanation with Groq AI...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Textarea & Send Bar */}
        <div className="p-3 sm:p-4 border-t border-[#E2E8F0] dark:border-slate-700 bg-slate-50/80 dark:bg-slate-850">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3.5 py-2 shadow-2xs focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition">
              <textarea 
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question, solve math equations step by step, or ask in ગુજરાતી / हिंदी (Enter to send, Shift+Enter for new line)..."
                disabled={isThinking}
                className="w-full bg-transparent border-0 outline-none resize-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60 max-h-36"
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0 cursor-pointer h-[42px]"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]">Shift + Enter</kbd> for new line</span>
            <span className="hidden sm:inline">English • ગુજરાતી • हिंदी</span>
          </div>
        </div>

      </div>

    </div>
  );
}
