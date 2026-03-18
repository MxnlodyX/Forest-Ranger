import React, { useState } from 'react';

export function FieldOpsHomePage() {
  // จำลองข้อมูล Tasks
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Inspect Perimeter Fence', time: 'Due by 10:00 AM', completed: false },
    { id: 2, title: 'Morning Briefing', time: 'Completed at 07:30 AM', completed: true },
    { id: 3, title: 'Water Source Check', time: 'Creek Delta Station', completed: false },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    // คอนเทนเนอร์หลัก จำลองขนาดจอมือถือ
    <div className="min-h-screen bg-[#111820] text-slate-200 font-sans flex justify-center pb-20">
      <div className="w-full max-w-md px-4 py-6 flex flex-col gap-6">

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
          <button className="w-10 h-10 bg-[#1e293b] rounded-full flex items-center justify-center text-slate-300 relative">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-[#1e293b]"></span>
          </button>
        </div>

        {/* Status Cards: GPS & Battery */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1e293b] rounded-2xl p-4 flex flex-col gap-1 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 tracking-wider">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M2 22L12 2l10 20H2z" /></svg>
              GPS SIGNAL
            </div>
            <span className="text-xl font-bold text-white">Strong</span>
          </div>
          <div className="bg-[#1e293b] rounded-2xl p-4 flex flex-col gap-1 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 tracking-wider">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="16" rx="2" ry="2"></rect><line x1="10" y1="2" x2="14" y2="2"></line></svg>
              BATTERY
            </div>
            <span className="text-xl font-bold text-white">85%</span>
          </div>
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
                  <h3 className="text-lg font-bold text-white">Sector 7 - North Ridge</h3>
                  <p className="text-xs text-slate-400 mt-0.5">8.4 km • Estimated 4 hours</p>
                </div>
                <button className="w-10 h-10 bg-[#111820] rounded-full flex items-center justify-center text-emerald-500 border border-slate-700">
                   <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                </button>
              </div>
              <div className="flex gap-2">
                <span className="bg-[#2a3649] text-slate-300 text-[11px] px-3 py-1 rounded-md flex items-center gap-1.5 font-medium">
                   <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                   Rough Terrain
                </span>
                <span className="bg-[#2a3649] text-slate-300 text-[11px] px-3 py-1 rounded-md flex items-center gap-1.5 font-medium">
                   <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                   18°C
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-[#1b4332] hover:bg-[#2d6a4f] transition-colors rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border border-emerald-900/50 shadow-lg shadow-emerald-900/20">
            <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4v16"></path><path d="M17 8l-4-4-4 4"></path></svg>
            <span className="text-sm font-bold text-white">Start Patrol</span>
          </button>
          <button className="bg-[#1e293b] hover:bg-[#2a3649] transition-colors rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border border-slate-700/50">
            <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span className="text-sm font-bold text-emerald-500">Check Gear</span>
          </button>
        </div>

        {/* Today's Tasks */}
        <div className="flex flex-col gap-3 mb-6">
          <h2 className="text-base font-bold text-white">Today's Tasks</h2>
          <div className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <div key={task.id} onClick={() => toggleTask(task.id)} className={`bg-[#1e293b] rounded-xl p-4 flex items-center justify-between border cursor-pointer transition-colors ${task.completed ? 'border-emerald-500/30' : 'border-slate-700/50'}`}>
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border flex justify-center items-center transition-colors ${task.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-500 bg-[#111820]'}`}>
                    {task.completed && <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  {/* Text */}
                  <div>
                    <h4 className={`text-sm font-bold ${task.completed ? 'text-slate-300 line-through decoration-slate-500' : 'text-slate-100'}`}>{task.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{task.time}</p>
                  </div>
                </div>
                {/* 3 dots */}
                <button className="text-slate-500 p-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Navigation (Fixed) */}
      <div className="fixed bottom-0 w-full max-w-md bg-[#0f1721] border-t border-[#1e293b] flex justify-between items-center px-6 py-3 pb-6 z-50">
        <button className="flex flex-col items-center gap-1 text-emerald-400">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-[9px] font-bold tracking-wider">HOME</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
          <span className="text-[9px] font-medium tracking-wider">MAPS</span>
        </button>
        
        {/* Center Primary Action (Report) */}
        <button className="flex flex-col items-center relative top-[-10px]">
          <div className="w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center text-[#111820] shadow-lg border-4 border-[#0f1721]">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </div>
          <span className="text-[9px] font-medium tracking-wider text-slate-400 mt-1">REPORT</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span className="text-[9px] font-medium tracking-wider">TASKS</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span className="text-[9px] font-medium tracking-wider">PROFILE</span>
        </button>
      </div>

    </div>
  );
}