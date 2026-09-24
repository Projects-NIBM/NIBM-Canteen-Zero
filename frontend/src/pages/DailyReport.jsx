import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ArrowLeft, FileDown, TrendingUp, ShoppingBag, Clock, Trophy, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const DailyReport = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchStats = useCallback(async () => {
        try {
            const res = await API.get('/api/orders/admin/daily-report');
            setStats(res.data);
        } catch (err) {
            toast.error("Analytics sync failed");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL);
        socket.on('revenueUpdate', () => {
            fetchStats();
            toast("Ledger Updated", { 
                icon: '📈',
                style: { background: '#0b3d91', color: '#fff', fontSize: '10px' }
            });
        });
        fetchStats();
        return () => socket.disconnect();
    }, [fetchStats]);

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(11, 61, 145);
        doc.text("NIBM CANTEEN-ZERO", 14, 20);
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text("Daily Performance Analytics", 14, 30);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
        
        autoTable(doc, {
            startY: 45,
            head: [['Operational Metric', 'Result']],
            body: [
                ['Report Date', stats.date],
                ['Total Gross Revenue', `Rs. ${stats.revenue}`],
                ['Total Order Volume', `${stats.orderCount} Orders`],
                ['Average Fulfillment Speed', `${stats.avgPrepTime} Minutes`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [11, 61, 145] }
        });

        doc.text("SCHOLAR'S CHOICE - TOP SELLING ITEMS", 14, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Rank', 'Product Name', 'Total Units Sold']],
            body: stats.topItems.map((i, index) => [`#${index + 1}`, i.name, i.count]),
            theme: 'grid',
            headStyles: { fillColor: [215, 25, 32] }
        });

        doc.save(`NIBM-Daily-Report-${stats.date}.pdf`);
        toast.success("Executive Summary Exported");
    };

    if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]"><div className="w-14 h-14 border-4 border-[#0b3d91] border-t-[#ffc600] rounded-full animate-spin mb-4"></div><p className="font-black text-[#0b3d91] uppercase tracking-[0.5em] text-[10px]">Processing Business Intelligence...</p></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-8 font-sans text-slate-900 overflow-x-hidden">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top duration-700">
                <div className="flex items-center gap-6 text-left">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-4 bg-white rounded-[1.5rem] shadow-sm border border-gray-100 hover:bg-gray-50 hover:scale-110 transition-all">
                        <ArrowLeft size={24} className="text-[#0b3d91]" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-[#0b3d91]">Business Intelligence</h1>
                        <div className="flex items-center gap-2 mt-3 text-[#d71920]">
                            <Calendar size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{stats.date} Cycle</span>
                        </div>
                    </div>
                </div>
                <button onClick={generatePDF} className="bg-[#0b3d91] text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all active:scale-95">
                    <FileDown size={20} /> Export Executive Summary
                </button>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-white relative overflow-hidden group">
                    <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-green-500 opacity-5 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Daily Revenue</p>
                    <h3 className="text-5xl font-black text-[#0b3d91] italic leading-none font-mono tracking-tighter text-left animate-in fade-in slide-in-from-bottom-2">Rs.{stats.revenue}</h3>
                    <div className="mt-6 flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                        Live Ledger
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-white relative overflow-hidden group text-left">
                    <ShoppingBag className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500 opacity-5 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Volume</p>
                    <h3 className="text-5xl font-black text-slate-800 leading-none animate-in fade-in slide-in-from-bottom-2">{stats.orderCount}</h3>
                    <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Transactions</p>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-white relative overflow-hidden group text-left">
                    <Clock className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500 opacity-5 group-hover:scale-110 transition-transform" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Efficiency Rate</p>
                    <h3 className="text-5xl font-black text-slate-800 leading-none animate-in fade-in slide-in-from-bottom-2">{stats.avgPrepTime}<span className="text-xl ml-1 uppercase">m</span></h3>
                    <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Preparation Time</p>
                </div>

                <div className="md:col-span-3 bg-white p-12 rounded-[4rem] shadow-premium border border-white text-left">
                    <div className="flex items-center gap-4 mb-12">
                        <Trophy className="text-[#ffc600]" size={32} />
                        <h2 className="text-3xl font-black text-[#0b3d91] tracking-tighter uppercase leading-none">Scholar's Choice</h2>
                        <div className="flex-1 h-[2px] bg-gradient-to-r from-gray-200 to-transparent ml-6"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {stats.topItems.map((item, index) => (
                            <div key={index} className="flex flex-col items-center text-center p-10 bg-slate-50/50 rounded-[3rem] border border-gray-100 relative group hover:bg-white hover:shadow-xl transition-all">
                                <span className="absolute -top-4 bg-[#0b3d91] text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg">#{index + 1}</span>
                                <h4 className="text-xl font-bold text-slate-800 mt-2 mb-2 tracking-tight uppercase">{item.name}</h4>
                                <div className="h-1 w-8 bg-[#d71920] mb-4 rounded-full"></div>
                                <p className="text-[11px] font-black text-[#d71920] uppercase tracking-[0.3em]">{item.count} Units Sold</p>
                            </div>
                        ))}
                        {stats.topItems.length === 0 && <p className="col-span-full py-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] text-center">No sales data recorded for today</p>}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DailyReport;