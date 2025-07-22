import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDemoController, DemoScenario, DEMO_SCENARIOS } from './DemoController';

// Progress step type
type ProgressStep = {
  step: number;
  score: number;
  improvements: string[];
  metrics: {
    formQuality: number;
    consistency: number;
    efficiency: number;
  };
};

export function DemoScenarioView() {
  const {
    currentScenario,
    setCurrentScenario,
    demoSpeed,
    isAutoPlay,
  } = useDemoController();

  const [currentStep, setCurrentStep] = useState(0);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);

  // Generate progress steps when scenario changes
  useEffect(() => {
    if (!currentScenario) return;

    const steps: ProgressStep[] = [];
    const totalSteps = currentScenario.mockData.progressSteps;
    const scoreIncrement = (currentScenario.mockData.finalScore - currentScenario.mockData.initialScore) / (totalSteps - 1);

    for (let i = 0; i < totalSteps; i++) {
      steps.push({
        step: i + 1,
        score: currentScenario.mockData.initialScore + (scoreIncrement * i),
        improvements: currentScenario.mockData.improvements.slice(0, i + 1),
        metrics: {
          formQuality: 40 + (60 * (i / (totalSteps - 1))),
          consistency: 30 + (70 * (i / (totalSteps - 1))),
          efficiency: 20 + (80 * (i / (totalSteps - 1))),
        }
      });
    }

    setProgressSteps(steps);
  }, [currentScenario]);

  // Auto-progress through steps
  useEffect(() => {
    if (!isAutoPlay || !progressSteps.length) return;

    const timer = setTimeout(() => {
      if (currentStep < progressSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }, 3000 / demoSpeed);

    return () => clearTimeout(timer);
  }, [currentStep, isAutoPlay, demoSpeed, progressSteps.length]);

  if (!currentScenario) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {DEMO_SCENARIOS.map((scenario) => (
          <motion.div
            key={scenario.id}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800 rounded-xl p-6 cursor-pointer"
            onClick={() => setCurrentScenario(scenario)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">{scenario.name}</h3>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                {scenario.audience}
              </span>
            </div>
            <p className="text-gray-400 mb-4">{scenario.description}</p>
            <div className="space-y-2">
              {scenario.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  const currentProgress = progressSteps[currentStep];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">{currentScenario.name}</h2>
          <p className="text-gray-400">{currentScenario.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentStep(0)}
            className="btn btn-sm"
            disabled={currentStep === 0}
          >
            Restart
          </button>
          <div className="flex items-center space-x-2">
            {progressSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Video/Visual Section */}
        <motion.div
          key={`video-${currentStep}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl aspect-video"
        >
          {/* Video player or visualization would go here */}
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Demo Video Placeholder
          </div>
        </motion.div>

        {/* Metrics Section */}
        <div className="space-y-6">
          {/* Overall Score */}
          <motion.div
            key={`score-${currentStep}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Overall Score</h3>
            <div className="text-5xl font-bold text-purple-500">
              {Math.round(currentProgress.score)}
            </div>
          </motion.div>

          {/* Metrics */}
          <motion.div
            key={`metrics-${currentStep}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              {Object.entries(currentProgress.metrics).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span>{Math.round(value)}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Improvements */}
          <motion.div
            key={`improvements-${currentStep}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Improvements</h3>
            <ul className="space-y-3">
              {currentProgress.improvements.map((improvement, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center text-sm"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  {improvement}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 