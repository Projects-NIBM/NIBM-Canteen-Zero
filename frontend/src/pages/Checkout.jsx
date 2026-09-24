import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import API from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, ShieldCheck, QrCode, Utensils, ShoppingBag, Armchair, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { io } from 'socket.io-client';

const Checkout = () => {
    const { cart, clearCart } = useCartStore();
    const [order, setOrder] = useState(null);
    const [orderType, setOrderType] = useState(null);
    const [seatsAvailable, setSeatsAvailable] = useState(40);
    const [isProcessing, setIsProcessing] = useState(false);
    const receiptRef = useRef(null);
    const navigate = useNavigate();

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const fetchOccupancy = useCallback(async () => {
        try {
            const res = await API.get('/api/orders/occupancy');
            setSeatsAvailable(res.data.available);
        } catch (err) {}
    }, []);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://www.payhere.lk/lib/payhere.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL, { withCredentials: true });
        fetchOccupancy();

        socket.on('occupancyUpdate', (data) => {
            setSeatsAvailable(data.available);
            if (data.available === 0 && orderType === 'Dine-In') {
                setOrderType(null);
                toast.error("Seating capacity reached. Please select Takeaway.");
            }
        });

        socket.on('orderUpdate', (updatedOrder) => {
            if (order && updatedOrder.orderId === order._id && updatedOrder.status === 'Paid') {
                setOrder((prev) => ({ ...prev, status: 'Paid', tokenID: updatedOrder.tokenID }));
                clearCart();
                setIsProcessing(false);
                toast.success("Bank payment confirmed!");
            }
        });

        if (cart.length === 0 && !order) navigate('/menu');
        return () => { socket.disconnect(); };
    }, [cart, navigate, order, fetchOccupancy, orderType, clearCart]);

    const downloadReceipt = async () => {
        if (receiptRef.current) {
            const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#f8fafc', scale: 3 });
            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png");
            link.download = `NIBM-TOKEN-${order.tokenID}.png`;
            link.click();
            toast.success("Receipt saved.");
        }
    };

    const handleCheckout = async () => {
        if (!orderType) return toast.error("Please select Dine-In or Takeaway.");
        setIsProcessing(true);
        const loadingToast = toast.loading("Connecting to Central Bank / LANKAQR Gateway...");

        try {
            const orderRes = await API.post('/api/orders/create', {
                items: cart,
                totalAmount: total,
                orderType
            });
            const createdOrder = orderRes.data;
            setOrder(createdOrder);

            const payloadRes = await API.post(`/api/orders/${createdOrder._id}/payment-payload`);
            const paymentPayload = payloadRes.data;

            toast.dismiss(loadingToast);

            if (window.payhere) {
                window.payhere.onCompleted = function onCompleted() {
                    toast.success("Payment completed! Awaiting bank confirmation...");
                };

                window.payhere.onDismissed = function onDismissed() {
                    setIsProcessing(false);
                    toast("Payment dismissed.");
                };

                window.payhere.onError = function onError(error) {
                    setIsProcessing(false);
                    toast.error(`Bank Error: ${error}`);
                };

                window.payhere.startPayment(paymentPayload);
            } else {
                toast.error("Payment SDK loading failed.");
                setIsProcessing(false);
            }
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || "Order initialization error.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-screen w-full bg-[#f8fafc] flex items-center justify-center p-10 relative overflow-hidden font-sans text-slate-900 text-left">
            <div ref={receiptRef} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-premium border border-white p-8 z-20 max-h-[92vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate('/menu')} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </button>
                    <div className="text-right leading-none">
                        <h2 className="text-lg font-black text-[#0b3d91] tracking-tighter uppercase">Canteen-Zero</h2>
                        <p className="text-[9px] font-bold text-[#d71920] tracking-widest uppercase mt-1">
                            {order ? `ID: #${order._id.slice(-6).toUpperCase()}` : "LANKAQR Gateway"}
                        </p>
                    </div>
                </div>

                {order && order.status === 'Paid' ? (
                    <div className="text-center py-2 animate-in zoom-in duration-500">
                        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none">Bank Confirmed</h3>
                        <p className="text-gray-400 text-[10px] font-bold mt-2 mb-6 uppercase tracking-widest">Settlement Complete</p>
                        <div className="bg-[#0b3d91] p-8 rounded-[3rem] text-white shadow-2xl border-4 border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#ffc600] mb-3 text-center">Pickup Token</p>
                            <span className="text-7xl font-black tracking-tighter block text-center">{order.tokenID}</span>
                        </div>
                        <div className="flex flex-col gap-3 mt-10">
                            <button onClick={downloadReceipt} className="w-full bg-slate-100 text-[#0b3d91] font-black py-4 rounded-2xl flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all border border-slate-200">
                                <Download size={16} /> Save Token
                            </button>
                            <button onClick={() => navigate('/menu')} className="text-[#0b3d91] font-black text-[10px] uppercase tracking-widest hover:text-[#d71920] transition-colors mt-2 text-center">
                                Back to Menu
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-slate-50 rounded-[2rem] p-6 mb-6 border border-gray-100 flex flex-col items-center">
                            <div className="p-3 bg-white rounded-3xl shadow-sm mb-4 border border-gray-50">
                                <QrCode size={96} className="text-[#0b3d91]" />
                            </div>
                            <div className="flex items-center gap-2 text-[#0b3d91] font-black text-[11px] uppercase tracking-wider mb-1">
                                LANKAQR Direct Payment
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center mt-1">
                                EMVCo Standard Compliant
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button 
                                disabled={seatsAvailable === 0}
                                onClick={() => setOrderType('Dine-In')} 
                                className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${orderType === 'Dine-In' ? 'bg-[#0b3d91] border-[#0b3d91] text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400'} ${seatsAvailable === 0 ? 'opacity-40 cursor-not-allowed bg-gray-50' : ''}`}
                            >
                                <Utensils size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Dine-In</span>
                                <div className="flex items-center gap-1 mt-1">
                                    <Armchair size={10} className={seatsAvailable === 0 ? 'text-red-500' : 'text-green-500'} />
                                    <span className={`text-[8px] font-bold uppercase ${seatsAvailable === 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {seatsAvailable === 0 ? 'Full' : `${seatsAvailable} Left`}
                                    </span>
                                </div>
                            </button>
                            <button onClick={() => setOrderType('Takeaway')} className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${orderType === 'Takeaway' ? 'bg-[#0b3d91] border-[#0b3d91] text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400'}`}>
                                <ShoppingBag size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Takeaway</span>
                                <span className="text-[8px] font-bold text-blue-400 uppercase mt-1">Unlimited</span>
                            </button>
                        </div>

                        <div className="space-y-4 mb-8 text-left px-2">
                            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</span>
                                <span className="text-5xl font-black text-[#0b3d91] italic leading-none font-mono">Rs.{total}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-green-600 font-bold uppercase tracking-widest bg-green-50/50 p-2 rounded-lg">
                                <ShieldCheck size={14} /> Bank Gateway Encryption (HMAC-SHA256)
                            </div>
                        </div>

                        <button onClick={handleCheckout} disabled={isProcessing} className="w-full bg-[#d71920] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 disabled:bg-gray-200">
                            {isProcessing ? "Connecting to Bank..." : "Proceed to Bank Payment"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Checkout;