import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../lib/leaflet-heat';
import { Flame, MapPinned, RefreshCcw } from 'lucide-react';

import { Button } from '../../components/ui';
import { api } from '../../services/api';

const DEFAULT_CENTER = [14.4386, 101.3724];
const EVENT_TYPE_OPTIONS = ['Fire', 'Emergency', 'Wildlife', 'Damage', 'Trap', 'Illegal Logging'];

function HeatLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return undefined;

    const heatPoints = points
      .map((point) => [Number(point.lat), Number(point.lng), Math.max(0.1, Number(point.intensity) / 5)])
      .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]) && Number.isFinite(point[2]));

    const layer = L.heatLayer(heatPoints, {
      radius: 24,
      blur: 20,
      maxZoom: 16,
      minOpacity: 0.35,
      gradient: { 0.2: '#22d3ee', 0.45: '#facc15', 0.8: '#f97316', 1.0: '#dc2626' },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const validPoints = points
      .map((point) => [Number(point.lat), Number(point.lng)])
      .filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));

    if (!validPoints.length) return;
    const bounds = L.latLngBounds(validPoints);
    map.fitBounds(bounds.pad(0.2), { animate: true, maxZoom: 14 });
  }, [map, points]);

  return null;
}

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    search.set(key, String(value));
  });
  return search.toString();
}

export function HeatMapManagementPage() {
  const [areaFilter, setAreaFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedPointId, setSelectedPointId] = useState(null);
  const selectedPoint = useMemo(
    () => points.find((item) => item.incident_id === selectedPointId) ?? null,
    [points, selectedPointId],
  );

  const fetchPoints = async () => {
    setLoading(true);
    setError('');

    try {
      const query = buildQuery({
        area_id: areaFilter || undefined,
        event_type: eventTypeFilter || undefined,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        page: 1,
        page_size: 500,
      });

      const endpoint = areaFilter
        ? `/api/heatmap/points/by-area?${query}`
        : `/api/heatmap/points?${query}`;

      const response = await api.get(endpoint);
      const items = Array.isArray(response) ? response : response?.items || [];
      setPoints(items);

      setSelectedPointId((prev) => {
        if (prev && items.some((item) => item.incident_id === prev)) {
          return prev;
        }
        return items.length ? items[0].incident_id : null;
      });
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load heatmap points.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPoints();
    }, 320);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaFilter, eventTypeFilter, startDate, endDate]);

  const stats = useMemo(() => {
    const total = points.length;
    const averageIntensity = total
      ? (points.reduce((sum, item) => sum + Number(item.intensity || 0), 0) / total).toFixed(2)
      : '0.00';

    const uniqueAreas = new Set(points.map((item) => String(item.area_id || '').trim()).filter(Boolean));

    return {
      total,
      averageIntensity,
      areaCount: uniqueAreas.size,
    };
  }, [points]);

  return (
    <section className="p-6 md:p-8 space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HeatMap Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze hotspots from incident reports with a Leaflet heat layer. Data is read-only and comes from reports.
          </p>
        </div>
        <Button onClick={fetchPoints} className="gap-2" variant="secondary">
          <RefreshCcw size={16} />
          Refresh
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sky-600">
            <MapPinned size={16} />
            <p className="text-sm font-medium">Total Heat Points</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </article>

        <article className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-orange-600">
            <Flame size={16} />
            <p className="text-sm font-medium">Average Intensity</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.averageIntensity}</p>
        </article>

        <article className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-emerald-600">
            <MapPinned size={16} />
            <p className="text-sm font-medium">Covered Areas</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.areaCount}</p>
        </article>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Area</label>
            <input
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
              placeholder="e.g. Zone A"
              className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 leading-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(event) => setEventTypeFilter(event.target.value)}
              className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 leading-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All event types</option>
              {EVENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Start</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 leading-normal outline-none transition [color-scheme:light] focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">End</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 leading-normal outline-none transition [color-scheme:light] focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="lg:col-span-1 flex items-end">
            <button
              type="button"
              onClick={() => {
                setAreaFilter('');
                setEventTypeFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Leaflet HeatMap</p>
            {loading && <p className="text-xs text-gray-500">Loading points...</p>}
          </div>

          <div className="h-[460px] overflow-hidden rounded-lg border border-gray-200">
            <MapContainer center={DEFAULT_CENTER} zoom={11} className="h-full w-full" scrollWheelZoom>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <HeatLayer points={points} />
              <FitBounds points={points} />

              {points.map((point) => (
                <CircleMarker
                  key={point.incident_id}
                  center={[Number(point.lat), Number(point.lng)]}
                  radius={Math.max(5, Number(point.intensity || 1) * 2)}
                  pathOptions={{
                    color: selectedPointId === point.incident_id ? '#0f766e' : '#155e75',
                    fillOpacity: 0.55,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedPointId(point.incident_id);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{point.incident_title || 'Incident'}</p>
                      <p className="font-semibold">{point.area_id}</p>
                      <p>{point.event_type} • intensity {point.intensity}</p>
                      <p>{new Date(point.recorded_at).toLocaleString()}</p>
                      <p>{point.location_name || 'Unknown location'}</p>
                      <p>{point.reporter_name || 'Unknown reporter'}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="space-y-5 xl:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Incident Records</h2>
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {!points.length ? (
                <p className="text-sm text-gray-500">No incident points found for current filters.</p>
              ) : (
                points.map((point) => (
                  <button
                    key={`item-${point.incident_id}`}
                    type="button"
                    onClick={() => {
                      setSelectedPointId(point.incident_id);
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedPointId === point.incident_id
                        ? 'border-cyan-300 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-800">{point.incident_title || 'Incident'}</p>
                    <p className="text-xs text-gray-500">
                      {point.event_type} • intensity {point.intensity} • {new Date(point.recorded_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{point.area_id} • {point.location_name || 'Unknown location'}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedPoint && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">Selected Incident</p>
              <p className="mt-2 text-xs text-gray-600">ID: {selectedPoint.incident_id}</p>
              <p className="text-xs text-gray-600">Title: {selectedPoint.incident_title || 'Unknown'}</p>
              <p className="text-xs text-gray-600">Area: {selectedPoint.area_id}</p>
              <p className="text-xs text-gray-600">Coords: {selectedPoint.lat}, {selectedPoint.lng}</p>
              <p className="text-xs text-gray-600">Type: {selectedPoint.event_type}</p>
              <p className="text-xs text-gray-600">Intensity: {selectedPoint.intensity}</p>
              <p className="text-xs text-gray-600">Reporter: {selectedPoint.reporter_name || 'Unknown'}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
