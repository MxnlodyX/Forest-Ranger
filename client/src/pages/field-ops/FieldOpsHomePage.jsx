import React, { useCallback } from 'react';
import { missionData, statData } from './mockData';
import { useAppContext } from '../../context/useAppContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';

export function FieldOpsHomePage() {
  const { currentUser } = useAppContext();
  const staffId = currentUser?.id;

  const fetcher = useCallback(
    () => (staffId ? api.get(`/api/tasks/assigned/${staffId}`) : Promise.resolve([])),
    [staffId],
  );
  const { data: rawTasks, loading } = useApi(fetcher, [staffId]);

  // แสดงเฉพาะ task ที่ยังไม่ Done
  const pendingTasks = (rawTasks ?? []).filter((t) => t.status !== 'Done').slice(0, 5);

  return (
    <section className="flex flex-col gap-6">

        {/* Header: Profile & Notifications */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">Ranger ID: #4492</p>
              <h1 className="text-lg font-bold text-white leading-tight">Officer Miller</h1>
            </div>
          </div>
          
        </div>

        {/* Status Cards: GPS & Battery */}
        <div className="grid grid-cols-3 gap-3">
          {statData.map((stat) => (
            <article key={stat.id} className="bg-[#1e293b] rounded-2xl p-3 flex flex-col gap-1 border border-slate-700/50">
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{stat.label}</p>
              <span className={`text-sm font-bold ${stat.tone}`}>{stat.value}</span>
            </article>
          ))}
        </div>

        {/* My Mission Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-white">My Mission</h2>

          <div className="bg-[#1e293b] rounded-2xl overflow-hidden border border-slate-700/50">
            {/* Map Placeholder */}
            <div className="h-32 bg-slate-600 relative bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center">
              <div className="absolute inset-0 bg-emerald-900/20 mix-blend-overlay"></div>
              <div className="absolute bottom-3 left-3 bg-[#112a20] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-emerald-900/50">
                <svg className="w-3 h-3 text-emerald-400 fill-current" viewBox="0 0 24 24"><path d="M12 2L2 22l10-3 10 3L12 2z" /></svg>
                <span className="text-[10px] font-bold text-emerald-100 tracking-wider">ASSIGNED ROUTE</span>
              </div>
            </div>

            {/* Mission Details */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">{missionData.zone}</h3>
                </div>
                <button className="w-10 h-10 bg-[#111820] rounded-full flex items-center justify-center text-emerald-500 border border-slate-700">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                </button>
              </div>
              <div className="flex gap-2">
                <span className="bg-[#2a3649] text-slate-300 text-[11px] px-3 py-1 rounded-md flex items-center gap-1.5 font-medium">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {missionData.park}
                </span>
                <span className="bg-[#2a3649] text-slate-300 text-[11px] px-3 py-1 rounded-md flex items-center gap-1.5 font-medium">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                  {missionData.temperature}
                </span>
              </div>
            </div>
          </div>
        </div>

       

        {/* Today's Tasks */}
        <div className="flex flex-col gap-3 mb-6">
          <h2 className="text-base font-bold text-white">Today's Tasks</h2>
          <div className="flex flex-col gap-2.5">
            {loading ? (
              <p className="text-center text-xs text-slate-500 py-4">Loading tasks…</p>
            ) : pendingTasks.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-4">No pending tasks for today.</p>
            ) : (
              pendingTasks.map((task) => (
                <div
                  key={task.task_id}
                  className="bg-[#1e293b] rounded-xl p-4 flex items-center justify-between border border-slate-700/50"
                >
                  <div className="flex items-center gap-4">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${task.status === 'In Progress' ? 'bg-amber-400' : 'bg-sky-400'}`} />
                    {/* Text */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{task.task_title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {task.assigned_date ? `Due ${task.assigned_date}` : '—'}
                        {task.eta ? ` • ETA ${task.eta}` : ''}
                      </p>
                    </div>
                  </div>
                  {/* Priority pill */}
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold tracking-wide flex-shrink-0 ${
                    task.priority === 'High'
                      ? 'bg-red-900/40 text-red-300'
                      : task.priority === 'Medium'
                      ? 'bg-amber-900/40 text-amber-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
    </section>
  );
}