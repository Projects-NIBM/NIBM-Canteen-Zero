import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Phone, Save, ShieldCheck, Lock, KeyRound } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');
    const isStudent = userRole === 'student';

    const [phone, setPhone] = useState(localStorage.getItem('userPhone') || '');
    const [passwords, setPasswords] = useState({ current: '', new: '' });
    const [loading, setLoading] = useState(false);

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 10) setPhone(val);
    };

    const handleUpdateContact = async (e) => {
        e.preventDefault();
        if (phone.length !== 10) return toast.error("Enter valid 10-digit number");
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const decoded = JSON.parse(atob(token.split('.')[1]));
            await API.put(`/api/auth/profile/${decoded.id}`, { phone });
            localStorage.setItem('userPhone', phone);
            toast.success("Contact synchronization complete");
        } catch (err) {
            toast.error("Cloud update failed");
        } finally { setLoading(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new.length < 6) return toast.error("New password too short");
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const decoded = JSON.parse(atob(token.split('.')[1]));
            await API.put(`/api/auth/change-password/${decoded.id}`, {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            toast.success("Security credentials updated");
            setPasswords({ current: '', new: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || "Password update failed");
        } finally { setLoading(false); }
    };

    return (
        <div className="h-screen w-full bg-nibmGray flex items-center justify-center p-6 relative overflow-hidden font-sans text-slate-900">
            <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-nibmGold opacity-10 rounded-full blur-[120px]"></div>
            
            <div className="relative w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 z-20">
                <div className="bg-white rounded-[2.5rem] shadow-premium border border-white p-10 animate-in fade-in slide-in-from-left duration-500 text-left">
                    <button onClick={() => navigate(userRole === 'admin' ? '/admin/dashboard' : '/menu')} className="mb-6 p-2 hover:bg-gray-100 rounded-full transition-all">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </button>
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-nibmBlue rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl text-white">
                            <User size={32} /> 
                        </div>
                        <h2 className="text-xl font-black text-nibmBlue uppercase tracking-tight">Identity Settings</h2>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{isStudent ? "Student Account" : "Admin Account"}</p>
                    </div>

                    <form onSubmit={handleUpdateContact} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Phone size={12} /> Contact Number</label>
                            <input type="text" value={phone} onChange={handlePhoneChange} placeholder="07XXXXXXXX" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-nibmBlue outline-none font-bold text-nibmBlue" />
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-green-600 font-bold uppercase tracking-widest bg-green-50 p-4 rounded-xl leading-tight">
                            <ShieldCheck size={16} className="flex-shrink-0" /> 
                            Verified for {isStudent ? "Pickup Alerts" : "System Alerts"}
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-nibmBlue text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                            <Save size={16} /> Save Identity
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-premium border border-white p-10 animate-in fade-in slide-in-from-right duration-500 text-left">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-red-50 rounded-2xl text-nibmRed"><Lock size={24}/></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Security</h2>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Portal Access</p>
                        </div>
                    </div>
                    <form onSubmit={handleChangePassword} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                            <input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-nibmRed outline-none" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Secure Password</label>
                            <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-nibmRed outline-none" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-nibmRed text-white font-black py-4 rounded-2xl shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                            <KeyRound size={16} /> Update Credentials
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;