import { ddcet2026OfficialQuestions } from './ddcet2026Questions';

export const syllabusData = [
  {
    "section": "BE-01",
    "name": "Units & Measurement",
    "subject": "Basics of Science & Engineering",
    "weightage": 12,
    "subtopics": [
      "Physical quantities and units",
      "SI ↔ CGS conversion",
      "Errors, relative/percentage error",
      "Vernier caliper & micrometer screw gauge"
    ],
    "cheat": "Keep units consistent before calculating. Percentage error = (absolute error / measured value) × 100.",
    "questions": [
      {
        "id": "Q1",
        "question": "Which SI unit is used for force?",
        "options": ["Newton", "Joule", "Watt", "Pascal"],
        "answer": 0,
        "explanation": "Force is measured in newtons (N). Joule is energy, watt is power, and pascal is pressure.",
        "cheat": "Force → Newton (N)."
      },
      {
        "id": "Q2",
        "question": "1 metre is equal to how many centimetres?",
        "options": ["10", "100", "1000", "0.1"],
        "answer": 1,
        "explanation": "The SI prefix centi- means 1/100, so 1 m = 100 cm.",
        "cheat": "Remember: kilo = 1000, centi = 1/100, milli = 1/1000."
      }
    ]
  },
  {
    "section": "BE-01",
    "name": "Classical Mechanics",
    "subject": "Basics of Science & Engineering",
    "weightage": 12,
    "subtopics": [
      "Linear motion",
      "Newton's laws",
      "Momentum and impulse",
      "Circular motion",
      "Work, energy and power"
    ],
    "cheat": "Use v = u + at for uniform acceleration. Work = force × displacement in the force direction.",
    "questions": [
      {
        "id": "Q3",
        "question": "The SI unit of momentum is:",
        "options": ["kg·m/s", "N/m", "J/s", "kg/m"],
        "answer": 0,
        "explanation": "Momentum p = mv, so its SI unit is kg·m/s.",
        "cheat": "Momentum = mass × velocity."
      },
      {
        "id": "Q4",
        "question": "Centripetal force on a circular path acts toward the:",
        "options": ["Centre", "Outside", "Tangent", "Top of the path"],
        "answer": 0,
        "explanation": "Centripetal means centre-seeking; the force points toward the centre.",
        "cheat": "Circular motion → inward force."
      }
    ]
  },
  {
    "section": "BE-01",
    "name": "Electric Current",
    "subject": "Basics of Science & Engineering",
    "weightage": 12,
    "subtopics": [
      "Ohm's law",
      "Charge and Coulomb force",
      "Electric field/potential/current",
      "Resistance and resistivity",
      "Capacitance"
    ],
    "cheat": "Ohm's law: V = IR. In series, resistances add; for identical parallel resistors, equivalent resistance is smaller.",
    "questions": [
      {
        "id": "Q5",
        "question": "Ohm's law is represented by:",
        "options": ["V = IR", "P = VI", "Q = It", "F = ma"],
        "answer": 0,
        "explanation": "Ohm's law relates voltage, current and resistance: V = IR.",
        "cheat": "V = I × R."
      },
      {
        "id": "Q6",
        "question": "Two 6 Ω resistors in series have equivalent resistance:",
        "options": ["3 Ω", "6 Ω", "12 Ω", "36 Ω"],
        "answer": 2,
        "explanation": "Series resistances add: 6 + 6 = 12 Ω.",
        "cheat": "Series → add resistances."
      }
    ]
  },
  {
    "section": "BE-01",
    "name": "Heat & Thermometry",
    "subject": "Basics of Science & Engineering",
    "weightage": 12,
    "subtopics": [
      "Modes of heat transfer",
      "Temperature scale conversion",
      "Heat capacity and specific heat",
      "Thermal conductivity",
      "Linear expansion"
    ],
    "cheat": "For Celsius to Kelvin, add 273.15. Conduction, convection and radiation are the three basic heat-transfer modes.",
    "questions": [
      {
        "id": "Q7",
        "question": "0°C is approximately equal to:",
        "options": ["0 K", "100 K", "273 K", "373 K"],
        "answer": 2,
        "explanation": "Kelvin temperature = Celsius + 273.15, so 0°C ≈ 273 K.",
        "cheat": "K = °C + 273.15."
      },
      {
        "id": "Q8",
        "question": "Heat transfer through direct molecular interaction is:",
        "options": ["Conduction", "Convection", "Radiation", "Reflection"],
        "answer": 0,
        "explanation": "Conduction transfers heat through direct contact within a material.",
        "cheat": "Conduction → contact."
      }
    ]
  },
  {
    "section": "BE-01",
    "name": "Wave Motion, Optics & Acoustics",
    "subject": "Basics of Science & Engineering",
    "weightage": 12,
    "subtopics": [
      "Types of waves",
      "Frequency, wavelength and period",
      "EM and sound waves",
      "Reflection/refraction",
      "Optical fibre",
      "Reverberation"
    ],
    "cheat": "Wave relation: v = fλ. In optical fibre, total internal reflection guides light through the core.",
    "questions": [
      {
        "id": "Q9",
        "question": "The relation between wave speed v, frequency f and wavelength λ is:",
        "options": ["v=fλ", "v=f/λ", "v=λ/f", "v=f+λ"],
        "answer": 0,
        "explanation": "Wave speed equals frequency multiplied by wavelength.",
        "cheat": "v = fλ."
      },
      {
        "id": "Q10",
        "question": "Optical fibre mainly works on:",
        "options": ["Diffraction", "Total internal reflection", "Photoelectric effect", "Dispersion only"],
        "answer": 1,
        "explanation": "Light is guided through the fibre by repeated total internal reflection.",
        "cheat": "Fibre → TIR."
      }
    ]
  },
  {
    "section": "BE-02",
    "name": "Determinant & Matrices",
    "subject": "Aptitude: Mathematics & Soft Skill",
    "weightage": 8,
    "subtopics": [
      "Determinants up to 3rd order",
      "Matrix types",
      "Matrix operations",
      "2×2 inverse",
      "Simultaneous linear equations"
    ],
    "cheat": "For a 2×2 matrix [[a,b],[c,d]], determinant = ad − bc. A matrix is singular when its determinant is zero.",
    "questions": [
      {
        "id": "Q21",
        "question": "The determinant of [[a,b],[c,d]] is:",
        "options": ["ad-bc", "ab-cd", "ac-bd", "a+b+c+d"],
        "answer": 0,
        "explanation": "For a 2×2 matrix, determinant = ad − bc.",
        "cheat": "2×2 determinant → ad − bc."
      }
    ]
  }
];

