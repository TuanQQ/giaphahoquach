// GIA PHẢ ĐẠI VIỆT — Phả đồ tương tác ở trang quản trị (window.phadoAdmin).
// Vẽ cây từ DANH SÁCH PHẲNG người của một phả đồ (TreePersonDto): nút = người TRONG TỘC nối nhau theo trục dọc parentId,
// dâu/rể (isFamily=false) không đứng thành nút mà nằm cạnh bạn đời. D3 v7 chỉ dùng cho thu phóng/kéo (d3.zoom); phần còn lại là DOM SVG thuần.
// AN TOÀN XSS: mọi chuỗi từ dữ liệu đưa vào SVG qua textContent; URL ảnh qua safeUrl(); id ép số. Không dùng innerHTML với dữ liệu.
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var CARD_W = 104;      // thẻ dọc kiểu v1: ảnh ở trên, tên ở giữa
  var CARD_H = 144;
  var SP_GAP = 3;        // người chính và bạn đời đứng sát nhau
  var GAP_X = 26;        // hở giữa hai nhóm anh em
  var GAP_Y = 64;        // hở dọc giữa các đời (chứa nút +/−)
  var BIG_TREE = 50;    // quá ngưỡng này (số người trong tộc) thì mặc định chỉ mở 3 đời đầu
  var AUTO_DEPTH = 3;
  var MAX_SEARCH = 20;
  // Kích thước khung Ông Tổ & 2 Bà Tổ (Lớn gấp ~4 lần diện tích, trang trọng uy nghi)
  var ROOT_CARD_W = 208;
  var ROOT_CARD_H = 288;
  var ROOT_SP_GAP = 8;

  function isRootPerson(p) {
    if (!p) return false;
    var id = Number(p.personId);
    var gen = Number(p.generationOrder);
    return gen === 1 || id === 77081 || id === 77082 || id === 77083;
  }

  function isRootNode(n) {
    return n && n.p && isRootPerson(n.p);
  }

  function nodeCardW(n) {
    return isRootNode(n) ? ROOT_CARD_W : CARD_W;
  }

  function nodeCardH(n) {
    return isRootNode(n) ? ROOT_CARD_H : CARD_H;
  }


  var COLORS = {
    male: "#86c9fb", female: "#fba8f3", unknown: "#e3d6ae", hidden: "#d4d4d8", hiddenBorder: "#8b8b94",
    selected: "#047857", hit: "#e0a800", link: "#8b8b8b",
    text: "#1f2937", muted: "#4b5563", dead: "#374151", badge: "#2f2f2f"
  };

  // Màu đường nối con ↔ cha/mẹ ngoài tộc: mỗi người vợ/chồng một màu (nút "Nối cha/mẹ ngoài tộc")
  var SPOUSE_LINKS = ["#db2777", "#7c3aed", "#ea580c", "#2563eb", "#ca8a04", "#0891b2"];

  var states = {};

  // Toạ độ nút: n.x = vị trí theo trục ngang (anh em), n.y = vị trí theo trục dọc (đời).
  // Tuỳ chọn hiển thị (trang xuất ảnh): ẩn ngày / vợ chồng / ảnh, giới hạn số đời, cuốn thư, câu đối
  var OPT = {};
  var BANNER_RATIO = 4.5;       // cuốn thư = rồng trái 1000 + giữa 2500 + rồng phải 1000 (tỉ lệ 4,5 : 1 như v1)
  var BANNER_BASE_W = 1400;
  function cfg(model) {
    OPT = (model && model.opts) || {};
  }
  // Toạ độ trên màn hình của tâm nhóm người chính (để giữ nút vừa bấm đứng yên, cuộn tới người được chọn)
  function screenPos(n) {
    return { x: mainX(n), y: n.y + nodeCardH(n) / 2 };
  }

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    if (attrs) { Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); }); }
    if (parent) { parent.appendChild(node); }
    return node;
  }

  // Chỉ nhận http(s):// hoặc đường dẫn gốc "/x"; loại khoảng trắng và ' " ( ) < > \ cùng ký tự điều khiển
  function safeUrl(value) {
    if (value === null || value === undefined) return "";
    var url = String(value).trim();
    if (!url) return "";
    if (/[\s'"()<>\\\x00-\x1f\x7f-\x9f]/.test(url)) return "";
    if (/^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/i.test(url)) return url;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.charAt(0) === "/" && url.charAt(1) !== "/") return url;
    return "";
  }

  // Kiểu v1 (trang in / xuất ảnh): mọi khối cùng màu vàng #fddf6d (người đã mất vẫn vàng, đánh dấu bằng vệt chéo ở góc 5 giờ); kiểu mặc định tô theo giới tính
  var V1_CARD = "#fddf6d";
  function genderColor(p) {
    // Người bị ẩn trên website: thẻ xám (mọi kiểu) để nhìn một cái là biết khác người hiển thị bình thường
    if (p.isHidden) return COLORS.hidden;
    if (OPT.cardStyle === "v1") return V1_CARD;
    return p.gender === 1 ? COLORS.male : (p.gender === 0 ? COLORS.female : COLORS.unknown);
  }

  // Dòng ngày sinh – mất: [sinh] hoặc [sinh, "– mất"]; chưa có thông tin thì rỗng
  function dateParts(p) {
    var b = p.birthText || "";
    if (!p.isDied) return b ? [b] : [];
    return [(b || "?"), "– " + (p.deathText || "?")];
  }

  function norm(text) {
    return String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  }

  // ---------- Dựng mô hình cây ----------
  function build(people) {
    var byId = new Map();
    people.forEach(function (p) { byId.set(p.personId, p); });
    var nodes = new Map();
    people.forEach(function (p) {
      if (p.isFamily) nodes.set(p.personId, { p: p, children: [], spouses: [], parent: null, depth: 0, collapsed: false, x: 0, y: 0, w: 0, gw: 0 });
    });
    nodes.forEach(function (n) {
      var pid = n.p.parentId;
      if (pid && nodes.has(pid) && pid !== n.p.personId) { n.parent = nodes.get(pid); n.parent.children.push(n); }
      n.spouses = (n.p.spouseIds || []).map(function (id) { return byId.get(id); }).filter(function (s) { return s && !s.isFamily; });
    });
    function cmp(a, b) { return (a.p.orderSort - b.p.orderSort) || (a.p.personId - b.p.personId); }
    var roots = [];
    nodes.forEach(function (n) { n.children.sort(cmp); if (!n.parent) roots.push(n); });
    roots.sort(cmp);
    // độ sâu (duyệt có sổ đã-đi-qua)
    var stack = roots.map(function (r) { r.depth = 0; return r; });
    var seen = new Set();
    while (stack.length) {
      var n = stack.pop();
      if (seen.has(n.p.personId)) continue;
      seen.add(n.p.personId);
      n.children.forEach(function (c) { c.depth = n.depth + 1; stack.push(c); });
    }
    return { byId: byId, nodes: nodes, roots: roots };
  }

  function spousesOf(n) { return OPT.hideSpouses ? [] : n.spouses; }
  // Tâm thẻ của NGƯỜI TRONG TỘC (thẻ đầu của nhóm; dâu/rể đứng bên phải). Đường nối cha/con xuất phát và kết thúc ở đây, không phải giữa cả nhóm.
  function mainX(n) {
    var cw = nodeCardW(n);
    return n.x - n.gw / 2 + cw / 2;
  }
  // Cha/mẹ NGOÀI TỘC của người con c (con của người trong tộc n): người kia trong cặp cha–mẹ, phải là một bạn đời đang hiện của n
  function otherParentId(n, c) {
    var pid = n.p.personId, f = c.p.fatherId || null, m = c.p.motherId || null;
    if (f === pid) return m;
    if (m === pid) return f;
    var ids = n.p.spouseIds || [];
    if (f && ids.indexOf(f) >= 0) return f;
    if (m && ids.indexOf(m) >= 0) return m;
    return null;
  }
  function groupWidth(n) {
    var k = spousesOf(n).length;
    var cw = nodeCardW(n);
    var sg = isRootNode(n) ? ROOT_SP_GAP : SP_GAP;
    return (1 + k) * cw + k * sg;
  }
  function depthLimited(n) { return !!OPT.maxGen && n.p.generationOrder >= OPT.maxGen; }
  function isOpen(n) { return !n.collapsed && n.children.length > 0 && !depthLimited(n); }

  function measure(n) {
    n.gw = groupWidth(n);
    if (!isOpen(n)) { n.w = n.gw; return n.w; }
    var sum = 0;
    n.children.forEach(function (c, i) { sum += measure(c) + (i ? GAP_X : 0); });
    n.w = Math.max(n.gw, sum);
    return n.w;
  }

  function place(n, left, depth) {
    n.x = left + n.w / 2;
    if (depth === 0) {
      n.y = 0;
    } else {
      n.y = ROOT_CARD_H + GAP_Y + (depth - 1) * (CARD_H + GAP_Y);
    }
    if (!isOpen(n)) return;
    var total = 0;
    n.children.forEach(function (c, i) { total += c.w + (i ? GAP_X : 0); });
    var cl = left + (n.w - total) / 2;
    n.children.forEach(function (c) { place(c, cl, depth + 1); cl += c.w + GAP_X; });
  }

  function layout(model) {
    cfg(model);
    var left = 0;
    model.roots.forEach(function (r) {
      measure(r);
      place(r, left, 0);
      left += r.w + GAP_X * 2;
    });
  }

  function visibleNodes(model) {
    var out = [];
    var stack = model.roots.slice().reverse();
    while (stack.length) {
      var n = stack.pop();
      out.push(n);
      if (isOpen(n)) { for (var i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]); }
    }
    return out;
  }

  function applyDefaultCollapse(model) {
    if (model.nodes.size <= BIG_TREE) return;
    model.nodes.forEach(function (n) { n.collapsed = n.depth >= AUTO_DEPTH - 1 && n.children.length > 0; });
  }

  // ---------- Vẽ ----------
  // Đo chiều rộng chữ bằng canvas để tên/ngày không bao giờ tràn khỏi thẻ
  var measureCtx = null;
  function textWidth(text, size, weight) {
    if (!measureCtx) { measureCtx = document.createElement("canvas").getContext("2d"); }
    measureCtx.font = weight + " " + size + "px 'Be Vietnam Pro', 'Noto Sans', 'Segoe UI', sans-serif";
    return measureCtx.measureText(text).width;
  }

  // Cắt bớt cho vừa maxW, thêm "…" ở cuối
  function ellipsize(text, maxW, size, weight) {
    if (textWidth(text, size, weight) <= maxW) return text;
    var t = text;
    while (t.length > 1 && textWidth(t + "…", size, weight) > maxW) { t = t.slice(0, -1); }
    return t.trim() + "…";
  }

  // Xuống dòng theo chiều rộng thật (tối đa maxLines); dòng cuối còn dư thì cắt "…"
  function wrapName(text, maxW, size, weight, maxLines) {
    var words = String(text || "").split(/\s+/).filter(Boolean);
    var lines = [];
    var cur = "";
    for (var i = 0; i < words.length; i++) {
      var next = cur ? cur + " " + words[i] : words[i];
      if (!cur || textWidth(next, size, weight) <= maxW) { cur = next; continue; }
      lines.push(cur);
      cur = words[i];
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1] + "…";
    }
    return lines.map(function (line) { return ellipsize(line, maxW, size, weight); });
  }

  
  function drawRootCard(g, p, x, y, st, isSpouse, uid) {
    var isMale = p.gender === 1;
    var sel = st.selectedId === p.personId;
    var hit = st.hits && st.hits.has(p.personId);
    var w = ROOT_CARD_W; // 208
    var h = ROOT_CARD_H; // 288
    var pid = Number(p.personId);

    var card = el("g", { 
      "data-id": String(pid), 
      "data-kind": isSpouse ? "spouse" : "main", 
      class: isMale ? "card-person card-male card-root" : "card-person card-root", 
      style: "cursor:pointer" 
    }, g);

    // 1. Nền hoàng gia trang trọng & Viền vàng cổ điển
    var borderColor = sel ? "#B91C1C" : (hit ? COLORS.hit : "#B45309");
    var borderWidth = sel || hit ? 3.5 : 2.8;

    // Nền chính
    el("rect", {
      x: x, y: y, width: w, height: h, rx: 4,
      fill: "#FEF3C7", stroke: borderColor, "stroke-width": borderWidth
    }, card);

    // Viền chỉ vàng sang trọng bên trong
    el("rect", {
      x: x + 4, y: y + 4, width: w - 8, height: h - 8, rx: 2.5,
      fill: "none", stroke: "#D97706", "stroke-width": 1.2,
      "stroke-dasharray": "8 3"
    }, card);

    // 2. Bốn góc hoa văn mạ vàng truyền thống hoàng gia cỡ lớn
    el("use", { href: "#root-corner", transform: "translate(" + x + "," + y + ")" }, card);
    el("use", { href: "#root-corner", transform: "translate(" + (x + w) + "," + y + ") scale(-1, 1)" }, card);
    el("use", { href: "#root-corner", transform: "translate(" + x + "," + (y + h) + ") scale(1, -1)" }, card);
    el("use", { href: "#root-corner", transform: "translate(" + (x + w) + "," + (y + h) + ") scale(-1, -1)" }, card);

    // 3. Dải hoành phi danh hiệu hoàng gia màu đỏ son viền vàng ở trên cùng
    var titleText = "THUỶ TỔ";
    var subText = "Khởi Tổ Dòng Họ";
    if (pid === 77081 || isMale) {
      titleText = "THUỶ TỔ KHẢO";
      subText = "Khởi Tổ Dòng Họ Quách";
    } else if (pid === 77082 || (p.fullName && p.fullName.includes("Hơn"))) {
      titleText = "THUỶ TỔ TỶ (BÀ CẢ)";
      subText = "Chính Thất Cụ Thuỷ Tổ";
    } else if (pid === 77083 || (p.fullName && p.fullName.includes("Trình"))) {
      titleText = "THUỶ TỔ TỶ (BÀ HAI)";
      subText = "Kế Thất Cụ Thuỷ Tổ";
    }

    var ribbonW = 156;
    var ribbonH = 22;
    var ribbonX = x + (w - ribbonW) / 2;
    el("rect", {
      x: ribbonX, y: y - 8, width: ribbonW, height: ribbonH, rx: 3,
      fill: "#991B1B", stroke: "#D97706", "stroke-width": 1.2
    }, card);
    var tRibbon = el("text", {
      x: x + w / 2, y: y + 7, "text-anchor": "middle",
      "font-size": 11, "font-weight": 700, fill: "#FEF3C7",
      "letter-spacing": "0.5"
    }, card);
    tRibbon.textContent = titleText;

    // 4. Huy hiệu Đời 1 hình ấn triện tròn đỏ viền vàng ở góc trên bên trái
    var bg = el("g", { transform: "translate(" + (x + 18) + "," + (y + 18) + ")" }, card);
    el("circle", { cx: 0, cy: 0, r: 11, fill: "#991B1B", stroke: "#D97706", "stroke-width": 1.2 }, bg);
    var gen = el("text", { x: 0, y: 3.5, "text-anchor": "middle", "font-size": 9, "font-weight": 700, fill: "#FFFFFF" }, bg);
    gen.textContent = "ĐỜI 1";

    // 5. Khung chân dung Avatar cỡ lớn trang trọng
    var showAvatar = !OPT.hideAvatars;
    var aw = 124, ah = 132, ax = x + 42, ay = y + 26;
    var clip = "av-root-" + uid + "-" + pid;
    var cp = el("clipPath", { id: clip }, card);
    el("rect", { x: ax, y: ay, width: aw, height: ah, rx: 3 }, cp);
    // Viền khung tranh màu đồng cổ
    el("rect", { x: ax - 1.5, y: ay - 1.5, width: aw + 3, height: ah + 3, rx: 4, fill: "#B45309" }, card);
    el("rect", { x: ax, y: ay, width: aw, height: ah, rx: 3, fill: "#E2E8F0" }, card);

    var url = safeUrl(p.avatarUrl || p.avatar);
    if (url && showAvatar) {
      var img = el("image", {
        x: ax, y: ay, width: aw, height: ah,
        preserveAspectRatio: "xMidYMid slice", "clip-path": "url(#" + clip + ")"
      }, card);
      img.setAttribute("href", url);
    } else {
      // Hình bóng đại diện tổ tiên trang nghiêm
      el("circle", { cx: ax + aw / 2, cy: ay + 46, r: 25, fill: isMale ? "#475569" : "#64748B", "clip-path": "url(#" + clip + ")" }, card);
      el("path", {
        d: "M " + (ax + 18) + "," + (ay + ah + 5) + " C " + (ax + 18) + "," + (ay + 85) + " " + (ax + 36) + "," + (ay + 75) + " " + (ax + aw / 2) + "," + (ay + 75) + " C " + (ax + aw - 36) + "," + (ay + 75) + " " + (ax + aw - 18) + "," + (ay + 85) + " " + (ax + aw - 18) + "," + (ay + ah + 5) + " Z",
        fill: isMale ? "#475569" : "#64748B", "clip-path": "url(#" + clip + ")"
      }, card);
    }

    // 6. Tên thành viên cỡ lớn, font chữ có chân uy nghi
    var cx2 = x + w / 2;
    var tName = el("text", {
      x: cx2, y: y + 184, "text-anchor": "middle",
      "font-size": 17, "font-weight": 700, "font-family": "'Noto Serif', serif",
      fill: "#78350F"
    }, card);
    tName.textContent = p.fullName || "";

    // Danh xưng phụ / vai vế
    var tSub = el("text", {
      x: cx2, y: y + 202, "text-anchor": "middle",
      "font-size": 11.5, "font-weight": 600, fill: "#92400E"
    }, card);
    tSub.textContent = subText;

    // Đường chỉ kẻ phân cách hoa văn
    el("path", {
      d: "M " + (x + 36) + "," + (y + 211) + " L " + (x + w - 36) + "," + (y + 211),
      stroke: "#D97706", "stroke-width": 0.8, "stroke-dasharray": "4 2"
    }, card);

    // 7. Năm sinh - năm mất
    var birth = p.birthText || (p.birthYear ? String(p.birthYear) : "");
    var death = p.deathText || (p.deathYear ? String(p.deathYear) : "");
    var yearText = "";
    if (birth && death) yearText = "Sinh: " + birth + "  ·  Mất: " + death;
    else if (death) yearText = "Năm mất: " + death;
    else if (birth) yearText = "Năm sinh: " + birth;
    else yearText = "Hậu duệ đời thứ nhất";

    var tYears = el("text", {
      x: cx2, y: y + 228, "text-anchor": "middle",
      "font-size": 11, "font-weight": 500, fill: "#78350F"
    }, card);
    tYears.textContent = yearText;

    // Ngày giỗ / Chi
    var noteText = "";
    if (pid === 77081 || isMale) {
      noteText = "Ngày giỗ: 07/02 (Âm lịch)";
    } else if (pid === 77082 || (p.fullName && p.fullName.includes("Hơn"))) {
      noteText = "Mẹ sinh ra Chi Cả Nôi";
    } else if (pid === 77083 || (p.fullName && p.fullName.includes("Trình"))) {
      noteText = "Mẹ sinh ra Chi Cụ Trực, Nhu";
    }
    var tNote = el("text", {
      x: cx2, y: y + 246, "text-anchor": "middle",
      "font-size": 11, "font-weight": 600, fill: "#991B1B"
    }, card);
    tNote.textContent = noteText;

    // Mộ phần
    var burial = (p.address && p.address !== "Họ Quách") ? p.address : "Nghĩa trang dòng họ Quách";
    var tBurial = el("text", {
      x: cx2, y: y + 264, "text-anchor": "middle",
      "font-size": 10.5, fill: "#4B5563"
    }, card);
    tBurial.textContent = burial;

    // 8. Nút Con Mắt Xem Nhanh
    var btnEye = el("g", { class: "btn-eye-icon", "data-action": "view-details", "data-id": String(pid), style: "cursor:pointer" }, card);
    el("rect", { x: x + w - 28, y: y + 4, width: 24, height: 20, rx: 3, fill: "#FFFFFF", stroke: "#B45309", "stroke-width": 1 }, btnEye);
    var eyeG = el("g", { transform: "translate(" + (x + w - 28 + 4.5) + "," + (y + 4 + 4) + ")" }, btnEye);
    el("path", { d: "M 1 6 C 4 2, 11 2, 15 6 C 11 10, 4 10, 1 6 Z", fill: "none", stroke: "#78350F", "stroke-width": 1.5, "stroke-linejoin": "round" }, eyeG);
    el("circle", { cx: 8, cy: 6, r: 2.7, fill: "#78350F" }, eyeG);

    // 9. Nút Dấu Cộng (+) khi Hover (cho cụ Ông)
    var showAddChild = isMale && !st.printMode;
    if (showAddChild) {
      var btnAddChild = el("g", {
        class: "btn-hover-add",
        "data-add-child": String(pid),
        transform: "translate(" + (x + w - 16) + "," + (y + 14) + ")",
        style: "cursor:pointer"
      }, card);

      el("circle", {
        cx: 0, cy: 0, r: 13,
        fill: "#2e7d32", stroke: "#ffffff", "stroke-width": 2,
        "data-add-child": String(pid)
      }, btnAddChild);

      el("path", {
        d: "M -6,0 L 6,0 M 0,-6 L 0,6",
        stroke: "#ffffff", "stroke-width": 2.6, "stroke-linecap": "round",
        "data-add-child": String(pid)
      }, btnAddChild);

      var tipAdd = el("title", {}, btnAddChild);
      tipAdd.textContent = "Thêm con cho " + (p.fullName || "Cụ Thuỷ Tổ") + " (Tự động gán Đời 2)";
    }

    var tip = el("title", {}, card);
    tip.textContent = (p.fullName || "") + " · " + titleText + " · Đời 1";
    return card;
  }

  function drawCard(g, p, x, y, st, isSpouse, uid) {
    if (isRootPerson(p)) {
      return drawRootCard(g, p, x, y, st, isSpouse, uid);
    }
    var isMale = p.gender === 1;
    var sel = st.selectedId === p.personId;
    var hit = st.hits && st.hits.has(p.personId);
    var card = el("g", { 
      "data-id": String(Number(p.personId)), 
      "data-kind": isSpouse ? "spouse" : "main", 
      class: isMale ? "card-person card-male" : "card-person", 
      style: "cursor:pointer" 
    }, g);

    // 1. Thân thẻ: Màu vàng hoàng gia quý phái #FDDF6D, viền cam sang trọng #E37A32 (hoặc viền nổi khi chọn)
    var color = p.isHidden ? COLORS.hidden : "#FDDF6D";
    var borderColor = sel ? "#B91C1C" : (hit ? COLORS.hit : (p.isHidden ? COLORS.hiddenBorder : "#E37A32"));
    var borderWidth = sel || hit ? 2.5 : 1.2;

    var cardAttrs = {
      x: x, y: y, width: CARD_W, height: CARD_H, rx: 1.5, fill: color,
      stroke: borderColor, "stroke-width": borderWidth
    };
    if (p.isHidden && !sel && !hit) {
      cardAttrs["stroke-dasharray"] = "4 3";
    }
    el("rect", cardAttrs, card);

    // 2. Bốn góc hoa văn truyền thống sắc nét chuẩn mẫu
    el("use", { href: "#card-corner", transform: "translate(" + x + "," + y + ")" }, card);
    el("use", { href: "#card-corner", transform: "translate(" + (x + CARD_W) + "," + y + ") scale(-1, 1)" }, card);
    el("use", { href: "#card-corner", transform: "translate(" + x + "," + (y + CARD_H) + ") scale(1, -1)" }, card);
    el("use", { href: "#card-corner", transform: "translate(" + (x + CARD_W) + "," + (y + CARD_H) + ") scale(-1, -1)" }, card);

    // 3. Khung ảnh Avatar ở giữa (tỷ lệ & vị trí chuẩn xác theo mẫu)
    var showAvatar = !OPT.hideAvatars;
    if (showAvatar) {
      var aw = 64, ah = 68, ax = x + 20, ay = y + 8;
      var url = safeUrl(p.avatarUrl || p.avatar);
      var clip = "av-" + uid + "-" + Number(p.personId);
      var cp = el("clipPath", { id: clip }, card);
      el("rect", { x: ax, y: ay, width: aw, height: ah, rx: 1.5 }, cp);
      el("rect", { x: ax, y: ay, width: aw, height: ah, rx: 1.5, fill: "#DDE2E8" }, card);

      if (url) {
        var img = el("image", { x: ax, y: ay, width: aw, height: ah, preserveAspectRatio: "xMidYMid slice", "clip-path": "url(#" + clip + ")" }, card);
        img.setAttribute("href", url);
      } else {
        // Hình đại diện người xám: đầu tròn + vai cong tự nhiên
        el("circle", { cx: ax + 32, cy: ay + 25, r: 12, fill: "#5A626E", "clip-path": "url(#" + clip + ")" }, card);
        el("path", {
          d: "M " + (ax + 7) + "," + (ay + 65) + " C " + (ax + 7) + "," + (ay + 46) + " " + (ax + 17) + "," + (ay + 40) + " " + (ax + 32) + "," + (ay + 40) + " C " + (ax + 47) + "," + (ay + 40) + " " + (ax + 57) + "," + (ay + 46) + " " + (ax + 57) + "," + (ay + 65) + " Z",
          fill: "#5A626E", "clip-path": "url(#" + clip + ")"
        }, card);
      }
    }

    // 4. Tên thành viên bên dưới ảnh
    var textW = CARD_W - 10;
    var cx2 = x + CARD_W / 2;
    var fsName = 11.5;
    var lines = wrapName(p.fullName, textW, fsName, 600, 2);
    var parts = OPT.hideDates ? [] : dateParts(p);
    if (parts.length === 2 && textWidth(parts[0] + " " + parts[1], 9.5, 400) <= textW) { parts = [parts[0] + " " + parts[1]]; }
    var nameTop = showAvatar ? y + 94 : y + (CARD_H - lines.length * 15 - parts.length * 12) / 2 + 12;

    lines.forEach(function (line, i) {
      var t = el("text", { x: cx2, y: nameTop + i * 13, "text-anchor": "middle", "font-size": fsName, "font-weight": 600, fill: "#111827" }, card);
      t.textContent = line;
    });

    // Năm sinh - mất (nếu có thông tin) - hiển thị bám đáy thẻ trang trọng
    parts.forEach(function (part, i) {
      var ty = el("text", { x: cx2, y: y + CARD_H - 8 - (parts.length - 1 - i) * 11, "text-anchor": "middle", "font-size": 9.5, fill: "#78350F" }, card);
      ty.textContent = ellipsize(part, textW, 9.5, 400);
    });

    // 5. Huy hiệu Đời (Góc trên bên trái: hình tròn trắng viền xám)
    var bg = el("g", { transform: "translate(" + (x + 11) + "," + (y + 12) + ")" }, card);
    el("circle", { cx: 0, cy: 0, r: 9, fill: "#FFFFFF", stroke: "#888888", "stroke-width": 0.9 }, bg);
    var gen = el("text", { x: 0, y: 3.5, "text-anchor": "middle", "font-size": 10.5, "font-weight": 700, fill: "#111827" }, bg);
    gen.textContent = String(Number(p.generationOrder));

    // 6. Nút Con Mắt Xem Nhanh (Góc trên bên phải: ô trắng bo góc + icon 👁️)
    var btnEye = el("g", { class: "btn-eye-icon", "data-action": "view-details", "data-id": String(Number(p.personId)), style: "cursor:pointer" }, card);
    el("rect", { x: x + CARD_W - 23, y: y + 2, width: 21, height: 17, rx: 2, fill: "#FFFFFF", stroke: "#B0B5BA", "stroke-width": 0.8 }, btnEye);
    var eyeG = el("g", { transform: "translate(" + (x + CARD_W - 23 + 3.5) + "," + (y + 2 + 3.5) + ")" }, btnEye);
    el("path", { d: "M 1 5 C 3.5 1.5, 10.5 1.5, 13 5 C 10.5 8.5, 3.5 8.5, 1 5 Z", fill: "none", stroke: "#4A5568", "stroke-width": 1.4, "stroke-linejoin": "round" }, eyeG);
    el("circle", { cx: 7, cy: 5, r: 2.4, fill: "#4A5568" }, eyeG);

    // 7. NÚT DẤU CỘNG (+) XUẤT HIỆN Ở GÓC TRÊN BÊN PHẢI KHI HOVER VÀO NGƯỜI ĐÀN ÔNG
    var showAddChild = isMale && !st.printMode;
    if (showAddChild) {
      var btnAddChild = el("g", {
        class: "btn-hover-add",
        "data-add-child": String(Number(p.personId)),
        transform: "translate(" + (x + CARD_W - 12.5) + "," + (y + 10.5) + ")",
        style: "cursor:pointer"
      }, card);

      // Nút tròn xanh viền trắng nổi bật
      el("circle", {
        cx: 0, cy: 0, r: 10.5,
        fill: "#2e7d32", stroke: "#ffffff", "stroke-width": 1.8,
        "data-add-child": String(Number(p.personId))
      }, btnAddChild);

      // Icon dấu cộng (+) trắng đậm nét
      el("path", {
        d: "M -5,0 L 5,0 M 0,-5 L 0,5",
        stroke: "#ffffff", "stroke-width": 2.2, "stroke-linecap": "round",
        "data-add-child": String(Number(p.personId))
      }, btnAddChild);

      var tipAdd = el("title", {}, btnAddChild);
      tipAdd.textContent = "Thêm con cho " + (p.fullName || "người này") + " (Tự động gán Đời " + (Number(p.generationOrder) + 1) + ")";
    }

    var tip = el("title", {}, card);
    tip.textContent = (p.fullName || "") + " · Đời " + Number(p.generationOrder) + (p.isHidden ? " · Ẩn trên website" : "");
    return card;
  }

  function draw(st) {
    cfg(st.model);
    var g = st.g;
    while (g.firstChild) g.removeChild(g.firstChild);

    // Thêm defs chứa hoa văn góc truyền thống và style hover nút (+)
    var defs = el("defs", {}, g);
    var styleNode = el("style", {}, defs);
    styleNode.textContent = `
      .btn-hover-add {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      .card-male:hover .btn-hover-add,
      .btn-hover-add:hover {
        opacity: 1 !important;
        pointer-events: all !important;
      }
      .card-male:hover .btn-eye-icon {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease;
      }
      .btn-hover-add:hover circle {
        fill: #1b5e20 !important;
        stroke: #ffe082 !important;
      }
    `;
    
    var rCorner = el("g", { id: "root-corner" }, defs);
    el("path", { d: "M 0,0 L 28,0 L 28,4 L 10,4 L 10,10 L 4,10 L 4,28 L 0,28 Z", fill: "#B45309" }, rCorner);
    el("path", { d: "M 4,4 L 24,4 L 24,6 L 8,6 L 8,8 L 6,8 L 6,24 L 4,24 Z", fill: "#F59E0B" }, rCorner);
    el("rect", { x: 10, y: 10, width: 6, height: 6, rx: 1, fill: "#B45309" }, rCorner);
    el("circle", { cx: 18, cy: 18, r: 2.5, fill: "#D97706" }, rCorner);

    var corner = el("g", { id: "card-corner" }, defs);
    el("path", {
      d: "M -2,3 L 0,3 L 0,0 L 3,0 L 3,-2 L 6,-2 L 6,0 L 19,0 L 19,2.5 L 14,2.5 L 14,4.5 L 7,4.5 L 7,14 L 4.5,14 L 4.5,19 L 2,19 L 2,6 L 0,6 L 0,3 L -2,3 Z",
      fill: "#E37A32"
    }, corner);
    el("rect", { x: 6, y: 6, width: 3.5, height: 3.5, rx: 0.5, fill: "#E37A32" }, corner);
    el("circle", { cx: 11.5, cy: 11.5, r: 1.5, fill: "#E37A32" }, corner);

    var nodes = visibleNodes(st.model);
    drawDecor(st, g);
    var links = el("g", { fill: "none", stroke: COLORS.link, "stroke-width": 1.5 }, g);
    nodes.forEach(function (n) {
      if (!isOpen(n)) return;
      // Từ người trong tộc (thẻ đầu của nhóm) xuống người con trong tộc — không căn giữa cả nhóm có dâu/rể
      var px = mainX(n);
      var cs = n.children.map(mainX);
      var lo = Math.min.apply(null, cs.concat([px])), hi = Math.max.apply(null, cs.concat([px]));
      var y1 = n.y + nodeCardH(n), ym = y1 + GAP_Y / 2;
      var d = "M" + px + "," + y1 + "V" + ym + "M" + lo + "," + ym + "H" + hi;
      n.children.forEach(function (c) { d += "M" + mainX(c) + "," + ym + "V" + c.y; });
      el("path", { d: d }, links);
    });
    // Nút "Nối cha/mẹ ngoài tộc": thêm đường màu từ từng người vợ/chồng xuống đúng các con của người đó
    if (st.parentLinks && !OPT.hideSpouses) {
      var plinks = el("g", { fill: "none", "stroke-width": 1.5 }, g);
      nodes.forEach(function (n) { drawSpouseLinks(plinks, n); });
    }
    var cards = el("g", {}, g);
    var uid = ++st.uid;
    nodes.forEach(function (n) {
      var start = n.x - n.gw / 2;
      var isR = isRootNode(n);
      var cw = isR ? ROOT_CARD_W : CARD_W;
      var ch = isR ? ROOT_CARD_H : CARD_H;
      var sg = isR ? ROOT_SP_GAP : SP_GAP;

      function cardAt(i) {
        return { x: start + i * (cw + sg), y: n.y };
      }
      var c0 = cardAt(0);
      drawCard(cards, n.p, c0.x, c0.y, st, false, uid);
      spousesOf(n).forEach(function (sp, i) {
        var ci = cardAt(i + 1);
        drawCard(cards, sp, ci.x, ci.y, st, true, uid);
      });
      if (n.children.length > 0 && !depthLimited(n)) {
        var bx = mainX(n);
        var by = n.y + ch + 13;
        var btn = el("g", { "data-toggle": String(Number(n.p.personId)), style: "cursor:pointer" }, cards);
        el("circle", { cx: bx, cy: by, r: 11, fill: "#fff", stroke: COLORS.link, "stroke-width": 1.5 }, btn);
        var label = el("text", { x: bx, y: by + 4, "text-anchor": "middle", "font-size": n.collapsed ? 10 : 15, "font-weight": 700, fill: COLORS.text }, btn);
        label.textContent = n.collapsed ? String(n.children.length) : "−";
      }
    });
    st.visibleCount = nodes.length;
  }

  // Đường nối con với cha/mẹ ngoài tộc: từ đáy thẻ người vợ/chồng xuống từng người con của họ, mỗi người m���t màu, chấm tròn ở chân thẻ để biết đường của ai.
  // Chạy thấp hơn đường nối chính và đổ vào thẻ con lệch phải một chút để không đè lên đường của người trong tộc.
  function drawSpouseLinks(layer, n) {
    if (!isOpen(n)) return;
    var spouses = spousesOf(n);
    if (spouses.length === 0) return;
    var byIndex = {};
    n.children.forEach(function (c) {
      var oid = otherParentId(n, c);
      if (!oid) return;
      for (var i = 0; i < spouses.length; i++) {
        if (spouses[i].personId === oid) { (byIndex[i] = byIndex[i] || []).push(c); break; }
      }
    });
    var idxs = Object.keys(byIndex).map(Number).sort(function (a, b) { return a - b; });
    if (idxs.length === 0) return;
    var y1 = n.y + nodeCardH(n);
    var start = n.x - n.gw / 2;
    var cw = nodeCardW(n);
    var sg = isRootNode(n) ? ROOT_SP_GAP : SP_GAP;
    var step = Math.min(6, 16 / idxs.length);
    idxs.forEach(function (idx, order) {
      var kids = byIndex[idx];
      var color = SPOUSE_LINKS[idx % SPOUSE_LINKS.length];
      var sx = start + (idx + 1) * (cw + sg) + cw / 2;
      var yl = y1 + GAP_Y / 2 + 8 + order * step;
      var off = Math.min(24, 6 * (order + 1));
      var xs = kids.map(function (c) { return mainX(c) + off; });
      var lo = Math.min.apply(null, xs.concat([sx])), hi = Math.max.apply(null, xs.concat([sx]));
      var d = "M" + sx + "," + y1 + "V" + yl + "M" + lo + "," + yl + "H" + hi;
      kids.forEach(function (c) { d += "M" + (mainX(c) + off) + "," + yl + "V" + c.y; });
      var path = el("path", { d: d, stroke: color }, layer);
      var tip = el("title", {}, path);
      tip.textContent = (spouses[idx].fullName || "") + " — " + kids.length + " con";
      el("circle", { cx: sx, cy: y1, r: 3.5, fill: color, stroke: "none" }, layer);
    });
  }

  // Khung ôm riêng phần cây (chưa tính cuốn thư / câu đối)
  function treeBox(st) {
    cfg(st.model);
    var nodes = visibleNodes(st.model);
    if (!nodes.length) return { x: 0, y: 0, w: 1, h: 1 };
    var minC = Infinity, maxC = -Infinity, maxD = 0;
    nodes.forEach(function (n) {
      minC = Math.min(minC, n.x - n.gw / 2);
      maxC = Math.max(maxC, n.x + n.gw / 2);
      maxD = Math.max(maxD, n.y + nodeCardH(n) + 30);
    });
    return { x: minC - 20, y: -20, w: maxC - minC + 40, h: maxD + 40 };
  }

  function capitalize(word) { return word.charAt(0).toUpperCase() + word.slice(1); }

  // Vị trí cuốn thư (phía trên cây, căn giữa) và hai câu đối (hai bên cây, chỉ khi vẽ dọc)
  function decorLayout(st) {
    var tb = treeBox(st);
    var out = { tb: tb, banner: null, couplet: null };
    var bn = OPT.banner;
    if (bn && bn.on) {
      var scale = Math.max(0.1, Math.min(3, Number(bn.scale) || 1));
      var bw = BANNER_BASE_W * scale, bh = bw / BANNER_RATIO;
      out.banner = { x: tb.x + tb.w / 2 - bw / 2, y: tb.y - bh - 10, w: bw, h: bh, url: safeUrl(bn.url) || "/images/banner-default.png" };
    }
    var cp = OPT.couplet;
    if (cp && cp.on) {
      var fs = Math.max(10, Math.min(80, (Number(cp.size) || 18) * 2));
      var left = String(cp.left || "").trim().split(/\s+/).filter(Boolean);
      var right = String(cp.right || "").trim().split(/\s+/).filter(Boolean);
      var hgt = Math.max(left.length, right.length) * fs * 2;
      out.couplet = { fs: fs, left: left, right: right, lx: tb.x - fs - 30, rx: tb.x + tb.w + fs + 30, y: fs, h: hgt };
    }
    return out;
  }

  function bounds(st) {
    var d = decorLayout(st);
    var x0 = d.tb.x, y0 = d.tb.y, x1 = d.tb.x + d.tb.w, y1 = d.tb.y + d.tb.h;
    if (d.banner) {
      x0 = Math.min(x0, d.banner.x); x1 = Math.max(x1, d.banner.x + d.banner.w); y0 = Math.min(y0, d.banner.y);
    }
    if (d.couplet) {
      x0 = Math.min(x0, d.couplet.lx - d.couplet.fs); x1 = Math.max(x1, d.couplet.rx + d.couplet.fs);
      y1 = Math.max(y1, d.couplet.y + d.couplet.h);
    }
    return { x: x0 - 10, y: y0 - 10, w: x1 - x0 + 20, h: y1 - y0 + 20 };
  }

  function drawDecor(st, g) {
    var d = decorLayout(st);
    if (d.banner) {
      var bg = el("g", { "data-decor": "banner" }, g);
      var b = d.banner, unit = b.w / BANNER_RATIO;
      var parts = [
        { x: b.x, w: unit, url: "/images/longleft.png", par: "xMaxYMid meet" },
        { x: b.x + unit, w: unit * 2.5, url: b.url, par: "xMidYMid meet" },
        { x: b.x + unit * 3.5, w: unit, url: "/images/longright.png", par: "xMinYMid meet" }
      ];
      parts.forEach(function (part) {
        var im = el("image", { x: part.x, y: b.y, width: part.w, height: b.h, preserveAspectRatio: part.par }, bg);
        im.setAttribute("href", part.url);
      });
    }
    if (d.couplet) {
      var c = d.couplet;
      [[c.lx, c.left], [c.rx, c.right]].forEach(function (side) {
        var t = el("text", { x: side[0], y: c.y, "text-anchor": "middle", "font-size": c.fs, "font-weight": 400, "font-family": "ThuPhap, Noto Serif, serif", fill: "#8B0000", "data-decor": "couplet" }, g);
        side[1].forEach(function (word, i) {
          var ts = el("tspan", { x: side[0], dy: i === 0 ? 0 : c.fs * 2 }, t);
          ts.textContent = capitalize(word);
        });
      });
    }
  }

  function fit(st, animate) {
    var b = bounds(st);
    var rect = st.svg.getBoundingClientRect();
    var w = rect.width || 1200, h = rect.height || 700;
    var k = Math.min(1, w / b.w, h / b.h);
    if (k < 0.55 && st.model && st.model.roots && st.model.roots.length > 0) {
      var r = st.model.roots[0];
      k = 0.85;
      var tx = w / 2 - mainX(r) * k;
      var ty = 50 - r.y * k;
      var t = d3.zoomIdentity.translate(tx, ty).scale(k);
      var sel = d3.select(st.svg);
      if (animate) sel.transition().duration(350).call(st.zoom.transform, t); else sel.call(st.zoom.transform, t);
      return;
    }
    var tx = (w - b.w * k) / 2 - b.x * k;
    var ty = Math.max(25, (h - b.h * k) / 2) - b.y * k;
    var t = d3.zoomIdentity.translate(tx, ty).scale(k);
    var sel = d3.select(st.svg);
    if (animate) sel.transition().duration(350).call(st.zoom.transform, t); else sel.call(st.zoom.transform, t);
  }

  function relayout(st, anchorNode) {
    var before = anchorNode ? screenPos(anchorNode) : null;
    layout(st.model);
    draw(st);
    if (before && anchorNode) {
      // giữ nút vừa bấm đứng yên trên màn hình
      var after = screenPos(anchorNode);
      var t = d3.zoomTransform(st.svg);
      var dx = (before.x - after.x) * t.k, dy = (before.y - after.y) * t.k;
      d3.select(st.svg).call(st.zoom.transform, d3.zoomIdentity.translate(t.x + dx, t.y + dy).scale(t.k));
    }
  }

  function expandAncestors(node) {
    var n = node.parent;
    while (n) { n.collapsed = false; n = n.parent; }
  }

  function nodeOf(st, personId) {
    var id = Number(personId);
    if (st.model.nodes.has(id)) return st.model.nodes.get(id);
    // dâu/rể: tìm nút của một bạn đời trong tộc
    var p = st.model.byId.get(id);
    if (!p) return null;
    var found = null;
    (p.spouseIds || []).forEach(function (sid) { if (!found && st.model.nodes.has(sid)) found = st.model.nodes.get(sid); });
    return found;
  }

  // ---------- Trang in / xuất ảnh (như v1) ----------
  // Chuột trái vào thẻ: ẩn / hiện các đời sau của người đó. Chuột phải vào thẻ: chỉ giữ nhánh (con cháu) của người đó để xuất riêng một chi.
  // Chỉ đổi cách vẽ trên trang, không ghi gì vào dữ liệu.
  function printRefit(st) {
    st.userMoved = false;
    layout(st.model);
    draw(st);
    fit(st, false);
  }

  function expandSubtree(node) {
    var stack = [node];
    var seen = new Set();
    while (stack.length) {
      var n = stack.pop();
      if (seen.has(n.p.personId)) continue;
      seen.add(n.p.personId);
      n.collapsed = false;
      n.children.forEach(function (c) { stack.push(c); });
    }
  }

  function notifyBranch(st, node) {
    if (!st.dotNetRef) return;
    st.dotNetRef.invokeMethodAsync("OnBranchChanged", node ? Number(node.p.personId) : 0, node ? String(node.p.fullName || "") : "");
  }

  // node = null: trở về toàn bộ phả đồ
  function setBranch(st, node) {
    if (node) {
      if (st.model.roots.length === 1 && st.model.roots[0] === node) return;
      expandSubtree(node);
      st.model.roots = [node];
    } else {
      st.model.roots = st.fullRoots ? st.fullRoots.slice() : st.model.roots;
      st.model.nodes.forEach(function (n) { n.collapsed = false; });
    }
    printRefit(st);
    notifyBranch(st, node);
  }

  function cardPersonId(target, svg) {
    var node = target;
    while (node && node !== svg) {
      if (node.getAttribute && node.getAttribute("data-id")) return Number(node.getAttribute("data-id"));
      node = node.parentNode;
    }
    return null;
  }

  function fitForPrintState(st) {
    var b = bounds(st);
    st.svg.setAttribute("viewBox", b.x + " " + b.y + " " + b.w + " " + b.h);
    st.svg.setAttribute("preserveAspectRatio", "xMidYMin meet");
    st.g.removeAttribute("transform");
  }

  function toDataUrl(url) {
    return fetch(url, { mode: "cors" }).then(function (r) {
      if (!r.ok) throw new Error("http");
      return r.blob();
    }).then(function (blob) {
      return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onload = function () { resolve(fr.result); };
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
    });
  }

  // Ảnh nhúng trong SVG phải là data: thì mới vẽ được khi xuất file; ảnh nào tải không được (chặn CORS...) thì bỏ khỏi bản xuất
  function inlineImages(root) {
    var images = [].slice.call(root.querySelectorAll("image"));
    var cache = {};
    return Promise.all(images.map(function (im) {
      var href = im.getAttribute("href");
      if (!href || href.indexOf("data:") === 0) return Promise.resolve();
      if (!cache[href]) cache[href] = toDataUrl(href).catch(function () { return null; });
      return cache[href].then(function (data) {
        if (data) im.setAttribute("href", data);
        else if (im.parentNode) im.parentNode.removeChild(im);
      });
    }));
  }

  // Dựng bản xuất (SVG độc lập, có nền, nhúng ảnh). Trả { xml, w, h } theo tỉ lệ đã giới hạn.
  function prepareExport(st) {
    var b = bounds(st);
    var maxSide = 12000;
    var scale = Math.min(2, maxSide / b.w, maxSide / b.h);
    var w = Math.max(1, Math.round(b.w * scale)), h = Math.max(1, Math.round(b.h * scale));
    var clone = st.g.cloneNode(true);
    clone.removeAttribute("transform");
    var svg = el("svg", { xmlns: NS, "xmlns:xlink": "http://www.w3.org/1999/xlink", width: w, height: h, viewBox: b.x + " " + b.y + " " + b.w + " " + b.h, "font-family": "Be Vietnam Pro, Noto Sans, sans-serif" });
    el("rect", { x: b.x, y: b.y, width: b.w, height: b.h, fill: "#f3e8cf" }, svg);
    svg.appendChild(clone);
    var needFont = !!clone.querySelector('[data-decor="couplet"]');
    var fontTask = needFont ? toDataUrl("/fonts/ThuPhap/ThuPhapThienAn.woff2").catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([inlineImages(svg), fontTask]).then(function (res) {
      if (res[1]) {
        var style = el("style", {}, el("defs", {}, svg));
        style.textContent = '@font-face{font-family:"ThuPhap";src:url(' + res[1] + ') format("woff2");}';
      }
      return { xml: new XMLSerializer().serializeToString(svg), w: w, h: h };
    });
  }

  function download(blob, fileName) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  // ---------- API ----------
  var api = {
    render: function (containerId, data, dotNetRef, options) {
      options = options || {};
      var container = document.getElementById(containerId);
      if (!container || typeof d3 === "undefined") return false;
      var st = states[containerId];
      var first = !st;
      if (!st) {
        container.textContent = "";
        var svg = el("svg", { width: "100%", height: "100%", style: "display:block;touch-action:none;background:transparent" });
        var g = el("g", {}, svg);
        container.appendChild(svg);
        var zoom = d3.zoom().scaleExtent([0.03, 2.5]).on("zoom", function (e) {
          g.setAttribute("transform", e.transform.toString());
          var cur = states[containerId];
          if (cur && e.sourceEvent) cur.userMoved = true;     // chỉ thao tác của người dùng mới tính (gọi bằng mã thì không có sourceEvent)
        });
        d3.select(svg).call(zoom).on("dblclick.zoom", null);
        // Trang in: chuột phải vào thẻ = chỉ giữ nhánh của người đó (chặn luôn menu chuột phải của trình duyệt trên khung vẽ, như v1)
        svg.addEventListener("contextmenu", function (ev) {
          var cur = states[containerId];
          if (!cur || !cur.printTools) return;
          ev.preventDefault();
          var pid = cardPersonId(ev.target, svg);
          if (pid === null) return;
          var owner = nodeOf(cur, pid);
          if (owner) setBranch(cur, owner);
        });
        st = states[containerId] = { svg: svg, g: g, zoom: zoom, model: null, dotNetRef: null, selectedId: null, hits: new Set(), uid: 0, visibleCount: 0, printMode: false, userMoved: false, observer: null };
        // Khung có thể đổi kích thước sau khi vẽ (CSS nạp muộn, đổi cỡ cửa sổ): chưa ai kéo/zoom thì tự vừa khung lại
        if (typeof ResizeObserver !== "undefined") {
          st.observer = new ResizeObserver(function () {
            var cur = states[containerId];
            if (cur && cur.model && !cur.userMoved && !cur.printMode) fit(cur, false);
          });
          st.observer.observe(container);
        }
        svg.addEventListener("click", function (ev) {
          var node = ev.target;
          while (node && node !== svg) {
            if (node.getAttribute && node.getAttribute("data-add-child")) {
              var fatherId = Number(node.getAttribute("data-add-child"));
              if (st.dotNetRef) st.dotNetRef.invokeMethodAsync("OnAddChildClicked", fatherId);
              return;
            }
            if (node.getAttribute && node.getAttribute("data-action") === "view-details") {
              var viewId = Number(node.getAttribute("data-id"));
              if (st.dotNetRef) st.dotNetRef.invokeMethodAsync("OnPersonClicked", viewId);
              return;
            }
            if (node.getAttribute && node.getAttribute("data-toggle")) {
              var tn = st.model.nodes.get(Number(node.getAttribute("data-toggle")));
              if (tn) {
                tn.collapsed = !tn.collapsed;
                if (st.printTools) { printRefit(st); } else { relayout(st, tn); }
              }
              return;
            }
            if (node.getAttribute && node.getAttribute("data-id")) {
              var id = Number(node.getAttribute("data-id"));
              if (st.printTools) {
                // Trang in: bấm thẻ = ẩn / hiện các đời sau của người đó (không chọn, để viền chọn không lọt vào ảnh xuất)
                var owner = nodeOf(st, id);
                if (owner && owner.children.length > 0) {
                  owner.collapsed = !owner.collapsed;
                  printRefit(st);
                }
                return;
              }
              st.selectedId = id;
              draw(st);
              if (st.dotNetRef) st.dotNetRef.invokeMethodAsync("OnPersonClicked", id);
              return;
            }
            node = node.parentNode;
          }
        });
      }
      st.dotNetRef = dotNetRef;
      st.printMode = !!options.printMode;
      st.printTools = !!options.printTools;      // trang in / xuất ảnh: chuột trái ẩn-hiện đời sau, chuột phải chỉ xem một nhánh
      var oldCollapsed = null;
      if (!first && st.model) {
        oldCollapsed = new Set();
        st.model.nodes.forEach(function (n) { if (n.collapsed) oldCollapsed.add(n.p.personId); });
      }
      if (options.display) st.opts = options.display;
      if (options.parentLinks !== undefined && options.parentLinks !== null) st.parentLinks = !!options.parentLinks;
      st.model = build(Array.isArray(data) ? data : (data.people || []));
      st.model.opts = st.opts || {};
      st.fullRoots = st.model.roots.slice();
      if (oldCollapsed && options.keepView) {
        st.model.nodes.forEach(function (n) { n.collapsed = oldCollapsed.has(n.p.personId) && n.children.length > 0; });
      } else if (st.printMode || options.expandAll) {
        st.model.nodes.forEach(function (n) { n.collapsed = false; });
      } else {
        applyDefaultCollapse(st.model);
      }
      if (options.selectedId) st.selectedId = Number(options.selectedId);
      layout(st.model);
      draw(st);
      if (first || !options.keepView) fit(st, false);
      return true;
    },

    zoomBy: function (containerId, factor) {
      var st = states[containerId]; if (!st) return;
      d3.select(st.svg).transition().duration(200).call(st.zoom.scaleBy, factor);
    },
    // Đổi tuỳ chọn hiển thị (ẩn ngày / vợ chồng / ảnh, giới hạn số đời, cuốn thư, câu đối). Giữ nguyên trạng thái mở/thu gọn.
    setDisplay: function (containerId, display) {
      var st = states[containerId]; if (!st || !st.model) return false;
      st.opts = display || {};
      st.model.opts = st.opts;
      layout(st.model); draw(st);
      st.userMoved = false;
      if (st.printMode) { fitForPrintState(st); } else { fit(st, false); }
      return true;
    },

    // Bật/tắt đường nối con với cha/mẹ ngoài tộc (vợ/chồng của người trong tộc); chỉ vẽ lại, không đổi bố cục
    setParentLinks: function (containerId, on) {
      var st = states[containerId]; if (!st) return false;
      st.parentLinks = !!on;
      if (st.model) draw(st);
      return true;
    },

    fit: function (containerId) { var st = states[containerId]; if (st) { st.userMoved = false; fit(st, true); } },
    // Trang in: bỏ chế độ "chỉ một nhánh", trở về toàn bộ phả đồ (mở hết các đời)
    resetBranch: function (containerId) {
      var st = states[containerId]; if (!st || !st.model) return false;
      setBranch(st, null);
      return true;
    },
    expandAll: function (containerId) {
      var st = states[containerId]; if (!st) return;
      st.model.nodes.forEach(function (n) { n.collapsed = false; });
      layout(st.model); draw(st); fit(st, true);
    },
    collapseAll: function (containerId) {
      var st = states[containerId]; if (!st) return;
      st.model.nodes.forEach(function (n) { n.collapsed = n.depth >= 1 && n.children.length > 0; });
      layout(st.model); draw(st); fit(st, true);
    },
    visibleCount: function (containerId) { var st = states[containerId]; return st ? st.visibleCount : 0; },
    selectPerson: function (containerId, personId) {
      var st = states[containerId]; if (!st) return;
      st.selectedId = personId ? Number(personId) : null;
      draw(st);
    },

    // Tìm theo tên/tên thường gọi (không phân biệt hoa thường, bỏ dấu). Trả danh sách gợi ý; tô viền các kết quả.
    search: function (containerId, text) {
      var st = states[containerId]; if (!st) return [];
      var q = norm(text).trim();
      st.hits = new Set();
      var results = [];
      if (q.length >= 2) {
        st.model.byId.forEach(function (p) {
          if (results.length >= MAX_SEARCH) return;
          if (norm(p.fullName).indexOf(q) >= 0 || norm(p.nickname).indexOf(q) >= 0) {
            results.push({ personId: p.personId, fullName: p.fullName, generationOrder: p.generationOrder });
            st.hits.add(p.personId);
          }
        });
        results.forEach(function (r) {
          var n = nodeOf(st, r.personId);
          if (n) expandAncestors(n);
        });
        layout(st.model);
      }
      draw(st);
      return results;
    },

    focusPerson: function (containerId, personId) {
      var st = states[containerId]; if (!st) return false;
      var n = nodeOf(st, personId);
      if (!n) return false;
      expandAncestors(n);
      st.selectedId = Number(personId);
      layout(st.model); draw(st);
      var rect = st.svg.getBoundingClientRect();
      var k = Math.max(0.7, Math.min(1, d3.zoomTransform(st.svg).k));
      var sp = screenPos(n);
      var t = d3.zoomIdentity.translate(rect.width / 2 - sp.x * k, rect.height / 3 - sp.y * k).scale(k);
      d3.select(st.svg).transition().duration(400).call(st.zoom.transform, t);
      return true;
    },

    // Tải ảnh PNG của toàn bộ cây đang hiển thị (nền ngà, kèm cuốn thư / câu đối nếu có). Cây quá lớn thì thu nhỏ để canvas không vượt giới hạn trình duyệt.
    exportPng: function (containerId, fileName) {
      var st = states[containerId]; if (!st) return Promise.resolve(false);
      return prepareExport(st).then(function (ex) {
        return new Promise(function (resolve) {
          var img = new Image();
          img.onload = function () {
            var canvas = document.createElement("canvas");
            canvas.width = ex.w; canvas.height = ex.h;
            canvas.getContext("2d").drawImage(img, 0, 0);
            canvas.toBlob(function (blob) {
              if (!blob) { resolve(false); return; }
              download(blob, (fileName || "pha-do") + ".png");
              resolve(true);
            }, "image/png");
          };
          img.onerror = function () { resolve(false); };
          img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ex.xml);
        });
      }).catch(function () { return false; });
    },

    // Tải file SVG (vector, phóng to không vỡ) — ảnh được nhúng thẳng vào file
    exportSvg: function (containerId, fileName) {
      var st = states[containerId]; if (!st) return Promise.resolve(false);
      return prepareExport(st).then(function (ex) {
        download(new Blob([ex.xml], { type: "image/svg+xml;charset=utf-8" }), (fileName || "pha-do") + ".svg");
        return true;
      }).catch(function () { return false; });
    },

    // Chế độ in: đặt viewBox ôm trọn cây để trình duyệt thu cả cây vào một trang
    fitForPrint: function (containerId) {
      var st = states[containerId]; if (!st) return false;
      fitForPrintState(st);
      return true;
    },

    // In / lưu PDF: tạm đặt khung ôm trọn cây (kể cả cuốn thư, câu đối) rồi trả lại góc nhìn đang xem
    print: function (containerId) {
      var st = containerId ? states[containerId] : null;
      if (!st) { window.print(); return; }
      var viewBox = st.svg.getAttribute("viewBox");
      var par = st.svg.getAttribute("preserveAspectRatio");
      var transform = st.g.getAttribute("transform");
      fitForPrintState(st);
      window.print();
      setTimeout(function () {
        if (viewBox === null) st.svg.removeAttribute("viewBox"); else st.svg.setAttribute("viewBox", viewBox);
        if (par === null) st.svg.removeAttribute("preserveAspectRatio"); else st.svg.setAttribute("preserveAspectRatio", par);
        if (transform === null) st.g.removeAttribute("transform"); else st.g.setAttribute("transform", transform);
      }, 300);
    },

    dispose: function (containerId) {
      var st = states[containerId];
      if (!st) return;
      if (st.observer) st.observer.disconnect();
      if (st.svg && st.svg.parentNode) st.svg.parentNode.removeChild(st.svg);
      delete states[containerId];
    }
  };

  window.phadoAdmin = api;
})();
