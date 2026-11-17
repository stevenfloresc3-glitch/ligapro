# ⚽ Tribuna Central - Sistema Profesional de Gestión de Torneos de Fútbol

**Tribuna Central** es una aplicación web interactiva, moderna y responsiva de alto rendimiento desarrollada en **React (Vite + Tailwind CSS)** conectada en tiempo real a una base de datos PostgreSQL alojada en **Supabase**. Está modelada siguiendo normativas oficiales de competiciones de fútbol profesional (inspiradas en reglamentos federativos como LigaPro: Fases 1 y 2, Tabla Acumulada para copas y descenso, planilla digital de incidencias arbitrales y régimen de sanciones disciplinarias de acumulación de tarjetas).

---

## 🎨 1. Diseño e Identidad Visual

- **Paleta Oficial:** Fondo azul marino profundo institucional (`#050C1A` / `#0A1630`), tarjetas con efecto *glassmorphism* de bordes traslúcidos sutiles, tipografía deportiva moderna y acentos en amarillo dorado (`#F59E0B` / `#EAB308`).
- **Navegación Intuitiva por Secciones:**
  - **Resumen:** Cartelera de la jornada con barras duales de posesión, tabla clasificatoria interactiva y el inspector del encuentro seleccionado.
  - **Partidos:** Listado detallado de la fecha, estados en vivo, minutos jugados y selector de partido.
  - **Posiciones:** Clasificación por fases (**Fase Uno**, **Fase Dos**, **Tabla Acumulada**) y modos de visualización (**General**, **Local**, **Visitante**, **En Vivo**), con zonas coloreadas de Copa Internacional, Clasificación y Descenso.
  - **Estadísticas:** Récords colectivos (mejor ataque, mejor defensa, posesión), líderes individuales de goleo/asistencias y el panel de **Control Disciplinario y Sanciones (Reglamento Art. 91)**.
  - **Comparar Clubes (CTA):** Comparador frente a frente (*Head-to-Head*) con métricas avanzadas y radar comparativo.
- **Inspector de Encuentros & Acta Arbitral:** Visualización de goles, tarjetas, cambios minuto a minuto, estadísticas de remates, posesión, xG y alineaciones tácticas oficiales.

---

## 🗄️ 2. Estructura de Datos en Supabase PostgreSQL

La aplicación lee y escribe directamente en las 4 tablas solicitadas:

| Tabla | Columnas | Descripción y Función en la App |
|---|---|---|
| `teams` | `id, name, serie, city, logo_url` | Catálogo de clubes participantes en la Serie A. |
| `matches` | `id, phase, home_team_id, visitor_team_id, home_goals, visitor_goals, match_date, status` | Calendario y resultados de los encuentros (programados, en vivo, finalizados). |
| `standings` | `id, team_id, phase, matches_played, won, drawn, lost, goals_for, goals_against, points` | Registros acumulados y por fase de la tabla de posiciones oficial. |
| `players` | `id, team_id, full_name, position, number, yellow_cards, red_cards` | Plantillas de futbolistas y contador de tarjetas para la aplicación del régimen de sanciones. |

---

## ⚖️ 3. Normativas de Competición Implementadas

1. **Estructura por Fases y Tabla Acumulada:**
   - **Fase 1 y Fase 2:** Torneos de todos contra todos. El ganador de cada fase clasifica a la Gran Final.
   - **Tabla Acumulada:** Agregación de puntos y goles de ambas fases para determinar cupos a competiciones internacionales (puestos 1 al 6) y descenso directo (puestos 11 y 12).
2. **Criterios de Desempate Reglamentarios:**
   - 1º Mayor cantidad de Puntos (`Pts`).
   - 2º Mejor Gol Diferencia (`DG = GF - GC`).
   - 3º Mayor cantidad de Goles a Favor (`GF`).
   - 4º Resultado entre sí / Puntos por partido (`Pts/PJ`).
3. **Control Disciplinario y Sanciones (Reglamento Art. 91):**
   - **5 Tarjetas Amarillas Acumuladas:** Genera suspensión automática obligatoria de **1 fecha**.
   - **Alerta de 4 Amarillas:** Futbolista "En Capilla" con riesgo de suspensión inmediata.
   - **Tarjeta Roja Directa:** Expulsión y apertura de expediente sancionatorio.
   - Los árbitros y delegados pueden añadir tarjetas o limpiar sanciones cumplidas con actualización inmediata en Supabase.

---

## 🚀 4. Despliegue en Netlify (Listo para Producción)

El proyecto incluye la configuración para compilación y despliegue en un solo clic:

### Pasos para Desplegar:
1. Sube este repositorio a tu cuenta de **GitHub**, **GitLab** o **Bitbucket**.
2. En tu panel de **Netlify**, haz clic en **"Add new site" > "Import an existing project"**.
3. Selecciona tu repositorio.
4. Netlify detectará automáticamente el archivo [netlify.toml](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/steven-flores-portfolio/tribuna-central/netlify.toml):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. En la sección **Site Configuration > Environment Variables**, agrega las credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL = https://ewgtkkuywsscmnqljihq.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_fiW1vKYg-luvgkW3atTrtw_Qa6MtoRH
   ```
6. Haz clic en **"Deploy Site"**. ¡Tu aplicación estará en línea con redirecciones SPA (`/* -> /index.html 200`) y cabeceras de seguridad activadas!

---

## 💻 5. Ejecución en Entorno Local

```bash
# 1. Clonar el repositorio
git clone <tu-repositorio>
cd tribuna-central

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# (Verifica que las credenciales coincidan con las de tu proyecto en Supabase)

# 4. Iniciar servidor de desarrollo Vite
npm run dev

# 5. Compilar para producción
npm run build
```

---

## 🗃️ 6. Inicialización de la Base de Datos en Supabase

Si creas un proyecto nuevo en Supabase o necesitas recrear el esquema:
1. Abre tu panel en [supabase.com](https://supabase.com).
2. Dirígete a **SQL Editor**.
3. Copia y ejecuta el contenido del script incluido en [supabase/schema.sql](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/steven-flores-portfolio/tribuna-central/supabase/schema.sql).
4. El script creará automáticamente las 4 tablas, activará las políticas de seguridad (RLS), habilitará Supabase Realtime y cargará los 12 clubes oficiales iniciales.
5. También puedes pulsar el botón **"Supabase Híbrido / En Vivo"** en la barra superior de la aplicación y hacer clic en **"Poblar / Sincronizar Supabase"** para sembrar las tablas interactivamente.
