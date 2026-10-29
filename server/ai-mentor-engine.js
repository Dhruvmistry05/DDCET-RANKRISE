/**
 * DDCET RankRise - AI Academic Mentor Engine
 * Dedicated academic intelligence for Gujarat Diploma to Degree (DDCET 2027) entrance examination.
 */

function generateDdcetAcademicResponse(query, studentContext) {
  const q = query.trim().toLowerCase();

  // 1. Student Personal Performance & Diagnostic Insights
  if (/my (score|performance|rank|progress|weak|readiness|status|standing)|how am i doing|what should i (study|revise|focus|do)|recommend|my analytics/i.test(q)) {
    if (studentContext && studentContext.name) {
      const tests = studentContext.tests_completed || 0;
      const avg = studentContext.average_score || '0%';
      const rank = studentContext.current_rank || '-';
      const coverage = studentContext.syllabus_progress || '0%';
      const branch = studentContext.branch || 'Diploma Engineering';

      let diagnosticText = `Hello ${studentContext.name}! Here is your current DDCET 2027 diagnostic profile:\n\n`;
      diagnosticText += `• **Diploma Branch**: ${branch}\n`;
      diagnosticText += `• **Assessments Completed**: ${tests} ${tests === 1 ? 'test' : 'tests'}\n`;
      diagnosticText += `• **Average Score**: ${avg}\n`;
      diagnosticText += `• **Statewide Leaderboard Rank**: ${rank}\n`;
      diagnosticText += `• **Syllabus Coverage**: ${coverage}\n\n`;

      if (tests === 0) {
        diagnosticText += `**Academic Next Steps**:\n`;
        diagnosticText += `1. Take a 15-question diagnostic session in **Practice Lab** to establish your baseline accuracy.\n`;
        diagnosticText += `2. Review the **Official DDCET 2027 Syllabus** to mark topics you've covered in diploma coursework.\n`;
        diagnosticText += `3. Spend at least 30-45 minutes today practicing core Engineering Mathematics or Physics.`;
      } else {
        diagnosticText += `**Personalized Recommendations**:\n`;
        diagnosticText += `1. **Target Weak Areas**: Check your **Analytics** dashboard to inspect chapters with accuracy below 60%.\n`;
        diagnosticText += `2. **Weak Spot**: Review incorrect attempts in your **Weak Spot** to recover marks lost to the -0.5 penalty.\n`;
        diagnosticText += `3. **Timed Full Papers**: Practice full 100-MCQ question papers in the **Previous Year Papers** section to build 120-minute exam endurance.`;
      }
      return diagnosticText;
    } else {
      return `To view personalized diagnostics and recommendations:\n• Log in or create your student profile.\n• Once authenticated, I can analyze your practice test attempts, track weak topics, and evaluate your statewide merit rank!`;
    }
  }

  // 2. DDCET 2027 Exam Pattern, Marking Scheme & Strategy
  if (/pattern|marking|negative|marks|scheme|duration|time management|structure|blueprint|how many questions/i.test(q)) {
    return `### DDCET 2027 Official Blueprint & Exam Pattern

**Exam Structure**:
• **Total Questions**: 100 Multiple Choice Questions (MCQs)
• **Exam Duration**: 120 Minutes (2 Hours)
• **Total Marks**: 200 Marks
• **Marking Scheme**:
  - Correct Answer: **+2.0 Marks**
  - Incorrect Answer: **-0.5 Marks** (Negative Marking, 1:4 ratio)
  - Unattempted: **0.0 Marks**

**Section Breakdown**:
1. **Section 1 (50 Qs, 100 Marks)**: *Basics of Science & Engineering*
   - Physics (Mechanics, Optics, Thermodynamics, Units & Measurements)
   - Chemistry (Bonding, Solutions, Electrochemistry, Polymers)
   - Environmental Sciences
2. **Section 2 (50 Qs, 100 Marks)**: *Aptitude & Mathematics*
   - Engineering Mathematics (Matrices, Calculus, Vectors, Differential Equations)
   - Computer & IT Basics (C Programming, Logic Gates, Number Systems)
   - Technical English & Soft Skills

**Recommended 120-Minute Strategy**:
• **00–55 min**: Section 1 (Science & Engineering) — solve direct conceptual questions first.
• **55–110 min**: Section 2 (Mathematics & Aptitude) — allocate ~1 min per math problem.
• **110–120 min**: Final 10-minute review buffer to revisit flagged questions.

*Golden Rule*: If you can eliminate 2 out of 4 choices, mathematically you should attempt the question. If you have no clue, SKIP it!`;
  }

  // 3. Mathematics: Matrices & Determinants
  if (/matrix|matrices|determinant|cramer|eigen|inverse|adjoint|rank of matrix/i.test(q)) {
    return `### Engineering Mathematics: Matrices & Determinants

**Core Formulas & Concepts for DDCET**:
1. **2×2 Determinant**:
   $$\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc$$

2. **Matrix Inverse**:
   $$A^{-1} = \\frac{1}{|A|} \\text{adj}(A) \\quad (|A| \\neq 0)$$
   - If $|A| = 0$, $A$ is **singular** and has no inverse.
   - For a 2×2 matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$, $\\text{adj}(A) = \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$.

3. **Eigenvalues & Eigenvectors**:
   - Characteristic equation: $|A - \\lambda I| = 0$
   - **Sum of Eigenvalues** = $\\text{Trace}(A)$ (sum of diagonal elements)
   - **Product of Eigenvalues** = $\\det(A)$

4. **Orthogonal Matrix**:
   $$A \\cdot A^T = I \\implies |A| = \\pm 1$$

*Exam Tip*: Questions asking for the product of eigenvalues can be answered immediately by computing $|A|$ without solving the characteristic polynomial!`;
  }

  // 4. Mathematics: Differentiation & Calculus
  if (/derivative|differentiat|chain rule|product rule|quotient rule|maxima|minima|tangent|normal/i.test(q)) {
    return `### Engineering Mathematics: Differentiation & Calculus

**Standard Derivatives**:
• $\\frac{d}{dx}[x^n] = n x^{n-1}$
• $\\frac{d}{dx}[\\sin x] = \\cos x$ & $\\frac{d}{dx}[\\cos x] = -\\sin x$
• $\\frac{d}{dx}[\\tan x] = \\sec^2 x$ & $\\frac{d}{dx}[\\cot x] = -\\csc^2 x$
• $\\frac{d}{dx}[e^x] = e^x$ & $\\frac{d}{dx}[a^x] = a^x \\ln a$
• $\\frac{d}{dx}[\\ln x] = \\frac{1}{x}$

**Rules of Differentiation**:
• **Product Rule**: $(u v)' = u' v + u v'$
• **Quotient Rule**: $\\left(\\frac{u}{v}\\right)' = \\frac{u' v - u v'}{v^2}$
• **Chain Rule**: $\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$

**Maxima & Minima**:
1. Find stationary points by setting $f'(x) = 0$.
2. Second derivative test:
   - If $f''(x_0) < 0 \\implies$ Local Maximum at $x_0$.
   - If $f''(x_0) > 0 \\implies$ Local Minimum at $x_0$.
   - If $f''(x_0) = 0 \\implies$ Inconclusive (test higher derivatives).`;
  }

  // 5. Mathematics: Integration
  if (/integrat|integral|by parts|definite integral|substitution/i.test(q)) {
    return `### Engineering Mathematics: Integration

**Standard Integrals**:
• $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)$
• $\\int \\frac{1}{x} dx = \\ln|x| + C$
• $\\int e^x dx = e^x + C$ and $\\int a^x dx = \\frac{a^x}{\\ln a} + C$
• $\\int \\sin x dx = -\\cos x + C$ and $\\int \\cos x dx = \\sin x + C$
• $\\int \\sec^2 x dx = \\tan x + C$

**Integration by Parts**:
$$\\int u v dx = u \\int v dx - \\int \\left( u' \\int v dx \\right) dx$$
- Follow the **ILATE** priority to choose $u$:
  1. **I** - Inverse trigonometric ($\\sin^{-1} x$)
  2. **L** - Logarithmic ($\\ln x$)
  3. **A** - Algebraic ($x^2, 3x$)
  4. **T** - Trigonometric ($\\sin x, \\cos x$)
  5. **E** - Exponential ($e^x, 2^x$)

**Definite Integral King Property**:
$$\\int_0^a f(x) dx = \\int_0^a f(a - x) dx$$
Use this property whenever you see expressions like $\\int_0^{\\pi/2} \\frac{\\sin x}{\\sin x + \\cos x} dx = \\frac{\\pi}{4}$.`;
  }

  // 6. Mathematics: Differential Equations
  if (/differential equation|order.*degree|integrating factor|variable separable/i.test(q)) {
    return `### Engineering Mathematics: Differential Equations

**Key Definitions**:
• **Order**: The order of the highest derivative occurring in the equation.
• **Degree**: The power (exponent) of the highest derivative after clearing fractional powers and radicals.
  *Example*: $\\left(\\frac{d^2y}{dx^2}\\right)^3 + \\left(\\frac{dy}{dx}\\right)^4 = 0 \\implies \\text{Order } 2, \\text{ Degree } 3$.

**First-Order Linear Differential Equation**:
$$\\frac{dy}{dx} + P(x)y = Q(x)$$
1. Calculate the **Integrating Factor (IF)**:
   $$IF = e^{\\int P(x) dx}$$
2. The general solution is:
   $$y \\cdot IF = \\int (Q(x) \\cdot IF) dx + C$$

**Variable Separable Form**:
If $f(x) dx = g(y) dy$, integrate both sides directly: $\\int f(x) dx = \\int g(y) dy + C$.`;
  }

  // 7. Mathematics: Vectors & 3D Geometry
  if (/vector|dot product|cross product|unit vector|magnitude/i.test(q)) {
    return `### Engineering Mathematics: Vectors & Dot/Cross Products

**Given Vectors** $\\vec{a} = a_1 \\hat{i} + a_2 \\hat{j} + a_3 \\hat{k}$ and $\\vec{b} = b_1 \\hat{i} + b_2 \\hat{j} + b_3 \\hat{k}$:

1. **Magnitude**:
   $$|\\vec{a}| = \\sqrt{a_1^2 + a_2^2 + a_3^2}$$
   Unit vector: $\\hat{a} = \\frac{\\vec{a}}{|\\vec{a}|}$

2. **Dot Product (Scalar Product)**:
   $$\\vec{a} \\cdot \\vec{b} = a_1 b_1 + a_2 b_2 + a_3 b_3 = |\\vec{a}| |\\vec{b}| \\cos\\theta$$
   - **Perpendicular Condition**: $\\vec{a} \\cdot \\vec{b} = 0 \\iff \\vec{a} \\perp \\vec{b}$
   - Angle: $\\cos\\theta = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}| |\\vec{b}|}$

3. **Cross Product (Vector Product)**:
   $$\\vec{a} \\times \\vec{b} = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ a_1 & a_2 & a_3 \\\\ b_1 & b_2 & b_3 \\end{vmatrix} = |\\vec{a}| |\\vec{b}| \\sin\\theta \\hat{n}$$
   - **Parallel Condition**: $\\vec{a} \\times \\vec{b} = \\vec{0} \\iff \\vec{a} \\parallel \\vec{b}$
   - Area of triangle formed by $\\vec{a}$ and $\\vec{b}$ = $\\frac{1}{2} |\\vec{a} \\times \\vec{b}|$.`;
  }

  // 8. Physics: Units & Dimensions
  if (/units|dimension|si unit|measurement|error|least count|vernier/i.test(q)) {
    return `### Physics: Units, Dimensions & Measurements

**Fundamental SI Units**:
• Mass: Kilogram (kg) • Length: Meter (m) • Time: Second (s)
• Current: Ampere (A) • Temperature: Kelvin (K) • Substance: Mole (mol)

**High-Yield Dimensional Formulas for DDCET**:
• **Force**: $[M^1 L^1 T^{-2}]$
• **Work / Energy**: $[M^1 L^2 T^{-2}]$
• **Power**: $[M^1 L^2 T^{-3}]$
• **Pressure / Stress**: $[M^1 L^{-1} T^{-2}]$
• **Surface Tension**: $[M^1 L^0 T^{-2}]$
• **Viscosity ($\\eta$)**: $[M^1 L^{-1} T^{-1}]$
• **Frequency**: $[M^0 L^0 T^{-1}]$
• **Planck's Constant ($h$)**: $[M^1 L^2 T^{-1}]$

**Least Count Formulas**:
• **Vernier Caliper**: $LC = 1 \\text{ MSD} - 1 \\text{ VSD} = \\frac{\\text{Value of 1 MSD}}{\\text{Total Vernier Divisions}}$
• **Screw Gauge**: $LC = \\frac{\\text{Pitch}}{\\text{Total Circular Scale Divisions}}$`;
  }

  // 9. Physics: Classical Mechanics & Newton's Laws
  if (/mechanic|force|newton|friction|work|kinetic|potential|momentum|projectile|circular motion/i.test(q)) {
    return `### Physics: Mechanics, Newton's Laws & Dynamics

**Newton's Laws & Momentum**:
• **Force**: $F = m a = \\frac{dp}{dt}$
• **Linear Momentum**: $p = m v$
• **Impulse**: $J = F \\Delta t = \\Delta p = m(v - u)$

**Work, Energy & Power**:
• **Work**: $W = \\vec{F} \\cdot \\vec{d} = F d \\cos\\theta$
• **Kinetic Energy**: $KE = \\frac{1}{2} m v^2 = \\frac{p^2}{2m}$
• **Potential Energy**: $PE = mgh$
• **Work-Energy Theorem**: $W_{\\text{net}} = \\Delta KE = \\frac{1}{2}m v_f^2 - \\frac{1}{2}m v_i^2$
• **Power**: $P = \\frac{W}{t} = \\vec{F} \\cdot \\vec{v}$ (Watt)

**Projectile Motion**:
• Time of flight: $T = \\frac{2 u \\sin\\theta}{g}$
• Maximum height: $H = \\frac{u^2 \\sin^2\\theta}{2g}$
• Horizontal Range: $R = \\frac{u^2 \\sin 2\\theta}{g}$
  *(Maximum range occurs at $\\theta = 45^\\circ$ where $R_{\\max} = \\frac{u^2}{g}$)*

**Friction**:
• Limiting static friction: $f_s \\le \\mu_s N$
• Kinetic friction: $f_k = \\mu_k N \\quad (\\mu_k < \\mu_s)$`;
  }

  // 10. Physics: Heat & Thermodynamics
  if (/thermodynamic|carnot|efficiency|heat engine|entropy|specific heat|isothermal|adiabatic/i.test(q)) {
    return `### Physics: Heat & Thermodynamics

**Laws of Thermodynamics**:
• **Zeroth Law**: Defines temperature (thermal equilibrium).
• **First Law**: Conservation of energy $\\Delta Q = \\Delta U + \\Delta W$ (where $\\Delta W = P \\Delta V$).
• **Second Law**: Heat cannot spontaneously flow from cold to hot without external work (Kelvin-Planck & Clausius statements).

**Carnot Engine Efficiency (Must-Know Formula)**:
$$\\eta = 1 - \\frac{T_{\\text{sink}}}{T_{\\text{source}}} = \\frac{T_1 - T_2}{T_1} = \\frac{W}{Q_1}$$
*Crucial*: Always convert temperatures to **Kelvin** ($K = ^\\circ\\text{C} + 273$)!
*Example*: Source at $327^\\circ\\text{C}$ (600 K), Sink at $27^\\circ\\text{C}$ (300 K):
$$\\eta = 1 - \\frac{300}{600} = 0.50 = 50\\%$$

**Thermodynamic Processes**:
• **Isothermal**: $T = \\text{const} \\implies \\Delta U = 0, \\ P_1 V_1 = P_2 V_2$
• **Adiabatic**: $Q = 0 \\implies P V^\\gamma = \\text{const}$ (faster process, no heat exchange)
• **Isobaric**: $P = \\text{const} \\implies W = P(V_2 - V_1)$
• **Isochoric**: $V = \\text{const} \\implies W = 0, \\ \\Delta Q = \\Delta U$`;
  }

  // 11. Physics: Wave Motion, Acoustics & Optics
  if (/wave|optics|sound|acoustic|doppler|snell|refraction|lens|focal|reflection/i.test(q)) {
    return `### Physics: Waves, Optics & Acoustics

**Wave & Sound Basics**:
• **Wave Speed**: $v = f \\lambda$
• **Doppler Effect**: Apparent frequency shifts when source or observer moves relative to the medium:
  $$f' = f \\left(\\frac{v \\pm v_o}{v \\mp v_s}\\right)$$
• **Intensity of Sound**: Decibel scale $\\beta = 10 \\log_{10}\\left(\\frac{I}{I_0}\\right)$

**Optics & Ray Refraction**:
• **Snell's Law**:
  $$n_1 \\sin i = n_2 \\sin r \\implies \\frac{\\sin i}{\\sin r} = \\frac{n_2}{n_1} = \\frac{v_1}{v_2}$$
• **Total Internal Reflection (TIR)**:
  Occurs when light travels from denser to rarer medium and angle of incidence $i > \\theta_c$ (critical angle):
  $$\\sin \\theta_c = \\frac{n_{\\text{rare}}}{n_{\\text{dense}}}$$
• **Thin Lens Formula**:
  $$\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}, \\quad m = \\frac{v}{u}$$
• **Power of Lens**: $P = \\frac{1}{f \\text{ (in meters)}}$ (Unit: Diopter, D).
  - Convex lens: $f > 0, P > 0$
  - Concave lens: $f < 0, P < 0$`;
  }

  // 12. Chemistry: Bonding, Electrochemistry & Solutions
  if (/chemistry|bonding|ph |acid|base|electrochem|faraday|nernst|polymer|solution|molarity/i.test(q)) {
    return `### Basics of Chemistry for DDCET

**1. Chemical Bonding**:
• **Ionic Bond**: Formed by complete transfer of electrons (e.g. $NaCl, MgO$). High melting point, conduct electricity in molten state.
• **Covalent Bond**: Formed by sharing of electron pairs (e.g. $CH_4, H_2O$).
• **Coordinate (Dative) Bond**: Both shared electrons provided by one atom (e.g. $NH_4^+, H_3O^+$).

**2. Electrochemistry**:
• **Faraday's 1st Law**: Mass deposited $m = Z \\cdot I \\cdot t = \\frac{E \\cdot I \\cdot t}{96500}$
  *(1 Faraday = 96,500 Coulombs = charge of 1 mole of electrons)*
• **Nernst Equation** ($25^\\circ\\text{C}$):
  $$E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n} \\log Q$$

**3. Solutions & pH**:
• **Molarity ($M$)**: $\\text{Moles of Solute} / \\text{Volume of Solution in Liters}$
• **pH Definition**: $\\text{pH} = -\\log_{10}[H^+]$
  - Acidic: $\\text{pH} < 7$
  - Neutral: $\\text{pH} = 7$
  - Basic: $\\text{pH} > 7$
  - $\\text{pH} + \\text{pOH} = 14$ at $25^\\circ\\text{C}$

**4. Polymers**:
• **Addition Polymers**: Formed without byproduct elimination (e.g. Polyethylene, PVC, Teflon, Polystyrene).
• **Condensation Polymers**: Formed with elimination of small molecules like $H_2O, HCl$ (e.g. Nylon-6,6, Bakelite, Terylene).`;
  }

  // 13. Computer & IT Basics (C Programming, Logic Gates, Numbers)
  if (/c program|c lang|loop|array|pointer|binary|hexadecimal|logic gate|stack|queue|data structure|bitwise/i.test(q)) {
    return `### Computer & IT Basics for DDCET

**1. C Programming Essentials**:
• **Data Type Sizes (Standard 32/64-bit)**:
  - \`char\`: 1 byte (-128 to 127)
  - \`int\`: 2 or 4 bytes
  - \`float\`: 4 bytes
  - \`double\`: 8 bytes
• **Pointers**:
  - \`int *p = &x;\` -> \`p\` stores address of \`x\`, \`*p\` accesses value of \`x\`.
• **Loop Types**:
  - \`for\`, \`while\` (Entry-controlled loops)
  - \`do-while\` (Exit-controlled loop — executes at least once!)

**2. Logic Gates**:
• **AND**: Output 1 only if all inputs are 1 ($Y = A \\cdot B$).
• **OR**: Output 1 if at least one input is 1 ($Y = A + B$).
• **NOT**: Inverts the bit ($Y = \\bar{A}$).
• **XOR**: Output 1 if inputs are distinct ($Y = A \\oplus B = A\\bar{B} + \\bar{A}B$).
• **Universal Gates**: **NAND** and **NOR** can implement all other gates!

**3. Number Systems & Binary Conversions**:
• **Base values**: Binary (2), Octal (8), Decimal (10), Hexadecimal (16, digits 0-9, A-F).
• **1's Complement**: Invert all bits ($0 \\to 1, 1 \\to 0$).
• **2's Complement**: $\\text{1's Complement} + 1$.

**4. Data Structures**:
• **Stack**: LIFO (Last In, First Out) -> Operations: Push, Pop.
• **Queue**: FIFO (First In, First Out) -> Operations: Enqueue, Dequeue.
• **Binary Search Complexity**: $O(\\log n)$ (requires sorted array).`;
  }

  // 14. Technical English & Soft Skills
  if (/english|grammar|tenses|voice|preposition|vocabulary|active.*passive/i.test(q)) {
    return `### Technical English & Soft Skills for DDCET

**1. Active & Passive Voice Transformation**:
• Rule: Subject becomes object, use appropriate auxiliary verb + Past Participle (V3).
  - *Active*: "The engineer designed the circuit."
  - *Passive*: "The circuit **was designed** by the engineer."
• Continuous tense uses \`being\` (e.g., "is being repaired").
• Perfect tense uses \`been\` (e.g., "has been completed").

**2. Subject-Verb Agreement**:
• Two singular subjects joined by 'and' take a plural verb.
• Expressions like *along with*, *as well as*, *in addition to* do not change the number of the subject:
  *"The professor, along with his students, **is** attending the seminar."*
• *Neither...nor*, *Either...or*: The verb agrees with the closer subject:
  *"Neither the teacher nor the students **were** present."*

**3. Prepositions**:
• **At**: Specific clock time (*at 9:00 AM*), small location (*at the bus stop*).
• **On**: Days and dates (*on Monday, on 15th August*), surfaces (*on the desk*).
• **In**: Months, years, seasons (*in 2027, in June*), enclosed spaces (*in the laboratory*).`;
  }

  // 15. DDCET Admission, ACPC & Colleges
  if (/admission|eligibility|acpc|cutoff|college|gtu|counselling|seat/i.test(q)) {
    return `### DDCET 2027 Gujarat Admission & ACPC Guidance

**Eligibility Criteria**:
• Candidate must have passed or appeared in the final semester of an AICTE-approved 3-year Diploma in Engineering & Technology.
• Minimum marks: **45%** aggregate for General Category, **40%** for Reserved Categories (SC / ST / SEBC / EWS).

**Admission Flow (ACPC)**:
1. Appear in the DDCET 2027 entrance exam.
2. Merit list is generated by ACPC based on DDCET score.
3. Choice filling for Government, Grant-in-aid, and Self-Financed Institutes.
4. Admission into 3rd Semester (2nd Year) Degree Engineering under Lateral Entry quota.

**Top Gujarat Engineering Colleges for D2D**:
1. **L.D. College of Engineering (LDCE)**, Ahmedabad
2. **Birla Vishvakarma Mahavidyalaya (BVM)**, Vallabh Vidyanagar
3. **Vishwakarma Government Engineering College (VGEC)**, Chandkheda
4. **Dharmsinh Desai University (DDU)**, Nadiad
5. **The Maharaja Sayajirao University of Baroda (MSU)**, Vadodara
6. **Government Engineering College (GEC)** (Rajkot, Surat, Bhavnagar, Modasa)`;
  }

  // 16. General Intelligent Fallback & Problem Solving
  return `That is a valuable topic for DDCET 2027 preparation!

To tackle questions on "${query}":
1. **Targeted Practice**: Navigate to **Practice Lab** to solve 10-15 multiple choice questions on this specific topic.
2. **Review Formulas**: Check the **Official Syllabus** tab to review the official syllabus blueprint and unit breakdown.
3. **Learn from Mistakes**: If you get any question wrong during practice, it is automatically recorded in your **Mistake Notebook** with the correct answer key.
4. **Timed Papers**: Take an assessment in **Previous Year Papers** to test your speed against the official 54-second per question benchmark.

Feel free to ask me for specific formula derivations, step-by-step math problem solving, or time management tips!`;
}

module.exports = {
  generateDdcetAcademicResponse
};
