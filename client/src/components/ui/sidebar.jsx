import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/useAppContext';
import { api, resolveMediaUrl } from '../../services/api';
import {
    LayoutDashboard, Users, Archive, BarChart, Map, FileText, LogOut, ScanSearch,
    Book, ClipboardList, Flame, Menu, X
} from 'lucide-react';

export function Sidebar() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAppContext();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { path: '/hrm', name: 'Staff Management', icon: Users },
        { path: '/inventory', name: 'Inventory Management', icon: Archive },
        { path: '/taskassignment', name: 'Task Assignment', icon: BarChart },
        { path: '/report-management', name: 'Report Management', icon: FileText },
        { path: '/areas', name: 'Patrol Areas', icon: Map },
        { path: '/image-classification', name: 'Image Classification', icon: ScanSearch },
        { path: '/knowledge-management', name: 'Knowledge Management', icon: Book },
        { path: '/monthly-report', name: 'Monthly Report', icon: ClipboardList },
        { path: '/heatmap-management', name: 'HeatMap Management', icon: Flame },
    ];

    const handleSignOut = async () => {
        try {
            await api.post('/api/sign_out', {});
        } catch {
            // allow local sign-out to continue even when network request fails
        }
        logout();
        navigate('/signin/backoffice');
    };

    const name = currentUser?.name || 'Back Office User';
    const titleRole = currentUser?.titleRole || 'Back Office';
    const initials = name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-[#0a0f0c] border-r border-[#1a2920] flex flex-col justify-between h-screen transition-all duration-300 ease-in-out`}>
            <div className="flex flex-col flex-1 min-h-0">
                {/* Logo & Brand & Toggle */}
                <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} space-x-3`}>
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="bg-emerald-800 p-2 rounded-lg shrink-0">
                            <Users size={20} className="text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="transition-opacity duration-300 whitespace-nowrap">
                                <h1 className="text-white font-bold text-lg">Forest Shield</h1>
                                <p className="text-xs text-gray-500">Back Office Console</p>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <Menu size={20} /> : <X size={20} />}
                    </button>
                </div>

                {/* Navigation Menu - Scrollable Area */}
                <nav className="mt-4 px-4 pb-2 space-y-2 flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                title={isCollapsed ? item.name : ""}
                                className={({ isActive }) =>
                                    `flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-[#133021] text-emerald-400'
                                        : 'text-gray-400 hover:bg-[#1a2920]'
                                    }`
                                }
                            >
                                <Icon size={18} className="shrink-0" />
                                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden transition-opacity duration-300">{item.name}</span>}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section (Settings & Profile) */}
            <div className="p-4 border-t border-[#1a2920]">
                {/* User Profile */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4 px-4'} py-2`}>
                    {currentUser?.profileImage ? (
                        <img
                            src={resolveMediaUrl(currentUser.profileImage)}
                            alt={name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-800 font-bold shrink-0">{initials}</div>
                    )}
                    
                    {!isCollapsed && (
                        <div className="flex-1 overflow-hidden transition-opacity duration-300">
                            <p className="text-sm text-white font-medium truncate">{name}</p>
                            <p className="text-xs text-gray-500 truncate">{titleRole}</p>
                        </div>
                    )}
                    
                    {!isCollapsed && (
                        <div className="Signout Icon">
                            <LogOut size={18} className="text-gray-400 hover:text-gray-200 cursor-pointer shrink-0" onClick={handleSignOut} />
                        </div>
                    )}
                </div>
                {isCollapsed && (
                    <div className="mt-2 flex justify-center">
                         <LogOut size={18} className="text-gray-400 hover:text-gray-200 cursor-pointer" onClick={handleSignOut} />
                    </div>
                )}
            </div>
        </aside>
    );
}
