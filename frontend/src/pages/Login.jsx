import React, { useState } from 'react';
import axios from 'axios';
import LoginForm from '../components/LoginForm';
import toast from 'react-hot-toast';

const Login = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoginSubmission = async (email, password) => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`,
                { email, password },
                { withCredentials: true }
            );

            const { token, user } = response.data;

            if (token) {
                localStorage.setItem('token', token);
            }
            localStorage.setItem('userName', user.name);
            localStorage.setItem('userRole', user.role);

            toast.success(`Welcome, ${user.name}`);
            window.location.href = user.role === 'admin' ? '/admin/dashboard' : '/menu';
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-nibmGray flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-nibmGold opacity-20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[5%] right-[5%] w-[500px] h-[500px] bg-nibmBlue opacity-10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(11,61,145,0.15)] border border-white/60 overflow-hidden z-20 animate-in fade-in zoom-in duration-500">
                <div className="bg-nibmBlue p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                    <h2 className="text-2xl font-black tracking-[0.25em] uppercase leading-none">CANTEEN-ZERO</h2>
                    <div className="flex flex-col items-center justify-center gap-1 mt-2">
                        <div className="h-1 w-12 bg-nibmRed rounded-full mb-1"></div>
                        <p className="text-blue-200 text-[10px] font-bold tracking-[0.2em] uppercase opacity-80 text-center">
                            Zero-Queue Ordering System
                        </p>
                    </div>
                </div>
                
                <div className="p-10 md:p-12">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight leading-tight">Student Login</h1>
                        <p className="text-gray-400 text-[11px] font-medium uppercase tracking-widest mt-2">
                             Order • Pay • Seat — All in one tap
                        </p>
                    </div>
                    <LoginForm onLogin={handleLoginSubmission} error={error} loading={loading} />
                </div>
                
                <div className="bg-gray-50/50 py-5 text-center border-t border-gray-100">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">
                        NIBM Colombo Campus • Vidya Mawatha
                    </p>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full leading-none z-10 pointer-events-none select-none">
                <svg viewBox="0 0 1440 320" className="w-full h-auto drop-shadow-[0_-10px_20px_rgba(11,61,145,0.05)]">
                    <path fill="#0b3d91" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,122.7C672,128,768,192,864,202.7C960,213,1056,171,1152,144C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>
        </div>
    );
};

export default Login;