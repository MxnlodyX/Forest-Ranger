// FieldOpsNavigate.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

  // จำลองพิกัดปัจจุบันของผู้ใช้ (ห่างจากจุดหมายนิดหน่อย)
  const currentLocation = [target.position[0] - 0.005, target.position[1] - 0.005];
  
  // จำลองเส้นทาง (Route) จากจุดปัจจุบันไปจุดหมาย (ทำเส้นหักมุมนิดหน่อยให้ดูสมจริง)
  const routePositions = [
    currentLocation,
    [currentLocation[0] + 0.004, currentLocation[1]], // จุดเลี้ยว
    target.position
  ];

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
          
          {/* เส้นทางนำทาง (Route Line) */}
          <Polyline 
            positions={routePositions} 
            color="red" // สีแดง
            weight={6} 
            opacity={0.8}
            dashArray="10, 10" // ทำเป็นเส้นประ
            className="animate-[dash_20s_linear_infinite]"
          />

          {/* จุดหมายปลายทาง */}
          <Marker position={target.position} icon={locationMarkerIcon} />
          
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
              <p className="text-3xl font-black text-emerald-400 font-mono leading-none">{target.eta}</p>
              <p className="text-xs text-slate-400 font-bold tracking-wide mt-1">ESTIMATED TIME</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white font-mono leading-none">{target.distance}</p>
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