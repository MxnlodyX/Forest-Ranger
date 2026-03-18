import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';

export function FieldOpsSignInPage() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { loginAs } = useAppContext();

    const handleSubmit = (e) => {
        e.preventDefault();
        // จำลองการล็อกอินของเจ้าหน้าที่ภาคสนาม
        loginAs('fieldops', { name: 'Ranger 01', role: 'fieldops' });
        navigate('/field-ops/home'); // เปลี่ยนไปหน้าแผนที่หรือแดชบอร์ดภาคสนาม
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#070b09] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#112117] to-[#070b09] p-5 font-sans text-white box-border selection:bg-emerald-500/30">

            {/* Mobile App Container (ออกแบบให้ดูเป็นจอมือถือ) */}
            <div className="w-full max-w-[380px] flex flex-col items-center">

                {/* Tactical Header Section */}
                <div className="flex flex-col items-center mb-10 text-center w-full">
                    {/* Radar / Target Icon */}
                    <div className="relative w-20 h-20 mb-6 flex justify-center items-center">
                        <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-ping"></div>
                        <div className="absolute inset-2 border border-emerald-500/50 rounded-full"></div>
                        <div className="relative bg-[#0d1a13] text-emerald-400 rounded-full p-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="2" x2="12" y2="6"></line>
                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                <line x1="2" y1="12" x2="6" y2="12"></line>
                                <line x1="18" y1="12" x2="22" y2="12"></line>
                                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                            </svg>
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-black mb-1 tracking-widest text-emerald-50 uppercase">Forest-Shield </h1>
                    <div className="flex items-center gap-2 text-emerald-500 font-mono text-xs tracking-[0.2em] bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/50">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        Field Ops
                    </div>
                </div>

                {/* Tactical Form Section */}
                <form className="flex flex-col gap-6 w-full" onSubmit={handleSubmit}>

                    {/* Operative ID Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] text-emerald-400/70 font-mono tracking-widest uppercase">Username</label>
                        <input
                            type="text"
                            placeholder="FRS-XXXX"
                            className="w-full bg-[#0d1611] border border-emerald-900/50 rounded-xl py-4 px-5 text-lg text-emerald-50 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-emerald-800/50"
                        />
                    </div>

                    {/* Passcode Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] text-emerald-400/70 font-mono tracking-widest uppercase">Password</label>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full bg-[#0d1611] border border-emerald-900/50 rounded-xl py-4 pl-5 pr-12 text-lg text-emerald-50 font-mono tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-emerald-800/50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 text-emerald-600 hover:text-emerald-400 transition-colors focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle><line x1="3" y1="3" x2="21" y2="21"></line></svg>
                                ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-[#070b09] rounded-xl py-4 font-black text-[16px] tracking-wider uppercase flex justify-center items-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                    >
                        Initiate Patrol
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </form>

                {/* Back to Base Link */}
                <p className="mt-10 text-center text-xs text-emerald-700 font-mono">
                    Back to Back Office ?{' '}
                    <Link to="/signin/backoffice" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
                        Return to Base
                    </Link>
                </p>

                <div className="mt-12 flex flex-col items-center gap-1 opacity-50 text-[12px] font-mono text-emerald-500 text-center">
                    <p>Agile Software Development</p>
                </div>

            </div>
        </div>
    );
}