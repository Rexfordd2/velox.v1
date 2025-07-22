'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      username: string;
      avatar_url: string;
    };
    workout?: {
      title: string;
      description: string;
    };
    _count: {
      comments: number;
    };
  };
  onChallenge: (userId: string, username: string) => void;
}

export function PostCard({ post, onChallenge }: PostCardProps) {
  const [isCommenting, setIsCommenting] = useState(false);
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  const utils = trpc.useUtils();
  const createComment = trpc.posts.comment.useMutation({
    onSuccess: () => {
      utils.posts.getInfiniteFeed.invalidate();
      setComment('');
      setIsCommenting(false);
    },
  });

  const handleComment = () => {
    if (!comment.trim()) return;
    createComment.mutate({
      postId: post.id,
      content: comment,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Avatar
          src={post.user.avatar_url}
          alt={post.user.username}
          className="w-10 h-10"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{post.user.username}</h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
            {user?.id !== post.user.id && (
              <Button
                variant="outline"
                onClick={() => onChallenge(post.user.id, post.user.username)}
              >
                Challenge
              </Button>
            )}
          </div>

          <p className="mt-2">{post.content}</p>

          {post.workout && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">{post.workout.title}</h4>
              <p className="text-sm text-gray-600">{post.workout.description}</p>
            </div>
          )}

          <div className="mt-4">
            <Button
              variant="ghost"
              className="text-sm"
              onClick={() => setIsCommenting(!isCommenting)}
            >
              {post._count.comments} Comments
            </Button>
          </div>

          {isCommenting && (
            <div className="mt-4 flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1"
              />
              <Button
                onClick={handleComment}
                disabled={createComment.isLoading}
              >
                Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 