-- ====================================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL PARA SUPABASE
-- Plataforma: Tribuna Central - Torneo de Fútbol Profesional
-- Tablas requeridas: teams, matches, standings, players
-- ====================================================================

-- 1. TABLA: teams
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    serie TEXT NOT NULL DEFAULT 'A',
    city TEXT NOT NULL,
    logo_url TEXT
);

-- 2. TABLA: matches
CREATE TABLE IF NOT EXISTS public.matches (
    id TEXT PRIMARY KEY,
    phase TEXT NOT NULL DEFAULT 'Fase Uno',
    home_team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    visitor_team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    home_goals INTEGER NOT NULL DEFAULT 0,
    visitor_goals INTEGER NOT NULL DEFAULT 0,
    match_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished', 'suspended'))
);

-- 3. TABLA: standings
CREATE TABLE IF NOT EXISTS public.standings (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    phase TEXT NOT NULL DEFAULT 'Fase Uno',
    matches_played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    goals_for INTEGER NOT NULL DEFAULT 0,
    goals_against INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0
);

-- 4. TABLA: players
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('Arquero', 'Defensa', 'Mediocampista', 'Delantero')),
    number INTEGER NOT NULL,
    yellow_cards INTEGER NOT NULL DEFAULT 0,
    red_cards INTEGER NOT NULL DEFAULT 0
);

-- Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (Lectura y Escritura para la API Anónima y Autenticada)
CREATE POLICY "Permitir lectura publica de teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Permitir escritura publica de teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir lectura publica de matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Permitir escritura publica de matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir lectura publica de standings" ON public.standings FOR SELECT USING (true);
CREATE POLICY "Permitir escritura publica de standings" ON public.standings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir lectura publica de players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Permitir escritura publica de players" ON public.players FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Publicación en Tiempo Real (Supabase Realtime)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.teams, public.matches, public.standings, public.players;
COMMIT;

-- ====================================================================
-- DATOS SEMILLA INICIALES (EQUIPOS OFICIALES DE TRIBUNA CENTRAL)
-- ====================================================================
INSERT INTO public.teams (id, name, serie, city, logo_url) VALUES
('atletico_dorado', 'Atlético Dorado', 'A', 'Santiago', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&auto=format&fit=crop&q=80'),
('real_marino', 'Real Marino CF', 'A', 'Valparaíso', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=128&auto=format&fit=crop&q=80'),
('union_capital', 'Unión Capital', 'A', 'Madrid Sur', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&auto=format&fit=crop&q=80'),
('deportivo_norte', 'Deportivo del Norte', 'A', 'Monterrey', 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=128&auto=format&fit=crop&q=80'),
('club_imperial', 'Club Imperial', 'A', 'Sevilla', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&auto=format&fit=crop&q=80'),
('racing_costa', 'Racing de la Costa', 'A', 'Santander', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=128&auto=format&fit=crop&q=80'),
('sporting_valle', 'Sporting del Valle', 'A', 'Cali', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&auto=format&fit=crop&q=80'),
('academico_fc', 'Académico FC', 'A', 'Córdoba', 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=128&auto=format&fit=crop&q=80'),
('estrella_austral', 'Estrella Austral', 'A', 'Punta Arenas', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&auto=format&fit=crop&q=80'),
('ferroviario_cf', 'Ferroviario CF', 'A', 'Rosario', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=128&auto=format&fit=crop&q=80'),
('juventud_albo', 'Juventud Albo', 'A', 'Quito Norte', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&auto=format&fit=crop&q=80'),
('portuario_sc', 'Portuario SC', 'A', 'Guayaquil', 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=128&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    logo_url = EXCLUDED.logo_url;

