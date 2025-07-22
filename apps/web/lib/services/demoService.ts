import { DemoScenario } from '../../components/demo/DemoController';

// Mock analysis result types
export type MockAnalysisResult = {
  score: number;
  confidence: number;
  metrics: {
    [key: string]: number;
  };
  feedback: string[];
  timestamp: number;
};

// Demo video metadata
export type DemoVideo = {
  id: string;
  url: string;
  exerciseType: string;
  duration: number;
  thumbnailUrl: string;
  perfectForm: boolean;
  metrics: {
    [key: string]: number;
  };
};

// Cache for demo videos
const demoVideoCache = new Map<string, DemoVideo>();

// Demo videos by exercise type
const DEMO_VIDEOS: DemoVideo[] = [
  {
    id: 'squat-perfect',
    url: '/demos/squat/perfect-form.mp4',
    exerciseType: 'squat',
    duration: 15,
    thumbnailUrl: '/demos/squat/perfect-form-thumb.jpg',
    perfectForm: true,
    metrics: {
      depth: 0.95,
      kneeAlignment: 0.98,
      backAngle: 0.96,
      stability: 0.97
    }
  },
  {
    id: 'squat-common-issues',
    url: '/demos/squat/common-issues.mp4',
    exerciseType: 'squat',
    duration: 15,
    thumbnailUrl: '/demos/squat/common-issues-thumb.jpg',
    perfectForm: false,
    metrics: {
      depth: 0.65,
      kneeAlignment: 0.70,
      backAngle: 0.75,
      stability: 0.68
    }
  },
  {
    id: 'deadlift-perfect',
    url: '/demos/deadlift/perfect-form.mp4',
    exerciseType: 'deadlift',
    duration: 15,
    thumbnailUrl: '/demos/deadlift/perfect-form-thumb.jpg',
    perfectForm: true,
    metrics: {
      hipHinge: 0.98,
      barPath: 0.97,
      backAngle: 0.96,
      lockout: 0.99
    }
  }
];

class DemoService {
  private progressCache = new Map<string, MockAnalysisResult[]>();

  /**
   * Get a demo video by exercise type and form quality
   */
  async getDemoVideo(exerciseType: string, perfectForm = true): Promise<DemoVideo | null> {
    const cacheKey = `${exerciseType}-${perfectForm}`;
    
    if (demoVideoCache.has(cacheKey)) {
      return demoVideoCache.get(cacheKey)!;
    }

    const video = DEMO_VIDEOS.find(v => 
      v.exerciseType === exerciseType && v.perfectForm === perfectForm
    );

    if (video) {
      demoVideoCache.set(cacheKey, video);
    }

    return video || null;
  }

  /**
   * Generate mock analysis results for a demo scenario
   */
  async generateMockAnalysis(scenario: DemoScenario, step: number): Promise<MockAnalysisResult> {
    const { initialScore, finalScore, progressSteps } = scenario.mockData;
    const scoreIncrement = (finalScore - initialScore) / (progressSteps - 1);
    const currentScore = initialScore + (scoreIncrement * step);

    return {
      score: currentScore,
      confidence: 0.85 + (0.14 * (step / (progressSteps - 1))),
      metrics: {
        formQuality: 40 + (60 * (step / (progressSteps - 1))),
        consistency: 30 + (70 * (step / (progressSteps - 1))),
        efficiency: 20 + (80 * (step / (progressSteps - 1)))
      },
      feedback: scenario.mockData.improvements.slice(0, step + 1),
      timestamp: Date.now()
    };
  }

  /**
   * Get progress data for a demo scenario
   */
  async getProgressData(scenario: DemoScenario): Promise<MockAnalysisResult[]> {
    if (this.progressCache.has(scenario.id)) {
      return this.progressCache.get(scenario.id)!;
    }

    const results: MockAnalysisResult[] = [];
    for (let i = 0; i < scenario.mockData.progressSteps; i++) {
      results.push(await this.generateMockAnalysis(scenario, i));
    }

    this.progressCache.set(scenario.id, results);
    return results;
  }

  /**
   * Clear cached data
   */
  clearCache() {
    demoVideoCache.clear();
    this.progressCache.clear();
  }

  /**
   * Get comparison data between Velox and traditional training
   */
  async getComparisonData() {
    return {
      velox: {
        timeToMastery: '2 weeks',
        accurateFormRate: 95,
        injuryPreventionRate: 92,
        progressionRate: 85
      },
      traditional: {
        timeToMastery: '8 weeks',
        accurateFormRate: 65,
        injuryPreventionRate: 45,
        progressionRate: 40
      }
    };
  }

  /**
   * Get business metrics for demo
   */
  async getBusinessMetrics() {
    return {
      userEngagement: {
        dailyActiveUsers: 15000,
        averageSessionDuration: 35,
        retentionRate: 85
      },
      performance: {
        averageFormImprovement: 65,
        injuryPreventionRate: 92,
        userSatisfaction: 4.8
      },
      business: {
        monthlyRecurringRevenue: 75000,
        customerAcquisitionCost: 25,
        lifetimeValue: 450
      }
    };
  }
}

export const demoService = new DemoService(); 