import {
    LayoutDashboard, Users, Archive, BarChart, Map, Settings,
    Search, Plus, X, Edit2, Trash2, Eye, CheckCircle, Bell
} from 'lucide-react';
export function Sidebar() {
    return(
        <>
        {/* Sidebar */}
            <aside className="w-64 bg-[#0a0f0c] border-r border-[#1a2920] flex flex-col justify-between">
                <div>
                    <div className="p-6 flex items-center space-x-3">
                        <div className="bg-emerald-800 p-2 rounded-lg"><Users size={20} className="text-white" /></div>
                        <div>
                            <h1 className="text-white font-bold text-lg">Forest Shield</h1>
                            <p className="text-xs text-gray-500">Back Office Console</p>
                        </div>
                    </div>
                    <nav className="mt-4 px-4 space-y-2">
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-[#1a2920] rounded-lg transition-colors"><LayoutDashboard size={18} /><span>Dashboard</span></a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-[#133021] text-emerald-400 rounded-lg"><Users size={18} /><span>Staff Management</span></a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-[#1a2920] rounded-lg transition-colors"><Archive size={18} /><span>Inventory</span></a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-[#1a2920] rounded-lg transition-colors"><BarChart size={18} /><span>Reports</span></a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-[#1a2920] rounded-lg transition-colors"><Map size={18} /><span>Patrol Areas</span></a>
                    </nav>
                </div>
                <div className="p-4 border-t border-[#1a2920]">
                    <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-[#1a2920] rounded-lg transition-colors mb-2"><Settings size={18} /><span>Settings</span></a>
                    <div className="flex items-center space-x-3 px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-800 font-bold">MT</div>
                        <div>
                            <p className="text-sm text-white font-medium">Marcus Thorne</p>
                            <p className="text-xs text-gray-500">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}