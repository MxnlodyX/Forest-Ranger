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
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
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

export function PublicAlertsPage() {
  const { currentUser } = useAppContext();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view' | 'edit' | 'delete'
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    status: '',
    staff_comments: '',
  });

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/alerts');
      setAlerts(data);
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
    e.preventDefault();
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

  return (
    <section className="p-6 md:p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Public Alerts Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage emergency reports submitted by villagers and the public.</p>
        </div>
      </header>

      {/* Stats Cards */}
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

      {/* Filters & Search */}
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
                      <div className="font-semibold text-gray-900 capitalize">{alert.incident_type}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{alert.description || 'No description'}</div>
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

      {/* Modals */}
      {modalMode && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === 'view' ? 'Alert Details' : 
                   modalMode === 'edit' ? 'Process Public Alert' : 'Confirm Deletion'}
                </h2>
                <p className="text-sm text-gray-500">ID: ALERT-{selectedAlert.alert_id}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Info */}
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

                {/* Right Side: Incident Details */}
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
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
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
                          onChange={(e) => setFormData({...formData, staff_comments: e.target.value})}
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
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
              <button 
                onClick={closeModal} 
                className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalMode === 'edit' && (
                <button 
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
