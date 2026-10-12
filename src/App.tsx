import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Check,
  X,
  Lightbulb,
  Volume2,
  RotateCcw,
  Home,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Info,
  Users,
  PlusCircle,
  Swords,
  Bot,
  Trash2,
  Download,
  Sparkles,
  Trophy,
  Clock,
  Lock,
  Unlock,
  KeyRound,
  FileSpreadsheet,
  Binary,
  BrainCircuit,
  TableProperties,
  ArrowRightCircle,
  ShieldAlert,
  Flame,
  CheckCircle2,
  XCircle,
  Scale,
  SearchCheck,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

interface StatementItem {
  id: number | string;
  text: string;
  answer: 'TRUE' | 'FALSE';
  level: string;
  explanation: string;
  hint: string;
  mode: 'truefalse';
  ai?: boolean;
}

interface VennQuestion {
  q: string;
  a: 'TRUE' | 'FALSE';
  exp: string;
}

interface VennScenario {
  id: string;
  left: string;
  right: string;
  overlap: string;
  questions: VennQuestion[];
  ai?: boolean;
}

interface PatternItem {
  id: string | number;
  seq: (number | string)[];
  answer: number;
  options: number[];
  rule: string;
  diffBadge?: string;
  type: string;
  level: string;
  ai?: boolean;
  realWorld?: {
    story: string;
    answer: string;
  };
}

interface DecisionOption {
  id: string;
  name: string;
  cost: string;
  costTone?: 'good' | 'medium' | 'bad';
  risk: string;
  riskTone?: 'good' | 'medium' | 'bad';
  gain?: string;
  profit?: string;
  gainTone?: 'good' | 'medium' | 'bad';
  best: boolean;
  rationale?: string;
  overlookedFactor?: string;
}

interface DecisionScenario {
  id: string;
  title: string;
  story: string;
  options: DecisionOption[];
  factors: string[];
  hint: string;
  explanation: string;
  alternativePerspective?: string;
  category: 'Money' | 'School' | 'Farming' | 'Life';
}

interface PlayableQuestion {
  id: string;
  text: string;
  answer: 'TRUE' | 'FALSE';
  explanation: string;
  hint: string;
  mode: 'truefalse' | 'venn' | 'custom' | 'ai';
  level?: string;
  scenario?: {
    id: string;
    left: string;
    right: string;
    overlap: string;
  };
  conceptType?: 'ALL' | 'SOME' | 'NONE' | 'GENERAL';
}

interface WrongAnswerRecord {
  id: string;
  text: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  mode: string;
  conceptType: 'ALL' | 'SOME' | 'NONE' | 'GENERAL';
  timestamp: number;
}

interface LearnerScoreItem {
  date: string;
  mode: 'truefalse' | 'venn' | 'pattern' | 'decision' | 'argument' | 'fallacy' | 'custom' | 'ai';
  score: number;
  total: number;
  pct: number;
}

interface LearnerProfile {
  id: number;
  name: string;
  scores: LearnerScoreItem[];
  avg: number;
  weak: string[];
  lastSeen: string;
}

interface CustomQuestion {
  id: string;
  text: string;
  answer: 'TRUE' | 'FALSE';
  aiFeedback: string;
  createdAt: string;
  category?: string;
}

interface ArgumentItem {
  id?: string | number;
  premise1: string;
  premise2: string;
  q: string;
  opts: string[];
  ans: string;
  exp: string;
  type: string;
  ai?: boolean;
}

interface FallacyItem {
  id?: string | number;
  statement: string;
  q: string;
  opts: string[];
  ans: string;
  exp: string;
  fallacy: string;
  ai?: boolean;
}

interface ChallengeHistoryItem {
  id: string;
  date: string;
  battleType: 'truefalse' | 'pattern' | 'decision' | 'argument' | 'fallacy';
  player1: string;
  player2: string;
  p1Score: number;
  p2Score: number;
  winner: string;
}

const DEFAULT_TEACHER_PIN = '2024';
const LEGACY_TEACHER_PIN = '9411';

// ============================================================================
// SINGLE SOURCE OF TRUTH: STATEMENTS, VENN, PATTERNS & DECISIONS
// ============================================================================

const STATEMENTS: StatementItem[] = [
  { id: 1, text: "Ghana is in Africa", answer: "TRUE", level: "Easy", explanation: "Ghana is a country in Africa.", hint: "Think about map", mode: "truefalse" },
  { id: 2, text: "All students like mathematics", answer: "FALSE", level: "Easy", explanation: "Not all students like maths. Some do, some don't.", hint: "ALL means everyone", mode: "truefalse" },
  { id: 3, text: "Water is important for life", answer: "TRUE", level: "Easy", explanation: "All living things need water.", hint: "Can we live without water?", mode: "truefalse" },
  { id: 4, text: "Boys cannot cook", answer: "FALSE", level: "Easy", explanation: "Boys CAN cook. Some boys cook very well.", hint: "Can you think of a boy who cooks?", mode: "truefalse" },
  { id: 5, text: "2 is an even number", answer: "TRUE", level: "Easy", explanation: "2 can be divided by 2.", hint: "Even means ÷2 no remainder", mode: "truefalse" },
  { id: 6, text: "A square has 3 sides", answer: "FALSE", level: "Easy", explanation: "Square has 4 sides.", hint: "Count square sides", mode: "truefalse" },
  { id: 7, text: "Oti Region is in Ghana", answer: "TRUE", level: "Easy", explanation: "Oti is one of 16 regions in Ghana.", hint: "Where is Dambai?", mode: "truefalse" },
  { id: 8, text: "If it rains, the ground gets wet", answer: "TRUE", level: "Easy", explanation: "Rain makes ground wet.", hint: "What happens after rain?", mode: "truefalse" },
  { id: 9, text: "All farmers grow maize", answer: "FALSE", level: "Medium", explanation: "Some farmers grow cassava, yam, cocoa.", hint: "Do ALL grow only maize?", mode: "truefalse" },
  { id: 10, text: "Girls cannot play football", answer: "FALSE", level: "Medium", explanation: "Girls CAN play football.", hint: "Black Queens?", mode: "truefalse" },
  { id: 11, text: "Some students study hard", answer: "TRUE", level: "Medium", explanation: "Some students do, some don't.", hint: "SOME = at least one", mode: "truefalse" },
  { id: 12, text: "Not all teachers go on holiday", answer: "TRUE", level: "Medium", explanation: "Some teachers go, some stay.", hint: "Not all = some don't", mode: "truefalse" },
  { id: 13, text: "All girls like cooking", answer: "FALSE", level: "Medium", explanation: "Not all girls like cooking.", hint: "ALL = 100%?", mode: "truefalse" },
  { id: 14, text: "Some farmers grow cassava", answer: "TRUE", level: "Hard", explanation: "Many farmers in Ghana grow cassava.", hint: "Think of farming areas", mode: "truefalse" },
  { id: 15, text: "Some teachers are kind", answer: "TRUE", level: "Hard", explanation: "At least one teacher is kind.", hint: "SOME means one or more", mode: "truefalse" },
  { id: 16, text: "If you study, you might pass", answer: "TRUE", level: "Hard", explanation: "Studying increases chance to pass.", hint: "MIGHT = possible", mode: "truefalse" },
  { id: 17, text: "Not all boys like football", answer: "TRUE", level: "Hard", explanation: "Some boys don't like football.", hint: "Not all = some don't", mode: "truefalse" },
];

const VENN_SCENARIOS: VennScenario[] = [
  {
    id: "v1",
    left: "Teachers",
    right: "People who go on Holidays",
    overlap: "SOME Teachers go on Holidays",
    questions: [
      { q: "All teachers go on holidays", a: "FALSE", exp: "Only SOME go, shown in overlap" },
      { q: "Some teachers go on holidays", a: "TRUE", exp: "Overlap shows SOME do" },
      { q: "No teachers go on holidays", a: "FALSE", exp: "Overlap shows some DO go" }
    ]
  },
  {
    id: "v2",
    left: "Students",
    right: "People who study hard",
    overlap: "SOME Students study hard",
    questions: [
      { q: "All students study hard", a: "FALSE", exp: "Only some, in overlap" },
      { q: "Some students study hard", a: "TRUE", exp: "Overlap = some students" },
      { q: "No students study hard", a: "FALSE", exp: "False, overlap exists" }
    ]
  },
  {
    id: "v3",
    left: "Farmers",
    right: "People who grow crops",
    overlap: "ALL Farmers grow crops",
    questions: [
      { q: "All farmers grow crops", a: "TRUE", exp: "All farmers are inside crop growers" },
      { q: "Some farmers grow crops", a: "TRUE", exp: "If ALL, then SOME is also true" },
      { q: "No farmers grow crops", a: "FALSE", exp: "Farmers DO grow crops" }
    ]
  },
  {
    id: "v4",
    left: "Girls",
    right: "People who can play football",
    overlap: "SOME Girls can play football",
    questions: [
      { q: "All girls can play football", a: "TRUE", exp: "In our class, we say all girls CAN" },
      { q: "Girls cannot play football", a: "FALSE", exp: "Girls CAN play" },
      { q: "Some girls can play football", a: "TRUE", exp: "Some = at least one" }
    ]
  },
  {
    id: "v5",
    left: "Boys",
    right: "People who can cook",
    overlap: "SOME Boys can cook",
    questions: [
      { q: "All boys can cook", a: "TRUE", exp: "All boys CAN learn to cook" },
      { q: "Boys cannot cook", a: "FALSE", exp: "Boys CAN cook" },
      { q: "Some boys can cook", a: "TRUE", exp: "At least some can" }
    ]
  }
];

// 10 Pattern Master Items with realWorld stories
const PATTERNS: PatternItem[] = [
  {
    id: "p1",
    seq: [2, 4, 6, 8, '?'],
    answer: 10,
    options: [9, 10, 11, 12],
    rule: "Rule: Add 2 each time. 8 + 2 = 10",
    diffBadge: "+2",
    type: "Arithmetic Sequence",
    level: "Easy",
    realWorld: {
      story: "Kofi harvests 2 yams Monday, 4 Tuesday, 6 Wednesday, 8 Thursday.",
      answer: "He will harvest 10 yams on Friday."
    }
  },
  {
    id: "p2",
    seq: [5, 10, 15, 20, '?'],
    answer: 25,
    options: [22, 24, 25, 30],
    rule: "Rule: Add 5 each time. 20 + 5 = 25",
    diffBadge: "+5",
    type: "Arithmetic Sequence",
    level: "Easy",
    realWorld: {
      story: "Ama saves 5 GH₵ weekly towards her school sandals.",
      answer: "In week 5, she saves 25 GH₵."
    }
  },
  {
    id: "p3",
    seq: [1, 2, 4, 8, '?'],
    answer: 16,
    options: [10, 12, 14, 16],
    rule: "Rule: Multiply by 2 (Double) each step. 8 × 2 = 16",
    diffBadge: "×2",
    type: "Geometric Sequence",
    level: "Medium",
    realWorld: {
      story: "Yeast cells in biology class double every hour: 1, 2, 4, 8 cells.",
      answer: "After the next hour, there will be 16 cells."
    }
  },
  {
    id: "p4",
    seq: [20, 17, 14, 11, '?'],
    answer: 8,
    options: [7, 8, 9, 10],
    rule: "Rule: Subtract 3 each time. 11 - 3 = 8",
    diffBadge: "-3",
    type: "Decreasing Sequence",
    level: "Easy",
    realWorld: {
      story: "A vendor begins with 20 oranges and sells 3 every morning.",
      answer: "After 11, she will have 8 oranges remaining."
    }
  },
  {
    id: "p5",
    seq: [3, 6, 12, 24, '?'],
    answer: 48,
    options: [36, 44, 48, 52],
    rule: "Rule: Multiply by 2 each time. 24 × 2 = 48",
    diffBadge: "×2",
    type: "Geometric Sequence",
    level: "Medium",
    realWorld: {
      story: "Crop yields using organic fertilizer double each harvest: 3, 6, 12, 24 bags.",
      answer: "The next bumper harvest yields 48 bags."
    }
  },
  {
    id: "p6",
    seq: [1, 4, 9, 16, '?'],
    answer: 25,
    options: [20, 24, 25, 36],
    rule: "Rule: Consecutive square numbers: 1², 2², 3², 4², 5² = 25",
    diffBadge: "+3,+5,+7,+9",
    type: "Square Numbers",
    level: "Hard",
    realWorld: {
      story: "Floor tiles arranged in squares: 1x1, 2x2, 3x3, 4x4.",
      answer: "A 5x5 tile square requires 25 tiles."
    }
  },
  {
    id: "p7",
    seq: [100, 90, 80, 70, '?'],
    answer: 60,
    options: [50, 55, 60, 65],
    rule: "Rule: Subtract 10 each time. 70 - 10 = 60",
    diffBadge: "-10",
    type: "Decreasing Sequence",
    level: "Easy",
    realWorld: {
      story: "Phone battery drains 10% each hour of video playback.",
      answer: "Dropping from 70%, it reaches 60%."
    }
  },
  {
    id: "p8",
    seq: [2, 5, 10, 17, '?'],
    answer: 26,
    options: [24, 25, 26, 28],
    rule: "Rule: Add consecutive odd numbers (+3, +5, +7, +9). 17 + 9 = 26",
    diffBadge: "+3,+5,+7,+9",
    type: "Growing Difference",
    level: "Hard",
    realWorld: {
      story: "New members joining the school science club increase by consecutive odd numbers.",
      answer: "The club grows to 26 members next term."
    }
  },
  {
    id: "p9",
    seq: [7, 14, 21, 28, '?'],
    answer: 35,
    options: [32, 34, 35, 42],
    rule: "Rule: Multiples of 7 (Add 7). 28 + 7 = 35",
    diffBadge: "+7",
    type: "Multiples Sequence",
    level: "Medium",
    realWorld: {
      story: "Days in consecutive weeks: 1 wk=7, 2 wks=14, 3 wks=21, 4 wks=28.",
      answer: "5 weeks equal exactly 35 days."
    }
  },
  {
    id: "p10",
    seq: [1, 1, 2, 3, 5, 8, '?'],
    answer: 13,
    options: [11, 12, 13, 15],
    rule: "Rule: Fibonacci sequence: sum of previous two numbers. 5 + 8 = 13",
    diffBadge: "a+b",
    type: "Fibonacci Sequence",
    level: "Hard",
    realWorld: {
      story: "Sunflower seed spiral counts follow Fibonacci numbers in nature.",
      answer: "The next outer spiral contains 13 seeds."
    }
  }
];

