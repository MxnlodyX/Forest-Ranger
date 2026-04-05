import React, { useCallback, useMemo, useState } from 'react';
import { incidentTemplates } from './mockData';
import { useAppContext } from '../../context/useAppContext';
import { useApi } from '../../hooks/useApi';
import { api, resolveMediaUrl } from '../../services/api';

const defaultIncidentType = incidentTemplates?.[0]?.id || 'wildlife';

function formatType(typeId) {
    return incidentTemplates?.find((item) => item.id === typeId)?.label ?? typeId;
}

function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
}

function mapReportForUi(raw) {
    return {
        id: raw.incident_id,
        title: raw.incident_title || 'Untitled Incident',
        type: raw.incident_type || defaultIncidentType,
        details: raw.description || '',
        locationId: raw.location_id ? String(raw.location_id) : '',
        locationName: raw.location_name || '-',
        images: Array.isArray(raw.image_urls) ? raw.image_urls : [],
        createdAt: formatDateTime(raw.created_at),
    };
}

function makeImageEntryFromUrl(url, index) {
    return {
        id: `existing-${index}-${url}`,
        file: null,
        previewUrl: url,
        serverUrl: url,
    };
}

function isBlobPreview(imageEntry) {
    return Boolean(imageEntry?.file && String(imageEntry.previewUrl || '').startsWith('blob:'));
}

function releaseBlobUrls(imageEntries) {
    imageEntries.forEach((entry) => {
        if (isBlobPreview(entry)) {
            URL.revokeObjectURL(entry.previewUrl);
        }
    });
}

