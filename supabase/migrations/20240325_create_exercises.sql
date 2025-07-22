-- Create exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty TEXT,
    muscle_groups TEXT[],
    equipment TEXT[],
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.exercises
    FOR SELECT
    USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated users to insert/update" ON public.exercises
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true); 