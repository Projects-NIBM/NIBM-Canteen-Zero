import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
    PackagePlus, Clock, BadgeDollarSign, Flame, Utensils, 
    ArrowLeft, Upload, CheckCircle2, Eye, ClipboardCheck, 
    Power, Search, CalendarDays, RotateCcw, Edit3, Trash2, X, ShoppingBag, ChefHat, Armchair, BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { io } from 'socket.io-client';
import { useStore } from '../store/useStore';

const AdminDashboard = () => {
    const [inventory, setInventory] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [searchTerm, setSearchBar] = useState('');
    const [occupancy, setOccupancy] = useState({ available: 40, total: 40 });
    const fileInputRef = useRef(null);
    const alertAudio = useRef(new Audio(`${process.env.PUBLIC_URL}/notification.mp3`));
    
    const pendingOrderCount = useStore((state) => state.pendingOrderCount);
    const setPendingOrderCount = useStore((state) => state.setPendingOrderCount);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ 
        name: '', description: '', price: '', category: 'Snacks', 
        prepTime: '', spiceLevel: 0, isVeg: false 
    });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSpiceClick = (level) => {
        setFormData(prev => ({ ...prev, spiceLevel: prev.spiceLevel === level ? 0 : level }));
    };

    const fetchInventory = useCallback(async () => {
        try {
            const res = await API.get('/api/products/admin-list');
            setInventory(res.data);
        } catch (err) { 
            toast.error("Database sync failed"); 
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await API.get('/api/orders/admin/active');
            setPendingOrders(res.data);
        } catch (err) {
            console.error("Order sync failed");
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
        } catch (err) {
            console.error("Initialization error");
        }
    }, [setPendingOrderCount]);

    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL);
        
        socket.on('newOrderAlert', (data) => {
            alertAudio.current.play().catch(e => {});
            fetchOrders();
            toast.success(`NEW ORDER: #${data.tokenID}`, {
                duration: 6000,
                position: 'top-right',
                style: { background: '#d71920', color: '#fff', fontWeight: '900' },
                icon: '🛒'
            });
        });

        socket.on('orderCountUpdate', (count) => {
            setPendingOrderCount(count);
        });

        socket.on('occupancyUpdate', (data) => {
            setOccupancy(data);
        });

        fetchInventory(); 
        fetchOrders();
        fetchInitialData();
        return () => socket.disconnect();
    }, [fetchInventory, fetchOrders, fetchInitialData, setPendingOrderCount]);

    const handleCollect = async (id) => {
        try {
            await API.patch(`/api/orders/${id}/collect`);
            toast.success("Order Handed Over");
            fetchOrders();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleEditClick = (item) => {
        setIsEditing(true);
        setEditId(item._id);
        setFormData({
            name: item.name, description: item.description, price: item.price,
            category: item.category, prepTime: item.prepTime, spiceLevel: item.spiceLevel, isVeg: item.isVeg
        });
        setPreviewUrl(item.image);
        setImageFile(null);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({ name: '', description: '', price: '', category: 'Snacks', prepTime: '', spiceLevel: 0, isVeg: false });
        setPreviewUrl(null);
        setImageFile(null);
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Delete ${name}?`)) {
            try {
                await API.delete(`/api/products/${id}`);
                fetchInventory();
                toast.success("Item Deleted");
            } catch (err) { toast.error("Fail"); }
        }
    };

    const handleToggle = async (id) => {
        try {
            await API.patch(`/api/products/${id}/toggle`);
            fetchInventory();
            toast.success("Availability updated");
        } catch (err) { toast.error("Toggle error"); }
    };

    const handleGlobalReset = async () => {
        if(window.confirm("Restore all items and clear seat occupancy?")) {
            await API.post('/api/products/daily-reset');
            fetchInventory();
            toast.success("Inventory & Seating Restored");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile && !isEditing) return toast.error("Media required");
        setLoading(true);
        const data = new FormData();
        if (imageFile) data.append('image', imageFile);
        data.append('data', JSON.stringify(formData));
        try {
            if (isEditing) await API.put(`/api/products/${editId}`, data);
            else await API.post('/api/products', data);
            fetchInventory();
            cancelEdit();
            toast.success("Database Synchronized");
        } catch (err) { toast.error("Server Error"); }
        finally { setLoading(false); }
    };

    return (
        <div className="h-screen w-full bg-[#f1f5f9] flex flex-col md:flex-row font-sans overflow-hidden text-left text-slate-900 leading-none">
            <div className="w-full md:w-[60%] flex flex-col bg-[#f8fafc]">
                <div className="bg-[#0b3d91] p-8 text-white flex justify-between items-center shadow-lg z-10 text-left">
                    <div className="flex items-center gap-4">
                        <Link to="/menu" className="p-2 hover:bg-white/10 rounded-full transition-all text-white">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none text-white">Inventory Manager</h1>
                            <p className="text-blue-200 text-[9px] font-bold tracking-[0.3em] uppercase mt-1 opacity-70 leading-none">Admin Terminal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-white">
                        <Link to="/admin/report" className="flex items-center gap-2 bg-white/10 border border-white/20 px-5 py-2.5 rounded-2xl hover:bg-white/20 transition-all text-white no-underline">
                             <BarChart3 size={16} className="text-[#ffc600]" />
                             <span className="text-[10px] font-black uppercase tracking-widest leading-none">Reports</span>
                        </Link>
                        <Link to="/admin/kitchen" className="relative flex items-center gap-3 bg-white/10 border border-white/20 px-5 py-2.5 rounded-2xl hover:bg-white/20 transition-all group text-white no-underline leading-none">
                            <ChefHat className="text-[#ffc600]" size={24} />
                            <div className="text-right hidden md:block leading-none">
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1 leading-none">Mode</p>
                                <p className="text-xs font-black uppercase tracking-tighter text-[#ffc600] leading-none">Kitchen</p>
                            </div>
                            {pendingOrderCount > 0 && <span className="absolute -top-2 -right-2 bg-white text-[#d71920] w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shadow-xl border-2 border-[#d71920] animate-bounce">{pendingOrderCount}</span>}
                        </Link>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                            <input type="text" placeholder="Search..." className="bg-blue-900/40 border border-blue-400/30 rounded-full pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-[#ffc600] w-40 transition-all text-white leading-none" value={searchTerm} onChange={(e) => setSearchBar(e.target.value)}/>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center px-8 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 text-slate-400">
                            <CalendarDays size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{new Date().toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                            <Armchair size={12} className={occupancy.available < 5 ? 'text-red-500 animate-pulse' : 'text-[#0b3d91]'} />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none text-slate-500">
                                Seating: <span className={occupancy.available < 5 ? 'text-red-600' : 'text-[#0b3d91]'}>{occupancy.available}</span> / {occupancy.total}
                            </span>
                        </div>
                    </div>
                    <button onClick={handleGlobalReset} className="flex items-center gap-2 bg-slate-100 text-[#0b3d91] px-4 py-2 rounded-xl hover:bg-[#ffc600] transition-all font-black text-[9px] uppercase tracking-widest border border-slate-200 shadow-sm leading-none"><RotateCcw size={12} /> Global Reset</button>
                </div>

                <div className="p-8 overflow-y-auto no-scrollbar flex-1 space-y-8 pb-32">
                    <div>
                        <h2 className="text-sm font-black text-[#0b3d91] uppercase tracking-widest flex items-center gap-2 text-left mb-6 px-1 leading-none"><ShoppingBag size={16}/> Pending Pickups</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {pendingOrders.map(order => (
                                <div key={order._id} className="bg-[#ffc600] p-5 rounded-[2rem] flex justify-between items-center shadow-lg border border-white/50 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-4 text-left leading-none">
                                        <span className="text-4xl font-black text-[#0b3d91] leading-none">{order.tokenID}</span>
                                        <div className="flex flex-col leading-none text-left">
                                            <span className="text-[10px] font-black text-[#0b3d91]/50 uppercase tracking-widest leading-none mb-1">{order.status}</span>
                                            <span className="text-[10px] font-bold text-[#d71920] uppercase leading-none">{order.items.length} Items</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleCollect(order._id)} className="bg-[#0b3d91] text-white p-3 rounded-2xl hover:bg-slate-900 transition-all shadow-lg leading-none"><CheckCircle2 size={20}/></button>
                                </div>
                            ))}
                            {pendingOrders.length === 0 && <p className="col-span-full text-center py-10 text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] leading-none">Queue Clear</p>}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-black text-[#0b3d91] uppercase tracking-widest mb-6 px-1 text-left leading-none">Master Inventory</h2>
                        <div className="space-y-4">
                            {inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                                <div key={item._id} className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all ${item.isAvailable ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-100 border-dashed border-gray-300 opacity-60'}`}>
                                    <div className="flex items-center gap-5">
                                        <img src={item.image} className="w-14 h-14 rounded-2xl object-cover shadow-inner bg-gray-50 border border-gray-100" alt="" />
                                        <div className="text-left leading-none">
                                            <h3 className="font-bold text-slate-900 text-sm leading-none mb-1">{item.name}</h3>
                                            <div className="flex gap-2 mt-1 leading-none">
                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md leading-none">{item.category}</span>
                                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-tighter font-mono italic text-left leading-none">LKR {item.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditClick(item)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all leading-none"><Edit3 size={16}/></button>
                                        <button onClick={() => handleDelete(item._id, item.name)} className="p-2.5 text-[#d71920] hover:bg-red-50 rounded-xl transition-all leading-none"><Trash2 size={16}/></button>
                                        <button onClick={() => handleToggle(item._id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all leading-none ${item.isAvailable ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}><Power size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`w-full md:w-[40%] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.03)] flex flex-col z-20 transition-all ${isEditing ? 'border-l-4 border-[#ffc600]' : ''}`}>
                <div className="p-10 text-center border-b border-gray-50 relative text-slate-900 leading-none">
                    {isEditing && <button onClick={cancelEdit} className="absolute left-6 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-all leading-none"><X size={18}/></button>}
                    <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg transition-all ${isEditing ? 'bg-[#ffc600] text-[#0b3d91] scale-110' : 'bg-slate-100 text-slate-300'}`}><PackagePlus size={24} /></div>
                    <h2 className="text-xl font-black text-[#0b3d91] tracking-widest uppercase leading-none">{isEditing ? 'Update Entry' : 'Catalog Entry'}</h2>
                </div>

                <form onSubmit={handleSubmit} className="px-10 pt-10 pb-20 space-y-6 overflow-y-auto no-scrollbar flex-1 text-slate-900 leading-none text-left">
                    <div className="grid grid-cols-2 gap-4 text-left leading-none">
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 leading-none">Name</label>
                            <input type="text" name="name" required className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#0b3d91] text-sm font-medium leading-none" value={formData.name} onChange={handleChange} />
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 leading-none"><Utensils size={12} className="text-[#0b3d91]"/> Category</label>
                            <select name="category" className="w-full bg-gray-50 p-4 rounded-2xl outline-none font-bold text-[#0b3d91] text-sm appearance-none leading-none" value={formData.category} onChange={handleChange}>
                                <option value="Snacks">Snacks</option>
                                <option value="Main Meals">Main Meals</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Desserts">Desserts</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5 text-left leading-none">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 leading-none">Description</label>
                        <textarea name="description" rows="2" required className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm resize-none font-medium leading-relaxed" value={formData.description} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-left leading-none">
                        <div className="space-y-1.5 text-left leading-none">
                            <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 leading-none"><BadgeDollarSign size={12} className="text-[#0b3d91]"/> Price</label>
                            <input type="number" name="price" className="w-full bg-gray-50 p-4 rounded-2xl text-center font-black text-[#0b3d91] leading-none" value={formData.price} onChange={handleChange} />
                        </div>
                        <div className="space-y-1.5 text-left leading-none">
                            <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 leading-none"><Clock size={12} className="text-[#0b3d91]"/> Prep</label>
                            <input type="number" name="prepTime" className="w-full bg-gray-50 p-4 rounded-2xl text-center font-black text-[#0b3d91] leading-none" value={formData.prepTime} onChange={handleChange} />
                        </div>
                        <div className="space-y-1.5 flex flex-col items-center leading-none">
                            <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider leading-none"><Flame size={12} className="text-[#d71920]"/> Spice</label>
                            <div className="flex gap-1.5 mt-3 leading-none">
                                {[1, 2, 3].map(i => <button key={i} type="button" onClick={() => handleSpiceClick(i)} className={`text-sm transition-all leading-none ${formData.spiceLevel >= i ? 'scale-125 opacity-100' : 'opacity-10 grayscale'}`}>🌶️</button>)}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 text-left leading-none">
                        <div className="flex-1 space-y-1.5 text-left leading-none">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 leading-none text-left">Media</label>
                            <button type="button" onClick={() => fileInputRef.current.click()} className={`w-full border-2 border-dashed p-4 rounded-2xl font-bold text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all leading-none ${imageFile ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                <Upload size={14} /> {imageFile ? 'Attached' : isEditing ? 'Update' : 'Upload'}
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <div className="space-y-1.5 text-center leading-none">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 leading-none text-center">Type</label>
                            <button type="button" onClick={() => setFormData(prev => ({...prev, isVeg: !prev.isVeg}))} className={`h-[52px] px-6 rounded-2xl font-black text-[10px] tracking-widest uppercase border-2 transition-all flex items-center gap-2 shadow-sm leading-none ${formData.isVeg ? 'bg-green-600 border-green-600 text-white shadow-green-100' : 'bg-white border-gray-100 text-slate-400'}`}>
                                {formData.isVeg && <CheckCircle2 size={14} />} Veg
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className={`w-full text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest leading-none ${isEditing ? 'bg-[#ffc600] text-[#0b3d91] hover:bg-yellow-500 shadow-yellow-100' : 'bg-[#d71920] hover:bg-red-700 shadow-red-100'}`}>
                        {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : <><ClipboardCheck size={20} /> {isEditing ? 'Save Changes' : 'Commit Entry'}</>}
                    </button>

                    {previewUrl && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-[2rem] border border-gray-100 flex flex-col items-center shadow-inner leading-none">
                            <div className="flex items-center gap-2 text-gray-400 mb-3 leading-none text-left">
                                <Eye size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Visual Check</span>
                            </div>
                            <img src={previewUrl} className="w-full h-32 object-cover rounded-2xl shadow-md border-2 border-white" alt="" />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;