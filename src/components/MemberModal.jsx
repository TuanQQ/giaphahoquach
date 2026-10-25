import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, User, Heart, Calendar, MapPin, Phone, BookOpen, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';

export default function MemberModal({ member, isNew, allMembers, onClose, onSave, onDelete, onAddChild, isAdmin = true }) {
  const [formData, setFormData] = useState({
    fullName: '',
    honorific: '',
    alias: '',
    gender: 'male',
    generation: 1,
    branch: 'Chi Cụ Nải',
    birthYear: '',
    deathYear: '',
    isAlive: true,
    lunarDeathDay: '',
    lunarDeathMonth: '',
    burialPlace: '',
    fatherId: '',
    motherId: '',
    spouseIds: [],
    birthOrder: 1,
    phone: '',
    currentAddress: '',
    biography: '',
    avatar: ''
  });

  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (isNew) {
      setFormData({
        fullName: '',
        honorific: '',
        alias: '',
        gender: 'male',
        generation: Number(isNew.defaultGeneration) || 1,
        branch: isNew.defaultBranch || 'Chi Cụ Nải',
        birthYear: '',
        deathYear: '',
        isAlive: true,
        lunarDeathDay: '',
        lunarDeathMonth: '',
        burialPlace: '',
        fatherId: isNew.defaultFatherId || '',
        motherId: isNew.defaultMotherId || '',
        spouseIds: [],
        birthOrder: 1,
        phone: '',
        currentAddress: '',
        biography: '',
        avatar: ''
      });
    } else if (member) {
      setFormData({
        ...member,
        fatherId: member.fatherId || '',
        motherId: member.motherId || '',
        spouseIds: member.spouseIds || [],
        lunarDeathDay: member.lunarDeathDay || '',
        lunarDeathMonth: member.lunarDeathMonth || '',
        birthOrder: member.birthOrder || 1,
        generation: member.generation || 1
      });
    }
  }, [member, isNew]);

  const currentFather = allMembers.find(m => m.id === formData.fatherId);

  // Khi chọn hoặc đổi Thân phụ (Cha): Tự động tính Đời = Đời cha + 1 và kế thừa Chi nhánh
  const handleFatherChange = (newFatherId) => {
    const selectedFather = allMembers.find(m => m.id === newFatherId);
    if (selectedFather) {
      setFormData(prev => ({
        ...prev,
        fatherId: newFatherId,
        generation: Number(selectedFather.generation || 1) + 1,
        branch: selectedFather.branch || prev.branch
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        fatherId: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('Vui lòng nhập họ và tên thành viên');
      return;
    }

    // Bảo vệ gia phả: Ngăn ngừa tạo nhầm Đời 1 không có cha mẹ gây đứt đoạn cây phả hệ
    if (isNew && !formData.fatherId && !formData.motherId && Number(formData.generation) === 1) {
      const root1 = allMembers.find(m => Number(m.generation) === 1);
      if (root1) {
        const confirmMsg = `CẢNH BÁO: Gia phả đã có Thuỷ Tổ Đời 1 là "${root1.fullName}".\n\nNếu bạn tạo thêm một người Đời 1 không có cha mẹ, người này sẽ không được nối vào cây phả hệ chung.\n\nBạn có chắc chắn muốn tiếp tục không?`;
        if (!window.confirm(confirmMsg)) {
          return;
        }
      }
    }

    onSave({
      ...formData,
      generation: Number(formData.generation),
      birthOrder: Number(formData.birthOrder),
      lunarDeathDay: formData.lunarDeathDay ? Number(formData.lunarDeathDay) : null,
      lunarDeathMonth: formData.lunarDeathMonth ? Number(formData.lunarDeathMonth) : null,
      fatherId: formData.fatherId || null,
      motherId: formData.motherId || null
    });
  };

  const potentialFathers = allMembers.filter(m => m.gender === 'male' && (!member || m.id !== member.id));
  const potentialMothers = allMembers.filter(m => m.gender === 'female' && (!member || m.id !== member.id));
  const potentialSpouses = allMembers.filter(m => (!member || m.id !== member.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#fffdf9] rounded-2xl shadow-2xl border-2 border-[#c8963e]/40 overflow-hidden my-8">
        
        {/* Header - Gia Phả Đại Việt Palette */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#5f7852] to-[#33452b] text-white border-b border-[#c8963e]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full border border-white/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-white">
                {isNew 
                  ? (currentFather ? `Thêm Con Cho: ${currentFather.fullName}` : 'Thêm Người Vào Gia Phả') 
                  : (formData.fullName || 'Hồ Sơ Thành Viên')}
              </h3>
              <p className="text-xs text-emerald-100">
                {isNew 
                  ? (currentFather 
                      ? `Thân phụ Đời thứ ${currentFather.generation} • Tự động xếp: Đời thứ ${formData.generation} • ${formData.branch}`
                      : 'Vui lòng chọn Thân Phụ để tự động gán thế hệ')
                  : `Đời thứ ${formData.generation} • ${formData.branch || 'Gốc'}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Banner thông báo quan hệ Cha - Con */}
        {isNew && currentFather && (
          <div className="mx-6 mt-3 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2 py-0.5 bg-emerald-700 text-white rounded font-bold">Thân phụ (Cha):</span>
              <span className="font-bold text-emerald-950 text-sm">{currentFather.fullName}</span>
              <span className="text-emerald-800 font-medium">(Đời thứ {currentFather.generation} - {currentFather.branch || 'Gốc'})</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-emerald-800 text-white text-xs font-bold px-3 py-1 rounded-lg">
              <span>Đời của con:</span>
              <span className="text-amber-200 font-extrabold text-sm">Đời thứ {formData.generation}</span>
            </div>
          </div>
        )}

        {isNew && !currentFather && (
          <div className="mx-6 mt-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-2 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lưu ý huyết thống:</span> Chưa chọn Thân Phụ. Hãy chọn Thân Phụ ở mục "Quan Hệ Thân Tộc" hoặc bấm nút <b>"+ Thêm con"</b> trực tiếp trên thẻ của người Cha trên Phả Đồ để tự động gán thế hệ chính xác.
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#e0c088] bg-[#fdf1e3] px-6">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'basic' 
                ? 'border-[#d75b2c] text-[#d75b2c]' 
                : 'border-transparent text-[#7a6552] hover:text-[#333333]'
            }`}
          >
            <User className="w-4 h-4" />
            Thông Tin Chính
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('relations')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'relations' 
                ? 'border-[#d75b2c] text-[#d75b2c]' 
                : 'border-transparent text-[#7a6552] hover:text-[#333333]'
            }`}
          >
            <Heart className="w-4 h-4" />
            Quan Hệ Thân Tộc
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dates')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'dates' 
                ? 'border-[#d75b2c] text-[#d75b2c]' 
                : 'border-transparent text-[#7a6552] hover:text-[#333333]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Sinh Mất & Ngày Giỗ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bio')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'bio' 
                ? 'border-[#d75b2c] text-[#d75b2c]' 
                : 'border-transparent text-[#7a6552] hover:text-[#333333]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Tiểu Sử & Mộ Phần
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#333333] uppercase tracking-wider mb-1">
                    Họ và tên <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="VD: Quách Văn A"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#333333] uppercase tracking-wider mb-1">
                    Danh xưng / Vai vế
                  </label>
                  <input
                    type="text"
                    value={formData.honorific}
                    onChange={e => setFormData({ ...formData, honorific: e.target.value })}
                    placeholder="VD: Cụ Trưởng Họ, Bác Cả, Thuỷ Tổ..."
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#333333] uppercase tracking-wider mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  >
                    <option value="male">Nam (Đinh)</option>
                    <option value="female">Nữ (Thục)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#333333] uppercase tracking-wider mb-1">
                    Đời thứ (1 - 10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.generation}
                    onChange={e => setFormData({ ...formData, generation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#333333] uppercase tracking-wider mb-1">
                    Chi / Nhánh họ
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={e => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="VD: Chi Cụ Nải, Chi Cụ Nhu..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#333333] uppercase tracking-wider mb-1">
                    Tên tự / Biệt hiệu
                  </label>
                  <input
                    type="text"
                    value={formData.alias}
                    onChange={e => setFormData({ ...formData, alias: e.target.value })}
                    placeholder="VD: Nhánh Cụ Nhu"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#333333] uppercase tracking-wider mb-1">
                    Thứ tự sinh (Con thứ mấy)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.birthOrder}
                    onChange={e => setFormData({ ...formData, birthOrder: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333333] uppercase tracking-wider mb-1">
                  Ảnh đại diện / Chân dung (URL hoặc data:image)
                </label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://... hoặc mã base64"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-xs truncate"
                />
              </div>

              <div className="p-3 bg-[#fdf1e3] rounded-xl border border-[#e0c088] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-800 text-sm">Tình trạng thành viên</span>
                  <p className="text-xs text-stone-600">Đánh dấu nếu đã tạ thế để xếp vào sổ giỗ dòng họ</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-emerald-800">
                    <input
                      type="radio"
                      name="isAlive"
                      checked={formData.isAlive === true}
                      onChange={() => setFormData({ ...formData, isAlive: true })}
                      className="accent-emerald-600"
                    />
                    Còn sống
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-[#b94a20]">
                    <input
                      type="radio"
                      name="isAlive"
                      checked={formData.isAlive === false}
                      onChange={() => setFormData({ ...formData, isAlive: false })}
                      className="accent-[#d75b2c]"
                    />
                    Đã tạ thế
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RELATIONS */}
          {activeTab === 'relations' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#d75b2c] shrink-0 mt-0.5" />
                <span>
                  Chọn Cha và Mẹ để hệ thống tự động vẽ đường nối huyết thống từ thế hệ trước, và liên kết Vợ/Chồng để hiển thị song song.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Cha (Thân phụ) {isNew && <span className="text-emerald-700 font-bold">(Khuyên dùng)</span>}
                  </label>
                  <select
                    value={formData.fatherId}
                    onChange={e => handleFatherChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  >
                    <option value="">-- Chưa rõ / Thủy tổ --</option>
                    {potentialFathers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} (Đời {p.generation} - {p.birthYear || '?'})
                      </option>
                    ))}
                  </select>
                  {currentFather && (
                    <p className="mt-1 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tự động gán: Đời thứ {formData.generation} (con của Đời {currentFather.generation})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Mẹ (Thân mẫu)
                  </label>
                  <select
                    value={formData.motherId}
                    onChange={e => setFormData({ ...formData, motherId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  >
                    <option value="">-- Chưa rõ --</option>
                    {potentialMothers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} (Đời {p.generation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Vợ / Chồng (Hôn phối)
                </label>
                <div className="border border-stone-300 rounded-lg p-3 bg-white max-h-48 overflow-y-auto space-y-1.5">
                  {potentialSpouses.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">Chưa có thành viên nào khác trong họ để liên kết</p>
                  ) : (
                    potentialSpouses.slice(0, 80).map(p => {
                      const isSelected = formData.spouseIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer hover:bg-amber-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, spouseIds: [...formData.spouseIds, p.id] });
                              } else {
                                setFormData({ ...formData, spouseIds: formData.spouseIds.filter(id => id !== p.id) });
                              }
                            }}
                            className="accent-[#d75b2c] rounded"
                          />
                          <span>{p.fullName}</span>
                          <span className="text-xs text-stone-400">({p.gender === 'male' ? 'Nam' : 'Nữ'} • Đời {p.generation})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATES */}
          {activeTab === 'dates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Năm sinh (Dương lịch)
                  </label>
                  <input
                    type="text"
                    value={formData.birthYear}
                    onChange={e => setFormData({ ...formData, birthYear: e.target.value })}
                    placeholder="VD: 1800 hoặc 07/02/1800"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Năm mất (Nếu đã tạ thế)
                  </label>
                  <input
                    type="text"
                    value={formData.deathYear}
                    onChange={e => setFormData({ ...formData, deathYear: e.target.value })}
                    placeholder="VD: 1872"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>
              </div>

              {!formData.isAlive && (
                <div className="p-4 bg-[#fdf1e3] rounded-xl border border-[#e0c088] space-y-3">
                  <h4 className="text-sm font-serif font-bold text-[#6b3f23] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#d75b2c]" />
                    Ngày Giỗ Theo Lịch Âm
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Ngày Âm (1 - 30)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.lunarDeathDay}
                        onChange={e => setFormData({ ...formData, lunarDeathDay: e.target.value })}
                        placeholder="VD: 15"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Tháng Âm (1 - 12)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={formData.lunarDeathMonth}
                        onChange={e => setFormData({ ...formData, lunarDeathMonth: e.target.value })}
                        placeholder="VD: 1 (Tháng Giêng)"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BIO & DETAILS */}
          {activeTab === 'bio' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#d75b2c]" />
                  Mộ phần / Nơi an táng
                </label>
                <input
                  type="text"
                  value={formData.burialPlace}
                  onChange={e => setFormData({ ...formData, burialPlace: e.target.value })}
                  placeholder="VD: Nghĩa trang dòng họ Quách..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#d75b2c]" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="VD: 0912 345 678"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    Nơi ở hiện nay / Quê quán
                  </label>
                  <input
                    type="text"
                    value={formData.currentAddress}
                    onChange={e => setFormData({ ...formData, currentAddress: e.target.value })}
                    placeholder="VD: Hà Nội, Hà Tĩnh, TP.HCM..."
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Tiểu sử & ghi chú họ tộc
                </label>
                <textarea
                  rows="4"
                  value={formData.biography}
                  onChange={e => setFormData({ ...formData, biography: e.target.value })}
                  placeholder="Ghi chép công đức, học vị, quan hàm, di nguyện..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#d75b2c] bg-white text-sm"
                ></textarea>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#e0c088] flex items-center justify-between">
            {!isAdmin ? (
              <div className="flex items-center space-x-2 text-xs text-[#7a6552] italic">
                <AlertCircle className="w-4 h-4 text-[#d75b2c]" />
                <span>Chế độ xem con cháu (Chỉ Quản Trị Viên mới có quyền sửa đổi)</span>
              </div>
            ) : (!isNew ? (
              <div className="flex items-center space-x-2">
                {member && member.gender === 'male' && onAddChild && (
                  <button
                    type="button"
                    onClick={() => onAddChild(member)}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition flex items-center gap-1.5"
                    title={`Thêm con cho ${member.fullName}`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm con</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa thành viên "${formData.fullName}" khỏi gia phả?`)) {
                        onDelete(member.id);
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg transition flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>
            ) : <div></div>)}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition"
              >
                {isAdmin ? 'Hủy bỏ' : 'Đóng'}
              </button>
              {isAdmin && (
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#d75b2c] hover:bg-[#b94a20] rounded-lg shadow-md transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Lưu vào gia phả
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
