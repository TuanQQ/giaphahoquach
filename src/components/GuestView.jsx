import React, { useState } from 'react';
import { 
  GitFork, Users, Calendar, Flame, BookOpen, BarChart3, 
  FileSpreadsheet, LogIn, Search, ZoomIn, ZoomOut, Maximize2, 
  ImageIcon, FileText, ChevronDown, CheckCircle2, Heart, Award
} from 'lucide-react';

import DaiVietPhado from './DaiVietPhado';
import MemberList from './MemberList';
import LunarAnniversaries from './LunarAnniversaries';
import TuDuong from './TuDuong';
import PhaKyTocUoc from './PhaKyTocUoc';
import ThongKe from './ThongKe';

export default function GuestView({ 
  clan, 
  members, 
  incenseLogs, 
  onSelectMember, 
  onOfferIncense, 
  onRequireLogin, 
  onDownloadExcel,
  onAddMember
}) {
  const [activeTab, setActiveTab] = useState('phado'); // phado | home | events | tuduong
  const [librarySubTab, setLibrarySubTab] = useState('tuduong'); // tuduong | directory | stats

  return (
    <div 
      className="min-h-screen flex flex-col font-sans text-[#333333]"
      style={{
        backgroundImage: "url('/templates/default/images/main_bg.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center'
      }}
    >
      {/* 1. TOP ORNAMENTAL BORDER LINE (Chuẩn demo475.giaphadaiviet.vn) */}
      <div 
        className="h-[17px] w-full"
        style={{
          backgroundImage: 'url("/templates/default/images/footer-bg-line.jpg")',
          backgroundPosition: 'top center',
          backgroundRepeat: 'repeat-x'
        }}
      />

      {/* 2. HEADER BANNER HOÀNH PHI & LƯỠNG LONG (NỔI BẬT TO LỚN CHUẨN DEMO475) */}
      <header className="header-giapha pt-2 pb-1">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-12 items-center gap-2">
            
            {/* Banner Rồng Trái (Ẩn trên mobile < 768px) */}
            <div className="banner-dragon-side col-span-3">
              <img 
                src="/templates/default/images/banner-header-left-default.png" 
                alt="Banner Header Left" 
                className="max-h-[160px] lg:max-h-[190px] w-auto object-contain drop-shadow-md select-none pointer-events-none transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Banner Cuốn Thư Ở Giữa (Hoành Phi Sơn Son Thiếp Vàng - To & Rõ Nét) */}
            <div className="col-span-12 md:col-span-6 flex justify-center items-center">
              <div className="header-banner w-full text-center">
                <div className="header-banner-inner">
                  <div className="header-banner-image">
                    <img 
                      src="/templates/default/images/banner-header-center-default.png" 
                      alt="Hoành Phi Gia Phả Quách Tộc" 
                      className="max-h-[185px] sm:max-h-[210px] md:max-h-[235px] w-auto max-w-full object-contain drop-shadow-2xl select-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Rồng Phải (Ẩn trên mobile < 768px) */}
            <div className="banner-dragon-side col-span-3">
              <img 
                src="/templates/default/images/banner-header-right-default.png" 
                alt="Banner Header Right" 
                className="max-h-[160px] lg:max-h-[190px] w-auto object-contain drop-shadow-md select-none pointer-events-none transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* 3. THANH MENU ĐIỀU HƯỚNG MÂY TRUYỀN THỐNG (CHUẨN DEMO475.GIAPHADAIVIET.VN) */}
        <div className="max-w-5xl mx-auto px-4 mt-2">
          <nav className="nav-menu-giapha">
            <ul className="flex flex-wrap justify-center items-center">
              {/* 1. Trang Chủ */}
              <li 
                className={activeTab === 'home' ? 'active' : ''}
                onClick={() => setActiveTab('home')}
              >
                <div className="li-center">
                  <button type="button">Trang chủ</button>
                </div>
              </li>

              {/* 2. Phả Đồ */}
              <li 
                className={activeTab === 'phado' ? 'active' : ''}
                onClick={() => setActiveTab('phado')}
              >
                <div className="li-center">
                  <button type="button">Phả đồ</button>
                </div>
              </li>

              {/* 3. Sự Kiện */}
              <li 
                className={activeTab === 'events' ? 'active' : ''}
                onClick={() => setActiveTab('events')}
              >
                <div className="li-center">
                  <button type="button">Sự kiện</button>
                </div>
              </li>

              {/* 4. Thư Viện */}
              <li 
                className={activeTab === 'tuduong' ? 'active' : ''}
                onClick={() => setActiveTab('tuduong')}
              >
                <div className="li-center">
                  <button type="button">Thư viện</button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* 4. NỘI DUNG CHÍNH (MAIN VIEW) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-2">
        
        {/* TAB 1: PHẢ ĐỒ TƯƠNG TÁC (TẬP TRUNG TOÀN BỘ KHÔNG GIAN CHO CÂY PHẢ HỆ) */}
        {activeTab === 'phado' && (
          <div className="w-full">
            <DaiVietPhado
              members={members}
              clan={clan}
              isAdmin={false}
              onSelectMember={onSelectMember}
              onAddMember={onAddMember || (() => onRequireLogin())}
              onDownloadExcel={onDownloadExcel}
              onRequireLogin={onRequireLogin}
            />
          </div>
        )}

        {/* TAB 2: TRANG CHỦ (PHẢ KÝ & TỘC ƯỚC) */}
        {activeTab === 'home' && (
          <div className="bg-[#fffaf3]/95 p-6 rounded-2xl border border-[#c8963e]/40 shadow-lg">
            <PhaKyTocUoc
              clan={clan}
              isAdmin={false}
              onUpdateClan={() => {}}
            />
          </div>
        )}

        {/* TAB 3: SỰ KIỆN & LỊCH GIỖ */}
        {activeTab === 'events' && (
          <div className="bg-[#fffaf3]/95 p-6 rounded-2xl border border-[#c8963e]/40 shadow-lg">
            <LunarAnniversaries
              members={members}
              onSelectMember={onSelectMember}
              onNavigateTuDuong={() => {
                setActiveTab('tuduong');
                setLibrarySubTab('tuduong');
              }}
            />
          </div>
        )}

        {/* TAB 4: THƯ VIỆN (TỪ ĐƯỜNG SỐ, DANH BẠ CON CHÁU, THỐNG KÊ) */}
        {activeTab === 'tuduong' && (
          <div className="bg-[#fffaf3]/95 p-5 rounded-2xl border border-[#c8963e]/40 shadow-lg space-y-4">
            {/* Thanh chọn phân mục con trong Thư Viện */}
            <div className="flex flex-wrap items-center justify-center gap-2 border-b border-[#c8963e]/30 pb-3">
              <button
                onClick={() => setLibrarySubTab('tuduong')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-serif font-bold transition ${
                  librarySubTab === 'tuduong'
                    ? 'bg-[#d75b2c] text-white shadow-sm'
                    : 'bg-[#fdf1e3] text-[#5f7852] hover:bg-[#edd9b0]'
                }`}
              >
                <Flame className="w-4 h-4 text-[#ffe168]" />
                <span>Từ Đường Số (Dâng Hương)</span>
              </button>

              <button
                onClick={() => setLibrarySubTab('directory')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-serif font-bold transition ${
                  librarySubTab === 'directory'
                    ? 'bg-[#d75b2c] text-white shadow-sm'
                    : 'bg-[#fdf1e3] text-[#5f7852] hover:bg-[#edd9b0]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Danh Bạ Con Cháu ({members.length})</span>
              </button>

              <button
                onClick={() => setLibrarySubTab('stats')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-serif font-bold transition ${
                  librarySubTab === 'stats'
                    ? 'bg-[#d75b2c] text-white shadow-sm'
                    : 'bg-[#fdf1e3] text-[#5f7852] hover:bg-[#edd9b0]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Thống Kê Dòng Họ</span>
              </button>
            </div>

            {/* Nội dung tương ứng */}
            {librarySubTab === 'tuduong' && (
              <TuDuong
                clan={clan}
                incenseLogs={incenseLogs}
                onOfferIncense={onOfferIncense}
              />
            )}

            {librarySubTab === 'directory' && (
              <MemberList
                members={members}
                isAdmin={false}
                onSelectMember={onSelectMember}
                onAddMember={onAddMember || (() => onRequireLogin())}
                onDeleteMember={() => {}}
              />
            )}

            {librarySubTab === 'stats' && (
              <ThongKe
                members={members}
              />
            )}
          </div>
        )}
      </main>

      {/* 5. FOOTER TRUYỀN THỐNG CHUẨN DEMO475.GIAPHADAIVIET.VN */}
      <footer className="mt-6 bg-[#2a1d12] text-[#fffaf3] border-t-4 border-[#c8963e] py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Logo Gia Phả Quách Tộc */}
            <div className="md:col-span-3 text-center md:text-left">
              <img 
                src="/templates/default/images/logo-gia-pha-dai-viet.png" 
                alt="Gia Phả Quách Tộc" 
                className="h-16 w-auto object-contain mx-auto md:mx-0 drop-shadow-md"
              />
              <p className="text-xs text-[#edd9b0] font-serif mt-1">
                Hệ Thống Số Hóa Gia Phả Quách Tộc
              </p>
            </div>

            {/* Thông Tin Dòng Họ */}
            <div className="md:col-span-6 text-center md:text-left space-y-1">
              <h3 className="font-serif text-base font-bold text-[#ffe168] uppercase tracking-wide">
                {clan.name || 'ĐẠI TỘC HỌ QUÁCH'}
              </h3>
              <p className="text-xs text-stone-300">
                Thủy tổ Cụ <strong>Quách Văn Trễ</strong> (1800) — Trải qua 10 thế hệ phụng tự đồng tộc.
              </p>
              <p className="text-xs text-[#edd9b0]/80 italic">
                "{clan.motto || 'Tổ công phụ đức thiên niên thịnh — Tử hiếu tôn hiền vạn đại vinh'}"
              </p>
            </div>

            {/* Nút Đăng Nhập Dành Cho Ban Quản Trị */}
            <div className="md:col-span-3 text-center md:text-right">
              <button
                onClick={onRequireLogin}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[#d75b2c] hover:bg-[#b94a20] text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                <LogIn className="w-4 h-4 text-[#ffe168]" />
                <span>Trang Quản Trị Dòng Họ</span>
              </button>
              <p className="text-[11px] text-stone-400 mt-1">
                Dành cho Trưởng tộc & Ban trị sự
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c8963e]/30 text-center text-[11px] text-stone-400">
            © Bản quyền thuộc về Đại Tộc Họ Quách • Phát triển trên nền tảng Gia Phả Quách Tộc (https://giaphahoquach.vercel.app)
          </div>
        </div>
      </footer>
    </div>
  );
}
