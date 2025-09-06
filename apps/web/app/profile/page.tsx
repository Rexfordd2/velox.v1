'use client';

import { useState } from 'react';
import { trpc } from '@/app/_trpc/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SavedWorkouts } from './components/SavedWorkouts';
import { ProfileSettings } from './components/ProfileSettings';
import { WorkoutHistory } from './components/WorkoutHistory';
import { ProgressCharts } from './components/ProgressCharts';
import { PersonalBests } from './components/PersonalBests';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: profile, isLoading, error, refetch } = trpc.profile.getMe.useQuery();

  if (isLoading) return <LoadingState variant="detail" />;
  if (error) return <ErrorState onRetry={() => void refetch()} />;

  if (!profile) return <EmptyState title="Profile not found" description="Please check back later." />;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
          <AvatarFallback>{profile.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <p className="text-gray-500">{profile.bio || 'No bio yet'}</p>
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.user_badges?.length || 0}</p>
              <p className="text-sm text-gray-500">Badges</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {profile.workout_count || 0}
              </p>
              <p className="text-sm text-gray-500">Workouts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {profile.total_exercise_minutes || 0}
              </p>
              <p className="text-sm text-gray-500">Minutes</p>
            </div>
          </div>
        </div>
        <Button variant="outline">Edit Profile</Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Workout History</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <SavedWorkouts />
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Personal Bests</h2>
              <PersonalBests />
            </Card>
          </div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Progress Overview</h2>
            <ProgressCharts />
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <WorkoutHistory />
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card className="p-6">
            <ProgressCharts detailed />
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6">
            <ProfileSettings initialData={profile} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 