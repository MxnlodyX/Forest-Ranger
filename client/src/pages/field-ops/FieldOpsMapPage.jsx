import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CircleMarker,
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mapPoints } from './mockData';
import { FieldOpsNavigate } from './FieldOpsNavigate';
import { useAppContext } from '../../context/useAppContext';
import { api } from '../../services/api';

const DEFAULT_MAP_CENTER = [14.4386, 101.3724];

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

function riskTone(level) {
    if (level === 'High') return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (level === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
}

function RouteClickCapture({ enabled, onAddPoint }) {
    useMapEvents({
        click(event) {
            if (!enabled) return;
            onAddPoint([event.latlng.lat, event.latlng.lng]);
        },
    });
    return null;
}

function RecenterOnPosition({ position }) {
    const map = useMap();

    useEffect(() => {
        if (!position) return;
        map.setView(position, map.getZoom(), { animate: true });
    }, [map, position]);

    return null;
}

function distanceKm(positions) {
    if (!Array.isArray(positions) || positions.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < positions.length; i += 1) {
        const [lat1, lng1] = positions[i - 1];
        const [lat2, lng2] = positions[i];
        const latDiff = (lat2 - lat1) * 111.32;
        const lngScale = Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
        const lngDiff = (lng2 - lng1) * 111.32 * lngScale;
        total += Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    }
    return total;
}

const createTacticalMarker = (point, isSelected) => {
    let colorClass = 'bg-emerald-500 border-emerald-200 text-emerald-100';
    if (point.riskLevel === 'High') colorClass = 'bg-red-500 border-red-200 text-red-100';
    if (point.riskLevel === 'Medium') colorClass = 'bg-amber-500 border-amber-200 text-amber-100';

    let svgIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
    if (point.type === 'Outpost') svgIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>';
    if (point.type === 'Hazard') svgIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"></path></svg>';

    const html = `
        <div class="relative flex flex-col items-center justify-center">
            ${isSelected ? '<span class="absolute w-12 h-12 rounded-full bg-emerald-500/30 animate-ping"></span>' : ''}
            <div class="w-8 h-8 rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,0.8)] flex items-center justify-center transition-transform ${colorClass} ${isSelected ? 'scale-125 ring-4 ring-white/30' : ''}">
                ${svgIcon}
            </div>
            <span class="mt-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded text-[9px] font-bold tracking-wider text-slate-200 border ${isSelected ? 'border-emerald-500' : 'border-slate-700/50'} whitespace-nowrap shadow-lg">
                ${point.id.toUpperCase()}
            </span>
        </div>
    `;

    return L.divIcon({
        html,
        className: 'custom-leaflet-pin',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

export function FieldOpsMapPage() {
    const { currentUser } = useAppContext();
    const staffId = currentUser?.id;

    const [selectedPointId, setSelectedPointId] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [navigationTarget, setNavigationTarget] = useState(null);

    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [routeName, setRouteName] = useState('');
    const [routePoints, setRoutePoints] = useState([]);
    const [savingRoute, setSavingRoute] = useState(false);
    const [builderError, setBuilderError] = useState('');

    const [routes, setRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(false);
    const [routeError, setRouteError] = useState('');
    const [selectedRouteId, setSelectedRouteId] = useState(null);
    const [gpsPosition, setGpsPosition] = useState(null);
    const [gpsError, setGpsError] = useState('');
    const [isGpsReady, setIsGpsReady] = useState(false);

    const selectedPoint = useMemo(
        () => mapPoints.find((point) => point.id === selectedPointId) ?? null,
        [selectedPointId],
    );

    const selectedRoute = useMemo(
        () => routes.find((route) => route.route_id === selectedRouteId) ?? null,
        [routes, selectedRouteId],
    );

    const selectedRoutePositions = useMemo(
        () => (selectedRoute?.points || []).map((point) => [Number(point.lat), Number(point.lng)]),
        [selectedRoute],
    );

    const draftPositions = useMemo(
        () => routePoints.map((point) => [point.lat, point.lng]),
        [routePoints],
    );

    const draftDistance = useMemo(() => distanceKm(draftPositions), [draftPositions]);
    const mapCenter = useMemo(() => gpsPosition || DEFAULT_MAP_CENTER, [gpsPosition]);

    const loadRoutes = useCallback(async () => {
        if (!staffId) return;
        setLoadingRoutes(true);
        setRouteError('');
        try {
            const data = await api.get(`/api/patrol-routes?created_by=${staffId}`);
            const normalized = Array.isArray(data) ? data : [];
            setRoutes(normalized);
            setSelectedRouteId((prev) => {
                if (prev && normalized.some((route) => route.route_id === prev)) {
                    return prev;
                }
                return normalized.length ? normalized[0].route_id : null;
            });
        } catch (error) {
            setRouteError(error.message || 'Unable to load routes.');
        } finally {
            setLoadingRoutes(false);
        }
    }, [staffId]);

    useEffect(() => {
        loadRoutes();
    }, [loadRoutes]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported on this device/browser.');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setGpsPosition([position.coords.latitude, position.coords.longitude]);
                setIsGpsReady(true);
                setGpsError('');
            },
            (error) => {
                setGpsError(error?.message || 'Unable to read your current location.');
                setIsGpsReady(false);
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

    const handleMapPointAdd = (position) => {
        setBuilderError('');
        setRoutePoints((prev) => [
            ...prev,
            {
                lat: position[0],
                lng: position[1],
                label: `Point ${prev.length + 1}`,
            },
        ]);
    };

    const handlePointLabelChange = (index, value) => {
        setRoutePoints((prev) => prev.map((point, i) => (i === index ? { ...point, label: value } : point)));
    };

    const handleUndoPoint = () => {
        setRoutePoints((prev) => prev.slice(0, -1));
    };

    const handleClearPoints = () => {
        setRoutePoints([]);
    };

    const handleSaveRoute = async () => {
        if (!routeName.trim()) {
            setBuilderError('Route name is required.');
            return;
        }
        if (routePoints.length < 2) {
            setBuilderError('Add at least 2 points to save a route.');
            return;
        }

        setSavingRoute(true);
        setBuilderError('');
        try {
            await api.post('/api/patrol-routes', {
                route_name: routeName.trim(),
                status: 'Draft',
                estimated_minutes: Math.max(5, Math.round((draftDistance / 4.5) * 60)),
                points: routePoints.map((position, index) => ({
                    lat: Number(position.lat.toFixed(7)),
                    lng: Number(position.lng.toFixed(7)),
                    label: (position.label || '').trim() || `Point ${index + 1}`,
                })),
            });

            setRouteName('');
            setRoutePoints([]);
            setIsBuilderOpen(false);
            await loadRoutes();
        } catch (error) {
            setBuilderError(error.message || 'Unable to save route.');
        } finally {
            setSavingRoute(false);
        }
    };

    const handleDeleteRoute = async (routeId) => {
        const shouldDelete = window.confirm('Delete this route? This cannot be undone.');
        if (!shouldDelete) return;

        try {
            await api.delete(`/api/patrol-routes/${routeId}`);
            if (selectedRouteId === routeId) {
                setSelectedRouteId(null);
            }
            await loadRoutes();
        } catch (error) {
            setRouteError(error.message || 'Unable to delete route.');
        }
    };

    const openWaypointNavigation = (point) => {
        setNavigationTarget({
            name: point.name,
            distance: `${point.distanceKm} KM`,
            eta: point.eta,
            position: point.position,
            currentPosition: gpsPosition,
        });
        setIsNavigating(true);
    };

    const openRouteNavigation = () => {
        if (!selectedRoute || selectedRoutePositions.length < 2) return;
        const destination = selectedRoutePositions[selectedRoutePositions.length - 1];
        const km = distanceKm(selectedRoutePositions);
        const minutes = selectedRoute.estimated_minutes || Math.max(5, Math.round((km / 4.5) * 60));
        const pointLabels = (selectedRoute.points || []).map((point, index) => point.label || `Point ${index + 1}`);

        setNavigationTarget({
            name: selectedRoute.route_name,
            distance: `${km.toFixed(1)} KM`,
            eta: `${minutes} MIN`,
            position: destination,
            routePositions: selectedRoutePositions,
            pointLabels,
            currentPosition: gpsPosition,
        });
        setIsNavigating(true);
    };

    return (
        <div className="min-h-screen bg-[#111820] text-slate-200 font-sans flex justify-center pb-20 relative">
            {isNavigating && navigationTarget && (
                <FieldOpsNavigate
                    destination={navigationTarget}
                    onEndNavigation={() => {
                        setIsNavigating(false);
                        setNavigationTarget(null);
                    }}
                />
            )}

            <div className="w-full max-w-md px-4 py-6 flex flex-col gap-5 relative z-10">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Active Field Ops</h1>
                        <p className="text-sm text-slate-400 mt-1">Create patrol routes by tapping the map, then save for reuse.</p>
                        <p className={`text-xs mt-2 ${isGpsReady ? 'text-emerald-400' : 'text-amber-300'}`}>
                            {isGpsReady ? 'Live GPS connected.' : gpsError || 'Waiting for GPS permission...'}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsBuilderOpen((prev) => !prev)}
                        className="bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg px-3 py-2 text-xs font-bold tracking-wide"
                    >
                        {isBuilderOpen ? 'Close Builder' : '+ New Route'}
                    </button>
                </div>

                <div className="h-64 overflow-hidden rounded-2xl border border-slate-700/60">
                    <MapContainer center={mapCenter} zoom={12} className="w-full h-full" scrollWheelZoom>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {gpsPosition && (
                            <Marker position={gpsPosition} icon={currentLocationIcon}>
                                <Popup>Your live location</Popup>
                            </Marker>
                        )}

                        {gpsPosition && <RecenterOnPosition position={gpsPosition} />}

                        {mapPoints.map((point) => (
                            <Marker
                                key={`map-${point.id}`}
                                position={point.position}
                                icon={createTacticalMarker(point, selectedPointId === point.id)}
                                eventHandlers={{ click: () => setSelectedPointId(point.id) }}
                            >
                                <Popup>{point.name}</Popup>
                            </Marker>
                        ))}

                        {selectedRoutePositions.length > 1 && (
                            <Polyline positions={selectedRoutePositions} color="#38bdf8" weight={5} opacity={0.8} />
                        )}

                        {(selectedRoute?.points || []).map((point, index) => (
                            <CircleMarker
                                key={`selected-route-point-${point.point_id || index}`}
                                center={[Number(point.lat), Number(point.lng)]}
                                radius={6}
                                pathOptions={{ color: '#38bdf8', fillColor: '#7dd3fc', fillOpacity: 0.9 }}
                            >
                                <Popup>{point.label || `Point ${index + 1}`}</Popup>
                            </CircleMarker>
                        ))}

                        {draftPositions.length > 1 && (
                            <Polyline positions={draftPositions} color="#10b981" weight={5} opacity={0.9} dashArray="6,8" />
                        )}

                        {routePoints.map((point, index) => (
                            <CircleMarker
                                key={`draft-point-${index}`}
                                center={[point.lat, point.lng]}
                                radius={7}
                                pathOptions={{ color: '#10b981', fillColor: '#34d399', fillOpacity: 0.85 }}
                            >
                                <Popup>{point.label || `Point ${index + 1}`}</Popup>
                            </CircleMarker>
                        ))}

                        <RouteClickCapture enabled={isBuilderOpen} onAddPoint={handleMapPointAdd} />
                    </MapContainer>
                </div>

                {isBuilderOpen && (
                    <section className="bg-[#1e293b]/90 border border-emerald-700/40 rounded-xl p-4 flex flex-col gap-3">
                        <h2 className="text-sm font-bold text-emerald-300 tracking-wide">Route Builder</h2>
                        <p className="text-xs text-slate-400">Tap the map to add points in order. Use Undo or Clear before saving.</p>

                        <input
                            value={routeName}
                            onChange={(event) => setRouteName(event.target.value)}
                            placeholder="Route name (example: Sector 7 East Patrol)"
                            className="w-full bg-[#111820] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-[#111820] border border-slate-700 rounded-lg py-2">
                                <p className="text-[10px] text-slate-400 uppercase">Points</p>
                                <p className="text-sm font-bold text-white">{routePoints.length}</p>
                            </div>
                            <div className="bg-[#111820] border border-slate-700 rounded-lg py-2">
                                <p className="text-[10px] text-slate-400 uppercase">Distance</p>
                                <p className="text-sm font-bold text-white">{draftDistance.toFixed(1)} KM</p>
                            </div>
                            <div className="bg-[#111820] border border-slate-700 rounded-lg py-2">
                                <p className="text-[10px] text-slate-400 uppercase">ETA</p>
                                <p className="text-sm font-bold text-white">{Math.max(5, Math.round((draftDistance / 4.5) * 60))} MIN</p>
                            </div>
                        </div>

                        {routePoints.length > 0 && (
                            <div className="max-h-44 overflow-y-auto border border-slate-700 rounded-lg p-2 bg-[#111820] flex flex-col gap-2">
                                {routePoints.map((point, index) => (
                                    <div key={`point-input-${index}`} className="grid grid-cols-[64px_1fr] gap-2 items-center">
                                        <p className="text-[11px] font-bold text-emerald-300">P{index + 1}</p>
                                        <input
                                            value={point.label || ''}
                                            onChange={(event) => handlePointLabelChange(index, event.target.value)}
                                            placeholder={`Point ${index + 1} name`}
                                            className="w-full bg-[#0d1520] border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleUndoPoint}
                                disabled={routePoints.length === 0}
                                className="flex-1 bg-slate-700/70 disabled:opacity-40 hover:bg-slate-600 rounded-lg py-2 text-xs font-bold"
                            >
                                Undo
                            </button>
                            <button
                                onClick={handleClearPoints}
                                disabled={routePoints.length === 0}
                                className="flex-1 bg-slate-700/70 disabled:opacity-40 hover:bg-slate-600 rounded-lg py-2 text-xs font-bold"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleSaveRoute}
                                disabled={savingRoute}
                                className="flex-1 bg-emerald-500 text-[#0f1721] hover:bg-emerald-400 rounded-lg py-2 text-xs font-black uppercase"
                            >
                                {savingRoute ? 'Saving...' : 'Save Route'}
                            </button>
                        </div>

                        {builderError && <p className="text-xs text-red-400">{builderError}</p>}
                    </section>
                )}

                <div className="flex justify-between items-end">
                    <p className="text-sm text-slate-400 font-medium">Available Waypoints</p>
                    <p className="text-xs text-emerald-500 font-mono font-bold bg-emerald-900/30 px-2 py-1 rounded-md">
                        {mapPoints.length} DETECTED
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {mapPoints.map((point) => (
                        <div
                            key={`list-${point.id}`}
                            onClick={() => setSelectedPointId(point.id)}
                            className={`w-full text-left backdrop-blur-sm rounded-xl p-4 border transition-all active:scale-[0.98] group relative overflow-hidden cursor-pointer ${
                                selectedPointId === point.id
                                    ? 'bg-[#1e293b] border-emerald-500/50'
                                    : 'bg-[#1e293b]/80 border-slate-700/50 hover:border-slate-500/50'
                            }`}
                        >
                            <div
                                className={`absolute left-0 top-0 bottom-0 w-1 ${
                                    point.riskLevel === 'High' ? 'bg-red-500' : point.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                            />

                            <div className="flex items-start justify-between gap-3 pl-2">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border ${riskTone(point.riskLevel)}`}>
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            {point.type === 'Outpost' ? (
                                                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                                            ) : point.type === 'Hazard' ? (
                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
                                            ) : (
                                                <>
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </>
                                            )}
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">{point.name}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                            {point.type} • {point.zone}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold tracking-wider uppercase border ${riskTone(point.riskLevel)}`}>
                                    {point.riskLevel}
                                </span>
                            </div>

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
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setSelectedPointId(point.id);
                                        openWaypointNavigation(point);
                                    }}
                                    className="w-14 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg flex flex-col items-center justify-center text-emerald-400 transition-colors shadow-inner"
                                >
                                    <svg className="w-5 h-5 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                    </svg>
                                    <span className="text-[8px] font-bold tracking-wider">NAV</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <section className="bg-[#1e293b]/80 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3 mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white">My Saved Routes</h2>
                        <button
                            onClick={loadRoutes}
                            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                        >
                            Refresh
                        </button>
                    </div>

                    {loadingRoutes ? <p className="text-xs text-slate-400">Loading routes...</p> : null}
                    {routeError ? <p className="text-xs text-red-400">{routeError}</p> : null}

                    {!loadingRoutes && routes.length === 0 ? (
                        <p className="text-xs text-slate-400">No saved routes yet. Build one from the map above.</p>
                    ) : null}

                    <div className="flex flex-col gap-2">
                        {routes.map((route) => {
                            const positions = (route.points || []).map((point) => [Number(point.lat), Number(point.lng)]);
                            const km = distanceKm(positions);

                            return (
                                <div
                                    key={route.route_id}
                                    className={`rounded-lg border p-3 cursor-pointer ${
                                        selectedRouteId === route.route_id
                                            ? 'border-sky-500 bg-sky-500/10'
                                            : 'border-slate-700 bg-[#111820]'
                                    }`}
                                    onClick={() => setSelectedRouteId(route.route_id)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-bold text-slate-100">{route.route_name}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {route.points?.length || 0} pts • {km.toFixed(1)} KM • {route.status}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleDeleteRoute(route.route_id);
                                            }}
                                            className="text-[10px] px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/20"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={openRouteNavigation}
                        disabled={!selectedRoute || selectedRoutePositions.length < 2}
                        className="mt-1 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#0f1721] rounded-lg py-2 text-xs font-black uppercase"
                    >
                        Navigate Selected Route
                    </button>

                    {selectedRoute && (selectedRoute.points?.length || 0) > 0 && (
                        <div className="mt-1 border border-slate-700 rounded-lg bg-[#111820] p-3 flex flex-col gap-2 max-h-56 overflow-y-auto">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Route Points</p>
                            {selectedRoute.points.map((point, index) => (
                                <div
                                    key={`selected-route-point-row-${point.point_id || index}`}
                                    className="flex items-center justify-between gap-2 border border-slate-800 rounded-md px-2 py-1.5"
                                >
                                    <p className="text-xs text-slate-200 font-semibold">
                                        {index + 1}. {point.label || `Point ${index + 1}`}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                        {Number(point.lat).toFixed(5)}, {Number(point.lng).toFixed(5)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {selectedPoint && (
                    <div className="fixed inset-0 z-[40] flex items-end justify-center pointer-events-none">
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto"
                            onClick={() => setSelectedPointId(null)}
                        />
                        <div className="w-full max-w-md bg-[#1b2433] border-t border-slate-600 rounded-t-3xl p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto transform transition-transform animate-[slideUp_0.3s_ease-out_forwards] relative">
                            <style>{'@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }'}</style>
                            <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-6" />

                            <div className="flex items-start justify-between gap-3 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedPoint.name}</h2>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {selectedPoint.type} • {selectedPoint.zone}
                                    </p>
                                </div>
                                <button
                                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400"
                                    onClick={() => setSelectedPointId(null)}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => openWaypointNavigation(selectedPoint)}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#0f1721] rounded-xl py-3.5 text-sm font-black tracking-wider uppercase transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] flex justify-center items-center gap-2"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                    </svg>
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