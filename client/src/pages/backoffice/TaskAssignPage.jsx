
import React from 'react';
import { BarChart3 } from 'lucide-react';

export function TaskAssignPage() {
  return (
    <section className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Assignment</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and assign tasks to staff members.</p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm flex flex-col items-center justify-center text-center">
        <BarChart3 size={32} className="text-gray-400 mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Task Assignment Workspace</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-lg">
          Assign tasks to staff members and track their progress here. The route now matches the
          sidebar navigation path.
        </p>
      </div>
    </section>
  );
}
