-- Add new columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{
  "workoutReminders": true,
  "achievementAlerts": true,
  "weeklyProgress": true
}'::jsonb,
ADD COLUMN IF NOT EXISTS camera_settings JSONB DEFAULT '{
  "quality": "medium",
  "frameRate": "30"
}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "shareProgress": false,
  "publicProfile": false
}'::jsonb;

-- Create function to get user settings with defaults
CREATE OR REPLACE FUNCTION get_user_settings(p_user_id UUID)
RETURNS TABLE (
  notifications JSONB,
  camera_settings JSONB,
  privacy_settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(us.notifications, '{
      "workoutReminders": true,
      "achievementAlerts": true,
      "weeklyProgress": true
    }'::jsonb),
    COALESCE(us.camera_settings, '{
      "quality": "medium",
      "frameRate": "30"
    }'::jsonb),
    COALESCE(us.privacy_settings, '{
      "shareProgress": false,
      "publicProfile": false
    }'::jsonb)
  FROM user_settings us
  WHERE us.user_id = p_user_id;
END;
$$;

-- Create trigger to ensure user settings exist
CREATE OR REPLACE FUNCTION ensure_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on user creation
DROP TRIGGER IF EXISTS ensure_user_settings_trigger ON users;
CREATE TRIGGER ensure_user_settings_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_settings(); 