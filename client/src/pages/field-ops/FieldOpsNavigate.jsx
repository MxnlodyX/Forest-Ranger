// FieldOpsNavigate.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function haversineDistanceKm(a, b) {
  if (!a || !b) return 0;

  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function routeDistanceKm(positions) {
  if (!Array.isArray(positions) || positions.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < positions.length; i += 1) {
    total += haversineDistanceKm(positions[i - 1], positions[i]);
  }

  return total;
}

function formatDistance(km) {
  if (km < 1) {
    return `${Math.max(1, Math.round(km * 1000))} M`;
  }
  return `${km.toFixed(1)} KM`;
}

function formatEta(minutes) {
  if (minutes < 60) {
    return `${minutes} MIN`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} HR`;
  }
  return `${hours} HR ${remainingMinutes} MIN`;
}

function isSamePosition(a, b) {
  if (!a || !b) return false;
  return Math.abs(a[0] - b[0]) < 0.0001 && Math.abs(a[1] - b[1]) < 0.0001;
}

function RecenterNavigation({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.setView(position, map.getZoom(), { animate: true });
  }, [map, position]);

  return null;
}

const locationMarkerIcon = L.divIcon({
  html: `
    <div class="flex items-center justify-center">
      <div class="w-7 h-7 bg-emerald-600 border-2 border-white rounded-full shadow-[0_0_12px_rgba(16,185,129,0.45)]"></div>
    </div>
  `,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const currentLocationIcon = L.divIcon({
  html: `
    <div class="flex items-center justify-center">
      <div class="w-7 h-7 bg-blue-600 border-2 border-white rounded-full shadow-[0_0_12px_rgba(37,99,235,0.45)]"></div>
      <div class="absolute w-11 h-11 bg-blue-500/20 rounded-full"></div>
    </div>
  `,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function FieldOpsNavigate({ destination, onEndNavigation = () => {} }) {
  // รับข้อมูลเป้าหมาย หรือใช้ค่า Default
  const target = destination || { 
    name: 'Khao Yai Central Sector', 
    distance: '0 KM', 
    eta: '-- MIN',
    position: [14.4386, 101.3724] 
  };

  const [livePosition, setLivePosition] = useState(target.currentPosition || null);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLivePosition([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        // Keep the last valid position if GPS update fails.
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // If a full route is provided (3+ points), use it directly in navigation map.
  const hasProvidedRoute = Array.isArray(target.routePositions) && target.routePositions.length >= 2;
  const shouldPrependCurrentToRoute = hasProvidedRoute
    && Boolean(livePosition || target.currentPosition)
    && !isSamePosition(livePosition || target.currentPosition, target.routePositions[0]);

  const routePositions = useMemo(() => {
    const currentPosition = livePosition || target.currentPosition || null;

    if (hasProvidedRoute) {
      if (shouldPrependCurrentToRoute && currentPosition) {
        return [currentPosition, ...target.routePositions];
      }
      return target.routePositions;
    }

    if (currentPosition) {
      return [currentPosition, target.position];
    }

    return [
      [target.position[0] - 0.005, target.position[1] - 0.005],
      [target.position[0] - 0.001, target.position[1] - 0.005],
      target.position,
    ];
  }, [hasProvidedRoute, livePosition, shouldPrependCurrentToRoute, target.currentPosition, target.position, target.routePositions]);

  const currentLocation = routePositions[0];
  const finalDestination = routePositions[routePositions.length - 1];
  const remainingDistanceKm = useMemo(() => routeDistanceKm(routePositions), [routePositions]);
  const estimatedSpeedKmh = Number(target.speedKmh) > 0 ? Number(target.speedKmh) : 4.5;
  const estimatedMinutes = useMemo(
    () => Math.max(1, Math.round((remainingDistanceKm / estimatedSpeedKmh) * 60)),
    [estimatedSpeedKmh, remainingDistanceKm],
  );
  const navigationDistanceLabel = formatDistance(remainingDistanceKm);
  const navigationEtaLabel = formatEta(estimatedMinutes);

  return (
    <div className="fixed inset-0 z-[60] bg-black text-slate-200 font-sans flex flex-col animate-[fadeIn_0.3s_ease-out]">
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

      {/* =========================================
          แผนที่นำทางแบบเต็มจอ (Full Screen Map)
          ========================================= */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={currentLocation} // โฟกัสกล้องที่ตำแหน่งปัจจุบันของเรา
          zoom={16} // ซูมใกล้ๆ แบบโหมดนำทาง
          zoomControl={false}
          scrollWheelZoom
          className="w-full h-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterNavigation position={currentLocation} />
          
          {/* เส้นทางนำทาง (Route Line) */}
          <Polyline 
            positions={routePositions} 
            color="red" // สีแดง
            weight={6} 
            opacity={0.8}
            dashArray="10, 10" // ทำเป็นเส้นประ
            className="animate-[dash_20s_linear_infinite]"
          />

          {hasProvidedRoute && routePositions.map((position, index) => (
            <CircleMarker
              key={`nav-route-point-${index}`}
              center={position}
              radius={5}
              pathOptions={{ color: '#fca5a5', fillColor: '#ef4444', fillOpacity: 0.9 }}
            >
              <Popup>
                {shouldPrependCurrentToRoute && index === 0
                  ? 'Current Position'
                  : (target.pointLabels && target.pointLabels[shouldPrependCurrentToRoute ? index - 1 : index])
                    || `Point ${shouldPrependCurrentToRoute ? index : index + 1}`}
              </Popup>
            </CircleMarker>
          ))}

          {/* จุดหมายปลายทาง */}
          <Marker position={finalDestination} icon={locationMarkerIcon} />
          
          {/* ตำแหน่งปัจจุบัน (ตัวเรา) */}
          <Marker position={currentLocation} icon={currentLocationIcon} />
        </MapContainer>
      </div>

      {/* =========================================
          UI Overlay ซ้อนทับบนแผนที่นำทาง
          ========================================= */}
      
      {/* 1. แถบคำสั่งด้านบน (Top Turn-by-Turn Panel) */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex flex-col items-center">
        <div className="w-full max-w-sm bg-[#111820]/90 backdrop-blur-md border border-emerald-900/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 text-emerald-400 shrink-0">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
          <div>
            <p className="text-[11px] text-emerald-400 font-mono font-bold tracking-widest uppercase">150 Meters</p>
            <h2 className="text-xl font-black text-white tracking-wide">Turn Right</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium truncate">Heading to {target.name}</p>
          </div>
        </div>
      </div>

      {/* 2. แถบข้อมูลและปุ่มยกเลิกด้านล่าง (Bottom Stats Panel) */}
      <div className="absolute bottom-0 left-0 w-full p-4 pb-8 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-center">
        <div className="w-full max-w-sm flex flex-col gap-3">
          
          {/* Stats Box */}
          <div className="bg-[#111820]/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
            <div>
              <p className="text-3xl font-black text-emerald-400 font-mono leading-none">{navigationEtaLabel}</p>
              <p className="text-xs text-slate-400 font-bold tracking-wide mt-1">ESTIMATED TIME</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white font-mono leading-none">{navigationDistanceLabel}</p>
              <p className="text-xs text-slate-400 font-bold tracking-wide mt-1">REMAINING</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={onEndNavigation}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-xl py-4 text-sm font-black tracking-wider uppercase transition-colors flex justify-center items-center gap-2 backdrop-blur-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              Exit Navigation
            </button>

          </div>

        </div>
      </div>

    </div>
  );
}