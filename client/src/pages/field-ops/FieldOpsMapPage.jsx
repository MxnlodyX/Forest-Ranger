// FieldOpsMapPage.jsx
import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { mapPoints } from './mockData';
import { FieldOpsNavigate } from './FieldOpsNavigate'; // ใช้ไฟล์เดิมที่สร้างไว้

// ตัวจัดการสีและรูปแบบเหมือนเดิม
function riskTone(level) {
    if (level === 'High') return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (level === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
}

// ฟังก์ชันสร้าง Custom Icon ให้ Leaflet (วาด HTML ลงไปบนแผนที่จริง)
const createTacticalMarker = (point, isSelected) => {
    let colorClass = "bg-emerald-500 border-emerald-200 text-emerald-100";
    if (point.riskLevel === 'High') colorClass = "bg-red-500 border-red-200 text-red-100";
    if (point.riskLevel === 'Medium') colorClass = "bg-amber-500 border-amber-200 text-amber-100";

    let svgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    if (point.type === 'Outpost') svgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>`;
    if (point.type === 'Hazard') svgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"></path></svg>`;

    const html = `
    <div class="relative flex flex-col items-center justify-center">
        ${isSelected ? `<span class="absolute w-12 h-12 rounded-full bg-emerald-500/30 animate-ping"></span>` : ''}
        <div class="w-8 h-8 rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,0.8)] flex items-center justify-center transition-transform ${colorClass} ${isSelected ? 'scale-125 ring-4 ring-white/30' : ''}">
           ${svgIcon}
        </div>
        <span class="mt-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded text-[9px] font-bold tracking-wider text-slate-200 border ${isSelected ? 'border-emerald-500' : 'border-slate-700/50'} whitespace-nowrap shadow-lg">
            ${point.id.toUpperCase()}
        </span>
    </div>
  `;

    return L.divIcon({
        html: html,
        className: 'custom-leaflet-pin', // ลบ default background
        iconSize: [40, 40],
        iconAnchor: [20, 20] // จุดศูนย์กลางให้อยู่ตรงพิกัดพอดี
    });
};

export function FieldOpsMapPage() {
    const [selectedPointId, setSelectedPointId] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const selectedPoint = useMemo(
        () => mapPoints.find((point) => point.id === selectedPointId) ?? null,
        [selectedPointId]
    );

    return (
        <div className="min-h-screen bg-[#111820] text-slate-200 font-sans flex justify-center pb-20 relative">

            {/* โหมดนำทาง (Popup ทับแผนที่) */}
            {isNavigating && selectedPoint && (
                <FieldOpsNavigate
                    destination={{
                        name: selectedPoint.name,
                        distance: `${selectedPoint.distanceKm} KM`,
                        eta: selectedPoint.eta,
                        position: selectedPoint.position // <--- เพิ่มบรรทัดนี้ ส่งพิกัดเป้าหมายไปให้หน้านำทาง
                    }}
                    onEndNavigation={() => setIsNavigating(false)} // ส่งฟังก์ชันกลับมาเพื่อปิดหน้านำทาง
                />
            )}

            <div className="w-full max-w-md px-4 py-6 flex flex-col gap-5 relative z-10">

                <div className="">
                    <h1 className="text-2xl font-bold text-white">Active Field Ops</h1>
                    <p className="text-sm text-slate-400 mt-1">Real-time map of detected points and navigation.</p>
                </div>
      

                {/* ... (ส่วนแสดงผลรายการ Available Waypoints และ Bottom Sheet ด้านล่าง ใช้โค้ดเดิมได้เลย) ... */}

                <div className="flex justify-between items-end">
                    <p className="text-sm text-slate-400 font-medium">Available Waypoints</p>
                    <p className="text-xs text-emerald-500 font-mono font-bold bg-emerald-900/30 px-2 py-1 rounded-md">{mapPoints.length} DETECTED</p>
                </div>

                {/* Waypoints List */}
                <div className="flex flex-col gap-3">
                    {mapPoints.map((point) => (
                        <div
                            key={`list-${point.id}`}
                            onClick={() => setSelectedPointId(point.id)}
                            className={`w-full text-left backdrop-blur-sm rounded-xl p-4 border transition-all active:scale-[0.98] group relative overflow-hidden cursor-pointer ${selectedPointId === point.id ? 'bg-[#1e293b] border-emerald-500/50' : 'bg-[#1e293b]/80 border-slate-700/50 hover:border-slate-500/50'}`}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${point.riskLevel === 'High' ? 'bg-red-500' : point.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

                            <div className="flex items-start justify-between gap-3 pl-2">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border ${riskTone(point.riskLevel)}`}>
                                        {/* ใช้ getIcon จากอันก่อน */}
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            {point.type === 'Outpost' ? <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" /> :
                                                point.type === 'Hazard' ? <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /> :
                                                    <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>}
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">{point.name}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{point.type} • {point.zone}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold tracking-wider uppercase border ${riskTone(point.riskLevel)}`}>
                                    {point.riskLevel}
                                </span>
                            </div>

                            {/* Data Grid + Quick Navigate Button */}
                            <div className="flex gap-2 mt-4 pl-2">
                                <div className="flex-1 bg-[#111820] rounded-lg px-3 py-2 border border-slate-700/50 flex flex-col justify-center">
                                    <span className="text-[9px] text-slate-500 font-bold tracking-wider">DIST</span>
                                    <span className="text-slate-200 font-mono text-xs font-bold">{point.distanceKm} KM</span>
                                </div>
                                <div className="flex-1 bg-[#111820] rounded-lg px-3 py-2 border border-slate-700/50 flex flex-col justify-center">
                                    <span className="text-[9px] text-slate-500 font-bold tracking-wider">ETA</span>
                                    <span className="text-slate-200 font-mono text-xs font-bold">{point.eta}</span>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPointId(point.id);
                                        setIsNavigating(true);
                                    }}
                                    className="w-14 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg flex flex-col items-center justify-center text-emerald-400 transition-colors shadow-inner"
                                >
                                    <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                                    <span className="text-[8px] font-bold tracking-wider">NAV</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Sheet */}
                {selectedPoint && (
                    <div className="fixed inset-0 z-[40] flex items-end justify-center pointer-events-none">
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedPointId(null)}></div>
                        <div className="w-full max-w-md bg-[#1b2433] border-t border-slate-600 rounded-t-3xl p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto transform transition-transform animate-[slideUp_0.3s_ease-out_forwards] relative">
                            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
                            <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-6"></div>

                            <div className="flex items-start justify-between gap-3 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedPoint.name}</h2>
                                    <p className="text-xs text-slate-400 font-medium">{selectedPoint.type} • {selectedPoint.zone}</p>
                                </div>
                                <button className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400" onClick={() => setSelectedPointId(null)}>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsNavigating(true)}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#0f1721] rounded-xl py-3.5 text-sm font-black tracking-wider uppercase transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] flex justify-center items-center gap-2"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                                    Navigate
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}