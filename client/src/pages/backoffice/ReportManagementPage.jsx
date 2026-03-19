import React, { useCallback, useMemo, useState } from 'react';
import { incidentTemplates } from '../field-ops/mockData';
import { useAppContext } from '../../context/useAppContext';
import { useApi } from '../../hooks/useApi';
import { api, resolveMediaUrl } from '../../services/api';
import { Eye, Pencil, Trash2 } from 'lucide-react';

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
    reportedBy: raw.reported_by ? String(raw.reported_by) : '',
    reporterName: raw.reporter_name || '-',
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

export function ReportManagementPage() {
  const { currentUser } = useAppContext();

  const reportsFetcher = useCallback(() => api.get('/api/reports'), []);
  const {
    data: rawReports,
    loading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useApi(reportsFetcher);

  const locationsFetcher = useCallback(() => api.get('/api/locations'), []);
  const {
    data: locations,
    loading: locationsLoading,
    error: locationsError,
  } = useApi(locationsFetcher);

  const staffFetcher = useCallback(() => api.get('/api/staff'), []);
  const {
    data: staff,
    loading: staffLoading,
    error: staffError,
  } = useApi(staffFetcher);

  const reports = useMemo(() => (rawReports ?? []).map(mapReportForUi), [rawReports]);
  const staffOptions = useMemo(() => staff ?? [], [staff]);

  const [modalMode, setModalMode] = useState(null); // add | view | edit | delete
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: defaultIncidentType,
    locationId: '',
    reportedBy: '',
    details: '',
    images: [],
  });

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) || null,
    [reports, selectedReportId],
  );

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter((report) =>
      report.title.toLowerCase().includes(q)
      || report.locationName.toLowerCase().includes(q)
      || report.reporterName.toLowerCase().includes(q)
      || (report.details && report.details.toLowerCase().includes(q))
      || formatType(report.type).toLowerCase().includes(q),
    );
  }, [reports, searchQuery]);

  const resetForm = useCallback((nextData = null) => {
    setFormData((prev) => {
      releaseBlobUrls(prev.images || []);
      if (nextData) return nextData;

      const currentUserId = currentUser?.id ? String(currentUser.id) : '';
      const firstStaffId = staffOptions?.[0]?.staff_id ? String(staffOptions[0].staff_id) : '';
      return {
        title: '',
        type: defaultIncidentType,
        locationId: '',
        reportedBy: currentUserId || firstStaffId,
        details: '',
        images: [],
      };
    });
  }, [currentUser, staffOptions]);

  const openModal = (mode, report = null) => {
    setActionError('');
    setModalMode(mode);
    setSelectedReportId(report?.id ?? null);

    const currentUserId = currentUser?.id ? String(currentUser.id) : '';
    const firstStaffId = staffOptions?.[0]?.staff_id ? String(staffOptions[0].staff_id) : '';

    if (mode === 'add') {
      resetForm({
        title: '',
        type: defaultIncidentType,
        locationId: '',
        reportedBy: currentUserId || firstStaffId,
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
        reportedBy: report.reportedBy || currentUserId || firstStaffId,
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

    const title = formData.title.trim();
    const details = formData.details.trim();
    const locationId = formData.locationId;
    const reportedBy = formData.reportedBy;

    if (!title || !formData.type || !locationId || !reportedBy || !details) {
      setActionError('Please complete title, type, location, reporter and details.');
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
        reported_by: Number(reportedBy),
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

  const modalTitle = modalMode === 'add' ? 'Create Report' : `${modalMode || ''} Report`;
  const canSubmitForm = !isSubmitting && !locationsLoading && !staffLoading;

  return (
    <section className="p-6 md:p-8">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage incident reports from all field staff in one place.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by title, location, reporter, type..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 pr-14 text-sm text-gray-800 outline-none transition focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => openModal('add')}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            + Create Report
          </button>
        </div>
      </header>

      {reportsError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load reports: {reportsError}
        </div>
      )}

      {locationsError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Failed to load locations: {locationsError}
        </div>
      )}

      {staffError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Failed to load staff: {staffError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Reporter</th>
                <th className="px-4 py-3 font-semibold">Details</th>
                <th className="px-4 py-3 font-semibold">Images</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportsLoading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-gray-500">
                    Loading reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    {searchQuery ? `No reports match "${searchQuery}".` : 'No reports found.'}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="transition-colors hover:bg-gray-50">
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-900">{report.title}</td>
                    <td className="px-4 py-3 text-gray-700">{formatType(report.type)}</td>
                    <td className="px-4 py-3 text-gray-700">{report.locationName}</td>
                    <td className="px-4 py-3 text-gray-700">{report.reporterName}</td>
                    <td className="max-w-[230px] truncate px-4 py-3 text-gray-600">{report.details || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {report.images.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{report.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal('view', report)}
                          className="rounded-lg p-1.5 text-sky-600 transition-colors hover:bg-sky-50"
                          title="View report"
                          aria-label="View report"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal('edit', report)}
                          className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-50"
                          title="Edit report"
                          aria-label="Edit report"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal('delete', report)}
                          className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50"
                          title="Delete report"
                          aria-label="Delete report"
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

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-bold capitalize text-gray-900">{modalTitle}</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                X
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {(modalMode === 'add' || modalMode === 'edit') && (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Incident Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500"
                      placeholder="Enter incident title"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Incident Type</label>
                    <select
                      value={formData.type}
                      onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500"
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
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location</label>
                    <select
                      value={formData.locationId}
                      onChange={(event) => setFormData((prev) => ({ ...prev, locationId: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500"
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

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reporter</label>
                    <select
                      value={formData.reportedBy}
                      onChange={(event) => setFormData((prev) => ({ ...prev, reportedBy: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500"
                      disabled={isSubmitting || staffLoading}
                      required
                    >
                      <option value="">Select reporter</option>
                      {staffOptions.map((member) => (
                        <option key={member.staff_id} value={String(member.staff_id)}>
                          {member.full_name} ({member.staff_role || 'staff'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Details</label>
                    <textarea
                      rows={4}
                      value={formData.details}
                      onChange={(event) => setFormData((prev) => ({ ...prev, details: event.target.value }))}
                      className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500"
                      placeholder="Describe the incident"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Evidence Images
                    </label>
                    <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:bg-gray-100">
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </label>

                    {formData.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {formData.images.map((image, index) => {
                          const src = image.file
                            ? image.previewUrl
                            : resolveMediaUrl(image.serverUrl || image.previewUrl);

                          return (
                            <div key={image.id} className="group relative">
                              <img
                                src={src}
                                alt={`upload-${index}`}
                                className="h-24 w-full rounded-lg border border-gray-200 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Type</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatType(selectedReport.type)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Reporter</p>
                      <p className="mt-1 font-semibold text-gray-900">{selectedReport.reporterName}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Created</p>
                      <p className="mt-1 font-semibold text-gray-900">{selectedReport.createdAt}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Title</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedReport.title}</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Location</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedReport.locationName}</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Details</p>
                    <p className="mt-2 whitespace-pre-wrap text-gray-700">{selectedReport.details || '-'}</p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Images</p>
                    {selectedReport.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {selectedReport.images.map((image, index) => (
                          <img
                            key={`${image}-${index}`}
                            src={resolveMediaUrl(image)}
                            alt={`report-${index}`}
                            className="h-28 w-full rounded-lg border border-gray-200 object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
                        No images attached to this report.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modalMode === 'delete' && selectedReport && (
                <div className="py-2">
                  <p className="text-gray-800">
                    Are you sure you want to delete report <span className="font-semibold">{selectedReport.title}</span>?
                  </p>
                  <p className="mt-2 text-sm text-rose-600">This action cannot be undone.</p>
                </div>
              )}

              {actionError && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {actionError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
              {(modalMode === 'add' || modalMode === 'edit') && (
                <>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmitForm}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Saving...' : modalMode === 'add' ? 'Create Report' : 'Save Changes'}
                  </button>
                </>
              )}

              {modalMode === 'view' && (
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Done
                </button>
              )}

              {modalMode === 'delete' && (
                <>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
