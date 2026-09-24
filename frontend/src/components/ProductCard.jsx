import React, { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { X, Info, Flame, Clock, CheckCircle2 } from 'lucide-react';

const ProductCard = ({ product, index }) => {
    const [showDetails, setShowDetails] = useState(false);
    const addToCart = useCartStore((state) => state.addToCart);
    const toggleCart = useCartStore((state) => state.toggleCart);

    const userRole = localStorage.getItem('userRole');
    const fallbackImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400";

    const handleAdd = () => {
        addToCart(product);
        toggleCart();
    };

    return (
        <>
            <div className="group bg-white rounded-[2.5rem] p-3 shadow-premium border border-gray-100 hover:-translate-y-2 transition-all duration-500 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="relative h-52 w-full overflow-hidden rounded-[2rem] bg-gray-50">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" onError={(e) => { e.target.src = fallbackImage; }} />
                    <button onClick={() => setShowDetails(true)} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100 z-10"><Info size={16}/></button>
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-white/90 backdrop-blur-md text-nibmBlue text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">{product.category}</span>
                        {product.isVeg && (
                            <span className="bg-green-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase shadow-sm">
                                VEG
                            </span>
                        )}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-nibmBlue/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-lg">⏱️ {product.prepTime} MIN</div>
                </div>
                <div className="px-3 py-5">
                    <div className="flex justify-between items-start mb-2">
                        <h3 onClick={() => setShowDetails(true)} className="text-lg font-bold text-gray-800 tracking-tight leading-tight w-2/3 cursor-pointer hover:text-nibmBlue transition-colors">{product.name}</h3>
                        <span className="text-lg font-black text-nibmBlue italic">Rs.{product.price}</span>
                    </div>
                    
                    <div className="flex gap-0.5 mb-3">
                        {[...Array(3)].map((_, i) => (
                            <span key={i} className={`text-xs transition-opacity duration-300 ${i < product.spiceLevel ? 'opacity-100' : 'opacity-10 grayscale'}`}>
                                🌶️
                            </span>
                        ))}
                    </div>

                    <p className="text-slate-600 text-sm font-medium mb-6 line-clamp-2 leading-relaxed min-h-[40px]">{product.description}</p>
                    
                    {userRole !== 'admin' ? (
                        <button onClick={handleAdd} className="w-full bg-nibmBlue text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/20 group-hover:bg-nibmRed transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2">
                            <span className="text-[10px] tracking-[0.2em] uppercase">Add to Basket</span>
                        </button>
                    ) : (
                        <div className="w-full py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-black text-slate-300 uppercase tracking-widest">
                            Viewing Mode Only
                        </div>
                    )}
                </div>
            </div>

            {showDetails && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-nibmBlue/60 backdrop-blur-md" onClick={() => setShowDetails(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <button onClick={() => setShowDetails(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"><X size={20}/></button>
                        <img src={product.image} className="w-full h-64 object-cover" alt="" />
                        <div className="p-10 space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="bg-nibmGold text-nibmBlue px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">{product.category}</span>
                                <span className="text-2xl font-black text-nibmBlue">Rs.{product.price}</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{product.name}</h2>
                            <p className="text-slate-500 leading-relaxed font-medium">{product.description}</p>
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                <div className="text-center"><Clock size={18} className="mx-auto mb-1 text-blue-400"/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.prepTime} Mins</p></div>
                                <div className="text-center"><Flame size={18} className="mx-auto mb-1 text-nibmRed"/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level {product.spiceLevel}</p></div>
                                <div className="text-center"><CheckCircle2 size={18} className="mx-auto mb-1 text-green-500"/><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.isVeg ? 'Veg' : 'Non-Veg'}</p></div>
                            </div>
                            
                            {userRole !== 'admin' && (
                                <button onClick={() => { handleAdd(); setShowDetails(false); }} className="w-full bg-nibmRed text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-red-700 transition-all tracking-widest">CONFIRM ADDITION</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductCard;