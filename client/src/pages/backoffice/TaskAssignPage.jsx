
import React, { useCallback, useMemo, useState } from 'react';
import {
  CalendarClock,
  ClipboardList,
  Filter,
  Plus,
  Search,
  Target,
  Trash2,
  UserCircle2,
  Pencil,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';

const emptyForm = {
  task_title: '',
  objective: '',
  description: '',
  destination: '',
  assigned_to: '',
  location_id: '',
  priority: 'Medium',
  status: 'Todo',
  eta: '',
  assigned_date: '',
};

export function TaskAssignPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assignedDateFilter, setAssignedDateFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTasks     = useCallback(() => api.get('/api/tasks'), []);
  const fetchStaff     = useCallback(() => api.get('/api/staff'), []);
  const fetchLocations = useCallback(() => api.get('/api/locations'), []);

  const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useApi(fetchTasks);
  const { data: staffData, loading: staffLoading, error: staffError, refetch: refetchStaff } = useApi(fetchStaff);
  const {
    data: locationData,
    loading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useApi(fetchLocations);

  const taskList        = tasksData    ?? [];
  const staffOptions    = staffData    ?? [];
  const locationOptions = locationData ?? [];

  const refreshAssignmentSources = useCallback(() => {
    refetchStaff();
    refetchLocations();
  }, [refetchStaff, refetchLocations]);

  const stats = useMemo(() => {
    const todo = taskList.filter((t) => t.status === 'Todo').length;
    const inProgress = taskList.filter((t) => t.status === 'In Progress').length;
    const done = taskList.filter((t) => t.status === 'Done').length;
    return { total: taskList.length, todo, inProgress, done };
  }, [taskList]);

  const filteredTasks = useMemo(() => {
    return taskList.filter((task) => {
      const q = query.toLowerCase();
      const matchQuery =
        `tsk-${task.task_id}`.includes(q) ||
        (task.task_title || '').toLowerCase().includes(q) ||
        (task.assignee_name || '').toLowerCase().includes(q) ||
        (task.location_sector || '').toLowerCase().includes(q) ||
        (task.location_name || '').toLowerCase().includes(q);

      const matchStatus   = statusFilter === 'All' || task.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      const matchDate     = !assignedDateFilter || task.assigned_date === assignedDateFilter;

      return matchQuery && matchStatus && matchPriority && matchDate;
    });
  }, [taskList, query, statusFilter, priorityFilter, assignedDateFilter]);

  const selectedTask = useMemo(
    () => taskList.find((t) => t.task_id === selectedTaskId) ?? null,
    [taskList, selectedTaskId],
  );

  const getStatusPill = (status) => {
    if (status === 'Done') return 'bg-emerald-100 text-emerald-700';
    if (status === 'In Progress') return 'bg-amber-100 text-amber-700';
    return 'bg-sky-100 text-sky-700';
  };

  const getPriorityPill = (priority) => {
    if (priority === 'High') return 'bg-rose-100 text-rose-700';
    if (priority === 'Medium') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  const openCreateForm = () => {
    refreshAssignmentSources();
    setEditingTaskId(null);
    setFormData(emptyForm);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (task) => {
    refreshAssignmentSources();
    setEditingTaskId(task.task_id);
    setFormData({
      task_title:    task.task_title   ?? '',
      objective:     task.objective    ?? '',
      description:   task.description  ?? '',
      destination:   task.destination  ?? '',
      assigned_to:   task.assigned_to  ?? '',
      location_id:   task.location_id  ?? '',
      priority:      task.priority     ?? 'Medium',
      status:        task.status       ?? 'Todo',
      eta:           task.eta          ?? '',
      assigned_date: task.assigned_date ?? '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTaskId(null);
    setFormData(emptyForm);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');

    const payload = {
      task_title:    formData.task_title.trim(),
      objective:     formData.objective.trim()   || null,
      description:   formData.description.trim() || null,
      destination:   formData.destination.trim() || null,
      assigned_to:   formData.assigned_to  ? Number(formData.assigned_to)  : null,
      location_id:   formData.location_id  ? Number(formData.location_id)  : null,
      priority:      formData.priority,
      status:        formData.status,
      eta:           formData.eta.trim() || null,
      assigned_date: formData.assigned_date || null,
    };

    try {
      let saved;
      if (editingTaskId) {
        saved = await api.put(`/api/tasks/${editingTaskId}`, payload);
      } else {
        saved = await api.post('/api/tasks', payload);
      }
      await refetchTasks();
      setSelectedTaskId(saved.task_id);
      closeForm();
    } catch (err) {
      setFormError(err.message || 'Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    const ok = window.confirm('Delete this task? This action cannot be undone.');
    if (!ok) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      await refetchTasks();
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    } catch (err) {
      if ((err.message || '').toLowerCase().includes('task not found')) {
        await refetchTasks();
        if (selectedTaskId === taskId) setSelectedTaskId(null);
        return;
      }
      window.alert(err.message || 'Failed to delete task.');
    }
  };

  return (
    <section className="p-6 md:p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Assignment</h1>
          <p className="mt-1 text-sm text-gray-500">
            CRUD workspace for creating, assigning, updating, and removing field operation tasks.
          </p>
        </div>
        <Button onClick={openCreateForm} className="gap-2">
          <Plus size={16} />
          Create Task
        </Button>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <ClipboardList size={16} />
            <p className="text-sm font-medium">Total Tasks</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sky-600">
            <Target size={16} />
            <p className="text-sm font-medium">Todo</p>
          </div>
          <p className="text-3xl font-bold text-sky-700">{stats.todo}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-amber-600">
            <CalendarClock size={16} />
            <p className="text-sm font-medium">In Progress</p>
          </div>
          <p className="text-3xl font-bold text-amber-700">{stats.inProgress}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-emerald-600">
            <UserCircle2 size={16} />
            <p className="text-sm font-medium">Done</p>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{stats.done}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Search
            </label>
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by task ID, title, assignee, or zone"
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

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500"
            >
              <option value="All">All status</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Priority
            </label>
            <div className="relative">
              <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-500"
              >
                <option value="All">All priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Assigned Date
            </label>
            <input
              type="date"
              value={assignedDateFilter}
              onChange={(event) => setAssignedDateFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-8">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Task</th>
                  <th className="px-4 py-3 font-semibold">Assignee</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Assigned</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasksLoading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-400" colSpan={5}>
                      Loading tasks…
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                      No tasks found for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.task_id}
                      className={`cursor-pointer transition hover:bg-gray-50 ${
                        selectedTaskId === task.task_id ? 'bg-blue-50/60' : 'bg-white'
                      }`}
                      onClick={() => setSelectedTaskId(task.task_id)}
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-gray-900">{task.task_title}</p>
                        <p className="text-xs text-gray-500">
                          TSK-{task.task_id} • {task.location_sector || task.location_name || '—'}
                        </p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityPill(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{task.assignee_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusPill(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{task.assigned_date || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditForm(task); }}
                            className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                            title="Edit task"
                            type="button"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(task.task_id); }}
                            className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                            title="Delete task"
                            type="button"
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
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Task Details</h2>
          {!selectedTask ? (
            <p className="text-sm text-gray-500">Select a task from the table to view details.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Title</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{selectedTask.task_title}</p>
              </div>
              {selectedTask.objective && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Objective</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedTask.objective}</p>
                </div>
              )}
              {selectedTask.destination && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Destination</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedTask.destination}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Task ID</p>
                  <p className="mt-1 text-sm text-gray-800">TSK-{selectedTask.task_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {selectedTask.location_sector || selectedTask.location_name || '—'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assignee</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedTask.assignee_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned Date</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedTask.assigned_date || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusPill(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Priority</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityPill(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>
              </div>
              {selectedTask.eta && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">ETA</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedTask.eta}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
                <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  {selectedTask.description || 'No notes'}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 gap-2" variant="secondary" onClick={() => openEditForm(selectedTask)}>
                  <Pencil size={14} />
                  Edit
                </Button>
                <Button
                  className="flex-1 gap-2"
                  variant="danger"
                  onClick={() => handleDelete(selectedTask.task_id)}
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
                {editingTaskId ? 'Update Task' : 'Create New Task'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Fill in task information and assignee details.</p>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-5 overflow-y-auto p-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={formData.task_title}
                    onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Ex. Patrol at checkpoint 04"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Objective</label>
                  <input
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Ex. Inspect fence and report intrusion signs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Assignee</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="">— Unassigned —</option>
                    {staffLoading && <option value="" disabled>Loading staff from API...</option>}
                    {staffError && <option value="" disabled>Failed to load staff from API</option>}
                    {staffOptions.map((s) => (
                      <option key={s.staff_id} value={s.staff_id}>
                        {s.full_name} ({s.title_role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="">— No location —</option>
                    {locationsLoading && <option value="" disabled>Loading locations from API...</option>}
                    {locationsError && <option value="" disabled>Failed to load locations from API</option>}
                    {!locationsLoading && !locationsError && locationOptions.length === 0 && (
                      <option value="" disabled>No locations available from API</option>
                    )}
                    {locationOptions.map((loc) => (
                      <option key={loc.location_id} value={loc.location_id}>
                        {loc.location_name || `Location #${loc.location_id}`} — {loc.sector || 'No sector'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Destination</label>
                  <input
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Ex. Northern Perimeter Gate 2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">ETA</label>
                  <input
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Ex. 2h 30m"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Assigned Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.assigned_date}
                    onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Extra instructions for the field team"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="secondary" onClick={closeForm} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : editingTaskId ? 'Save Changes' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
