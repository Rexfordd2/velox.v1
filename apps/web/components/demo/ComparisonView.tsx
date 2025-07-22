import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { demoService } from '../../lib/services/demoService';

type ComparisonMetric = {
  label: string;
  veloxValue: number | string;
  traditionalValue: number | string;
  unit?: string;
  improvement?: number;
};

export function ComparisonView() {
  const [metrics, setMetrics] = useState<ComparisonMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadComparisonData() {
      const data = await demoService.getComparisonData();
      
      const formattedMetrics: ComparisonMetric[] = [
        {
          label: 'Time to Master Form',
          veloxValue: data.velox.timeToMastery,
          traditionalValue: data.traditional.timeToMastery,
          improvement: 75 // (8-2)/8 * 100
        },
        {
          label: 'Form Accuracy Rate',
          veloxValue: data.velox.accurateFormRate,
          traditionalValue: data.traditional.accurateFormRate,
          unit: '%',
          improvement: 46 // (95-65)/65 * 100
        },
        {
          label: 'Injury Prevention',
          veloxValue: data.velox.injuryPreventionRate,
          traditionalValue: data.traditional.injuryPreventionRate,
          unit: '%',
          improvement: 104 // (92-45)/45 * 100
        },
        {
          label: 'Progress Rate',
          veloxValue: data.velox.progressionRate,
          traditionalValue: data.traditional.progressionRate,
          unit: '%',
          improvement: 113 // (85-40)/40 * 100
        }
      ];

      setMetrics(formattedMetrics);
      setIsLoading(false);
    }

    loadComparisonData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Velox vs Traditional Training</h2>
        <p className="text-gray-400">
          See how Velox AI-powered training compares to traditional methods
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold mb-4">{metric.label}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Velox */}
              <div className="space-y-2">
                <div className="text-sm text-purple-400">Velox AI</div>
                <div className="text-3xl font-bold text-purple-500">
                  {metric.veloxValue}{metric.unit}
                </div>
              </div>

              {/* Traditional */}
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Traditional</div>
                <div className="text-3xl font-bold text-gray-500">
                  {metric.traditionalValue}{metric.unit}
                </div>
              </div>
            </div>

            {metric.improvement && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Improvement</span>
                  <span className="text-lg font-semibold text-green-500">
                    +{metric.improvement}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, metric.improvement)}%` }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    className="h-full bg-green-500"
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Real-time Feedback</h3>
          <p className="text-gray-400">
            Get instant form corrections and adjustments during your workout,
            instead of waiting for your next training session.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Data-Driven Progress</h3>
          <p className="text-gray-400">
            Track your improvements with precise metrics and analytics,
            helping you understand exactly where to focus your efforts.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Injury Prevention</h3>
          <p className="text-gray-400">
            AI analysis detects potential form issues before they lead to
            injuries, keeping you safe and consistent in your training.
          </p>
        </motion.div>
      </div>
    </div>
  );
} 