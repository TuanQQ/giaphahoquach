import React, { useMemo } from 'react';
import { Users, Award, Shield, Heart, TrendingUp, Calendar, MapPin, UserCheck, Activity } from 'lucide-react';

export default function ThongKe({ members }) {
  // Thống kê số liệu
  const stats = useMemo(() => {
    const total = members.length;
    const aliveCount = members.filter(m => m.isAlive).length;
    const deceasedCount = total - aliveCount;
    const maleCount = members.filter(m => m.gender === 'male').length;
    const femaleCount = total - maleCount;

    // Phân bố theo đời (1 đến 10)
    const genCounts = {};
    for (let i = 1; i <= 10; i++) genCounts[i] = 0;
    members.forEach(m => {
      const g = m.generation || 1;
      genCounts[g] = (genCounts[g] || 0) + 1;
    });

    // Phân bố theo chi họ
    const branchCounts = {};
    members.forEach(m => {
      const b = m.branch || 'Gốc';
      branchCounts[b] = (branchCounts[b] || 0) + 1;
    });

    // Bô lão cao niên còn sống
    const elders = members
      .filter(m => m.isAlive && m.birthYear && m.birthYear.length === 4)
      .map(m => {
        const age = new Date().getFullYear() - Number(m.birthYear);
        return { ...m, age };
      })
      .filter(m => m.age >= 60)
      .sort((a, b) => b.age - a.age);

    return {
      total,
      aliveCount,
      deceasedCount,
      maleCount,
      femaleCount,
      genCounts,
      branchCounts,
      elders
    };
  }, [members]);

  const maxGenCount = Math.max(...Object.values(stats.genCounts), 1);

  return (
    <div className="space-y-6">
      {/* 4 Card tổng quan hàng đầu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tổng nhân khẩu */}
        <div className="bg-[#fffaf3] p-5 rounded-2xl border border-[#c8963e]/40 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-[#fdf1e3] text-[#d75b2c] rounded-xl border border-[#c8963e]/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#7a6552] block font-medium">Tổng Nhân Khẩu</span>
            <strong className="text-2xl font-serif text-[#33452b]">{stats.total}</strong>
            <span className="text-[11px] text-[#5f7852] block">10 thế hệ đồng tộc</span>
          </div>
        </div>

        {/* Tỷ lệ Nam/Nữ */}
        <div className="bg-[#fffaf3] p-5 rounded-2xl border border-[#c8963e]/40 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-[#e3f2fd] text-[#1565c0] rounded-xl border border-[#90caf9]">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#7a6552] block font-medium">Cơ Cấu Giới Tính</span>
            <strong className="text-2xl font-serif text-[#1565c0]">{stats.maleCount} Nam</strong>
            <span className="text-[11px] text-[#c2185b] block">{stats.femaleCount} Nữ / Dâu họ</span>
          </div>
        </div>

        {/* Còn sống / Đã mất */}
        <div className="bg-[#fffaf3] p-5 rounded-2xl border border-[#c8963e]/40 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#7a6552] block font-medium">Tình Trạng</span>
            <strong className="text-2xl font-serif text-emerald-700">{stats.aliveCount} Hiện Diện</strong>
            <span className="text-[11px] text-stone-500 block">{stats.deceasedCount} Tiên Tổ đã khuất</span>
          </div>
        </div>

        {/* Các cụ cao niên */}
        <div className="bg-[#fffaf3] p-5 rounded-2xl border border-[#c8963e]/40 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-[#fff3e0] text-[#e65100] rounded-xl border border-[#ffcc80]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#7a6552] block font-medium">Mừng Thọ Bô Lão</span>
            <strong className="text-2xl font-serif text-[#e65100]">{stats.elders.length} Cụ</strong>
            <span className="text-[11px] text-[#7a6552] block">Đại thọ từ 60 tuổi trở lên</span>
          </div>
        </div>
      </div>

      {/* Biểu đồ phân bố theo 10 Thế Hệ & Cơ cấu chi phái */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột 1: Phân bố theo 10 thế hệ */}
        <div className="bg-[#fffaf3] p-6 rounded-2xl border border-[#c8963e]/40 shadow-md">
          <div className="flex items-center space-x-2 border-b border-[#c8963e]/30 pb-3 mb-4">
            <TrendingUp className="w-5 h-5 text-[#d75b2c]" />
            <h3 className="font-serif text-lg font-bold text-[#33452b]">
              Phân Bố Nhân Khẩu Theo 10 Thế Hệ
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(stats.genCounts).map(([gen, count]) => {
              const pct = Math.round((count / stats.total) * 100);
              const barWidth = Math.max(4, Math.round((count / maxGenCount) * 100));

              return (
                <div key={gen} className="flex items-center space-x-3">
                  <span className="w-16 font-semibold text-[#5f7852] shrink-0">
                    Đời thứ {gen}
                  </span>
                  <div className="flex-1 bg-[#fdf1e3] rounded-full h-5 overflow-hidden border border-[#c8963e]/30 relative flex items-center">
                    <div 
                      className="bg-gradient-to-r from-[#d75b2c] to-[#e47c4a] h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-mono font-bold text-[#333333] shrink-0">
                    {count} người ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột 2: Phân bố theo chi họ */}
        <div className="bg-[#fffaf3] p-6 rounded-2xl border border-[#c8963e]/40 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-[#c8963e]/30 pb-3 mb-4">
              <Users className="w-5 h-5 text-[#5f7852]" />
              <h3 className="font-serif text-lg font-bold text-[#33452b]">
                Cơ Cấu Các Chi Phái Dòng Họ Quách
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {Object.entries(stats.branchCounts).map(([branch, count], idx) => {
                const pct = Math.round((count / stats.total) * 100);
                const colors = ['#d75b2c', '#5f7852', '#c8963e', '#1565c0', '#6b3f23', '#2e7d32'];
                const color = colors[idx % colors.length];

                return (
                  <div key={branch} className="p-3 bg-[#fdf1e3] rounded-xl border border-[#c8963e]/30 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <strong className="text-sm font-semibold text-[#33452b]">{branch}</strong>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#d75b2c]">
                      {count} thành viên <span className="text-xs font-normal text-[#7a6552]">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c8963e]/20 text-[11px] text-[#7a6552] text-center">
            Dữ liệu đồng bộ trực tiếp từ cơ sở dữ liệu phả đồ Đại Tộc Họ Quách
          </div>
        </div>
      </div>

      {/* Danh sách các Cụ bô lão cao niên (Mừng Thọ) */}
      {stats.elders.length > 0 && (
        <div className="bg-[#fffaf3] p-6 rounded-2xl border border-[#c8963e]/40 shadow-md">
          <div className="flex items-center space-x-2 border-b border-[#c8963e]/30 pb-3 mb-4">
            <Award className="w-5 h-5 text-[#d75b2c]" />
            <h3 className="font-serif text-lg font-bold text-[#33452b]">
              Bảng Vàng Mừng Thọ Bô Lão Dòng Họ (Từ 60 Tuổi Trở Lên)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.elders.slice(0, 9).map((elder) => (
              <div 
                key={elder.id}
                className="p-3 bg-[#fdf1e3] rounded-xl border border-[#c8963e]/30 flex items-center space-x-3"
              >
                {elder.avatar ? (
                  <img 
                    src={elder.avatar} 
                    alt={elder.fullName} 
                    className="w-10 h-10 rounded-full object-cover border border-[#c8963e]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white border border-[#c8963e] flex items-center justify-center font-bold text-[#5f7852] text-sm">
                    {elder.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-xs text-[#33452b]">{elder.fullName}</h4>
                  <p className="text-[11px] text-[#7a6552]">
                    Sinh năm {elder.birthYear} • <strong className="text-[#d75b2c] font-bold">{elder.age} tuổi</strong>
                  </p>
                  <p className="text-[10px] text-[#5f7852]">
                    {elder.branch || 'Gốc'} • Đời thứ {elder.generation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
