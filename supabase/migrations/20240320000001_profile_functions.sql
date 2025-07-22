create or replace function update_profile_tx(
  p_user_id uuid,
  p_profile_data jsonb,
  p_music_service music_service
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb;
begin
  -- Update user profile
  update users
  set
    avatar_url = coalesce(p_profile_data->>'avatarUrl', avatar_url),
    bio = coalesce(p_profile_data->>'bio', bio),
    updated_at = now()
  where id = p_user_id
  returning to_jsonb(users.*) into v_result;

  -- Update user settings
  if p_profile_data->>'goals' is not null or p_music_service is not null then
    update user_settings
    set
      goals = coalesce(p_profile_data->>'goals', goals),
      preferred_music_service = coalesce(p_music_service, preferred_music_service),
      updated_at = now()
    where user_id = p_user_id;
  end if;

  return v_result;
end;
$$; 