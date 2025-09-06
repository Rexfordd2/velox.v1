'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/app/_trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// Simple switch fallback
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`inline-flex h-6 w-10 items-center rounded-full ${checked ? 'bg-green-500' : 'bg-gray-400'}`}
    >
      <span className={`h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { applyFieldErrors } from '@/lib/errors';

const settingsSchema = z.object({
  notifications: z.object({
    workoutReminders: z.boolean(),
    achievementAlerts: z.boolean(),
    weeklyProgress: z.boolean(),
  }),
  camera: z.object({
    quality: z.enum(['low', 'medium', 'high']),
    frameRate: z.enum(['30', '60']),
  }),
  privacy: z.object({
    shareProgress: z.boolean(),
    publicProfile: z.boolean(),
  }),
});

type SettingsSchema = z.infer<typeof settingsSchema>;

interface ProfileSettingsProps {
  initialData: SettingsSchema;
}

export function ProfileSettings({ initialData }: ProfileSettingsProps) {
  const { toast } = useToast();
  const utils = trpc.useContext();

  const form = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const { mutate: updateSettings, isPending } = trpc.profile.updateSettings.useMutation({
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Your preferences have been saved successfully.',
      });
      utils.profile.getMe.invalidate();
    },
    onError: (error) => {
      applyFieldErrors(form.setError, error);
      toast({
        title: 'Error',
        description: (error as any)?.data?.message || (error as any)?.message || 'Failed to update',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SettingsSchema) => {
    updateSettings(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Notifications */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="notifications.workoutReminders"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Workout Reminders</FormLabel>
                    <FormDescription>
                      Get notified when it's time for your scheduled workout
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifications.achievementAlerts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Achievement Alerts</FormLabel>
                    <FormDescription>
                      Receive notifications when you earn new badges or break records
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifications.weeklyProgress"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Weekly Progress</FormLabel>
                    <FormDescription>
                      Get a weekly summary of your workout progress
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Camera Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Camera Settings</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="camera.quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Quality</FormLabel>
                  <FormDescription>
                    Higher quality requires more processing power
                  </FormDescription>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low (480p)</SelectItem>
                      <SelectItem value="medium">Medium (720p)</SelectItem>
                      <SelectItem value="high">High (1080p)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="camera.frameRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frame Rate</FormLabel>
                  <FormDescription>
                    Higher frame rates provide smoother motion tracking
                  </FormDescription>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frame rate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30">30 FPS</SelectItem>
                      <SelectItem value="60">60 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Privacy</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="privacy.shareProgress"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Share Progress</FormLabel>
                    <FormDescription>
                      Allow friends to see your workout progress
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privacy.publicProfile"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Public Profile</FormLabel>
                    <FormDescription>
                      Make your profile visible to everyone
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Card>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </Form>
  );
} 