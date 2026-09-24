import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import { useCartStore } from '../store/useCartStore';
import { useStore } from '../store/useStore';
import { X, LogOut, Settings, ChevronLeft, ChevronRight, ListFilter, ArrowDownUp, BellRing, ChefHat, LayoutDashboard, Search, Armchair, Timer, CheckCircle2, Flame, ShoppingBag, BarChart3, User, History, PlusSquare, LogOut as LeaveIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const Menu = () => {
    const [products, setProducts] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [tokenIndex, setTokenIndex] = useState(0);
    const [showTokenWidget, setShowTokenWidget] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortBy, setSortBy] = useState('Default');
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [occupancy, setOccupancy] = useState({ available: 40, total: 40 });
    const [timeLeft, setTimeLeft] = useState(null);
    
    const navigate = useNavigate();
    const profileRef = useRef(null);
    const alertAudio = useRef(new Audio(`${process.env.PUBLIC_URL}/notification.mp3`));

    const toggleCart = useCartStore((state) => state.toggleCart);
    const cartCount = useCartStore((state) => state.cart.reduce((total, item) => total + item.quantity, 0));
    const pendingOrderCount = useStore((state) => state.pendingOrderCount);
    const setPendingOrderCount = useStore((state) => state.setPendingOrderCount);

    const categories = ['All', 'Snacks', 'Main Meals', 'Beverages', 'Desserts'];

    const handleLogout = () => {
        localStorage.clear();
        toast.success("Session terminated");
        navigate('/login');
    };

    const handleNextToken = () => {
        setTokenIndex((prev) => (prev + 1) % activeOrders.length);
    };

    const handlePrevToken = () => {
        setTokenIndex((prev) => (prev - 1 + activeOrders.length) % activeOrders.length);
    };

    const getStatusStep = (status) => {
        switch (status) {
            case 'Paid': return 1;
            case 'Preparing': return 2;
            case 'Ready': return 3;
            case 'Collected': return 4;
            default: return 0;
        }
    };

    const handleExtend = async (orderId) => {
        try {
            await API.patch(`/api/orders/${orderId}/extend-seat`);
            toast.success("Added 5 minutes to your session", { icon: '⏳' });
            fetchActiveOrders();
        } catch (err) {
            toast.error("Extension limit reached");
        }
    };

    const handleManualRelease = async (orderId) => {
        setIsScanning(true);
        toast.loading("Verifying Table QR...", { duration: 1500 });
        
        setTimeout(async () => {
            try {
                await API.patch(`/api/orders/${orderId}/release-manual`);
                toast.dismiss();
                toast.success("Seat released. Thank you for your cooperation!", { icon: '🌱' });
                setIsScanning(false);
                fetchActiveOrders();
            } catch (err) {
                toast.error("Handshake Error");
                setIsScanning(false);
            }
        }, 1500);
    };

    const fetchProducts = useCallback(async () => {
        try {
            const res = await API.get('/api/products');
            setProducts(res.data);
        } catch (err) { console.error("API Error"); }
        finally { setLoading(false); }
    }, []);

    const fetchActiveOrders = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                const res = await API.get(`/api/orders/user/${decoded.id}`);
                setActiveOrders(res.data);
                if (res.data.length === 0) setShowTokenWidget(false);
            } catch (err) { console.error("Recovery failed"); }
        }
    }, []);

    const fetchInitialData = useCallback(async () => {
        try {
            const [countRes, occRes] = await Promise.all([
                API.get('/api/orders/active-count'),
                API.get('/api/orders/occupancy')
            ]);
            setPendingOrderCount(countRes.data.count);
            setOccupancy(occRes.data);
        } catch (err) { console.error("Init Error"); }
    }, [setPendingOrderCount]);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL);
        const token = localStorage.getItem('token');
        const userId = token ? JSON.parse(atob(token.split('.')[1])).id : null;
        socket.on('inventoryUpdate', () => { fetchProducts(); });
        socket.on('orderCountUpdate', (count) => { setPendingOrderCount(count); });
        socket.on('occupancyUpdate', (data) => { setOccupancy(data); });
        socket.on('orderUpdate', (data) => {
            if (data.userId === userId) {
                fetchActiveOrders();
                if (data.status === 'Ready') {
                    alertAudio.current.play().catch(e => {});
                    toast.success(`Token #${data.tokenID} is Ready!`, { duration: 6000 });
                    setShowTokenWidget(true);
                }
                if (data.status === 'Expired') { fetchActiveOrders(); }
            }
        });
        return () => socket.disconnect();
    }, [fetchProducts, fetchActiveOrders, setPendingOrderCount]);

    useEffect(() => {
        if (activeOrders[tokenIndex]?.status === 'Collected') {
            const interval = setInterval(() => {
                const collectedAt = new Date(activeOrders[tokenIndex].collectedAt);
                const hasMeal = activeOrders[tokenIndex].items.some(i => i.category === 'Main Meals');
                const baseDuration = hasMeal ? 25 : 12;
                const totalDuration = activeOrders[tokenIndex].isExtended ? baseDuration + 5 : baseDuration;
                const expiryTime = new Date(collectedAt.getTime() + totalDuration * 60000);
                const diff = Math.max(0, Math.floor((expiryTime - new Date()) / 1000));
                setTimeLeft(diff);
                if (diff === 0) clearInterval(interval);
            }, 1000);
            return () => clearInterval(interval);
        } else { setTimeLeft(null); }
    }, [activeOrders, tokenIndex]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        fetchProducts(); fetchActiveOrders(); fetchInitialData();
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [fetchProducts, fetchActiveOrders, fetchInitialData]);

    const filteredItems = products.filter(p => {
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (sortBy === 'Price: Low to High') filteredItems.sort((a, b) => a.price - b.price);
    if (sortBy === 'Price: High to Low') filteredItems.sort((a, b) => b.price - a.price);
    if (sortBy === 'Fastest Prep') filteredItems.sort((a, b) => a.prepTime - b.prepTime);

    const userName = localStorage.getItem('userName') || 'Scholar';
    const userRole = localStorage.getItem('userRole');
    const firstName = userName.split(' ')[0];

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Paid': return 'Awaiting Cook';
            case 'Preparing': return 'In Preparation';
            case 'Ready': return 'Ready for Pickup';
            case 'Collected': return 'Dining Active';
            default: return 'Processing';
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans overflow-x-hidden pb-24 text-slate-900 leading-none">
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            <CartDrawer />
            <nav className="bg-white sticky top-0 z-50 border-b border-gray-100 px-8 py-5 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex flex-col text-left"><span className="font-black text-[#0b3d91] tracking-tighter text-2xl uppercase leading-none">Canteen-Zero</span><span className="text-[9px] font-bold text-[#d71920] tracking-[0.3em] uppercase mt-1 ml-0.5">Academic Portal</span></div>
                    <div className="flex items-center gap-4">
                        {userRole === 'admin' && (
                            <div className="hidden lg:flex gap-4">
                                <Link to="/admin/dashboard" className="flex items-center gap-2 bg-slate-800 text-white text-[10px] font-black px-5 py-2.5 rounded-full hover:bg-slate-900 transition-all uppercase tracking-widest no-underline"><LayoutDashboard size={14} /> Dashboard</Link>
                                <Link to="/admin/kitchen" className="relative flex items-center gap-2 bg-[#d71920] text-white text-[10px] font-black px-5 py-2.5 rounded-full hover:bg-red-700 transition-all uppercase tracking-widest shadow-lg shadow-red-200 group no-underline"><ChefHat size={14} /> Kitchen {pendingOrderCount > 0 && <span className="absolute -top-2 -right-2 bg-white text-[#d71920] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-xl border-2 border-[#d71920] animate-bounce">{pendingOrderCount}</span>}</Link>
                            </div>
                        )}
                        {userRole !== 'admin' && (
                            <button onClick={toggleCart} className="relative group p-2 bg-gray-50 rounded-full transition-all active:scale-90 text-[#0b3d91]"><span className="absolute -top-1 -right-1 w-5 h-5 bg-[#d71920] text-[10px] text-white font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">{cartCount}</span><span className="text-xl block">🛒</span></button>
                        )}
                        <div className="relative" ref={profileRef}>
                            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className={`h-10 w-10 bg-[#ffc600] rounded-full border-2 shadow-md flex items-center justify-center text-[#0b3d91] font-black text-sm cursor-pointer active:scale-95 ${isProfileOpen ? 'border-[#0b3d91]' : 'border-white'}`}>{userName.charAt(0).toUpperCase()}</div>
                            {isProfileOpen && (
                                <div className="absolute right-0 top-14 w-60 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-3 z-[60] animate-in fade-in slide-in-from-top-4 duration-200 text-left">
                                    <div className="px-4 py-4 border-b border-gray-50 mb-2 text-center text-slate-900"><p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1 text-center">Signed in as</p><p className="text-sm font-bold text-[#0b3d91] truncate">{userName}</p></div>
                                    {userRole === 'admin' && <Link to="/admin/report" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-[11px] font-bold text-[#d71920] uppercase tracking-wider w-full no-underline"><BarChart3 size={14} className="text-[#d71920]" /> Business Reports</Link>}
                                    <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-[11px] font-bold text-slate-600 uppercase tracking-wider w-full no-underline"><User size={14} className="text-slate-400" /> My Profile</Link>
                                    <Link to="/history" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-[11px] font-bold text-slate-600 uppercase tracking-wider w-full no-underline"><History size={14} className="text-slate-400" /> Purchase History</Link>
                                    <div className="flex items-center gap-3 p-3 opacity-30 text-slate-400 cursor-not-allowed border-t border-gray-50 mt-1"><Settings size={14} /> <span className="text-[11px] font-bold uppercase tracking-wider">Advanced Settings</span></div>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-all text-[11px] font-bold text-[#d71920] uppercase tracking-wider text-left leading-none"><LogOut size={14}/> Logout Session</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <header className="bg-[#0b3d91] text-white pt-16 pb-28 px-8 relative">
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12 animate-slide-in-left">
                    <div className="w-full lg:w-1/2 text-center lg:text-left text-white leading-none">
                        <div className="flex items-center justify-center lg:justify-start gap-4 mb-6 leading-none text-white">
                            <p className="text-[#ffc600] font-black tracking-[0.4em] text-[10px] uppercase opacity-90 underline underline-offset-8 decoration-[#d71920]/50 leading-none">Official Academic Access</p>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all duration-700 ${occupancy.available > 10 ? 'text-green-400 border-green-400/20 bg-green-400/10' : 'text-red-400 border-red-400/20 bg-red-400/10'}`}><Armchair size={12} className="animate-pulse" />{occupancy.available} Seats Available</div>
                        </div>
                        <h1 className="text-6xl font-black tracking-tight mb-4 leading-tight text-white">{userRole === 'admin' ? "System Overview." : `Hello, ${firstName}.`}</h1>
                        <p className="text-blue-100 text-lg font-medium opacity-70 italic mx-auto lg:mx-0 font-serif tracking-wide leading-none">"The Place To Be" — Secure your meal instantly with our Zero-Queue digital ordering system.</p>
                    </div>
                    {activeOrders.length > 0 && showTokenWidget && (
                        <div className={`relative w-full max-w-xl p-10 rounded-[3rem] border flex flex-col shadow-2xl transition-all duration-500 ml-auto group ${activeOrders[tokenIndex].status === 'Ready' ? 'bg-green-600 border-green-400 scale-105 shadow-green-900/20' : activeOrders[tokenIndex].status === 'Collected' ? 'bg-amber-500 border-amber-400' : 'bg-white/10 backdrop-blur-md border-white/20'}`}>
                            <button onClick={() => setShowTokenWidget(false)} className="absolute top-6 right-8 text-white/40 hover:text-white transition-all hover:rotate-90 p-2 z-30"><X size={20} strokeWidth={3} /></button>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex flex-col text-left">
                                    <div className="flex items-center gap-2 mb-2 leading-none"><BellRing size={14} className={activeOrders[tokenIndex].status === 'Ready' ? 'animate-bounce text-white' : 'text-[#ffc600]'} /><p className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${activeOrders[tokenIndex].status === 'Ready' ? 'text-white' : 'text-[#ffc600]'}`}>{getStatusLabel(activeOrders[tokenIndex].status)}</p></div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-tight leading-tight">{activeOrders[tokenIndex].status === 'Collected' ? 'Dining Session Active' : activeOrders[tokenIndex].status === 'Ready' ? 'Pick up at Counter A' : 'Hand this to counter'}</h4>
                                </div>
                                <div className={`text-5xl font-black px-10 py-6 rounded-[2.5rem] shadow-2xl text-center relative z-20 transition-all ${activeOrders[tokenIndex].status === 'Ready' ? 'bg-white text-green-600 animate-pulse' : 'bg-[#ffc600] text-[#0b3d91]'}`}>{activeOrders[tokenIndex].tokenID}</div>
                            </div>
                            
                            <div className="relative pt-4 px-2">
                                {activeOrders[tokenIndex].status === 'Collected' ? (
                                    <div className="bg-black/20 p-5 rounded-[1.5rem] border border-white/5 animate-in fade-in duration-500">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-widest leading-none"><Timer size={12}/> Seat Expiry</span>
                                            <span className="text-[10px] font-black text-white font-mono leading-none">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-5">
                                            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(timeLeft / (activeOrders[tokenIndex].isExtended ? 30 * 60 : 25 * 60)) * 100}%` }}></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {!activeOrders[tokenIndex].isExtended && (
                                                <button onClick={() => handleExtend(activeOrders[tokenIndex]._id)} className="bg-[#ffc600] text-[#0b3d91] font-black py-3 rounded-xl text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"><PlusSquare size={12}/> +5 Min</button>
                                            )}
                                            <button 
                                                onClick={() => handleManualRelease(activeOrders[tokenIndex]._id)}
                                                disabled={isScanning}
                                                className={`bg-white font-black py-3 rounded-xl text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-[#0b3d91] ${isScanning ? 'opacity-50' : 'opacity-100'} ${activeOrders[tokenIndex].isExtended ? 'col-span-2' : ''}`}
                                            >
                                                <LeaveIcon size={12}/> {isScanning ? "Scanning..." : "I am Leaving"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between mb-3 text-white">
                                            <div className={`flex flex-col items-center gap-1 transition-opacity ${getStatusStep(activeOrders[tokenIndex].status) >= 1 ? 'opacity-100' : 'opacity-30'}`}><CheckCircle2 size={16}/><span className="text-[8px] font-black uppercase tracking-widest">Paid</span></div>
                                            <div className={`flex flex-col items-center gap-1 transition-opacity ${getStatusStep(activeOrders[tokenIndex].status) >= 2 ? 'opacity-100' : 'opacity-30'}`}><Flame size={16}/><span className="text-[8px] font-black uppercase tracking-widest">Cooking</span></div>
                                            <div className={`flex flex-col items-center gap-1 transition-opacity ${getStatusStep(activeOrders[tokenIndex].status) >= 3 ? 'opacity-100' : 'opacity-30'}`}><ShoppingBag size={16}/><span className="text-[8px] font-black uppercase tracking-widest">Ready</span></div>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-[#ffc600] to-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,198,0,0.5)]" style={{ width: `${(getStatusStep(activeOrders[tokenIndex].status) / 3) * 100}%` }}></div>
                                        </div>
                                    </>
                                )}
                            </div>
                            {activeOrders.length > 1 && (
                                <div className="flex items-center justify-center gap-6 mt-8 text-white/40">
                                    <button onClick={handlePrevToken} className="hover:text-[#ffc600] transition-colors"><ChevronLeft size={24}/></button>
                                    <span className="text-[10px] font-black tracking-[0.4em] uppercase">{tokenIndex + 1} / {activeOrders.length}</span>
                                    <button onClick={handleNextToken} className="hover:text-[#ffc600] transition-colors"><ChevronRight size={24}/></button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none overflow-hidden text-white leading-none"><svg viewBox="0 0 100 100" className="w-full h-full scale-150 fill-white"><circle cx="50" cy="50" r="50"/></svg></div>
            </header>

            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-20">
                <div className="flex flex-col lg:flex-row gap-4 text-slate-900 leading-none">
                    <div className="flex-1 flex items-center justify-between bg-white p-2 rounded-[2.5rem] shadow-premium border border-gray-100 overflow-hidden leading-none text-left">
                        <div className="p-2.5 bg-slate-50 rounded-2xl text-slate-400 ml-1 leading-none"><ListFilter size={20} /></div>
                        <div className="flex flex-1 justify-around items-center px-2 leading-none">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-3 rounded-[1.25rem] text-[10px] font-black tracking-[0.1em] uppercase transition-all duration-300 whitespace-nowrap ${activeCategory === cat ? 'bg-[#0b3d91] text-white shadow-lg -translate-y-0.5' : 'bg-transparent text-gray-400 hover:text-[#0b3d91]'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                    <div className="lg:w-[350px] flex items-center gap-4 bg-white border border-gray-100 p-2 rounded-[2.5rem] shadow-premium px-8 group focus-within:ring-4 focus-within:ring-[#0b3d91]/5 transition-all text-left text-slate-900 leading-none">
                        <Search size={20} className="text-gray-300 group-focus-within:text-[#0b3d91] transition-colors leading-none" />
                        <input type="text" placeholder="Quick find..." className="bg-transparent text-[11px] font-bold text-slate-600 w-full outline-none placeholder:text-gray-300 tracking-widest uppercase leading-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="bg-white p-2 rounded-[2.5rem] shadow-premium border border-gray-100 flex items-center gap-3 px-8 text-slate-900 leading-none">
                        <ArrowDownUp size={18} className="text-[#0b3d91] leading-none" />
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-[10px] font-black text-[#0b3d91] uppercase tracking-[0.15em] outline-none cursor-pointer leading-none">
                            <option value="Default">Sort Selection</option>
                            <option value="Price: Low to High">Price: Low to High</option>
                            <option value="Price: High to Low">Price: High to Low</option>
                            <option value="Fastest Prep">Fastest Prep</option>
                        </select>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-8 mt-16 text-left">
                <div className="flex items-center gap-6 mb-12 text-slate-900 leading-none text-left">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Academic Selection</h2>
                    <div className="flex-1 h-[2px] bg-gradient-to-r from-gray-200 to-transparent mt-2"></div>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-900 leading-none"><div className="w-14 h-14 border-4 border-[#0b3d91] border-t-[#ffc600] rounded-full animate-spin mb-4"></div><p className="text-gray-400 font-bold text-[10px] tracking-widest uppercase text-center animate-pulse leading-none">Syncing inventory...</p></div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {filteredItems.map((product, index) => (<ProductCard key={product._id} product={product} index={index} />))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 opacity-20 text-slate-900 leading-none">
                        <Search size={80} strokeWidth={1} />
                        <p className="font-black uppercase tracking-[0.4em] text-xs mt-6 text-center leading-none">No matches found</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Menu;