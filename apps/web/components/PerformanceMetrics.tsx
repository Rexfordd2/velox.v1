import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface MetricProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color?: string;
}

interface PerformanceMetricsProps {
  metrics: MetricProps[];
  showTargets?: boolean;
  className?: string;
}

const MetricCard = ({ label, value, target, unit = '%', color = 'purple' }: MetricProps) => {
  const percentage = (value / target) * 100;
  const colorClass = `text-${color}-500`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-200">{label}</h3>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`text-2xl font-bold ${colorClass}`}
        >
          {value.toFixed(1)}{unit}
        </motion.span>
      </div>
      
      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-sm text-gray-400">
          <span>Current</span>
          <span>Target: {target}{unit}</span>
        </div>
      </div>
    </motion.div>
  );
};

export function PerformanceMetrics({
  metrics,
  showTargets = true,
  className = ''
}: PerformanceMetricsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <MetricCard {...metric} />
        </motion.div>
      ))}
    </div>
  );
}

// Animated circular progress component for additional visualization
export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'purple'
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      initial={{ rotate: -90 }}
      animate={{ rotate: 270 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1f2937"
        strokeWidth={strokeWidth}
      />
      
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`var(--${color}-500)`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        strokeLinecap="round"
      />
      
      {/* Percentage text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className={`text-${color}-500 font-bold text-xl`}
      >
        {value}%
      </text>
    </motion.svg>
  );
} 