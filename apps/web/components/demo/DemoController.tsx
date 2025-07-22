import { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';

// Demo scenario types
export type DemoScenario = {
  id: string;
  name: string;
  description: string;
  audience: 'technical' | 'user' | 'business' | 'comparison';
  features: string[];
  demoPath: string;
  mockData: {
    initialScore: number;
    finalScore: number;
    progressSteps: number;
    commonIssues: string[];
    improvements: string[];
  };
};

// Available demo scenarios
export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'beginner-transformation',
    name: 'Beginner Transformation',
    description: 'Journey from basic form issues to perfect technique',
    audience: 'user',
    features: ['Form Analysis', 'Progress Tracking', 'Coaching Feedback'],
    demoPath: '/demos/beginner-squat',
    mockData: {
      initialScore: 45,
      finalScore: 85,
      progressSteps: 4,
      commonIssues: [
        'Knees caving inward',
        'Limited range of motion',
        'Poor balance',
        'Inconsistent tempo'
      ],
      improvements: [
        'Proper knee alignment',
        'Full depth achieved',
        'Stable throughout movement',
        'Consistent controlled tempo'
      ]
    }
  },
  {
    id: 'advanced-optimization',
    name: 'Advanced Performance',
    description: 'Fine-tuning elite athlete performance',
    audience: 'technical',
    features: ['Velocity Tracking', 'Power Output', 'Movement Efficiency'],
    demoPath: '/demos/advanced-deadlift',
    mockData: {
      initialScore: 75,
      finalScore: 95,
      progressSteps: 3,
      commonIssues: [
        'Slight bar path deviation',
        'Minor asymmetry in hip drive',
        'Variable power output'
      ],
      improvements: [
        'Perfect vertical bar path',
        'Balanced hip drive',
        'Consistent power generation'
      ]
    }
  },
  {
    id: 'business-impact',
    name: 'Business Impact',
    description: 'ROI and engagement metrics showcase',
    audience: 'business',
    features: ['User Engagement', 'Retention Metrics', 'Revenue Impact'],
    demoPath: '/demos/business-metrics',
    mockData: {
      initialScore: 0,
      finalScore: 100,
      progressSteps: 4,
      commonIssues: [
        'Low user engagement',
        'High churn rate',
        'Limited revenue streams'
      ],
      improvements: [
        '85% user engagement',
        '92% retention rate',
        'Multiple revenue channels'
      ]
    }
  },
  {
    id: 'competitive-advantage',
    name: 'Competitive Edge',
    description: 'Velox vs traditional training comparison',
    audience: 'comparison',
    features: ['AI Analysis', 'Real-time Feedback', 'Progress Tracking'],
    demoPath: '/demos/comparison',
    mockData: {
      initialScore: 50,
      finalScore: 90,
      progressSteps: 3,
      commonIssues: [
        'Delayed feedback',
        'Inconsistent tracking',
        'Limited data insights'
      ],
      improvements: [
        'Instant AI feedback',
        'Precise progress tracking',
        'Rich performance data'
      ]
    }
  }
];

// Demo context
type DemoContextType = {
  currentScenario: DemoScenario | null;
  setCurrentScenario: (scenario: DemoScenario) => void;
  demoSpeed: number;
  setDemoSpeed: (speed: number) => void;
  isAutoPlay: boolean;
  setIsAutoPlay: (autoPlay: boolean) => void;
  resetDemo: () => void;
  takeScreenshot: () => Promise<string>;
  isRecording: boolean;
  toggleRecording: () => void;
};

const DemoContext = createContext<DemoContextType | null>(null);

export const useDemoController = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoController must be used within a DemoProvider');
  }
  return context;
};

export function DemoController({ children }: { children: React.ReactNode }) {
  const [currentScenario, setCurrentScenario] = useState<DemoScenario | null>(null);
  const [demoSpeed, setDemoSpeed] = useState(1);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const router = useRouter();

  // Handle auto-play progression
  useEffect(() => {
    let progressionTimer: NodeJS.Timeout;

    if (isAutoPlay && currentScenario) {
      progressionTimer = setTimeout(() => {
        // Auto progress to next section or scenario
        // Implementation depends on your navigation structure
      }, 5000 / demoSpeed);
    }

    return () => {
      if (progressionTimer) {
        clearTimeout(progressionTimer);
      }
    };
  }, [isAutoPlay, currentScenario, demoSpeed]);

  const resetDemo = () => {
    setCurrentScenario(null);
    setIsAutoPlay(false);
    setDemoSpeed(1);
    router.push('/demo');
  };

  const takeScreenshot = async (): Promise<string> => {
    // Implement screenshot functionality
    // This is a placeholder - actual implementation would depend on your requirements
    return 'screenshot.png';
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement recording functionality
  };

  return (
    <DemoContext.Provider
      value={{
        currentScenario,
        setCurrentScenario,
        demoSpeed,
        setDemoSpeed,
        isAutoPlay,
        setIsAutoPlay,
        resetDemo,
        takeScreenshot,
        isRecording,
        toggleRecording
      }}
    >
      <div className="demo-container">
        {/* Admin Controls - Hidden by default */}
        <div className="fixed top-4 right-4 z-50 opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-black/80 p-4 rounded-lg space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className="btn btn-sm"
              >
                {isAutoPlay ? 'Pause' : 'Auto-Play'}
              </button>
              <select
                value={demoSpeed}
                onChange={(e) => setDemoSpeed(Number(e.target.value))}
                className="select select-sm"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
              <button
                onClick={toggleRecording}
                className="btn btn-sm"
              >
                {isRecording ? 'Stop Recording' : 'Record'}
              </button>
              <button
                onClick={resetDemo}
                className="btn btn-sm btn-outline"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </div>
    </DemoContext.Provider>
  );
} 