"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    username: string;
    avatar_url?: string;
  };
}

// Mock posts data
const mockPosts: Post[] = [
  {
    id: 'post-1',
    user_id: 'mock-user-123',
    content: 'Just hit a new PR on my squat! Form analysis score: 95/100 🎯',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user: {
      username: 'demo_user',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
    }
  },
  {
    id: 'post-2',
    user_id: 'mock-user-123',
    content: 'Loving the rhythm-based training mode! Music really helps with maintaining proper tempo.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user: {
      username: 'demo_user',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
    }
  },
  {
    id: 'post-3',
    user_id: 'mock-user-456',
    content: 'Check out my latest deadlift form analysis! The AI feedback is incredibly helpful.',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user: {
      username: 'fitness_enthusiast',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fitness'
    }
  }
];

export default function CommunityFeed() {
  const { user } = useAuthContext();
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<Post[]>(mockPosts);

  // Create post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !user) return;

    // Create new mock post
    const newMockPost: Post = {
      id: `post-${Date.now()}`,
      user_id: user.id,
      content: newPost.trim(),
      created_at: new Date().toISOString(),
      user: {
        username: user.username,
        avatar_url: user.avatar_url
      }
    };

    // Add new post to the beginning of the list
    setPosts([newMockPost, ...posts]);
    setNewPost("");
  };

  return (
    <div className="space-y-6">
      {/* Create Post Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share your fitness journey..."
          className="w-full p-3 rounded bg-gray-800 text-white"
          rows={3}
        />
        <button
          type="submit"
          disabled={!newPost.trim()}
          className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
        >
          Post
        </button>
      </form>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="p-4 bg-gray-800 rounded-lg space-y-2"
          >
            <div className="flex items-center gap-2">
              {post.user.avatar_url && (
                <img
                  src={post.user.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="font-medium">{post.user.username}</span>
              <span className="text-gray-400 text-sm">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-100">{post.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
} 