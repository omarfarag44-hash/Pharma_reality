-- =============================================================================
-- PHARMA REALITY — Simulation foundation
--
-- simulation_sessions and simulation_days are used from Sprint 1 (calendar).
-- The remaining tables are RESERVED for Sprint 2+ engines. No application code
-- writes to them yet; they exist so that every future decision, event and
-- memory is traceable to a session and a simulation day from the start.
--
-- Principle: AI may propose dialogue and reactions. Authoritative business
-- state changes only via deterministic engines, recorded in `decisions`
-- (applied_effects) and `scenario_events`, never directly by AI output.
-- =============================================================================

create table public.simulation_sessions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  user_id          uuid references public.users(id) on delete set null,
  status           text not null default 'not_started' check (status in ('not_started','active','paused','completed')),
  start_date       date not null,
  length_days      smallint not null default 90 check (length_days between 1 and 365),
  current_day      smallint not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint current_day_in_range check (current_day between 1 and length_days)
);
create index simulation_sessions_org_idx on public.simulation_sessions (organization_id);
create index simulation_sessions_user_idx on public.simulation_sessions (user_id);

create table public.simulation_days (
  session_id       uuid not null references public.simulation_sessions(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  day_number       smallint not null check (day_number >= 1),
  virtual_date     date not null,
  status           text not null default 'upcoming' check (status in ('upcoming','current','closed')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (session_id, day_number),
  unique (session_id, virtual_date)
);

-- Creates (or recreates) the day rows for a session from its start date and length.
create or replace function public.generate_simulation_days(p_session_id uuid) returns integer
language plpgsql as $$
declare
  s public.simulation_sessions%rowtype;
  n integer;
begin
  select * into s from public.simulation_sessions where id = p_session_id;
  if not found then raise exception 'Unknown simulation session %', p_session_id; end if;
  delete from public.simulation_days where session_id = p_session_id;
  insert into public.simulation_days (session_id, organization_id, day_number, virtual_date, status)
  select s.id, s.organization_id, d, s.start_date + (d - 1),
         case when d < s.current_day then 'closed' when d = s.current_day then 'current' else 'upcoming' end
  from generate_series(1, s.length_days) as d;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ----------------------------------------------------------------------------- reserved for Sprint 2+
create table public.scenario_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  session_id       uuid not null references public.simulation_sessions(id) on delete cascade,
  day_number       smallint not null check (day_number >= 1),
  event_type       text not null,
  severity         text not null check (severity in ('low','medium','high','critical')),
  branch_id        uuid references public.branches(id) on delete set null,
  employee_ids     uuid[] not null default '{}',
  title_en         text not null,
  title_ar         text not null,
  narrative_en     text not null default '',
  narrative_ar     text not null default '',
  provenance       text not null default 'scenario_generated' check (provenance = 'scenario_generated'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index scenario_events_session_day_idx on public.scenario_events (session_id, day_number);

create table public.decisions (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  session_id         uuid not null references public.simulation_sessions(id) on delete cascade,
  day_number         smallint not null check (day_number >= 1),
  scenario_event_id  uuid references public.scenario_events(id) on delete set null,
  actor_user_id      uuid not null references public.users(id) on delete cascade,
  option_key         text not null,
  rationale          text,
  -- [{target, field, before, after}] computed by the deterministic consequence engine.
  applied_effects    jsonb not null default '[]'::jsonb check (jsonb_typeof(applied_effects) = 'array'),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index decisions_session_day_idx on public.decisions (session_id, day_number);

create table public.character_memories (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  session_id          uuid not null references public.simulation_sessions(id) on delete cascade,
  employee_id         uuid not null references public.employees(id) on delete cascade,
  day_number          smallint not null check (day_number >= 1),
  memory_type         text not null check (memory_type in ('interaction','observation','commitment','grievance','recognition')),
  content             text not null,
  salience            smallint not null default 50 check (salience between 0 and 100),
  source_decision_id  uuid references public.decisions(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index character_memories_employee_idx on public.character_memories (session_id, employee_id, day_number);

create table public.leadership_assessments (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations(id) on delete cascade,
  session_id             uuid not null references public.simulation_sessions(id) on delete cascade,
  period_start_day       smallint not null,
  period_end_day         smallint not null,
  dimension_scores       jsonb not null default '{}'::jsonb check (jsonb_typeof(dimension_scores) = 'object'),
  evidence_decision_ids  uuid[] not null default '{}',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint assessment_period check (period_end_day >= period_start_day)
);
create index leadership_assessments_session_idx on public.leadership_assessments (session_id);

create table public.coaching_plans (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  session_id       uuid not null references public.simulation_sessions(id) on delete cascade,
  week_number      smallint not null check (week_number between 1 and 53),
  focus_areas      text[] not null default '{}',
  actions          jsonb not null default '[]'::jsonb check (jsonb_typeof(actions) = 'array'),
  status           text not null default 'draft' check (status in ('draft','active','completed')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (session_id, week_number)
);

do $$
declare t text;
begin
  foreach t in array array['simulation_sessions','simulation_days','scenario_events','decisions','character_memories','leadership_assessments','coaching_plans'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
  foreach t in array array['simulation_sessions','decisions'] loop
    execute format('create trigger %I after update or delete on public.%I for each row execute function public.audit_row_change()', t || '_audit', t);
  end loop;
end;
$$;