export function FieldOpsReportPage() {
    const { currentUser } = useAppContext();
    const staffId = currentUser?.id;

    const reportsFetcher = useCallback(
        () => (staffId ? api.get(`/api/reports?reported_by=${staffId}`) : Promise.resolve([])),
        [staffId],
    );
    const {
        data: rawReports,
        loading: reportsLoading,
        error: reportsError,
        refetch: refetchReports,
    } = useApi(reportsFetcher, [staffId]);

    const locationsFetcher = useCallback(() => api.get('/api/locations'), []);
    const {
        data: locations,
        loading: locationsLoading,
        error: locationsError,
    } = useApi(locationsFetcher);

    const reports = useMemo(
        () => (rawReports ?? []).map(mapReportForUi),
        [rawReports],
    );

    const [modalMode, setModalMode] = useState(null); // add | view | edit | delete
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [actionError, setActionError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredReports = useMemo(() => {
        if (!searchQuery.trim()) return reports;
        const q = searchQuery.toLowerCase();
        return reports.filter(r =>
            r.title.toLowerCase().includes(q) ||
            r.locationName.toLowerCase().includes(q) ||
            (r.details && r.details.toLowerCase().includes(q)) ||
            formatType(r.type).toLowerCase().includes(q)
        );
    }, [reports, searchQuery]);

    const [formData, setFormData] = useState({
        title: '',
        type: defaultIncidentType,
        locationId: '',
        details: '',
        images: [],
    });

    const selectedReport = useMemo(
        () => reports.find((report) => report.id === selectedReportId) || null,
        [reports, selectedReportId],
    );

    const resetForm = useCallback((nextData = null) => {
        setFormData((prev) => {
            releaseBlobUrls(prev.images || []);
            if (nextData) return nextData;
            return {
                title: '',
                type: defaultIncidentType,
                locationId: '',
                details: '',
                images: [],
            };
        });
    }, []);

    const openModal = (mode, report = null) => {
        setActionError('');
        setModalMode(mode);
        setSelectedReportId(report?.id ?? null);

        if (mode === 'add') {
            resetForm({
                title: '',
                type: defaultIncidentType,
                locationId: '',
                details: '',
                images: [],
            });
            return;
        }

        if (report) {
            resetForm({
                title: report.title,
                type: report.type,
                locationId: report.locationId,
                details: report.details,
                images: (report.images || []).map(makeImageEntryFromUrl),
            });
        }
    };

    const closeModal = () => {
        resetForm();
        setModalMode(null);
        setSelectedReportId(null);
        setActionError('');
        setIsSubmitting(false);
    };

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) return;

        const newImageEntries = files.map((file, index) => ({
            id: `new-${Date.now()}-${index}`,
            file,
            previewUrl: URL.createObjectURL(file),
            serverUrl: '',
        }));

        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...newImageEntries],
        }));
        event.target.value = '';
    };

    const removeImage = (indexToRemove) => {
        setFormData((prev) => {
            const nextImages = [...prev.images];
            const [removed] = nextImages.splice(indexToRemove, 1);
            if (removed && isBlobPreview(removed)) {
                URL.revokeObjectURL(removed.previewUrl);
            }
            return {
                ...prev,
                images: nextImages,
            };
        });
    };

    const uploadNewImages = async (images) => {
        const existingUrls = images
            .filter((image) => !image.file)
            .map((image) => image.serverUrl || image.previewUrl)
            .filter(Boolean);

        const newImageFiles = images.filter((image) => Boolean(image.file));
        if (newImageFiles.length === 0) return existingUrls;

        const uploadedUrls = [];
        for (const image of newImageFiles) {
            const form = new FormData();
            form.append('image', image.file);
            const response = await api.postForm('/api/reports/upload_image', form);
            uploadedUrls.push(response.image_url);
        }
        return [...existingUrls, ...uploadedUrls];
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setActionError('');

        if (!staffId) {
            setActionError('Current user is not available. Please sign in again.');
            return;
        }

        const title = formData.title.trim();
        const details = formData.details.trim();
        const locationId = formData.locationId;

        if (!title || !formData.type || !locationId || !details) {
            setActionError('Please complete title, type, location and details.');
            return;
        }

        try {
            setIsSubmitting(true);
            const imageUrls = await uploadNewImages(formData.images);
            const payload = {
                incident_title: title,
                incident_type: formData.type,
                description: details,
                location_id: Number(locationId),
                reported_by: staffId,
                image_urls: imageUrls,
            };

            if (modalMode === 'add') {
                await api.post('/api/reports', payload);
            } else if (modalMode === 'edit' && selectedReportId) {
                await api.put(`/api/reports/${selectedReportId}`, payload);
            }

            await refetchReports();
            closeModal();
        } catch (error) {
            setActionError(error.message || 'Unable to save report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedReportId) return;
        try {
            setIsSubmitting(true);
            setActionError('');
            await api.delete(`/api/reports/${selectedReportId}`);
            await refetchReports();
            closeModal();
        } catch (error) {
            setActionError(error.message || 'Unable to delete report.');
            setIsSubmitting(false);
        }
    };

    const modalTitle = modalMode === 'add' ? 'New Incident Report' : `${modalMode || ''} Report`;
    const canSubmitForm = !isSubmitting && !locationsLoading;

    return (
        <section className="flex flex-col gap-4 p-4 md:p-6 bg-[#111820] min-h-screen">
            <header>
                <p className="text-[11px] text-slate-400 font-semibold tracking-wider">QUICK REPORT</p>
                <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-white">Incident Reports</h1>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1e293b] border border-slate-700/60 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => openModal('add')}
                            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-[#0a130f] rounded-lg px-4 py-2.5 text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                        >
                            + Add Report
                        </button>
                    </div>
                </div>
            </header>

            {reportsError && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    Failed to load reports: {reportsError}
                </div>
            )}

            {locationsError && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                    Failed to load locations: {locationsError}
                </div>
            )}

            <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-[#17202e] border-b border-slate-700/60">
                            <tr className="text-left text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-5 py-4 font-semibold">Title</th>
                                <th className="px-5 py-4 font-semibold">Type</th>
                                <th className="px-5 py-4 font-semibold">Location</th>
                                <th className="px-5 py-4 font-semibold">Details</th>
                                <th className="px-5 py-4 font-semibold">Images</th>
                                <th className="px-5 py-4 font-semibold">Created</th>
                                <th className="px-5 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {reportsLoading ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-10 text-center text-slate-400">
                                        Loading reports...
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                                        {searchQuery ? `No reports match your search "${searchQuery}".` : 'No incident reports found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((report) => (
                                    <tr key={report.id} className="text-slate-200 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-4 font-medium max-w-[220px] truncate">{report.title}</td>
                                        <td className="px-5 py-4 font-medium">{formatType(report.type)}</td>
                                        <td className="px-5 py-4">{report.locationName}</td>
                                        <td className="px-5 py-4 max-w-[220px] truncate text-slate-400">{report.details || '-'}</td>
                                        <td className="px-5 py-4">
                                            <span className="bg-slate-700 px-2 py-1 rounded-md text-xs font-medium">
                                                {report.images.length}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-400 text-xs">{report.createdAt}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openModal('view', report)}
                                                    className="px-3 py-1.5 rounded-md bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-semibold transition-colors"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openModal('edit', report)}
                                                    className="px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openModal('delete', report)}
                                                    className="px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors"
                                                >
                                                    Delete
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

            {modalMode && (
                <div
                    className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm px-4 py-4 sm:py-6 flex items-end sm:items-center justify-center overflow-hidden"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-2xl bg-[#1b2433] border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-7.5rem)] sm:max-h-[90vh] mb-24 sm:mb-0"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex-none flex items-center justify-between p-5 border-b border-slate-700/60">
                            <h2 className="text-xl font-bold text-white capitalize">{modalTitle}</h2>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors"
                            >
                                X
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            {(modalMode === 'add' || modalMode === 'edit') && (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Incident Title</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                                            className="mt-2 w-full bg-[#111820] border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                                            placeholder="Enter incident title"
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Incident Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                                            className="mt-2 w-full bg-[#111820] border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                                            disabled={isSubmitting}
                                        >
                                            {incidentTemplates?.map((template) => (
                                                <option key={template.id} value={template.id}>
                                                    {template.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Location</label>
                                        <select
                                            value={formData.locationId}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, locationId: event.target.value }))}
                                            className="mt-2 w-full bg-[#111820] border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                                            disabled={isSubmitting || locationsLoading}
                                            required
                                        >
                                            <option value="">Select location</option>
                                            {(locations || []).map((location) => (
                                                <option key={location.location_id} value={String(location.location_id)}>
                                                    {location.location_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Details</label>
                                        <textarea
                                            rows={5}
                                            value={formData.details}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, details: event.target.value }))}
                                            className="mt-2 w-full bg-[#111820] border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all resize-none"
                                            placeholder="Describe the incident in detail..."
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">
                                            Evidence Images
                                        </label>
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-[#111820] hover:bg-slate-800 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <p className="text-sm text-slate-400">
                                                        <span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop
                                                    </p>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    disabled={isSubmitting}
                                                />
                                            </label>
                                        </div>

                                        {formData.images.length > 0 && (
                                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {formData.images.map((image, index) => {
                                                    const src = image.file
                                                        ? image.previewUrl
                                                        : resolveMediaUrl(image.serverUrl || image.previewUrl);

                                                    return (
                                                        <div key={image.id} className="relative group">
                                                            <img src={src} alt={`upload-${index}`} className="h-24 w-full object-cover rounded-lg border border-slate-600" />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(index)}
                                                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                disabled={isSubmitting}
                                                            >
                                                                X
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </form>
                            )}

                            {modalMode === 'view' && selectedReport && (
                                <div className="flex flex-col gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#111820] border border-slate-700/60 rounded-xl p-4">
                                            <p className="text-slate-400 text-xs uppercase tracking-wider">Type</p>
                                            <p className="text-slate-100 font-semibold mt-1 text-lg">{formatType(selectedReport.type)}</p>
                                        </div>
                                        <div className="bg-[#111820] border border-slate-700/60 rounded-xl p-4">
                                            <p className="text-slate-400 text-xs uppercase tracking-wider">Created</p>
                                            <p className="text-slate-100 font-semibold mt-1">{selectedReport.createdAt}</p>
                                        </div>
                                    </div>

                                    <div className="bg-[#111820] border border-slate-700/60 rounded-xl p-4">
                                        <p className="text-slate-400 text-xs uppercase tracking-wider">Title</p>
                                        <p className="text-slate-100 font-semibold mt-1">{selectedReport.title}</p>
                                    </div>

                                    <div className="bg-[#111820] border border-slate-700/60 rounded-xl p-4">
                                        <p className="text-slate-400 text-xs uppercase tracking-wider">Location</p>
                                        <p className="text-slate-100 font-semibold mt-1">{selectedReport.locationName}</p>
                                    </div>

                                    <div className="bg-[#111820] border border-slate-700/60 rounded-xl p-4">
                                        <p className="text-slate-400 text-xs uppercase tracking-wider">Details</p>
                                        <p className="text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{selectedReport.details || '-'}</p>
                                    </div>

                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Images</p>
                                        {selectedReport.images.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {selectedReport.images.map((image, index) => (
                                                    <img
                                                        key={`${image}-${index}`}
                                                        src={resolveMediaUrl(image)}
                                                        alt={`report-${index}`}
                                                        className="h-32 w-full object-cover rounded-lg border border-slate-700"
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-[#111820] border border-slate-700 border-dashed rounded-lg p-6 text-center">
                                                <p className="text-sm text-slate-500">No images attached to this report.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {modalMode === 'delete' && selectedReport && (
                                <div className="py-4">
                                    <p className="text-slate-300 text-lg">
                                        Are you sure you want to delete the report titled{' '}
                                        <span className="font-bold text-white">{selectedReport.title}</span>?
                                    </p>
                                    <p className="text-red-400 text-sm mt-2">This action cannot be undone.</p>
                                </div>
                            )}

                            {actionError && (
                                <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                                    {actionError}
                                </div>
                            )}
                        </div>

                        <div className="flex-none p-5 border-t border-slate-700/60 bg-[#1b2433] rounded-b-2xl">
                            {(modalMode === 'add' || modalMode === 'edit') && (
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-lg bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-600 text-sm font-semibold transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!canSubmitForm}
                                        className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#0a130f] text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
                                    >
                                        {isSubmitting ? 'Saving...' : modalMode === 'add' ? 'Create Report' : 'Save Changes'}
                                    </button>
                                </div>
                            )}

                            {modalMode === 'view' && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}

                            {modalMode === 'delete' && (
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-lg bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-600 text-sm font-semibold transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-red-500/20 transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}