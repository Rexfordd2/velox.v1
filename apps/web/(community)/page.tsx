'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { CreatePostDialog } from './components/CreatePostDialog';
import { PostCard } from './components/PostCard';
import { ChallengeDialog } from './components/ChallengeDialog';

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

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'error') {
    return <div>Error loading feed</div>;
  }

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
        {data.pages.map((page, i) => (
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
        ))}
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