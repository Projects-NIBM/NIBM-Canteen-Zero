import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ArrowLeft, History, Calendar, CreditCard, ChevronRight, Hash, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const decoded = JSON.parse(atob(token.split('.')[1]));
                const res = await API.get(`/api/orders/user-history/${decoded.id}`);
                setHistory(res.data);
            } catch (err) {
                toast.error("Failed to load purchase history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]"><div className="w-12 h-12 border-4 border-[#0b3d91] border-t-[#ffc600] rounded-full animate-spin mb-4"></div><p className="font-black text-[#0b3d91] uppercase tracking-[0.5em] text-[10px]">Retrieving Ledger...</p></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-8 font-sans text-slate-900 overflow-x-hidden">
            <header className="max-w-4xl mx-auto flex items-center gap-6 mb-12 animate-in fade-in slide-in-from-top duration-700">
                <button onClick={() => navigate('/menu')} className="p-4 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 hover:bg-gray-50 hover:scale-110 transition-all">
                    <ArrowLeft size={24} className="text-[#0b3d91]" />
                </button>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-[#0b3d91]">Purchase History</h1>
                    <div className="flex items-center gap-2 mt-3 text-[#d71920]">
                        <History size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Official Student Record</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto space-y-6">
                {history.length > 0 ? history.map((order, index) => (
                    <div key={order._id} className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-white hover:border-[#0b3d91]/20 transition-all group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1 space-y-4 text-left">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
                                        <Calendar size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {new Date(order.createdAt).toLocaleDateString('en-GB')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[#0b3d91] font-bold text-xs uppercase tracking-tighter">
                                        <CreditCard size={14} /> 
                                        {order.orderType}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between group-hover:pr-2 transition-all">
                                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1">
                                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </h3>
                                    <ChevronRight size={18} className="text-slate-200 group-hover:text-[#0b3d91] transition-colors" />
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">
                                    <Hash size={10} />
                                    <span>Reference: {order._id.toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">Paid Amount</p>
                                    <p className="text-2xl font-black text-[#0b3d91] italic leading-none">Rs.{order.totalAmount}</p>
                                </div>
                                <div className="bg-[#ffc600] p-4 rounded-2xl flex flex-col items-center justify-center min-w-[90px] shadow-lg shadow-yellow-100 ring-4 ring-yellow-50">
                                    <span className="text-[8px] font-black text-[#0b3d91] uppercase tracking-widest mb-1 leading-none">Token</span>
                                    <span className="text-2xl font-black text-[#0b3d91] leading-none">{order.tokenID}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="py-32 text-center opacity-20">
                        <ShoppingBag size={100} className="mx-auto mb-6" strokeWidth={1} />
                        <p className="font-black uppercase tracking-[0.4em] text-xs">No transaction records found</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OrderHistory;