create table public.shared_manuscripts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users,
  body text not null check (length(body)<=100000),
  revision bigint not null default 1
);
create table public.manuscript_members (
  manuscript_id uuid references public.shared_manuscripts on delete cascade,
  user_id uuid references auth.users,
  role text not null check(role in ('editor','viewer')),
  primary key(manuscript_id,user_id)
);
alter table public.shared_manuscripts enable row level security;
alter table public.manuscript_members enable row level security;
revoke all on public.shared_manuscripts, public.manuscript_members from anon, authenticated, public;
grant select,insert(body),update(body) on public.shared_manuscripts to authenticated;
grant select,insert,delete,update(role) on public.manuscript_members to authenticated;
create policy member_self on public.manuscript_members for select to authenticated using(user_id=auth.uid());
create function public.owns_manuscript(target uuid) returns boolean
language sql stable security definer set search_path='' as
'select exists(select 1 from public.shared_manuscripts where id=target and owner_id=auth.uid())';
revoke all on function public.owns_manuscript(uuid) from public;
grant execute on function public.owns_manuscript(uuid) to authenticated;
create policy owner_members on public.manuscript_members for all to authenticated
using(public.owns_manuscript(manuscript_id)) with check(public.owns_manuscript(manuscript_id));
create policy readable on public.shared_manuscripts for select to authenticated using(
 owner_id=auth.uid() or exists(select 1 from public.manuscript_members m where m.manuscript_id=id and m.user_id=auth.uid()));
create policy creatable on public.shared_manuscripts for insert to authenticated with check(owner_id=auth.uid());
create policy editable on public.shared_manuscripts for update to authenticated using(
 owner_id=auth.uid() or exists(select 1 from public.manuscript_members m where m.manuscript_id=id and m.user_id=auth.uid() and m.role='editor'));
create function public.bump_manuscript_revision() returns trigger language plpgsql set search_path='' as $$
begin new.revision := old.revision+1; return new; end $$;
create trigger bump_revision before update on public.shared_manuscripts for each row execute function public.bump_manuscript_revision();
