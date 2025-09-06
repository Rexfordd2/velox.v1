'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInViewLocal as useInView } from './hooks/useInViewLocal';
import { trpc } from '@/app/_trpc/client';
import { Button } from '@/components/ui/button';
import { CreatePostDialog } from './components/CreatePostDialog';
import { PostCard } from './components/PostCard';
import { ChallengeDialog } from './components/ChallengeDialog';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

export default function CommunityPage() {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [challengeData, setChallengeData] = useState<{
    isOpen: boolean;
    userId?: string;
    username?: string;
  }>({ isOpen: false });

  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = trpc.posts.getInfiniteFeed.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // Load more posts when scrolling to bottom
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  if (status === 'pending') return <LoadingState lines={6} />;
  if (status === 'error') return <ErrorState onRetry={() => void fetchNextPage()} />;

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Community Feed</h1>
        <Button 
          onClick={() => setIsCreatePostOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          Share Workout
        </Button>
      </div>

      <div className="space-y-6">
        {data.pages.length === 0 || data.pages.every(p => p.posts.length === 0) ? (
          <EmptyState title="No posts yet" description="Be the first to share your workout!" actionLabel="Create Post" onAction={() => setIsCreatePostOpen(true)} />
        ) : (
          data.pages.map((page, i) => (
            <div key={i} className="space-y-6">
              {page.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onChallenge={(userId, username) => {
                    setChallengeData({
                      isOpen: true,
                      userId,
                      username,
                    });
                  }}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={ref} className="h-10" />

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="text-center py-4">
          Loading more posts...
        </div>
      )}

      {/* Modals */}
      <CreatePostDialog
        open={isCreatePostOpen}
        onOpenChange={setIsCreatePostOpen}
      />

      <ChallengeDialog
        open={challengeData.isOpen}
        onOpenChange={(open) => setChallengeData({ isOpen: open })}
        userId={challengeData.userId}
        username={challengeData.username}
      />
    </div>
  );
} 