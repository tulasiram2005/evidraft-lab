create schema auth;
create role anon;
create role authenticated;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
'select current_setting(''request.jwt.claim.sub'',true)::uuid';
grant usage on schema auth to authenticated;
\i supabase/migrations/202611210001_shared_manuscripts.sql
insert into auth.users select ('00000000-0000-4000-8000-00000000000'||n)::uuid from generate_series(1,4) n;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
insert into public.shared_manuscripts(body) values('draft') returning id as doc \gset
insert into public.manuscript_members values
(:'doc','00000000-0000-4000-8000-000000000002','editor'),
(:'doc','00000000-0000-4000-8000-000000000003','viewer');
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
update public.shared_manuscripts set body='edited' where revision=1;
update public.shared_manuscripts set body='stale' where revision=1;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
update public.shared_manuscripts set body='viewer edit';
do $$ begin if (select count(*) from public.shared_manuscripts where body='edited' and revision=2)<>1 then raise exception 'Revision or role failure'; end if; end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000004';
do $$ begin if exists(select from public.shared_manuscripts) then raise exception 'Non-member read'; end if; end $$;
