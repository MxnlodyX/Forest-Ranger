
import React, { useMemo, useState } from 'react';
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

const initialTasks = [
  {
    id: 'TSK-1001',
    title: 'Night patrol around Northern sector',
    assignee: 'Jonathan Silva',
    zone: 'Northern Sector A',
    priority: 'High',
    status: 'In Progress',
    assignedDate: '2026-03-18',
    notes: 'Check firebreak points and report unusual smoke activity.',
  },
  {
    id: 'TSK-1002',
    title: 'Camera trap maintenance',
    assignee: 'Elena Vance',
    zone: 'Eastern Valley',
    priority: 'Medium',
    status: 'Todo',
    assignedDate: '2026-03-17',
    notes: 'Replace batteries in station EV-02 and EV-03.',
  },
  {
    id: 'TSK-1003',
    title: 'Supply drop verification',
    assignee: 'David Miller',
    zone: 'Western Perimeter',
    priority: 'Low',
    status: 'Done',
    assignedDate: '2026-03-15',
    notes: 'Verified first aid and radio inventory.',
  },
];

const zoneOptions = [
  'Northern Sector A',
  'Eastern Valley',
  'Western Perimeter',
  'Southern Riverline',
  'Central Base Zone',
];

const emptyForm = {
  title: '',
  assignee: '',
  zone: '',
  priority: 'Medium',
  status: 'Todo',
  assignedDate: '',
  notes: '',
};

export function TaskAssignPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assignedDateFilter, setAssignedDateFilter] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTasks[0]?.id ?? null);
  const [formData, setFormData] = useState(emptyForm);

  const stats = useMemo(() => {
    const todo = tasks.filter((task) => task.status === 'Todo').length;
    const inProgress = tasks.filter((task) => task.status === 'In Progress').length;
    const done = tasks.filter((task) => task.status === 'Done').length;

    return {
      total: tasks.length,
      todo,
      inProgress,
      done,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const q = query.toLowerCase();
      const matchQuery =
        task.id.toLowerCase().includes(q) ||
        task.title.toLowerCase().includes(q) ||
        task.assignee.toLowerCase().includes(q) ||
        task.zone.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'All' || task.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      const matchAssignedDate = !assignedDateFilter || task.assignedDate === assignedDateFilter;

      return matchQuery && matchStatus && matchPriority && matchAssignedDate;
    });
  }, [tasks, query, statusFilter, priorityFilter, assignedDateFilter]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
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
    setEditingTaskId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (task) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      assignee: task.assignee,
      zone: task.zone,
      priority: task.priority,
      status: task.status,
      assignedDate: task.assignedDate,
      notes: task.notes,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTaskId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                ...formData,
              }
            : task,
        ),
      );
      setSelectedTaskId(editingTaskId);
    } else {
      const newId = `TSK-${Date.now().toString().slice(-6)}`;
      const newTask = {
        id: newId,
        ...formData,
      };
      setTasks((prev) => [newTask, ...prev]);
      setSelectedTaskId(newId);
    }

    closeForm();
  };

  const handleDelete = (taskId) => {
    const ok = window.confirm('Delete this task? This action cannot be undone.');
    if (!ok) return;

    setTasks((prev) => {
      const remaining = prev.filter((task) => task.id !== taskId);
      if (selectedTaskId === taskId) {
        setSelectedTaskId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
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
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                      No tasks found for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className={`cursor-pointer transition hover:bg-gray-50 ${
                        selectedTaskId === task.id ? 'bg-blue-50/60' : 'bg-white'
                      }`}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.id} • {task.zone}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityPill(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{task.assignee}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusPill(task.status)}`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{task.assignedDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditForm(task);
                            }}
                            className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                            title="Edit task"
                            type="button"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(task.id);
                            }}
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
                <p className="mt-1 text-sm font-medium text-gray-900">{selectedTask.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Task ID</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedTask.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Zone</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedTask.zone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assignee</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedTask.assignee}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned Date</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedTask.assignedDate}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusPill(selectedTask.status)}`}
                  >
                    {selectedTask.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Priority</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityPill(selectedTask.priority)}`}
                  >
                    {selectedTask.priority}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
                <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  {selectedTask.notes || 'No notes'}
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
                  onClick={() => handleDelete(selectedTask.id)}
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

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Task Title</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Ex. Patrol at checkpoint 04"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Assignee</label>
                  <input
                    required
                    value={formData.assignee}
                    onChange={(event) => setFormData({ ...formData, assignee: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Staff name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Zone</label>
                  <select
                    required
                    value={formData.zone}
                    onChange={(event) => setFormData({ ...formData, zone: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="" disabled>
                      Select zone
                    </option>
                    {zoneOptions.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(event) => setFormData({ ...formData, status: event.target.value })}
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
                    onChange={(event) => setFormData({ ...formData, priority: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Assigned Date</label>
                  <input
                    required
                    type="date"
                    value={formData.assignedDate}
                    onChange={(event) => setFormData({ ...formData, assignedDate: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  placeholder="Extra instructions for the field team"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit">{editingTaskId ? 'Save Changes' : 'Create Task'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
