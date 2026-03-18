import React, { useMemo, useState } from 'react';
import { AlertTriangle, Clock3, MapPin, Target } from 'lucide-react';
import { taskData } from './mockData';

const taskRequirements = [
  {
    key: 'title',
    label: 'Task title',
  },
  {
    key: 'objective',
    label: 'Objective',
  },
  {
    key: 'destination',
    label: 'Destination',
  },
  {
    key: 'zone',
    label: 'Zone',
  },
];

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
  const [tasks, setTasks] = useState(taskData);

  const validatedTasks = useMemo(() => tasks.map((task) => validateTask(task)), [tasks]);

  const summary = useMemo(() => {
    const valid = validatedTasks.filter((task) => task.isValid).length;
    const invalid = validatedTasks.length - valid;
    const completed = validatedTasks.filter((task) => task.completed).length;

    return {
      total: validatedTasks.length,
      valid,
      invalid,
      completed,
    };
  }, [validatedTasks]);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        const validatedTask = validateTask(task);
        if (!validatedTask.isValid) {
          window.alert('Task data is incomplete. Please complete destination/objective details first.');
          return task;
        }

        return { ...task, completed: !task.completed };
      }),
    );
  };

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
        {validatedTasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => toggleTask(task.id)}
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
                  {task.objective}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <MapPin size={12} className="text-sky-300" />
                  {task.destination} • {task.zone}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock3 size={12} className="text-amber-300" />
                  {task.time} • ETA {task.eta}
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
        ))}
      </div>
    </section>
  );
}
