import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/ui/sidebar';

export function BackOfficeLayout() {
	return (
		<div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
			<Sidebar />
			<main className="flex-1 overflow-y-auto">
				<Outlet />
			</main>
		</div>
	);
}
