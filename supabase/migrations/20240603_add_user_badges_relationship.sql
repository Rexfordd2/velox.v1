-- Drop existing user_badges table if it exists
DROP TABLE IF EXISTS public.user_badges;

-- Drop existing badges table if it exists
DROP TABLE IF EXISTS public.badges;

-- Create badges table
CREATE TABLE public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_badges junction table with explicit foreign key references
CREATE TABLE public.user_badges (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view badges"
    ON public.badges FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view their badge assignments"
    ON public.user_badges FOR SELECT
    USING (auth.uid() = user_id);

-- Insert some initial badges
INSERT INTO public.badges (id, name, description, icon_url) VALUES
    ('b1e191a0-0000-4000-a000-000000000001', 'Early Adopter', 'One of the first users to join Velox', 'https://api.dicebear.com/7.x/icons/svg?seed=early'),
    ('b1e191a0-0000-4000-a000-000000000002', 'Form Master', 'Achieved perfect form score 3 times', 'https://api.dicebear.com/7.x/icons/svg?seed=master'),
    ('b1e191a0-0000-4000-a000-000000000003', 'Consistency King', 'Worked out 5 days in a row', 'https://api.dicebear.com/7.x/icons/svg?seed=king'),
    ('b1e191a0-0000-4000-a000-000000000004', 'Music Lover', 'Connected Spotify account', 'https://api.dicebear.com/7.x/icons/svg?seed=music'),
    ('b1e191a0-0000-4000-a000-000000000005', 'Goal Setter', 'Set and achieved first fitness goal', 'https://api.dicebear.com/7.x/icons/svg?seed=goal');

-- Function to assign Early Adopter badge to all existing users
CREATE OR REPLACE FUNCTION assign_early_adopter_badge()
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT 
        p.id as user_id,
        'b1e191a0-0000-4000-a000-000000000001'::uuid as badge_id
    FROM public.profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_badges ub 
        WHERE ub.user_id = p.id 
        AND ub.badge_id = 'b1e191a0-0000-4000-a000-000000000001'::uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Execute the function to assign badges
SELECT assign_early_adopter_badge(); 