// 12 Decision Maker Scenarios (Money, School, Farming, Life)
const DECISIONS: DecisionScenario[] = [
  {
    id: "d1",
    category: "Life",
    title: "Scenario 1: Travel & Safety - Regional Exam Journey",
    story: "You have a major National Exam at 9:00 AM tomorrow in Kumasi. You are traveling this afternoon with a total budget of 150 GH₵. Which transport option is the most logical choice?",
    factors: ["Punctuality", "Safety", "Affordability", "Emergency Buffer"],
    options: [
      {
        id: "stc",
        name: "VIP / STC Bus",
        cost: "90 GH₵",
        costTone: "medium",
        risk: "Low Risk (Reliable Schedule)",
        riskTone: "good",
        profit: "Arrives early before nightfall",
        gain: "Arrives early before nightfall",
        gainTone: "good",
        best: true,
        rationale: "Guarantees safe on-time arrival before dark and leaves 60 GH₵ for meals and emergencies."
      },
      {
        id: "trotro",
        name: "Local Tro-tro",
        cost: "45 GH₵",
        costTone: "good",
        risk: "High Risk (Frequent stops & breakdowns)",
        riskTone: "bad",
        profit: "Leaves 105 GH₵ savings",
        gain: "Leaves 105 GH₵ savings",
        gainTone: "good",
        best: false,
        rationale: "Cheapest, but unpredictable transit time could cause you to miss exam registration.",
        overlookedFactor: "Safety & Reliability"
      },
      {
        id: "taxi",
        name: "Express Shared Taxi",
        cost: "140 GH₵",
        costTone: "bad",
        risk: "Financial Risk (Exhausts all cash)",
        riskTone: "bad",
        profit: "Fast direct route (3.5 hrs)",
        gain: "Fast direct route (3.5 hrs)",
        gainTone: "medium",
        best: false,
        rationale: "Leaves only 10 GH₵ emergency cash, leaving you stranded if unexpected lodging is required.",
        overlookedFactor: "Emergency Budget Buffer"
      }
    ],
    hint: "Balance arriving strictly on time with keeping an emergency financial buffer.",
    explanation: "VIP / STC Bus strikes the optimal balance: reliable arrival before dark with 60 GH₵ cash reserve remaining.",
    alternativePerspective: "Some students choose the tro-tro to maximize savings, but for a high-stakes exam, punctuality and safety outweigh minor savings."
  },
  {
    id: "d2",
    category: "Money",
    title: "Scenario 2: Money Management - Allocating 1,000 GH₵ Vacation Earnings",
    story: "You worked hard and earned 1,000 GH₵ during vacation. Senior High School reopens in two months. How should you allocate this capital logically?",
    factors: ["Capital Preservation", "Cash Flow", "Loss Risk", "Future Growth"],
    options: [
      {
        id: "stall",
        name: "Provisions Stall (700 GH₵) + Bank Reserve (300 GH₵)",
        cost: "700 GH₵",
        costTone: "medium",
        risk: "Low Risk (Physical stock)",
        riskTone: "good",
        profit: "Generates ~150 GH₵ monthly profit",
        gain: "Generates ~150 GH₵ monthly profit",
        gainTone: "good",
        best: true,
        rationale: "Produces ongoing cash flow for textbooks while protecting 300 GH₵ principal in bank savings."
      },
      {
        id: "phone",
        name: "Buy Brand New Smartphone",
        cost: "950 GH₵",
        costTone: "bad",
        risk: "Depreciation & Theft Risk",
        riskTone: "bad",
        profit: "Social entertainment",
        gain: "Social entertainment",
        gainTone: "medium",
        best: false,
        rationale: "A luxury consumer device that produces zero cash return and leaves no money for school books.",
        overlookedFactor: "Capital Preservation"
      },
      {
        id: "ponzi",
        name: "High-Yield Online Investment Scheme",
        cost: "1,000 GH₵",
        costTone: "bad",
        risk: "Extreme Risk (Likely 100% loss)",
        riskTone: "bad",
        profit: "Promised 50% weekly return",
        gain: "Promised 50% weekly return",
        gainTone: "medium",
        best: false,
        rationale: "Unregulated schemes carry near-certain probability of total capital loss right before school fees are due.",
        overlookedFactor: "High Investment Risk"
      }
    ],
    hint: "Distinguish between productive assets that earn income versus depreciating liabilities.",
    explanation: "Investing 700 GH₵ in an inventory business while retaining 300 GH₵ cash protects capital while generating recurring profits.",
    alternativePerspective: "A smartphone offers convenience, but financial reasoning prioritizes capital preservation and emergency funds before school reopens."
  },
  {
    id: "d3",
    category: "School",
    title: "Scenario 3: School Schedule - 3 Hours Free with Mocks Approaching",
    story: "You have 3 uninterrupted hours on Saturday. WASSCE Mock Exams begin in 14 days and you are struggling in Elective Maths. How do you logically schedule this block?",
    factors: ["Academic Impact", "Retention", "Mental Fatigue", "Burnout Prevention"],
    options: [
      {
        id: "balanced",
        name: "2 Hours Maths Revision + 1 Hour Rest/Football",
        cost: "Focused Effort",
        costTone: "good",
        risk: "Low Risk (Sustainable pace)",
        riskTone: "good",
        profit: "High retention + Physical recharge",
        gain: "High retention + Physical recharge",
        gainTone: "good",
        best: true,
        rationale: "Pairing deep study with physical recreation maximizes cognitive consolidation and prevents burnout."
      },
      {
        id: "cram",
        name: "3 Hours Non-stop Cramming",
        cost: "High Mental Strain",
        costTone: "bad",
        risk: "Fatigue & Diminishing Returns",
        riskTone: "medium",
        profit: "Covers more syllabus pages",
        gain: "Covers more syllabus pages",
        gainTone: "medium",
        best: false,
        rationale: "Without breaks, cognitive retention drops sharply after 90 minutes due to neural fatigue.",
        overlookedFactor: "Mental Health & Rest"
      },
      {
        id: "gaming",
        name: "3 Hours Social Media & Gaming",
        cost: "Irretrievable Time",
        costTone: "bad",
        risk: "Exam Failure in Weak Subjects",
        riskTone: "bad",
        profit: "Immediate short-term pleasure",
        gain: "Immediate short-term pleasure",
        gainTone: "medium",
        best: false,
        rationale: "With only 14 days until mocks, spending 100% of prime study time on gaming guarantees exam anxiety.",
        overlookedFactor: "Academic Preparation"
      }
    ],
    hint: "Optimal study schedules alternate high-intensity focus with mental restoration.",
    explanation: "The 2+1 study-break ratio stimulates dopamine and long-term memory encoding while preventing cognitive burnout.",
    alternativePerspective: "Some students advocate 3 hours of continuous cramming, but neuroscience proves retention plummets without rest intervals."
  },
  {
    id: "d4",
    category: "Farming",
    title: "Scenario 4: Farming Resilience - Choosing Seeds for Erratic Rains",
    story: "Your family cultivates 2 acres in Oti Region. Weather forecasts predict unpredictable and delayed rains this season. What planting strategy minimizes catastrophe?",
    factors: ["Drought Tolerance", "Harvest Security", "Seed Cost", "Household Food"],
    options: [
      {
        id: "intercrop",
        name: "Drought-Tolerant Hybrid Maize & Cassava Intercrop",
        cost: "80 GH₵ seed budget",
        costTone: "good",
        risk: "Low Risk (Crop diversification)",
        riskTone: "good",
        profit: "Guaranteed food harvest even during dry spells",
        gain: "Guaranteed food harvest even during dry spells",
        gainTone: "good",
        best: true,
        rationale: "Cassava roots survive unpredictable dry spells while hybrid maize matures before rains stop."
      },
      {
        id: "tomatoes",
        name: "100% Exotic High-Yield Tomatoes",
        cost: "350 GH₵ inputs",
        costTone: "bad",
        risk: "Extreme Risk (Blight & flower drop without irrigation)",
        riskTone: "bad",
        profit: "High price if weather is perfect",
        gain: "High price if weather is perfect",
        gainTone: "medium",
        best: false,
        rationale: "Delicate vegetables without drip irrigation easily succumb to drought, causing total investment loss.",
        overlookedFactor: "Weather & Climate Risk"
      },
      {
        id: "fallow",
        name: "Delay planting for 3 months and leave fields uncultivated",
        cost: "Zero cash",
        costTone: "good",
        risk: "High Risk (Household hunger & no harvest)",
        riskTone: "bad",
        profit: "Zero return",
        gain: "Zero return",
        gainTone: "bad",
        best: false,
        rationale: "Inactivity guarantees food shortages and relies entirely on external aid.",
        overlookedFactor: "Food Security"
      }
    ],
    hint: "Diversification and hardy staple crops buffer against climate volatility.",
    explanation: "Intercropping drought-tolerant maize and deep-root cassava creates an insurance policy against delayed rainfall.",
    alternativePerspective: "Tomatoes yield quick cash in good years, but logical reasoning protects against catastrophic total failure."
  },
  {
    id: "d5",
    category: "Money",
    title: "Scenario 5: Money Security - Storing 500 GH₵ School Fee Savings",
    story: "You have accumulated 500 GH₵ for next term's boarding school fees. You live in a shared hostel room with 6 roommates. Where should you keep this money for the remaining 4 weeks?",
    factors: ["Safety & Theft Prevention", "Accessibility", "Transaction Fees", "Peace of Mind"],
    options: [
      {
        id: "momo",
        name: "Registered Mobile Money Account with Secret PIN",
        cost: "1% withdrawal fee (~5 GH₵)",
        costTone: "good",
        risk: "Low Risk (2-factor PIN security)",
        riskTone: "good",
        profit: "100% theft protection + small interest",
        gain: "100% theft protection + small interest",
        gainTone: "good",
        best: true,
        rationale: "Even if your phone is misplaced, your money remains safe in the network vault behind your secret PIN."
      },
      {
        id: "mattress",
        name: "Cash hidden inside mattress seam",
        cost: "Zero fees",
        costTone: "good",
        risk: "High Risk (Hostel theft or accidental loss)",
        riskTone: "bad",
        profit: "Instant physical cash",
        gain: "Instant physical cash",
        gainTone: "medium",
        best: false,
        rationale: "Hostel rooms have frequent visitor traffic; physical cash is vulnerable to irreversible theft.",
        overlookedFactor: "Physical Safety & Theft"
      },
      {
        id: "lend",
        name: "Lend to acquaintance promising 200 GH₵ profit in 2 weeks",
        cost: "Entire 500 GH₵ principal",
        costTone: "bad",
        risk: "Extreme Risk (Unenforceable informal loan)",
        riskTone: "bad",
        profit: "Speculative return",
        gain: "Speculative return",
        gainTone: "medium",
        best: false,
        rationale: "Lending school fee capital to acquaintances risks arriving at school without enrollment funds.",
        overlookedFactor: "Counterparty Debt Risk"
      }
    ],
    hint: "Protect essential non-negotiable funds (like school fees) against physical theft and fraud.",
    explanation: "Mobile Money digital security guarantees school fee funds will be available when school gates open.",
    alternativePerspective: "Mattress cash has zero transaction charges, but 5 GH₵ in fees is an inexpensive price for 100% theft immunity."
  },
  {
    id: "d6",
    category: "Farming",
    title: "Scenario 6: Farming Input - Budgeting 300 GH₵ for Yam Farm",
    story: "You have 300 GH₵ for your 1-acre yam farm. Soil fertility is dropping and weeds are encroaching. How should you disburse the 300 GH₵ logically?",
    factors: ["Soil Nutrients", "Weed Suppression", "Tuber Size", "Cost Efficiency"],
    options: [
      {
        id: "compost",
        name: "Organic Compost Preparation (120 GH₵) + Targeted NPK (150 GH₵) + 30 GH₵ Reserve",
        cost: "270 GH₵ total",
        costTone: "medium",
        risk: "Low Risk (Balanced feeding)",
        riskTone: "good",
        profit: "Substantial tuber weight and long-term soil health",
        gain: "Substantial tuber weight and long-term soil health",
        gainTone: "good",
        best: true,
        rationale: "Combines immediate mineral plant nutrients with organic soil matter to retain moisture and foster tuber girth."
      },
      {
        id: "spray",
        name: "Spend full 300 GH₵ on single expensive imported chemical foliar spray",
        cost: "300 GH₵ total",
        costTone: "bad",
        risk: "High Risk (Leaves soil starved of organic structure)",
        riskTone: "bad",
        profit: "Fast leaf greening",
        gain: "Fast leaf greening",
        gainTone: "medium",
        best: false,
        rationale: "Chemical leaf sprays do not replenish root-zone soil nutrients needed for subterranean yam tubers.",
        overlookedFactor: "Soil Health & Root Balance"
      },
      {
        id: "weedonly",
        name: "Spend full 300 GH₵ on hired laborers for surface clearing only",
        cost: "300 GH₵ total",
        costTone: "bad",
        risk: "High Risk (Yam tubers remain undersized from malnutrition)",
        riskTone: "bad",
        profit: "Spotless clean farm surface",
        gain: "Spotless clean farm surface",
        gainTone: "medium",
        best: false,
        rationale: "A clean farm with nutrient-depleted soil produces thin, unmarketable tubers.",
        overlookedFactor: "Nutrient Starvation"
      }
    ],
    hint: "Yams feed underground; balance immediate soil minerals with organic moisture retention.",
    explanation: "Compost plus targeted NPK feeds both the soil microbiology and the growing yam tuber.",
    alternativePerspective: "Laborers make the farm look clean, but soil nutrients directly determine final harvest revenue."
  },
  {
    id: "d7",
    category: "School",
    title: "Scenario 7: School Electives - Science vs Business Decision",
    story: "Kwame loves agricultural problem-solving and environmental biology, but his uncle urges him to pursue Business Banking. Both are respectable careers in Ghana. How should Kwame evaluate this crossroads logically?",
    factors: ["Intrinsic Aptitude", "Personal Motivation", "Long-term Fulfillment", "Career Outlook"],
    options: [
      {
        id: "values_career",
        name: "Depends on Your Values & Intrinsic Strengths",
        cost: "Honest Reflection & Respectful Dialogue",
        costTone: "good",
        risk: "Requires polite courage with family",
        riskTone: "good",
        profit: "Excels where natural curiosity and aptitude align",
        gain: "Excels where natural curiosity and aptitude align",
        gainTone: "good",
        best: true,
        rationale: "When two reputable career paths exist, optimal logical choice depends on personal values, aptitude, and genuine interest rather than external pressure."
      },
      {
        id: "obey",
        name: "Blindly obey uncle to avoid an awkward conversation",
        cost: "3 years studying disfavored course",
        costTone: "bad",
        risk: "High Risk (Poor grades and loss of career motivation)",
        riskTone: "bad",
        profit: "Temporary family approval",
        gain: "Temporary family approval",
        gainTone: "medium",
        best: false,
        rationale: "Studying subjects you dislike often leads to burnout, low WASSCE grades, and wasted potential.",
        overlookedFactor: "Personal Aptitude & Motivation"
      },
      {
        id: "coin",
        name: "Toss a coin 5 minutes before form submission",
        cost: "Zero thought",
        costTone: "good",
        risk: "High Risk (Leaves life-defining decision to pure chance)",
        riskTone: "bad",
        profit: "Random assignment",
        gain: "Random assignment",
        gainTone: "bad",
        best: false,
        rationale: "Decisions with multi-year life consequences should never be abdicated to random coin flips.",
        overlookedFactor: "Intentional Life Planning"
      }
    ],
    hint: "Some choices have multiple legitimate answers depending on a person's inner values and strengths.",
    explanation: "This is a value-based decision: excelling in Sciences or Business depends on individual passion and capability.",
    alternativePerspective: "Respecting elders is vital in Ghanaian culture, but polite dialogue explaining your strengths yields best long-term outcomes."
  },
  {
    id: "d8",
    category: "Life",
    title: "Scenario 8: Life & Health - High Fever 48 Hours Before WASSCE",
    story: "You wake up with a 39°C fever, headache, and severe body shivering 2 days before your first WASSCE paper. You have 2 unreviewed chapters left. What is the most logical priority?",
    factors: ["Medical Safety", "Cognitive Function on Exam Day", "Malaria Complications", "Timely Treatment"],
    options: [
      {
        id: "clinic",
        name: "Report immediately to School Clinic for Malaria Test & Prescription",
        cost: "2 hours clinic visit",
        costTone: "good",
        risk: "Low Risk (Professional medical care)",
        riskTone: "good",
        profit: "Fast full recovery before exam morning",
        gain: "Fast full recovery before exam morning",
        gainTone: "good",
        best: true,
        rationale: "Treating malaria early restores full brain clarity before the morning of the exam."
      },
      {
        id: "selfmed",
        name: "Drink 2 energy drinks, take unknown leftover pills, and study through night",
        cost: "Zero clinic fee",
        costTone: "medium",
        risk: "Critical Risk (Severe medical breakdown or hospital admission on exam day)",
        riskTone: "bad",
        profit: "Finishes revision notes",
        gain: "Finishes revision notes",
        gainTone: "medium",
        best: false,
        rationale: "Caffeine and unprescribed drugs do not kill malaria parasites and accelerate body collapse.",
        overlookedFactor: "Medical Safety & Health"
      },
      {
        id: "ignorefever",
        name: "Lock yourself in dormitory and hope fever clears on its own",
        cost: "Zero effort",
        costTone: "good",
        risk: "High Risk (Cerebral malaria complications)",
        riskTone: "bad",
        profit: "Avoids clinic line",
        gain: "Avoids clinic line",
        gainTone: "bad",
        best: false,
        rationale: "Untreated tropical malaria quickly escalates into delirium, preventing exam attendance.",
        overlookedFactor: "Proactive Healthcare"
      }
    ],
    hint: "You cannot write an exam if you are unconscious in hospital; health is the prerequisite for performance.",
    explanation: "Immediate clinic diagnosis and proper antimalarials resolve the infection before exam day.",
    alternativePerspective: "Studying while sick feels dedicated, but a delirious brain cannot retrieve memorized facts."
  },
  {
    id: "d9",
    category: "Farming",
    title: "Scenario 9: Farming Storage - Post-Harvest Maize Marketing",
    story: "You harvested 40 bags of maize in August. Current market price is 120 GH₵ per bag. Historical trends show price rises to 220 GH₵ per bag in December during Christmas. Weevils and moisture are known hazards.",
    factors: ["Price Appreciation", "Pest Control", "Cash Urgency", "Storage Facility"],
    options: [
      {
        id: "hermetic",
        name: "Store in Hermetic Storage Bags (PICS) in dry, elevated crib and sell in December",
        cost: "20 GH₵ per bag storage cost",
        costTone: "medium",
        risk: "Low Risk (Hermetic bags suffocate insects without chemicals)",
        riskTone: "good",
        profit: "Net profit gain of ~80 GH₵ extra per bag (3,200 GH₵ total)",
        gain: "Net profit gain of ~80 GH₵ extra per bag (3,200 GH₵ total)",
        gainTone: "good",
        best: true,
        rationale: "PICS bags eliminate weevils naturally and lock in a 70%+ price premium over 4 months."
      },
      {
        id: "panic_sell",
        name: "Sell all 40 bags immediately at 120 GH₵ out of fear",
        cost: "Zero storage fee",
        costTone: "good",
        risk: "Lost Opportunity (Foregoes 3,200 GH₵ net profit upside)",
        riskTone: "medium",
        profit: "Immediate cash in August",
        gain: "Immediate cash in August",
        gainTone: "medium",
        best: false,
        rationale: "Selling at harvest glut prices deprives farmers of their rightful value-add margins.",
        overlookedFactor: "Profit Opportunity Cost"
      },
      {
        id: "damp_floor",
        name: "Store in regular polypropylene open sacks on moist dirt floor without treatment",
        cost: "Cheap bags",
        costTone: "good",
        risk: "Extreme Risk (Complete weevil infestation and grain mold)",
        riskTone: "bad",
        profit: "Speculative price rise",
        gain: "Speculative price rise",
        gainTone: "bad",
        best: false,
        rationale: "Without hermetic sealing or dry cribs, weevils turn grain into powder within 60 days.",
        overlookedFactor: "Post-Harvest Protection"
      }
    ],
    hint: "Safe grain preservation technologies unlock the massive price difference between harvest and lean seasons.",
    explanation: "Hermetic storage bags protect the grain from pests, allowing farmers to capture the high December market price.",
    alternativePerspective: "Immediate selling solves urgent cash needs, but storing properly yields more than double the net profit."
  },
  {
    id: "d10",
    category: "School",
    title: "Scenario 10: School Leadership - Senior Prefect vs Exam Focus",
    story: "You have strong academic grades in Elective Sciences and the school board nominates you as Senior Prefect candidate. The role demands 10 hours weekly of meetings and student discipline duties. How do you evaluate whether to accept?",
    factors: ["Leadership Skills", "WASSCE Revision Hours", "Future Scholarship CV", "Stress Threshold"],
    options: [
      {
        id: "values_leadership",
        name: "Depends on Your Values: Balance Leadership Growth vs Grade Priorities",
        cost: "Time Commitment & Strict Scheduling",
        costTone: "medium",
        risk: "Demands rigorous daily discipline",
        riskTone: "good",
        profit: "Develops public leadership & stellar scholarship recommendation",
        gain: "Develops public leadership & stellar scholarship recommendation",
        gainTone: "good",
        best: true,
        rationale: "Both choices are logically sound depending on goals: leadership develops executive resilience for university, while declining protects maximum focus on straight A1s."
      },
      {
        id: "unplanned_yes",
        name: "Accept immediately without creating a time-management revision timetable",
        cost: "Severe study neglect",
        costTone: "bad",
        risk: "High Risk (Grades drop from A to D)",
        riskTone: "bad",
        profit: "Prestige & badge",
        gain: "Prestige & badge",
        gainTone: "medium",
        best: false,
        rationale: "Taking leadership responsibilities without strict study time management harms your academic foundation.",
        overlookedFactor: "Time Management Planning"
      },
      {
        id: "rebel",
        name: "Resign from all school clubs and refuse to speak to teachers",
        cost: "Social friction",
        costTone: "bad",
        risk: "High Risk (Damages school conduct testimonial)",
        riskTone: "bad",
        profit: "Isolation",
        gain: "Isolation",
        gainTone: "bad",
        best: false,
        rationale: "Aggressively declining opportunities damages relationships with mentor teachers and administration.",
        overlookedFactor: "Balanced Communication"
      }
    ],
    hint: "Recognize that leadership vs pure academic focus depends on personal values and long-term career aspirations.",
    explanation: "This is another value-driven decision: neither choice is objectively wrong as long as you plan intentionally.",
    alternativePerspective: "Some argue grades are all that matters, while global universities value demonstrated leadership highly."
  },
  {
    id: "d11",
    category: "Money",
    title: "Scenario 11: Money & Tech - Buying Laptop for SHS Practicals",
    story: "You need a computer for SHS ICT programming practicals and typing your project. You have 1,400 GH₵ saved from your summer work. What is the most financially rational path?",
    factors: ["Hardware Durability", "Debt Avoidance", "School Utility", "Emergency Savings"],
    options: [
      {
        id: "refurb",
        name: "Certified Refurbished Core i5 Business Laptop (1,150 GH₵) + 250 GH₵ Savings Buffer",
        cost: "1,150 GH₵ cash",
        costTone: "medium",
        risk: "Low Risk (Fully paid with warranty)",
        riskTone: "good",
        profit: "Rugged enterprise durability with leftover emergency cash",
        gain: "Rugged enterprise durability with leftover emergency cash",
        gainTone: "good",
        best: true,
        rationale: "Enterprise business laptops have high durability, solve all academic needs, and leave 250 GH₵ emergency cash."
      },
      {
        id: "cafe_drain",
        name: "Rent a laptop at internet café for 25 GH₵ every afternoon",
        cost: "Over 1,800 GH₵ per academic term",
        costTone: "bad",
        risk: "High Financial Drain (Exceeds laptop purchase cost without asset ownership)",
        riskTone: "bad",
        profit: "Zero ownership",
        gain: "Zero ownership",
        gainTone: "bad",
        best: false,
        rationale: "Repeated daily rental fees quickly exceed the total purchase cost of a laptop with zero asset value remaining.",
        overlookedFactor: "Cumulative Rental Waste"
      },
      {
        id: "loan_rig",
        name: "Purchase a 3,500 GH₵ high-end gaming laptop on an informal 40% interest loan",
        cost: "Crushing loan payments",
        costTone: "bad",
        risk: "Extreme Risk (Harassment from lenders and asset seizure)",
        riskTone: "bad",
        profit: "High status graphics",
        gain: "High status graphics",
        gainTone: "medium",
        best: false,
        rationale: "Taking high-interest loans for luxury hardware causes chronic stress and financial crisis for a student.",
        overlookedFactor: "Predatory Debt Trap"
      }
    ],
    hint: "Buy what fulfills your actual educational needs while keeping a cash reserve.",
    explanation: "A certified refurbished business laptop fulfills all SHS tasks without taking on debt and preserves 250 GH₵ cash.",
    alternativePerspective: "Gaming laptops look sleek, but high-interest debt turns a learning tool into a financial trap."
  },
  {
    id: "d12",
    category: "Life",
    title: "Scenario 12: Life & Integrity - Witnessing Exam Malpractice in Hall",
    story: "During an official ranking exam, you observe a candidate beside you pulling out unauthorized handwritten cheat sheets from their socks. The invigilator is at the back. What is the most principled and safe response?",
    factors: ["Academic Integrity", "Personal Safety", "Fair Competition", "Confidential Reporting"],
    options: [
      {
        id: "report_discreet",
        name: "Alert the Chief Invigilator or Guidance Counselor privately after the paper",
        cost: "Discreet report",
        costTone: "good",
        risk: "Low Risk (Maintains anonymity and safety)",
        riskTone: "good",
        profit: "Protects school exam accreditation and ensures fair competition",
        gain: "Protects school exam accreditation and ensures fair competition",
        gainTone: "good",
        best: true,
        rationale: "Confidential reporting maintains personal safety from hall fights while protecting academic integrity."
      },
      {
        id: "copy_cheat",
        name: "Quietly copy the answers from the cheater's desk onto your own script",
        cost: "Moral compromise",
        costTone: "bad",
        risk: "Catastrophic Risk (Immediate disqualification and cancellation of entire paper)",
        riskTone: "bad",
        profit: "Short-term test marks",
        gain: "Short-term test marks",
        gainTone: "medium",
        best: false,
        rationale: "Collusion and copying copied notes lead to WASSCE results cancellation by WAEC.",
        overlookedFactor: "Integrity & Disqualification Risk"
      },
      {
        id: "blackmail",
        name: "Demand 50 GH₵ from the student right after the exam or threaten to expose them",
        cost: "Criminal extortion",
        costTone: "bad",
        risk: "Severe Risk (Extortion charge and school expulsion)",
        riskTone: "bad",
        profit: "Corrupt money",
        gain: "Corrupt money",
        gainTone: "bad",
        best: false,
        rationale: "Extortion is illegal and escalates test misconduct into a criminal disciplinary offense.",
        overlookedFactor: "Legal & Ethical Integrity"
      }
    ],
    hint: "Uphold integrity through safe, official channels rather than joining or exploiting wrongdoing.",
    explanation: "Private, official reporting protects your personal security while defending fair academic competition.",
    alternativePerspective: "Staying silent avoids conflict, but widespread cheating devalues everyone's hard-earned credentials."
  }
];

