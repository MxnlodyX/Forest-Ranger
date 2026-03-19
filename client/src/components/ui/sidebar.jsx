import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/useAppContext';
import { api, resolveMediaUrl } from '../../services/api';
import {
    LayoutDashboard, Users, Archive, BarChart, Map, FileText, LogOut
} from 'lucide-react';

export function Sidebar() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAppContext();

    const menuItems = [
        { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { path: '/hrm', name: 'Staff Management', icon: Users },
        { path: '/inventory', name: 'Inventory Management', icon: Archive },
        { path: '/taskassignment', name: 'Task Assignment', icon: BarChart },
        { path: '/report-management', name: 'Report Management', icon: FileText },
        { path: '/areas', name: 'Patrol Areas', icon: Map },
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
        <aside className="w-72 bg-[#0a0f0c] border-r border-[#1a2920] flex flex-col justify-between h-screen">
            <div>
                {/* Logo & Brand */}
                <div className="p-6 flex items-center space-x-3">
                    <div className="bg-emerald-800 p-2 rounded-lg"><Users size={20} className="text-white" /></div>
                    <div>
                        <h1 className="text-white font-bold text-lg">Forest Shield</h1>
                        <p className="text-xs text-gray-500">Back Office Console</p>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="mt-4 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-[#133021] text-emerald-400' // สีตอนคลิก (Active)
                                        : 'text-gray-400 hover:bg-[#1a2920]' // สีปกติ
                                    }`
                                }
                            >
                                <Icon size={18} />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section (Settings & Profile) */}
            <div className="p-4 border-t border-[#1a2920]">
                {/* User Profile */}
                <div className="flex items-center space-x-4 px-4 py-2">
                    {currentUser?.profileImage ? (
                        <img
                            src={resolveMediaUrl(currentUser.profileImage)}
                            alt={name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-800 font-bold">{initials}</div>
                    )}
                    <div>
                        <p className="text-sm text-white font-medium">{name}</p>
                        <p className="text-xs text-gray-500">{titleRole}</p>
                    </div>
                    <div className="Signout Icon">
                        <LogOut size={18} className="text-gray-400 hover:text-gray-200 cursor-pointer" onClick={handleSignOut} />
                    </div>

                </div>
            </div>
        </aside>
    );
}