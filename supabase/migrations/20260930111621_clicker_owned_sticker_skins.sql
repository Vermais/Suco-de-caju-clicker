CREATE OR REPLACE FUNCTION public.save_clicker_progress(p_state jsonb, p_expected_revision bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  uid uuid := auth.uid();
  current_revision bigint;
  new_revision bigint;
  skin_id text;
  sticker_id integer;
  owns_sticker boolean := false;
begin
  if uid is null then
    raise exception 'Faça login para salvar o clicker';
  end if;

  if jsonb_typeof(p_state) is distinct from 'object'
     or pg_column_size(p_state) > 32768 then
    raise exception 'Progresso inválido ou grande demais';
  end if;

  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Revisão inválida';
  end if;

  skin_id := p_state->>'skin';
  if skin_id ~ '^sticker:[1-9][0-9]{0,2}$' then
    sticker_id := substring(skin_id from 9)::integer;
    if sticker_id between 1 and 111 then
      select exists (
        select 1 from public.album_progress a
        where a.user_id = uid
          and case when jsonb_typeof(a.owned -> sticker_id::text) = 'number'
            then (a.owned ->> sticker_id::text)::numeric > 0
              and (a.owned ->> sticker_id::text)::numeric = trunc((a.owned ->> sticker_id::text)::numeric)
            else false end
      ) into owns_sticker;
    end if;
  end if;
  if skin_id is null or (skin_id not in ('cup', 'pedro67') and not owns_sticker) then
    p_state := jsonb_set(p_state, '{skin}', '"cup"'::jsonb, true);
  end if;

  select revision into current_revision
  from public.clicker_progress
  where user_id = uid
  for update nowait;

  if not found then
    if p_expected_revision <> 0 then
      raise exception 'Progresso alterado em outra sessão' using errcode = '40001';
    end if;

    insert into public.clicker_progress (user_id, state, revision)
    values (uid, p_state, 1);
    new_revision := 1;
  else
    if current_revision <> p_expected_revision then
      raise exception 'Progresso alterado em outra sessão' using errcode = '40001';
    end if;

    new_revision := current_revision + 1;
    update public.clicker_progress
    set state = p_state,
        revision = new_revision,
        updated_at = now()
    where user_id = uid;
  end if;

  return jsonb_build_object('revision', new_revision, 'skin', p_state->>'skin');
end;
$function$

