import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, getMediaUrl } from '../services/api';
import {
  Users, Package, MessageCircle, Droplets, ToggleLeft, ToggleRight,
  Shield, BarChart2, Trash2, Search, ChevronLeft, ChevronRight,
  Ban, RefreshCw, Eye, AlertTriangle, BadgeCheck, Mail,
  ClipboardList, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Gráfica barras verticales (SVG profesional) ──────────────────────────────
function BarChart({ data, color = '#6366f1' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 500, H = 190, PL = 34, PR = 8, PT = 18, PB = 26;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const n = data.length;
  const gap = 6;
  const barW = Math.max(plotW / n - gap, 8);
  const gid = 'bg1';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 190 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = PT + (1 - f) * plotH;
        return (
          <g key={f}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="currentColor"
              strokeOpacity={f === 0 ? 0.18 : 0.07} strokeWidth="1" strokeDasharray={f === 0 ? '0' : '3 4'} />
            <text x={PL - 5} y={y + 3.5} textAnchor="end" fontSize="9" fill="#9ca3af">
              {Math.round(f * max)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = Math.max((d.count / max) * plotH, d.count > 0 ? 4 : 0);
        const x = PL + (i / n) * plotW + (plotW / n - barW) / 2;
        const y = PT + plotH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="5" ry="5"
              fill={`url(#${gid})`} />
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9"
                fontWeight="700" fill={color}>{d.count}</text>
            )}
            <text x={x + barW / 2} y={H - 7} textAnchor="middle" fontSize="8.5" fill="#9ca3af">
              {(d.month || d.type || d.category || '').replace(/_/g,' ')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Gráfica barras horizontales (profesional) ─────────────────────────────────
function HBarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const COLORS = ['#6366f1','#10b981','#3b82f6','#f59e0b','#8b5cf6','#14b8a6','#f43f5e','#f97316'];

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
        const barW = Math.max((d.count / max) * 100, d.count > 0 ? 2 : 0);
        const color = COLORS[i % COLORS.length];
        const label = (d.type || d.category || '').replace(/_/g,' ').toLowerCase();
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize truncate">{label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">{pct}%</span>
                <span className="text-xs font-bold tabular-nums min-w-[1.75rem] text-right"
                  style={{ color }}>{d.count}</span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${barW}%`, background: `linear-gradient(90deg, ${color}dd, ${color}99)` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Gráfica de actividad anual — líneas suavizadas con área ──────────────────
function YearlyChart({ data }) {
  if (!data?.length) return <p className="text-sm text-gray-400 text-center py-12">Sin datos aún</p>;

  const series = [
    { key: 'solicitudes',  label: 'Solicitudes',  color: '#f43f5e' },
    { key: 'donaciones',   label: 'Donaciones',   color: '#10b981' },
    { key: 'ventas',       label: 'Ventas',       color: '#3b82f6' },
    { key: 'intercambios', label: 'Intercambios', color: '#f59e0b' },
    { key: 'usuarios',     label: 'Usuarios',     color: '#6366f1' },
  ];

  const allVals = series.flatMap(s => data.map(d => d[s.key] ?? 0));
  const rawMax = Math.max(...allVals, 1);
  const max = rawMax + Math.ceil(rawMax * 0.12);
  const W = 700, H = 240, PL = 38, PR = 14, PT = 16, PB = 30;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const n = data.length;
  const xOf = i => PL + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const yOf = v => PT + (1 - Math.min(v, max) / max) * plotH;

  const bezierPath = (key) => {
    const pts = data.map((d, i) => [xOf(i), yOf(d[key] ?? 0)]);
    if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
    let p = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1][0] + pts[i][0]) / 2;
      p += ` C ${cpx.toFixed(1)} ${pts[i-1][1].toFixed(1)}, ${cpx.toFixed(1)} ${pts[i][1].toFixed(1)}, ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
    }
    return p;
  };

  const areaPath = (key) => {
    const line = bezierPath(key);
    const bottom = PT + plotH;
    return `${line} L ${xOf(n-1).toFixed(1)} ${bottom} L ${xOf(0).toFixed(1)} ${bottom} Z`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 240 }}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.key} id={`ag-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {/* Grid horizontal */}
        {yTicks.map(f => {
          const y = PT + (1 - f) * plotH;
          return (
            <g key={f}>
              <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="currentColor"
                strokeOpacity={f === 0 ? 0.18 : 0.07} strokeWidth="1"
                strokeDasharray={f === 0 ? '0' : '4 5'} />
              <text x={PL - 6} y={y + 3.5} textAnchor="end" fontSize="9" fill="#9ca3af">
                {Math.round(f * max)}
              </text>
            </g>
          );
        })}
        {/* Áreas rellenas (de atrás hacia adelante) */}
        {[...series].reverse().map(s => (
          <path key={`a-${s.key}`} d={areaPath(s.key)} fill={`url(#ag-${s.key})`} />
        ))}
        {/* Líneas */}
        {series.map(s => (
          <path key={`l-${s.key}`} d={bezierPath(s.key)} fill="none"
            stroke={s.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {/* Puntos con tooltip */}
        {series.map(s =>
          data.map((d, i) => (
            <circle key={`d-${s.key}-${i}`} cx={xOf(i)} cy={yOf(d[s.key] ?? 0)}
              r="3.5" fill="white" stroke={s.color} strokeWidth="2">
              <title>{s.label}: {d[s.key] ?? 0} — {d.month}</title>
            </circle>
          ))
        )}
        {/* Etiquetas eje X */}
        {data.map((d, i) => (
          <text key={i} x={xOf(i)} y={H - 9} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {d.month}
          </text>
        ))}
      </svg>
      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 justify-center">
        {[...series].reverse().map(s => (
          <span key={s.key} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            <span className="inline-block w-3.5 h-1 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Badges ───────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  disponible: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  reservado:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  entregado:  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  cancelado:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const TYPE_STYLES = {
  donacion:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  venta:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  intercambio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  solicitud:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const ROLE_STYLES = {
  admin:       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  donante:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  solicitante: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};
const REQ_STATUS_STYLES = {
  pendiente:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  aceptada:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rechazada:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelada:  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  completada: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function Badge({ label, style }) {
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style}`}>{label}</span>;
}

// ── Paginación ───────────────────────────────────────────────────────────────
function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        Página {page} de {pages}
      </span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages}
        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Modal confirmación ────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
          <AlertTriangle size={22} className={danger ? 'text-red-600' : 'text-amber-600'} />
        </div>
        <p className="text-center text-gray-800 dark:text-gray-200 font-medium text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton de estadísticas ─────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="card p-5 space-y-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700" />
            <div className="h-7 w-14 bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="h-4 w-28 bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2].map(i => (
          <div key={i} className="card p-5 animate-pulse">
            <div className="h-5 w-40 bg-gray-100 dark:bg-gray-700 rounded mb-4" />
            <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded" />
          </div>
        ))}
        <div className="card p-5 lg:col-span-2 animate-pulse">
          <div className="h-5 w-52 bg-gray-100 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-4 bg-gray-100 dark:bg-gray-700 rounded" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab Estadísticas ─────────────────────────────────────────────────────────
function StatsTab({ stats, error, onRefresh, year, onYearChange, period, onPeriodChange }) {
  if (error) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <AlertCircle size={26} className="text-red-600" />
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">No se pudieron cargar las estadísticas</p>
      <button onClick={onRefresh} className="btn-primary flex items-center gap-2">
        <RefreshCw size={14} /> Reintentar
      </button>
    </div>
  );

  if (!stats) return null;

  const charts = stats.charts || {};
  const availableYears = charts.available_years?.length ? charts.available_years : [year];

  // Totales del año mostrado desde yearly_activity
  const yearTotals = (charts.yearly_activity || []).reduce(
    (acc, m) => ({
      usuarios:    acc.usuarios    + (m.usuarios    ?? 0),
      donaciones:  acc.donaciones  + (m.donaciones  ?? 0),
      ventas:      acc.ventas      + (m.ventas      ?? 0),
      solicitudes: acc.solicitudes + (m.solicitudes ?? 0),
    }),
    { usuarios: 0, donaciones: 0, ventas: 0, solicitudes: 0 }
  );

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users, label: 'Usuarios totales', value: stats.users?.total,
            badge: `${stats.users?.active ?? 0} activos`,
            sub: `+${yearTotals.usuarios} en ${year}`,
            gradient: 'from-indigo-500 to-violet-600',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            text: 'text-indigo-600 dark:text-indigo-400',
          },
          {
            icon: Package, label: 'Insumos publicados', value: stats.supplies?.total,
            badge: `${stats.supplies?.available ?? 0} disponibles`,
            sub: `${yearTotals.donaciones} donados en ${year}`,
            gradient: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            icon: MessageCircle, label: 'Solicitudes totales', value: stats.requests?.total,
            badge: `${stats.requests?.pending ?? 0} pendientes`,
            sub: `${stats.requests?.completed ?? 0} completadas`,
            gradient: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-600 dark:text-amber-400',
          },
          {
            icon: Droplets, label: 'Donantes de sangre', value: stats.users?.blood_donors,
            badge: `${yearTotals.ventas} ventas en ${year}`,
            sub: `${yearTotals.solicitudes} solicitudes este año`,
            gradient: 'from-rose-500 to-pink-600',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            text: 'text-rose-600 dark:text-rose-400',
          },
        ].map(({ icon: Icon, label, value, badge, sub, gradient, bg, text }) => (
          <div key={label} className="card p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-3xl bg-gradient-to-br ${gradient} opacity-[0.07]`} />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
              <Icon size={20} className={text} />
            </div>
            <p className={`text-3xl font-black ${text}`}>{value ?? 0}</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">{label}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${bg} ${text}`}>{badge}</span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Actividad anual — gráfica principal */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <BarChart2 size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Actividad anual {year}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Usuarios registrados · Insumos publicados · Solicitudes recibidas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {[
                { key: 'mensual',   label: 'Mensual' },
                { key: 'bimestral', label: 'Bimestral' },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => onPeriodChange(p.key)}
                  className={`text-xs font-semibold px-2.5 py-1.5 transition-colors ${
                    period === p.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {availableYears.length > 1 && (
              <select
                value={year}
                onChange={e => onYearChange(parseInt(e.target.value, 10))}
                className="text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            <button onClick={onRefresh}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>
        </div>
        <YearlyChart data={charts.yearly_activity} />
      </div>

      {/* Segunda fila: barras verticales + barras horizontales por tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <BarChart2 size={16} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Nuevos usuarios — {period === 'bimestral' ? 'por bimestre' : 'por mes'}
              </h2>
              <p className="text-[11px] text-gray-400">Año {year}</p>
            </div>
          </div>
          {(charts.monthly_registrations?.length > 0)
            ? <BarChart data={charts.monthly_registrations} color="#6366f1" />
            : <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Package size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">Insumos por tipo</h2>
              <p className="text-[11px] text-gray-400">Distribución de publicaciones</p>
            </div>
          </div>
          {(charts.supplies_by_type?.length > 0)
            ? <HBarChart data={charts.supplies_by_type} />
            : <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>}
        </div>
      </div>

      {/* Categorías — ancho completo */}
      <div className="card p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <ClipboardList size={16} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">Insumos por categoría</h2>
            <p className="text-[11px] text-gray-400">Top 8 categorías más activas</p>
          </div>
        </div>
        {(charts.supplies_by_category?.length > 0)
          ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-0.5">
              {charts.supplies_by_category.map((d, i) => {
                const max = Math.max(...charts.supplies_by_category.map(x => x.count), 1);
                const total = charts.supplies_by_category.reduce((s, x) => s + x.count, 0);
                const COLORS = ['#6366f1','#10b981','#3b82f6','#f59e0b','#8b5cf6','#14b8a6','#f43f5e','#f97316'];
                const color = COLORS[i % COLORS.length];
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                const barW = Math.max((d.count / max) * 100, d.count > 0 ? 2 : 0);
                const label = (d.category || '').replace(/_/g,' ').toLowerCase();
                return (
                  <div key={i} className="py-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize truncate">{label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[11px] text-gray-400 tabular-nums">{pct}%</span>
                        <span className="text-xs font-bold tabular-nums min-w-[1.5rem] text-right" style={{ color }}>{d.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${barW}%`, background: `linear-gradient(90deg, ${color}dd, ${color}77)` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          : <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>}
      </div>
    </div>
  );
}

// ── Tab Publicaciones ────────────────────────────────────────────────────────
function SuppliesTab() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirm, setConfirm] = useState(null);

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search.trim()) params.query = search.trim();
      if (filterType) params.supply_type = filterType;
      if (filterStatus) params.status = filterStatus;
      const r = await adminAPI.getSupplies(params);
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
      setPage(r.data.page || 1);
      setPages(r.data.pages || 1);
    } catch { toast.error('Error al cargar publicaciones'); }
    finally { setLoading(false); }
  }, [search, filterType, filterStatus]);

  useEffect(() => { fetch(1); }, [fetch]);

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteSupply(id);
      setItems(prev => prev.filter(s => s.id !== id));
      setTotal(t => t - 1);
      toast.success('Publicación eliminada');
    } catch { toast.error('Error al eliminar'); }
    setConfirm(null);
  };

  const handleStatus = async (id, status) => {
    try {
      await adminAPI.setSupplyStatus(id, status);
      setItems(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toast.success(`Estado cambiado a ${status}`);
    } catch { toast.error('Error al cambiar estado'); }
    setConfirm(null);
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetch(1)}
            placeholder="Buscar por título o descripción..."
            className="input-field pl-9 text-sm" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field text-sm sm:w-44">
          <option value="">Todos los tipos</option>
          <option value="donacion">Donación</option>
          <option value="venta">Venta</option>
          <option value="intercambio">Intercambio</option>
          <option value="solicitud">Solicitud</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm sm:w-44">
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="reservado">Reservado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button onClick={() => fetch(1)} className="btn-primary flex items-center gap-2 shrink-0">
          <Search size={14} /> Buscar
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <strong className="text-gray-800 dark:text-gray-200">{total}</strong> publicaciones en total
      </p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Publicación</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Publicado por</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : items.map(s => (
                    <tr key={s.id} className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 ${s.status === 'cancelado' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{s.title}</p>
                        {s.city && <p className="text-xs text-gray-400">{s.city}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link to={`/users/${s.owner?.id}`} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                          {s.owner?.full_name}
                        </Link>
                        <p className="text-[11px] text-gray-400">@{s.owner?.username}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge label={s.supply_type} style={TYPE_STYLES[s.supply_type] || ''} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={s.status} style={STATUS_STYLES[s.status] || ''} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/supplies/${s.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 transition-colors" title="Ver publicación">
                            <Eye size={15} />
                          </Link>
                          {s.status !== 'cancelado'
                            ? (
                              <button onClick={() => setConfirm({ type: 'status', id: s.id, status: 'cancelado', label: s.title })}
                                className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-600 transition-colors" title="Cancelar publicación">
                                <Ban size={15} />
                              </button>
                            ) : (
                              <button onClick={() => setConfirm({ type: 'status', id: s.id, status: 'disponible', label: s.title })}
                                className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600 transition-colors" title="Restaurar publicación">
                                <RefreshCw size={15} />
                              </button>
                            )
                          }
                          <button onClick={() => setConfirm({ type: 'delete', id: s.id, label: s.title })}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors" title="Eliminar permanentemente">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">No se encontraron publicaciones</p>
          )}
        </div>
      </div>

      <Pagination page={page} pages={pages} onChange={p => { setPage(p); fetch(p); }} />

      {confirm && (
        <ConfirmModal
          danger={confirm.type === 'delete'}
          message={
            confirm.type === 'delete'
              ? `¿Eliminar permanentemente "${confirm.label}"? Esta acción no se puede deshacer.`
              : confirm.status === 'cancelado'
                ? `¿Cancelar y ocultar "${confirm.label}"? El usuario no podrá ver su publicación.`
                : `¿Restaurar "${confirm.label}" como disponible?`
          }
          onConfirm={() =>
            confirm.type === 'delete'
              ? handleDelete(confirm.id)
              : handleStatus(confirm.id, confirm.status)
          }
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ── Tab Usuarios ─────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [confirm, setConfirm] = useState(null);       // { type: 'toggle', id, name, active }
  const [confirmRole, setConfirmRole] = useState(null); // { id, name, role }

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (filterRole) params.role = filterRole;
      const r = await adminAPI.getUsers(params);
      setUsers(r.data.items || []);
      setTotal(r.data.total || 0);
      setPage(r.data.page || 1);
      setPages(r.data.pages || 1);
    } catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  }, [search, filterRole]);

  useEffect(() => { fetch(1); }, [fetch]);

  const toggleActive = async (id) => {
    try {
      const res = await adminAPI.toggleUserActive(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u));
      toast.success(res.data.detail);
    } catch { toast.error('Error'); }
    setConfirm(null);
  };

  const toggleVerified = async (id) => {
    try {
      const res = await adminAPI.toggleUserVerified(id);
      setUsers(prev => prev.map(u => u.id === id
        ? { ...u, is_verified: res.data.is_verified, email_verified: res.data.email_verified ?? u.email_verified }
        : u));
      toast.success(res.data.detail);
    } catch { toast.error('Error al actualizar verificación'); }
  };

  const verifyEmail = async (id) => {
    try {
      const res = await adminAPI.verifyUserEmail(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, email_verified: true } : u));
      toast.success(res.data.detail);
    } catch { toast.error('Error al verificar email'); }
  };

  const applyRoleChange = async () => {
    if (!confirmRole) return;
    try {
      const res = await adminAPI.changeUserRole(confirmRole.id, confirmRole.role);
      setUsers(prev => prev.map(u => u.id === confirmRole.id ? { ...u, role: res.data.role } : u));
      toast.success(res.data.detail);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
    setConfirmRole(null);
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetch(1)}
            placeholder="Buscar usuario..."
            className="input-field pl-9 text-sm" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input-field text-sm sm:w-44">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="donante">Donante</option>
          <option value="solicitante">Solicitante</option>
        </select>
        <button onClick={() => fetch(1)} className="btn-primary flex items-center gap-2 shrink-0">
          <Search size={14} /> Buscar
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <strong className="text-gray-800 dark:text-gray-200">{total}</strong> usuarios registrados
      </p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Registro</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                            {u.avatar_url
                              ? <img src={getMediaUrl(u.avatar_url)} alt="" className="w-full h-full object-cover" />
                              : <span className="text-xs font-bold text-primary-600">{u.full_name?.charAt(0)}</span>
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100">{u.full_name}</p>
                              {u.is_verified && <BadgeCheck size={13} className="text-primary-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-gray-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.role === 'admin' ? (
                          <Badge label="admin" style={ROLE_STYLES.admin} />
                        ) : (
                          <select value={u.role}
                            onChange={e => setConfirmRole({ id: u.id, name: u.full_name, role: e.target.value })}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer">
                            <option value="solicitante">Solicitante</option>
                            <option value="donante">Donante</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge
                            label={u.is_active ? 'Activo' : 'Bloqueado'}
                            style={u.is_active
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                          />
                          {!u.email_verified && (
                            <button
                              onClick={() => verifyEmail(u.id)}
                              className="flex items-center gap-1 text-[10px] font-medium text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                              title="Marcar email como verificado">
                              <Mail size={10} /> Sin verificar
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/users/${u.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 transition-colors" title="Ver perfil">
                            <Eye size={15} />
                          </Link>
                          <button
                            onClick={() => toggleVerified(u.id)}
                            className={`p-2 rounded-lg transition-colors ${u.is_verified
                              ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-primary-500 hover:text-primary-700'
                              : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-primary-500'}`}
                            title={u.is_verified ? 'Quitar verificación' : 'Verificar usuario'}>
                            <BadgeCheck size={15} />
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => setConfirm({ id: u.id, name: u.full_name, active: u.is_active })}
                              className={`p-2 rounded-lg transition-colors ${u.is_active
                                ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600'
                                : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600'}`}
                              title={u.is_active ? 'Desactivar usuario' : 'Activar usuario'}>
                              {u.is_active ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} className="text-gray-400" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!loading && users.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">No se encontraron usuarios</p>
          )}
        </div>
      </div>

      <Pagination page={page} pages={pages} onChange={p => { setPage(p); fetch(p); }} />

      {confirm && (
        <ConfirmModal
          danger={confirm.active}
          message={confirm.active
            ? `¿Desactivar a "${confirm.name}"? No podrá iniciar sesión hasta que lo reactives.`
            : `¿Reactivar a "${confirm.name}"?`}
          onConfirm={() => toggleActive(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirmRole && (
        <ConfirmModal
          danger={confirmRole.role === 'admin'}
          message={confirmRole.role === 'admin'
            ? `¿Otorgar rol de ADMINISTRADOR a "${confirmRole.name}"? Tendrá acceso completo al panel de administración.`
            : `¿Cambiar el rol de "${confirmRole.name}" a "${confirmRole.role}"?`}
          onConfirm={applyRoleChange}
          onCancel={() => setConfirmRole(null)}
        />
      )}
    </div>
  );
}

// ── Tab Solicitudes ──────────────────────────────────────────────────────────
function RequestsTab() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (filterStatus) params.status = filterStatus;
      const r = await adminAPI.getRequests(params);
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
      setPage(r.data.page || 1);
      setPages(r.data.pages || 1);
    } catch { toast.error('Error al cargar solicitudes'); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetch(1); }, [fetch]);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm sm:w-48">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aceptada">Aceptada</option>
          <option value="rechazada">Rechazada</option>
          <option value="cancelada">Cancelada</option>
          <option value="completada">Completada</option>
        </select>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          <strong className="text-gray-800 dark:text-gray-200">{total}</strong> solicitudes en total
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Solicitante</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Receptor</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Insumo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                      {[1,2,3,4,5].map(j => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : items.map(r => (
                    <tr key={r.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <Link to={`/users/${r.sender?.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400">
                          {r.sender?.full_name}
                        </Link>
                        <p className="text-[11px] text-gray-400">@{r.sender?.username}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link to={`/users/${r.receiver?.id}`} className="text-xs text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                          {r.receiver?.full_name}
                        </Link>
                        <p className="text-[11px] text-gray-400">@{r.receiver?.username}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {r.supply ? (
                          <Link to={`/supplies/${r.supply.id}`} className="text-xs text-primary-600 dark:text-primary-400 hover:underline truncate max-w-[160px] block">
                            {r.supply.title}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">Sin insumo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={r.status} style={REQ_STATUS_STYLES[r.status] || ''} />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-400">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : '—'}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">No se encontraron solicitudes</p>
          )}
        </div>
      </div>

      <Pagination page={page} pages={pages} onChange={p => { setPage(p); fetch(p); }} />
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
// ── Tab Fichas Médicas (Donantes de Sangre) ───────────────────────────────────
const BLOOD_TYPE_COLORS = {
  'O+':  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'O-':  'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  'A+':  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'A-':  'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'B+':  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'B-':  'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  'AB+': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'AB-': 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
};

function BloodTypeBadge({ type }) {
  if (!type) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BLOOD_TYPE_COLORS[type] || 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
}

function EligibilityBadge({ item }) {
  if (!item.has_record)
    return <Badge label="Sin ficha" style="bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400" />;
  if (item.is_eligible)
    return <Badge label="Puede donar" style="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" />;
  if (item.ineligibility_type === 'permanente')
    return <Badge label="Excl. permanente" style="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" />;
  return <Badge label="Excl. temporal" style="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />;
}

function BloodDonorsTab() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterBloodType, setFilterBloodType] = useState('');
  const [filterEligibility, setFilterEligibility] = useState('');

  const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (filterBloodType) params.blood_type = filterBloodType;
      if (filterEligibility) params.eligibility = filterEligibility;
      const r = await adminAPI.getBloodDonors(params);
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
      setPage(r.data.page || 1);
      setPages(r.data.pages || 1);
    } catch { toast.error('Error al cargar fichas médicas'); }
    finally { setLoading(false); }
  }, [filterBloodType, filterEligibility]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <select value={filterBloodType} onChange={e => setFilterBloodType(e.target.value)} className="input-field text-sm sm:w-44">
          <option value="">Todos los tipos</option>
          {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
        </select>
        <select value={filterEligibility} onChange={e => setFilterEligibility(e.target.value)} className="input-field text-sm sm:w-44">
          <option value="">Todos</option>
          <option value="eligible">Pueden donar</option>
          <option value="ineligible">No pueden donar</option>
        </select>
        <button onClick={() => load(1)} className="btn-primary flex items-center gap-2 shrink-0">
          <Search size={14} /> Buscar
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <strong className="text-gray-800 dark:text-gray-200">{total}</strong> donantes registrados
      </p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Donante</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Tipo de sangre</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Elegibilidad</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Última donación</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Donaciones</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Perfil</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : items.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                            {u.avatar_url
                              ? <img src={getMediaUrl(u.avatar_url)} alt="" className="w-full h-full object-cover" />
                              : <Droplets size={14} className="text-red-500" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{u.full_name}</p>
                            <p className="text-[11px] text-gray-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><BloodTypeBadge type={u.blood_type} /></td>
                      <td className="px-4 py-3"><EligibilityBadge item={u} /></td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600 dark:text-gray-400">
                        {u.last_donation_date ? new Date(u.last_donation_date).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {u.total_donations ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/users/${u.id}`}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 transition-colors inline-flex" title="Ver perfil">
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">No se encontraron donantes</p>
          )}
        </div>
      </div>

      <Pagination page={page} pages={pages} onChange={p => { setPage(p); load(p); }} />
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [period, setPeriod] = useState('mensual');

  const loadStats = useCallback((y, p) => {
    setLoading(true);
    setStatsError(false);
    adminAPI.getDashboard(y, p)
      .then(r => {
        setStats(r.data);
        if (r.data?.charts?.selected_year) setYear(r.data.charts.selected_year);
        if (r.data?.charts?.selected_period) setPeriod(r.data.charts.selected_period);
      })
      .catch(() => setStatsError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(year, period); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleYearChange = (y) => {
    setYear(y);
    loadStats(y, period);
  };

  const handlePeriodChange = (p) => {
    setPeriod(p);
    loadStats(year, p);
  };

  const TABS = [
    { key: 'stats',    label: 'Estadísticas',  icon: BarChart2 },
    { key: 'supplies', label: 'Publicaciones',  icon: Package },
    { key: 'users',    label: 'Usuarios',       icon: Users },
    { key: 'requests', label: 'Solicitudes',    icon: ClipboardList },
    { key: 'blood',    label: 'Fichas médicas', icon: Droplets },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-md">
          <Shield size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Panel de Administración</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestión completa de la plataforma</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
              ${tab === key
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'stats' && loading
        ? <StatsSkeleton />
        : tab === 'stats'    ? <StatsTab stats={stats} error={statsError} onRefresh={() => loadStats(year, period)}
                                  year={year} onYearChange={handleYearChange}
                                  period={period} onPeriodChange={handlePeriodChange} />
        : tab === 'supplies' ? <SuppliesTab />
        : tab === 'users'    ? <UsersTab />
        : tab === 'requests' ? <RequestsTab />
        : <BloodDonorsTab />
      }
    </div>
  );
}