// Complete 100 questions from official DDCET 2026 examination
export const mockQuestions = ddcet2026OfficialQuestions;

export const mockTests = [
  {
    id: 't-100',
    title: 'DDCET 2026 Full Length Mock Exam (100 MCQs)',
    type: 'combined',
    scheduledStartTime: new Date(Date.now() - 3600000).toISOString(),
    scheduledEndTime: new Date(Date.now() + 86400000 * 365).toISOString(),
    durationMinutes: 120,
    status: 'published',
    questions: ddcet2026OfficialQuestions,
  },
  {
    id: 't-50-sec1',
    title: 'DDCET Section-1: Basics of Science & Engineering (50 MCQs)',
    type: 'sectional',
    scheduledStartTime: new Date(Date.now() - 3600000).toISOString(),
    scheduledEndTime: new Date(Date.now() + 86400000 * 365).toISOString(),
    durationMinutes: 60,
    status: 'published',
    questions: ddcet2026OfficialQuestions.filter(q => q.number <= 50),
  },
  {
    id: 't-50-sec2',
    title: 'DDCET Section-2: Aptitude & Soft Skills (50 MCQs)',
    type: 'sectional',
    scheduledStartTime: new Date(Date.now() - 3600000).toISOString(),
    scheduledEndTime: new Date(Date.now() + 86400000 * 365).toISOString(),
    durationMinutes: 60,
    status: 'published',
    questions: ddcet2026OfficialQuestions.filter(q => q.number > 50),
  },
  {
    id: 't1',
    title: 'Full DDCET-style Mock Test (100 MCQs)',
    type: 'combined',
    scheduledStartTime: new Date(Date.now() - 3600000).toISOString(),
    scheduledEndTime: new Date(Date.now() + 86400000 * 365).toISOString(),
    durationMinutes: 120,
    status: 'published',
    questions: ddcet2026OfficialQuestions,
  }
];

// User Progress Store (Mimicking HTML's localStore logic)
export const getProgressStore = () => JSON.parse(localStorage.getItem("rankrise_progress") || '{"attempts":[],"mistakes":[]}');
export const saveProgressStore = (s) => localStorage.setItem("rankrise_progress", JSON.stringify(s));

let currentTests = [...mockTests];

export const getTests = () => [...currentTests];
export const getTestById = (id) => currentTests.find(t => t.id === id);
export const addTest = (test) => {
  currentTests.push({ ...test, id: 't' + Date.now() });
};
export const publishTest = (id) => {
  currentTests = currentTests.map(t => t.id === id ? { ...t, status: 'published' } : t);
};
