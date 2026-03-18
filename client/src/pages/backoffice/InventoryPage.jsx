import React from 'react';
import { Archive } from 'lucide-react';

export function InventoryPage() {
  return (
    <section className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">Track field equipment, supplies, and maintenance status.</p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm flex flex-col items-center justify-center text-center">
        <Archive size={32} className="text-gray-400 mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Inventory Module Ready</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-lg">
          This section is connected to sidebar routing and prepared for inventory tables, stock adjustments,
          and equipment lifecycle tracking.
        </p>
      </div>
    </section>
  );
}
