import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, Plus, Edit2, Trash2, Phone, Eye, 
  MapPin, Calendar, User, CheckCircle2, AlertCircle, FileSpreadsheet,
  ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';

export default function MemberList({ members, onSelectMember, onAddMember, onDeleteMember, isAdmin = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGen, setSelectedGen] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Danh sách các đời và chi nhánh có trong dữ liệu
  const generations = useMemo(() => {
    const gens = Array.from(new Set(members.map(m => m.generation))).sort((a, b) => a - b);
    return gens;
  }, [members]);

  const branches = useMemo(() => {
    const bSet = new Set();
    members.forEach(m => {
      if (m.branch) bSet.add(m.branch);
    });
    return Array.from(bSet).sort();
  }, [members]);

  // Bộ lọc dữ liệu
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      // Tìm kiếm từ khóa
      const search = searchTerm.toLowerCase().trim();
      const matchSearch = !search || 
        (m.fullName && m.fullName.toLowerCase().includes(search)) ||
        (m.phone && m.phone.includes(search)) ||
        (m.currentAddress && m.currentAddress.toLowerCase().includes(search)) ||
        (m.honorific && m.honorific.toLowerCase().includes(search));

      // Lọc đời
      const matchGen = selectedGen === 'ALL' || m.generation === Number(selectedGen);

      // Lọc chi
      const matchBranch = selectedBranch === 'ALL' || m.branch === selectedBranch;

      // Lọc giới tính
      const matchGender = selectedGender === 'ALL' || m.gender === selectedGender;

      // Lọc tình trạng
      const matchStatus = selectedStatus === 'ALL' || 
        (selectedStatus === 'ALIVE' && m.isAlive) ||
        (selectedStatus === 'DEAD' && !m.isAlive);

      return matchSearch && matchGen && matchBranch && matchGender && matchStatus;
    }).sort((a, b) => {
      if (a.generation !== b.generation) return a.generation - b.generation;
      return (Number(a.birthYear) || 9999) - (Number(b.birthYear) || 9999);
    });
  }, [members, searchTerm, selectedGen, selectedBranch, selectedGender, selectedStatus]);

  // Phân trang
  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  // Thao tác gọi API backend xuất file .xlsx
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);

      const response = await fetch('/api/export-excel');
      if (!response.ok) {
        throw new Error(`Lỗi tải file: HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Danh_Ba_Dai_Toc_Ho_Quach.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      alert('Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Thanh tiêu đề & Nút Xuất Excel nổi bật (Yêu cầu chính) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#fffaf3] rounded-2xl border border-[#c8963e]/40 shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-serif text-2xl font-bold text-[#5f7852]">
              Danh Bạ Đại Tộc Họ Quách
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#fdf1e3] text-[#d75b2c] border border-[#c8963e]/50 rounded-full">
              {filteredMembers.length} / {members.length} người
            </span>
          </div>
          <p className="text-xs text-[#7a6552] mt-1">
            Quản lý thông tin chi tiết các thế hệ, tra cứu số điện thoại, ngày giỗ, vai vế và quê quán
          </p>
        </div>

        {/* Cụm nút Thao tác chính: Xuất Excel + Thêm thành viên */}
        <div className="flex items-center flex-wrap gap-3">
          {/* NÚT XUẤT EXCEL .XLSX BACKEND API */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition transform active:scale-95 ${
              exportSuccess 
                ? 'bg-[#2e7d32] text-white' 
                : 'bg-gradient-to-r from-[#217346] to-[#1e6b3f] hover:from-[#1b5e37] hover:to-[#175230] text-white'
            }`}
            title="Xuất danh bạ toàn bộ dòng họ Quách sang bảng tính Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-5 h-5 text-[#f6ead0]" />
            <span>
              {isExporting ? 'Đang tạo Excel...' : (exportSuccess ? '✓ Đã Tải Về Thành Công' : '📥 Xuất File Excel (.xlsx)')}
            </span>
          </button>

          {/* Nút Thêm Thành Viên (Chỉ dành cho Quản Trị Viên) */}
          {isAdmin && (
            <button
              onClick={() => onAddMember({ defaultGeneration: 1 })}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#d75b2c] hover:bg-[#b94a20] text-white font-bold text-sm rounded-xl shadow-md transition transform active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm Thành Viên</span>
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc nâng cao */}
      <div className="p-4 bg-[#fffaf3] rounded-xl border border-[#c8963e]/30 shadow-xs flex flex-wrap items-center gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-[#7a6552] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo họ tên, danh xưng, SĐT, nơi ở..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white rounded-lg border border-[#c8963e]/40 focus:border-[#d75b2c] focus:outline-hidden text-[#333333]"
          />
        </div>

        {/* Lọc theo đời */}
        <select
          value={selectedGen}
          onChange={(e) => { setSelectedGen(e.target.value); setCurrentPage(1); }}
          className="px-3 py-1.5 text-sm bg-white rounded-lg border border-[#c8963e]/40 focus:border-[#d75b2c] focus:outline-hidden text-[#333333]"
        >
          <option value="ALL">Mọi thế hệ (10 Đời)</option>
          {generations.map(g => (
            <option key={g} value={g}>Đời thứ {g}</option>
          ))}
        </select>

        {/* Lọc theo chi nhánh */}
        <select
          value={selectedBranch}
          onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
          className="px-3 py-1.5 text-sm bg-white rounded-lg border border-[#c8963e]/40 focus:border-[#d75b2c] focus:outline-hidden text-[#333333]"
        >
          <option value="ALL">Mọi chi nhánh họ</option>
          {branches.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Lọc giới tính */}
        <select
          value={selectedGender}
          onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }}
          className="px-3 py-1.5 text-sm bg-white rounded-lg border border-[#c8963e]/40 focus:border-[#d75b2c] focus:outline-hidden text-[#333333]"
        >
          <option value="ALL">Tất cả giới tính</option>
          <option value="male">Nam giới (Đinh)</option>
          <option value="female">Nữ giới (Dâu/Gái)</option>
        </select>

        {/* Lọc tình trạng */}
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
          className="px-3 py-1.5 text-sm bg-white rounded-lg border border-[#c8963e]/40 focus:border-[#d75b2c] focus:outline-hidden text-[#333333]"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ALIVE">Còn sống</option>
          <option value="DEAD">Đã tạ thế</option>
        </select>

        {/* Số hàng trên trang */}
        <div className="flex items-center space-x-1 text-xs text-[#7a6552]">
          <span>Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 bg-white rounded border border-[#c8963e]/40 text-xs"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={400}>Tất cả</option>
          </select>
        </div>
      </div>

      {/* Bảng danh sách thành viên */}
      <div className="bg-[#fffaf3] rounded-2xl border border-[#c8963e]/40 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#5f7852] to-[#33452b] text-white border-b border-[#c8963e]">
                <th className="py-3 px-3 text-center font-semibold w-12">STT</th>
                <th className="py-3 px-4 font-semibold">Họ và Tên</th>
                <th className="py-3 px-3 font-semibold">Danh Xưng</th>
                <th className="py-3 px-3 text-center font-semibold">Giới Tính</th>
                <th className="py-3 px-3 text-center font-semibold">Đời Thứ</th>
                <th className="py-3 px-4 font-semibold">Chi Nhánh</th>
                <th className="py-3 px-3 font-semibold">Năm Sinh – Mất</th>
                <th className="py-3 px-3 text-center font-semibold">Trạng Thái</th>
                <th className="py-3 px-4 font-semibold">Số Điện Thoại</th>
                <th className="py-3 px-4 font-semibold">Nơi Ở / Quê Quán</th>
                <th className="py-3 px-3 text-center font-semibold w-24">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c8963e]/20">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[#7a6552]">
                    <User className="w-10 h-10 mx-auto text-[#c8963e] opacity-50 mb-2" />
                    <p className="font-medium">Không tìm thấy thành viên phù hợp với bộ lọc</p>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  const isMale = m.gender === 'male';

                  return (
                    <tr 
                      key={m.id}
                      onClick={() => onSelectMember(m)}
                      className="hover:bg-[#fdf1e3] transition cursor-pointer group"
                    >
                      {/* STT */}
                      <td className="py-3 px-3 text-center text-xs font-mono text-[#7a6552]">
                        {globalIndex}
                      </td>

                      {/* Họ tên & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {m.avatar ? (
                            <img 
                              src={m.avatar} 
                              alt={m.fullName} 
                              className="w-9 h-9 rounded-full object-cover border border-[#c8963e]/50 shadow-2xs shrink-0" 
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isMale ? 'bg-[#86c9fb]/30 text-[#1565c0]' : 'bg-[#fba8f3]/30 text-[#c2185b]'
                            }`}>
                              {m.fullName ? m.fullName.charAt(0) : '?'}
                            </div>
                          )}
                          <div>
                            <span className={`font-semibold text-sm ${isMale ? 'text-[#1f2937]' : 'text-[#880e4f]'}`}>
                              {m.fullName}
                            </span>
                            {m.alias && (
                              <p className="text-xs text-[#7a6552] italic">{m.alias}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Danh xưng */}
                      <td className="py-3 px-3 text-xs text-[#5f7852] font-medium">
                        {m.honorific || '—'}
                      </td>

                      {/* Giới tính */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isMale ? 'bg-[#86c9fb]/40 text-[#0d47a1]' : 'bg-[#fba8f3]/40 text-[#880e4f]'
                        }`}>
                          {isMale ? 'Nam' : 'Nữ'}
                        </span>
                      </td>

                      {/* Đời thứ */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-[#c8963e]/20 text-[#6b3f23] text-xs font-bold">
                          Đời {m.generation}
                        </span>
                      </td>

                      {/* Chi nhánh */}
                      <td className="py-3 px-4 text-xs font-medium text-[#445b39]">
                        {m.branch || 'Gốc'}
                      </td>

                      {/* Năm sinh - mất */}
                      <td className="py-3 px-3 text-xs text-[#333333]">
                        {m.birthYear ? `Năm ${m.birthYear}` : '?'} 
                        {!m.isAlive && (
                          <span className="text-[#c62828] ml-1">
                            – {m.deathYear ? `mất ${m.deathYear}` : 'Đã tạ thế'}
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          m.isAlive 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {m.isAlive ? 'Còn sống' : 'Đã mất'}
                        </span>
                      </td>

                      {/* Số điện thoại */}
                      <td className="py-3 px-4 text-xs text-[#333333] font-mono">
                        {m.phone ? (
                          <a 
                            href={`tel:${m.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center space-x-1 text-[#d75b2c] hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{m.phone}</span>
                          </a>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>

                      {/* Địa chỉ */}
                      <td className="py-3 px-4 text-xs text-[#555555] max-w-[200px] truncate" title={m.currentAddress}>
                        {m.currentAddress || '—'}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1 opacity-80 group-hover:opacity-100">
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => onSelectMember(m)}
                                title="Sửa thông tin"
                                className="p-1 text-[#5f7852] hover:text-[#d75b2c] hover:bg-white rounded transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteMember(m.id)}
                                title="Xóa thành viên"
                                className="p-1 text-[#963c19] hover:text-[#c62828] hover:bg-white rounded transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onSelectMember(m)}
                              title="Xem chi tiết hồ sơ"
                              className="p-1 text-[#5f7852] hover:text-[#d75b2c] hover:bg-white rounded transition flex items-center space-x-1 text-xs font-semibold"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Xem</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh chuyển trang */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#fdf1e3] border-t border-[#c8963e]/30 text-xs text-[#7a6552]">
          <div>
            Đang hiển thị <b>{Math.min(filteredMembers.length, (currentPage - 1) * pageSize + 1)}</b> đến <b>{Math.min(filteredMembers.length, currentPage * pageSize)}</b> trên tổng số <b>{filteredMembers.length}</b> thành viên
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#c8963e]/40 bg-white hover:bg-[#fffaf3] disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-[#5f7852] bg-white rounded-lg border border-[#c8963e]/40">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#c8963e]/40 bg-white hover:bg-[#fffaf3] disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
