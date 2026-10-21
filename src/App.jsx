import React, { useState, useEffect } from 'react';
import { 
  GitFork, Users, Calendar, Flame, BookOpen, BarChart3, 
  Database, Plus, Download, FileSpreadsheet, RefreshCw, AlertCircle, CheckCircle2,
  ShieldCheck, LogIn, LogOut, Eye, Lock
} from 'lucide-react';

import DaiVietPhado from './components/DaiVietPhado';
import MemberList from './components/MemberList';
import LunarAnniversaries from './components/LunarAnniversaries';
import TuDuong from './components/TuDuong';
import PhaKyTocUoc from './components/PhaKyTocUoc';
import ThongKe from './components/ThongKe';
import BackupRestore from './components/BackupRestore';
import MemberModal from './components/MemberModal';
import LoginModal from './components/LoginModal';
import GuestView from './components/GuestView';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('phado'); // phado | members | lunar | tuduong | phaky | thongke | backup

  // Role-Based Access Control State (Mặc định GUEST nếu chưa đăng nhập)
  const [userRole, setUserRole] = useState(() => localStorage.getItem('gp_role') || 'GUEST');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('gp_token') || '');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const isAdmin = userRole === 'ADMIN';

  // Member Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [isNewMember, setIsNewMember] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch initial data from API
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/clan');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu gia phả:', err);
      setError('Không thể kết nối đến máy chủ API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Auth Handlers
  const handleLoginSuccess = (authData) => {
    setUserRole('ADMIN');
    setAuthToken(authData.token);
    showToast(`Đăng nhập thành công! Quyền: Quản Trị Viên (Toàn Quyền)`);
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'x-admin-token': authToken }
        });
      }
    } catch (e) {}
    localStorage.removeItem('gp_token');
    localStorage.setItem('gp_role', 'GUEST');
    setUserRole('GUEST');
    setAuthToken('');
    showToast('Đã chuyển sang giao diện Con Cháu / Khách (demo475.giaphadaiviet.vn)', 'info');
  };

  // 3. Member CRUD Handlers (Protected)
  const handleSaveMember = async (memberData) => {
    if (!isAdmin) {
      setIsLoginOpen(true);
      alert('Vui lòng đăng nhập quyền Quản Trị Viên để lưu thay đổi.');
      return;
    }

    try {
      const isEdit = !isNewMember && selectedMember;
      const url = isEdit ? `/api/members/${selectedMember.id}` : '/api/members';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': authToken
        },
        body: JSON.stringify(memberData)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Lỗi khi lưu');

      await loadData();
      setSelectedMember(null);
      setIsNewMember(null);
      showToast(isEdit ? 'Đã cập nhật thông tin thành viên thành công!' : 'Đã thêm thành viên mới vào gia phả!');
    } catch (err) {
      alert('Không thể lưu thành viên: ' + err.message);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!isAdmin) {
      setIsLoginOpen(true);
      alert('Chỉ Quản Trị Viên mới có quyền xóa thành viên.');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi gia phả?')) return;
    try {
      const res = await fetch(`/api/members/${id}`, { 
        method: 'DELETE',
        headers: { 'x-admin-token': authToken }
      });
      if (!res.ok) throw new Error('Lỗi khi xóa');
      await loadData();
      if (selectedMember && selectedMember.id === id) {
        setSelectedMember(null);
      }
      showToast('Đã xóa thành viên khỏi gia phả.');
    } catch (err) {
      alert('Không thể xóa: ' + err.message);
    }
  };

  // 4. Update Clan Info & History (Protected)
  const handleUpdateClan = async (newClan) => {
    if (!isAdmin) {
      setIsLoginOpen(true);
      alert('Chỉ Quản Trị Viên mới có quyền sửa Phả Ký & Tộc Ước.');
      return;
    }

    try {
      const res = await fetch('/api/clan', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': authToken
        },
        body: JSON.stringify(newClan)
      });
      if (!res.ok) throw new Error('Lỗi khi cập nhật phả ký');
      await loadData();
      showToast('Đã cập nhật Phả ký & Tộc ước thành công!');
    } catch (err) {
      alert('Không thể cập nhật phả ký: ' + err.message);
    }
  };

  // 5. Incense Offering (Public)
  const handleOfferIncense = async (incenseData) => {
    try {
      const res = await fetch('/api/incense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incenseData)
      });
      if (!res.ok) throw new Error('Lỗi khi thắp hương');
      await loadData();
      showToast('Thành tâm dâng hương thành công!');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // 6. Direct Excel Export (Public for everyone)
  const handleDownloadExcel = () => {
    window.location.href = '/api/export-excel';
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf1e3] p-4">
        <div className="w-14 h-14 border-4 border-[#d75b2c] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="font-serif text-xl font-bold text-[#5f7852]">
          Gia Phả Quách Tộc — Đang Khởi Động
        </h2>
        <p className="text-xs text-[#7a6552] mt-1">
          Đang nạp 398 thành viên Đại Tộc Họ Quách...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf1e3] p-4">
        <div className="max-w-md p-6 bg-white rounded-2xl shadow-xl border border-red-300 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#d75b2c] mx-auto" />
          <h2 className="font-serif text-xl font-bold text-[#c62828]">Không Thể Nạp Dữ Liệu</h2>
          <p className="text-xs text-stone-600">{error}</p>
          <button 
            onClick={loadData}
            className="px-5 py-2.5 bg-[#d75b2c] hover:bg-[#b94a20] text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            Thử Lại
          </button>
        </div>
      </div>
    );
  }

  const clan = data?.clan || {};
  const members = data?.members || [];
  const incenseLogs = data?.incenseLogs || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf1e3] text-[#333333]">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 bg-[#fffaf3] border-2 border-[#c8963e] shadow-2xl rounded-xl text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#2e7d32]" />
          <span className="text-[#33452b]">{toast.message}</span>
        </div>
      )}

      {/* GIAO DIỆN 1: CHẾ ĐỘ KHÁCH / CON CHÁU (CHUẨN DEMO475.GIAPHADAIVIET.VN) */}
      {!isAdmin ? (
        <GuestView
          clan={clan}
          members={members}
          incenseLogs={incenseLogs}
          onSelectMember={(m) => setSelectedMember(m)}
          onOfferIncense={handleOfferIncense}
          onRequireLogin={() => setIsLoginOpen(true)}
          onDownloadExcel={handleDownloadExcel}
        />
      ) : (
        /* GIAO DIỆN 2: CHẾ ĐỘ QUẢN TRỊ VIÊN (CHUẨN CP.GIAPHADAIVIET.VN) */
        <div className="min-h-screen flex flex-col bg-[#fdf1e3]">
          
          {/* HEADER QUẢN TRỊ TRUNG TÂM ĐIỀU HÀNH */}
          <header className="bg-[#fffaf3] border-b-2 border-[#c8963e]/60 shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
              
              {/* Logo & Tên trung tâm điều hành */}
              <div className="flex items-center space-x-4">
                <img 
                  src="/images/logo.png" 
                  alt="Gia Phả Quách Tộc" 
                  className="h-11 w-auto object-contain shrink-0" 
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-display text-xl text-[#d75b2c] tracking-wide">
                      Gia Phả Quách Tộc
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-[#fdf1e3] text-[#5f7852] font-semibold rounded-md border border-[#c8963e]/40">
                      Trung tâm điều hành
                    </span>
                  </div>
                  <h1 className="font-serif text-lg font-bold text-[#33452b] leading-tight">
                    {clan.name || 'ĐẠI TỘC HỌ QUÁCH'}
                  </h1>
                </div>
              </div>

              {/* Action Buttons & Phân Quyền */}
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Huy hiệu Quản Trị Viên */}
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Quản Trị Viên</span>
                  </span>
                  
                  {/* Nút Xem Giao Diện Khách (demo475) */}
                  <button
                    onClick={handleLogout}
                    title="Chuyển sang giao diện Khách & Con Cháu (demo475.giaphadaiviet.vn)"
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs text-[#5f7852] hover:text-[#d75b2c] bg-white hover:bg-stone-50 border border-[#c8963e]/40 rounded-lg transition font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem Giao Diện Khách</span>
                  </button>
                </div>

                {/* Nút Xuất Excel nhanh trên Header */}
                <button
                  onClick={handleDownloadExcel}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#217346] to-[#1e6b3f] hover:from-[#1b5e37] hover:to-[#175230] text-white text-xs font-bold rounded-lg shadow-sm transition"
                  title="Xuất file Excel .xlsx toàn bộ họ Quách"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#edd9b0]" />
                  <span>Xuất Excel (.xlsx)</span>
                </button>

                {/* Nút Thêm Người Nhanh */}
                <button
                  onClick={() => setIsNewMember({ defaultGeneration: 1 })}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-[#d75b2c] hover:bg-[#b94a20] text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Người</span>
                </button>
              </div>
            </div>

            {/* Thanh Menu Tabs Quản Trị */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#c8963e]/20 flex space-x-1 overflow-x-auto scrollbar-none py-1">
              {[
                { id: 'phado', label: 'Phả Đồ Tương Tác', icon: GitFork },
                { id: 'members', label: 'Danh Sách Thành Viên (Excel)', icon: Users, badge: `${members.length}` },
                { id: 'lunar', label: 'Sổ Giỗ Chạp (Kỵ Nhật)', icon: Calendar },
                { id: 'tuduong', label: 'Từ Đường Số', icon: Flame },
                { id: 'phaky', label: 'Phả Ký & Tộc Ước', icon: BookOpen },
                { id: 'thongke', label: 'Thống Kê Dòng Họ', icon: BarChart3 },
                { id: 'backup', label: 'Sao Lưu & Phục Hồi', icon: Database }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                      isActive
                        ? 'bg-[#d75b2c] text-white shadow-xs'
                        : 'text-[#5f7852] hover:bg-[#fdf1e3] hover:text-[#d75b2c]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#5f7852]'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#c8963e]/20 text-[#6b3f23]'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </header>

          {/* NỘI DUNG CHÍNH (QUẢN TRỊ CONTAINER) */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeTab === 'phado' && (
              <DaiVietPhado
                members={members}
                clan={clan}
                isAdmin={true}
                onSelectMember={(m) => setSelectedMember(m)}
                onAddMember={(defaults) => setIsNewMember(defaults)}
              />
            )}

            {activeTab === 'members' && (
              <MemberList
                members={members}
                isAdmin={true}
                onSelectMember={(m) => setSelectedMember(m)}
                onAddMember={(defaults) => setIsNewMember(defaults)}
                onDeleteMember={handleDeleteMember}
              />
            )}

            {activeTab === 'lunar' && (
              <LunarAnniversaries
                members={members}
                onSelectMember={(m) => setSelectedMember(m)}
                onNavigateTuDuong={() => setActiveTab('tuduong')}
              />
            )}

            {activeTab === 'tuduong' && (
              <TuDuong
                clan={clan}
                incenseLogs={incenseLogs}
                onOfferIncense={handleOfferIncense}
              />
            )}

            {activeTab === 'phaky' && (
              <PhaKyTocUoc
                clan={clan}
                isAdmin={true}
                onUpdateClan={handleUpdateClan}
              />
            )}

            {activeTab === 'thongke' && (
              <ThongKe
                members={members}
              />
            )}

            {activeTab === 'backup' && (
              <BackupRestore
                isAdmin={true}
                authToken={authToken}
                onRequireLogin={() => setIsLoginOpen(true)}
                onRestoreSuccess={loadData}
              />
            )}
          </main>

          {/* FOOTER QUẢN TRỊ */}
          <footer className="bg-[#fffaf3] border-t border-[#c8963e]/40 py-4 text-center text-xs text-[#7a6552]">
            <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-[#5f7852]">Gia Phả Quách Tộc</span>
                <span>—</span>
                <span>Trung Tâm Điều Hành & Số Hóa Dòng Họ</span>
              </div>
              <div className="font-mono text-[11px] text-[#5f7852]">
                Quyền: <b className="text-emerald-700">Quản Trị Viên (Toàn Quyền)</b> • Cổng dịch vụ: http://localhost:3001
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* MODAL THÀNH VIÊN (THÊM / SỬA / XEM CHI TIẾT) */}
      {(selectedMember || isNewMember) && (
        <MemberModal
          member={selectedMember}
          isNew={isNewMember}
          isAdmin={isAdmin}
          allMembers={members}
          onClose={() => {
            setSelectedMember(null);
            setIsNewMember(null);
          }}
          onSave={handleSaveMember}
          onDelete={handleDeleteMember}
        />
      )}

      {/* MODAL ĐĂNG NHẬP XÁC THỰC QUẢN TRỊ VIÊN */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
