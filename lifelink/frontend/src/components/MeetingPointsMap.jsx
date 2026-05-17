import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MEETING_POINTS, METRO_BOUNDS, MAP_CENTER, MAP_ZOOM, TYPE_CONFIG } from '../data/meetingPoints';

/* ─── Icono SVG por tipo ────────────────────────────────── */
function buildIcon(L, point) {
  const cfg = TYPE_CONFIG[point.type];
  const color = cfg.color;
  const emoji = cfg.emoji;
  const id = `mp-${point.id}`;

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;width:42px;">
      <div style="
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,.28);
        display:flex;align-items:center;justify-content:center;
        border:2px solid white;
      ">
        <span style="transform:rotate(45deg);font-size:15px;">${emoji}</span>
      </div>
      <div style="
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:6px solid ${color};
        margin-top:-1px;
      "></div>
    </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [42, 50],
    iconAnchor: [21, 50],
    popupAnchor: [0, -54],
  });
}

/* ─── Popup HTML ────────────────────────────────────────── */
function buildPopup(point) {
  const cfg = TYPE_CONFIG[point.type];
  const tags = point.tags?.map(t =>
    `<span style="background:${cfg.bg};color:${cfg.color};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;">${t}</span>`
  ).join('') || '';

  const extra = point.lines
    ? `<div style="font-size:12px;color:#475569;margin-bottom:4px;">🚇 Líneas: <strong>${point.lines}</strong></div>`
    : '';

  const badge = point.accessible === true
    ? `<span style="background:#dcfce7;color:#15803d;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700;">♿ Accesible</span>`
    : '';

  const publicBadge = point.public === true
    ? `<span style="background:#dbeafe;color:#1d4ed8;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700;">Público</span>`
    : point.public === false
    ? `<span style="background:#fef3c7;color:#b45309;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700;">Privado</span>`
    : '';

  return `
    <div style="font-family:'Plus Jakarta Sans',system-ui;width:240px;padding:2px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="font-size:18px;">${cfg.emoji}</span>
        <div>
          <p style="font-weight:800;font-size:13px;color:#0c2a3e;margin:0;line-height:1.3;">
            ${point.name}
          </p>
          <span style="font-size:10px;color:${cfg.color};font-weight:600;">${cfg.label}</span>
        </div>
      </div>
      ${extra}
      <p style="font-size:11px;color:#64748b;margin:0 0 6px;line-height:1.5;">
        📍 ${point.address}
      </p>
      <p style="font-size:11px;color:#475569;margin:0 0 8px;line-height:1.5;background:#f8fafc;padding:6px 8px;border-radius:6px;">
        ${point.notes}
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px;">
        ${tags}
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        ${badge}${publicBadge}
      </div>
      <a href="/supplies" style="
        display:block;margin-top:10px;
        background:linear-gradient(135deg,${cfg.color},#14b8a6);
        color:white;padding:7px;border-radius:8px;
        text-align:center;font-size:12px;font-weight:700;
        text-decoration:none;
      ">Ver insumos disponibles →</a>
    </div>`;
}

/* ─── Componente ─────────────────────────────────────────── */
export default function MeetingPointsMap({
  height = '520px',
  filter = 'all',       // 'all' | 'metro_cdmx' | 'metro_edomex' | 'hospital'
  showLegend = true,
}) {
  const mapRef        = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef    = useRef([]);

  useEffect(() => {
    const init = async () => {
      const L = (await import('leaflet')).default;
      if (!mapRef.current || leafletMapRef.current) return;

      const bounds = L.latLngBounds(
        L.latLng(METRO_BOUNDS.sw[0], METRO_BOUNDS.sw[1]),
        L.latLng(METRO_BOUNDS.ne[0], METRO_BOUNDS.ne[1]),
      );

      const map = L.map(mapRef.current, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        zoomControl: false,
        maxBounds: bounds,
        maxBoundsViscosity: 0.85,
        minZoom: 10,
        maxZoom: 17,
      });
      leafletMapRef.current = map;

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, attribution: '© OpenStreetMap, © CartoDB' }
      ).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Filtrar puntos según prop
      const points = filter === 'all'
        ? MEETING_POINTS
        : MEETING_POINTS.filter(p => p.type === filter);

      for (const point of points) {
        const icon   = buildIcon(L, point);
        const popup  = buildPopup(point);
        const marker = L.marker(point.coords, { icon }).addTo(map);
        marker.bindPopup(popup, { maxWidth: 260, className: 'll-popup' });
        markersRef.current.push(marker);
      }
    };

    init();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [filter]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg z-0"
      />

      {/* Leyenda */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3 flex flex-col gap-1.5">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <span className="text-base leading-none">{cfg.emoji}</span>
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: cfg.color }}
              />
              {cfg.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
