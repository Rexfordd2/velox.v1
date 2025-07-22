import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAnalytics } from '../lib/analytics';
import { FeedbackModal } from '../components/FeedbackModal';

type RootStackParamList = {
  Home: undefined;
  Workout: undefined;
  Analysis: undefined;
  Profile: undefined;
};

type AnalysisScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Analysis'>;

export default function AnalysisScreen() {
  const navigation = useNavigation<AnalysisScreenNavigationProp>();
  const analytics = useAnalytics();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);

  useEffect(() => {
    // Track screen view
    analytics.trackScreen('Analysis', 'AnalysisScreen');
  }, []);

  const exercises = [
    {
      id: '1',
      name: 'Squat Analysis',
      description: 'Analyze your squat form and get real-time feedback',
      metrics: ['Knee Angle', 'Hip Depth', 'Back Angle'],
    },
    {
      id: '2',
      name: 'Deadlift Analysis',
      description: 'Get feedback on your deadlift technique',
      metrics: ['Hip Hinge', 'Back Position', 'Bar Path'],
    },
    {
      id: '3',
      name: 'Bench Press Analysis',
      description: 'Perfect your bench press form',
      metrics: ['Bar Path', 'Shoulder Position', 'Elbow Angle'],
    },
    {
      id: '4',
      name: 'Clean Analysis',
      description: 'Analyze your clean technique',
      metrics: ['First Pull', 'Second Pull', 'Catch Position'],
    },
  ];

  const handleExerciseSelect = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    const exercise = exercises.find(e => e.id === exerciseId);
    if (exercise) {
      analytics.logEvent('exercise_selected', {
        exercise_id: exerciseId,
        exercise_name: exercise.name,
      });
    }
  };

  const startAnalysis = async () => {
    if (!selectedExercise) return;

    const exercise = exercises.find(e => e.id === selectedExercise);
    if (!exercise) return;

    try {
      const startTime = Date.now();
      setAnalysisStartTime(startTime);

      // Track workout start
      await analytics.trackWorkout('STARTED', {
        exercise_id: selectedExercise,
        exercise_name: exercise.name,
        metrics: exercise.metrics,
      });

      // Mark performance start
      analytics.markPerformanceMetric('analysis_start', performance.now(), {
        exercise_id: selectedExercise,
        exercise_name: exercise.name,
      });

      // Navigate to analysis session
      console.log('Starting analysis:', selectedExercise);
      
    } catch (error) {
      analytics.trackError({
        error: error as Error,
        context: {
          screen: 'AnalysisScreen',
          action: 'startAnalysis',
          exercise_id: selectedExercise,
        },
      });
    }
  };

  const handleAnalysisComplete = async () => {
    if (!selectedExercise || !analysisStartTime) return;

    const exercise = exercises.find(e => e.id === selectedExercise);
    if (!exercise) return;

    try {
      const endTime = Date.now();
      const duration = endTime - analysisStartTime;

      // Track workout completion
      await analytics.trackWorkout('COMPLETED', {
        exercise_id: selectedExercise,
        exercise_name: exercise.name,
        duration_ms: duration,
      });

      // Mark performance end
      analytics.markPerformanceMetric('analysis_complete', performance.now(), {
        exercise_id: selectedExercise,
        exercise_name: exercise.name,
        duration_ms: duration,
      });

      // Show feedback modal
      setShowFeedback(true);
    } catch (error) {
      analytics.trackError({
        error: error as Error,
        context: {
          screen: 'AnalysisScreen',
          action: 'completeAnalysis',
          exercise_id: selectedExercise,
        },
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Movement Analysis</Text>
        <Text style={styles.subtitle}>
          Select an exercise to analyze your form
        </Text>
      </View>

      <View style={styles.exerciseList}>
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[
              styles.exerciseCard,
              selectedExercise === exercise.id && styles.selectedExercise,
            ]}
            onPress={() => handleExerciseSelect(exercise.id)}
          >
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
            </View>
            <Text style={styles.exerciseDescription}>
              {exercise.description}
            </Text>
            <View style={styles.metricsContainer}>
              {exercise.metrics.map((metric, index) => (
                <View key={index} style={styles.metricTag}>
                  <Text style={styles.metricText}>{metric}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          !selectedExercise && styles.startButtonDisabled,
        ]}
        disabled={!selectedExercise}
        onPress={startAnalysis}
      >
        <Text style={styles.startButtonText}>Start Analysis</Text>
      </TouchableOpacity>

      <FeedbackModal
        isVisible={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  exerciseList: {
    padding: 20,
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedExercise: {
    borderColor: '#7C3AED',
  },
  exerciseHeader: {
    marginBottom: 8,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricTag: {
    backgroundColor: '#4B5563',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  metricText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#7C3AED',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 