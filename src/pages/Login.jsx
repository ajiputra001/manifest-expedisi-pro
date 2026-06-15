import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import { Box, Truck, Zap, Store, User, Lock, Eye, EyeOff, MapPin, Phone, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: '', password: '', name: '', phone: '', address: ''
    });

    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLoginMode) {
                await login(formData.username, formData.password);
                navigate('/');
            } else {
                const newId = 'user-' + Date.now();
                const newUser = {
                    id: newId, 
                    name: formData.name, 
                    username: formData.username, 
                    password: formData.password,
                    phone: formData.phone, 
                    address: formData.address,
                    role: 'operator', 
                    status: 'pending', 
                    created_at: new Date().toISOString()
                };
                await register(newUser);
                Swal.fire({icon: 'success', title: 'Berhasil', text: 'Menunggu persetujuan admin', background: '#18181b', color: '#fff'});
                setIsLoginMode(true);
            }
        } catch (error) {
            Swal.fire({toast: true, position: 'top', showConfirmButton: false, timer: 3000, icon: 'error', title: 'Gagal', text: error.message, background: '#18181b', color: '#ef4444'});
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-3xl overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] animate-pulse" style={{animationDuration: '6s'}}></div>
                <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] animate-pulse" style={{animationDuration: '8s', animationDelay: '2s'}}></div>
                <Box className="absolute top-[20%] left-[15%] text-zinc-700/30 w-16 h-16 animate-float" />
                <Truck className="absolute bottom-[25%] right-[15%] text-zinc-700/30 w-16 h-16 animate-float" style={{animationDelay: '1s'}} />
            </div>

            <div className="w-full max-w-sm bg-white/[0.02] border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-3xl relative z-10 overflow-hidden fade-in">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="text-center mb-8 relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                        {isLoginMode ? <Zap className="text-white w-8 h-8" /> : <Store className="text-white w-8 h-8" />}
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2 drop-shadow-lg">LOGISTIK<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">PRO</span></h2>
                    <p className="text-zinc-400 text-[10px] font-medium h-4 tracking-wide">Sistem logistik pintar untuk bisnis masa depan.<span className="animate-pulse text-amber-500">|</span></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-3">
                        {!isLoginMode && (
                            <div className="space-y-3 fade-in">
                                <div>
                                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1.5">Nama Toko / Seller</label>
                                    <div className="relative group">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors w-4 h-4" />
                                        <input type="text" name="name" required={!isLoginMode} value={formData.name} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all" placeholder="Misal: Toko Berkah" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1.5">No. WhatsApp</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors w-4 h-4" />
                                        <input type="tel" name="phone" required={!isLoginMode} value={formData.phone} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all" placeholder="08123456789" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1.5">Alamat Toko</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-3 text-zinc-500 group-focus-within:text-rose-400 transition-colors w-4 h-4" />
                                        <textarea name="address" rows="2" required={!isLoginMode} value={formData.address} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-rose-400/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all resize-none" placeholder="Masukkan alamat lengkap toko"></textarea>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1.5">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors w-4 h-4" />
                                <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all" placeholder="Masukkan username Anda" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-1.5">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors w-4 h-4" />
                                <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-500 focus:outline-none transition-colors">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-black py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2 text-xs tracking-widest">
                            {loading ? <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div> : (isLoginMode ? <><LogIn className="w-4 h-4" /> MASUK SEKARANG</> : <><UserPlus className="w-4 h-4" /> DAFTAR SEKARANG</>)}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center border-t border-white/10 pt-6">
                    <p className="text-zinc-400 text-xs font-medium">
                        {isLoginMode ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                        <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-amber-500 font-bold hover:text-amber-400 transition-all ml-1">
                            {isLoginMode ? 'Daftar Sekarang' : 'Login Disini'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
