import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

// Approximate coordinates for major Mexican cities
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
  'silao': [20.9370, -101.4369], 'lazaro cardenas': [17.9586, -102.1914],
};

function getCityCoords(cityName) {
  if (!cityName) return null;
  const key = cityName.toLowerCase().trim();
  return CITY_COORDS[key] || null;
}

export default function SupplyMap({ supplies = [], height = '420px' }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    let L;
    let map;

    const init = async () => {
      L = (await import('leaflet')).default;

      // Fix default marker icon path issue with Vite
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current || leafletMapRef.current) return;

      map = L.map(mapRef.current, {
        center: [23.6345, -102.5528], // Centro de México
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      leafletMapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(map);

      // Group supplies by city
      const cityGroups = {};
      for (const supply of supplies) {
        const city = supply.city?.trim();
        if (!city) continue;
        const coords = getCityCoords(city);
        if (!coords) continue;
        const key = city.toLowerCase();
        if (!cityGroups[key]) {
          cityGroups[key] = { coords, label: city, items: [] };
        }
        cityGroups[key].items.push(supply);
      }

      // Add markers
      for (const group of Object.values(cityGroups)) {
        const { coords, label, items } = group;
        const count = items.length;

        const iconHtml = `
          <div style="
            background: linear-gradient(135deg, #0770a8, #14b8a6);
            color: white;
            font-family: 'Plus Jakarta Sans', system-ui;
            font-weight: 700;
            font-size: ${count > 9 ? '10' : '12'}px;
            width: 36px; height: 36px;
            border-radius: 50% 50% 50% 4px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 3px 10px rgba(7,112,168,0.4);
            border: 2px solid white;
            transform: rotate(-45deg);
          ">
            <span style="transform: rotate(45deg)">${count > 99 ? '99+' : count}</span>
          </div>`;

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        const urgentCount = items.filter((s) => s.is_urgent).length;
        const donationCount = items.filter((s) => s.supply_type === 'donacion').length;

        const popupHtml = `
          <div style="min-width:180px; font-family:'Plus Jakarta Sans',system-ui">
            <div style="font-weight:700; font-size:14px; color:#0c5d8a; margin-bottom:6px;">
              📍 ${label}
            </div>
            <div style="font-size:12px; color:#64748b; margin-bottom:8px;">
              <b style="color:#1a2332">${count}</b> insumo${count !== 1 ? 's' : ''} disponible${count !== 1 ? 's' : ''}
            </div>
            ${urgentCount > 0 ? `<div style="background:#fff6f0;color:#c72f0b;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;display:inline-block;margin-bottom:6px;">🚨 ${urgentCount} urgente${urgentCount !== 1 ? 's' : ''}</div>` : ''}
            ${donationCount > 0 ? `<div style="background:#f0fdfa;color:#0f766e;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;display:inline-block;margin-bottom:8px;">🎁 ${donationCount} donación${donationCount !== 1 ? 'es' : ''}</div>` : ''}
            <a href="/supplies?city=${encodeURIComponent(label)}"
               style="display:block;background:#0770a8;color:white;padding:6px 12px;border-radius:8px;text-align:center;font-size:12px;font-weight:600;text-decoration:none;margin-top:4px;">
              Ver insumos →
            </a>
          </div>`;

        const marker = L.marker(coords, { icon }).addTo(map);
        marker.bindPopup(popupHtml, { maxWidth: 240 });
        markersRef.current.push(marker);
      }

      // If no markers, keep default Mexico view
      if (markersRef.current.length > 0 && markersRef.current.length <= 15) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.3));
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
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0"
    />
  );
}