// ============================================================================
// WEEK 3: LESSON 5 - ARGUMENT BUILDER DATA
// ============================================================================
const ARGUMENTS: ArgumentItem[] = [
  {
    premise1: "If it rains, ground gets wet",
    premise2: "It rained",
    q: "Conclusion?",
    opts: ["Ground is wet", "Dry", "No conclusion", "Rain again"],
    ans: "Ground is wet",
    exp: "If P then Q, P true => Q true (Modus Ponens)",
    type: "If-Then"
  },
  {
    premise1: "All farmers grow crops",
    premise2: "Ama is farmer",
    q: "What follows?",
    opts: ["Ama grows crops", "Doesn't", "Some do", "No conclusion"],
    ans: "Ama grows crops",
    exp: "All A are B, X is A => X is B (Universal Syllogism)",
    type: "Syllogism"
  },
  {
    premise1: "Some students like maths",
    premise2: "Kwame is student",
    q: "Does Kwame like maths?",
    opts: ["Cannot be sure", "Yes", "No", "All like maths"],
    ans: "Cannot be sure",
    exp: "SOME ≠ ALL. Can't be sure about Kwame",
    type: "Syllogism"
  },
  {
    premise1: "If you save 10 cedis weekly",
    premise2: "4 weeks passed",
    q: "How much?",
    opts: ["40", "10", "4", "0"],
    ans: "40",
    exp: "10x4=40 logical calculation",
    type: "Calculation"
  },
  {
    premise1: "All traders sell goods",
    premise2: "No farmer is trader",
    q: "Farmers selling?",
    opts: ["No conclusion", "Don't sell", "Sell", "All traders farmers"],
    ans: "No conclusion",
    exp: "Premises don't connect to guarantee whether farmers sell goods or not",
    type: "Syllogism"
  },
  {
    premise1: "If price rises, profit rises",
    premise2: "Maize price rose",
    q: "What follows?",
    opts: ["Farmers profit rises", "Falls", "No effect", "Price falls"],
    ans: "Farmers profit rises",
    exp: "If P then Q, P true => Q true",
    type: "If-Then"
  }
];

// ============================================================================
// WEEK 3: LESSON 6 - SPOT THE FALLACY DATA
// ============================================================================
const FALLACIES: FallacyItem[] = [
  {
    statement: "All boys like football. Kofi is boy. So Kofi likes football.",
    q: "Always logical?",
    opts: ["Not always - fallacy", "Always logical", "No conclusion", "True"],
    ans: "Not always - fallacy",
    exp: "All ≠ every individual. Kofi may not like. Hasty Generalization",
    fallacy: "Hasty Generalization"
  },
  {
    statement: "My phone spoiled from that shop. All phones from shop are bad.",
    q: "Fallacy?",
    opts: ["Hasty Generalization", "Logical", "True", "No fallacy"],
    ans: "Hasty Generalization",
    exp: "One example not enough for ALL. Hasty Generalization",
    fallacy: "Hasty Generalization"
  },
  {
    statement: "If you don't study you fail. You failed, so you didn't study.",
    q: "Valid?",
    opts: ["Not valid - other reasons", "Valid", "True", "No conclusion"],
    ans: "Not valid - other reasons",
    exp: "Fail could be sickness, not just no study. Affirming Consequent",
    fallacy: "False Cause"
  },
  {
    statement: "Ama is girl. Girls cannot do science. So Ama cannot.",
    q: "Logical?",
    opts: ["Illogical - false premise", "Logical", "True", "Valid"],
    ans: "Illogical - false premise",
    exp: "Premise 'Girls cannot do science' is FALSE stereotype",
    fallacy: "Stereotype"
  },
  {
    statement: "It rained and I failed. Rain made me fail.",
    q: "Logical?",
    opts: ["Not logical - no causation", "Logical", "True cause", "Valid"],
    ans: "Not logical - no causation",
    exp: "Rain doesn't cause failure. False Cause",
    fallacy: "False Cause"
  },
  {
    statement: "Everyone likes this music, so it must be good.",
    q: "Fallacy?",
    opts: ["Bandwagon", "Logical", "True", "No fallacy"],
    ans: "Bandwagon",
    exp: "Popular ≠ good. Bandwagon fallacy",
    fallacy: "Bandwagon"
  }
];

// ============================================================================
// INFINITE AI GENERATORS (MODULES 1-6)
// ============================================================================

// 1. TRUE/FALSE - Infinite
function generateAITrueFalse(n = 10): StatementItem[] {
  const groups = ["students", "teachers", "farmers", "traders", "nurses", "drivers"];
  const actions = ["like mathematics", "grow maize", "work hard", "can cook", "go on holidays"];
  return Array.from({ length: n }, (_, i) => {
    const g = groups[Math.floor(Math.random() * groups.length)];
    const a = actions[Math.floor(Math.random() * actions.length)];
    const isAll = Math.random() > 0.5;
    const text = isAll ? `All ${g} ${a}` : `Some ${g} ${a}`;
    const answer = isAll ? (Math.random() > 0.7 ? "TRUE" : "FALSE") : "TRUE";
    return {
      id: Date.now() + i,
      text,
      answer,
      level: "AI",
      explanation: isAll ? `Not all ${g} ${a}` : `Some do`,
      hint: isAll ? "ALL=100%?" : "SOME=at least one",
      mode: "truefalse",
      ai: true
    };
  });
}

// 2. VENN - Infinite
function generateAIVenn(n = 6): VennScenario[] {
  const pairs = [
    { l: "Students", r: "People who like Music" },
    { l: "Farmers", r: "People who own Land" },
    { l: "Girls", r: "People who can drive" },
    { l: "Teachers", r: "People who speak French" },
    { l: "Traders", r: "People who use Mobile Money" },
    { l: "Nurses", r: "People who play Volleyball" }
  ];
  return pairs.slice(0, n).map((p, i) => {
    const isAll = Math.random() > 0.5;
    const q = isAll ? `All ${p.l} ${p.r.toLowerCase()}` : `Some ${p.l} ${p.r.toLowerCase()}`;
    return {
      id: `v-ai-${Date.now() + i}`,
      left: p.l,
      right: p.r,
      overlap: `SOME ${p.l}`,
      ai: true,
      questions: [
        {
          q,
          a: q.startsWith("All") ? "FALSE" : "TRUE",
          exp: "Overlap shows SOME"
        }
      ]
    };
  });
}

// 3. PATTERN - Infinite
function generateAIPatterns(n = 10): PatternItem[] {
  return Array.from({ length: n }, (_, i) => {
    const add = Math.floor(Math.random() * 5) + 2;
    const start = Math.floor(Math.random() * 10) + 1;
    const seq = [start, start + add, start + add * 2];
    const ans = start + add * 3;
    const rawOptions = [ans, ans + 1, ans - 1, ans + add];
    const options = Array.from(new Set(rawOptions)).slice(0, 4);
    while (options.length < 4) {
      const candidate = ans + Math.floor(Math.random() * 8) - 4;
      if (!options.includes(candidate)) options.push(candidate);
    }
    options.sort(() => 0.5 - Math.random());
    return {
      id: 1000 + i,
      seq,
      answer: ans,
      options,
      rule: `Add ${add}`,
      type: "Adding",
      level: "AI",
      ai: true,
      realWorld: {
        story: `Item grows steadily by ${add} units each round.`,
        answer: `Next round will total ${ans}.`
      }
    };
  });
}

// 4. DECISION - Infinite (uses your 12 as base + random)
function generateAIDecisions(n = 8): DecisionScenario[] {
  const templates = [
    {
      title: "Water for Farm",
      story: "Crops need water. No rain 1 week.",
      category: "Farming" as const,
      opts: ["River free dirty", "Buy pipe water 100 cedis", "Wait for rain"]
    },
    {
      title: "School Fees",
      story: "You have 800 cedis. Fees 600, uniform 300.",
      category: "School" as const,
      opts: ["Pay fees only", "Buy uniform only", "Pay fees + mend uniform"]
    },
    {
      title: "Sell Harvest",
      story: "Maize ready. Price low today, may rise.",
      category: "Money" as const,
      opts: ["Sell now", "Wait 1 week", "Sell half now half later"]
    },
    {
      title: "Transport to Regional Exam",
      story: "Exam in 3 hours. Road is muddy.",
      category: "Life" as const,
      opts: ["Wait for sunny dry road", "Charter reliable verified bus", "Speed on overloaded motorbike"]
    }
  ];

  return Array.from({ length: n }, (_, i) => {
    const t = templates[i % templates.length];
    return {
      id: `dec-ai-${200 + i}`,
      category: t.category,
      title: t.title + " (AI)",
      story: t.story,
      options: t.opts.map((o, idx) => ({
        id: String.fromCharCode(65 + idx),
        name: o,
        cost: "Varies",
        costTone: idx === 2 ? ('good' as const) : idx === 1 ? ('bad' as const) : ('medium' as const),
        profit: "Varies",
        gain: "Varies",
        gainTone: idx === 2 ? ('good' as const) : ('medium' as const),
        risk: idx === 2 ? "Low" : "Medium",
        riskTone: idx === 2 ? ('good' as const) : ('bad' as const),
        best: idx === 2,
        rationale: idx === 2 ? "Balanced option hedges risk." : "Carries high single-factor vulnerability.",
        overlookedFactor: idx === 2 ? undefined : "Balanced Risk Mitigation"
      })),
      factors: ["Cost", "Risk", "Profit"],
      hint: "Balanced reduces risk",
      explanation: "Balanced option is often logical",
      alternativePerspective: "Some prefer extreme shortcuts, but balanced logic hedges risk effectively.",
      ai: true
    };
  });
}

// 5. ARGUMENT - Infinite
function generateAIArguments(n = 6): ArgumentItem[] {
  const templates = [
    {
      p1: "If you fetch water daily, tank gets full",
      p2: "Kwaku fetched water daily",
      q: "Conclusion?",
      opts: ["Tank is full", "Tank is empty", "No water", "Rain falls"],
      ans: "Tank is full",
      exp: "If P then Q, P true => Q true (Modus Ponens)",
      type: "If-Then"
    },
    {
      p1: "If you save 10 cedis weekly",
      p2: "4 weeks have passed",
      q: "How much saved?",
      opts: ["40", "10", "14", "0"],
      ans: "40",
      exp: "10x4=40 logical calculation",
      type: "Calculation"
    },
    {
      p1: "All SHS teachers are educated",
      p2: "Mr. Mensah is an SHS teacher",
      q: "What follows?",
      opts: ["Mr. Mensah is educated", "Not educated", "Uncertain", "Teaches science"],
      ans: "Mr. Mensah is educated",
      exp: "All A are B, X is A => X is B (Universal Syllogism)",
      type: "Syllogism"
    },
    {
      p1: "If cocoa harvest yields high, farmer earns bonus",
      p2: "Cocoa harvest yielded high this season",
      q: "Conclusion?",
      opts: ["Farmer earns bonus", "Farmer loses money", "Prices drop", "No conclusion"],
      ans: "Farmer earns bonus",
      exp: "If P then Q, P true => Q true",
      type: "If-Then"
    },
    {
      p1: "Some market traders sell yam",
      p2: "Aba is a market trader",
      q: "Does Aba sell yam?",
      opts: ["Cannot be sure", "Yes, definitely", "No, never", "All sell yam"],
      ans: "Cannot be sure",
      exp: "SOME traders sell yam, but not ALL. Can't be sure about Aba",
      type: "Syllogism"
    },
    {
      p1: "If tro-tro engine lacks oil, bus overheats",
      p2: "Tro-tro engine lacked oil",
      q: "What happens?",
      opts: ["Bus overheats", "Bus travels fast", "No change", "Bus turns green"],
      ans: "Bus overheats",
      exp: "If P then Q, P true => Q true",
      type: "If-Then"
    }
  ];

  return Array.from({ length: n }, (_, i) => {
    const t = templates[i % templates.length];
    return {
      id: `ai-arg-${Date.now()}-${i}`,
      premise1: t.p1,
      premise2: t.p2,
      q: t.q,
      opts: [...t.opts].sort(() => 0.5 - Math.random()),
      ans: t.ans,
      exp: t.exp,
      type: t.type,
      ai: true
    };
  });
}

// 6. FALLACY - Infinite
function generateAIFallacies(n = 6): FallacyItem[] {
  const templates = [
    {
      statement: "A taxi driver overcharged me in Accra. All taxi drivers in Ghana are dishonest.",
      q: "Is this logical?",
      opts: ["Not always - fallacy", "Always logical", "No conclusion", "True"],
      ans: "Not always - fallacy",
      exp: "Judging all drivers based on one experience is Hasty Generalization",
      fallacy: "Hasty Generalization"
    },
    {
      statement: "The black cat crossed the road and my pen broke. The cat caused my pen to break.",
      q: "Fallacy?",
      opts: ["False Cause", "Valid Causation", "Logical Deductive", "True Fact"],
      ans: "False Cause",
      exp: "Two unrelated events happening together is False Cause (Post hoc fallacy)",
      fallacy: "False Cause"
    },
    {
      statement: "Everyone in the village supports this football team, so it must be the greatest.",
      q: "Fallacy?",
      opts: ["Bandwagon", "Logical", "True", "No fallacy"],
      ans: "Bandwagon",
      exp: "Popularity does not equal quality or truth. Bandwagon fallacy",
      fallacy: "Bandwagon"
    },
    {
      statement: "Kwabena is a boy. Boys cannot cook or bake. So Kwabena cannot.",
      q: "Logical?",
      opts: ["Illogical - false premise", "Logical", "True", "Valid"],
      ans: "Illogical - false premise",
      exp: "The premise 'Boys cannot cook' is a FALSE cultural stereotype",
      fallacy: "Stereotype"
    },
    {
      statement: "I drank cold water before my exam and failed. Drinking water caused my failure.",
      q: "Logical?",
      opts: ["Not logical - no causation", "Logical", "True cause", "Valid"],
      ans: "Not logical - no causation",
      exp: "Drinking water does not cause exam failure. False Cause",
      fallacy: "False Cause"
    },
    {
      statement: "My friend bought shoes from this stall and the sole peeled off. Every shoe here is bad.",
      q: "Fallacy?",
      opts: ["Hasty Generalization", "Sound Logic", "Proven Fact", "No fallacy"],
      ans: "Hasty Generalization",
      exp: "One bad shoe is not enough evidence to judge all shoes. Hasty Generalization",
      fallacy: "Hasty Generalization"
    }
  ];

  return Array.from({ length: n }, (_, i) => {
    const t = templates[i % templates.length];
    return {
      id: `ai-fal-${Date.now()}-${i}`,
      statement: t.statement,
      q: t.q,
      opts: [...t.opts].sort(() => 0.5 - Math.random()),
      ans: t.ans,
      exp: t.exp,
      fallacy: t.fallacy,
      ai: true
    };
  });
}

// Helper to deduce concept category
function getConceptCategory(text: string): 'ALL' | 'SOME' | 'NONE' | 'GENERAL' {
  const upper = text.toUpperCase();
  if (upper.includes('ALL') || upper.includes('EVERY')) return 'ALL';
  if (upper.includes('SOME') || upper.includes('MIGHT')) return 'SOME';
  if (upper.includes('NO ') || upper.includes('CANNOT') || upper.includes('NEVER')) return 'NONE';
  return 'GENERAL';
}

// Alias for backwards compatibility
const generateAIQuestions = generateAITrueFalse;

// Confetti Particle Component
const ConfettiRain: React.FC = () => {
  const particles = useMemo(() => [
    { id: 1, emoji: '🎉', left: '15%', delay: 0 },
    { id: 2, emoji: '⭐', left: '28%', delay: 0.1 },
    { id: 3, emoji: '🌟', left: '42%', delay: 0.2 },
    { id: 4, emoji: '🎉', left: '60%', delay: 0.05 },
    { id: 5, emoji: '✨', left: '75%', delay: 0.15 },
    { id: 6, emoji: '🌟', left: '88%', delay: 0.25 }
  ], []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -40, opacity: 0, scale: 0.5 }}
          animate={{
            y: ['0vh', '85vh'],
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1.3, 1]
          }}
          transition={{
            duration: 1.8,
            delay: p.delay,
            ease: 'easeOut'
          }}
          style={{ left: p.left }}
          className="absolute text-3xl sm:text-4xl"
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
};

// SVG Venn Diagram with active animation
interface VennDiagramProps {
  scenario: {
    left: string;
    right: string;
    overlap: string;
  };
  highlightState?: 'SOME' | 'ALL' | 'NONE' | null;
  compact?: boolean;
}

const VennDiagram: React.FC<VennDiagramProps> = ({
  scenario,
  highlightState = null,
  compact = false
}) => {
  const isAll = highlightState === 'ALL' || scenario.overlap.toUpperCase().includes('ALL');
  const isSome = highlightState === 'SOME' || scenario.overlap.toUpperCase().includes('SOME');
  const isNone = highlightState === 'NONE';

  return (
    <div className={`w-full flex flex-col items-center select-none ${compact ? 'max-w-[240px]' : 'max-w-[340px]'}`}>
      <svg
        viewBox="0 0 340 200"
        className="w-full h-auto drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Venn diagram showing two overlapping groups"
      >
        <defs>
          <clipPath id="circleLeftClip">
            <circle cx="120" cy="100" r="78" />
          </clipPath>
          <clipPath id="circleRightClip">
            <circle cx="220" cy="100" r="78" />
          </clipPath>
        </defs>

        <motion.circle
          cx={isNone ? 100 : 120}
          cy="100"
          r="78"
          fill="#E8F5E9"
          stroke="#0B6E4F"
          strokeWidth={isAll ? '5' : '3'}
          animate={isAll ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.circle
          cx={isNone ? 240 : 220}
          cy="100"
          r="78"
          fill="#FFF8E1"
          stroke="#FFC107"
          strokeWidth="3"
        />

        {!isNone && (
          <motion.circle
            cx="220"
            cy="100"
            r="78"
            clipPath="url(#circleLeftClip)"
            fill="#FFC107"
            fillOpacity={0.65}
            animate={isSome ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '170px 100px' }}
          />
        )}

        <text
          x={isNone ? 80 : 85}
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-800 text-[12px] font-bold"
        >
          {scenario.left}
        </text>

        <text
          x={isNone ? 260 : 255}
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-800 text-[12px] font-bold"
        >
          {scenario.right.length > 14 ? `${scenario.right.slice(0, 12)}…` : scenario.right}
        </text>

        {!isNone && (
          <text
            x="170"
            y="100"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-emerald-950 text-[10px] font-extrabold uppercase tracking-tight"
          >
            OVERLAP
          </text>
        )}
      </svg>

      <div className="mt-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-semibold text-amber-900 text-center">
        {scenario.overlap}
      </div>
    </div>
  );
};

// ============================================================================
// HIDDEN TEACHER ACCESS FOOTER
// ============================================================================
interface AppFooterProps {
  onTriggerHiddenTeacher: () => void;
}

