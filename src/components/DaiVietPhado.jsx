import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Plus, Search, Download, 
  Printer, ChevronDown, Filter, Users, Eye, Image as ImageIcon, FileText,
  FileSpreadsheet, LogIn
} from 'lucide-react';

export default function DaiVietPhado({ 
  members, 
  clan, 
  onSelectMember, 
  onAddMember, 
  isAdmin = true,
  onDownloadExcel,
  onRequireLogin
}) {
  const containerRef = useRef(null);
  const containerId = 'pha-do-canvas';
  const [searchText, setSearchText] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Danh sách các chi nhánh
  const branches = useMemo(() => {
    const set = new Set();
    members.forEach(m => {
      if (m.branch && m.branch !== 'Gốc') set.add(m.branch);
    });
    return Array.from(set).sort();
  }, [members]);

  // Chuyển đổi dữ liệu Họ Quách sang chuẩn TreePersonDto của Gia Phả Đại Việt
  const treePeople = useMemo(() => {
    return members.map(m => {
      const pid = parseInt(m.id.replace('m_', ''), 10);
      const isRoot = m.id === 'm_77081';
      const hasParent = !!(m.fatherId || m.motherId);
      // isFamily = true nếu là người trong tộc họ Quách; false nếu là dâu/rể đứng cạnh bạn đời
      const isFamily = isRoot || hasParent;

      const fid = m.fatherId ? parseInt(m.fatherId.replace('m_', ''), 10) : null;
      const mid = m.motherId ? parseInt(m.motherId.replace('m_', ''), 10) : null;
      const parentId = fid || mid;

      const spIds = (m.spouseIds || []).map(id => parseInt(id.replace('m_', ''), 10)).filter(Boolean);

      return {
        personId: pid,
        rawId: m.id,
        fullName: m.fullName || 'Chưa đặt tên',
        gender: m.gender === 'male' ? 1 : (m.gender === 'female' ? 0 : 2),
        isFamily: isFamily,
        parentId: isFamily ? parentId : null,
        fatherId: fid,
        motherId: mid,
        spouseIds: spIds,
        orderSort: Number(m.birthOrder) || 1,
        generationOrder: Number(m.generation) || 1,
        birthText: m.birthYear ? String(m.birthYear) : '',
        deathText: m.deathYear ? String(m.deathYear) : '',
        isDied: !m.isAlive,
        avatarUrl: m.avatar || '',
        address: m.currentAddress || '',
        branchName: m.branch || 'Gốc',
        honorific: m.honorific || '',
        isHidden: false
      };
    });
  }, [members]);

  // Khởi tạo và vẽ phả đồ bằng window.phadoAdmin
  useEffect(() => {
    if (!window.phadoAdmin || !containerRef.current) return;

    let filteredPeople = treePeople;
    if (selectedBranch !== 'ALL') {
      // Lọc các thành viên thuộc chi được chọn hoặc tổ tiên đời 1-2
      filteredPeople = treePeople.filter(p => 
        p.branchName === selectedBranch || 
        p.generationOrder <= 2 || 
        p.personId === 77081
      );
    }

    const dotNetBridge = {
      invokeMethodAsync: (method, id) => {
        console.log('dotNetBridge invoked:', method, id);
        if (method === 'OnPersonClicked') {
          const rawId = 'm_' + id;
          const found = members.find(m => m.id === rawId || String(m.id).replace('m_', '') === String(id));
          if (found) {
            onSelectMember(found);
          }
        } else if (method === 'OnAddChildClicked') {
          const rawId = 'm_' + id;
          const father = members.find(m => m.id === rawId || String(m.id).replace('m_', '') === String(id));
          if (father && onAddMember) {
            if (onSelectMember) onSelectMember(null);
            onAddMember({
              defaultFatherId: father.id,
              defaultGeneration: Number(father.generation || 1) + 1,
              defaultBranch: father.branch || 'Chi Cụ Nải',
              fatherName: father.fullName
            });
          }
        }
      }
    };

    window.phadoAdmin.render(containerId, { people: filteredPeople }, dotNetBridge, {
      cardStyle: 'default',
      expandAll: true,
      isAdmin: isAdmin
    });

    setIsReady(true);
    if (window.phadoAdmin.visibleCount) {
      setVisibleCount(window.phadoAdmin.visibleCount(containerId));
    }

    return () => {
      if (window.phadoAdmin && window.phadoAdmin.dispose) {
        window.phadoAdmin.dispose(containerId);
      }
    };
  }, [treePeople, selectedBranch, members, onSelectMember, onAddMember, isAdmin]);

  // Các thao tác điều khiển
  const handleZoomIn = () => {
    if (window.phadoAdmin) window.phadoAdmin.zoomBy(containerId, 1.25);
  };

  const handleZoomOut = () => {
    if (window.phadoAdmin) window.phadoAdmin.zoomBy(containerId, 0.8);
  };

  const handleFit = () => {
    if (window.phadoAdmin) window.phadoAdmin.fit(containerId);
  };

  const handleExpandAll = () => {
    if (window.phadoAdmin) {
      window.phadoAdmin.expandAll(containerId);
      setVisibleCount(window.phadoAdmin.visibleCount(containerId));
    }
  };

  const handleCollapseAll = () => {
    if (window.phadoAdmin) {
      window.phadoAdmin.collapseAll(containerId);
      setVisibleCount(window.phadoAdmin.visibleCount(containerId));
    }
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchText(q);
    if (window.phadoAdmin) {
      window.phadoAdmin.search(containerId, q);
    }
  };

  const handleExportPng = async () => {
    if (!window.phadoAdmin) return;
    setIsExporting(true);
    try {
      await window.phadoAdmin.exportPng(containerId, 'Pha_Do_Dai_Toc_Ho_Quach');
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSvg = () => {
    if (window.phadoAdmin) {
      window.phadoAdmin.exportSvg(containerId, 'Pha_Do_Dai_Toc_Ho_Quach');
    }
  };

  const handlePrint = () => {
    if (window.phadoAdmin) {
      window.phadoAdmin.print(containerId);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-270px)] min-h-[720px] bg-[#fdf1e3] rounded-2xl shadow-lg border border-[#c8963e]/40 overflow-hidden">
      {/* Thanh công cụ điều khiển phả đồ thu gọn chuẩn demo475.giaphadaiviet.vn */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#fffaf3] border-b border-[#c8963e]/40 shadow-xs z-10 text-xs">
        
        {/* Nhóm tìm kiếm và lọc chi họ */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Chọn phả đồ */}
          <div className="flex items-center space-x-1.5">
            <label className="text-[#83684c] font-bold text-xs whitespace-nowrap">
              Chọn phả đồ:
            </label>
            <select 
              className="px-2.5 py-1 text-xs font-bold text-[#7d4401] bg-[#fdf1e3] border border-[#d9c6b1] rounded-md focus:border-[#d75b2c] outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="hoquach">họ quách ({members.length} người)</option>
            </select>
          </div>

          {/* Ô tìm kiếm người */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-[#7a6552] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={handleSearch}
              placeholder="Tìm tên thành viên..."
              className="w-full pl-8 pr-6 py-1 text-xs bg-white rounded-md border border-[#c8963e]/50 focus:border-[#d75b2c] focus:outline-hidden text-[#333333] shadow-inner placeholder-[#7a6552]/70"
            />
            {searchText && (
              <button 
                onClick={() => { setSearchText(''); if (window.phadoAdmin) window.phadoAdmin.search(containerId, ''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Lọc theo Chi Họ */}
          <div className="flex items-center space-x-1">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-2 py-1 text-xs bg-white rounded-md border border-[#c8963e]/50 focus:border-[#d75b2c] outline-hidden text-[#333333] cursor-pointer"
            >
              <option value="ALL">Tất cả các chi ({members.length} người)</option>
              {branches.map(b => (
                <option key={b} value={b}>
                  {b} ({members.filter(m => m.branch === b).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nhóm nút thu phóng, mở rộng & thao tác */}
        <div className="flex items-center flex-wrap gap-1.5 ml-auto">
          {/* Nút Thu/Phóng */}
          <div className="flex items-center bg-white rounded-md border border-[#c8963e]/40 p-0.5 shadow-2xs">
            <button
              onClick={handleZoomIn}
              title="Phóng to (+)"
              className="p-1 text-[#5f7852] hover:bg-[#fdf1e3] hover:text-[#d75b2c] rounded transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Thu nhỏ (-)"
              className="p-1 text-[#5f7852] hover:bg-[#fdf1e3] hover:text-[#d75b2c] rounded transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFit}
              title="Vừa màn hình (Fit)"
              className="p-1 text-[#5f7852] hover:bg-[#fdf1e3] hover:text-[#d75b2c] rounded transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Nút Mở rộng / Thu gọn tất cả các đời */}
          <div className="flex items-center bg-white rounded-md border border-[#c8963e]/40 p-0.5 shadow-2xs">
            <button
              onClick={handleExpandAll}
              title="Mở rộng tất cả các đời"
              className="px-2 py-0.5 text-[11px] font-semibold text-[#5f7852] hover:bg-[#fdf1e3] hover:text-[#d75b2c] rounded transition"
            >
              Mở tất cả
            </button>
            <div className="w-[1px] h-3.5 bg-[#c8963e]/30" />
            <button
              onClick={handleCollapseAll}
              title="Thu gọn (về 3 đời đầu)"
              className="px-2 py-0.5 text-[11px] font-semibold text-[#5f7852] hover:bg-[#fdf1e3] hover:text-[#d75b2c] rounded transition"
            >
              Thu gọn
            </button>
          </div>

          {/* Nút Tải ảnh PNG */}
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            title="Tải ảnh phả đồ PNG"
            className="flex items-center space-x-1 px-2 py-1 text-[11px] font-medium bg-[#5f7852] hover:bg-[#445b39] text-white rounded-md shadow-2xs transition"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Đang tạo...' : 'Ảnh PNG'}</span>
          </button>

          {/* Nút Xuất Excel */}
          {onDownloadExcel && (
            <button
              onClick={onDownloadExcel}
              title="Xuất bảng tính Excel (.xlsx) danh bạ toàn tộc"
              className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold bg-[#217346] hover:bg-[#1b5e37] text-white rounded-md shadow-2xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#ffe168]" />
              <span>Xuất Excel</span>
            </button>
          )}

          {/* Nút Đăng Nhập Quản Trị (Nếu chưa đăng nhập) */}
          {!isAdmin && onRequireLogin && (
            <button
              onClick={onRequireLogin}
              title="Đăng nhập dành cho Ban Quản Trị dòng họ"
              className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold bg-[#5f7852] hover:bg-[#445b39] text-white rounded-md shadow-2xs transition"
            >
              <LogIn className="w-3.5 h-3.5 text-[#ffe168]" />
              <span>Quản Trị</span>
            </button>
          )}

          {/* Nút Thêm Thành Viên (Chỉ dành cho Quản Trị Viên) */}
          {isAdmin && (
            <button
              onClick={() => onAddMember({ defaultGeneration: 1 })}
              className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold bg-[#d75b2c] hover:bg-[#b94a20] text-white rounded-md shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Người</span>
            </button>
          )}
        </div>
      </div>

      {/* Vùng vẽ Canvas SVG phả đồ tương tác */}
      <div 
        className="flex-1 w-full h-full relative overflow-hidden bg-[#fffaf3]"
        style={{
          backgroundImage: 'radial-gradient(#c8963e 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div 
          id={containerId}
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#fffaf3]/80 pointer-events-none">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#d75b2c] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-[#5f7852]">Đang tải phả đồ Đại Tộc Họ Quách...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
