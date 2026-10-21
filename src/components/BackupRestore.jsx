import React, { useState } from 'react';
import { Download, Upload, Database, RefreshCw, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export default function BackupRestore({ onRestoreSuccess, isAdmin = true, authToken = "", onRequireLogin }) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState(null);

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleDownloadExcel = () => {
    window.location.href = '/api/export-excel';
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('CẢNH BÁO: Phục hồi dữ liệu sẽ ghi đè lên toàn bộ gia phả hiện tại. Bạn có chắc chắn muốn tiếp tục?')) {
      e.target.value = null;
      return;
    }

    try {
      setIsRestoring(true);
      setMessage(null);

      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': authToken },
        body: JSON.stringify(parsed)
      });

      const result = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Phục hồi thành công ${result.count} thành viên gia phả!` });
        if (onRestoreSuccess) onRestoreSuccess();
      } else {
        setMessage({ type: 'error', text: result.error || 'Có lỗi xảy ra khi phục hồi' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Tệp không hợp lệ: ' + err.message });
    } finally {
      setIsRestoring(false);
      e.target.value = null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#fffaf3] p-6 rounded-2xl border border-[#c8963e]/40 shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-[#fdf1e3] text-[#5f7852] rounded-xl border border-[#c8963e]/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#5f7852]">
              Sao Lưu & Phục Hồi Dữ Liệu
            </h2>
            <p className="text-xs text-[#7a6552]">
              Lưu trữ an toàn cơ sở dữ liệu dòng họ Quách, xuất file Excel danh bạ và khôi phục khi cần thiết
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-400 text-emerald-800' 
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid 2 Thẻ: Sao Lưu JSON & Xuất Excel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thẻ 1: Xuất Excel .xlsx */}
        <div className="bg-[#fffaf3] p-6 rounded-2xl border border-[#c8963e]/40 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-[#217346] mb-2">
              <FileSpreadsheet className="w-5 h-5" />
              <h3 className="font-bold text-base">Bảng Tính Excel (.xlsx)</h3>
            </div>
            <p className="text-xs text-[#7a6552] leading-relaxed">
              Xuất toàn bộ 398 thành viên họ Quách kèm đầy đủ thông tin: họ tên, ngày sinh, đời thứ, chi nhánh, số điện thoại, ngày giỗ âm lịch, nơi an táng.
            </p>
          </div>
          <button
            onClick={handleDownloadExcel}
            className="w-full py-2.5 bg-gradient-to-r from-[#217346] to-[#1e6b3f] hover:from-[#1b5e37] hover:to-[#175230] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Tải Bảng Tính Excel (.xlsx)</span>
          </button>
        </div>

        {/* Thẻ 2: Sao Lưu Dữ Liệu JSON */}
        <div className="bg-[#fffaf3] p-6 rounded-2xl border border-[#c8963e]/40 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-[#5f7852] mb-2">
              <Database className="w-5 h-5" />
              <h3 className="font-bold text-base">Sao Lưu JSON Toàn Bộ</h3>
            </div>
            <p className="text-xs text-[#7a6552] leading-relaxed">
              Tải file sao lưu định dạng JSON chứa toàn bộ dữ liệu phả ký, danh sách thành viên, quan hệ huyết thống và lịch sử dâng hương từ đường.
            </p>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="w-full py-2.5 bg-[#5f7852] hover:bg-[#445b39] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Tải Tệp Sao Lưu (.json)</span>
          </button>
        </div>
      </div>

      {/* Khối Phục Hồi Dữ Liệu */}
      <div className="bg-[#fffaf3] p-6 rounded-2xl border border-dashed border-[#c8963e] shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-[#d75b2c]">
          <Upload className="w-5 h-5" />
          <h3 className="font-bold text-base">Phục Hồi Dữ Liệu Từ File</h3>
        </div>
        <p className="text-xs text-[#7a6552]">
          Chọn file backup định dạng <code>.json</code> để khôi phục dữ liệu dòng họ vào hệ thống.
        </p>
        <div className="flex items-center justify-center">
          {isAdmin ? (
            <label className="cursor-pointer px-6 py-3 bg-[#fdf1e3] hover:bg-[#fde3d2] text-[#d75b2c] font-bold text-xs rounded-xl border border-[#d75b2c]/40 transition flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>{isRestoring ? 'Đang phục hồi...' : 'Chọn file JSON để phục hồi'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isRestoring}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs text-[#7a6552] italic">
                Tính năng phục hồi dữ liệu yêu cầu quyền Quản Trị Viên tối cao
              </span>
              <button
                type="button"
                onClick={onRequireLogin}
                className="px-4 py-2 bg-[#d75b2c] hover:bg-[#b94a20] text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Đăng Nhập Quản Trị Để Sử Dụng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
