import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ComputedStandingRow } from '../types/sports';
import { ClubCrest } from './ClubCrest';

interface TeamComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  standings: ComputedStandingRow[];
  initialClubAId?: string | null;
}

export const TeamComparisonModal: React.FC<TeamComparisonModalProps> = ({
  isOpen,
  onClose,
  standings,
  initialClubAId,
}) => {
  const defaultA =
    initialClubAId && standings.some((r) => r.club.id === initialClubAId)
      ? initialClubAId
      : standings[0]?.club.id ?? '';
  const defaultB =
    standings.find((r) => r.club.id !== defaultA)?.club.id ?? '';

  const [clubAId, setClubAId] = useState<string>(defaultA);
  const [clubBId, setClubBId] = useState<string>(defaultB);

  React.useEffect(() => {
    if (isOpen) {
      const nextA =
        initialClubAId && standings.some((r) => r.club.id === initialClubAId)
          ? initialClubAId
          : standings[0]?.club.id ?? '';
      setClubAId(nextA);
      setClubBId(
        standings.find((r) => r.club.id !== nextA)?.club.id ?? nextA
      );
    }
  }, [isOpen, initialClubAId, standings]);

  if (!isOpen) return null;

  const rowA = standings.find((r) => r.club.id === clubAId) ?? standings[0];
  const rowB = standings.find((r) => r.club.id === clubBId) ?? standings[1];

  if (!rowA || !rowB) return null;

  const metrics = [
    {
      label: 'Posición actual',
      valA: `#${rowA.position}`,
      valB: `#${rowB.position}`,
      pctA:
        rowA.position <= rowB.position
          ? 62
          : 38,
    },
    {
      label: 'Puntos totales',
      valA: rowA.points,
      valB: rowB.points,
      pctA:
        rowA.points + rowB.points > 0
          ? Math.round((rowA.points / (rowA.points + rowB.points)) * 100)
          : 50,
    },
    {
      label: 'Goles a favor',
      valA: rowA.goalsFor,
      valB: rowB.goalsFor,
      pctA:
        rowA.goalsFor + rowB.goalsFor > 0
          ? Math.round((rowA.goalsFor / (rowA.goalsFor + rowB.goalsFor)) * 100)
          : 50,
    },
    {
      label: 'Goles en contra',
      valA: rowA.goalsAgainst,
      valB: rowB.goalsAgainst,
      pctA:
        rowA.goalsAgainst + rowB.goalsAgainst > 0
          ? Math.round(
              (rowA.goalsAgainst / (rowA.goalsAgainst + rowB.goalsAgainst)) *
                100
            )
          : 50,
    },
    {
      label: 'Posesión promedio',
      valA: `${rowA.avgPossession.toFixed(1)}%`,
      valB: `${rowB.avgPossession.toFixed(1)}%`,
      pctA: Math.round(
        (rowA.avgPossession / (rowA.avgPossession + rowB.avgPossession)) * 100
      ),
    },
    {
      label: 'Vallas invictas',
      valA: rowA.cleanSheets,
      valB: rowB.cleanSheets,
      pctA:
        rowA.cleanSheets + rowB.cleanSheets > 0
          ? Math.round(
              (rowA.cleanSheets / (rowA.cleanSheets + rowB.cleanSheets)) * 100
            )
          : 50,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030814]/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-2xl rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2
              id="compare-modal-title"
              className="font-display text-lg font-bold text-white"
            >
              Comparativa Directa de Clubes
            </h2>
            <p className="text-xs text-slate-400">
              Análisis estadístico comparativo de la temporada
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar comparativa"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Team Selectors */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="space-y-2.5 text-center">
              <div className="flex justify-center">
                <ClubCrest club={rowA.club} size="lg" />
              </div>
              <select
                value={clubAId}
                onChange={(e) => setClubAId(e.target.value)}
                aria-label="Seleccionar primer club"
                className="w-full px-3 py-2 rounded-lg bg-[#060F24] border border-white/15 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
              >
                {standings.map((r) => (
                  <option key={r.club.id} value={r.club.id}>
                    {r.club.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="font-display text-sm font-bold text-amber-400 px-2">
              VS
            </div>

            <div className="space-y-2.5 text-center">
              <div className="flex justify-center">
                <ClubCrest club={rowB.club} size="lg" />
              </div>
              <select
                value={clubBId}
                onChange={(e) => setClubBId(e.target.value)}
                aria-label="Seleccionar segundo club"
                className="w-full px-3 py-2 rounded-lg bg-[#060F24] border border-white/15 text-xs font-semibold text-white focus:outline-none focus:border-sky-400"
              >
                {standings.map((r) => (
                  <option key={r.club.id} value={r.club.id}>
                    {r.club.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparative Bars */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            {metrics.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono tabular-nums font-bold text-amber-300">
                    {m.valA}
                  </span>
                  <span className="text-slate-300 font-medium">{m.label}</span>
                  <span className="font-mono tabular-nums font-bold text-sky-300">
                    {m.valB}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex gap-0.5">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${m.pctA}%` }}
                  />
                  <div
                    className="h-full bg-sky-400 transition-all duration-300"
                    style={{ width: `${100 - m.pctA}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
