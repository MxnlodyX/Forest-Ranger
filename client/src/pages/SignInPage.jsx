import React, { useState } from 'react';
export function SignInPage() {
    const [showPassword, setShowPassword] = useState(false);
    return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#1c2b24] to-[#2f453a] p-5 font-sans text-white box-border">

        {/* Login Card */}
        <div className="w-full max-w-[420px] bg-[#1a211e] rounded-2xl p-8 sm:p-10 shadow-2xl">

            {/* Header Section */}
            <div className="flex flex-col items-center mb-8 text-center">
                <div className="w-12 h-12 bg-[#153c29] text-white rounded-full flex justify-center items-center mb-4">
                    <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="M12 8v4"></path>
                        <path d="M12 16h.01"></path>
                    </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2 tracking-wide">Enterprise Security</h1>
                <p className="text-sm text-[#8c9b95]">Secure access to organizational assets</p>
            </div>

            {/* Form Section */}
            <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>

                {/* Username Input */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] text-[#b3c2bc] font-medium">Username</label>
                    <div className="relative flex items-center">
                        <svg className="absolute left-3.5 w-[18px] h-[18px] text-[#6a7c74]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            className="w-full bg-[#121715] border border-transparent rounded-lg py-3.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#1f5c3e] transition-colors placeholder-[#55665f]"
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] text-[#b3c2bc] font-medium">Password</label>
                    <div className="relative flex items-center">
                        <svg className="absolute left-3.5 w-[18px] h-[18px] text-[#6a7c74]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="w-full bg-[#121715] border border-transparent rounded-lg py-3.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-[#1f5c3e] transition-colors placeholder-[#55665f]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 text-[#6a7c74] hover:text-[#8c9b95] transition-colors focus:outline-none"
                        >
                            {showPassword ? (
                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="mt-2 w-full bg-[#1b4b32] hover:bg-[#236141] text-white rounded-lg py-3.5 font-semibold text-[15px] flex justify-center items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1f5c3e] focus:ring-offset-2 focus:ring-offset-[#1a211e]"
                >
                    Sign In
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"></path>
                        <path d="M15 12H3"></path>
                    </svg>
                </button>
            </form>

            {/* Footer Link */}
            <div className="text-center mt-6 text-[13px] text-[#8c9b95]">
                Forgot Password? <a href="#contact" className="text-[#2d734e] font-medium hover:underline ml-1">Contact Admin</a>
            </div>
        </div>

        {/* System Status */}
        <div className="mt-8 flex items-center gap-2 text-[11px] font-semibold text-[#8c9b95] tracking-[1.5px]">
            <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
            SYSTEM STATUS: OPERATIONAL
        </div>

    </div>
    );
}