import React, { useState, useEffect } from 'react';
import { Shield, Users, Archive, MapPinned } from 'lucide-react';
import { api } from "../../services/api";
// นำเข้า Recharts สำหรับทำกราฟ
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function DashboardPage() {
  // 1. State สำหรับเก็บข้อมูลจาก API
  const [stats, setStats] = useState({
    totalStaff: 0,
    onDutyStaff: 0,
    totalInventory: 0,
    staffChartData: [],
    inventoryChartData: [],
    staffMembersByStatus: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaffStatus, setSelectedStaffStatus] = useState('On Duty');

  // 2. ดึงข้อมูลทันทีที่เปิดหน้าเว็บ
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/api/dashboard/stats');
        setStats(data);
        if (Array.isArray(data?.staffChartData) && data.staffChartData.length > 0) {
          const preferredStatus = data.staffChartData.find((item) => item.status === 'On Duty')?.status;
          setSelectedStaffStatus(preferredStatus || data.staffChartData[0].status);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // 3. เอาข้อมูลที่ดึงมา ใส่เข้าไปในการ์ดสถิติของนาย (ผสมของจริง กับ Mock data)
  const statCards = [
    { title: 'Active Rangers', value: stats.onDutyStaff.toString(), icon: Users, accent: 'text-emerald-600' },
    { title: 'Inventory Items', value: stats.totalInventory.toString(), icon: Archive, accent: 'text-sky-600' },
    { title: 'Patrol Zones', value: '12', icon: MapPinned, accent: 'text-orange-600' }, // อันนี้ Mock ไว้ก่อนรอทำหน้า Patrol
    { title: 'Alert Level', value: 'Normal', icon: Shield, accent: 'text-violet-600' },
  ];

  const selectedStatusMeta = stats.staffChartData.find((item) => item.status === selectedStaffStatus);
  const selectedStatusMembers = stats.staffMembersByStatus?.[selectedStaffStatus] || [];

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-[80vh]">
        <div className="text-emerald-600 animate-pulse font-medium">Loading Command Center data...</div>
      </div>
    );
  }

  return (
    <section className="p-8">
      {/* Header ของนาย (คลีนๆ สวยอยู่แล้ว) */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Operational overview for Forest Shield command center.</p>
      </div>

      {/* Cards สถิติที่เด้งแบบเรียลไทม์ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{card.title}</h2>
                <div className={`p-2 bg-gray-50 rounded-lg ${card.accent}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </article>
          );
        })}
      </div>

      {/* --- ส่วนที่เพิ่มใหม่: กราฟ Recharts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 1. กราฟแท่ง (Bar Chart) - สถานะคนทำงาน */}
        <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ranger Duty Status</h3>
            <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">Real-time</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.staffChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  label={{ position: 'top', fill: '#374151', fontSize: 14, fontWeight: 'bold' }}
                  onClick={(entry) => setSelectedStaffStatus(entry?.status)}
                >
                  {stats.staffChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">
                Staff Members in Status: {selectedStatusMeta?.name || '-'}
              </h4>
              <span className="text-xs font-medium text-gray-600">
                {selectedStatusMembers.length} people
              </span>
            </div>
            {selectedStatusMembers.length === 0 ? (
              <p className="text-sm text-gray-500">No staff members found for this status.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedStatusMembers.map((member) => (
                  <div key={member.staffId} className="rounded-md bg-white border border-gray-200 px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900">{member.fullName}</p>
                    <p className="text-xs text-gray-500">@{member.username} • {member.titleRole || 'Ranger'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* 2. กราฟโดนัท (Pie Chart) - ภาพรวมอุปกรณ์ */}
        <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Overview</h3>
          <div className="h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.inventoryChartData}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.inventoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* ตัวเลขตรงกลางโดนัท */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{stats.totalInventory}</span>
              <span className="text-xs text-gray-500">Items</span>
            </div>
          </div>
          {/* ป้ายกำกับ (Legend) แบบ Custom */}
          <div className="flex justify-center gap-4 mt-2">
            {stats.inventoryChartData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}