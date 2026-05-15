import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

/* ─── City coordinates (Mexico) ──────────────────────── */
const CITY_COORDS = {
  'cdmx': [19.4326, -99.1332], 'ciudad de mexico': [19.4326, -99.1332],
  'ciudad de méxico': [19.4326, -99.1332], 'mexico city': [19.4326, -99.1332],
  'guadalajara': [20.6597, -103.3496], 'monterrey': [25.6866, -100.3161],
  'puebla': [19.0414, -98.2063], 'tijuana': [32.5149, -117.0382],
  'leon': [21.1236, -101.6824], 'león': [21.1236, -101.6824],
  'juarez': [31.6904, -106.4245], 'ciudad juárez': [31.6904, -106.4245],
  'cancun': [21.1619, -86.8515], 'cancún': [21.1619, -86.8515],
  'merida': [20.9674, -89.5926], 'mérida': [20.9674, -89.5926],
  'san luis potosi': [22.1565, -100.9855], 'san luis potosí': [22.1565, -100.9855],
  'queretaro': [20.5888, -100.3899], 'querétaro': [20.5888, -100.3899],
  'hermosillo': [29.0729, -110.9559], 'chihuahua': [28.6353, -106.0889],
  'mexicali': [32.6245, -115.4523], 'culiacan': [24.8091, -107.3940],
  'culiacán': [24.8091, -107.3940], 'acapulco': [16.8531, -99.8237],
  'veracruz': [19.1738, -96.1342], 'aguascalientes': [21.8853, -102.2916],
  'oaxaca': [17.0732, -96.7266], 'toluca': [19.2826, -99.6557],
  'morelia': [19.7060, -101.1950], 'torreon': [25.5428, -103.4068],
  'torreón': [25.5428, -103.4068], 'tampico': [22.2331, -97.8617],
  'villahermosa': [17.9869, -92.9303], 'tuxtla': [16.7521, -93.1152],
  'tuxtla gutierrez': [16.7521, -93.1152], 'tuxtla gutiérrez': [16.7521, -93.1152],
  'saltillo': [25.4267, -101.0048], 'durango': [24.0277, -104.6532],
  'tepic': [21.5042, -104.8958], 'colima': [19.2452, -103.7241],
  'mazatlan': [23.2494, -106.4111], 'mazatlán': [23.2494, -106.4111],
  'zacatecas': [22.7709, -102.5832], 'pachuca': [20.1011, -98.7591],
  'cuernavaca': [18.9242, -99.2216], 'xalapa': [19.5438, -96.9102],
  'tlaxcala': [19.3139, -98.2404], 'campeche': [19.8301, -90.5349],
  'chetumal': [18.5001, -88.3000], 'la paz': [24.1426, -110.3128],
  'los cabos': [22.8909, -109.9167], 'cabo san lucas': [22.8909, -109.9167],
  'ensenada': [31.8667, -116.5960], 'matamoros': [25.8691, -97.5027],
  'nuevo laredo': [27.4761, -99.5155], 'reynosa': [26.0750, -98.2849],
  'celaya': [20.5236, -100.8145], 'irapuato': [20.6767, -101.3478],
};

function getCityCoords(cityName) {
  if (!cityName) return null;
  return CITY_COORDS[cityName.toLowerCase().trim()] || null;
}

