import React from 'react';
import { Shield, Users, Archive, MapPinned } from 'lucide-react';

const statCards = [
  { title: 'Active Rangers', value: '24', icon: Users, accent: 'text-emerald-600' },
  { title: 'Inventory Items', value: '318', icon: Archive, accent: 'text-sky-600' },
  { title: 'Patrol Zones', value: '12', icon: MapPinned, accent: 'text-orange-600' },
  { title: 'Alert Level', value: 'Normal', icon: Shield, accent: 'text-violet-600' },
];

export function DashboardPage() {
  return (
    <section className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Operational overview for Forest Shield command center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{card.title}</h2>
                <Icon size={18} className={card.accent} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </article>
          );
        })}
      </div>

      <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Brief</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Patrol teams are fully staffed and all checkpoints are online. No high-severity incidents were
          reported in the last 24 hours.
        </p>
      </article>
    </section>
  );
}
