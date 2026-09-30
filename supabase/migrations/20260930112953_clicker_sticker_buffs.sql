create table public.clicker_sticker_buffs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  card_id integer check (card_id between 1 and 111),
  active_until timestamptz not null default '-infinity',
  ready_at timestamptz not null default '-infinity'
);
alter table public.clicker_sticker_buffs enable row level security;
revoke all on public.clicker_sticker_buffs from public, anon, authenticated;
grant select on public.clicker_sticker_buffs to authenticated;
create policy "Users read own sticker buff" on public.clicker_sticker_buffs for select to authenticated
using ((select auth.uid()) = user_id);

create function public.get_clicker_sticker_buff() returns jsonb
language plpgsql security definer set search_path = '' as $func$
declare
  uid uuid := auth.uid(); b public.clicker_sticker_buffs; owns boolean := false;
begin
  if uid is null then raise exception 'Entre com sua conta do álbum.'; end if;
  select * into b from public.clicker_sticker_buffs where user_id=uid;
  if not found or b.card_id is null then
    return jsonb_build_object('serverNow',extract(epoch from now())*1000,'cardId',null,'until',0,'readyAt',0,'owned',false);
  end if;
  select exists(select 1 from public.album_progress a where a.user_id=uid
    and case when jsonb_typeof(a.owned->b.card_id::text)='number'
    then (a.owned->>b.card_id::text)::numeric > 0 and (a.owned->>b.card_id::text)::numeric=trunc((a.owned->>b.card_id::text)::numeric)
    else false end) into owns;
  return jsonb_build_object('serverNow',extract(epoch from now())*1000,'cardId',b.card_id,
    'until',extract(epoch from b.active_until)*1000,'readyAt',extract(epoch from b.ready_at)*1000,'owned',owns);
end;
$func$;

create function public.activate_clicker_sticker_buff(p_card_id integer) returns jsonb
language plpgsql security definer set search_path = '' as $func$
declare
  uid uuid := auth.uid(); b public.clicker_sticker_buffs;
begin
  if uid is null then raise exception 'Entre com sua conta do álbum.'; end if;
  if p_card_id is null or p_card_id not between 1 and 111 then raise exception 'Figurinha inválida.'; end if;
  -- A linha e seu lock são únicos por conta, não por figurinha.
  insert into public.clicker_sticker_buffs(user_id) values(uid) on conflict (user_id) do nothing;
  select * into b from public.clicker_sticker_buffs where user_id=uid for update;
  if b.ready_at > now() then raise exception 'Aguarde o cooldown do buff de figurinha.'; end if;
  if not exists(select 1 from public.album_progress a where a.user_id=uid
    and case when jsonb_typeof(a.owned->p_card_id::text)='number'
    then (a.owned->>p_card_id::text)::numeric > 0 and (a.owned->>p_card_id::text)::numeric=trunc((a.owned->>p_card_id::text)::numeric)
    else false end) then raise exception 'Você não possui esta figurinha.'; end if;
  update public.clicker_sticker_buffs set card_id=p_card_id,
    active_until=now()+interval '10 minutes',ready_at=now()+interval '40 minutes' where user_id=uid;
  return public.get_clicker_sticker_buff();
end;
$func$;
revoke all on function public.get_clicker_sticker_buff() from public, anon;
revoke all on function public.activate_clicker_sticker_buff(integer) from public, anon;
grant execute on function public.get_clicker_sticker_buff() to authenticated;
grant execute on function public.activate_clicker_sticker_buff(integer) to authenticated;