/* ─── Build SVG pin icon ─────────────────────────────── */
function buildPinIcon(L, count, isUrgent, cityKey) {
  const c1 = isUrgent ? '#ff5f20' : '#0770a8';
  const c2 = isUrgent ? '#c72f0b' : '#14b8a6';
  const fs = count > 99 ? 9 : count > 9 ? 11 : 13;
  const label = count > 99 ? '99+' : String(count);
  const id = `ll-${cityKey}`;

  const html = `
    <div class="ll-pin${isUrgent ? ' ll-pin-urgent' : ''}">
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54">
        <defs>
          <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}"/>
            <stop offset="100%" stop-color="${c2}"/>
          </linearGradient>
          <filter id="${id}-sh">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.28)"/>
          </filter>
        </defs>
        <path d="M22 1C11.5 1 3 9.5 3 20c0 13.25 16.5 27.5 18.1 28.9a1.4 1.4 0 0 0 1.8 0C24.5 47.5 41 33.25 41 20 41 9.5 32.5 1 22 1z"
              fill="url(#${id})" filter="url(#${id}-sh)"/>
        <circle cx="22" cy="20" r="13" fill="white" opacity="0.93"/>
        <text x="22" y="${20 + fs / 2 + 1}" text-anchor="middle"
              font-size="${fs}" font-weight="800"
              font-family="Plus Jakarta Sans, Arial, sans-serif"
              fill="${c1}">${label}</text>
      </svg>
    </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -58],
  });
}

/* ─── Build rich HTML popup ──────────────────────────── */
function buildPopupHtml(label, items) {
  const count = items.length;
  const urgentCount   = items.filter((s) => s.is_urgent).length;
  const donationCount = items.filter((s) => s.supply_type === 'donacion').length;

  const thumbs = items
    .filter((s) => s.images?.length > 0)
    .slice(0, 3)
    .map((s) => {
      const img = s.images.find((i) => i.is_primary) || s.images[0];
      return `<img src="${img.image_url}" alt=""
        style="width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;flex-shrink:0"/>`;
    });

  const badges = [
    urgentCount > 0
      ? `<span style="background:#fff1ee;color:#c72f0b;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap">
           🚨 ${urgentCount} urgente${urgentCount !== 1 ? 's' : ''}
         </span>` : '',
    donationCount > 0
      ? `<span style="background:#f0fdfa;color:#0f766e;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap">
           🎁 ${donationCount} gratis
         </span>` : '',
  ].filter(Boolean).join('');

  return `
    <div style="font-family:'Plus Jakarta Sans',system-ui;min-width:200px;max-width:240px">
      <div style="font-weight:800;font-size:15px;color:#0c5d8a;margin-bottom:6px;display:flex;align-items:center;gap:5px">
        <span>📍</span><span>${label}</span>
      </div>
      <div style="font-size:12px;color:#64748b;margin-bottom:${badges ? '8px' : '10px'}">
        <strong style="color:#1a2332;font-size:14px">${count}</strong>
        insumo${count !== 1 ? 's' : ''} disponible${count !== 1 ? 's' : ''}
      </div>
      ${badges ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:${thumbs.length ? '10px' : '10px'}">${badges}</div>` : ''}
      ${thumbs.length ? `<div style="display:flex;gap:4px;margin-bottom:10px">${thumbs.join('')}</div>` : ''}
      <a href="/supplies?city=${encodeURIComponent(label)}"
         style="display:block;background:linear-gradient(135deg,#0770a8,#14b8a6);color:white;padding:7px 14px;
                border-radius:10px;text-align:center;font-size:12px;font-weight:700;text-decoration:none">
        Ver ${count} insumo${count !== 1 ? 's' : ''} →
      </a>
    </div>`;
}

/* ─── Component ──────────────────────────────────────── */
export default function SupplyMap({ supplies = [], height = '420px' }) {
  const mapRef        = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef    = useRef([]);

  useEffect(() => {
    const init = async () => {
      const L = (await import('leaflet')).default;

      if (!mapRef.current || leafletMapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [23.6345, -102.5528],
        zoom: 5,
        zoomControl: false,
        scrollWheelZoom: false,
      });
      leafletMapRef.current = map;

      /* CartoDB Voyager — much more vibrant than light_all */
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, attribution: '© OpenStreetMap, © CartoDB' }
      ).addTo(map);

      /* Zoom controls bottom-right */
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      /* Group by city */
      const cityGroups = {};
      for (const supply of supplies) {
        const city = supply.city?.trim();
        if (!city) continue;
        const coords = getCityCoords(city);
        if (!coords) continue;
        const key = city.toLowerCase().replace(/\s+/g, '');
        if (!cityGroups[key]) cityGroups[key] = { coords, label: city, items: [], key };
        cityGroups[key].items.push(supply);
      }

      /* Add markers */
      for (const group of Object.values(cityGroups)) {
        const { coords, label, items, key } = group;
        const isUrgent = items.some((s) => s.is_urgent);

        const icon    = buildPinIcon(L, items.length, isUrgent, key);
        const popup   = buildPopupHtml(label, items);
        const marker  = L.marker(coords, { icon }).addTo(map);
        marker.bindPopup(popup, { maxWidth: 260, className: 'll-popup' });
        markersRef.current.push(marker);
      }

      /* Fit bounds */
      if (markersRef.current.length === 1) {
        map.setView(markersRef.current[0].getLatLng(), 10);
      } else if (markersRef.current.length > 1) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.25));
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
  }, [supplies]);

  return (
    <div ref={mapRef} style={{ height, width: '100%' }}
      className="rounded-2xl overflow-hidden border border-white/20 shadow-xl z-0" />
  );
}
