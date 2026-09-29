-- Expõe somente a classificação e os nomes públicos do álbum a jogadores conectados.
create or replace function public.get_clicker_leaderboard(p_sort text default 'rebirths')
returns table (
  place bigint,
  player_name text,
  player_handle text,
  rebirth_count bigint,
  caju_total numeric,
  is_me boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Entre com sua conta do álbum para ver o ranking';
  end if;
  if p_sort is null or p_sort not in ('rebirths', 'cajus') then
    raise exception 'Classificação inválida';
  end if;

  return query
  with scores as (
    select cp.user_id as player_id,
      coalesce(nullif(left(trim(sp.display_name), 40), ''), 'Jogador') as public_name,
      sp.handle as public_handle,
      case when jsonb_typeof(cp.state->'rebirths') = 'number'
        then floor(least(greatest((cp.state->>'rebirths')::numeric, 0), 1000000000))::bigint
        else 0::bigint end as total_rebirths,
      case when jsonb_typeof(cp.state->'allTime') = 'number'
        then floor(least(greatest((cp.state->>'allTime')::numeric, 0), 1e100))
        else 0::numeric end as total_cajus
    from public.clicker_progress cp
    left join public.social_profiles sp on sp.user_id = cp.user_id
  ), ranked as (
    select row_number() over (
      order by
        case when p_sort = 'rebirths' then total_rebirths::numeric else total_cajus end desc,
        case when p_sort = 'rebirths' then total_cajus else total_rebirths::numeric end desc,
        player_id
    ) as rank_place, scores.*
    from scores
  )
  select r.rank_place, r.public_name, r.public_handle,
    r.total_rebirths, r.total_cajus, r.player_id = auth.uid()
  from ranked r
  where r.rank_place <= 50
  order by r.rank_place;
end;
$$;

revoke all on function public.get_clicker_leaderboard(text) from public, anon, authenticated;
grant execute on function public.get_clicker_leaderboard(text) to authenticated;
