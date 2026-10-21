import React, { useState } from 'react';
import { Flame, Sparkles, Heart, Bell, Send, User, Clock, Scroll, Award } from 'lucide-react';

export default function TuDuong({ clan, incenseLogs = [], onOfferIncense }) {
  const [sticks, setSticks] = useState(3);
  const [userName, setUserName] = useState('');
  const [wishes, setWishes] = useState('');
  const [isLighting, setIsLighting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert('Vui lòng nhập họ và tên của bạn');
      return;
    }

    setIsLighting(true);
    setTimeout(() => {
      onOfferIncense({
        userName,
        sticks,
        wishes: wishes || 'Con cháu thành tâm kính bái Tiên Linh Đại Tộc Họ Quách, cầu mong dòng họ vạn đại trường tồn, con cháu bình an đỗ đạt.'
      });
      setIsLighting(false);
      setShowSuccess(true);
      setWishes('');
      setTimeout(() => setShowSuccess(false), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Không Gian Điện Thờ Từ Đường Họ Quách */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#2a1d12] via-[#3d2a1a] to-[#1f150d] border-4 border-[#c8963e] shadow-2xl p-6 md:p-10 text-center text-[#fffaf3]">
        {/* Họa tiết ánh hào quang vàng */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#c8963e]/20 via-transparent to-black/60 pointer-events-none" />

        {/* Bức Hoành Phi & Câu Đối */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-block px-8 py-3 bg-gradient-to-r from-[#6b3f23] via-[#d75b2c] to-[#6b3f23] border-2 border-[#c8963e] rounded-xl shadow-lg">
            <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-white tracking-wider">
              {clan?.hallName || 'TỪ ĐƯỜNG ĐẠI TỘC HỌ QUÁCH'}
            </h1>
            <p className="text-xs text-[#f6ead0] font-serif tracking-widest uppercase mt-1">
              Khởi tổ Quách Văn Trễ (1800) • 10 Thế Hệ Đồng Tộc
            </p>
          </div>

          {/* Câu Đối Truyền Thống */}
          <div className="py-2 flex items-center justify-center space-x-4 text-xs md:text-sm font-serif text-[#edd9b0] italic">
            <span>"Tổ công phụ đức thiên niên thịnh"</span>
            <span className="text-[#c8963e] font-bold">•</span>
            <span>"Tử hiếu tôn hiền vạn đại vinh"</span>
          </div>

          {/* Bài Vị & Bát Hương Tương Tác */}
          <div className="py-6 flex flex-col items-center justify-center">
            {/* Bài vị */}
            <div className="w-52 bg-gradient-to-b from-[#8c6a2a] via-[#6e5120] to-[#2a1d12] border-2 border-[#c8963e] p-4 rounded-t-2xl shadow-2xl mb-1 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#c8963e] border border-white flex items-center justify-center text-[#2a1d12] font-bold text-xs">
                祖
              </div>
              <p className="font-serif text-[10px] text-[#edd9b0] uppercase tracking-widest pt-1">
                Tiên Linh Thượng Tổ
              </p>
              <h3 className="font-serif text-base font-bold text-white my-1">
                ĐẠI TỘC HỌ QUÁCH
              </h3>
              <p className="text-[10px] text-[#edd9b0]/80">Khởi tổ Quách Văn Trễ (1800)</p>
            </div>

            {/* Bát hương với nén nhang phát sáng */}
            <div className="relative flex flex-col items-center">
              {/* Nén Nhang */}
              <div className="flex items-end justify-center gap-2 mb-[-6px] z-10">
                <div className="w-1 h-14 bg-[#c62828] relative">
                  <div className="absolute -top-1 left-0 w-1.5 h-1.5 rounded-full bg-[#ffb300] animate-pulse shadow-md shadow-[#ffb300]" />
                </div>
                <div className="w-1 h-16 bg-[#b71c1c] relative">
                  <div className="absolute -top-1 left-0 w-1.5 h-1.5 rounded-full bg-[#ffb300] animate-pulse shadow-md shadow-[#ffb300]" />
                </div>
                <div className="w-1 h-14 bg-[#c62828] relative">
                  <div className="absolute -top-1 left-0 w-1.5 h-1.5 rounded-full bg-[#ffb300] animate-pulse shadow-md shadow-[#ffb300]" />
                </div>
              </div>

              {/* Bát Hương Đồng */}
              <div className="w-40 h-20 bg-gradient-to-b from-[#d4a95a] via-[#a8802f] to-[#6e5120] rounded-b-3xl border-4 border-[#edd9b0] shadow-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3)_0%,_transparent_70%)]" />
                <span className="font-serif text-3xl font-extrabold text-[#2a1d12] drop-shadow-md">
                  福
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#edd9b0]/80 max-w-lg mx-auto">
            Không gian tâm linh phụng thờ tiên linh dòng họ Quách. Con cháu muôn phương hướng về nguồn cội, dâng nén tâm hương tưởng nhớ công ơn trời biển của các bậc tiền bối.
          </p>
        </div>
      </div>

      {/* Form Dâng Hương & Sổ Cảm Niệm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cột 1: Form Thắp Hương */}
        <div className="bg-[#fffaf3] p-6 rounded-2xl border border-[#c8963e]/40 shadow-md">
          <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-[#c8963e]/30">
            <Flame className="w-5 h-5 text-[#d75b2c]" />
            <h3 className="font-serif text-lg font-bold text-[#5f7852]">
              Dâng Nén Tâm Hương
            </h3>
          </div>

          {showSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-400 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã thắp hương thành công. Lời khấn của bạn đã được ghi vào Sổ Cảm Niệm dòng họ!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Chọn số nén nhang */}
            <div>
              <label className="block text-[#5f7852] font-semibold mb-1.5">Số Nén Tâm Hương:</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSticks(num)}
                    className={`py-2 px-3 rounded-lg border font-semibold transition ${
                      sticks === num
                        ? 'bg-[#d75b2c] text-white border-[#d75b2c] shadow-xs'
                        : 'bg-white text-[#7a6552] border-[#c8963e]/40 hover:bg-[#fdf1e3]'
                    }`}
                  >
                    {num} Nén {num === 1 ? '(Thành Tâm)' : num === 3 ? '(Tam Tài)' : '(Ngũ Hành)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Họ tên người dâng hương */}
            <div>
              <label className="block text-[#5f7852] font-semibold mb-1">Họ và Tên Con Cháu:</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ví dụ: Quách Văn Nghi, Quách Thị Mai..."
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#c8963e]/40 focus:border-[#d75b2c] focus:outline-hidden text-xs text-[#333333]"
                required
              />
            </div>

            {/* Lời nguyện cầu */}
            <div>
              <label className="block text-[#5f7852] font-semibold mb-1">Lời Nguyện / Cảm Niệm:</label>
              <textarea
                value={wishes}
                onChange={(e) => setWishes(e.target.value)}
                rows={3}
                placeholder="Cầu mong tiên tổ phù hộ cho đại gia đình họ Quách an khang, con cháu đỗ đạt, phúc thọ song toàn..."
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#c8963e]/40 focus:border-[#d75b2c] focus:outline-hidden text-xs text-[#333333]"
              />
            </div>

            {/* Nút gửi */}
            <button
              type="submit"
              disabled={isLighting}
              className="w-full py-2.5 bg-gradient-to-r from-[#d75b2c] to-[#b94a20] hover:from-[#b94a20] hover:to-[#963c19] text-white font-bold text-sm rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center space-x-2"
            >
              <Flame className="w-4 h-4" />
              <span>{isLighting ? 'Đang thắp hương...' : 'Thành Tâm Thắp Hương'}</span>
            </button>
          </form>
        </div>

        {/* Cột 2: Sổ Cảm Niệm Dòng Họ */}
        <div className="bg-[#fffaf3] p-6 rounded-2xl border border-[#c8963e]/40 shadow-md flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#c8963e]/30">
            <div className="flex items-center space-x-2">
              <Scroll className="w-5 h-5 text-[#5f7852]" />
              <h3 className="font-serif text-lg font-bold text-[#5f7852]">
                Sổ Cảm Niệm Dòng Họ
              </h3>
            </div>
            <span className="text-xs text-[#7a6552] font-medium">
              {incenseLogs.length} lượt dâng hương
            </span>
          </div>

          {/* Danh sách các con cháu đã dâng hương */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {incenseLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#7a6552] py-8">
                <Heart className="w-8 h-8 text-[#c8963e] opacity-40 mb-2" />
                <p>Chưa có lượt dâng hương nào. Hãy là người đầu tiên dâng nén tâm hương!</p>
              </div>
            ) : (
              incenseLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 bg-[#fdf1e3] rounded-xl border border-[#c8963e]/30 shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-[#d75b2c]" />
                      <strong className="text-[#33452b] font-semibold">{log.userName}</strong>
                      <span className="text-[11px] text-[#7a6552]">({log.sticks} nén nhang)</span>
                    </div>
                    <span className="text-[10px] text-[#7a6552] flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-[#7a6552]" />
                      <span>{new Date(log.createdAt).toLocaleDateString('vi-VN')}</span>
                    </span>
                  </div>
                  <p className="text-stone-600 italic pl-5">"{log.wishes}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
