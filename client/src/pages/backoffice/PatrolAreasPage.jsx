import React from 'react';
import { Map } from 'lucide-react';

export function PatrolAreasPage() {
  return (
    <section className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patrol Areas</h1>
        <p className="text-sm text-gray-500 mt-1">Configure sectors and assign ranger coverage plans.</p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm flex flex-col items-center justify-center text-center">
        <Map size={32} className="text-gray-400 mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Area Mapping Page Connected</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-lg">
          This route is now part of the sidebar system. Integrate zone maps, geo-fences, and assignment
          controls here.
        </p>
      </div>
    </section>
  );
}
