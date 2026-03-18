import React from 'react';
import { useNavigate } from 'react-router-dom';
// Assuming this is your context path based on the snippet
import { useAppContext } from '../../context/useAppContext';

// Helper function to extract initials for the avatar
const getInitials = (name) => {
    if (!name) return 'FR';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export function FieldOpsProfilePage() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAppContext();

    const handleSignOut = () => {
        logout();
        navigate('/signin/fieldops');
    };

    return (
        <section className="flex flex-col gap-6 p-4 md:p-6 bg-[#111820] min-h-screen">
            <header className="mb-2">
                <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase">Operative Profile</p>
                <h1 className="text-2xl font-bold text-white mt-1">My Account</h1>
            </header>

            {/* Profile Header Card */}
            <div className="bg-[#1e293b] border border-slate-700/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/20 flex items-center justify-center text-2xl font-bold mb-4 shadow-inner">
                    {getInitials(currentUser?.name)}
                </div>
                <h2 className="text-xl font-bold text-white">{currentUser?.name ?? 'Field Ranger'}</h2>
                <span className="mt-2 px-3 py-1 bg-sky-500/10 text-sky-400 rounded-full text-xs font-semibold tracking-wide uppercase border border-sky-500/10">
                    Field Operations
                </span>
            </div>

            

            {/* Actions */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">

                <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded-xl py-3.5 font-semibold text-sm transition-all shadow-lg hover:shadow-red-500/20"
                >
                    Sign Out
                </button>
            </div>
        </section>
    );
}