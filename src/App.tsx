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
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

interface StatementItem {
  id: number;
  text: string;
  answer: 'TRUE' | 'FALSE';
  level: 'Easy' | 'Medium' | 'Hard';
  explanation: string;
  hint: string;
  mode: 'truefalse';
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
  mode: string;
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
}

interface ChallengeHistoryItem {
  id: string;
  date: string;
  player1: string;
  player2: string;
  p1Score: number;
  p2Score: number;
  winner: string;
}

const DEFAULT_TEACHER_PIN = '9411';

// ============================================================================
// SINGLE SOURCE OF TRUTH: STATEMENTS & VENN SCENARIOS
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

// Helper to deduce concept category
function getConceptCategory(text: string): 'ALL' | 'SOME' | 'NONE' | 'GENERAL' {
  const upper = text.toUpperCase();
  if (upper.includes('ALL') || upper.includes('EVERY')) return 'ALL';
  if (upper.includes('SOME') || upper.includes('MIGHT')) return 'SOME';
  if (upper.includes('NO ') || upper.includes('CANNOT') || upper.includes('NEVER')) return 'NONE';
  return 'GENERAL';
}

// Infinite AI Questions Generator (100% Offline logic)
function generateAIQuestions(n = 10): PlayableQuestion[] {
  const groups = [
    'Students in school',
    'Farmers in Ghana',
    'Teachers in West Africa',
    'Market traders in town',
    'Drivers in Accra',
    'Footballers',
    'Carpenters',
    'Tailors in Kumasi',
    'Children in school',
    'Fishermen on the Volta Lake'
  ];

  const activities = [
    'grow cassava',
    'wake up before 5am',
    'like mathematics',
    'eat fufu on Sundays',
    'play football after work',
    'travel by bus',
    'speak both English and Twi',
    'study late at night',
    'own a smartphone',
    'drink water every day'
  ];

  const facts = [
    { text: 'Accra is the capital of Ghana', answer: 'TRUE' as const, exp: 'Accra has been the capital city since 1877.' },
    { text: 'A triangle has 4 equal corners', answer: 'FALSE' as const, exp: 'A triangle has only 3 angles and 3 sides.' },
    { text: 'Lake Volta is located in Ghana', answer: 'TRUE' as const, exp: 'Lake Volta is the largest reservoir in Ghana.' },
    { text: 'The sun rises in the West', answer: 'FALSE' as const, exp: 'The sun rises in the East and sets in the West.' },
    { text: 'All living creatures need water to survive', answer: 'TRUE' as const, exp: 'Water is essential for cellular life.' },
    { text: 'A square has four right angles', answer: 'TRUE' as const, exp: 'Each corner of a square measures exactly 90 degrees.' },
    { text: '12 is an odd number', answer: 'FALSE' as const, exp: '12 is divisible by 2 with no remainder, so it is even.' },
    { text: 'Fish can live and breathe outside water', answer: 'FALSE' as const, exp: 'Fish breathe through gills and require water.' },
    { text: 'Lake Bosumtwi is a natural lake in Ghana', answer: 'TRUE' as const, exp: 'Lake Bosumtwi is a renowned natural lake in the Ashanti Region.' }
  ];

  const generated: PlayableQuestion[] = [];

  for (let i = 0; i < n; i++) {
    const qType = Math.floor(Math.random() * 3);
    const grp = groups[Math.floor(Math.random() * groups.length)];
    const act = activities[Math.floor(Math.random() * activities.length)];

    if (qType === 0) {
      generated.push({
        id: `ai-all-${Date.now()}-${i}`,
        text: `All ${grp.toLowerCase()} ${act}`,
        answer: 'FALSE',
        explanation: `Not ALL do this. Some do, but others do not. 'ALL' means 100%.`,
        hint: `Does EVERY single person do this without exception?`,
        mode: 'ai',
        conceptType: 'ALL',
        level: 'Medium'
      });
    } else if (qType === 1) {
      generated.push({
        id: `ai-some-${Date.now()}-${i}`,
        text: `Some ${grp.toLowerCase()} ${act}`,
        answer: 'TRUE',
        explanation: `'SOME' means at least one or more. That is true here.`,
        hint: `'SOME' means at least one person does.`,
        mode: 'ai',
        conceptType: 'SOME',
        level: 'Easy'
      });
    } else {
      const fact = facts[Math.floor(Math.random() * facts.length)];
      generated.push({
        id: `ai-fact-${Date.now()}-${i}`,
        text: fact.text,
        answer: fact.answer,
        explanation: fact.exp,
        hint: `Think carefully about geography, science, or shapes.`,
        mode: 'ai',
        conceptType: 'GENERAL',
        level: 'Medium'
      });
    }
  }

  return generated;
}

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

        {/* Left Circle */}
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

        {/* Right Circle */}
        <motion.circle
          cx={isNone ? 240 : 220}
          cy="100"
          r="78"
          fill="#FFF8E1"
          stroke="#FFC107"
          strokeWidth="3"
        />

        {/* Overlap area (Intersection) */}
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

        {/* Left Circle Text */}
        <text
          x={isNone ? 80 : 85}
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-800 text-[12px] font-bold"
        >
          {scenario.left}
        </text>

        {/* Right Circle Text */}
        <text
          x={isNone ? 260 : 255}
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-800 text-[12px] font-bold"
        >
          {scenario.right.length > 14 ? `${scenario.right.slice(0, 12)}…` : scenario.right}
        </text>

        {/* Overlap Text */}
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
  // Screens: 'login' | 'welcome' | 'quiz' | 'results' | 'create' | 'challengeSetup' | 'challengeGame' | 'teacherDashboard'
  const [screen, setScreen] = useState<'login' | 'welcome' | 'quiz' | 'results' | 'create' | 'challengeSetup' | 'challengeGame' | 'teacherDashboard'>('login');
  const [activeLesson, setActiveLesson] = useState<'truefalse' | 'venn' | 'custom' | 'ai'>('truefalse');
  
  // Current logged in learner
  const [currentLearner, setCurrentLearner] = useState<LearnerProfile | null>(null);
  const [loginNameInput, setLoginNameInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Quiz state
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
  
  // Hidden Teacher Access & PIN Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [allLearners, setAllLearners] = useState<LearnerProfile[]>([]);

  // Create-Your-Own state
  const [createStatementInput, setCreateStatementInput] = useState('');
  const [createAnswerChoice, setCreateAnswerChoice] = useState<'TRUE' | 'FALSE' | null>(null);
  const [createAiGuidance, setCreateAiGuidance] = useState<string | null>(null);
  const [savedUserQuestions, setSavedUserQuestions] = useState<CustomQuestion[]>([]);

  // Challenge Mode state
  const [challengeP1Name, setChallengeP1Name] = useState('Player 1');
  const [challengeP2Name, setChallengeP2Name] = useState('Player 2');
  const [challengeIsBot, setChallengeIsBot] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [challengeTurn, setChallengeTurn] = useState<'p1' | 'p2'>('p1');
  const [challengeQIndex, setChallengeQIndex] = useState(0);
  const [challengeTimer, setChallengeTimer] = useState(10);
  const [p1TempAnswer, setP1TempAnswer] = useState<string | null>(null);
  const [p2TempAnswer, setP2TempAnswer] = useState<string | null>(null);
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
    } catch {
      // Safe fallback
    }

    // Check if initial URL has #teacher hash
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
        const curQ = challengeQuestions[challengeQIndex % challengeQuestions.length];
        const isBotCorrect = Math.random() < 0.75;
        const botChoice = isBotCorrect ? curQ.answer : curQ.answer === 'TRUE' ? 'FALSE' : 'TRUE';
        handleChallengeAnswer(botChoice);
      }, 1200);

      return () => clearTimeout(botTimeout);
    }
  }, [screen, challengeTurn, challengeIsBot, challengeRoundFeedback, challengeWinner, challengeQIndex]);

  // Prepare questions list for current quiz
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

  const currentQuestion: PlayableQuestion | undefined = questions[currentIndex];

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

  const updateLearnerHistory = (finalScore: number, total: number) => {
    if (!currentLearner) return;

    try {
      const pct = Math.round((finalScore / (total || 1)) * 100);
      const newScoreItem: LearnerScoreItem = {
        date: new Date().toLocaleDateString(),
        mode: activeLesson,
        score: finalScore,
        total,
        pct
      };

      const updatedScores = [...currentLearner.scores, newScoreItem];
      const avg = Math.round(updatedScores.reduce((acc, curr) => acc + curr.pct, 0) / updatedScores.length);

      const weakSet = new Set<string>(currentLearner.weak || []);
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
  // QUIZ HANDLING
  // --------------------------------------------------------------------------
  const startLesson = (lesson: 'truefalse' | 'venn' | 'custom' | 'ai') => {
    setActiveLesson(lesson);
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
    setScreen('quiz');
    setCurrentIndex(0);
    setScore(0);
    setWrongAnswers([]);
    setShowHint(false);
    setShowFeedback(false);
    setLastUserAnswer(null);
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
      updateLearnerHistory(score, total);
      setScreen('results');
    }
  };

  const handleAppendAIQuestions = () => {
    const newQuestions = generateAIQuestions(10);
    setAiExtraQuestions((prev) => [...prev, ...newQuestions]);
    setCurrentIndex(questions.length);
    setScreen('quiz');
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
  const startChallengeGame = (isBot: boolean) => {
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

  const handleChallengeAnswer = (answer: string) => {
    if (challengeRoundFeedback || challengeWinner) return;

    const currentChallengeQ = challengeQuestions[challengeQIndex % challengeQuestions.length];

    if (challengeTurn === 'p1') {
      setP1TempAnswer(answer);
      setChallengeTurn('p2');
      setChallengeTimer(10);
    } else {
      setP2TempAnswer(answer);

      const p1Correct = p1TempAnswer === currentChallengeQ.answer;
      const p2Correct = answer === currentChallengeQ.answer;

      const newP1Score = p1Score + (p1Correct ? 1 : 0);
      const newP2Score = p2Score + (p2Correct ? 1 : 0);

      setP1Score(newP1Score);
      setP2Score(newP2Score);

      let roundMsg = `Correct answer was ${currentChallengeQ.answer}! `;
      if (p1Correct && p2Correct) {
        roundMsg += `Both scored a point! 🎯`;
      } else if (p1Correct) {
        roundMsg += `${challengeP1Name} scored! ⚡`;
      } else if (p2Correct) {
        roundMsg += `${challengeIsBot ? 'LogicBot' : challengeP2Name} scored! ⚡`;
      } else {
        roundMsg += `Neither player scored.`;
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
    if (pinInput.trim() === DEFAULT_TEACHER_PIN) {
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
    // Return to learner experience
    if (currentLearner) {
      setScreen('welcome');
    } else {
      setScreen('login');
    }
  };

  // Sorted Learners: Struggling first (lowest avg score ascending)
  const sortedLearners = useMemo(() => {
    return [...allLearners].sort((a, b) => a.avg - b.avg);
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

  // Export CSV functionality
  const handleExportCSV = () => {
    const headers = ['Name', 'Average Score (%)', 'Weak Area', 'Attempts', 'Last Seen'];
    const rows = sortedLearners.map((lr) => [
      `"${lr.name.replace(/"/g, '""')}"`,
      lr.scores.length > 0 ? lr.avg : 'N/A',
      `"${(lr.weak.length > 0 ? lr.weak[0] : 'None').replace(/"/g, '""')}"`,
      lr.scores.length,
      `"${new Date(lr.lastSeen).toLocaleDateString().replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `logicmaster_learners_${Date.now()}.csv`);
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
      setAllLearners([]);
      setHistoricalWrong([]);
      setWrongAnswers([]);
      setCurrentLearner(null);
      handleLockTeacher();
    }
  };

  // 5 Dots progress indicator
  const dotProgress = useMemo(() => {
    const totalDots = 5;
    const progressRatio = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;
    const activeDots = Math.min(totalDots, Math.max(1, Math.round(progressRatio * totalDots)));
    return { totalDots, activeDots };
  }, [currentIndex, questions.length]);

  // ==========================================================================
  // RENDER: TEACHER DASHBOARD (DEDICATED FULL SCREEN)
  // ==========================================================================
  if (screen === 'teacherDashboard') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-xl mx-auto shadow-sm">
        <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
          <div>
            {/* Teacher Top Bar */}
            <header className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 leading-tight">Teacher Dashboard</h1>
                  <p className="text-xs text-slate-500">Student Progress &amp; Diagnostics</p>
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
              {/* Diagnostic Key Insight */}
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-xs">
                <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                  Diagnostic Summary
                </h3>
                <p className="text-base font-bold text-amber-900 mt-0.5">
                  Common Mistakes: ALL vs SOME ({mistakeAnalysis.allVsSomeCount} students failed)
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Students struggle distinguishing universal quantifiers (100%) from particular quantifiers (at least one exists).
                </p>
              </div>

              {/* Metric Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
                  <span className="text-xs text-slate-500 font-semibold">Total Errors Logged</span>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{mistakeAnalysis.totalMistakes}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
                  <span className="text-xs text-slate-500 font-semibold">Negation Errors</span>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{mistakeAnalysis.negationCount}</p>
                </div>
              </div>

              {/* Student Roster Table (Struggling First) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Learner Records ({sortedLearners.length} Registered)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">Sorted: Struggling First</span>
                </div>

                {sortedLearners.length === 0 ? (
                  <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    No learners registered yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs max-h-72">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-2">Avg %</th>
                          <th className="py-2.5 px-2">Weak Area</th>
                          <th className="py-2.5 px-2">Attempts</th>
                          <th className="py-2.5 px-2">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {sortedLearners.map((lr) => {
                          const isStruggling = lr.scores.length > 0 && lr.avg < 50;
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
                              <td className="py-2.5 px-2 text-slate-600">
                                {lr.weak.length > 0 ? lr.weak[0] : 'None'}
                              </td>
                              <td className="py-2.5 px-2 font-semibold text-slate-700">
                                {lr.scores.length}
                              </td>
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
                <span>Export CSV</span>
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
          {/* Clean Header Branding (NO teacher toggle) */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-[#212121]">LogicMaster SHS</h1>
            <p className="text-sm font-medium text-slate-600 mt-1">
              Learn TRUE/FALSE &amp; Venn Diagrams
            </p>
          </div>

          {/* Login Card */}
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

            {/* CONTINUE Button: 56px height, #0B6E4F */}
            <button
              type="submit"
              className="w-full h-14 bg-[#0B6E4F] hover:bg-[#09573e] active:scale-[0.98] text-white text-lg font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all focus:ring-4 focus:ring-emerald-300 outline-none"
            >
              <span>CONTINUE</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Returning learners quick select */}
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

        {/* Hidden PIN Modal */}
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
  // RENDER: 2. WELCOME SCREEN (ZERO TEACHER UI)
  // ==========================================================================
  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto shadow-sm">
        <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
          {/* Top Bar with Learner greeting ONLY (Zero Teacher UI) */}
          <header className="flex justify-between items-start pt-1 pb-3 border-b border-slate-200">
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
              <p className="text-sm font-medium text-slate-600">
                Learn TRUE/FALSE &amp; Venn Diagrams
              </p>
            </div>
          </header>

          {/* Core Lessons Cards */}
          <main className="my-4 space-y-4">
            {/* Card 1: TRUE or FALSE Game */}
            <button
              onClick={() => startLesson('truefalse')}
              className="w-full min-h-[140px] p-5 bg-white hover:bg-emerald-50/40 active:scale-[0.98] border-2 border-emerald-600 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between focus:ring-4 focus:ring-emerald-200 focus:outline-none group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                    Lesson 1
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#212121] mt-0.5 group-hover:text-emerald-800 transition-colors">
                    🎮 TRUE or FALSE Game
                  </h2>
                </div>
                <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                17 Statements with real-life facts. Master "ALL" vs "SOME".
              </p>
            </button>

            {/* Card 2: Venn Diagram Master */}
            <button
              onClick={() => startLesson('venn')}
              className="w-full min-h-[140px] p-5 bg-white hover:bg-amber-50/40 active:scale-[0.98] border-2 border-[#FFC107] rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between focus:ring-4 focus:ring-amber-200 focus:outline-none group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                    Lesson 2
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#212121] mt-0.5 group-hover:text-amber-900 transition-colors">
                    ⭕ Venn Diagram Master
                  </h2>
                </div>
                <span className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                Interactive 2-circle Venn logic. Master Overlaps, Sets, and Deductions.
              </p>
            </button>

            {/* Additional Features Strip */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setScreen('challengeSetup')}
                className="p-3.5 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl text-left flex flex-col justify-between transition-all"
              >
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-sm">
                  <Swords className="w-4 h-4 text-indigo-600" />
                  <span>Challenge</span>
                </div>
                <p className="text-[11px] text-indigo-700 font-medium mt-1">
                  1v1 Battle or Play vs Bot (10s timer)
                </p>
              </button>

              <button
                onClick={() => setScreen('create')}
                className="p-3.5 bg-purple-50 hover:bg-purple-100/70 border border-purple-200 rounded-xl text-left flex flex-col justify-between transition-all"
              >
                <div className="flex items-center gap-1.5 text-purple-900 font-bold text-sm">
                  <PlusCircle className="w-4 h-4 text-purple-600" />
                  <span>Create-Your-Own</span>
                </div>
                <p className="text-[11px] text-purple-700 font-medium mt-1">
                  Write statements &amp; check with AI Guide
                </p>
              </button>
            </div>
          </main>

          {/* Quick Stats banner */}
          {currentLearner && currentLearner.scores.length > 0 && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>Avg Score: <strong className="text-emerald-800">{currentLearner.avg}%</strong></span>
              <span>Quizzes Taken: <strong>{currentLearner.scores.length}</strong></span>
              {currentLearner.weak.length > 0 && (
                <span className="text-red-700">Focus: {currentLearner.weak[0]}</span>
              )}
            </div>
          )}
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        {/* Hidden PIN Modal */}
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
  // RENDER: 3. RESULTS SCREEN
  // ==========================================================================
  if (screen === 'results') {
    const totalCount = questions.length || 1;
    const percentage = Math.round((score / totalCount) * 100);

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
            <h1 className="text-xl font-bold text-slate-800">Lesson Complete</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Learner: <strong>{currentLearner?.name || 'Student'}</strong> · Logical Reasoning Practice
            </p>
          </header>

          {/* Big Score Card */}
          <div className="my-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Final Score
            </span>
            <div className="text-5xl font-black text-[#212121] my-2">
              {score}/{totalCount}
            </div>
            <div className="text-3xl font-extrabold text-emerald-700">
              {percentage}%
            </div>
            <p className="text-xl font-bold text-slate-800 mt-2">
              {resultMsg}
            </p>
          </div>

          {/* Review Mistakes Section */}
          {wrongAnswers.length > 0 ? (
            <div className="flex-1 overflow-y-auto mb-3 bg-white p-3.5 rounded-xl border border-slate-200 max-h-48">
              <h2 className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Questions to Review ({wrongAnswers.length})
              </h2>
              <div className="space-y-2.5">
                {wrongAnswers.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-red-50/60 rounded-lg text-left border border-red-100">
                    <p className="text-xs font-bold text-slate-800">{item.text}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="text-red-700 font-semibold">Your choice: {item.userAnswer}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-800 font-bold">Correct: {item.correctAnswer}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 italic">{item.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center mb-3">
              <p className="text-sm font-bold text-emerald-800">
                🎉 Perfect! No mistakes in this lesson!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleAppendAIQuestions}
              className="w-full h-13 bg-purple-700 hover:bg-purple-800 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Sparkles className="w-5 h-5 text-purple-200" />
              <span>Practice More (10 New AI Questions) 🚀</span>
            </button>

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

        {/* Hidden PIN Modal */}
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
  // RENDER: 4. QUESTION SCREEN (QUIZ - ZERO TEACHER UI)
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
          {/* Top Header: Home & 5 Progress Dots ONLY (NO teacher toggle) */}
          <header className="flex items-center justify-between pt-1">
            <button
              onClick={() => setScreen('welcome')}
              className="p-2 text-slate-500 hover:text-slate-800 active:scale-95 rounded-lg"
              title="Exit to home"
            >
              <Home className="w-5 h-5" />
            </button>

            {/* 5 Dots Progress indicator ●●○○○ */}
            <div className="flex items-center gap-2" aria-label="Progress dots">
              {Array.from({ length: dotProgress.totalDots }).map((_, dIdx) => (
                <div
                  key={dIdx}
                  className={`w-3.5 h-3.5 rounded-full transition-colors ${
                    dIdx < dotProgress.activeDots ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                  aria-label={`Progress step ${dIdx + 1}`}
                />
              ))}
            </div>

            {/* Clean empty balance spacer so dots remain centered */}
            <div className="w-9" />
          </header>

          {/* Main Question Display */}
          <main className="flex-1 flex flex-col justify-center my-2 gap-3">
            {currentQuestion.mode === 'venn' && currentQuestion.scenario && (
              <div className="flex justify-center">
                <VennDiagram
                  scenario={currentQuestion.scenario}
                  highlightState={showFeedback ? conceptHighlight : null}
                />
              </div>
            )}

            {/* Font statement: 22px bold #212121, in white card with 24px padding, rounded 16px, shadow */}
            <div className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center min-h-[120px]">
              <p className="text-[22px] font-bold text-[#212121] leading-snug">
                {currentQuestion.text}
              </p>
            </div>

            {/* Yellow Hint Box */}
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

          {/* Answer Buttons Section */}
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

            {/* Footer buttons: Hint (💡) and Audio (🔊) 48x48px */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setShowHint((prev) => !prev)}
                className="w-12 h-12 bg-white hover:bg-amber-50 active:scale-95 border border-slate-300 rounded-xl flex items-center justify-center shadow-sm text-amber-700 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
                title="Show Hint"
                aria-label="Show Hint"
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
                aria-label="Read statement aloud"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <AppFooter onTriggerHiddenTeacher={() => setShowPinModal(true)} />

        {/* Confetti celebration for correct answers */}
        {showFeedback && isCorrect && <ConfettiRain />}

        {/* Slide-up feedback sheet */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto p-5 sm:p-6 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3
                  className={`text-2xl font-black flex items-center gap-2 ${
                    isCorrect ? 'text-[#0B6E4F]' : 'text-[#D32F2F]'
                  }`}
                >
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

        {/* Hidden PIN Modal */}
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
  // RENDER: 5. CREATE-YOUR-OWN SCREEN
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

            <div className="my-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  Write Your Logical Statement:
                </label>
                <textarea
                  value={createStatementInput}
                  onChange={(e) => setCreateStatementInput(e.target.value)}
                  placeholder="e.g. All boys like football OR Some students study at night"
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

        {/* Hidden PIN Modal */}
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
  // RENDER: 6. CHALLENGE SETUP SCREEN
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
              <h1 className="text-lg font-extrabold text-[#212121]">1v1 Challenge Battle</h1>
              <div className="w-8" />
            </header>

            <div className="my-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="text-center mb-2">
                <span className="text-4xl">⚔️</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Logic Showdown</h2>
                <p className="text-xs text-slate-500">First player to reach 5 points wins! (10s per question)</p>
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

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => startChallengeGame(false)}
                  className="w-full h-14 bg-indigo-700 hover:bg-indigo-800 active:scale-[0.98] text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Users className="w-5 h-5" />
                  <span>Start 2-Player Battle</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setChallengeP2Name('LogicBot 🤖');
                    startChallengeGame(true);
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

        {/* Hidden PIN Modal */}
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
  // RENDER: 7. CHALLENGE GAME SCREEN
  // ==========================================================================
  if (screen === 'challengeGame') {
    const curQ = challengeQuestions[challengeQIndex % challengeQuestions.length];
    const isP1Turn = challengeTurn === 'p1';
    const activePlayerName = isP1Turn ? challengeP1Name : challengeIsBot ? 'LogicBot 🤖' : challengeP2Name;

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
              <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                Target: First to 5 Points
              </span>
              <p className="text-xl sm:text-2xl font-bold text-[#212121] mt-2 leading-snug">
                {curQ.text}
              </p>
            </div>
          </main>

          <div className="grid grid-cols-2 gap-3 pb-2">
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
                <h2 className="text-2xl font-black text-slate-900 mt-2">Winner!</h2>
                <p className="text-xl font-extrabold text-emerald-800 mt-1">{challengeWinner}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Final Score: {p1Score} - {p2Score}
                </p>

                <div className="mt-5 space-y-2">
                  <button
                    onClick={() => startChallengeGame(challengeIsBot)}
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

        {/* Hidden PIN Modal */}
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
