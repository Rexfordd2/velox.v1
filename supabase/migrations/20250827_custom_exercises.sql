-- Custom Exercises schema

-- Table: custom_exercises
CREATE TABLE IF NOT EXISTS public.custom_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT custom_exercises_category_chk CHECK (category IN ('lower','upper','core','olympic','other'))
);

-- Table: custom_exercise_criteria
CREATE TABLE IF NOT EXISTS public.custom_exercise_criteria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_id UUID NOT NULL REFERENCES public.custom_exercises(id) ON DELETE CASCADE,
    json_schema JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_exercises_user ON public.custom_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_exercise_criteria_exercise ON public.custom_exercise_criteria(exercise_id);
CREATE INDEX IF NOT EXISTS idx_custom_exercise_criteria_version ON public.custom_exercise_criteria(version);

-- Enable RLS
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_exercise_criteria ENABLE ROW LEVEL SECURITY;

-- Policies for custom_exercises (owner-only)
CREATE POLICY "custom_exercises_select_own"
    ON public.custom_exercises FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "custom_exercises_insert_own"
    ON public.custom_exercises FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_exercises_update_own"
    ON public.custom_exercises FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_exercises_delete_own"
    ON public.custom_exercises FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for custom_exercise_criteria (owner via parent)
CREATE POLICY "custom_exercise_criteria_select_own"
    ON public.custom_exercise_criteria FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.custom_exercises e
        WHERE e.id = exercise_id AND e.user_id = auth.uid()
    ));

CREATE POLICY "custom_exercise_criteria_insert_own"
    ON public.custom_exercise_criteria FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.custom_exercises e
        WHERE e.id = exercise_id AND e.user_id = auth.uid()
    ));

CREATE POLICY "custom_exercise_criteria_update_own"
    ON public.custom_exercise_criteria FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.custom_exercises e
        WHERE e.id = exercise_id AND e.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.custom_exercises e
        WHERE e.id = exercise_id AND e.user_id = auth.uid()
    ));

CREATE POLICY "custom_exercise_criteria_delete_own"
    ON public.custom_exercise_criteria FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.custom_exercises e
        WHERE e.id = exercise_id AND e.user_id = auth.uid()
    ));


