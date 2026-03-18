import React, { useState } from 'react';
import { incidentTemplates } from './mockData';

// Assuming you have this mock data, but keeping it here for completeness
const initialReports = [
    {
        id: 101,
        type: 'wildlife',
        location: 'North Ridge Checkpoint',
        details: 'Observed elephant herd crossing near stream line.',
        images: ['https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=800&auto=format&fit=crop'],
        createdAt: '2026-03-18 08:20',
    },
    {
        id: 102,
        type: 'damage',
        location: 'Boundary Fence Gate C',
        details: 'Fence wire damaged in two segments, requires maintenance team.',
        images: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop'],
        createdAt: '2026-03-18 09:45',
    },
];

function formatType(typeId) {
    return incidentTemplates?.find((item) => item.id === typeId)?.label ?? typeId;
}

export function FieldOpsReportPage() {
    const [reports, setReports] = useState(initialReports);
    const [modalMode, setModalMode] = useState(null); // add | view | edit | delete
    const [selectedReport, setSelectedReport] = useState(null);

    const [formData, setFormData] = useState({
        type: incidentTemplates?.[0]?.id || 'general',
        location: '',
        details: '',
        images: [],
    });

    const openModal = (mode, report = null) => {
        setModalMode(mode);
        setSelectedReport(report);

        if (mode === 'add') {
            setFormData({ type: incidentTemplates?.[0]?.id || 'general', location: '', details: '', images: [] });
            return;
        }

        if (report) {
            setFormData({
                type: report.type,
                location: report.location,
                details: report.details,
                images: report.images ?? [],
            });
        }
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedReport(null);
    };

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files ?? []);
        if (files.length === 0) return;

        const previewUrls = files.map((file) => URL.createObjectURL(file));
        setFormData((prev) => ({ ...prev, images: [...prev.images, ...previewUrls] }));
        event.target.value = '';
    };

    const removeImage = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (modalMode === 'add') {
            const newReport = {
                id: Date.now(),
                type: formData.type,
                location: formData.location,
                details: formData.details,
                images: formData.images,
                createdAt: new Date().toLocaleString(),
            };
            setReports((prev) => [newReport, ...prev]);
            closeModal();
            return;
        }

        if (modalMode === 'edit' && selectedReport) {
            setReports((prev) =>
                prev.map((report) =>
                    report.id === selectedReport.id
                        ? {
                            ...report,
                            type: formData.type,
                            location: formData.location,
                            details: formData.details,
                            images: formData.images,
                        }
                        : report
                )
            );
            closeModal();
        }
    };

    const handleDelete = () => {
        if (!selectedReport) return;
        setReports((prev) => prev.filter((report) => report.id !== selectedReport.id));
        closeModal();
    };

    return (
        <section className="flex flex-col gap-4 p-4 md:p-6 bg-[#111820] min-h-screen">
            {/* HEADER */}
            <header>
                <p className="text-[11px] text-slate-400 font-semibold tracking-wider">QUICK REPORT</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-white">Incident Reports</h1>
                    <button
                        type="button"
                        onClick={() => openModal('add')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-[#0a130f] rounded-lg px-4 py-2.5 text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        + Add Report
                    </button>
                </div>
            </header>

            {/* TABLE DATA */}
            <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                        <thead className="bg-[#17202e] border-b border-slate-700/60">
                            <tr className="text-left text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-5 py-4 font-semibold">Type</th>
                                <th className="px-5 py-4 font-semibold">Location</th>
                                <th className="px-5 py-4 font-semibold">Details</th>
                                <th className="px-5 py-4 font-semibold">Images</th>
                                <th className="px-5 py-4 font-semibold">Created</th>
                                <th className="px-5 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                                        No incident reports found.
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="text-slate-200 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-4 font-medium">{formatType(report.type)}</td>
                                        <td className="px-5 py-4">{report.location}</td>
                                        <td className="px-5 py-4 max-w-[240px] truncate text-slate-400">{report.details}</td>
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

            {/* MODAL */}
            {modalMode && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm px-4 py-6 flex items-center justify-center overflow-hidden"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-2xl bg-[#1b2433] border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* --- MODAL HEADER (FIXED) --- */}
                        <div className="flex-none flex items-center justify-between p-5 border-b border-slate-700/60">
                            <h2 className="text-xl font-bold text-white capitalize">
                                {modalMode === 'add' ? 'New Incident Report' : `${modalMode} Report`}
                            </h2>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* --- MODAL BODY (SCROLLABLE) --- */}
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            {(modalMode === 'add' || modalMode === 'edit') && (
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Incident Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                                            className="mt-2 w-full bg-[#111820] border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all"
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
                                        <input
                                            value={formData.location}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
                                            className="mt-2 w-full bg-[#111820] border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                                            placeholder="e.g., North Ridge Checkpoint"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Details</label>
                                        <textarea
                                            rows={5}
                                            value={formData.details}
                                            onChange={(event) => setFormData((prev) => ({ ...prev, details: event.target.value }))}
                                            className="mt-2 w-full bg-[#111820] border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-sm text-slate-100 outline-none transition-all resize-none"
                                            placeholder="Describe the incident in detail..."
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
                                                    <p className="text-sm text-slate-400"><span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop</p>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>

                                        {formData.images.length > 0 && (
                                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {formData.images.map((image, index) => (
                                                    <div key={`${image}-${index}`} className="relative group">
                                                        <img src={image} alt={`upload-${index}`} className="h-24 w-full object-cover rounded-lg border border-slate-600" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                        <p className="text-slate-400 text-xs uppercase tracking-wider">Location</p>
                                        <p className="text-slate-100 font-semibold mt-1">{selectedReport.location}</p>
                                    </div>

                                    <div className="bg-[#111820] border border-slate-700/60 rounded-xl p-4">
                                        <p className="text-slate-400 text-xs uppercase tracking-wider">Details</p>
                                        <p className="text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{selectedReport.details}</p>
                                    </div>

                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Images</p>
                                        {selectedReport.images.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {selectedReport.images.map((image, index) => (
                                                    <img key={`${image}-${index}`} src={image} alt={`report-${index}`} className="h-32 w-full object-cover rounded-lg border border-slate-700" />
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
                                        Are you sure you want to delete the report at <span className="font-bold text-white">{selectedReport.location}</span>?
                                    </p>
                                    <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                                        ⚠️ This action cannot be undone.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* --- MODAL FOOTER (FIXED) --- */}
                        <div className="flex-none p-5 border-t border-slate-700/60 bg-[#1b2433] rounded-b-2xl">
                            {(modalMode === 'add' || modalMode === 'edit') && (
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-600 text-sm font-semibold transition-colors">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={handleSubmit} className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0a130f] text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
                                        {modalMode === 'add' ? 'Create Report' : 'Save Changes'}
                                    </button>
                                </div>
                            )}

                            {modalMode === 'view' && (
                                <div className="flex justify-end">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold transition-colors">
                                        Done
                                    </button>
                                </div>
                            )}

                            {modalMode === 'delete' && (
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-600 text-sm font-semibold transition-colors">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={handleDelete} className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-500/20 transition-all">
                                        Confirm Delete
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