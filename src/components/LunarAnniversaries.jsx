import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Bell, User, Flame, ChevronRight, Search, Sparkles } from 'lucide-react';
import { getDaysUntilAnniversary } from '../utils/lunarSolar';

export default function LunarAnniversaries({ members, onSelectMember, onNavigateTuDuong }) {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc các thành viên đã mất có ngày giỗ âm lịch
  const anniversaries = useMemo(() => {
    return members
      .filter(m => !m.isAlive && m.lunarDeathDay && m.lunarDeathMonth)
      .map(m => {
        const nextInfo = getDaysUntilAnniversary(m.lunarDeathDay, m.lunarDeathMonth);
        return {
          member: m,
          lunarDate: `${m.lunarDeathDay}/${m.lunarDeathMonth}`,
          daysLeft: nextInfo ? nextInfo.daysLeft : 999,
          solarDate: nextInfo ? `${nextInfo.solar.day}/${nextInfo.solar.month}/${nextInfo.solar.year}` : 'Đang tính...'
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [members]);

  const filtered = anniversaries.filter(item => {
    if (selectedMonth !== 'all' && item.member.lunarDeathMonth !== Number(selectedMonth)) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.member.fullName.toLowerCase().includes(q) || 
        (item.member.honorific && item.member.honorific.toLowerCase().includes(q)) ||
        (item.member.branch && item.member.branch.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner Sổ Kỵ Nhật (Phong cách Gia Phả Đại Việt) */}
      <div className="bg-gradient-to-r from-[#5f7852] via-[#445b39] to-[#33452b] text-white p-6 rounded-2xl border-2 border-[#c8963e]/50 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c8963e]/20 text-[#edd9b0] rounded-full text-xs font-semibold border border-[#c8963e]/30">
            <Calendar className="w-3.5 h-3.5 text-[#d75b2c]" />
            Lịch Âm Dương Truyền Thống Đại Tộc Họ Quách
          </div>
          <h2 className="font-serif text-2xl font-bold text-white">
            Sổ Giỗ Chạp Dòng Họ (Kỵ Nhật Tiên Tổ)
          </h2>
          <p className="text-xs text-stone-200 leading-relaxed">
            Hệ thống tự động quy đổi ngày giỗ Âm lịch của các bậc tiền nhân họ Quách sang ngày Dương lịch hàng năm, đếm ngược để con cháu toàn gia tề tựu, chuẩn bị hương hoa phụng dưỡng tiên tổ.
          </p>
        </div>
      </div>

      {/* Thanh tìm kiếm & lọc tháng */}
      <div className="bg-[#fffaf3] p-4 rounded-xl border border-[#c8963e]/40 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center flex-wrap gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#7a6552] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên bậc tiên tổ..."
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#c8963e]/40 rounded-lg focus:outline-hidden focus:border-[#d75b2c] w-64 text-[#333333]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#5f7852] font-semibold">Lọc theo tháng Âm lịch:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="py-1.5 px-3 bg-white border border-[#c8963e]/40 rounded-lg text-xs font-semibold text-[#333333] focus:outline-hidden focus:border-[#d75b2c]"
            >
              <option value="all">Tất cả 12 tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m} Âm lịch</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-[#5f7852] font-semibold">
          Tổng cộng: <strong className="text-[#d75b2c] font-bold">{filtered.length}</strong> ngày giỗ trong sổ họ
        </div>
      </div>

      {/* Danh sách ngày giỗ dạng lưới Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#7a6552] bg-[#fffaf3] rounded-xl border border-dashed border-[#c8963e]/40">
            Không tìm thấy ngày giỗ nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filtered.map(({ member, lunarDate, daysLeft, solarDate }) => {
            const isVeryClose = daysLeft <= 7;
            const isUpcoming = daysLeft <= 30;

            return (
              <div
                key={member.id}
                onClick={() => onSelectMember(member)}
                className={`relative bg-[#fffaf3] rounded-2xl border transition duration-200 cursor-pointer overflow-hidden p-5 flex flex-col justify-between hover:shadow-lg ${
                  isVeryClose
                    ? 'border-[#d75b2c] ring-2 ring-[#d75b2c]/30 shadow-md'
                    : isUpcoming
                    ? 'border-[#c8963e] shadow-sm'
                    : 'border-[#c8963e]/30 shadow-xs'
                }`}
              >
                {/* Header Card */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      {member.avatar ? (
                        <img 
                          src={member.avatar} 
                          alt={member.fullName} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#c8963e] shadow-xs" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#fdf1e3] border-2 border-[#c8963e]/50 flex items-center justify-center text-[#5f7852] font-bold">
                          {member.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-serif font-bold text-base text-[#33452b] hover:text-[#d75b2c] transition">
                          {member.fullName}
                        </h4>
                        <p className="text-xs text-[#7a6552]">
                          {member.honorific || `Đời thứ ${member.generation}`} • {member.branch || 'Gốc'}
                        </p>
                      </div>
                    </div>

                    {/* Huy hiệu đếm ngược */}
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                      isVeryClose
                        ? 'bg-[#d75b2c] text-white animate-pulse'
                        : isUpcoming
                        ? 'bg-[#fdf1e3] text-[#d75b2c] border border-[#d75b2c]/40'
                        : 'bg-stone-100 text-[#7a6552]'
                    }`}>
                      {daysLeft === 0 ? 'HÔM NAY' : `Còn ${daysLeft} ngày`}
                    </span>
                  </div>

                  {/* Chi tiết ngày Âm - Dương */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[#fdf1e3] rounded-xl border border-[#c8963e]/30 text-xs mb-3">
                    <div>
                      <span className="text-[#7a6552] block text-[10px]">Ngày Giỗ Âm Lịch:</span>
                      <strong className="text-sm font-serif text-[#d75b2c]">
                        Ngày {member.lunarDeathDay} tháng {member.lunarDeathMonth} ÂL
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#7a6552] block text-[10px]">Dương Lịch Năm Nay:</span>
                      <strong className="text-xs font-sans text-[#5f7852] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-[#5f7852]" />
                        {solarDate}
                      </strong>
                    </div>
                  </div>

                  {/* Nơi an táng */}
                  {member.burialPlace && (
                    <p className="text-[11px] text-[#7a6552] truncate mb-2">
                      <span className="font-semibold text-[#5f7852]">Mộ phần:</span> {member.burialPlace}
                    </p>
                  )}
                </div>

                {/* Footer nút thắp hương Từ Đường */}
                <div className="pt-3 border-t border-[#c8963e]/20 flex items-center justify-between text-xs">
                  <span className="text-[#7a6552] text-[11px]">Bấm xem chi tiết</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateTuDuong) onNavigateTuDuong(member);
                    }}
                    className="flex items-center space-x-1 text-[#d75b2c] hover:text-[#b94a20] font-semibold hover:underline"
                  >
                    <Flame className="w-3.5 h-3.5 text-[#d75b2c]" />
                    <span>Dâng Hương</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