const AppFooter: React.FC<AppFooterProps> = ({ onTriggerHiddenTeacher }) => {
  const tapTimesRef = useRef<number[]>([]);
  const longPressTimerRef = useRef<any>(null);

  const handlePointerDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      onTriggerHiddenTeacher();
      tapTimesRef.current = [];
    }, 2000);
  };

  const handlePointerUpOrCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = () => {
    const now = Date.now();
    tapTimesRef.current = tapTimesRef.current.filter((t) => now - t <= 3000);
    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length >= 5) {
      tapTimesRef.current = [];
      onTriggerHiddenTeacher();
    }
  };

  return (
    <footer
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
      className="text-[12px] text-[#757575] text-center py-3 border-t border-slate-200 shrink-0 select-none bg-white/70 w-full cursor-default active:text-slate-600 transition-colors"
      title="Sir Eugene Technologies"
    >
      Built by Sir Eugene Technologies
    </footer>
  );
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Screens: 'login' | 'welcome' | 'quiz' | 'results' | 'create' | 'challengeSetup' | 'challengeGame' | 'teacherDashboard' | 'patternGame' | 'decisionGame' | 'argumentGame' | 'fallacyGame'
  const [screen, setScreen] = useState<'login' | 'welcome' | 'quiz' | 'results' | 'create' | 'challengeSetup' | 'challengeGame' | 'teacherDashboard' | 'patternGame' | 'decisionGame' | 'argumentGame' | 'fallacyGame'>('login');
  const [activeLesson, setActiveLesson] = useState<'truefalse' | 'venn' | 'pattern' | 'decision' | 'argument' | 'fallacy' | 'custom' | 'ai'>('truefalse');
  
  // Current logged in learner
  const [currentLearner, setCurrentLearner] = useState<LearnerProfile | null>(null);
  const [loginNameInput, setLoginNameInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Lesson 1 & 2 Quiz State
  const [customQuestionsPool, setCustomQuestionsPool] = useState<PlayableQuestion[]>([]);
  const [aiExtraQuestions, setAiExtraQuestions] = useState<PlayableQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerRecord[]>([]);
  const [historicalWrong, setHistoricalWrong] = useState<WrongAnswerRecord[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastUserAnswer, setLastUserAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  // Lesson 3: Pattern Master State
  const [patternIndex, setPatternIndex] = useState(0);
  const [patternScore, setPatternScore] = useState(0);
  const [selectedPatternOption, setSelectedPatternOption] = useState<number | null>(null);
  const [showPatternHint, setShowPatternHint] = useState(false);
  const [showPatternFeedback, setShowPatternFeedback] = useState(false);
  const [isPatternCorrect, setIsPatternCorrect] = useState(false);
  const [masteredPatternTypes, setMasteredPatternTypes] = useState<string[]>([]);
  const [aiExtraPatterns, setAiExtraPatterns] = useState<PatternItem[]>([]);

  // Lesson 4: Decision Maker State
  const [decisionIndex, setDecisionIndex] = useState(0);
  const [decisionScore, setDecisionScore] = useState(0);
  const [decisionSelectedOption, setDecisionSelectedOption] = useState<DecisionOption | null>(null);
  const [showDecisionHint, setShowDecisionHint] = useState(false);
  const [showDecisionFeedback, setShowDecisionFeedback] = useState(false);
  const [decisionActiveStep, setDecisionActiveStep] = useState<number>(1); // 1: Problem, 2: Options, 3: Factors, 4: Evaluate, 5: Decide
  const [showFactorTable, setShowFactorTable] = useState(false);
  const [decisionCategoryFilter, setDecisionCategoryFilter] = useState<'All' | 'Money' | 'School' | 'Farming' | 'Life'>('All');
  const [aiExtraDecisions, setAiExtraDecisions] = useState<DecisionScenario[]>([]);
  const [overlookedFactorsLog, setOverlookedFactorsLog] = useState<string[]>([]);

  // Lesson 5: Argument Builder State (Week 3)
  const [argumentIndex, setArgumentIndex] = useState(0);
  const [argumentScore, setArgumentScore] = useState(0);
  const [selectedArgumentOption, setSelectedArgumentOption] = useState<string | null>(null);
  const [showArgumentHint, setShowArgumentHint] = useState(false);
  const [showArgumentFeedback, setShowArgumentFeedback] = useState(false);
  const [isArgumentCorrect, setIsArgumentCorrect] = useState(false);
  const [aiExtraArguments, setAiExtraArguments] = useState<ArgumentItem[]>([]);

  // Lesson 6: Spot the Fallacy State (Week 3)
  const [fallacyIndex, setFallacyIndex] = useState(0);
  const [fallacyScore, setFallacyScore] = useState(0);
  const [selectedFallacyOption, setSelectedFallacyOption] = useState<string | null>(null);
  const [showFallacyHint, setShowFallacyHint] = useState(false);
  const [showFallacyFeedback, setShowFallacyFeedback] = useState(false);
  const [isFallacyCorrect, setIsFallacyCorrect] = useState(false);
  const [aiExtraFallacies, setAiExtraFallacies] = useState<FallacyItem[]>([]);

  // Hidden Teacher Access & PIN Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [allLearners, setAllLearners] = useState<LearnerProfile[]>([]);

  // Create-Your-Own state (6 tabs)
  const [createActiveTab, setCreateActiveTab] = useState<'truefalse' | 'venn' | 'pattern' | 'decision' | 'argument' | 'fallacy'>('truefalse');
  const [createStatementInput, setCreateStatementInput] = useState('');
  const [createAnswerChoice, setCreateAnswerChoice] = useState<'TRUE' | 'FALSE' | null>(null);
  const [createAiGuidance, setCreateAiGuidance] = useState<string | null>(null);
  const [savedUserQuestions, setSavedUserQuestions] = useState<CustomQuestion[]>([]);

  // Challenge Mode state
  const [challengeBattleType, setChallengeBattleType] = useState<'truefalse' | 'pattern' | 'decision' | 'argument' | 'fallacy'>('truefalse');
  const [challengeP1Name, setChallengeP1Name] = useState('Player 1');
  const [challengeP2Name, setChallengeP2Name] = useState('Player 2');
  const [challengeIsBot, setChallengeIsBot] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [challengeTurn, setChallengeTurn] = useState<'p1' | 'p2'>('p1');
  const [challengeQIndex, setChallengeQIndex] = useState(0);
  const [challengeTimer, setChallengeTimer] = useState(10);
  const [p1TempAnswer, setP1TempAnswer] = useState<any>(null);
  const [p2TempAnswer, setP2TempAnswer] = useState<any>(null);
  const [challengeRoundFeedback, setChallengeRoundFeedback] = useState<string | null>(null);
  const [challengeWinner, setChallengeWinner] = useState<string | null>(null);

  // Challenge questions bank
  const challengeQuestions = useMemo(() => {
    return STATEMENTS.map((st) => ({
      id: `ch-${st.id}`,
      text: st.text,
      answer: st.answer,
      explanation: st.explanation,
      hint: st.hint,
      mode: 'truefalse' as const,
      conceptType: getConceptCategory(st.text)
    }));
  }, []);

  // Initialize storage & check URL hash for #teacher
  useEffect(() => {
    try {
      const storedLearners: LearnerProfile[] = JSON.parse(localStorage.getItem('logicmaster_learners') || '[]');
      setAllLearners(storedLearners);

      const activeId = localStorage.getItem('logicmaster_active_learner_id');
      if (activeId && storedLearners.length > 0) {
        const found = storedLearners.find((l) => l.id.toString() === activeId);
        if (found) {
          setCurrentLearner(found);
          setScreen('welcome');
          setChallengeP1Name(found.name);
        }
      }

      const storedWrong = localStorage.getItem('logicmaster_wrong_answers');
      if (storedWrong) setHistoricalWrong(JSON.parse(storedWrong));

      const storedCustom = localStorage.getItem('myQuestions');
      if (storedCustom) setSavedUserQuestions(JSON.parse(storedCustom));

      const storedPatterns = localStorage.getItem('patternProgress');
      if (storedPatterns) setMasteredPatternTypes(JSON.parse(storedPatterns));

      const storedOverlooked = localStorage.getItem('logicmaster_overlooked_factors');
      if (storedOverlooked) setOverlookedFactorsLog(JSON.parse(storedOverlooked));
    } catch {
      // Safe fallback
    }

    if (window.location.hash === '#teacher') {
      setShowPinModal(true);
    }

    const handleHashChange = () => {
      if (window.location.hash === '#teacher') {
        setShowPinModal(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Challenge countdown timer
  useEffect(() => {
    if (screen !== 'challengeGame' || challengeWinner || challengeRoundFeedback) return;

    const timerInterval = setInterval(() => {
      setChallengeTimer((prev) => {
        if (prev <= 1) {
          handleChallengeAnswer('TIMEOUT');
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [screen, challengeTurn, challengeWinner, challengeRoundFeedback, challengeQIndex]);

  // Bot auto-play in challenge mode when it's bot's turn
  useEffect(() => {
    if (screen === 'challengeGame' && challengeTurn === 'p2' && challengeIsBot && !challengeRoundFeedback && !challengeWinner) {
      const botTimeout = setTimeout(() => {
        if (challengeBattleType === 'truefalse') {
          const curQ = challengeQuestions[challengeQIndex % challengeQuestions.length];
          const isBotCorrect = Math.random() < 0.75;
          const botChoice = isBotCorrect ? curQ.answer : curQ.answer === 'TRUE' ? 'FALSE' : 'TRUE';
          handleChallengeAnswer(botChoice);
        } else if (challengeBattleType === 'pattern') {
          const curPat = PATTERNS[challengeQIndex % PATTERNS.length];
          const isBotCorrect = Math.random() < 0.75;
          const botChoice = isBotCorrect ? curPat.answer : curPat.options.find(o => o !== curPat.answer) || curPat.answer;
          handleChallengeAnswer(botChoice);
        } else if (challengeBattleType === 'decision') {
          const curDec = DECISIONS[challengeQIndex % DECISIONS.length];
          const bestOpt = curDec.options.find(o => o.best);
          const isBotCorrect = Math.random() < 0.75;
          const botChoice = isBotCorrect && bestOpt ? bestOpt.id : curDec.options.find(o => !o.best)?.id || curDec.options[0].id;
          handleChallengeAnswer(botChoice);
        } else if (challengeBattleType === 'argument') {
          const curArg = ARGUMENTS[challengeQIndex % ARGUMENTS.length];
          const isBotCorrect = Math.random() < 0.75;
          const botChoice = isBotCorrect ? curArg.ans : curArg.opts.find(o => o !== curArg.ans) || curArg.ans;
          handleChallengeAnswer(botChoice);
        } else {
          const curFal = FALLACIES[challengeQIndex % FALLACIES.length];
          const isBotCorrect = Math.random() < 0.75;
          const botChoice = isBotCorrect ? curFal.ans : curFal.opts.find(o => o !== curFal.ans) || curFal.ans;
          handleChallengeAnswer(botChoice);
        }
      }, 1200);

      return () => clearTimeout(botTimeout);
    }
  }, [screen, challengeTurn, challengeIsBot, challengeRoundFeedback, challengeWinner, challengeQIndex, challengeBattleType]);

  // Prepare questions list for Lesson 1 & 2
  const questions: PlayableQuestion[] = useMemo(() => {
    if (activeLesson === 'truefalse') {
      const base = STATEMENTS.map((st) => ({
        id: `tf-${st.id}`,
        text: st.text,
        answer: st.answer,
        explanation: st.explanation,
        hint: st.hint,
        level: st.level,
        mode: 'truefalse' as const,
        conceptType: getConceptCategory(st.text)
      }));
      return [...base, ...aiExtraQuestions];
    }

    if (activeLesson === 'venn') {
      const base = VENN_SCENARIOS.flatMap((scenario) =>
        scenario.questions.map((q, qIdx) => ({
          id: `${scenario.id}-q${qIdx}`,
          text: q.q,
          answer: q.a,
          explanation: q.exp,
          hint: `Look at the overlap: "${scenario.overlap}"`,
          mode: 'venn' as const,
          scenario: {
            id: scenario.id,
            left: scenario.left,
            right: scenario.right,
            overlap: scenario.overlap
          },
          conceptType: getConceptCategory(q.q)
        }))
      );
      return [...base, ...aiExtraQuestions];
    }

    if (activeLesson === 'custom') {
      return customQuestionsPool;
    }

    if (activeLesson === 'ai') {
      return aiExtraQuestions;
    }

    return [];
  }, [activeLesson, aiExtraQuestions, customQuestionsPool]);

  // Filtered patterns list for Lesson 3
  const activePatterns: PatternItem[] = useMemo(() => {
    return [...PATTERNS, ...aiExtraPatterns];
  }, [aiExtraPatterns]);

  // Filtered decisions list for Lesson 4
  const filteredDecisions: DecisionScenario[] = useMemo(() => {
    const combined = [...DECISIONS, ...aiExtraDecisions];
    if (decisionCategoryFilter === 'All') return combined;
    return combined.filter((d) => {
      const matchCat = d.category?.toLowerCase() === decisionCategoryFilter.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(decisionCategoryFilter.toLowerCase());
      const matchStory = d.story.toLowerCase().includes(decisionCategoryFilter.toLowerCase());
      return matchCat || matchTitle || matchStory;
    });
  }, [decisionCategoryFilter, aiExtraDecisions]);

  // Active arguments list for Lesson 5 (Week 3)
  const activeArguments: ArgumentItem[] = useMemo(() => {
    return [...ARGUMENTS, ...aiExtraArguments];
  }, [aiExtraArguments]);

  // Active fallacies list for Lesson 6 (Week 3)
  const activeFallacies: FallacyItem[] = useMemo(() => {
    return [...FALLACIES, ...aiExtraFallacies];
  }, [aiExtraFallacies]);

  const currentQuestion: PlayableQuestion | undefined = questions[currentIndex];
  const currentPattern: PatternItem = activePatterns[patternIndex] || PATTERNS[0];
  const currentDecision: DecisionScenario =
    filteredDecisions[decisionIndex] || filteredDecisions[0] || DECISIONS[0];
  const currentArgument: ArgumentItem =
    activeArguments[argumentIndex] || ARGUMENTS[0];
  const currentFallacy: FallacyItem =
    activeFallacies[fallacyIndex] || FALLACIES[0];

  // Voice speech synthesis
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // --------------------------------------------------------------------------
  // AUTH / LOGIN FLOW
  // --------------------------------------------------------------------------
  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = loginNameInput.trim();
    if (trimmed.length < 2) {
      setLoginError('Please enter a name with at least 2 characters.');
      return;
    }

    setLoginError('');
    try {
      const existing: LearnerProfile[] = JSON.parse(localStorage.getItem('logicmaster_learners') || '[]');
      const matchIndex = existing.findIndex((l) => l.name.toLowerCase() === trimmed.toLowerCase());

      let activeProfile: LearnerProfile;

      if (matchIndex >= 0) {
        activeProfile = {
          ...existing[matchIndex],
          lastSeen: new Date().toISOString()
        };
        existing[matchIndex] = activeProfile;
      } else {
        activeProfile = {
          id: Date.now(),
          name: trimmed,
          scores: [],
          avg: 0,
          weak: [],
          lastSeen: new Date().toISOString()
        };
        existing.push(activeProfile);
      }

      localStorage.setItem('logicmaster_learners', JSON.stringify(existing));
      localStorage.setItem('logicmaster_active_learner_id', activeProfile.id.toString());
      setAllLearners(existing);
      setCurrentLearner(activeProfile);
      setChallengeP1Name(activeProfile.name);
      setScreen('welcome');
    } catch {
      // Fallback
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('logicmaster_active_learner_id');
    setCurrentLearner(null);
    setLoginNameInput('');
    setScreen('login');
  };

  // Record learner progress across all 6 lessons
  const updateLearnerHistory = (
    lessonMode: 'truefalse' | 'venn' | 'pattern' | 'decision' | 'argument' | 'fallacy' | 'custom' | 'ai',
    finalScore: number,
    total: number
  ) => {
    if (!currentLearner) return;

    try {
      const pct = Math.round((finalScore / (total || 1)) * 100);
      const newScoreItem: LearnerScoreItem = {
        date: new Date().toLocaleDateString(),
        mode: lessonMode,
        score: finalScore,
        total,
        pct
      };

      const updatedScores = [...currentLearner.scores, newScoreItem];
      const avg = Math.round(updatedScores.reduce((acc, curr) => acc + curr.pct, 0) / updatedScores.length);

      const weakSet = new Set<string>(currentLearner.weak || []);
      if (lessonMode === 'pattern' && pct < 70) weakSet.add('Numerical Patterns');
      if (lessonMode === 'decision' && pct < 70) weakSet.add('Decision Trade-offs');
      if (lessonMode === 'argument' && pct < 70) weakSet.add('Argument Deductions');
      if (lessonMode === 'fallacy' && pct < 70) weakSet.add('Spotting Fallacies');

      wrongAnswers.forEach((w) => {
        if (w.conceptType === 'ALL') weakSet.add('ALL Statements');
        if (w.conceptType === 'SOME') weakSet.add('SOME (Overlap)');
        if (w.conceptType === 'NONE') weakSet.add('Negations/None');
      });

      const updatedLearner: LearnerProfile = {
        ...currentLearner,
        scores: updatedScores,
        avg,
        weak: Array.from(weakSet),
        lastSeen: new Date().toISOString()
      };

      setCurrentLearner(updatedLearner);

      const stored: LearnerProfile[] = JSON.parse(localStorage.getItem('logicmaster_learners') || '[]');
      const idx = stored.findIndex((l) => l.id === updatedLearner.id);
      if (idx >= 0) {
        stored[idx] = updatedLearner;
      } else {
        stored.push(updatedLearner);
      }

      localStorage.setItem('logicmaster_learners', JSON.stringify(stored));
      setAllLearners(stored);
    } catch {
      // Safe fallback
    }
  };

  // --------------------------------------------------------------------------
  // LESSON 1 & 2 QUIZ HANDLING
  // --------------------------------------------------------------------------
  const startLesson = (lesson: 'truefalse' | 'venn' | 'pattern' | 'decision' | 'argument' | 'fallacy' | 'custom' | 'ai') => {
    setActiveLesson(lesson);

    if (lesson === 'pattern') {
      setPatternIndex(0);
      setPatternScore(0);
      setSelectedPatternOption(null);
      setShowPatternHint(false);
      setShowPatternFeedback(false);
      setScreen('patternGame');
      return;
    }

    if (lesson === 'decision') {
      setDecisionIndex(0);
      setDecisionScore(0);
      setDecisionSelectedOption(null);
      setShowDecisionHint(false);
      setShowDecisionFeedback(false);
      setDecisionActiveStep(1);
      setShowFactorTable(false);
      setScreen('decisionGame');
      return;
    }

    if (lesson === 'argument') {
      setArgumentIndex(0);
      setArgumentScore(0);
      setSelectedArgumentOption(null);
      setShowArgumentHint(false);
      setShowArgumentFeedback(false);
      setScreen('argumentGame');
      return;
    }

    if (lesson === 'fallacy') {
      setFallacyIndex(0);
      setFallacyScore(0);
      setSelectedFallacyOption(null);
      setShowFallacyHint(false);
      setShowFallacyFeedback(false);
      setScreen('fallacyGame');
      return;
    }

    setAiExtraQuestions([]);
    setScreen('quiz');
    setCurrentIndex(0);
    setScore(0);
    setWrongAnswers([]);
    setShowHint(false);
    setShowFeedback(false);
    setLastUserAnswer(null);
  };

  const restartCurrentLesson = () => {
    if (activeLesson === 'pattern') {
      startLesson('pattern');
    } else if (activeLesson === 'decision') {
      startLesson('decision');
    } else if (activeLesson === 'argument') {
      startLesson('argument');
    } else if (activeLesson === 'fallacy') {
      startLesson('fallacy');
    } else {
      setScreen('quiz');
      setCurrentIndex(0);
      setScore(0);
      setWrongAnswers([]);
      setShowHint(false);
      setShowFeedback(false);
      setLastUserAnswer(null);
    }
  };

  const handleAnswer = (userChoice: 'TRUE' | 'FALSE') => {
    if (!currentQuestion || showFeedback) return;

    setLastUserAnswer(userChoice);
    const correct = userChoice === currentQuestion.answer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore((prev) => prev + 1);
    } else {
      const wrongItem: WrongAnswerRecord = {
        id: currentQuestion.id,
        text: currentQuestion.text,
        userAnswer: userChoice,
        correctAnswer: currentQuestion.answer,
        explanation: currentQuestion.explanation,
        mode: currentQuestion.mode,
        conceptType: currentQuestion.conceptType || 'GENERAL',
        timestamp: Date.now()
      };

      setWrongAnswers((prev) => [...prev, wrongItem]);
      const updatedHistorical = [...historicalWrong, wrongItem];
      setHistoricalWrong(updatedHistorical);
      try {
        localStorage.setItem('logicmaster_wrong_answers', JSON.stringify(updatedHistorical));
      } catch {
        // Safe write
      }
    }
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setShowHint(false);
    setLastUserAnswer(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      const total = questions.length || 1;
      updateLearnerHistory(activeLesson, score, total);
      setScreen('results');
    }
  };

  const handleAppendAITrueFalse = () => {
    const newItems = generateAITrueFalse(10);
    const playable: PlayableQuestion[] = newItems.map((st) => ({
      id: `ai-tf-${st.id}`,
      text: st.text,
      answer: st.answer,
      explanation: st.explanation,
      hint: st.hint,
      level: st.level,
      mode: 'truefalse' as const,
      conceptType: getConceptCategory(st.text)
    }));
    setAiExtraQuestions((prev) => [...prev, ...playable]);
    setCurrentIndex(questions.length);
    setScreen('quiz');
  };

  const handleAppendAIVenn = () => {
    const newScenarios = generateAIVenn(6);
    const playable: PlayableQuestion[] = newScenarios.flatMap((scenario) =>
      scenario.questions.map((q, qIdx) => ({
        id: `${scenario.id}-q${qIdx}`,
        text: q.q,
        answer: q.a,
        explanation: q.exp,
        hint: `Look at the overlap: "${scenario.overlap}"`,
        mode: 'venn' as const,
        scenario: {
          id: scenario.id,
          left: scenario.left,
          right: scenario.right,
          overlap: scenario.overlap
        },
        conceptType: getConceptCategory(q.q)
      }))
    );
    setAiExtraQuestions((prev) => [...prev, ...playable]);
    setCurrentIndex(questions.length);
    setScreen('quiz');
  };

  const handleAppendAIQuestions = handleAppendAITrueFalse;

  // --------------------------------------------------------------------------
  // LESSON 3: PATTERN MASTER HANDLERS
  // --------------------------------------------------------------------------
  const handleSelectPatternOption = (option: number) => {
    if (showPatternFeedback) return;
    setSelectedPatternOption(option);
    const correct = option === currentPattern.answer;
    setIsPatternCorrect(correct);
    setShowPatternFeedback(true);

    if (correct) {
      setPatternScore((prev) => prev + 1);
      // Track mastered types in localStorage 'patternProgress'
      if (!masteredPatternTypes.includes(currentPattern.type)) {
        const updated = [...masteredPatternTypes, currentPattern.type];
        setMasteredPatternTypes(updated);
        try {
          localStorage.setItem('patternProgress', JSON.stringify(updated));
        } catch {
          // Safe write
        }
      }
    }
  };

  const handleNextPattern = () => {
    setShowPatternFeedback(false);
    setShowPatternHint(false);
    setSelectedPatternOption(null);

    if (patternIndex + 1 < activePatterns.length) {
      setPatternIndex((prev) => prev + 1);
    } else {
      updateLearnerHistory('pattern', patternScore + (isPatternCorrect ? 0 : 0), activePatterns.length);
      setScore(patternScore);
      setActiveLesson('pattern');
      setScreen('results');
    }
  };

  const handleAppendAIPatterns = () => {
    const newItems = generateAIPatterns(10);
    setAiExtraPatterns((prev) => [...prev, ...newItems]);
    setPatternIndex(activePatterns.length);
    setScreen('patternGame');
  };

  // --------------------------------------------------------------------------
  // LESSON 4: DECISION MAKER HANDLERS
  // --------------------------------------------------------------------------
  const handleSelectDecisionOption = (option: DecisionOption) => {
    if (showDecisionFeedback) return;
    setDecisionSelectedOption(option);
    setShowDecisionFeedback(true);

    if (option.best) {
      setDecisionScore((prev) => prev + 1);
    } else {
      const factorIgnored = option.overlookedFactor || 'Safety & Risk Balance';
      const updatedFactors = [...overlookedFactorsLog, factorIgnored];
      setOverlookedFactorsLog(updatedFactors);
      try {
        localStorage.setItem('logicmaster_overlooked_factors', JSON.stringify(updatedFactors));
      } catch {
        // Safe write
      }
    }

    // Save decision evaluation skills to localStorage 'decisionProgress'
    try {
      const existingDecisions = JSON.parse(localStorage.getItem('decisionProgress') || '[]');
      existingDecisions.push({
        scenarioId: currentDecision.id,
        chosen: option.name,
        best: option.best,
        overlookedFactor: option.best ? null : (option.overlookedFactor || 'Safety & Risk Balance'),
        date: new Date().toLocaleDateString()
      });
      localStorage.setItem('decisionProgress', JSON.stringify(existingDecisions));
    } catch {
      // Safe write
    }
  };

  const handleNextDecision = () => {
    setShowDecisionFeedback(false);
    setShowDecisionHint(false);
    setDecisionSelectedOption(null);
    setShowFactorTable(false);
    setDecisionActiveStep(1);

    if (decisionIndex + 1 < filteredDecisions.length) {
      setDecisionIndex((prev) => prev + 1);
    } else {
      updateLearnerHistory('decision', decisionScore, filteredDecisions.length);
      setScore(decisionScore);
      setActiveLesson('decision');
      setScreen('results');
    }
  };

  const handleGenerateMoreDecisions = () => {
    const newItems = generateAIDecisions(8);
    setAiExtraDecisions((prev) => [...prev, ...newItems]);
  };

  const handleAppendAIDecisions = () => {
    handleGenerateMoreDecisions();
    setDecisionIndex(filteredDecisions.length);
    setScreen('decisionGame');
  };

  // --------------------------------------------------------------------------
  // LESSON 5: ARGUMENT BUILDER HANDLERS (WEEK 3)
  // --------------------------------------------------------------------------
  const handleSelectArgumentOption = (option: string) => {
    if (showArgumentFeedback) return;
    setSelectedArgumentOption(option);
    const correct = option.trim().toLowerCase() === currentArgument.ans.trim().toLowerCase();
    setIsArgumentCorrect(correct);
    setShowArgumentFeedback(true);

    if (correct) {
      setArgumentScore((prev) => prev + 1);
    }
  };

  const handleNextArgument = () => {
    setShowArgumentFeedback(false);
    setShowArgumentHint(false);
    setSelectedArgumentOption(null);

    if (argumentIndex + 1 < activeArguments.length) {
      setArgumentIndex((prev) => prev + 1);
    } else {
      updateLearnerHistory('argument', argumentScore + (isArgumentCorrect ? 0 : 0), activeArguments.length);
      setScore(argumentScore);
      setActiveLesson('argument');
      setScreen('results');
    }
  };

  const handleAppendAIArguments = () => {
    const newItems = generateAIArguments(6);
    setAiExtraArguments((prev) => [...prev, ...newItems]);
    setArgumentIndex(activeArguments.length);
    setScreen('argumentGame');
  };

  // --------------------------------------------------------------------------
  // LESSON 6: SPOT THE FALLACY HANDLERS (WEEK 3)
  // --------------------------------------------------------------------------
  const handleSelectFallacyOption = (option: string) => {
    if (showFallacyFeedback) return;
    setSelectedFallacyOption(option);
    const correct = option.trim().toLowerCase() === currentFallacy.ans.trim().toLowerCase();
    setIsFallacyCorrect(correct);
    setShowFallacyFeedback(true);

    if (correct) {
      setFallacyScore((prev) => prev + 1);
    }
  };

  const handleNextFallacy = () => {
    setShowFallacyFeedback(false);
    setShowFallacyHint(false);
    setSelectedFallacyOption(null);

    if (fallacyIndex + 1 < activeFallacies.length) {
      setFallacyIndex((prev) => prev + 1);
    } else {
      updateLearnerHistory('fallacy', fallacyScore + (isFallacyCorrect ? 0 : 0), activeFallacies.length);
      setScore(fallacyScore);
      setActiveLesson('fallacy');
      setScreen('results');
    }
  };

  const handleAppendAIFallacies = () => {
    const newItems = generateAIFallacies(6);
    setAiExtraFallacies((prev) => [...prev, ...newItems]);
    setFallacyIndex(activeFallacies.length);
    setScreen('fallacyGame');
  };

  // --------------------------------------------------------------------------
  // CREATE-YOUR-OWN QUESTION
  // --------------------------------------------------------------------------
  const handleCheckCustomStatement = () => {
    const trimmed = createStatementInput.trim();
    if (!trimmed) return;
    if (!createAnswerChoice) {
      setCreateAiGuidance('Please select whether your statement is TRUE or FALSE first.');
      return;
    }

    const lower = trimmed.toLowerCase();
    let feedback = '';

    if (createActiveTab === 'argument') {
      if (lower.includes('if') || lower.includes('so') || lower.includes('therefore')) {
        feedback = 'Excellent deductive structure! You are constructing a conditional or syllogistic argument (Modus Ponens).';
      } else {
        feedback = 'Good reasoning thought! Structure your premises clearly (e.g. "If P then Q; P is true => Conclusion").';
      }
    } else if (createActiveTab === 'fallacy') {
      feedback = 'Sharp fallacy statement! Exposes flaws like hasty generalizations, bandwagon peer pressure, or false cause.';
    } else if (createActiveTab === 'pattern') {
      feedback = 'Numerical pattern sequence formulated! Clear rule-based arithmetic or geometric progression.';
    } else if (createActiveTab === 'decision') {
      feedback = 'Strategic decision scenario created! Balances costs, risks, and realistic Ghana trade-offs.';
    } else if (createActiveTab === 'venn') {
      feedback = 'Set overlap relation formulated! Correctly frames group containment and intersections.';
    } else {
      if (lower.includes('all') && createAnswerChoice === 'TRUE') {
        feedback = 'Are you sure? Is it REALLY 100%? Think again... Can you find even one exception?';
      } else if (lower.includes('all') && createAnswerChoice === 'FALSE') {
        feedback = 'Great logical thinking! Usually "ALL" fails because one single exception makes it FALSE.';
      } else if (lower.includes('some') && createAnswerChoice === 'TRUE') {
        feedback = 'Correct thinking! SOME means at least one example exists.';
      } else if (lower.includes('some') && createAnswerChoice === 'FALSE') {
        feedback = 'Careful: If even one person or thing does it, "SOME" is TRUE. Does nobody at all do this?';
      } else if (lower.includes('no ') || lower.includes('cannot') || lower.includes('never')) {
        feedback = 'Negation alert! "None" or "Cannot" requires that 0% of members do this. Make sure no counter-examples exist!';
      } else {
        feedback = 'Good logical statement! Clear reasoning and straightforward truth value.';
      }
    }

    setCreateAiGuidance(feedback);

    const newQ: CustomQuestion = {
      id: `custom-${Date.now()}`,
      text: trimmed,
      answer: createAnswerChoice,
      aiFeedback: feedback,
      createdAt: new Date().toLocaleDateString()
    };

    const updated = [newQ, ...savedUserQuestions];
    setSavedUserQuestions(updated);
    try {
      localStorage.setItem('myQuestions', JSON.stringify(updated));
    } catch {
      // Safe write
    }
  };

  const handlePlayCustomQuestions = () => {
    if (savedUserQuestions.length === 0) return;
    const pool: PlayableQuestion[] = savedUserQuestions.map((cq) => ({
      id: cq.id,
      text: cq.text,
      answer: cq.answer,
      explanation: cq.aiFeedback,
      hint: 'Think about whether exceptions exist.',
      mode: 'custom',
      conceptType: getConceptCategory(cq.text)
    }));
    setCustomQuestionsPool(pool);
    startLesson('custom');
  };

  // --------------------------------------------------------------------------
  // CHALLENGE MODE
  // --------------------------------------------------------------------------
  const startChallengeGame = (
    isBot: boolean,
    battleType: 'truefalse' | 'pattern' | 'decision' | 'argument' | 'fallacy'
  ) => {
    setChallengeBattleType(battleType);
    setChallengeIsBot(isBot);
    setP1Score(0);
    setP2Score(0);
    setChallengeTurn('p1');
    setChallengeQIndex(0);
    setChallengeTimer(10);
    setP1TempAnswer(null);
    setP2TempAnswer(null);
    setChallengeRoundFeedback(null);
    setChallengeWinner(null);
    setScreen('challengeGame');
  };

  const handleChallengeAnswer = (answer: any) => {
    if (challengeRoundFeedback || challengeWinner) return;

    if (challengeTurn === 'p1') {
      setP1TempAnswer(answer);
      setChallengeTurn('p2');
      setChallengeTimer(10);
    } else {
      setP2TempAnswer(answer);

      let p1Correct = false;
      let p2Correct = false;
      let solutionLabel = '';

      if (challengeBattleType === 'truefalse') {
        const curQ = challengeQuestions[challengeQIndex % challengeQuestions.length];
        p1Correct = p1TempAnswer === curQ.answer;
        p2Correct = answer === curQ.answer;
        solutionLabel = `Correct answer was ${curQ.answer}`;
      } else if (challengeBattleType === 'pattern') {
        const curPat = PATTERNS[challengeQIndex % PATTERNS.length];
        p1Correct = Number(p1TempAnswer) === curPat.answer;
        p2Correct = Number(answer) === curPat.answer;
        solutionLabel = `Next number was ${curPat.answer} (${curPat.rule})`;
      } else if (challengeBattleType === 'decision') {
        const curDec = DECISIONS[challengeQIndex % DECISIONS.length];
        const bestOpt = curDec.options.find((o) => o.best);
        p1Correct = p1TempAnswer === bestOpt?.id;
        p2Correct = answer === bestOpt?.id;
        solutionLabel = `Most logical: ${bestOpt?.name}`;
      } else if (challengeBattleType === 'argument') {
        const curArg = ARGUMENTS[challengeQIndex % ARGUMENTS.length];
        p1Correct = String(p1TempAnswer).trim().toLowerCase() === curArg.ans.trim().toLowerCase();
        p2Correct = String(answer).trim().toLowerCase() === curArg.ans.trim().toLowerCase();
        solutionLabel = `Conclusion: ${curArg.ans} (${curArg.exp})`;
      } else if (challengeBattleType === 'fallacy') {
        const curFal = FALLACIES[challengeQIndex % FALLACIES.length];
        p1Correct = String(p1TempAnswer).trim().toLowerCase() === curFal.ans.trim().toLowerCase();
        p2Correct = String(answer).trim().toLowerCase() === curFal.ans.trim().toLowerCase();
        solutionLabel = `Diagnosis: ${curFal.ans} (${curFal.fallacy})`;
      }

      const newP1Score = p1Score + (p1Correct ? 1 : 0);
      const newP2Score = p2Score + (p2Correct ? 1 : 0);

      setP1Score(newP1Score);
      setP2Score(newP2Score);

      let roundMsg = `${solutionLabel}. `;
      if (p1Correct && p2Correct) {
        roundMsg += `Both scored a point! 🎯`;
      } else if (p1Correct) {
        roundMsg += `${challengeP1Name} scored! ⚡`;
      } else if (p2Correct) {
        roundMsg += `${challengeIsBot ? 'LogicBot' : challengeP2Name} scored! ⚡`;
      } else {
        roundMsg += `Neither scored this round.`;
      }

      setChallengeRoundFeedback(roundMsg);

      if (newP1Score >= 5 || newP2Score >= 5) {
        const winnerName = newP1Score >= 5 ? challengeP1Name : challengeIsBot ? 'LogicBot 🤖' : challengeP2Name;
        setChallengeWinner(winnerName);

        try {
          const chHistory: ChallengeHistoryItem[] = JSON.parse(localStorage.getItem('challengeHistory') || '[]');
          chHistory.push({
            id: `ch-${Date.now()}`,
            date: new Date().toLocaleDateString(),
            battleType: challengeBattleType,
            player1: challengeP1Name,
            player2: challengeIsBot ? 'LogicBot' : challengeP2Name,
            p1Score: newP1Score,
            p2Score: newP2Score,
            winner: winnerName
          });
          localStorage.setItem('challengeHistory', JSON.stringify(chHistory));
        } catch {
          // Safe write
        }
      }
    }
  };

  const advanceChallengeRound = () => {
    setChallengeRoundFeedback(null);
    setP1TempAnswer(null);
    setP2TempAnswer(null);
    setChallengeTurn('p1');
    setChallengeTimer(10);
    setChallengeQIndex((prev) => prev + 1);
  };

  // --------------------------------------------------------------------------
  // TEACHER ACCESS & PIN VALIDATION
  // --------------------------------------------------------------------------
  const handleUnlockTeacher = () => {
    const trimmed = pinInput.trim();
    if (trimmed === DEFAULT_TEACHER_PIN || trimmed === LEGACY_TEACHER_PIN) {
      setPinError('');
      setShowPinModal(false);
      setPinInput('');
      window.location.hash = '#teacher';
      setScreen('teacherDashboard');
    } else {
      setPinError('Incorrect PIN');
    }
  };

  const handleLockTeacher = () => {
    window.location.hash = '';
    if (currentLearner) {
      setScreen('welcome');
    } else {
      setScreen('login');
    }
  };

  // Sorted Learners: Struggling first
  const sortedLearners = useMemo(() => {
    return [...allLearners].sort((a, b) => a.avg - b.avg);
  }, [allLearners]);

  // Overall most common weak area calculation
  const overallMostCommonWeakArea = useMemo(() => {
    const frequencyMap: Record<string, number> = {};
    allLearners.forEach((lr) => {
      lr.weak.forEach((w) => {
        frequencyMap[w] = (frequencyMap[w] || 0) + 1;
      });
    });

    let topWeak = 'ALL vs SOME (Quantifier Confusion)';
    let maxCount = 0;
    Object.entries(frequencyMap).forEach(([weakArea, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topWeak = weakArea;
      }
    });

    return { topWeak, count: maxCount };
  }, [allLearners]);

  const mistakeAnalysis = useMemo(() => {
    const combined = [...historicalWrong, ...wrongAnswers];
    let allVsSomeCount = 0;
    let negationCount = 0;
    const totalMistakes = combined.length;

    combined.forEach((item) => {
      const txt = item.text.toUpperCase();
      if (txt.includes('ALL') || txt.includes('SOME') || item.conceptType === 'ALL' || item.conceptType === 'SOME') {
        allVsSomeCount++;
      }
      if (txt.includes('NOT') || txt.includes('CANNOT') || txt.includes('NO ')) {
        negationCount++;
      }
    });

    return {
      allVsSomeCount,
      negationCount,
      totalMistakes,
      recentCount: wrongAnswers.length
    };
  }, [historicalWrong, wrongAnswers]);

  // Export CSV with columns for all 6 lessons + overall
  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Overall Avg (%)',
      'Lesson 1 (TF) Avg',
      'Lesson 2 (Venn) Avg',
      'Lesson 3 (Pattern) Avg',
      'Lesson 4 (Decision) Avg',
      'Lesson 5 (Argument) Avg',
      'Lesson 6 (Fallacy) Avg',
      'Weak Area',
      'Total Attempts',
      'Last Seen'
    ];

    const rows = sortedLearners.map((lr) => {
      const getLessonAvg = (modeName: string) => {
        const matches = lr.scores.filter((s) => s.mode === modeName);
        if (matches.length === 0) return 'N/A';
        return Math.round(matches.reduce((a, b) => a + b.pct, 0) / matches.length) + '%';
      };

      return [
        `"${lr.name.replace(/"/g, '""')}"`,
        lr.scores.length > 0 ? `${lr.avg}%` : 'N/A',
        getLessonAvg('truefalse'),
        getLessonAvg('venn'),
        getLessonAvg('pattern'),
        getLessonAvg('decision'),
        getLessonAvg('argument'),
        getLessonAvg('fallacy'),
        `"${(lr.weak.length > 0 ? lr.weak[0] : 'None').replace(/"/g, '""')}"`,
        lr.scores.length,
        `"${new Date(lr.lastSeen).toLocaleDateString().replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `logicmaster_learners_week3_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      console.log('CSV Export:', csvContent);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all student records and diagnostic data? This cannot be undone.')) {
      localStorage.removeItem('logicmaster_learners');
      localStorage.removeItem('logicmaster_wrong_answers');
      localStorage.removeItem('logicmaster_scores');
      localStorage.removeItem('challengeHistory');
      localStorage.removeItem('patternProgress');
      localStorage.removeItem('decisionProgress');
      setAllLearners([]);
      setHistoricalWrong([]);
      setWrongAnswers([]);
      setCurrentLearner(null);
      handleLockTeacher();
    }
  };

  // Decision Maker Diagnostic Statistics (Avg & Overlooked Factor)
  const decisionStats = useMemo(() => {
    const allDecScores: number[] = [];
    allLearners.forEach((lr) => {
      lr.scores.forEach((sc) => {
        if (sc.mode === 'decision') {
          allDecScores.push(sc.pct);
        }
      });
    });

    const avg = allDecScores.length > 0
      ? Math.round(allDecScores.reduce((a, b) => a + b, 0) / allDecScores.length)
      : null;

    const factorCounts: Record<string, number> = {};
    overlookedFactorsLog.forEach((f) => {
      factorCounts[f] = (factorCounts[f] || 0) + 1;
    });

    allLearners.forEach((lr) => {
      lr.weak.forEach((w) => {
        if (w.startsWith('Ignores ')) {
          const factorName = w.replace('Ignores ', '');
          factorCounts[factorName] = (factorCounts[factorName] || 0) + 1;
        }
      });
    });

    let topOverlooked = 'Safety & Reliability';
    let maxCount = 0;
    Object.entries(factorCounts).forEach(([factor, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topOverlooked = factor;
      }
    });

    return {
      avg: avg !== null ? `${avg}%` : 'N/A',
      totalAttempts: allDecScores.length,
      topOverlooked: `Learners ignore ${topOverlooked}`
    };
  }, [allLearners, overlookedFactorsLog]);

  // 5 Dots progress indicator
  const dotProgress = useMemo(() => {
    const totalDots = 5;
    let totalQuestions = 10;
    let currentIdx = currentIndex;

    if (screen === 'patternGame') {
      totalQuestions = activePatterns.length;
      currentIdx = patternIndex;
    } else if (screen === 'decisionGame') {
      totalQuestions = filteredDecisions.length || 1;
      currentIdx = decisionIndex;
    } else if (screen === 'argumentGame') {
      totalQuestions = activeArguments.length || 1;
      currentIdx = argumentIndex;
    } else if (screen === 'fallacyGame') {
      totalQuestions = activeFallacies.length || 1;
      currentIdx = fallacyIndex;
    } else {
      totalQuestions = questions.length || 1;
      currentIdx = currentIndex;
    }

    const progressRatio = totalQuestions > 0 ? (currentIdx + 1) / totalQuestions : 0;
    const activeDots = Math.min(totalDots, Math.max(1, Math.round(progressRatio * totalDots)));
    return { totalDots, activeDots };
  }, [
    currentIndex,
    patternIndex,
    decisionIndex,
    argumentIndex,
    fallacyIndex,
    screen,
    questions.length,
    activePatterns.length,
    filteredDecisions.length,
    activeArguments.length,
    activeFallacies.length
  ]);

  // ==========================================================================
  // RENDER: TEACHER DASHBOARD (DEDICATED FULL SCREEN WITH 4 LESSON COLUMNS)
  // ==========================================================================
  if (screen === 'teacherDashboard') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-4xl mx-auto shadow-sm">
        <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
          <div>
            <header className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 leading-tight">Teacher Dashboard</h1>
                  <p className="text-xs text-slate-500">6-Lesson SHS Diagnostic Portal</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScreen(currentLearner ? 'welcome' : 'login')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Back
                </button>
                <button
                  onClick={handleLockTeacher}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition shadow-xs"
                  title="Lock and clear session"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock</span>
                </button>
              </div>
            </header>

            <div className="mt-4 space-y-4">
              {/* Top Diagnostic Insights: General Weak Area, Decision Diagnostics, and Curriculum */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-700" /> Overall Weak Area
                    </h3>
                    <p className="text-sm sm:text-base font-bold text-amber-900 mt-1">
                      {overallMostCommonWeakArea.topWeak}
                    </p>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-2">
                    All 6 modules &amp; battle history.
                  </p>
                </div>

                <div className="p-4 bg-violet-50 border-2 border-violet-300 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-violet-950 uppercase tracking-wider flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-violet-700" /> L4 Decision Diagnostics
                    </h3>
                    <div className="flex items-baseline justify-between mt-1">
                      <p className="text-base font-black text-violet-950">
                        Avg: <span className="text-violet-700">{decisionStats.avg}</span>
                      </p>
                      <span className="text-[11px] font-semibold text-violet-600">{decisionStats.totalAttempts} runs</span>
                    </div>
                  </div>
                  <div className="mt-2 p-1.5 bg-violet-100/90 rounded-xl text-[11px] font-bold text-violet-900 leading-tight">
                    ⚠️ {decisionStats.topOverlooked}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Curriculum Coverage
                    </h3>
                    <p className="text-sm sm:text-base font-bold text-emerald-900 mt-1">
                      Week 1 (L1 &amp; L2) + Week 2 (L3 &amp; L4) + Week 3 (L5 &amp; L6)
                    </p>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-2">
                    6 Modules: True/False, Venn, Patterns, Decisions, Arguments &amp; Fallacies
                  </p>
                </div>
              </div>

              {/* Metric Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
                  <span className="text-xs text-slate-500 font-semibold">Total Logged Errors</span>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{mistakeAnalysis.totalMistakes}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
                  <span className="text-xs text-slate-500 font-semibold">Registered Learners</span>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{sortedLearners.length}</p>
                </div>
              </div>

              {/* Upgraded Student Roster Table: 6 Lesson Columns + Overall */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Student Performance Matrix (Struggling First)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">6 Lesson Breakdown</span>
                </div>

                {sortedLearners.length === 0 ? (
                  <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    No learners registered yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs max-h-80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-2">Overall</th>
                          <th className="py-2.5 px-2">L1: TF</th>
                          <th className="py-2.5 px-2">L2: Venn</th>
                          <th className="py-2.5 px-2">L3: Pattern</th>
                          <th className="py-2.5 px-2">L4: Decision</th>
                          <th className="py-2.5 px-2">L5: Arg</th>
                          <th className="py-2.5 px-2">L6: Fallacy</th>
                          <th className="py-2.5 px-2">Weak Focus</th>
                          <th className="py-2.5 px-2">Attempts</th>
                          <th className="py-2.5 px-2">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {sortedLearners.map((lr) => {
                          const isStruggling = lr.scores.length > 0 && lr.avg < 50;
                          const getAvgByMode = (m: string) => {
                            const found = lr.scores.filter(s => s.mode === m);
                            if (found.length === 0) return '—';
                            return Math.round(found.reduce((a, b) => a + b.pct, 0) / found.length) + '%';
                          };

                          return (
                            <tr key={lr.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-bold">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{lr.name}</span>
                                  {isStruggling && (
                                    <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded">
                                      Needs Support
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={`py-2.5 px-2 font-black ${isStruggling ? 'text-red-600' : 'text-emerald-700'}`}>
                                {lr.scores.length > 0 ? `${lr.avg}%` : 'N/A'}
                              </td>
                              <td className="py-2.5 px-2 text-slate-700 font-semibold">{getAvgByMode('truefalse')}</td>
                              <td className="py-2.5 px-2 text-slate-700 font-semibold">{getAvgByMode('venn')}</td>
                              <td className="py-2.5 px-2 text-slate-700 font-semibold">{getAvgByMode('pattern')}</td>
                              <td className="py-2.5 px-2 text-slate-700 font-semibold">{getAvgByMode('decision')}</td>
                              <td className="py-2.5 px-2 text-slate-700 font-semibold">{getAvgByMode('argument')}</td>
                              <td className="py-2.5 px-2 text-slate-700 font-semibold">{getAvgByMode('fallacy')}</td>
                              <td className="py-2.5 px-2 text-slate-600">{lr.weak.length > 0 ? lr.weak[0] : 'None'}</td>
                              <td className="py-2.5 px-2 font-semibold text-slate-700">{lr.scores.length}</td>
                              <td className="py-2.5 px-2 text-[10px] text-slate-500">
                                {new Date(lr.lastSeen).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Export CSV, Clear All Data, Back, Lock */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleExportCSV}
                className="h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV (6 Modules)</span>
              </button>

              <button
                onClick={handleClearAllData}
                className="h-12 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Data</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setScreen(currentLearner ? 'welcome' : 'login')}
                className="h-11 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                Back to App
              </button>
              <button
                onClick={handleLockTeacher}
                className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />
      </div>
    );
  }

  // ==========================================================================
  // RENDER: 1. LOGIN SCREEN (ZERO TEACHER UI)
  // ==========================================================================
  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-sm">
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#212121]">LogicMaster SHS</h1>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Interactive Logic, Patterns &amp; Decision Making
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label htmlFor="learnerName" className="block text-sm font-bold text-slate-800 mb-1">
                Enter Learner Name
              </label>
              <input
                id="learnerName"
                type="text"
                value={loginNameInput}
                onChange={(e) => setLoginNameInput(e.target.value)}
                placeholder="e.g. Kwame Mensah"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:ring-4 focus:ring-emerald-200 focus:border-emerald-600 text-base font-semibold text-slate-900 outline-none transition"
                autoFocus
              />
              {loginError && <p className="text-xs font-semibold text-red-600 mt-1.5">{loginError}</p>}
            </div>

            <button
              type="submit"
              className="w-full h-14 bg-[#0B6E4F] hover:bg-[#09573e] active:scale-[0.98] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all focus:ring-4 focus:ring-emerald-300 outline-none"
            >
              <span>CONTINUE</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {allLearners.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">Or select saved learner:</p>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                  {allLearners.slice(0, 6).map((lr) => (
                    <button
                      key={lr.id}
                      type="button"
                      onClick={() => {
                        setLoginNameInput(lr.name);
                        setCurrentLearner(lr);
                        setChallengeP1Name(lr.name);
                        setScreen('welcome');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-xs font-bold text-slate-700 rounded-lg transition-colors border border-slate-200"
                    >
                      {lr.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        <TeacherPinModal
          isOpen={showPinModal}
          onClose={() => {
            setShowPinModal(false);
            setPinInput('');
            setPinError('');
          }}
          pinInput={pinInput}
          setPinInput={setPinInput}
          pinError={pinError}
          onUnlock={handleUnlockTeacher}
        />
      </div>
    );
  }

  // ==========================================================================
  // RENDER: 2. WELCOME SCREEN WITH 2x2 GRID + BOTTOM ROW (ZERO TEACHER UI)
  // ==========================================================================
  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-sm">
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <header className="flex justify-between items-start pt-1 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Hello, {currentLearner?.name || 'Learner'}!
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[11px] text-slate-500 hover:text-red-600 underline"
                  title="Switch Learner"
                >
                  Switch
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#212121] tracking-tight mt-1">
                LogicMaster SHS
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Week 1, Week 2 &amp; Week 3 Core Learning Modules
              </p>
            </div>
          </header>

          {/* 3 ROWS (Week 1 L1 L2, Week 2 L3 L4, Week 3 L5 L6 - 140px height, icon 32px, title 18px bold) */}
          <main className="my-3 space-y-2.5">
            {/* ROW 1: Week 1 Foundations */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Card 1: TRUE/FALSE Lesson 1 */}
              <button
                onClick={() => startLesson('truefalse')}
                className="h-[140px] p-3.5 bg-white hover:bg-emerald-50/50 active:scale-[0.98] border-2 border-emerald-600 rounded-2xl shadow-xs text-left flex flex-col justify-between focus:ring-4 focus:ring-emerald-200 focus:outline-none transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🎮</span>
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase px-1.5 py-0.5 bg-emerald-100 rounded">
                    L1
                  </span>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#212121] leading-tight group-hover:text-emerald-800">
                    TRUE/FALSE
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    17 Statements
                  </p>
                </div>
              </button>

              {/* Card 2: Venn Lesson 2 */}
              <button
                onClick={() => startLesson('venn')}
                className="h-[140px] p-3.5 bg-white hover:bg-amber-50/50 active:scale-[0.98] border-2 border-amber-500 rounded-2xl shadow-xs text-left flex flex-col justify-between focus:ring-4 focus:ring-amber-200 focus:outline-none transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">⭕</span>
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase px-1.5 py-0.5 bg-amber-100 rounded">
                    L2
                  </span>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#212121] leading-tight group-hover:text-amber-900">
                    Venn Diagram
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Overlaps &amp; Sets
                  </p>
                </div>
              </button>
            </div>

            {/* ROW 2: Week 2 Sequences & Decisions */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Card 3: Pattern Master Lesson 3 (Week 2) */}
              <button
                onClick={() => startLesson('pattern')}
                className="h-[140px] p-3.5 bg-white hover:bg-blue-50/50 active:scale-[0.98] border-2 border-blue-600 rounded-2xl shadow-xs text-left flex flex-col justify-between focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all group"
              >
                <div className="flex items-center justify-between">
                  <Binary className="w-8 h-8 text-blue-600" />
                  <span className="text-[10px] font-extrabold text-blue-800 uppercase px-1.5 py-0.5 bg-blue-100 rounded">
                    L3
                  </span>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#212121] leading-tight group-hover:text-blue-900">
                    Pattern Master
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    10 Numerical Sequences
                  </p>
                </div>
              </button>

              {/* Card 4: Decision Maker Lesson 4 (Week 2) */}
              <button
                onClick={() => startLesson('decision')}
                className="h-[140px] p-3.5 bg-white hover:bg-violet-50/50 active:scale-[0.98] border-2 border-violet-600 rounded-2xl shadow-xs text-left flex flex-col justify-between focus:ring-4 focus:ring-violet-200 focus:outline-none transition-all group"
              >
                <div className="flex items-center justify-between">
                  <BrainCircuit className="w-8 h-8 text-violet-600" />
                  <span className="text-[10px] font-extrabold text-violet-800 uppercase px-1.5 py-0.5 bg-violet-100 rounded">
                    L4
                  </span>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#212121] leading-tight group-hover:text-violet-900">
                    Decision Maker
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    12 Real-life Scenarios
                  </p>
                </div>
              </button>
            </div>

            {/* ROW 3: Week 3 Arguments & Fallacies */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Card 5: Argument Builder Lesson 5 (Week 3) */}
              <button
                onClick={() => startLesson('argument')}
                className="h-[140px] p-3.5 bg-white hover:bg-indigo-50/50 active:scale-[0.98] border-2 border-indigo-600 rounded-2xl shadow-xs text-left flex flex-col justify-between focus:ring-4 focus:ring-indigo-200 focus:outline-none transition-all group"
              >
                <div className="flex items-center justify-between">
                  <Scale className="w-8 h-8 text-indigo-600" />
                  <span className="text-[10px] font-extrabold text-indigo-800 uppercase px-1.5 py-0.5 bg-indigo-100 rounded">
                    L5
                  </span>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#212121] leading-tight group-hover:text-indigo-900">
                    Argument Builder
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    If-Then &amp; Syllogisms
                  </p>
                </div>
              </button>

              {/* Card 6: Spot the Fallacy Lesson 6 (Week 3) */}
              <button
                onClick={() => startLesson('fallacy')}
                className="h-[140px] p-3.5 bg-white hover:bg-rose-50/50 active:scale-[0.98] border-2 border-rose-600 rounded-2xl shadow-xs text-left flex flex-col justify-between focus:ring-4 focus:ring-rose-200 focus:outline-none transition-all group"
              >
                <div className="flex items-center justify-between">
                  <SearchCheck className="w-8 h-8 text-rose-600" />
                  <span className="text-[10px] font-extrabold text-rose-800 uppercase px-1.5 py-0.5 bg-rose-100 rounded">
                    L6
                  </span>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#212121] leading-tight group-hover:text-rose-900">
                    Spot the Fallacy
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Ghana Fallacy Detector
                  </p>
                </div>
              </button>
            </div>

            {/* Bottom Row: 2 Cards (Challenge Arena & Create Your Own) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => setScreen('challengeSetup')}
                className="p-3 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl text-left flex items-center gap-2.5 transition-all"
              >
                <span className="text-xl">⚔️</span>
                <div>
                  <h3 className="text-xs font-bold text-indigo-950">Challenge Arena</h3>
                  <p className="text-[10px] text-indigo-700">1v1 &amp; Bot Battle</p>
                </div>
              </button>

              <button
                onClick={() => setScreen('create')}
                className="p-3 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl text-left flex items-center gap-2.5 transition-all"
              >
                <span className="text-xl">✏️</span>
                <div>
                  <h3 className="text-xs font-bold text-purple-950">Create Your Own</h3>
                  <p className="text-[10px] text-purple-700">AI Logic Studio</p>
                </div>
              </button>
            </div>
          </main>

          {/* Quick Stats banner */}
          {currentLearner && currentLearner.scores.length > 0 && (
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Avg: <strong className="text-emerald-800">{currentLearner.avg}%</strong></span>
              <span>Attempts: <strong>{currentLearner.scores.length}</strong></span>
              {currentLearner.weak.length > 0 && (
                <span className="text-red-700 truncate max-w-[120px]">Focus: {currentLearner.weak[0]}</span>
              )}
            </div>
          )}
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        <TeacherPinModal
          isOpen={showPinModal}
          onClose={() => {
            setShowPinModal(false);
            setPinInput('');
            setPinError('');
          }}
          pinInput={pinInput}
          setPinInput={setPinInput}
          pinError={pinError}
          onUnlock={handleUnlockTeacher}
        />
      </div>
    );
  }

  // ==========================================================================
  // RENDER: LESSON 3 - PATTERN MASTER GAME SCREEN
  // ==========================================================================
  if (screen === 'patternGame') {
    return (
      <div className="h-screen max-h-screen overflow-hidden bg-slate-50 flex flex-col justify-between max-w-md mx-auto select-none shadow-sm">
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <header className="flex items-center justify-between pt-1">
            <button
              onClick={() => setScreen('welcome')}
              className="p-2 text-slate-500 hover:text-slate-800 active:scale-95 rounded-lg"
              title="Exit to home"
            >
              <Home className="w-5 h-5" />
            </button>

            {/* Stepper progress dots */}
            <div className="flex items-center gap-2">
              {Array.from({ length: dotProgress.totalDots }).map((_, dIdx) => (
                <div
                  key={dIdx}
                  className={`w-3.5 h-3.5 rounded-full transition-colors ${
                    dIdx < dotProgress.activeDots ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleAppendAIPatterns}
              className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200 transition-all flex items-center gap-1 shadow-2xs"
              title="Generate 10 new AI patterns"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>+ AI</span>
            </button>
          </header>

          <main className="flex-1 flex flex-col justify-center my-2 gap-3 text-center">
            {/* Question Heading: 22px bold #212121 */}
            <h2 className="text-[22px] font-bold text-[#212121]">
              What comes next?
            </h2>

            {/* Sequence Pills display: [2] [4] [6] [8] [?] (No hints or badges) */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 flex-nowrap">
                {currentPattern.seq.map((item, sIdx) => (
                  <div
                    key={sIdx}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl transition-transform ${
                      item === '?'
                        ? 'bg-amber-50 border-2 border-dashed border-amber-500 text-amber-700 animate-pulse'
                        : 'bg-white border-2 border-[#0B6E4F] text-slate-800 shadow-xs'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Hint Box */}
            <AnimatePresence>
              {showPatternHint && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3.5 bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-950 font-semibold text-xs sm:text-sm text-left shadow-xs"
                >
                  💡 <strong>Hint:</strong> Look at the gap between each number. Is it adding, subtracting, or multiplying by a consistent rule?
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Options: 2x2 grid buttons 64px height, text 20px bold */}
          <div className="flex flex-col gap-3 pb-1">
            <div className="grid grid-cols-2 gap-3">
              {currentPattern.options.map((opt) => {
                const isSelected = selectedPatternOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectPatternOption(opt)}
                    disabled={showPatternFeedback}
                    className="h-16 bg-white hover:bg-blue-50/70 border-2 border-blue-600 active:scale-[0.98] text-[20px] font-bold text-blue-950 rounded-xl flex items-center justify-center shadow-xs transition focus:ring-4 focus:ring-blue-200 outline-none disabled:opacity-60"
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer controls: Hint & Speech */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setShowPatternHint((prev) => !prev)}
                className="w-12 h-12 bg-white hover:bg-amber-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-xs text-amber-700 transition"
                title="Show Hint"
              >
                <Lightbulb className="w-6 h-6" />
              </button>

              <span className="text-xs font-semibold text-slate-500">
                Pattern {patternIndex + 1} of {activePatterns.length}
              </span>

              <button
                onClick={() => speakText(`Sequence: ${currentPattern.seq.join(', ')}. What comes next?`)}
                className="w-12 h-12 bg-white hover:bg-blue-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-xs text-blue-800 transition"
                title="Read aloud"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        {showPatternFeedback && isPatternCorrect && <ConfettiRain />}

        {/* Pattern Feedback Slide-Up Sheet */}
        <AnimatePresence>
          {showPatternFeedback && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto p-5 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-2xl font-black ${isPatternCorrect ? 'text-[#0B6E4F]' : 'text-[#D32F2F]'}`}>
                  {isPatternCorrect ? '✓ Correct! 🎉' : '✗ Not quite'}
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-full text-slate-700">
                  Answer: {currentPattern.answer}
                </span>
              </div>

              {/* Show Rule */}
              <p className="text-base font-bold text-slate-800 my-1">
                {currentPattern.rule}
              </p>

              {/* Real World Yellow Box */}
              {currentPattern.realWorld && (
                <div className="my-2.5 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs sm:text-sm font-semibold text-amber-950">
                  <p className="font-extrabold text-amber-900 mb-0.5">🌾 Real life application:</p>
                  <p>{currentPattern.realWorld.story}</p>
                  <p className="mt-1 text-emerald-800 font-extrabold">→ {currentPattern.realWorld.answer}</p>
                </div>
              )}

              <button
                onClick={handleNextPattern}
                className="w-full h-14 mt-3 bg-[#0B6E4F] hover:bg-[#09573e] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-98"
              >
                <span>NEXT PATTERN</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: LESSON 4 - DECISION MAKER GAME SCREEN
  // ==========================================================================
  if (screen === 'decisionGame') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto select-none shadow-sm">
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <header className="flex items-center justify-between pt-1">
            <button
              onClick={() => setScreen('welcome')}
              className="p-2 text-slate-500 hover:text-slate-800 active:scale-95 rounded-lg"
              title="Exit to home"
            >
              <Home className="w-5 h-5" />
            </button>

            {/* Stepper: 5 dots with labels Problem → Options → Factors → Evaluate → Decide */}
            <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase">
              {['Problem', 'Options', 'Factors', 'Evaluate', 'Decide'].map((label, sIdx) => {
                const stepNum = sIdx + 1;
                const isActive = decisionActiveStep === stepNum;
                return (
                  <button
                    key={label}
                    onClick={() => setDecisionActiveStep(stepNum)}
                    className={`px-2 py-0.5 rounded-full transition-all ${
                      isActive ? 'bg-violet-700 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="text-right">
              <span className="text-[11px] font-extrabold text-violet-800 bg-violet-100 px-2 py-0.5 rounded-full">
                {decisionIndex + 1}/{filteredDecisions.length}
              </span>
            </div>
          </header>

          {/* Filter Chips: All | Money | School | Farming | Life + Infinite AI Generator */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-0.5 mt-1 no-scrollbar">
            {(['All', 'Money', 'School', 'Farming', 'Life'] as const).map((chip) => {
              const isSelected = decisionCategoryFilter === chip;
              return (
                <button
                  key={chip}
                  onClick={() => {
                    setDecisionCategoryFilter(chip);
                    setDecisionIndex(0);
                    setShowDecisionFeedback(false);
                    setDecisionSelectedOption(null);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-violet-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {chip}
                </button>
              );
            })}

            <button
              onClick={handleGenerateMoreDecisions}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 transition-all shrink-0 flex items-center gap-1 shadow-2xs"
              title="Generate 4 new AI scenarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>+ AI</span>
            </button>
          </div>

          <main className="my-3 space-y-3">
            {/* Story in white card with 20px text */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 text-left">
              <span className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wider">
                {currentDecision.title}
              </span>
              <p className="text-[20px] font-bold text-[#212121] leading-snug mt-1.5">
                {currentDecision.story}
              </p>
            </div>

            {/* Toggle Factor Table */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowFactorTable((prev) => !prev)}
                className="text-xs font-bold text-violet-800 hover:text-violet-950 flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 rounded-xl"
              >
                <TableProperties className="w-4 h-4" />
                <span>{showFactorTable ? 'Hide Factors Table' : 'Compare Factors Table'}</span>
              </button>
            </div>

            {/* Factor Table (Options vs Factors with color-coded badges) */}
            <AnimatePresence>
              {showFactorTable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="p-3 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-violet-900 uppercase">
                      Decision Factor Matrix
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">Good (Green) · Med (Yellow) · Bad (Red)</span>
                  </div>
                  <div className="overflow-x-auto p-2">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                        <tr>
                          <th className="p-2">Option</th>
                          <th className="p-2">Cost/Resource</th>
                          <th className="p-2">Risk Level</th>
                          <th className="p-2">Expected Return</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {currentDecision.options.map((opt) => (
                          <tr key={opt.id}>
                            <td className="p-2 font-bold text-slate-800">{opt.name}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                opt.costTone === 'good' ? 'bg-green-100 text-green-800' :
                                opt.costTone === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {opt.cost}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                opt.riskTone === 'good' ? 'bg-green-100 text-green-800' :
                                opt.riskTone === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {opt.risk}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                opt.gainTone === 'good' ? 'bg-green-100 text-green-800' :
                                opt.gainTone === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {opt.gain}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Options Cards (min-h-[120px] with factor badges) */}
            <div className="space-y-2.5">
              <span className="block text-xs font-bold text-slate-600 uppercase text-left">
                Choose the Most Logical Strategy:
              </span>
              {currentDecision.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectDecisionOption(opt)}
                  disabled={showDecisionFeedback}
                  className="w-full min-h-[120px] p-4 bg-white hover:bg-violet-50/50 active:scale-[0.99] border-2 border-slate-200 hover:border-violet-600 rounded-2xl shadow-xs text-left flex flex-col justify-between transition focus:ring-4 focus:ring-violet-200 outline-none"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#212121]">{opt.name}</h3>
                    <ArrowRightCircle className="w-5 h-5 text-violet-700" />
                  </div>

                  {/* Factor Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap my-1.5">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      opt.costTone === 'good' ? 'bg-green-100 text-green-800' :
                      opt.costTone === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Cost: {opt.cost}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      opt.riskTone === 'good' ? 'bg-green-100 text-green-800' :
                      opt.riskTone === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Risk: {opt.risk}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    {opt.rationale}
                  </p>
                </button>
              ))}
            </div>

            {/* Hint Box */}
            <AnimatePresence>
              {showDecisionHint && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-950 font-semibold text-xs sm:text-sm text-left shadow-xs"
                >
                  💡 <strong>Guide:</strong> {currentDecision.hint}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-2 pb-1">
            <button
              onClick={() => setShowDecisionHint((prev) => !prev)}
              className="w-12 h-12 bg-white hover:bg-amber-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-xs text-amber-700 transition"
              title="Show Guide"
            >
              <Lightbulb className="w-6 h-6" />
            </button>

            <span className="text-xs font-bold text-slate-700">
              Decision {decisionIndex + 1} of {filteredDecisions.length}
            </span>

            <button
              onClick={() => speakText(currentDecision.story)}
              className="w-12 h-12 bg-white hover:bg-violet-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-xs text-violet-800 transition"
              title="Read aloud"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        {showDecisionFeedback && decisionSelectedOption?.best && <ConfettiRain />}

        {/* Decision Feedback Slide-Up Sheet */}
        <AnimatePresence>
          {showDecisionFeedback && decisionSelectedOption && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto p-5 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xl font-black ${decisionSelectedOption.best ? 'text-[#0B6E4F]' : 'text-amber-700'}`}>
                  {decisionSelectedOption.best ? '✓ Optimal Strategy Chosen! 🎉' : '⚠️ Sub-optimal Trade-off'}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded-full text-slate-700">
                  {decisionSelectedOption.name}
                </span>
              </div>

              {/* Special Recognition for Value-Based Decisions */}
              {decisionSelectedOption.best && (decisionSelectedOption.name.toLowerCase().includes('values') || decisionSelectedOption.id.toLowerCase().includes('values')) && (
                <div className="my-2.5 p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 shadow-xs">
                  <p className="font-extrabold text-sm text-emerald-800 flex items-center gap-1.5">
                    ✅ Excellent thinking! You recognized this depends on values. That's advanced logical reasoning!
                  </p>
                  <p className="text-xs text-emerald-700 mt-1 font-medium">
                    Logical reasoning recognizes that when several sound paths exist, the optimal answer depends on personal aptitude, purpose, and moral priorities rather than a single formula.
                  </p>
                </div>
              )}

              <p className="text-sm font-semibold text-slate-800 my-1">
                {currentDecision.explanation}
              </p>

              {/* Box: Other Perspectives */}
              <div className="my-2.5 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl text-xs font-medium text-amber-950">
                <p className="font-extrabold text-amber-900 mb-0.5">🧠 Other perspectives:</p>
                <p>{currentDecision.alternativePerspective}</p>
              </div>

              <button
                onClick={handleNextDecision}
                className="w-full h-14 mt-2 bg-[#0B6E4F] hover:bg-[#09573e] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-98"
              >
                <span>NEXT SCENARIO</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: LESSON 5 - ARGUMENT BUILDER GAME SCREEN (WEEK 3)
  // ==========================================================================
  if (screen === 'argumentGame') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto select-none shadow-sm">
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <header className="flex items-center justify-between pt-1">
            <button
              onClick={() => setScreen('welcome')}
              className="p-2 text-slate-500 hover:text-slate-800 active:scale-95 rounded-lg"
              title="Exit to home"
            >
              <Home className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5" aria-label="Progress dots">
              {Array.from({ length: dotProgress.totalDots }).map((_, dIdx) => (
                <div
                  key={dIdx}
                  className={`w-3.5 h-3.5 rounded-full transition-colors ${
                    dIdx < dotProgress.activeDots ? 'bg-indigo-700' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                {argumentIndex + 1}/{activeArguments.length}
              </span>
              <button
                onClick={handleAppendAIArguments}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition flex items-center gap-1 shadow-2xs"
                title="Generate 6 new AI arguments"
              >
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>+ AI</span>
              </button>
            </div>
          </header>

          <main className="my-3 space-y-3">
            {/* Visual 2 Premise Cards with → Arrow */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">
                  Deductive Structure: {currentArgument.type}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">P₁ ∧ P₂ ⊨ C</span>
              </div>

              {/* Premise 1 Card */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-left">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-0.5">
                  Premise 1
                </span>
                <p className="text-base font-bold text-slate-900 leading-snug">
                  {currentArgument.premise1}
                </p>
              </div>

              {/* Visual Deduction Arrow */}
              <div className="flex items-center justify-center gap-2 text-indigo-600">
                <div className="h-0.5 w-12 bg-indigo-200" />
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-300 flex items-center justify-center font-black text-xs text-indigo-800">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="h-0.5 w-12 bg-indigo-200" />
              </div>

              {/* Premise 2 Card */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-left">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block mb-0.5">
                  Premise 2
                </span>
                <p className="text-base font-bold text-slate-900 leading-snug">
                  {currentArgument.premise2}
                </p>
              </div>
            </div>

            {/* Question (22px bold #212121) */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Logical Deduction Question
              </span>
              <h2 className="text-[22px] font-bold text-[#212121] leading-snug">
                {currentArgument.q}
              </h2>
            </div>

            {/* 4 Options (64px buttons, 20px bold) */}
            <div className="grid grid-cols-2 gap-2.5">
              {currentArgument.opts.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectArgumentOption(opt)}
                  disabled={showArgumentFeedback}
                  className={`h-16 px-3 bg-white hover:bg-indigo-50/60 active:scale-[0.98] border-2 rounded-2xl shadow-xs flex items-center justify-center text-center transition focus:ring-4 focus:ring-indigo-200 outline-none disabled:opacity-75 ${
                    showArgumentFeedback && opt.trim().toLowerCase() === currentArgument.ans.trim().toLowerCase()
                      ? 'border-[#0B6E4F] bg-green-50 text-green-900'
                      : showArgumentFeedback && selectedArgumentOption === opt
                      ? 'border-[#D32F2F] bg-red-50 text-red-900'
                      : 'border-slate-200 hover:border-indigo-600 text-slate-900'
                  }`}
                >
                  <span className="text-[18px] sm:text-[20px] font-bold leading-tight">
                    {opt}
                  </span>
                </button>
              ))}
            </div>

            {/* Hint Box */}
            <AnimatePresence>
              {showArgumentHint && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-950 font-semibold text-xs sm:text-sm text-left shadow-xs"
                >
                  💡 <strong>Guide:</strong> Look closely at the relation between Premise 1 and Premise 2. Does P guarantee Q, or is there an exception?
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-2 pb-1">
            <button
              onClick={() => setShowArgumentHint((prev) => !prev)}
              className="w-12 h-12 bg-white hover:bg-amber-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-xs text-amber-700 transition"
              title="Show Guide"
            >
              <Lightbulb className="w-6 h-6" />
            </button>

            <span className="text-xs font-bold text-slate-700">
              Argument {argumentIndex + 1} of {activeArguments.length}
            </span>

            <button
              onClick={() => speakText(`${currentArgument.premise1}. ${currentArgument.premise2}. ${currentArgument.q}`)}
              className="w-12 h-12 bg-white hover:bg-indigo-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-xs text-indigo-800 transition"
              title="Read aloud"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        {showArgumentFeedback && isArgumentCorrect && <ConfettiRain />}

        {/* Feedback Slide-Up Sheet */}
        <AnimatePresence>
          {showArgumentFeedback && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto p-5 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-2xl font-black ${isArgumentCorrect ? 'text-[#0B6E4F]' : 'text-[#D32F2F]'}`}>
                  {isArgumentCorrect ? '✓ Valid Deduction! 🎉' : '✗ Invalid Conclusion'}
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-full text-slate-700">
                  Answer: {currentArgument.ans}
                </span>
              </div>

              {/* Visual P -> Q Arrow Badge */}
              <div className="my-2.5 p-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-950 font-medium">
                <div className="px-2 py-0.5 bg-indigo-600 text-white font-mono font-bold rounded">
                  P → Q
                </div>
                <div>
                  <p className="font-extrabold text-indigo-900">Rule: {currentArgument.type}</p>
                  <p className="text-[11px] text-indigo-800">{currentArgument.exp}</p>
                </div>
              </div>

              <button
                onClick={handleNextArgument}
                className="w-full h-14 mt-3 bg-[#0B6E4F] hover:bg-[#09573e] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-98"
              >
                <span>NEXT ARGUMENT</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: LESSON 6 - SPOT THE FALLACY GAME SCREEN (WEEK 3)
  // ==========================================================================
  if (screen === 'fallacyGame') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto select-none shadow-sm">
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <header className="flex items-center justify-between pt-1">
            <button
              onClick={() => setScreen('welcome')}
              className="p-2 text-slate-500 hover:text-slate-800 active:scale-95 rounded-lg"
              title="Exit to home"
            >
              <Home className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5" aria-label="Progress dots">
              {Array.from({ length: dotProgress.totalDots }).map((_, dIdx) => (
                <div
                  key={dIdx}
                  className={`w-3.5 h-3.5 rounded-full transition-colors ${
                    dIdx < dotProgress.activeDots ? 'bg-rose-700' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                {fallacyIndex + 1}/{activeFallacies.length}
              </span>
              <button
                onClick={handleAppendAIFallacies}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition flex items-center gap-1 shadow-2xs"
                title="Generate 6 new AI fallacies"
              >
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>+ AI</span>
              </button>
            </div>
          </header>

          <main className="my-3 space-y-3">
            {/* Quote Card for Statement */}
            <div className="bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-5 shadow-xs text-left relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  Argument Under Inspection
                </span>
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-[19px] sm:text-[20px] font-bold text-[#212121] leading-relaxed italic">
                "{currentFallacy.statement}"
              </p>
            </div>

            {/* Question: 22px bold #212121 */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Logical Validity Check
              </span>
              <h2 className="text-[22px] font-bold text-[#212121] leading-snug">
                {currentFallacy.q}
              </h2>
            </div>

            {/* 4 Options (64px buttons, text includes fallacy names) */}
            <div className="grid grid-cols-2 gap-2.5">
              {currentFallacy.opts.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectFallacyOption(opt)}
                  disabled={showFallacyFeedback}
                  className={`h-16 px-3 bg-white hover:bg-rose-50/60 active:scale-[0.98] border-2 rounded-2xl shadow-xs flex items-center justify-center text-center transition focus:ring-4 focus:ring-rose-200 outline-none disabled:opacity-75 ${
                    showFallacyFeedback && opt.trim().toLowerCase() === currentFallacy.ans.trim().toLowerCase()
                      ? 'border-[#0B6E4F] bg-green-50 text-green-900'
                      : showFallacyFeedback && selectedFallacyOption === opt
                      ? 'border-[#D32F2F] bg-red-50 text-red-900'
                      : 'border-slate-200 hover:border-rose-600 text-slate-900'
                  }`}
                >
                  <span className="text-[16px] sm:text-[18px] font-bold leading-tight">
                    {opt}
                  </span>
                </button>
              ))}
            </div>

            {/* Hint Box */}
            <AnimatePresence>
              {showFallacyHint && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-950 font-semibold text-xs sm:text-sm text-left shadow-xs"
                >
                  💡 <strong>Guide:</strong> Does this claim jump to conclusions (Hasty Generalization), assume false causes (Post Hoc), rely on popularity (Bandwagon), or generalize stereotypes?
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-2 pb-1">
            <button
              onClick={() => setShowFallacyHint((prev) => !prev)}
              className="w-12 h-12 bg-white hover:bg-amber-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-xs text-amber-700 transition"
              title="Show Guide"
            >
              <Lightbulb className="w-6 h-6" />
            </button>

            <span className="text-xs font-bold text-slate-700">
              Fallacy {fallacyIndex + 1} of {activeFallacies.length}
            </span>

            <button
              onClick={() => speakText(`${currentFallacy.statement}. ${currentFallacy.q}`)}
              className="w-12 h-12 bg-white hover:bg-rose-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-xs text-rose-800 transition"
              title="Read aloud"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        {showFallacyFeedback && isFallacyCorrect && <ConfettiRain />}

        {/* Feedback Slide-Up Sheet */}
        <AnimatePresence>
          {showFallacyFeedback && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto p-5 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-2xl font-black ${isFallacyCorrect ? 'text-[#0B6E4F]' : 'text-[#D32F2F]'}`}>
                  {isFallacyCorrect ? '✓ Fallacy Detected! 🎉' : '✗ Fallacy Missed'}
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-full text-slate-700">
                  Diagnosis: {currentFallacy.ans}
                </span>
              </div>

              {/* Fallacy Badge & Ghana Explanation */}
              <div className="my-2.5 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs text-rose-950 font-medium">
                <div className="flex items-center gap-1.5 font-extrabold text-rose-900 mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>Fallacy Type: {currentFallacy.fallacy}</span>
                </div>
                <p className="text-slate-800 font-semibold">{currentFallacy.exp}</p>
              </div>

              <button
                onClick={handleNextFallacy}
                className="w-full h-14 mt-3 bg-[#0B6E4F] hover:bg-[#09573e] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-98"
              >
                <span>NEXT FALLACY</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: RESULTS SCREEN (ALL LESSONS)
  // ==========================================================================
  if (screen === 'results') {
    let totalCount = questions.length || 1;
    let currentScore = score;
    let lessonTitle = "Lesson Complete";

    if (activeLesson === 'pattern') {
      totalCount = activePatterns.length;
      currentScore = patternScore;
      lessonTitle = "Lesson 3: Pattern Master";
    } else if (activeLesson === 'decision') {
      totalCount = filteredDecisions.length || 12;
      currentScore = decisionScore;
      lessonTitle = "Lesson 4: Decision Maker";
    } else if (activeLesson === 'argument') {
      totalCount = activeArguments.length || 6;
      currentScore = argumentScore;
      lessonTitle = "Lesson 5: Argument Builder";
    } else if (activeLesson === 'fallacy') {
      totalCount = activeFallacies.length || 6;
      currentScore = fallacyScore;
      lessonTitle = "Lesson 6: Spot the Fallacy";
    }

    const percentage = Math.round((currentScore / totalCount) * 100);

    let resultMsg = "Don't worry, try again!";
    if (percentage >= 80) {
      resultMsg = "Excellent! 🌟";
    } else if (percentage >= 50) {
      resultMsg = "Good try! Keep practicing 💪";
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-sm">
        <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
          <header className="text-center pt-1">
            <h1 className="text-xl font-bold text-slate-800">{lessonTitle}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Learner: <strong>{currentLearner?.name || 'Student'}</strong> · LogicMaster SHS
            </p>
          </header>

          {/* Big Score Card */}
          <div className="my-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Final Score
            </span>
            <div className="text-5xl font-black text-[#212121] my-2">
              {currentScore}/{totalCount}
            </div>
            <div className="text-3xl font-extrabold text-emerald-700">
              {percentage}%
            </div>
            <p className="text-xl font-bold text-slate-800 mt-2">
              {resultMsg}
            </p>
          </div>

          {/* Pattern Mastery Badge if completed pattern */}
          {activeLesson === 'pattern' && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl mb-3 text-xs text-blue-900 font-semibold text-left">
              <span className="font-bold text-blue-950 uppercase block mb-1">Pattern Types Mastered:</span>
              <div className="flex flex-wrap gap-1.5">
                {masteredPatternTypes.map((type, tIdx) => (
                  <span key={tIdx} className="bg-white border border-blue-300 px-2 py-0.5 rounded-full text-[10px]">
                    ✓ {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            {activeLesson === 'truefalse' && (
              <button
                onClick={handleAppendAITrueFalse}
                className="w-full h-13 bg-purple-700 hover:bg-purple-800 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className="w-5 h-5 text-purple-200" />
                <span>Practice More (10 New AI Questions) 🚀</span>
              </button>
            )}

            {activeLesson === 'venn' && (
              <button
                onClick={handleAppendAIVenn}
                className="w-full h-13 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className="w-5 h-5 text-emerald-200" />
                <span>Practice More (6 New AI Venn Questions) 🚀</span>
              </button>
            )}

            {activeLesson === 'pattern' && (
              <button
                onClick={handleAppendAIPatterns}
                className="w-full h-13 bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className="w-5 h-5 text-blue-200" />
                <span>Practice More (10 New AI Patterns) 🚀</span>
              </button>
            )}

            {activeLesson === 'decision' && (
              <button
                onClick={handleAppendAIDecisions}
                className="w-full h-13 bg-violet-700 hover:bg-violet-800 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className="w-5 h-5 text-violet-200" />
                <span>Practice More (8 New AI Scenarios) 🚀</span>
              </button>
            )}

            {activeLesson === 'argument' && (
              <button
                onClick={handleAppendAIArguments}
                className="w-full h-13 bg-indigo-700 hover:bg-indigo-800 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <span>Generate 10 More AI (Arguments) 🚀</span>
              </button>
            )}

            {activeLesson === 'fallacy' && (
              <button
                onClick={handleAppendAIFallacies}
                className="w-full h-13 bg-rose-700 hover:bg-rose-800 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className="w-5 h-5 text-rose-200" />
                <span>Generate 10 More AI (Fallacies) 🚀</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={restartCurrentLesson}
                className="w-full h-12 bg-[#0B6E4F] hover:bg-[#09573e] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-4 focus:ring-emerald-200 active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                TRY AGAIN
              </button>
              <button
                onClick={() => setScreen('welcome')}
                className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-4 focus:ring-slate-300 active:scale-98"
              >
                <Home className="w-4 h-4" />
                HOME
              </button>
            </div>
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />
      </div>
    );
  }

  // ==========================================================================
  // RENDER: LESSON 1 & 2 QUIZ SCREEN (ZERO TEACHER UI)
  // ==========================================================================
  if (screen === 'quiz') {
    if (!currentQuestion) {
      return (
        <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto">
          <div className="p-6 text-center">
            <p className="text-lg font-bold">No questions available.</p>
            <button onClick={() => setScreen('welcome')} className="mt-4 px-6 py-3 bg-emerald-700 text-white font-bold rounded-xl">
              Return Home
            </button>
          </div>
          <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />
        </div>
      );
    }

    const conceptHighlight = isCorrect
      ? currentQuestion.conceptType === 'ALL'
        ? 'ALL'
        : currentQuestion.conceptType === 'NONE'
        ? 'NONE'
        : 'SOME'
      : null;

    return (
      <div className="h-screen max-h-screen overflow-hidden bg-slate-50 flex flex-col justify-between max-w-md mx-auto select-none shadow-sm">
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <header className="flex items-center justify-between pt-1">
            <button
              onClick={() => setScreen('welcome')}
              className="p-2 text-slate-500 hover:text-slate-800 active:scale-95 rounded-lg"
              title="Exit to home"
            >
              <Home className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2" aria-label="Progress dots">
              {Array.from({ length: dotProgress.totalDots }).map((_, dIdx) => (
                <div
                  key={dIdx}
                  className={`w-3.5 h-3.5 rounded-full transition-colors ${
                    dIdx < dotProgress.activeDots ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="w-9" />
          </header>

          <main className="flex-1 flex flex-col justify-center my-2 gap-3">
            {currentQuestion.mode === 'venn' && currentQuestion.scenario && (
              <div className="flex justify-center">
                <VennDiagram
                  scenario={currentQuestion.scenario}
                  highlightState={showFeedback ? conceptHighlight : null}
                />
              </div>
            )}

            <div className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center min-h-[120px]">
              <p className="text-[22px] font-bold text-[#212121] leading-snug">
                {currentQuestion.text}
              </p>
            </div>

            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3 bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-950 font-semibold text-sm sm:text-base flex items-start gap-2 text-left shadow-sm"
                >
                  <Lightbulb className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Hint:</strong> {currentQuestion.hint}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <div className="flex flex-col gap-3 pb-1">
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleAnswer('TRUE')}
                disabled={showFeedback}
                className="w-full h-[72px] bg-[#0B6E4F] hover:bg-[#09573e] active:scale-[0.98] text-white text-[20px] font-bold rounded-2xl flex items-center justify-center gap-3 shadow-md transition-all focus:ring-4 focus:ring-emerald-300 focus:outline-none disabled:opacity-50"
              >
                <span>TRUE</span>
                <Check className="w-6 h-6 stroke-[3]" />
              </button>

              <button
                onClick={() => handleAnswer('FALSE')}
                disabled={showFeedback}
                className="w-full h-[72px] bg-[#D32F2F] hover:bg-[#b71c1c] active:scale-[0.98] text-white text-[20px] font-bold rounded-2xl flex items-center justify-center gap-3 shadow-md transition-all focus:ring-4 focus:ring-red-300 focus:outline-none disabled:opacity-50"
              >
                <span>FALSE</span>
                <X className="w-6 h-6 stroke-[3]" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setShowHint((prev) => !prev)}
                className="w-12 h-12 bg-white hover:bg-amber-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-sm text-amber-700 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
                title="Show Hint"
              >
                <Lightbulb className="w-6 h-6" />
              </button>

              <span className="text-xs font-semibold text-slate-500">
                Question {currentIndex + 1} of {questions.length}
              </span>

              <button
                onClick={() => speakText(currentQuestion.text)}
                className="w-12 h-12 bg-white hover:bg-emerald-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-sm text-emerald-800 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all"
                title="Read statement aloud"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        {showFeedback && isCorrect && <ConfettiRain />}

        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto p-5 sm:p-6 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-2xl font-black ${isCorrect ? 'text-[#0B6E4F]' : 'text-[#D32F2F]'}`}>
                  {isCorrect ? '✓ Correct! 🎉' : '✗ Not quite'}
                </h3>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-full text-slate-700">
                  Answer: {currentQuestion.answer}
                </span>
              </div>

              <p className="text-base sm:text-lg font-semibold text-slate-800 my-2 leading-snug">
                {currentQuestion.explanation}
              </p>

              {currentQuestion.mode === 'venn' && currentQuestion.scenario && (
                <div className="my-2 p-2 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-medium text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Overlap rule: <strong>{currentQuestion.scenario.overlap}</strong>
                  </span>
                </div>
              )}

              <button
                onClick={handleNextQuestion}
                className="w-full h-14 mt-4 bg-[#0B6E4F] hover:bg-[#09573e] active:scale-[0.98] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all focus:ring-4 focus:ring-emerald-300 focus:outline-none"
              >
                <span>NEXT</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: CREATE-YOUR-OWN SCREEN
  // ==========================================================================
  if (screen === 'create') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-sm">
        <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
          <div>
            <header className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button onClick={() => setScreen('welcome')} className="p-2 text-slate-600 hover:text-slate-900">
                <Home className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-extrabold text-[#212121]">Create-Your-Own Logic</h1>
              <div className="w-8" />
            </header>

            {/* 6 Tabs for Authoring */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-0.5 mt-2 no-scrollbar">
              {[
                { id: 'truefalse' as const, label: '🎮 True/False' },
                { id: 'venn' as const, label: '⭕ Venn' },
                { id: 'pattern' as const, label: '🔢 Pattern' },
                { id: 'decision' as const, label: '🧠 Decision' },
                { id: 'argument' as const, label: '⚖️ Argument' },
                { id: 'fallacy' as const, label: '🔍 Fallacy' }
              ].map((tab) => {
                const isActive = createActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCreateActiveTab(tab.id);
                      setCreateAiGuidance(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      isActive
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="my-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  {createActiveTab === 'argument'
                    ? 'Write Premise & Conclusion Statement:'
                    : createActiveTab === 'fallacy'
                    ? 'Write Fallacious Claim / Reasoning Statement:'
                    : createActiveTab === 'pattern'
                    ? 'Write Number Sequence & Proposed Next Number:'
                    : createActiveTab === 'decision'
                    ? 'Write Practical Decision Dilemma & Strategic Choice:'
                    : createActiveTab === 'venn'
                    ? 'Write Group Relationship / Overlap Statement:'
                    : 'Write Your Logical Statement:'}
                </label>
                <textarea
                  value={createStatementInput}
                  onChange={(e) => setCreateStatementInput(e.target.value)}
                  placeholder={
                    createActiveTab === 'argument'
                      ? 'e.g. If you fetch water daily, the tank gets full. Kofi fetched water daily. Conclusion: Tank is full.'
                      : createActiveTab === 'fallacy'
                      ? 'e.g. My friend bought shoes here and they tore. Therefore, all shoes in this market are bad.'
                      : createActiveTab === 'pattern'
                      ? 'e.g. 5, 10, 15, 20... What comes next?'
                      : createActiveTab === 'decision'
                      ? 'e.g. Transport options: Trotro is cheap but slow; VIP bus is safe and on-time. Best strategy?'
                      : createActiveTab === 'venn'
                      ? 'e.g. Some students in Ghana are also apprentice farmers.'
                      : 'e.g. All boys like football OR Some students study at night'
                  }
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-4 focus:ring-purple-200 outline-none h-24"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                  What is the intended answer?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateAnswerChoice('TRUE')}
                    className={`py-3 font-bold rounded-xl border-2 transition ${
                      createAnswerChoice === 'TRUE'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    TRUE ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateAnswerChoice('FALSE')}
                    className={`py-3 font-bold rounded-xl border-2 transition ${
                      createAnswerChoice === 'FALSE'
                        ? 'bg-red-600 text-white border-red-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    FALSE ✗
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckCustomStatement}
                className="w-full h-12 bg-purple-700 hover:bg-purple-800 active:scale-[0.98] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Check with AI Guide</span>
              </button>

              {createAiGuidance && (
                <div className="p-3.5 bg-purple-50 border-2 border-purple-200 rounded-xl text-xs sm:text-sm font-medium text-purple-950">
                  <p className="font-extrabold text-purple-900 mb-0.5">🤖 AI Guide Feedback:</p>
                  <p>{createAiGuidance}</p>
                </div>
              )}
            </div>

            {savedUserQuestions.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase">
                    Your Saved Questions ({savedUserQuestions.length})
                  </h3>
                  <button
                    onClick={handlePlayCustomQuestions}
                    className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg"
                  >
                    Play My Questions ▶
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedUserQuestions.map((q) => (
                    <div key={q.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <p className="font-bold text-slate-800">{q.text}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>Answer: <strong>{q.answer}</strong></span>
                        <span>·</span>
                        <span className="italic">{q.aiFeedback.slice(0, 45)}…</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />
      </div>
    );
  }

  // ==========================================================================
  // RENDER: CHALLENGE SETUP SCREEN (WITH 3 BATTLE MODES)
  // ==========================================================================
  if (screen === 'challengeSetup') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-sm">
        <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
          <div>
            <header className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button onClick={() => setScreen('welcome')} className="p-2 text-slate-600 hover:text-slate-900">
                <Home className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-extrabold text-[#212121]">Challenge Arena</h1>
              <div className="w-8" />
            </header>

            <div className="my-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="text-center mb-1">
                <span className="text-4xl">⚔️</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Logic Battle</h2>
                <p className="text-xs text-slate-500">First to 5 points wins! (10s countdown timer)</p>
              </div>

              {/* Battle Mode Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Choose Battle Discipline
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChallengeBattleType('truefalse')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      challengeBattleType === 'truefalse'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🎮 True/False
                  </button>
                  <button
                    type="button"
                    onClick={() => setChallengeBattleType('pattern')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      challengeBattleType === 'pattern'
                        ? 'bg-blue-100 text-blue-900 border-blue-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🔢 Patterns
                  </button>
                  <button
                    type="button"
                    onClick={() => setChallengeBattleType('decision')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      challengeBattleType === 'decision'
                        ? 'bg-violet-100 text-violet-900 border-violet-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🧠 Decisions
                  </button>
                  <button
                    type="button"
                    onClick={() => setChallengeBattleType('argument')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      challengeBattleType === 'argument'
                        ? 'bg-indigo-100 text-indigo-900 border-indigo-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚖️ Argument Duel
                  </button>
                  <button
                    type="button"
                    onClick={() => setChallengeBattleType('fallacy')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                      challengeBattleType === 'fallacy'
                        ? 'bg-rose-100 text-rose-900 border-rose-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🔍 Fallacy Duel
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Player 1 Name</label>
                <input
                  type="text"
                  value={challengeP1Name}
                  onChange={(e) => setChallengeP1Name(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Player 2 Name</label>
                <input
                  type="text"
                  value={challengeP2Name}
                  onChange={(e) => setChallengeP2Name(e.target.value)}
                  placeholder="Player 2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => startChallengeGame(false, challengeBattleType)}
                  className="w-full h-14 bg-indigo-700 hover:bg-indigo-800 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Users className="w-5 h-5" />
                  <span>Start 2-Player Battle</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setChallengeP2Name('LogicBot 🤖');
                    startChallengeGame(true, challengeBattleType);
                  }}
                  className="w-full h-14 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <span>Play vs Bot 🤖</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />
      </div>
    );
  }

  // ==========================================================================
  // RENDER: CHALLENGE GAME SCREEN
  // ==========================================================================
  if (screen === 'challengeGame') {
    const isP1Turn = challengeTurn === 'p1';
    const activePlayerName = isP1Turn ? challengeP1Name : challengeIsBot ? 'LogicBot 🤖' : challengeP2Name;

    // Render question according to selected battle type
    let promptTitle = "Target: First to 5 Points";
    let promptText = "";

    if (challengeBattleType === 'truefalse') {
      const curQ = challengeQuestions[challengeQIndex % challengeQuestions.length];
      promptText = curQ.text;
    } else if (challengeBattleType === 'pattern') {
      const curPat = PATTERNS[challengeQIndex % PATTERNS.length];
      promptText = `Sequence: ${curPat.seq.join('  ')}  → What comes next?`;
    } else if (challengeBattleType === 'decision') {
      const curDec = DECISIONS[challengeQIndex % DECISIONS.length];
      promptText = `${curDec.title}: Which strategy is optimal?`;
    } else if (challengeBattleType === 'argument') {
      const curArg = ARGUMENTS[challengeQIndex % ARGUMENTS.length];
      promptText = `"${curArg.premise1}" + "${curArg.premise2}" → ${curArg.q}`;
    } else {
      const curFal = FALLACIES[challengeQIndex % FALLACIES.length];
      promptText = `"${curFal.statement}" → ${curFal.q}`;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-sm">
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <header className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className={`p-2 rounded-xl text-center flex-1 ${isP1Turn ? 'bg-indigo-50 border-2 border-indigo-500' : 'bg-slate-50'}`}>
              <p className="text-xs font-bold text-slate-700 truncate">{challengeP1Name}</p>
              <p className="text-2xl font-black text-indigo-700">{p1Score}</p>
            </div>

            <span className="text-xs font-extrabold px-3 text-slate-400">VS</span>

            <div className={`p-2 rounded-xl text-center flex-1 ${!isP1Turn ? 'bg-purple-50 border-2 border-purple-500' : 'bg-slate-50'}`}>
              <p className="text-xs font-bold text-slate-700 truncate">{challengeIsBot ? 'LogicBot' : challengeP2Name}</p>
              <p className="text-2xl font-black text-purple-700">{p2Score}</p>
            </div>
          </header>

          <div className="my-2 flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-700">
              Turn: <strong className={isP1Turn ? 'text-indigo-700' : 'text-purple-700'}>{activePlayerName}</strong>
            </span>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 rounded-full text-amber-900 font-extrabold text-sm">
              <Clock className="w-4 h-4 text-amber-700 animate-spin" />
              <span>{challengeTimer}s</span>
            </div>
          </div>

          <main className="flex-1 flex flex-col justify-center my-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
              <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider block mb-1">
                {promptTitle} · {challengeBattleType.toUpperCase()} BATTLE
              </span>
              <p className="text-xl font-bold text-[#212121] leading-snug">
                {promptText}
              </p>
            </div>
          </main>

          {/* Action Buttons for current battle mode */}
          <div className="pb-2">
            {challengeBattleType === 'truefalse' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleChallengeAnswer('TRUE')}
                  disabled={challengeRoundFeedback !== null || (challengeTurn === 'p2' && challengeIsBot)}
                  className="h-16 bg-[#0B6E4F] hover:bg-[#09573e] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                >
                  <span>TRUE ✓</span>
                </button>
                <button
                  onClick={() => handleChallengeAnswer('FALSE')}
                  disabled={challengeRoundFeedback !== null || (challengeTurn === 'p2' && challengeIsBot)}
                  className="h-16 bg-[#D32F2F] hover:bg-[#b71c1c] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                >
                  <span>FALSE ✗</span>
                </button>
              </div>
            )}

            {challengeBattleType === 'pattern' && (
              <div className="grid grid-cols-2 gap-2.5">
                {PATTERNS[challengeQIndex % PATTERNS.length].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleChallengeAnswer(opt)}
                    disabled={challengeRoundFeedback !== null || (challengeTurn === 'p2' && challengeIsBot)}
                    className="h-14 bg-white hover:bg-blue-50 border-2 border-blue-600 text-blue-900 text-lg font-bold rounded-xl shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {challengeBattleType === 'decision' && (
              <div className="space-y-2">
                {DECISIONS[challengeQIndex % DECISIONS.length].options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleChallengeAnswer(opt.id)}
                    disabled={challengeRoundFeedback !== null || (challengeTurn === 'p2' && challengeIsBot)}
                    className="w-full py-2.5 px-3 bg-white hover:bg-violet-50 border-2 border-slate-200 hover:border-violet-600 text-xs font-bold text-slate-800 rounded-xl shadow-xs text-left truncate disabled:opacity-50"
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            )}

            {challengeBattleType === 'argument' && (
              <div className="grid grid-cols-2 gap-2.5">
                {ARGUMENTS[challengeQIndex % ARGUMENTS.length].opts.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleChallengeAnswer(opt)}
                    disabled={challengeRoundFeedback !== null || (challengeTurn === 'p2' && challengeIsBot)}
                    className="h-16 px-2 bg-white hover:bg-indigo-50 border-2 border-indigo-600 text-indigo-950 text-sm sm:text-base font-bold rounded-xl shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {challengeBattleType === 'fallacy' && (
              <div className="grid grid-cols-2 gap-2.5">
                {FALLACIES[challengeQIndex % FALLACIES.length].opts.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleChallengeAnswer(opt)}
                    disabled={challengeRoundFeedback !== null || (challengeTurn === 'p2' && challengeIsBot)}
                    className="h-16 px-2 bg-white hover:bg-rose-50 border-2 border-rose-600 text-rose-950 text-xs sm:text-sm font-bold rounded-xl shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        {/* Round Feedback Modal */}
        <AnimatePresence>
          {challengeRoundFeedback && !challengeWinner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center border border-slate-200"
              >
                <h3 className="text-lg font-extrabold text-slate-800">Round Result</h3>
                <p className="text-sm font-semibold text-slate-600 mt-2">{challengeRoundFeedback}</p>
                <button
                  onClick={advanceChallengeRound}
                  className="w-full mt-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
                >
                  Next Question →
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Winner Celebration Modal */}
        <AnimatePresence>
          {challengeWinner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <ConfettiRain />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-6 rounded-3xl shadow-2xl max-w-xs w-full text-center border-4 border-amber-400"
              >
                <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
                <h2 className="text-2xl font-black text-slate-900 mt-2">Battle Winner!</h2>
                <p className="text-xl font-extrabold text-emerald-800 mt-1">{challengeWinner}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Final Score: {p1Score} - {p2Score}
                </p>

                <div className="mt-5 space-y-2">
                  <button
                    onClick={() => startChallengeGame(challengeIsBot, challengeBattleType)}
                    className="w-full py-3 bg-emerald-700 text-white font-bold rounded-xl"
                  >
                    Play Rematch ⚔️
                  </button>
                  <button
                    onClick={() => setScreen('welcome')}
                    className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Back to Menu
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}

// ============================================================================
// TEACHER PIN MODAL
// ============================================================================
interface TeacherPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinInput: string;
  setPinInput: (val: string) => void;
  pinError: string;
  onUnlock: () => void;
}

const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  isOpen,
  onClose,
  pinInput,
  setPinInput,
  pinError,
  onUnlock
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-slate-900">Teacher Access Only</h3>
        <p className="text-xs text-slate-500 mt-1">Enter your 4-digit security PIN</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full text-center text-2xl font-mono tracking-widest py-3 border-2 border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 rounded-xl outline-none"
            autoFocus
          />

          {pinError && (
            <p className="text-xs font-bold text-red-600 animate-shake">{pinError}</p>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className="w-full h-12 bg-[#0B6E4F] hover:bg-[#09573e] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Dashboard</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
