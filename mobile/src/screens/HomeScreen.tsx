import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Workout: undefined;
  Analysis: undefined;
  Profile: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Compete Against Perfection</Text>
        <Text style={styles.heroSubtitle}>
          AI-powered movement analysis meets rhythm-driven training
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Workout')}
        >
          <Text style={styles.actionButtonText}>Start Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Analysis')}
        >
          <Text style={styles.actionButtonText}>Analyze Movement</Text>
        </TouchableOpacity>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>AI Movement Analysis</Text>
          <Text style={styles.featureDescription}>
            Real-time pose detection and form analysis
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Velocity-Based Training</Text>
          <Text style={styles.featureDescription}>
            Track bar speed and performance metrics
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Rhythm-Driven Gameplay</Text>
          <Text style={styles.featureDescription}>
            Train to the beat with dynamic challenges
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Community & Social</Text>
          <Text style={styles.featureDescription}>
            Join challenges and compete on leaderboards
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  heroSection: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  quickActions: {
    padding: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#374151',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresGrid: {
    padding: 20,
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
  },
  featureTitle: {
    color: '#8B5CF6',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
}); 