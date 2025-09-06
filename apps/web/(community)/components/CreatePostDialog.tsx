'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/app/_trpc/client';
import { useToast } from '@/components/ui/use-toast';
import { applyFieldErrors } from '@/lib/errors';
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
import { Textarea } from '@/components/ui/textarea';
import { WorkoutSelect } from './WorkoutSelect';

const createPostSchema = z.object({
  content: z.string().min(1).max(500),
  workoutId: z.string().uuid().optional(),
});

type CreatePostSchema = z.infer<typeof createPostSchema>;

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const createPost = trpc.posts.create.useMutation({
    onMutate: async (variables) => {
      await utils.posts.getInfiniteFeed.cancel();
      const prev = utils.posts.getInfiniteFeed.getInfiniteData({});

      const optimisticPost = {
        id: `temp-${Date.now()}`,
        content: (variables as any)?.content ?? '',
        created_at: new Date().toISOString(),
        user: { id: 'me', username: 'You', avatar_url: '' },
        workout: undefined,
        _count: { comments: 0 },
      } as any;

      utils.posts.getInfiniteFeed.setInfiniteData({}, (data) => {
        if (!data) return data;
        const [first, ...rest] = data.pages;
        const newFirst = { ...first, posts: [optimisticPost, ...first.posts] };
        return { ...data, pages: [newFirst, ...rest] } as typeof data;
      });

      return { prev };
    },
    onError: (error, _variables, context) => {
      if (context?.prev) {
        utils.posts.getInfiniteFeed.setInfiniteData({}, context.prev);
      }
      applyFieldErrors(form.setError, error);
      const description = (error as any)?.message ?? 'Request failed';
      toast({ title: 'Failed to post', description, variant: 'destructive' });
    },
    onSettled: () => {
      utils.posts.getInfiniteFeed.invalidate();
    },
    onSuccess: () => {
      form.reset();
      onOpenChange(false);
    },
  });

  const form = useForm<CreatePostSchema>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: '',
    },
  });

  const onSubmit = (data: CreatePostSchema) => {
    createPost.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Your Workout</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="workoutId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link a workout (optional)</FormLabel>
                  <FormControl>
                    <WorkoutSelect
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's on your mind?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your fitness journey..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createPost.status === 'pending'}
            >
              {createPost.status === 'pending' ? 'Posting...' : 'Post'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 