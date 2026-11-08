-- =============================================================================
-- PHARMA REALITY — Core organisational schema (Sprint 1)
-- Fictional company: NEXUS PHARMACIES. No real organisational data.
--
-- Conventions
--   * uuid primary keys, snake_case, created_at / updated_at on every table
--   * organization_id on every tenant-owned table (simple, fast RLS)
--   * bilingual text stored as *_en / *_ar column pairs
--   * ratios (achievement, basket value, ...) are NOT stored; they are derived
-- =============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------- helpers
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------- organizations
create table public.organizations (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  name_en          text not null,
  name_ar          text not null,
  tagline_en       text not null default '',
  tagline_ar       text not null default '',
  headquarters_en  text not null default '',
  headquarters_ar  text not null default '',
  founded_year     smallint not null check (founded_year between 1900 and 2100),
  is_fictional     boolean not null default true check (is_fictional), -- never model a real company
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------- roles
create table public.roles (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  code             text not null check (code in (
                     'ceo','operations_director','area_supervisor','department_head',
                     'department_specialist','branch_leader','senior_pharmacist',
                     'pharmacist','junior_pharmacist')),
  title_en         text not null,
  title_ar         text not null,
  level            smallint not null check (level between 1 and 10),
  workforce        text not null check (workforce in ('executive','corporate','field','branch')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, code)
);

-- ----------------------------------------------------------------------------- regions
create table public.regions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  code              text not null,
  name_en           text not null,
  name_ar           text not null,
  -- Ordered list of {en, ar} city labels; display-only, no relational use.
  cities            jsonb not null default '[]'::jsonb check (jsonb_typeof(cities) = 'array'),
  supervisor_id     uuid, -- FK added after employees (circular reference)
  is_player_region  boolean not null default false,
  branch_count      smallint not null default 0 check (branch_count >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, code)
);
create unique index regions_one_player_region on public.regions (organization_id) where is_player_region;

