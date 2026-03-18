import React, { useState } from 'react';
import { taskData } from './mockData';

export function FieldOpsTasksPage() {
  const [tasks, setTasks] = useState(taskData);

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  return (
    <section className="flex flex-col gap-4">
      <header>
        <p className="text-[11px] text-slate-400 font-semibold tracking-wider">ASSIGNED TASKS</p>
        <h1 className="text-xl font-bold text-white mt-1">Today Checklist</h1>
      </header>

      <div className="flex flex-col gap-2.5">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => toggleTask(task.id)}
            className={`w-full text-left bg-[#1e293b] rounded-xl p-4 flex items-center justify-between border transition-colors ${
              task.completed ? 'border-emerald-500/40' : 'border-slate-700/60'
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
                <p className="text-[11px] text-slate-400 mt-0.5">{task.time}</p>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wide ${
                task.priority === 'High' ? 'bg-red-900/40 text-red-300' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {task.priority}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
