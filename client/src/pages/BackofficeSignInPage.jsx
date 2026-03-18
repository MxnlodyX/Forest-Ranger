import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';

export function BackofficeSignInPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const { loginAs } = useAppContext();

    const handleSubmit = (e) => {
        e.preventDefault();
        loginAs('backoffice', { name: 'Director Marcus', role: 'backoffice' });
        navigate('/dashboard'); 
    };

    return (
        // พื้นหลังแนว Enterprise: เรียบ หรู มี Grid Pattern อ่อนๆ ให้ดูเป็นระบบข้อมูล
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#f0f4f2] bg-[radial-gradient(#d1dfd6_1px,transparent_1px)] [background-size:20px_20px] p-5 font-sans text-slate-800 box-border">

            <div className="w-full max-w-[900px] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(27,75,50,0.15)] overflow-hidden flex flex-col md:flex-row border border-slate-100">
                
                {/* Left Side: Branding & Visuals (แถบด้านซ้ายสำหรับหน้าจอคอมฯ) */}
                <div className="hidden md:flex flex-col justify-between w-5/12 bg-gradient-to-br from-[#1b4b32] to-[#0f2e1e] p-12 text-white relative overflow-hidden">
                    {/* Abstract Decorative Circles */}
                    <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] rounded-full bg-white/5 blur-3xl"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[200px] h-[200px] rounded-full bg-[#4ade80]/10 blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md text-emerald-400 rounded-xl flex justify-center items-center mb-6 shadow-lg border border-white/20">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-2 leading-tight">Forest Shield<br/>Back Office</h1>
                        <p className="text-emerald-100/70 text-sm mt-4 leading-relaxed">
                            Centralized command center for monitoring ecosystem health, managing field operations, and analyzing spatial data.
                        </p>
                    </div>

                    <div className="relative z-10 text-xs text-emerald-200/50 font-medium tracking-wider uppercase">
                        ITDS365 Agile Software Development
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full md:w-7/12 p-8 md:p-14 bg-white flex flex-col justify-center">
                    
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome back</h2>
                        <p className="text-slate-500 text-sm">Please enter your credentials to access the dashboard.</p>
                    </div>

                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>

                        {/* Email/Username Input */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] text-slate-600 font-semibold">Username</label>
                            <input
                                type="text"
                                placeholder="BOF-XXXX"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-[#1b4b32] focus:ring-1 focus:ring-[#1b4b32] transition-all placeholder-slate-400"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] text-slate-600 font-semibold">Password</label>
                            <div className="relative flex items-center">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-800 focus:outline-none focus:border-[#1b4b32] focus:ring-1 focus:ring-[#1b4b32] transition-all placeholder-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Options: Remember me & Forgot Password */}
                        <div className="flex justify-between items-center mt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex justify-center items-center transition-colors ${rememberMe ? 'bg-[#1b4b32] border-[#1b4b32]' : 'border-slate-300 group-hover:border-[#1b4b32]'}`}>
                                    {rememberMe && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                                <span className="text-[13px] text-slate-600 font-medium">Remember me</span>
                            </label>
                            
                          
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="mt-4 w-full bg-[#1b4b32] hover:bg-[#153c29] text-white rounded-xl py-3.5 font-semibold text-[15px] transition-all shadow-[0_4px_12px_rgba(27,75,50,0.2)] hover:shadow-[0_6px_16px_rgba(27,75,50,0.3)] active:transform active:scale-[0.99]"
                        >
                            Click to Sign In
                        </button>
                    </form>

                    {/* Link to Field Ops */}
                    <div className="mt-10 pt-6 border-t border-slate-100 flex justify-center">
                        <p className="text-sm text-slate-500">
                            Switch to FieldOps ?{' '}
                            <Link to="/signin/fieldops" className="text-[#1b4b32] hover:text-[#2a754f] font-bold underline underline-offset-4 decoration-2 decoration-[#1b4b32]/30 hover:decoration-[#1b4b32]">
                                Open Forest Shield Field-Ops
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}