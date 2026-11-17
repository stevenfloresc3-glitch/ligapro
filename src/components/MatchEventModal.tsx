import React, { useState, useEffect } from 'react';
import { X, Trophy, AlertTriangle, ArrowLeftRight, CheckCircle2, Save } from 'lucide-react';
import { Match, MatchEventType } from '../types/sports';
import { CLUBS } from '../data/sportsData';
import { updateMatchRecord } from '../services/supabaseService';
import { ClubCrest } from './ClubCrest';

interface MatchEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onMatchUpdated: (updatedMatch: Match) => void;
}

export const MatchEventModal: React.FC<MatchEventModalProps> = ({
  isOpen,
  onClose,
  match,
  onMatchUpdated,
}) => {
  if (!isOpen || !match) return null;

  const homeClub = CLUBS[match.homeClubId];
  const awayClub = CLUBS[match.awayClubId];

  const [homeScore, setHomeScore] = useState<number>(match.homeScore);
  const [awayScore, setAwayScore] = useState<number>(match.awayScore);
  const [status, setStatus] = useState<Match['status']>(match.status);
  const [minute, setMinute] = useState<number>(match.minute || 75);

  useEffect(() => {
    if (match) {
      setHomeScore(match.homeScore);
      setAwayScore(match.awayScore);
      setStatus(match.status);
      setMinute(match.minute || 75);
      setEventMinute(match.minute || 75);
    }
  }, [match]);

  // New Event Form State
  const [eventType, setEventType] = useState<MatchEventType>('goal');
  const [eventTeam, setEventTeam] = useState<'home' | 'away'>('home');
  const [eventMinute, setEventMinute] = useState<number>(minute);
  const [eventPlayer, setEventPlayer] = useState<string>('');
  const [eventDetail, setEventDetail] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleAddEvent = () => {
    if (!eventPlayer.trim()) return;

    let nextHomeScore = homeScore;
    let nextAwayScore = awayScore;

    if (eventType === 'goal') {
      if (eventTeam === 'home') nextHomeScore += 1;
      else nextAwayScore += 1;
      setHomeScore(nextHomeScore);
      setAwayScore(nextAwayScore);
    }

    const newEvent = {
      id: `evt-${Date.now()}`,
      minute: eventMinute,
      teamSide: eventTeam,
      type: eventType,
      player: eventPlayer.trim(),
      detail: eventDetail.trim() || undefined,
    };

    const updatedMatch: Match = {
      ...match,
      homeScore: nextHomeScore,
      awayScore: nextAwayScore,
      status: status,
      minute: minute,
      events: [newEvent, ...match.events],
    };

    onMatchUpdated(updatedMatch);
    setEventPlayer('');
    setEventDetail('');
    setSaveSuccess('Incidencia agregada localmente.');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSaveToSupabase = async () => {
    setIsSaving(true);
    setSaveSuccess(null);

    const updatedMatch: Match = {
      ...match,
      homeScore,
      awayScore,
      status,
      minute,
    };

    // Actualizar en el estado de la aplicación
    onMatchUpdated(updatedMatch);

    // Persistir en Supabase
    const ok = await updateMatchRecord({
      id: match.id,
      home_goals: homeScore,
      visitor_goals: awayScore,
      status: status,
      phase: `Jornada ${match.matchday}`,
    });

    setIsSaving(false);
    if (ok) {
      setSaveSuccess('¡Marcador y partido guardados exitosamente en Supabase (matches)!');
      setTimeout(() => {
        setSaveSuccess(null);
        onClose();
      }, 1500);
    } else {
      setSaveSuccess('Actualizado en memoria (Supabase sin conexión o modo demo).');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-card rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Planilla Oficial & Registro en Vivo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Jornada {match.matchday} · {match.stadium} · Sincroniza con Supabase
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Marcador Principal Interactivo */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8 space-y-4">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider block text-center">
              Ajuste de Marcador Oficial
            </span>

            <div className="flex items-center justify-between gap-4">
              {/* Equipo Local */}
              <div className="flex-1 flex flex-col items-center text-center gap-2">
                <ClubCrest club={homeClub} size="md" />
                <span className="text-sm font-bold text-white truncate max-w-[120px]">
                  {homeClub.shortName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHomeScore((s) => Math.max(0, s - 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20"
                  >
                    -
                  </button>
                  <span className="text-2xl font-mono font-bold text-amber-300 w-8 text-center">
                    {homeScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHomeScore((s) => s + 1)}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* VS & Minuto */}
              <div className="flex flex-col items-center justify-center gap-1.5 px-3">
                <span className="text-xs text-slate-400 font-mono">VS</span>
                <div className="text-center">
                  <label className="text-[10px] text-slate-400 block">Minuto</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={minute}
                    onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
                    className="w-14 text-center py-1 text-xs rounded bg-white/10 border border-white/15 text-white font-mono"
                  />
                </div>
              </div>

              {/* Equipo Visitante */}
              <div className="flex-1 flex flex-col items-center text-center gap-2">
                <ClubCrest club={awayClub} size="md" />
                <span className="text-sm font-bold text-white truncate max-w-[120px]">
                  {awayClub.shortName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAwayScore((s) => Math.max(0, s - 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20"
                  >
                    -
                  </button>
                  <span className="text-2xl font-mono font-bold text-amber-300 w-8 text-center">
                    {awayScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAwayScore((s) => s + 1)}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Estado del Partido */}
            <div className="pt-3 border-t border-white/8 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Estado reglamentario:</span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'upcoming', label: 'Programado' },
                    { id: 'live', label: 'En Vivo' },
                    { id: 'finished', label: 'Finalizado' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatus(st.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${status === st.id
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario de Nueva Incidencia */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">
              Registrar Nueva Incidencia (IFAB / LigaPro)
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Tipo de Evento</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as MatchEventType)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#071229] border border-white/15 text-white"
                >
                  <option value="goal">Gol (Anotación)</option>
                  <option value="yellow">Tarjeta Amarilla</option>
                  <option value="red">Tarjeta Roja</option>
                  <option value="sub">Sustitución</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Equipo</label>
                <select
                  value={eventTeam}
                  onChange={(e) => setEventTeam(e.target.value as 'home' | 'away')}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#071229] border border-white/15 text-white"
                >
                  <option value="home">{homeClub.name} (Local)</option>
                  <option value="away">{awayClub.name} (Visita)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Minuto</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={eventMinute}
                  onChange={(e) => setEventMinute(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#071229] border border-white/15 text-white font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">Jugador Principal</label>
                <input
                  type="text"
                  placeholder="Ej: L. Benítez"
                  value={eventPlayer}
                  onChange={(e) => setEventPlayer(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#071229] border border-white/15 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-xs block mb-1">Detalle / Asistencia / Motivo</label>
              <input
                type="text"
                placeholder="Ej: Asistencia: R. Ocampo / Falta táctica"
                value={eventDetail}
                onChange={(e) => setEventDetail(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#071229] border border-white/15 text-white placeholder-slate-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAddEvent}
              disabled={!eventPlayer.trim()}
              className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Agregar Incidencia al Partido
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveToSupabase}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-lg shadow-amber-400/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Guardando en Supabase...' : 'Guardar y Sincronizar'}
          </button>
        </div>
      </div>
    </div>
  );
};
