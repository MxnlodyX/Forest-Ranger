import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Filter,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Trees,
  Pencil,
} from 'lucide-react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '../../components/ui';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';

const defaultMapPoint = [14.4386, 101.3724];

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

const parseCoordinate = (coordinateText) => {
  if (!coordinateText) return null;

  const [latStr, lngStr] = coordinateText.split(',').map((item) => item.trim());
  const lat = Number(latStr);
  const lng = Number(lngStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return [lat, lng];
};

const formatCoordinate = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

const locationTypeOptions = [
  'Water Source',
  'Ranger Outpost',
  'Wildlife Hotspot',
  'Illegal Logging Risk',
  'Fire Watch Point',
  'Tourist Trail Entrance',
];

const riskLevelOptions = ['Low', 'Medium', 'High'];

const emptyForm = {
  name: '',
  type: locationTypeOptions[0],
  sector: '',
  coordinate: '',
  riskLevel: 'Low',
  description: '',
};

export function PatrolAreasPage() {
  const fetchLocations = useCallback(() => api.get('/api/locations'), []);
  const {
    data: locationData,
    loading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useApi(fetchLocations);

  const locations = useMemo(
    () => (Array.isArray(locationData) ? locationData : []).map((item) => ({
      id: item.location_id,
      name: item.location_name || '',
      type: item.location_type || 'Water Source',
      sector: item.sector || '',
      coordinate: item.coordinates || '',
      riskLevel: item.risk_level || 'Low',
      description: item.description || '',
    })),
    [locationData],
  );

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [mapPosition, setMapPosition] = useState(defaultMapPoint);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!locations.length) {
      setSelectedLocationId(null);
      return;
    }

    setSelectedLocationId((prev) => {
      if (prev && locations.some((item) => item.id === prev)) {
        return prev;
      }
      return locations[0].id;
    });
  }, [locations]);

  const stats = useMemo(() => {
    const highRisk = locations.filter((item) => item.riskLevel === 'High').length;
    const hotspots = locations.filter((item) => item.type === 'Wildlife Hotspot').length;

    return {
      total: locations.length,
      highRisk,
      hotspots,
    };
  }, [locations]);

  const filteredLocations = useMemo(() => {
    return locations.filter((item) => {
      const q = query.toLowerCase();
      const matchQuery =
        String(item.id).toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.sector.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q);

      const matchType = typeFilter === 'All' || item.type === typeFilter;
      const matchRisk = riskFilter === 'All' || item.riskLevel === riskFilter;

      return matchQuery && matchType && matchRisk;
    });
  }, [locations, query, typeFilter, riskFilter]);

  const selectedLocation = useMemo(
    () => locations.find((item) => item.id === selectedLocationId) ?? null,
    [locations, selectedLocationId],
  );

  const openCreateForm = () => {
    setEditingLocationId(null);
    setFormData(emptyForm);
    setMapPosition(defaultMapPoint);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (location) => {
    setEditingLocationId(location.id);
    setFormData({
      name: location.name,
      type: location.type,
      sector: location.sector,
      coordinate: location.coordinate,
      riskLevel: location.riskLevel,
      description: location.description,
    });
    setMapPosition(parseCoordinate(location.coordinate) ?? defaultMapPoint);
    setFormError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingLocationId(null);
    setFormData(emptyForm);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const parsed = parseCoordinate(formData.coordinate);
    if (!parsed) {
      setFormError('Coordinate must be a valid lat, lng pair.');
      return;
    }

    const payload = {
      location_name: formData.name.trim(),
      location_type: formData.type,
      sector: formData.sector.trim() || null,
      coordinates: formatCoordinate(parsed[0], parsed[1]),
      risk_level: formData.riskLevel,
      description: formData.description.trim() || null,
    };

    if (!payload.location_name) {
      setFormError('Location name is required.');
      return;
    }

    setIsSaving(true);
    try {
      let saved;
      if (editingLocationId) {
        saved = await api.put(`/api/locations/${editingLocationId}`, payload);
      } else {
        saved = await api.post('/api/locations', payload);
      }
      await refetchLocations();
      setSelectedLocationId(saved?.location_id ?? null);
      closeForm();
    } catch (error) {
      setFormError(error.message || 'Failed to save location point.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (locationId) => {
    const ok = window.confirm('Delete this location point?');
    if (!ok) return;
    try {
      await api.delete(`/api/locations/${locationId}`);
      await refetchLocations();
      if (selectedLocationId === locationId) {
        setSelectedLocationId(null);
      }
    } catch (error) {
      window.alert(error.message || 'Failed to delete location point.');
    }
  };

  const getRiskPill = (riskLevel) => {
    if (riskLevel === 'High') return 'bg-red-100 text-red-700';
    if (riskLevel === 'Medium') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  return (
    <section className="p-6 md:p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patrol Areas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage forest location points, track where they are, and define their purpose.
          </p>
        </div>
        <Button onClick={openCreateForm} className="gap-2">
          <Plus size={16} />
          Add Location Point
        </Button>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <MapPin size={16} />
            <p className="text-sm font-medium">Total Points</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-red-600">
            <AlertTriangle size={16} />
            <p className="text-sm font-medium">High Risk Points</p>
          </div>
          <p className="text-3xl font-bold text-red-700">{stats.highRisk}</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-emerald-600">
            <Trees size={16} />
            <p className="text-sm font-medium">Wildlife Hotspots</p>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{stats.hotspots}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Search
            </label>
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by location name, ID, sector, or type"
                className="h-10 w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-sm text-gray-800 outline-none transition focus:border-blue-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Location Type
            </label>
            <div className="relative">
              <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-500"
              >
                <option value="All">All types</option>
                {locationTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Risk
            </label>
            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500"
            >
              <option value="All">All</option>
              {riskLevelOptions.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-8">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Risk</th>
                  <th className="px-4 py-3 font-semibold">Coordinate</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locationsLoading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-400" colSpan={5}>
                      Loading location points...
                    </td>
                  </tr>
                ) : locationsError ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-red-600" colSpan={5}>
                      {locationsError}
                    </td>
                  </tr>
                ) : filteredLocations.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                      No locations match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition hover:bg-gray-50 ${selectedLocationId === item.id ? 'bg-blue-50/60' : 'bg-white'
                        }`}
                      onClick={() => setSelectedLocationId(item.id)}
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">LOC-{item.id} • {item.sector}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRiskPill(item.riskLevel)}`}
                        >
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.coordinate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            title="Edit location"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditForm(item);
                            }}
                            className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            title="Delete location"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-4">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Location Details</h2>
          {!selectedLocation ? (
            <p className="text-sm text-gray-500">Select a location from the table to view details.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location Name</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{selectedLocation.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location ID</p>
                  <p className="mt-1 text-sm text-gray-800">LOC-{selectedLocation.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sector</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedLocation.sector}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedLocation.type}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Risk</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRiskPill(selectedLocation.riskLevel)}`}
                  >
                    {selectedLocation.riskLevel}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Coordinate</p>
                <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  {selectedLocation.coordinate}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</p>
                <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  {selectedLocation.description || 'No description'}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 gap-2"
                  variant="secondary"
                  onClick={() => openEditForm(selectedLocation)}
                >
                  <Pencil size={14} />
                  Edit
                </Button>
                <Button
                  className="flex-1 gap-2"
                  variant="danger"
                  onClick={() => handleDelete(selectedLocation.id)}
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingLocationId ? 'Update Location Point' : 'Create Location Point'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Specify what this location point is, which sector it belongs to, and its coordinates.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Location Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Ex. East Ridge Water Point"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Location Type</label>
                  <select
                    value={formData.type}
                    onChange={(event) => setFormData({ ...formData, type: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    {locationTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Risk Level</label>
                  <select
                    value={formData.riskLevel}
                    onChange={(event) => setFormData({ ...formData, riskLevel: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    {riskLevelOptions.map((risk) => (
                      <option key={risk} value={risk}>
                        {risk}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Sector</label>
                  <input
                    required
                    value={formData.sector}
                    onChange={(event) => setFormData({ ...formData, sector: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Ex. Northern Sector A"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Coordinate</label>
                  <input
                    required
                    value={formData.coordinate}
                    onChange={(event) => setFormData({ ...formData, coordinate: event.target.value })}
                    onBlur={(event) => {
                      const parsed = parseCoordinate(event.target.value);
                      if (parsed) {
                        setMapPosition(parsed);
                        setFormData((prev) => ({ ...prev, coordinate: formatCoordinate(parsed[0], parsed[1]) }));
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Latitude, Longitude"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Drag and drop marker to set location
                </p>
                <div className="h-64 overflow-hidden rounded-xl border border-gray-200">
                  <MapContainer center={mapPosition} zoom={15} className="h-full w-full" scrollWheelZoom>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker
                      position={mapPosition}
                      icon={locationMarkerIcon}
                      draggable
                      eventHandlers={{
                        dragend: (event) => {
                          const { lat, lng } = event.target.getLatLng();
                          setMapPosition([lat, lng]);
                          setFormData((prev) => ({
                            ...prev,
                            coordinate: formatCoordinate(lat, lng),
                          }));
                        },
                      }}
                    />
                  </MapContainer>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Tip: Drag the marker to set the position, or enter coordinates in lat, lng format.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Describe this point, such as cautions or operational purpose."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="secondary" onClick={closeForm} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingLocationId ? 'Save Changes' : 'Create Point'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
