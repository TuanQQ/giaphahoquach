import React, { useState } from 'react';
import { Lock, User, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      // Lưu token vào localStorage
      localStorage.setItem('gp_token', data.token);
      localStorage.setItem('gp_role', 'ADMIN');
      localStorage.setItem('gp_user', data.username);

      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#fffdf9] rounded-2xl shadow-2xl border-2 border-[#c8963e]/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#5f7852] to-[#33452b] text-white border-b border-[#c8963e]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Xác Thực Quản Trị Viên</h3>
              <p className="text-[11px] text-emerald-100">Gia Phả Quách Tộc • Đại Tộc Họ Quách</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[#5f7852] font-semibold mb-1">Tài Khoản Quản Trị:</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#7a6552] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Tên đăng nhập (ví dụ: admin)"
                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-[#c8963e]/40 focus:border-[#d75b2c] focus:outline-hidden text-[#333333]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#5f7852] font-semibold mb-1">Mật Khẩu:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7a6552] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu quản trị..."
                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-[#c8963e]/40 focus:border-[#d75b2c] focus:outline-hidden text-[#333333]"
                required
                autoFocus
              />
            </div>
            <p className="text-[10px] text-[#7a6552] mt-1 italic">
              * Mật khẩu mặc định hệ thống: <b>admin123</b>
            </p>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-[#7a6552] font-semibold rounded-xl transition"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#d75b2c] to-[#b94a20] hover:from-[#b94a20] hover:to-[#963c19] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
