import React, { useState } from 'react';

const LoginForm = ({ onLogin, error, loading }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalError('');

        if (!email.toLowerCase().endsWith('@nibm.lk')) {
            setLocalError('Access Denied. Please use your official @nibm.lk student email.');
            return;
        }

        onLogin(email, password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {(error || localError) && (
                <div className="bg-red-50 border-l-4 border-nibmRed p-3 rounded text-xs text-red-700 font-bold animate-pulse">
                    {error || localError}
                </div>
            )}

            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                    University Email
                </label>
                <input
                    type="email"
                    placeholder="student_id@nibm.lk"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-nibmBlue/20 focus:border-nibmBlue transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                    Password
                </label>
                <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-nibmBlue/20 focus:border-nibmBlue transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-nibmBlue text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-800 active:scale-[0.98] transition-all flex justify-center items-center tracking-wide"
            >
                {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                    "ACCESS PORTAL"
                )}
            </button>
            
            <div className="flex justify-between items-center px-1">
                <button 
                    type="button"
                    onClick={() => alert("Please contact the NIBM IT Administration office to reset your portal password.")}
                    className="text-[11px] text-nibmRed font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                    Forgot Password?
                </button>
                <span className="text-[11px] text-gray-400 font-medium tracking-tighter">
                    SECURED BY NIBM-IT v1.0.2
                </span>
            </div>
        </form>
    );
};

export default LoginForm;