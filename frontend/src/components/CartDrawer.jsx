import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBasket, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import toast from 'react-hot-toast';

const CartDrawer = () => {
    const navigate = useNavigate();
    const { cart, isCartOpen, toggleCart, updateQuantity, removeFromCart } = useCartStore();

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const handleRemove = (id, name) => {
        removeFromCart(id);
        toast.error(`${name} removed from basket`, {
            style: { borderRadius: '15px', background: '#334155', color: '#fff', fontSize: '12px' }
        });
    };

    const handleCheckout = () => {
        toggleCart();
        navigate('/checkout');
    };

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-nibmBlue/40 backdrop-blur-sm" onClick={toggleCart}></div>

            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-nibmBlue text-white">
                    <div className="flex items-center gap-3">
                        <ShoppingBasket size={24} />
                        <h2 className="text-xl font-black tracking-tight uppercase leading-none">Your Basket</h2>
                    </div>
                    <button onClick={toggleCart} className="p-2 hover:bg-white/10 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                            <ShoppingBasket size={80} strokeWidth={1} />
                            <p className="font-black uppercase tracking-[0.3em] text-[10px]">Basket is empty</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item._id} className="flex gap-4 group bg-gray-50/50 p-3 rounded-[1.5rem] border border-gray-100 animate-in fade-in duration-300">
                                <img src={item.image} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                                <div className="flex-1 flex flex-col justify-between py-0.5">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h3>
                                        <p className="text-nibmBlue font-black text-sm mt-1 italic leading-none font-mono">Rs. {item.price}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
                                            <button 
                                                onClick={() => updateQuantity(item._id, -1)} 
                                                className="text-gray-400 hover:text-nibmRed transition-all active:scale-150"
                                            >
                                                <Minus size={14}/>
                                            </button>
                                            <span className="font-black text-xs w-4 text-center text-nibmBlue">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item._id, 1)} 
                                                className="text-gray-400 hover:text-nibmBlue transition-all active:scale-150"
                                            >
                                                <Plus size={14}/>
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => handleRemove(item._id, item.name)} 
                                            className="p-2 text-gray-300 hover:text-nibmRed transition-all hover:bg-red-50 rounded-lg active:scale-90"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-8 border-t border-gray-100 bg-white shadow-[0_-20px_40px_rgba(0,0,0,0.02)] space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payable Amount</span>
                                <span className="text-3xl font-black text-nibmBlue italic leading-none mt-1 font-mono tracking-tighter">Rs. {getCartTotal()}</span>
                            </div>
                            <div className="text-[10px] font-bold text-nibmRed uppercase tracking-widest bg-red-50 px-3 py-1 rounded-lg">LANKAQR READY</div>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            className="w-full bg-nibmRed text-white font-black py-5 rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 group"
                        >
                            Secure Checkout <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;