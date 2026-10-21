import React, { useState } from 'react';
import { BookOpen, Shield, Edit3, Save, Check, Award, History, ScrollText } from 'lucide-react';

export default function PhaKyTocUoc({ clan, onUpdateClan, isAdmin = true }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...clan });

  const handleSave = () => {
    onUpdateClan(formData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Phả Ký */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-[#fffaf3] rounded-2xl border border-[#c8963e]/40 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#fdf1e3] rounded-xl border border-[#c8963e]/40 text-[#d75b2c]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#5f7852]">
              Phả Ký & Tộc Ước Đại Tộc Họ Quách
            </h2>
            <p className="text-xs text-[#7a6552]">
              Ghi chép nguồn cội Thủy tổ Quách Văn Trễ (1800), các chi nhánh và 5 điều Tộc ước răn dạy hậu thế
            </p>
          </div>
        </div>

        {isAdmin && (!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-[#fdf1e3] text-[#5f7852] font-semibold text-xs border border-[#c8963e]/50 rounded-xl shadow-xs transition"
          >
            <Edit3 className="w-4 h-4 text-[#d75b2c]" />
            <span>Chỉnh Sửa Phả Ký</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-semibold text-[#7a6552] hover:bg-stone-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#d75b2c] hover:bg-[#b94a20] text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Phả Ký</span>
            </button>
          </div>
        ))}
      </div>

      {/* Nội dung Phả Ký & Tộc Ước */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phần 1: Phả Ký (2 Cột rộng) */}
        <div className="lg:col-span-2 bg-[#fffaf3] p-7 rounded-2xl border border-[#c8963e]/40 shadow-md space-y-6">
          <div className="flex items-center space-x-2 border-b border-[#c8963e]/30 pb-3">
            <History className="w-5 h-5 text-[#d75b2c]" />
            <h3 className="font-serif text-xl font-bold text-[#33452b]">
              Lời Tựa Phả Ký Họ Quách
            </h3>
          </div>

          {isEditing ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#5f7852] mb-1">Tên Dòng Họ:</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#c8963e]/40 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5f7852] mb-1">Khẩu Hiệu / Hoành Phi:</label>
                <input
                  type="text"
                  value={formData.motto || ''}
                  onChange={e => setFormData({ ...formData, motto: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#c8963e]/40 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5f7852] mb-1">Nội Dung Phả Ký:</label>
                <textarea
                  rows={14}
                  value={formData.history || ''}
                  onChange={e => setFormData({ ...formData, history: e.target.value })}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#c8963e]/40 text-xs font-serif leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="prose prose-stone max-w-none text-sm text-[#333333] leading-relaxed space-y-4 font-serif">
              <div className="p-4 bg-[#fdf1e3] rounded-xl border-l-4 border-[#d75b2c] italic text-xs text-[#6b3f23]">
                "{clan?.motto || 'Tổ công phụ đức thiên niên thịnh — Tử hiếu tôn hiền vạn đại vinh'}"
              </div>
              <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-[#d75b2c] first-letter:mr-2 first-letter:float-left">
                {clan?.history || `Cây có cội mới nở cành xanh ngọn, nước có nguồn mới biển rộng sông dài. Người sinh ra ở đời có tổ có tông, có dòng có họ. Đại tộc Họ Quách trải qua nhiều thế hệ nối tiếp, phụng thờ Thủy tổ Quách Văn Trễ (sinh năm 1800), các cụ thủy tổ đã khai phá, bồi đắp nền móng phúc đức cho con cháu muôn đời.`}
              </p>
              <p>
                Trải qua 10 thế hệ đồng tộc với 398 thành viên, các nhánh họ bao gồm Chi Cụ Nải, Chi Cụ Nhu, Chi Cụ Thấu, Chi Cụ Trực, Chi Cụ Kiến luôn một lòng đoàn kết, tương thân tương ái, gìn giữ gia phong, nêu cao truyền thống hiếu học và trọng chữ nhân nghĩa.
              </p>
            </div>
          )}
        </div>

        {/* Phần 2: 5 Điều Tộc Ước (1 Cột) */}
        <div className="bg-[#fffaf3] p-7 rounded-2xl border border-[#c8963e]/40 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-[#c8963e]/30 pb-3 mb-4">
              <Shield className="w-5 h-5 text-[#5f7852]" />
              <h3 className="font-serif text-lg font-bold text-[#5f7852]">
                5 Điều Tộc Ước Họ Quách
              </h3>
            </div>

            <p className="text-xs text-[#7a6552] mb-4">
              Lời răn dạy của tiền nhân, toàn thể con cháu các thế hệ dòng họ Quách đồng lòng noi theo:
            </p>

            <div className="space-y-3 text-xs">
              {[
                { title: '1. Hiếu Kính Tiên Tổ', desc: 'Chăm sóc phần mộ, phụng thờ chu tất ngày giỗ chạp, không quên nguồn cội.' },
                { title: '2. Đoàn Kết Đồng Tộc', desc: 'Họ hàng thương yêu, nhường nhịn, tương trợ giúp đỡ nhau lúc hoạn nạn khó khăn.' },
                { title: '3. Giữ Gìn Gia Phong', desc: 'Kính trên nhường dưới, sống có nhân nghĩa, trung thực, không làm điều tổn hại danh dự họ.' },
                { title: '4. Khuyến Học Khuyến Tài', desc: 'Chăm lo việc học hành của con trẻ, động viên con cháu đỗ đạt thành danh giúp đời.' },
                { title: '5. Giữ Trọn Chữ Tâm', desc: 'Lấy chữ Đức làm gốc, hành thiện tích phúc, để lại gương sáng cho con cháu mai sau.' }
              ].map((rule, i) => (
                <div key={i} className="p-3 bg-[#fdf1e3] rounded-xl border border-[#c8963e]/30">
                  <h4 className="font-bold text-[#d75b2c] mb-0.5">{rule.title}</h4>
                  <p className="text-[#333333] text-[11px] leading-relaxed">{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#c8963e]/20 text-center">
            <span className="text-[11px] font-semibold text-[#5f7852]">
              Tộc ước được khắc ghi lưu truyền vạn đại
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
