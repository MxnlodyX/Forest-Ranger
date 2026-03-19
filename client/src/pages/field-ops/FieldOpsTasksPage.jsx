import React, { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, MapPin, Target } from 'lucide-react';
import { useAppContext } from '../../context/useAppContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';

const taskRequirements = [
  { key: 'title',       label: 'Task title' },
  { key: 'objective',   label: 'Objective' },
  { key: 'destination', label: 'Destination' },
  { key: 'zone',        label: 'Zone' },
];

const mapTaskForDisplay = (raw) => ({
  task_id:    raw.task_id,
  title:      raw.task_title || '',
  objective:  raw.objective  || '',
  destination: raw.destination || '',
  zone:       raw.location_sector || raw.location_name || '',
  coordinate: raw.location_coordinates || '',
  eta:        raw.eta || '',
  time:       raw.assigned_date ? `Due ${raw.assigned_date}` : '—',
  status:     raw.status,
  completed:  raw.status === 'Done',
  priority:   raw.priority,
});

const validateTask = (task) => {
  const missingFields = taskRequirements
    .filter((rule) => !String(task[rule.key] ?? '').trim())
    .map((rule) => rule.label);

  return {
    ...task,
    missingFields,
    isValid: missingFields.length === 0,
  };
};

const getPriorityTone = (priority) => {
  if (priority === 'High') return 'bg-red-900/40 text-red-300';
  if (priority === 'Medium') return 'bg-amber-900/40 text-amber-300';
  return 'bg-slate-700 text-slate-300';
};

export function FieldOpsTasksPage() {
  const { currentUser } = useAppContext();
  const staffId = currentUser?.id;

  const fetcher = useCallback(
    () => (staffId ? api.get(`/api/tasks/assigned/${staffId}`) : Promise.resolve([])),
    [staffId],
  );
  const { data: rawTasks, loading, error, refetch } = useApi(fetcher, [staffId]);

  const [optimisticOverrides, setOptimisticOverrides] = useState({});

  const tasks = useMemo(() => {
    const base = (rawTasks ?? []).map(mapTaskForDisplay);
    return base.map((t) => ({ ...t, ...(optimisticOverrides[t.task_id] ?? {}) }));
  }, [rawTasks, optimisticOverrides]);

  const validatedTasks = useMemo(() => tasks.map((task) => validateTask(task)), [tasks]);

  const summary = useMemo(() => {
    const valid     = validatedTasks.filter((t) => t.isValid).length;
    const invalid   = validatedTasks.length - valid;
    const completed = validatedTasks.filter((t) => t.completed).length;
    return { total: validatedTasks.length, valid, invalid, completed };
  }, [validatedTasks]);

  const toggleTask = async (task_id) => {
    const task = validatedTasks.find((t) => t.task_id === task_id);
    if (!task) return;

    if (!task.isValid) {
      window.alert('Task data is incomplete. Please complete destination/objective details first.');
      return;
    }

    const newStatus = task.completed ? 'In Progress' : 'Done';

    // Optimistic UI update
    setOptimisticOverrides((prev) => ({
      ...prev,
      [task_id]: { status: newStatus, completed: newStatus === 'Done' },
    }));

    try {
      await api.put(`/api/tasks/${task_id}`, { status: newStatus });
      await refetch();
    } finally {
      setOptimisticOverrides((prev) => {
        const next = { ...prev };
        delete next[task_id];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        <p className="py-8 text-center text-sm text-slate-400">Loading tasks…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-4">
        <p className="py-8 text-center text-sm text-rose-400">Failed to load tasks: {error}</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] text-slate-400 font-semibold tracking-wider">ASSIGNED TASKS</p>
        <h1 className="text-xl font-bold text-white mt-1">Today Checklist</h1>
        <p className="text-xs text-slate-400 mt-1">Each task must include objective and destination before execution.</p>
      </header>

      <div className="grid grid-cols-2 gap-2.5">
        <article className="bg-[#1e293b] border border-slate-700/60 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Total</p>
          <p className="text-lg font-bold text-white mt-1">{summary.total}</p>
        </article>
        <article className="bg-[#1e293b] border border-emerald-600/30 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-emerald-300">Valid</p>
          <p className="text-lg font-bold text-emerald-300 mt-1">{summary.valid}</p>
        </article>
        <article className="bg-[#1e293b] border border-rose-600/30 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-rose-300">Invalid</p>
          <p className="text-lg font-bold text-rose-300 mt-1">{summary.invalid}</p>
        </article>
        <article className="bg-[#1e293b] border border-sky-600/30 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-sky-300">Completed</p>
          <p className="text-lg font-bold text-sky-300 mt-1">{summary.completed}</p>
        </article>
      </div>

      <div className="flex flex-col gap-2.5">
        {validatedTasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No tasks assigned for today.</p>
        ) : (
          validatedTasks.map((task) => (
          <button
            key={task.task_id}
            type="button"
            onClick={() => toggleTask(task.task_id)}
            className={`w-full text-left bg-[#1e293b] rounded-xl p-4 flex items-start justify-between border transition-colors ${
              task.isValid
                ? task.completed
                  ? 'border-emerald-500/40'
                  : 'border-slate-700/60'
                : 'border-rose-500/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-5 h-5 rounded border flex items-center justify-center ${
                  task.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-500'
                }`}
              >
                {task.completed ? '✓' : ''}
              </span>
              <div>
                <p className={`text-sm font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                  {task.title}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300">
                  <Target size={12} className="text-emerald-300" />
                  {task.objective || '—'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <MapPin size={12} className="text-sky-300" />
                  {task.destination || '—'} • {task.zone || '—'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock3 size={12} className="text-amber-300" />
                  {task.time} • ETA {task.eta || '—'}
                </p>
                {!task.isValid && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-300">
                    <AlertTriangle size={12} />
                    Missing: {task.missingFields.join(', ')}
                  </p>
                )}
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wide ${getPriorityTone(task.priority)}`}
            >
              {task.priority}
            </span>
          </button>
          ))
        )}
      </div>
    </section>
  );
}
