const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-D9l5o6aT.js","assets/index-B7jGdZzz.js","assets/index-C1rwr1A_.css"])))=>i.map(i=>d[i]);
import{r as d,j as k,_ as w}from"./index-B7jGdZzz.js";const _={cdmx:[19.4326,-99.1332],"ciudad de mexico":[19.4326,-99.1332],"ciudad de méxico":[19.4326,-99.1332],"mexico city":[19.4326,-99.1332],guadalajara:[20.6597,-103.3496],monterrey:[25.6866,-100.3161],puebla:[19.0414,-98.2063],tijuana:[32.5149,-117.0382],leon:[21.1236,-101.6824],león:[21.1236,-101.6824],juarez:[31.6904,-106.4245],"ciudad juárez":[31.6904,-106.4245],cancun:[21.1619,-86.8515],cancún:[21.1619,-86.8515],merida:[20.9674,-89.5926],mérida:[20.9674,-89.5926],"san luis potosi":[22.1565,-100.9855],"san luis potosí":[22.1565,-100.9855],queretaro:[20.5888,-100.3899],querétaro:[20.5888,-100.3899],hermosillo:[29.0729,-110.9559],chihuahua:[28.6353,-106.0889],mexicali:[32.6245,-115.4523],culiacan:[24.8091,-107.394],culiacán:[24.8091,-107.394],acapulco:[16.8531,-99.8237],veracruz:[19.1738,-96.1342],aguascalientes:[21.8853,-102.2916],oaxaca:[17.0732,-96.7266],toluca:[19.2826,-99.6557],morelia:[19.706,-101.195],torreon:[25.5428,-103.4068],torreón:[25.5428,-103.4068],tampico:[22.2331,-97.8617],villahermosa:[17.9869,-92.9303],tuxtla:[16.7521,-93.1152],"tuxtla gutierrez":[16.7521,-93.1152],"tuxtla gutiérrez":[16.7521,-93.1152],saltillo:[25.4267,-101.0048],durango:[24.0277,-104.6532],tepic:[21.5042,-104.8958],colima:[19.2452,-103.7241],mazatlan:[23.2494,-106.4111],mazatlán:[23.2494,-106.4111],zacatecas:[22.7709,-102.5832],pachuca:[20.1011,-98.7591],cuernavaca:[18.9242,-99.2216],xalapa:[19.5438,-96.9102],tlaxcala:[19.3139,-98.2404],campeche:[19.8301,-90.5349],chetumal:[18.5001,-88.3],"la paz":[24.1426,-110.3128],"los cabos":[22.8909,-109.9167],"cabo san lucas":[22.8909,-109.9167],ensenada:[31.8667,-116.596],matamoros:[25.8691,-97.5027],"nuevo laredo":[27.4761,-99.5155],reynosa:[26.075,-98.2849],celaya:[20.5236,-100.8145],irapuato:[20.6767,-101.3478],silao:[20.937,-101.4369],"lazaro cardenas":[17.9586,-102.1914]};function $(r){if(!r)return null;const p=r.toLowerCase().trim();return _[p]||null}function j({supplies:r=[],height:p="420px"}){const m=d.useRef(null),i=d.useRef(null),s=d.useRef([]);return d.useEffect(()=>{let t,c;return(async()=>{var h;if(t=(await w(async()=>{const{default:e}=await import("./leaflet-src-D9l5o6aT.js").then(o=>o.l);return{default:e}},__vite__mapDeps([0,1,2]))).default,delete t.Icon.Default.prototype._getIconUrl,t.Icon.Default.mergeOptions({iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"}),!m.current||i.current)return;c=t.map(m.current,{center:[23.6345,-102.5528],zoom:5,zoomControl:!0,scrollWheelZoom:!1}),i.current=c,t.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{maxZoom:18}).addTo(c);const u={};for(const e of r){const o=(h=e.city)==null?void 0:h.trim();if(!o)continue;const l=$(o);if(!l)continue;const a=o.toLowerCase();u[a]||(u[a]={coords:l,label:o,items:[]}),u[a].items.push(e)}for(const e of Object.values(u)){const{coords:o,label:l,items:a}=e,n=a.length,b=`
          <div style="
            background: linear-gradient(135deg, #0770a8, #14b8a6);
            color: white;
            font-family: 'Plus Jakarta Sans', system-ui;
            font-weight: 700;
            font-size: ${n>9?"10":"12"}px;
            width: 36px; height: 36px;
            border-radius: 50% 50% 50% 4px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 3px 10px rgba(7,112,168,0.4);
            border: 2px solid white;
            transform: rotate(-45deg);
          ">
            <span style="transform: rotate(45deg)">${n>99?"99+":n}</span>
          </div>`,v=t.divIcon({html:b,className:"",iconSize:[36,36],iconAnchor:[18,36],popupAnchor:[0,-36]}),f=a.filter(x=>x.is_urgent).length,g=a.filter(x=>x.supply_type==="donacion").length,z=`
          <div style="min-width:180px; font-family:'Plus Jakarta Sans',system-ui">
            <div style="font-weight:700; font-size:14px; color:#0c5d8a; margin-bottom:6px;">
              📍 ${l}
            </div>
            <div style="font-size:12px; color:#64748b; margin-bottom:8px;">
              <b style="color:#1a2332">${n}</b> insumo${n!==1?"s":""} disponible${n!==1?"s":""}
            </div>
            ${f>0?`<div style="background:#fff6f0;color:#c72f0b;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;display:inline-block;margin-bottom:6px;">🚨 ${f} urgente${f!==1?"s":""}</div>`:""}
            ${g>0?`<div style="background:#f0fdfa;color:#0f766e;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;display:inline-block;margin-bottom:8px;">🎁 ${g} donación${g!==1?"es":""}</div>`:""}
            <a href="/supplies?city=${encodeURIComponent(l)}"
               style="display:block;background:#0770a8;color:white;padding:6px 12px;border-radius:8px;text-align:center;font-size:12px;font-weight:600;text-decoration:none;margin-top:4px;">
              Ver insumos →
            </a>
          </div>`,y=t.marker(o,{icon:v}).addTo(c);y.bindPopup(z,{maxWidth:240}),s.current.push(y)}if(s.current.length>0&&s.current.length<=15){const e=t.featureGroup(s.current);c.fitBounds(e.getBounds().pad(.3))}})(),()=>{i.current&&(i.current.remove(),i.current=null,s.current=[])}},[r]),k.jsx("div",{ref:m,style:{height:p,width:"100%"},className:"rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0"})}export{j as default};
