import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import { ChefHat, Clock, CheckCircle2, Flame, ArrowLeft, RotateCcw, ShoppingBag, BellRing, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const KitchenMonitor = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const audioRef = useRef(new Audio(`${process.env.PUBLIC_URL}/notification.mp3`));

    const fetchOrders = useCallback(async () => {
        try {
            const res = await API.get('/api/orders/admin/active');
            setOrders(res.data);
        } catch (err) {
            console.error("Queue stream offline");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL);
        
        socket.on('newOrderAlert', (newOrder) => {
            audioRef.current.play().catch(e => {});
            fetchOrders();
            toast.success(`Incoming: Token #${newOrder.tokenID}`, { 
                icon: '🔔', 
                position: 'top-right',
                style: { background: '#ffc600', color: '#0b3d91', fontWeight: 'bold' }
            });
        });

        socket.on('orderCountUpdate', () => fetchOrders());
        socket.on('occupancyUpdate', () => fetchOrders());

        fetchOrders();
        return () => socket.disconnect();
    }, [fetchOrders]);

    const updateStatus = async (id, nextStatus) => {
        try {
            await API.patch(`/api/orders/${id}/status`, { status: nextStatus });
            toast.success(`Pipeline: ${nextStatus}`);
            fetchOrders();
        } catch (err) {
            toast.error("Process transition failed");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5';
            case 'Preparing': return 'bg-[#ffc600]/10 text-[#ffc600] border-[#ffc600]/20 shadow-[#ffc600]/5';
            case 'Ready': return 'bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/5';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    const calculateWait = (time) => {
        const diff = Math.floor((new Date() - new Date(time)) / 60000);
        return diff > 0 ? `${diff}m ago` : 'Just now';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans p-8 overflow-x-hidden leading-none">
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 border-b border-white/5 pb-10">
                <div className="flex items-center gap-8 animate-in fade-in slide-in-from-left duration-500 text-left">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all text-gray-500 hover:text-white shadow-xl">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="text-left">
                        <div className="flex items-center gap-4 text-left leading-none">
                            <div className="p-3 bg-[#ffc600]/10 rounded-2xl">
                                <ChefHat className="text-[#ffc600]" size={32} />
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-white">Kitchen Monitor</h1>
                        </div>
                        <div className="flex items-center gap-3 mt-4 leading-none">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4 py-1 border border-white/5 rounded-full leading-none">Production Queue</span>
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5 leading-none">
                                <Activity size={12} className="text-[#ffc600] animate-pulse" />
                                <span className="text-[10px] font-black text-[#ffc600] uppercase tracking-widest leading-none">{orders.length} ACTIVE</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right duration-500 leading-none">
                    <div className="text-right hidden md:block leading-none">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Live Feed Status</p>
                        <div className="flex items-center gap-2 justify-end leading-none">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            <p className="text-sm font-black text-green-500 uppercase tracking-tighter leading-none">System Synchronized</p>
                        </div>
                    </div>
                    <button onClick={fetchOrders} className="p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 hover:rotate-180 transition-all duration-1000 shadow-2xl group">
                        <RotateCcw size={20} className="text-[#ffc600] group-hover:scale-110" />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 opacity-20"><div className="w-16 h-16 border-[6px] border-white/10 border-t-[#ffc600] rounded-full animate-spin mb-6"></div><p className="font-black uppercase tracking-[0.4em] text-[10px]">Accessing Stream...</p></div>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {orders.map((order) => (
                        <div key={order._id} className="bg-white/[0.03] border border-white/5 rounded-[3.5rem] p-10 flex flex-col h-full hover:bg-white/[0.05] hover:border-white/10 transition-all relative overflow-hidden group shadow-2xl backdrop-blur-3xl animate-in zoom-in duration-500 text-left">
                            <div className="flex justify-between items-start mb-10 text-left">
                                <div className="space-y-4 text-left">
                                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-colors ${getStatusStyle(order.status)}`}>{order.status}</span>
                                    <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 w-fit px-3 py-1.5 rounded-xl border border-white/5 text-left leading-none"><Clock size={12} className="text-[#ffc600]"/><span>{calculateWait(order.createdAt)}</span></div>
                                </div>
                                <div className="text-right leading-none">
                                    <p className="text-[11px] font-black text-[#ffc600] uppercase tracking-[0.3em] mb-1 opacity-70 leading-none">Token ID</p>
                                    <h2 className="text-7xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">{order.tokenID}</h2>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4 mb-12 text-left">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1 text-left">Order Details</p>
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-[1.5rem] border border-white/[0.03] hover:border-white/10 transition-colors text-left">
                                        <div className="flex items-center gap-5 text-left leading-none"><span className="w-10 h-10 bg-[#ffc600] text-[#0b3d91] rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-yellow-600/10 leading-none">{item.quantity}</span><span className="font-bold text-xl text-gray-100 tracking-tight text-left leading-none">{item.name}</span></div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto">
                                {order.status === 'Paid' && (<button onClick={() => updateStatus(order._id, 'Preparing')} className="w-full bg-blue-600 text-white font-black py-6 rounded-[2rem] hover:bg-blue-500 transition-all flex items-center justify-center gap-4 uppercase text-sm tracking-[0.2em] shadow-xl shadow-blue-900/40 active:scale-95 group"><Flame size={20} className="group-hover:animate-bounce" /> Start Cooking</button>)}
                                {order.status === 'Preparing' && (<button onClick={() => updateStatus(order._id, 'Ready')} className="w-full bg-[#d71920] text-white font-black py-6 rounded-[2rem] hover:bg-red-600 transition-all flex items-center justify-center gap-4 uppercase text-sm tracking-[0.2em] shadow-xl shadow-red-900/40 active:scale-95 group"><CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" /> Mark as Ready</button>)}
                                {order.status === 'Ready' && (<div className="w-full py-6 text-center bg-green-500/10 border border-green-500/20 rounded-[2rem] text-green-400 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3"><BellRing size={16} className="animate-bounce" /> Student Notified</div>)}
                            </div>
                        </div>
                    ))}
                    {orders.length === 0 && (<div className="col-span-full py-40 text-center opacity-10 animate-pulse text-white leading-none"><ShoppingBag size={140} className="mx-auto mb-8 text-white" /><h3 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">Queue Clear</h3><p className="text-sm font-bold uppercase tracking-[0.5em] mt-4 text-white leading-none">Waiting for orders...</p></div>)}
                </div>
            )}
        </div>
    );
};

export default KitchenMonitor;