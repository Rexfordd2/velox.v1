'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/app/_trpc/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MovementSelect } from './MovementSelect';

const challengeSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  movementId: z.string().uuid(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

type ChallengeSchema = z.infer<typeof challengeSchema>;

interface ChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  username?: string;
}

export function ChallengeDialog({
  open,
  onOpenChange,
  userId,
  username,
}: ChallengeDialogProps) {
  const utils = trpc.useUtils();
  const createChallenge = trpc.challenges.create.useMutation({
    onSuccess: () => {
      utils.challenges.getAll.invalidate();
      form.reset();
      onOpenChange(false);
    },
  });

  const form = useForm<ChallengeSchema>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: username ? `Challenge with ${username}` : '',
      description: '',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 7 days from now
    },
  });

  const onSubmit = (data: ChallengeSchema) => {
    if (!userId) return;
    
    createChallenge.mutate({
      ...data,
      participantId: userId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Challenge {username || 'Friend'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="movementId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movement</FormLabel>
                  <FormControl>
                    <MovementSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createChallenge.status === 'pending' || !userId}
            >
              {createChallenge.status === 'pending' ? 'Creating...' : 'Create Challenge'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 