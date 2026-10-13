import { useState } from 'react';
import { 
  MessageCircle, Send, Sparkles, BookOpen, Clock, 
  HelpCircle, Bot, User, Lightbulb, ChevronRight 
} from 'lucide-react';

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
    question: 'How should I use the Mistake Notebook effectively?',
    answer: 'After every mock test:\n1. Do not just look at your score — inspect your incorrect attempts in the Mistake Book.\n2. Identify whether the mistake was conceptual, calculation-based, or due to rushing.\n3. Write down the one-line formula or "Memory Cheat Code" in your notes before taking the next test.'
  }
];

export default function AIMentor() {
  const [messages, setMessages] = useState([
    {
      sender: 'mentor',
      text: 'Hello! I am your DDCET Academic Mentor. You can ask me questions about syllabus topics, exam time management, formula cheat codes, and score improvement strategies.'
    }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    // Append student message
    const newMessages = [...messages, { sender: 'student', text: query }];
    setMessages(newMessages);
    setInputText('');

    // Find best match in knowledge base or generate smart academic response
    setTimeout(() => {
      const match = SUGGESTED_QUERIES.find(
        q => q.question.toLowerCase().includes(query.toLowerCase()) || 
             query.toLowerCase().includes(q.topic.toLowerCase())
      );

      let responseText = match ? match.answer : null;

      if (!responseText) {
        if (/formula|cheat|units/i.test(query)) {
          responseText = 'Formula quick check:\n• Force: F = m × a (Newton)\n• Momentum: p = m × v (kg·m/s)\n• Wave speed: v = f × λ (m/s)\n• 2×2 Matrix Determinant: ad - bc\nCheck our Practice Lab for question-by-question cheat codes!';
        } else if (/syllabus|topics|chapters/i.test(query)) {
          responseText = 'The official DDCET syllabus comprises:\n1. Basics of Science & Engineering (Units & Measurements, Mechanics, Wave Motion & Optics, Thermodynamics, Modern Physics)\n2. Aptitude & Soft Skills (Matrices & Determinants, Calculus, Logical Aptitude, Technical English).\nVisit the Syllabus tab to track your unit-by-unit progress.';
        } else {
          responseText = `That is an important topic for DDCET preparation. To master "${query}", I recommend solving 10-15 targeted MCQs in the Practice Lab and checking related notes in the Study Library. Remember to review incorrect answers in your Mistake Book.`;
        }
      }

      setMessages(prev => [...prev, { sender: 'mentor', text: responseText }]);
    }, 400);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 font-sans">
      
      {/* Header */}
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

      {/* Suggested Strategy Topics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SUGGESTED_QUERIES.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.question)}
            className="text-left p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors shadow-2xs group flex items-start justify-between gap-2"
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
              className="flex-1 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
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