-- ----------------------------------------------------------------------------- departments
create table public.departments (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  code               text not null,
  name_en            text not null,
  name_ar            text not null,
  description_en     text not null default '',
  description_ar     text not null default '',
  head_id            uuid, -- FK added after employees
  reports_to_id      uuid, -- FK added after employees
  -- Ordered list of {en, ar} responsibility statements.
  responsibilities   jsonb not null default '[]'::jsonb check (jsonb_typeof(responsibilities) = 'array'),
  contact_email      text not null,
  contact_extension  text not null,
  location_en        text not null default '',
  location_ar        text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.department_kpis (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  department_id    uuid not null references public.departments(id) on delete cascade,
  code             text not null,
  name_en          text not null,
  name_ar          text not null,
  unit             text not null check (unit in ('percent','days','count','sar','hours','score')),
  target_value     numeric(14,2) not null,
  current_value    numeric(14,2) not null,
  direction        text not null check (direction in ('higher_is_better','lower_is_better')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (department_id, code)
);
create index department_kpis_department_idx on public.department_kpis (department_id);

-- ----------------------------------------------------------------------------- branches
create table public.branches (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  region_id          uuid not null references public.regions(id) on delete restrict,
  code               text not null,
  branch_number      smallint not null check (branch_number > 0),
  name_en            text not null,
  name_ar            text not null,
  city_en            text not null,
  city_ar            text not null,
  district_en        text not null,
  district_ar        text not null,
  zone               text not null check (zone in ('riyadh_north','riyadh_central_west','riyadh_south_kharj')),
  performance_group  char(1) not null check (performance_group in ('A','B','C')),
  category           text not null check (category in ('flagship','mall','community','medical','highway')),
  opened_year        smallint not null check (opened_year between 1950 and 2100),
  area_sqm           smallint not null check (area_sqm > 0),
  is_24_hours        boolean not null default false,
  context_en         text not null default '',
  context_ar         text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (organization_id, code),
  unique (region_id, branch_number)
);
create index branches_region_idx on public.branches (region_id);
create index branches_group_idx on public.branches (organization_id, performance_group);

-- ----------------------------------------------------------------------------- employees
create table public.employees (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  employee_code        text not null,
  full_name_en         text not null,
  full_name_ar         text not null,
  gender               text not null check (gender in ('male','female')),
  role_id              uuid not null references public.roles(id) on delete restrict,
  job_title_en         text not null,
  job_title_ar         text not null,
  branch_id            uuid references public.branches(id) on delete set null,
  department_id        uuid references public.departments(id) on delete set null deferrable initially deferred,
  region_id            uuid references public.regions(id) on delete set null,
  is_branch_leader     boolean not null default false,
  is_player            boolean not null default false,
  years_of_experience  smallint not null check (years_of_experience between 0 and 60),
  hire_date            date not null,
  employment_status    text not null check (employment_status in ('active','probation','on_leave')),
  email                text not null,
  phone_extension      text not null default '',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (organization_id, employee_code),
  unique (organization_id, email),
  constraint branch_leader_requires_branch check (not is_branch_leader or branch_id is not null)
);
-- Exactly one designated Branch Leader per branch.
create unique index employees_one_leader_per_branch on public.employees (branch_id) where is_branch_leader;
-- Exactly one player character per organisation.
create unique index employees_one_player on public.employees (organization_id) where is_player;
create index employees_branch_idx on public.employees (branch_id);
create index employees_department_idx on public.employees (department_id);
create index employees_role_idx on public.employees (role_id);
create index employees_name_en_idx on public.employees (organization_id, lower(full_name_en));

alter table public.regions
  add constraint regions_supervisor_fk foreign key (supervisor_id)
  references public.employees(id) on delete set null deferrable initially deferred;
alter table public.departments
  add constraint departments_head_fk foreign key (head_id)
  references public.employees(id) on delete set null deferrable initially deferred;
alter table public.departments
  add constraint departments_reports_to_fk foreign key (reports_to_id)
  references public.employees(id) on delete set null deferrable initially deferred;

-- ----------------------------------------------------------------------------- employee profiles
create table public.employee_profiles (
  employee_id                 uuid primary key references public.employees(id) on delete cascade,
  organization_id             uuid not null references public.organizations(id) on delete cascade,
  summary_en                  text not null default '',
  summary_ar                  text not null default '',
  strengths                   text[] not null default '{}',
  development_areas           text[] not null default '{}',
  communication_style         text not null,
  leadership_style            text,
  leadership_potential_score  smallint not null check (leadership_potential_score between 0 and 100),
  leadership_potential        text not null check (leadership_potential in ('emerging','developing','ready','high')),
  performance_score           smallint not null check (performance_score between 0 and 100),
  career_aspiration           text not null,
  openness                    smallint not null check (openness between 0 and 100),
  conscientiousness           smallint not null check (conscientiousness between 0 and 100),
  extraversion                smallint not null check (extraversion between 0 and 100),
  agreeableness               smallint not null check (agreeableness between 0 and 100),
  emotional_stability         smallint not null check (emotional_stability between 0 and 100),
  -- Flexible behavioural attributes consumed by future personality / behaviour engines:
  -- { motivators: text[], stressTriggers: text[], conflictApproach: text, decisionStyle: text }
  behavioral_traits           jsonb not null default '{}'::jsonb check (jsonb_typeof(behavioral_traits) = 'object'),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create table public.employee_skills (
  employee_id      uuid not null references public.employees(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  skill_code       text not null,
  proficiency      smallint not null check (proficiency between 1 and 5),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (employee_id, skill_code)
);

create table public.performance_reviews (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  employee_id      uuid not null references public.employees(id) on delete cascade,
  period           text not null check (period ~ '^\d{4}-Q[1-4]$'),
  period_end       date not null,
  score            smallint not null check (score between 0 and 100),
  provenance       text not null check (provenance in ('synthetic_historical','simulated_current','scenario_generated')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (employee_id, period)
);
create index performance_reviews_employee_idx on public.performance_reviews (employee_id);

create table public.attendance_records (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  employee_id         uuid not null references public.employees(id) on delete cascade,
  period_month        date not null check (extract(day from period_month) = 1),
  scheduled_shifts    smallint not null check (scheduled_shifts >= 0),
  attended_shifts     smallint not null check (attended_shifts >= 0),
  late_arrivals       smallint not null default 0 check (late_arrivals >= 0),
  unplanned_absences  smallint not null default 0 check (unplanned_absences >= 0),
  provenance          text not null check (provenance in ('synthetic_historical','simulated_current','scenario_generated')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (employee_id, period_month),
  constraint attended_not_above_scheduled check (attended_shifts <= scheduled_shifts)
);
create index attendance_employee_idx on public.attendance_records (employee_id);

create table public.training_records (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  employee_id      uuid not null references public.employees(id) on delete cascade,
  course_code      text not null,
  status           text not null check (status in ('completed','in_progress','planned')),
  completed_on     date,
  hours            smallint not null check (hours >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (employee_id, course_code),
  constraint completed_requires_date check ((status = 'completed') = (completed_on is not null))
);
create index training_employee_idx on public.training_records (employee_id);

-- ----------------------------------------------------------------------------- reporting lines & relationships
create table public.reporting_lines (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  employee_id      uuid not null references public.employees(id) on delete cascade,
  manager_id       uuid not null references public.employees(id) on delete cascade,
  line_type        text not null check (line_type in ('solid','dotted')),
  context_en       text,
  context_ar       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (employee_id, manager_id, line_type),
  constraint no_self_reporting check (employee_id <> manager_id)
);
-- Each person has at most one solid-line manager.
create unique index reporting_lines_one_solid_manager on public.reporting_lines (employee_id) where line_type = 'solid';
create index reporting_lines_manager_idx on public.reporting_lines (manager_id);

create table public.relationships (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  source_id          uuid not null references public.employees(id) on delete cascade,
  target_id          uuid not null references public.employees(id) on delete cascade,
  relationship_type  text not null check (relationship_type in
                       ('manager','peer','collaboration','mentorship','friendship','rivalry','friction')),
  trust              smallint not null check (trust between -100 and 100),
  rapport            smallint not null check (rapport between -100 and 100),
  description_en     text not null default '',
  description_ar     text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (source_id, target_id, relationship_type),
  constraint no_self_relationship check (source_id <> target_id)
);
create index relationships_source_idx on public.relationships (source_id);
create index relationships_target_idx on public.relationships (target_id);

-- ----------------------------------------------------------------------------- metrics
-- Current operating position of each branch (simulation Day 1 opening month).
create table public.branch_metrics (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations(id) on delete cascade,
  branch_id              uuid not null references public.branches(id) on delete cascade,
  period_month           date not null check (extract(day from period_month) = 1),
  sales_target           numeric(14,2) not null check (sales_target >= 0),
  sales_actual           numeric(14,2) not null check (sales_actual >= 0),
  transactions           integer not null check (transactions >= 0),
  stock_availability     numeric(5,2) not null check (stock_availability between 0 and 100),
  inventory_value        numeric(14,2) not null check (inventory_value >= 0),
  slow_moving_value      numeric(14,2) not null check (slow_moving_value >= 0),
  near_expiry_value      numeric(14,2) not null check (near_expiry_value >= 0),
  compliance_score       numeric(5,2) not null check (compliance_score between 0 and 100),
  customer_satisfaction  numeric(5,2) not null check (customer_satisfaction between 0 and 100),
  provenance             text not null default 'simulated_current'
                           check (provenance in ('simulated_current','scenario_generated')),
  as_of_day              smallint not null default 1 check (as_of_day >= 1),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (branch_id, period_month)
);
create index branch_metrics_branch_idx on public.branch_metrics (branch_id);

-- Closed monthly snapshots (history) for branches and summarised peer regions.
create table public.metric_snapshots (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations(id) on delete cascade,
  scope                  text not null check (scope in ('branch','region')),
  branch_id              uuid references public.branches(id) on delete cascade,
  region_id              uuid references public.regions(id) on delete cascade,
  period_month           date not null check (extract(day from period_month) = 1),
  sales_target           numeric(14,2) not null check (sales_target >= 0),
  sales_actual           numeric(14,2) not null check (sales_actual >= 0),
  transactions           integer not null check (transactions >= 0),
  stock_availability     numeric(5,2) not null check (stock_availability between 0 and 100),
  inventory_value        numeric(14,2),
  slow_moving_value      numeric(14,2),
  near_expiry_value      numeric(14,2),
  compliance_score       numeric(5,2) not null check (compliance_score between 0 and 100),
  customer_satisfaction  numeric(5,2) not null check (customer_satisfaction between 0 and 100),
  provenance             text not null check (provenance in ('synthetic_historical','simulated_current','scenario_generated')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint snapshot_scope_target check (
    (scope = 'branch' and branch_id is not null and region_id is null and inventory_value is not null)
    or (scope = 'region' and region_id is not null and branch_id is null)
  )
);
create unique index metric_snapshots_branch_month on public.metric_snapshots (branch_id, period_month) where scope = 'branch';
create unique index metric_snapshots_region_month on public.metric_snapshots (region_id, period_month) where scope = 'region';
create index metric_snapshots_org_month_idx on public.metric_snapshots (organization_id, period_month);

-- ----------------------------------------------------------------------------- users & audit
create table public.users (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  -- Supabase auth.users id. Null for the seeded demo user until an account is linked.
  auth_user_id     uuid unique,
  employee_id      uuid references public.employees(id) on delete set null,
  display_name     text not null,
  app_role         text not null default 'player' check (app_role in ('player','admin')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index users_org_idx on public.users (organization_id);

create table public.audit_logs (
  id               bigint generated always as identity primary key,
  organization_id  uuid references public.organizations(id) on delete cascade,
  actor_user_id    uuid references public.users(id) on delete set null,
  action           text not null,
  entity_table     text not null,
  entity_id        text,
  before_data      jsonb,
  after_data       jsonb,
  created_at       timestamptz not null default now()
);
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_table, entity_id);

-- Generic audit trigger: records every UPDATE and DELETE on authoritative tables.
create or replace function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_row   jsonb := to_jsonb(coalesce(new, old));
  v_actor uuid;
begin
  begin
    select u.id into v_actor from public.users u where u.auth_user_id = auth.uid();
  exception when others then
    v_actor := null; -- auth schema not present (plain PostgreSQL) or no session
  end;
  insert into public.audit_logs (organization_id, actor_user_id, action, entity_table, entity_id, before_data, after_data)
  values (
    (v_row ->> 'organization_id')::uuid,
    v_actor,
    lower(tg_op),
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'employee_id'),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op = 'UPDATE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

-- ----------------------------------------------------------------------------- triggers
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','roles','regions','departments','department_kpis','branches','employees',
    'employee_profiles','employee_skills','performance_reviews','attendance_records','training_records',
    'reporting_lines','relationships','branch_metrics','metric_snapshots','users'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
  foreach t in array array[
    'branches','employees','employee_profiles','reporting_lines','relationships','branch_metrics','metric_snapshots','departments'
  ] loop
    execute format('create trigger %I after update or delete on public.%I for each row execute function public.audit_row_change()', t || '_audit', t);
  end loop;
end;
$$;
