/**
 * DDCET RankRise - Groq AI Study Assistant Service
 * Official integration using Groq API (https://api.groq.com/openai/v1/chat/completions)
 * ChatGPT-like intelligent academic chatbot for students.
 */

const fs = require('fs');
const path = require('path');

// Safe, zero-dependency .env loader for local development
function loadLocalEnv() {
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '.env')
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
        break;
      }
    } catch (_err) {}
  }
}

loadLocalEnv();

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
const FALLBACK_MODEL = 'openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 20000;

function getGroqApiKey() {
  if (process.env.GROQ_API_KEY !== undefined) {
    return process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';
  }
  loadLocalEnv();
  return process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';
}

function isGroqConfigured() {
  const key = getGroqApiKey();
  return Boolean(key && key.startsWith('gsk_') && key.length > 20);
}

/**
 * Build ChatGPT-style Academic Chatbot System Prompt
 */
function buildSystemPrompt() {
  return `You are the AI Mentor and Academic Chatbot of DDCET RankRise, acting like ChatGPT for engineering diploma students preparing for the DDCET (Diploma to Degree Common Entrance Test) in Gujarat and general engineering studies.

You are friendly, highly knowledgeable, articulate, and patient. You can answer questions on ANY academic subject or topic (Mathematics, Physics, Chemistry, Computer Engineering / IT, Environmental Sciences, English / Soft Skills, General Science, etc.) without restriction.

=== CORE INSTRUCTIONS ===

1. MATHEMATICS & NUMERICAL PROBLEMS (CRITICAL):
Whenever a student asks any mathematical problem, equation, algebra, calculus, trigonometry, matrix, coordinate geometry, or physics numerical:
• Step A - Understand the Question & Identify Givens: State what is given in the problem and what needs to be determined.
• Step B - State the Formula / Approach: Explicitly write down the relevant formula, theorem, or method being applied.
• Step C - Sequential Step-by-Step Calculation: Show every calculation step clearly on its own line:
    - Step 1: [Initial equation / substitution]
    - Step 2: [Next operation with brief explanation of WHY]
    - Step 3: [Further simplification]
    - ...
• Step D - Final Answer: State the final result clearly in bold (e.g. "**Final Answer: x = 5**").
• Step E - Verification / Double Check: Show a quick verification by substituting the answer back into the original equation to prove correctness.

Example:
For "Solve 2x + 5 = 15":
Given: 2x + 5 = 15
Method: Isolate the variable x by transposing terms.
Step 1: 2x + 5 = 15
Step 2: Subtract 5 from both sides: 2x = 15 - 5
Step 3: Simplify the right side: 2x = 10
Step 4: Divide both sides by 2: x = 10 / 2
**Final Answer: x = 5**
Verification: Substitute x = 5: 2(5) + 5 = 10 + 5 = 15 (LHS = RHS, verified!)

Apply this exact step-by-step structure to all algebraic equations, matrices, integrals, derivatives, limits, and physics numericals!

2. CONCEPTUAL & THEORY QUESTIONS (Physics, Chemistry, Computer, English, etc.):
• Definitions with Simple Examples: Explain definitions in straightforward terms followed by intuitive real-world examples.
• Step-by-Step Explanations: Break complex ideas down into digestible parts.
• Comparison Tables: Use Markdown tables when comparing two concepts (e.g., Conductors vs Insulators, While loop vs For loop, Speed vs Velocity).
• Formulas & Applications: Explain why the formula works, what each variable represents, and its practical engineering application.
• Programming Questions (C, Data Structures, Logic Gates): Provide clean, commented code examples with clear output explanations.
• MCQ Explanations: When explaining multiple-choice questions, clearly state why the correct answer is right and why the other options are wrong.

3. MULTILINGUAL COMMUNICATION:
• Detect the student's language automatically:
  - If the student asks in **Gujarati (ગુજરાતી)** or writes in Gujarati script, respond in natural, fluent, accurate Gujarati (keeping technical formulas/terms clear in English/Gujarati).
  - If the student asks in **Hindi (हिंदी)**, respond in clear, grammatically sound Hindi.
  - If the student asks in **English**, respond in simple, accessible English.
  - If the student uses mixed language (Gujlish or Hinglish), respond in the same natural conversational blend.

4. RESPONSE TONE & QUALITY:
• Always be accurate, polite, and encouraging.
• Never provide random, irrelevant, or fabricated answers.
• If a student's question is incomplete, ambiguous, or lacks necessary parameters, politely ask for clarification.
• Format all responses beautifully using Markdown: bold keywords, bullet lists, numbered steps, tables, code blocks, and readable mathematical formatting.
• Provide concise answers for simple questions and detailed step-by-step walkthroughs for complex problems.`;
}

