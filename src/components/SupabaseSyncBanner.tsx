import React, { useState } from 'react';
import { Database, CheckCircle, RefreshCw, AlertCircle, Sparkles, X, Table, ShieldCheck } from 'lucide-react';
import { seedSupabaseDatabase } from '../services/supabaseService';
import { SUPABASE_URL } from '../lib/supabase';

interface SupabaseSyncBannerProps {
  isSupabaseLive: boolean;
  onRefreshAll: () => void;
}

export const SupabaseSyncBanner: React.FC<SupabaseSyncBannerProps> = ({
  isSupabaseLive,
  onRefreshAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    setStatusMessage('Conectando a Supabase...');
    const result = await seedSupabaseDatabase((msg) => setStatusMessage(msg));
    setIsSeeding(false);
    setStatusMessage(result.message);
    if (result.success) {
      onRefreshAll();
      setTimeout(() => {
        setIsOpen(false);
        setStatusMessage(null);
      }, 2000);
    }
  };

  return (
    <>
      {/* Discreet Status Pill in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-[#071329]/90 hover:border-amber-400/40 transition-colors"
        title="Ver estado de conexión a Supabase PostgreSQL"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isSupabaseLive
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : 'bg-amber-400 animate-pulse'
          }`}
        />
        <Database className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline font-mono text-[11px] text-slate-300">
          {isSupabaseLive ? 'Supabase En Vivo' : 'Supabase Híbrido'}
        </span>
      </button>

      {/* Connection & Database Management Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-card rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    Conexión a Supabase PostgreSQL
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Host: {SUPABASE_URL.replace('https://', '')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/8 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Tablas de Competición Monitoreadas
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    RLS Activa
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 p-2 rounded bg-black/20">
                    <Table className="w-3.5 h-3.5 text-sky-400" />
                    <span>teams</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded bg-black/20">
                    <Table className="w-3.5 h-3.5 text-amber-400" />
                    <span>matches</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded bg-black/20">
                    <Table className="w-3.5 h-3.5 text-emerald-400" />
                    <span>standings</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded bg-black/20">
                    <Table className="w-3.5 h-3.5 text-purple-400" />
                    <span>players</span>
                  </div>
                </div>
              </div>

              {statusMessage && (
                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-200 text-xs">
                  {statusMessage}
                </div>
              )}

              <p className="text-slate-400 text-xs leading-relaxed">
                La aplicación utiliza el cliente oficial de Supabase con fallback local resiliente. Si tu base de datos recién fue creada, puedes poblarla con el botón de abajo con 12 clubes, fixture de partidos, tabla inicial y jugadores con tarjetas.
              </p>

              {/* Botón de Semilla / Sincronización */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  {isSeeding ? 'Poblando Tablas...' : 'Poblar / Sincronizar Supabase'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onRefreshAll();
                    setIsOpen(false);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recargar Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

