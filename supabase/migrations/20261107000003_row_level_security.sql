-- =============================================================================
-- PHARMA REALITY — Row Level Security
--
-- Model (Sprint 1):
--   * A signed-in user (auth.uid()) is linked to one organisation through public.users.
--   * Authenticated users can READ rows of their own organisation.
--   * No client-side writes in Sprint 1. Seeding and administration use the
--     SQL editor / service role on the server only (service role bypasses RLS).
--   * The anon role gets no policies, so unauthenticated requests see nothing.
--   * audit_logs: users can read their organisation's log; inserts happen via
--     the security-definer trigger only.
-- =============================================================================

-- Organisation of the current authenticated user (null when not linked).
create or replace function public.current_organization_id() returns uuid
language sql stable security definer set search_path = public as $$
  select u.organization_id from public.users u where u.auth_user_id = auth.uid() limit 1;
$$;
revoke all on function public.current_organization_id() from public;
grant execute on function public.current_organization_id() to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'roles','regions','departments','department_kpis','branches','employees','employee_profiles',
    'employee_skills','performance_reviews','attendance_records','training_records','reporting_lines',
    'relationships','branch_metrics','metric_snapshots','simulation_days','scenario_events',
    'decisions','character_memories','leadership_assessments','coaching_plans','audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (organization_id = public.current_organization_id())',
      t || '_read_own_org', t);
  end loop;
end;
$$;

alter table public.organizations enable row level security;
create policy organizations_read_own on public.organizations
  for select to authenticated using (id = public.current_organization_id());

alter table public.users enable row level security;
create policy users_read_own_org on public.users
  for select to authenticated using (organization_id = public.current_organization_id());

alter table public.simulation_sessions enable row level security;
create policy simulation_sessions_read_own_org on public.simulation_sessions
  for select to authenticated using (organization_id = public.current_organization_id());

-- Links a Supabase Auth account (by e-mail) to the player character of an organisation.
-- Run from the SQL editor after creating the user in Authentication → Users:
--   select public.link_auth_user('you@example.com');
create or replace function public.link_auth_user(p_email text, p_org_code text default 'NEXUS') returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_auth_id uuid;
  v_org     uuid;
  v_player  uuid;
  v_user    uuid;
begin
  select id into v_auth_id from auth.users where lower(email) = lower(p_email);
  if v_auth_id is null then raise exception 'No auth user with e-mail %', p_email; end if;
  select id into v_org from public.organizations where code = p_org_code;
  if v_org is null then raise exception 'Unknown organisation %', p_org_code; end if;
  select id into v_player from public.employees where organization_id = v_org and is_player;

  select id into v_user from public.users where organization_id = v_org and auth_user_id is null and employee_id = v_player limit 1;
  if v_user is not null then
    update public.users set auth_user_id = v_auth_id, display_name = p_email where id = v_user;
  else
    insert into public.users (organization_id, auth_user_id, employee_id, display_name, app_role)
    values (v_org, v_auth_id, v_player, p_email, 'player')
    on conflict (auth_user_id) do update set organization_id = excluded.organization_id
    returning id into v_user;
  end if;
  insert into public.audit_logs (organization_id, actor_user_id, action, entity_table, entity_id, after_data)
  values (v_org, v_user, 'link_auth_user', 'users', v_user::text, jsonb_build_object('email', p_email));
  return v_user;
end;
$$;
revoke all on function public.link_auth_user(text, text) from public, anon, authenticated;