/**
 * Format conversation history into OpenAI/Groq message objects
 */
function formatHistory(history, newQuery) {
  const messages = [];

  if (Array.isArray(history)) {
    // Keep recent history (last 10 messages) to maintain multi-turn conversation context
    const recent = history.slice(-10);
    for (const h of recent) {
      if (!h) continue;
      const role = (h.role === 'mentor' || h.role === 'model' || h.role === 'assistant' || h.sender === 'mentor') 
        ? 'assistant' 
        : 'user';
      const content = h.content || h.text || (h.parts && h.parts[0]?.text) || '';
      if (content && typeof content === 'string' && content.trim()) {
        messages.push({ role, content: content.trim() });
      }
    }
  }

  messages.push({ role: 'user', content: newQuery });
  return messages;
}

/**
 * Execute Groq API chat completion with timeout and model fallback
 */
async function callGroqChat(messages, systemPrompt, modelToUse) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in environment variables.');
  }

  const payload = {
    model: modelToUse,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.5,
    max_tokens: 850,
    top_p: 0.95
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.status === 429) {
      const errData = await res.json().catch(() => ({}));
      const retryAfter = res.headers.get('retry-after') || 'a few seconds';
      throw new Error(`Groq rate limit reached (429). Please wait ${retryAfter} before sending another message. ${errData.error?.message || ''}`);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData.error?.message || `Groq API responded with status ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();
    const replyText = data.choices?.[0]?.message?.content;

    if (!replyText || !replyText.trim()) {
      const reasoning = data.choices?.[0]?.message?.reasoning;
      if (reasoning && reasoning.trim()) {
        return reasoning.trim();
      }
      throw new Error('Empty response received from Groq model.');
    }

    return replyText.trim();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Groq request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds. Please try again.`);
    }
    throw err;
  }
}

/**
 * Main service entrypoint for AI Chatbot
 */
async function askGroqMentor({ query, history = [] }) {
  const cleanQuery = typeof query === 'string' ? query.trim() : '';
  if (!cleanQuery) {
    throw new Error('Query is required.');
  }

  const systemPrompt = buildSystemPrompt();
  const messages = formatHistory(history, cleanQuery);

  const primaryModel = PRIMARY_MODEL;
  const fallbackModel = FALLBACK_MODEL;

  // Attempt with primary model
  try {
    const reply = await callGroqChat(messages, systemPrompt, primaryModel);
    return {
      success: true,
      reply,
      model: primaryModel,
      source: 'groq'
    };
  } catch (primaryErr) {
    console.warn(`[Groq Service] Primary model ${primaryModel} failed: ${primaryErr.message}`);

    // If rate-limited or capacity issue, attempt fallback model
    if (fallbackModel && fallbackModel !== primaryModel) {
      try {
        console.log(`[Groq Service] Attempting fallback model: ${fallbackModel}...`);
        const fallbackReply = await callGroqChat(messages, systemPrompt, fallbackModel);
        return {
          success: true,
          reply: fallbackReply,
          model: fallbackModel,
          source: 'groq_fallback'
        };
      } catch (fallbackErr) {
        console.warn(`[Groq Service] Fallback model ${fallbackModel} also failed: ${fallbackErr.message}`);
      }
    }

    throw primaryErr;
  }
}

module.exports = {
  askGroqMentor,
  isGroqConfigured,
  getGroqApiKey,
  buildSystemPrompt,
  PRIMARY_MODEL,
  FALLBACK_MODEL
};
