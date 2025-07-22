-- Insert initial badges
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

-- Execute the function
SELECT assign_early_adopter_badge(); 