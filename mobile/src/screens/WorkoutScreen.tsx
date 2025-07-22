import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Workout: undefined;
  Analysis: undefined;
  Profile: undefined;
};

type WorkoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Workout'>;

export default function WorkoutScreen() {
  const navigation = useNavigation<WorkoutScreenNavigationProp>();
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  const workouts = [
    {
      id: '1',
      name: 'Squat Challenge',
      description: 'Perfect your squat form with AI analysis',
      duration: '30 min',
      difficulty: 'Intermediate',
    },
    {
      id: '2',
      name: 'Deadlift Mastery',
      description: 'Master the deadlift with real-time feedback',
      duration: '45 min',
      difficulty: 'Advanced',
    },
    {
      id: '3',
      name: 'Bench Press Pro',
      description: 'Improve your bench press technique',
      duration: '30 min',
      difficulty: 'Intermediate',
    },
    {
      id: '4',
      name: 'Olympic Lifts',
      description: 'Perfect your clean and jerk form',
      duration: '60 min',
      difficulty: 'Advanced',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Workout</Text>
        <Text style={styles.subtitle}>
          Select a workout to begin your training session
        </Text>
      </View>

      <View style={styles.workoutList}>
        {workouts.map((workout) => (
          <TouchableOpacity
            key={workout.id}
            style={[
              styles.workoutCard,
              selectedWorkout === workout.id && styles.selectedWorkout,
            ]}
            onPress={() => setSelectedWorkout(workout.id)}
          >
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutName}>{workout.name}</Text>
              <Text style={styles.workoutDuration}>{workout.duration}</Text>
            </View>
            <Text style={styles.workoutDescription}>{workout.description}</Text>
            <View style={styles.workoutFooter}>
              <Text style={styles.workoutDifficulty}>{workout.difficulty}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          !selectedWorkout && styles.startButtonDisabled,
        ]}
        disabled={!selectedWorkout}
        onPress={() => {
          // Navigate to workout session
          console.log('Starting workout:', selectedWorkout);
        }}
      >
        <Text style={styles.startButtonText}>Start Workout</Text>
      </TouchableOpacity>
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
  workoutList: {
    padding: 20,
    gap: 16,
  },
  workoutCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWorkout: {
    borderColor: '#7C3AED',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  workoutDuration: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  workoutDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  workoutDifficulty: {
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