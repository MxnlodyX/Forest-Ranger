import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  Trash2,
  Search,
  Filter,
  X,
  CheckCircle2,
  Clock,
  MessageSquare,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Map as MapIcon,
  List as ListIcon,
  Flame,
  Droplets,
  PawPrint,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api, resolveMediaUrl } from '../../services/api';
import { useAppContext } from '../../context/useAppContext';

const STATUS_OPTIONS = ['Pending', 'Received', 'In Progress', 'Resolved', 'Rejected'];
const URGENCY_OPTIONS = ['normal', 'urgent', 'emergency'];

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Received': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'In Progress': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'Resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'normal': return 'bg-emerald-50 text-emerald-600';
    case 'urgent': return 'bg-orange-50 text-orange-600';
    case 'emergency': return 'bg-rose-50 text-rose-600 animate-pulse font-bold';
    default: return 'bg-gray-50 text-gray-600';
  }
};

const getIncidentIcon = (type) => {
  switch (type) {
    case 'fire': return <Flame size={16} />;
    case 'flood': return <Droplets size={16} />;
    case 'wildlife': return <PawPrint size={16} />;
    default: return <Info size={16} />;
  }
};

const getMarkerIcon = (alertsAtLocation) => {
  if (!Array.isArray(alertsAtLocation)) return L.divIcon({ html: '?' });

  // Find highest urgency in the group
  const hasEmergency = alertsAtLocation.some(a => a.urgency === 'emergency');
  const hasUrgent = alertsAtLocation.some(a => a.urgency === 'urgent');

  let color = '#10b981'; // normal
  let type = alertsAtLocation[0]?.incident_type || 'other'; // primary type

  if (hasEmergency) color = '#ef4444';
  else if (hasUrgent) color = '#f59e0b';

  const count = alertsAtLocation.length;
  const showBadge = count > 1;

  const html = `
    <div class="relative flex items-center justify-center">
      ${hasEmergency ? `<div class="absolute w-10 h-10 rounded-full opacity-20 animate-ping" style="background-color: ${color}"></div>` : ''}
      <div class="relative w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-lg" style="background-color: ${color}">
        
      </div>
      ${showBadge ? `
        <div class="absolute -top-1 -right-1 bg-white text-gray-900 border-2 border-gray-800 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
          ${count}
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export function PublicAlertsPage() {
  const { currentUser } = useAppContext();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view' | 'edit'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const [formData, setFormData] = useState({
    status: '',
    staff_comments: '',
  });

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/alerts');
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch public alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (alert.reporter_name || '').toLowerCase().includes(q) ||
        (alert.reporter_phone || '').toLowerCase().includes(q) ||
        (alert.reporter_email || '').toLowerCase().includes(q) ||
        (alert.description || '').toLowerCase().includes(q) ||
        (alert.incident_type || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || alert.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'All' || alert.urgency === urgencyFilter;

      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [alerts, searchQuery, statusFilter, urgencyFilter]);

  // Group alerts by coordinates for map markers
  const groupedAlerts = useMemo(() => {
    const groups = {};
    filteredAlerts.forEach(alert => {
      const coords = alert.coordinates;
      if (!coords) return;
      if (!groups[coords]) groups[coords] = [];
      groups[coords].push(alert);
    });
    return Object.entries(groups).map(([coords, alertsAtLoc]) => ({
      coords,
      alerts: alertsAtLoc,
      location_name: alertsAtLoc[0].location_name
    }));
  }, [filteredAlerts]);

  const selectedAlert = useMemo(
    () => alerts.find(a => a.alert_id === selectedAlertId) || null,
    [alerts, selectedAlertId]
  );

  const openModal = (mode, alert) => {
    setSelectedAlertId(alert.alert_id);
    setModalMode(mode);
    if (mode === 'edit') {
      setFormData({
        status: alert.status,
        staff_comments: alert.staff_comments || '',
      });
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedAlertId(null);
    setFormData({ status: '', staff_comments: '' });
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.put(`/api/alerts/${selectedAlertId}`, {
        ...formData,
        handled_by: currentUser?.id
      });
      await fetchAlerts();
      closeModal();
    } catch (err) {
      alert(err.message || 'Failed to update alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/api/alerts/${alertId}`);
      await fetchAlerts();
      if (selectedAlertId === alertId) {
        closeModal();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: alerts.length,
      pending: alerts.filter(a => a.status === 'Pending').length,
      emergency: alerts.filter(a => a.urgency === 'emergency').length,
      resolved: alerts.filter(a => a.status === 'Resolved').length,
    };
  }, [alerts]);

  const parseCoords = (coordsStr) => {
    if (!coordsStr) return null;
    const parts = coordsStr.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    return null;
  };

  const mapCenter = [14.4386, 101.3724];

  return (
    <section className="p-6 md:p-8 flex flex-col h-screen overflow-hidden">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Reported by Villagers.</h1>
          <p className="mt-1 text-sm text-gray-500">Manage emergency reports submitted by villagers and the public.</p>
        </div>

        <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ListIcon size={16} /> List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <MapIcon size={16} /> Map Mode
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-gray-500">
              <AlertCircle size={16} />
              <p className="text-sm font-medium">Total Alerts</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-amber-600">
              <Clock size={16} />
              <p className="text-sm font-medium">Pending Review</p>
            </div>
            <p className="text-3xl font-bold text-amber-700">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-rose-600">
              <AlertTriangle size={16} />
              <p className="text-sm font-medium">Emergency Level</p>
            </div>
            <p className="text-3xl font-bold text-rose-700">{stats.emergency}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={16} />
              <p className="text-sm font-medium">Resolved</p>
            </div>
            <p className="text-3xl font-bold text-emerald-700">{stats.resolved}</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by reporter, phone, description..."
                  className="h-10 w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
              <select
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Urgency</label>
              <select
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <option value="All">All Urgency</option>
                {URGENCY_OPTIONS.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Incident</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Urgency</th>
                    <th className="px-4 py-3 font-semibold">Reporter</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="7" className="px-4 py-10 text-center text-gray-400">Loading alerts...</td></tr>
                  ) : filteredAlerts.length === 0 ? (
                    <tr><td colSpan="7" className="px-4 py-10 text-center text-gray-500">No public alerts found.</td></tr>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <tr key={alert.alert_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${getUrgencyColor(alert.urgency)} bg-opacity-10 shrink-0`}>
                              {getIncidentIcon(alert.incident_type)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                                {alert.incident_type}
                                {alert.image_urls && alert.image_urls.length > 0 && (
                                  <span title={`${alert.image_urls.length} photos attached`} className="text-blue-500">
                                    <ImageIcon size={12} />
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">{alert.description || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{alert.location_name || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getUrgencyColor(alert.urgency)}`}>
                            {alert.urgency}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900 font-medium">{alert.reporter_name || 'Anonymous'}</div>
                          <div className="text-xs text-gray-500">{alert.reporter_phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(alert.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openModal('view', alert); }}
                              className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openModal('edit', alert); }}
                              className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Process Alert"
                            >
                              <MessageSquare size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDelete(alert.alert_id); }}
                              className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
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
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-[600px] relative mb-10">
            <MapContainer center={mapCenter} zoom={11} className="h-full w-full" zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
              <ZoomControl position="bottomright" />

              {groupedAlerts.map(group => {
                const pos = parseCoords(group.coords);
                if (!pos) return null;

                return (
                  <Marker
                    key={group.coords}
                    position={pos}
                    icon={getMarkerIcon(group.alerts)}
                  >
                    <Popup className="custom-popup" maxWidth={350}>
                      <div className="p-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <h2 className="font-black text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                          <MapPin size={16} className="text-emerald-600" /> {group.location_name}
                          <span className="ml-auto bg-gray-100 px-2 py-0.5 rounded text-xs">{group.alerts.length} alerts</span>
                        </h2>

                        <div className="space-y-4">
                          {group.alerts.map((alert, idx) => (
                            <div key={alert.alert_id} className={`p-3 rounded-xl border ${idx !== group.alerts.length - 1 ? 'border-gray-100 bg-gray-50/50' : 'border-emerald-100 bg-emerald-50/30'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getUrgencyColor(alert.urgency)}`}>
                                  {alert.urgency}
                                </span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(alert.status)}`}>
                                  {alert.status}
                                </span>
                              </div>
                              <h3 className="font-bold text-gray-900 capitalize flex items-center gap-2 text-sm">
                                {getIncidentIcon(alert.incident_type)} {alert.incident_type}
                              </h3>
                              <p className="text-xs text-gray-600 mt-1 mb-3 line-clamp-2">{alert.description || 'No description'}</p>
                              <div className="flex flex-col gap-1 mb-3 text-[10px] text-gray-500">
                                <div className="flex items-center gap-1.5"><User size={10} /> {alert.reporter_name || 'Anonymous'}</div>
                                <div className="flex items-center gap-1.5"><Clock size={10} /> {new Date(alert.created_at).toLocaleString()}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => openModal('view', alert)}
                                  className="w-full py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold rounded-lg transition-colors"
                                >
                                  Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openModal('edit', alert)}
                                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                                >
                                  Process
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <div className="absolute bottom-6 left-6 z-[1000] bg-white bg-opacity-95 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-xl min-w-[140px]">
              <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">Urgency Legend</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>
                  <span className="text-[11px] font-medium text-gray-600">Emergency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-200"></div>
                  <span className="text-[11px] font-medium text-gray-600">Urgent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                  <span className="text-[11px] font-medium text-gray-600">Normal</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalMode && selectedAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === 'view' ? 'Alert Details' : 'Process Public Alert'}
                </h2>
                <p className="text-sm text-gray-500">ID: ALERT-{selectedAlert.alert_id}</p>
              </div>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reporter Information</h3>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm font-semibold">{selectedAlert.reporter_name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-sm">{selectedAlert.reporter_phone}</span>
                      </div>
                      {selectedAlert.reporter_email && (
                        <div className="flex items-center gap-3">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-sm">{selectedAlert.reporter_email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location & Urgency</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <MapPin size={16} className="text-emerald-600" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-semibold">{selectedAlert.location_name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${getUrgencyColor(selectedAlert.urgency)} bg-opacity-10 border-opacity-20`}>
                        <AlertTriangle size={16} />
                        <div>
                          <p className="text-xs opacity-70">Urgency Level</p>
                          <p className="text-sm font-bold uppercase">{selectedAlert.urgency}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Incident Description</h3>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[100px]">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase mb-2">
                        {selectedAlert.incident_type}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedAlert.description || 'No detailed description provided.'}</p>
                      {selectedAlert.incident_type === 'other' && selectedAlert.other_detail && (
                        <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-100 text-xs text-purple-700 italic">
                          Other: {selectedAlert.other_detail}
                        </div>
                      )}
                    </div>
                  </div>

                  {modalMode === 'edit' ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Update Status</label>
                        <select
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          required
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Staff Comments</label>
                        <textarea
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px]"
                          placeholder="Internal notes on how this alert is being handled..."
                          value={formData.staff_comments}
                          onChange={(e) => setFormData({ ...formData, staff_comments: e.target.value })}
                        />
                      </div>
                    </form>
                  ) : (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Processing Info</h3>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Current Status:</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusColor(selectedAlert.status)}`}>
                            {selectedAlert.status}
                          </span>
                        </div>
                        {selectedAlert.handler_name && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Handled By:</span>
                            <span className="text-xs font-semibold">{selectedAlert.handler_name}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Internal Comments:</span>
                          <p className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 italic">
                            {selectedAlert.staff_comments || 'No comments recorded.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attached Photos Section */}
              {selectedAlert.image_urls && selectedAlert.image_urls.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ImageIcon size={14} /> Attached Photos ({selectedAlert.image_urls.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedAlert.image_urls.map((url, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 cursor-zoom-in group relative"
                        onClick={() => setLightboxImage(resolveMediaUrl(url))}
                      >
                        <img
                          src={resolveMediaUrl(url)}
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalMode === 'edit' && (
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-3 rounded-full transition-all hover:scale-110"
            onClick={() => setLightboxImage(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged evidence"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
