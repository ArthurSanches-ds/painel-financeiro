-- Rodar UMA vez no Supabase: SQL Editor → New query → colar → Run
-- Não apaga nada: tabelas antigas (freelances, uber, objetivos) continuam lá, só deixam de ser usadas.

-- 1) Recebimentos por fonte
create table if not exists public.entradas (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    fonte text not null check (fonte in ('vilarejo', 'gs', 'gs3d', 'uber')),
    valor numeric(12,2) not null check (valor > 0),
    data date not null,
    created_at timestamptz default now()
);

alter table public.entradas enable row level security;

drop policy if exists "entradas_do_dono" on public.entradas;
create policy "entradas_do_dono" on public.entradas
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Gastos: vencimento e parcelas
alter table public.gastos add column if not exists dia_vencimento int check (dia_vencimento between 1 and 31);
alter table public.gastos add column if not exists parcelas_total int;
alter table public.gastos add column if not exists parcela_inicio_mes int;
alter table public.gastos add column if not exists parcela_inicio_ano int;

-- 3) Conferir se a RLS está ligada nas tabelas (todas devem mostrar "true")
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('gastos', 'entradas', 'profiles');
