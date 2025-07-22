-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create movement_scores table
CREATE TABLE IF NOT EXISTS public.movement_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    movement_id TEXT NOT NULL,
    score NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
CREATE POLICY "Users can view all posts"
    ON public.posts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for movement_scores
CREATE POLICY "Users can view all scores"
    ON public.movement_scores FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own scores"
    ON public.movement_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movement_scores_movement_id ON public.movement_scores(movement_id);
CREATE INDEX IF NOT EXISTS idx_movement_scores_created_at ON public.movement_scores(created_at DESC); 