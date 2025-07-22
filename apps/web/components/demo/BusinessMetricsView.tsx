import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { demoService } from '../../lib/services/demoService';

type MetricCard = {
  title: string;
  value: number;
  unit: string;
  trend?: number;
  description: string;
};

export function BusinessMetricsView() {
  const [metrics, setMetrics] = useState<{
    userEngagement: MetricCard[];
    performance: MetricCard[];
    business: MetricCard[];
  }>({
    userEngagement: [],
    performance: [],
    business: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBusinessMetrics() {
      const data = await demoService.getBusinessMetrics();
      
      setMetrics({
        userEngagement: [
          {
            title: 'Daily Active Users',
            value: data.userEngagement.dailyActiveUsers,
            unit: 'users',
            trend: 25,
            description: 'Active users performing workouts daily'
          },
          {
            title: 'Avg. Session Duration',
            value: data.userEngagement.averageSessionDuration,
            unit: 'minutes',
            trend: 15,
            description: 'Time spent per training session'
          },
          {
            title: 'Retention Rate',
            value: data.userEngagement.retentionRate,
            unit: '%',
            trend: 40,
            description: '30-day user retention rate'
          }
        ],
        performance: [
          {
            title: 'Form Improvement',
            value: data.performance.averageFormImprovement,
            unit: '%',
            trend: 65,
            description: 'Average form quality improvement'
          },
          {
            title: 'Injury Prevention',
            value: data.performance.injuryPreventionRate,
            unit: '%',
            trend: 92,
            description: 'Reduction in form-related injuries'
          },
          {
            title: 'User Satisfaction',
            value: data.performance.userSatisfaction,
            unit: '/5',
            trend: 20,
            description: 'Average user rating'
          }
        ],
        business: [
          {
            title: 'Monthly Revenue',
            value: data.business.monthlyRecurringRevenue,
            unit: 'USD',
            trend: 150,
            description: 'Monthly recurring revenue'
          },
          {
            title: 'Acquisition Cost',
            value: data.business.customerAcquisitionCost,
            unit: 'USD',
            trend: -30,
            description: 'Cost per customer acquisition'
          },
          {
            title: 'Customer LTV',
            value: data.business.lifetimeValue,
            unit: 'USD',
            trend: 85,
            description: 'Customer lifetime value'
          }
        ]
      });
      
      setIsLoading(false);
    }

    loadBusinessMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const MetricSection = ({ title, cards }: { title: string; cards: MetricCard[] }) => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">{card.title}</h3>
              {card.trend && (
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    card.trend > 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {card.trend > 0 ? '+' : ''}{card.trend}%
                </span>
              )}
            </div>
            <div className="text-3xl font-bold mb-2">
              {typeof card.value === 'number' && card.unit === 'USD'
                ? `$${card.value.toLocaleString()}`
                : `${card.value}${card.unit}`
              }
            </div>
            <p className="text-sm text-gray-400">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Business Impact</h1>
        <p className="text-xl text-gray-400">
          Key metrics demonstrating Velox's market potential and growth
        </p>
      </div>

      <MetricSection title="User Engagement" cards={metrics.userEngagement} />
      <MetricSection title="Performance Impact" cards={metrics.performance} />
      <MetricSection title="Business Metrics" cards={metrics.business} />

      {/* Market Opportunity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-gray-800 rounded-xl p-8 mt-12"
      >
        <h2 className="text-2xl font-bold mb-6">Market Opportunity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Target Market</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                85M+ gym members in target markets
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                $96B global fitness market
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                32% YoY growth in digital fitness
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Growth Strategy</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Partnership with major gym chains
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                B2B integration for trainers
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                International market expansion
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 