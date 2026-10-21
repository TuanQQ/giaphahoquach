import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'giapha.json');
const AUTH_FILE = path.join(__dirname, 'data', 'auth.json');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tuanboomcn4ptit_db_user:6ItNiTSsbq7qO8B7@cluster0.v3ghtul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Helper MongoDB Connection
let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000
      });
      await cachedClient.connect();
    }
    cachedDb = cachedClient.db('giaphahoquach');
    return cachedDb;
  } catch (err) {
    console.error('Lỗi kết nối MongoDB Atlas (fallback sang JSON local):', err.message);
    return null;
  }
}

// Helper auth config & session store
async function getAuthConfig() {
  const db = await getDb();
  if (db) {
    try {
      const authDoc = await db.collection('auth').findOne({});
      if (authDoc && authDoc.username && authDoc.password) {
        return { username: authDoc.username, password: authDoc.password };
      }
    } catch (e) {}
  }
  try {
    if (fs.existsSync(AUTH_FILE)) {
      return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { username: 'admin', password: 'admin123' };
}

async function saveAuthConfig(cfg) {
  const db = await getDb();
  if (db) {
    try {
      await db.collection('auth').updateOne({}, { $set: cfg }, { upsert: true });
    } catch (e) {}
  }
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) {}
  return true;
}

// Active admin tokens
const activeTokens = new Set(['initial-admin-token']);

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
  if (!token || !activeTokens.has(token)) {
    return res.status(403).json({ error: 'Chỉ Quản Trị Viên mới có quyền thực hiện thao tác này.' });
  }
  next();
}

// 0. Auth Endpoints
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const auth = await getAuthConfig();
  if (username === auth.username && password === auth.password) {
    const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    activeTokens.add(token);
    return res.json({ success: true, role: 'ADMIN', token, username: auth.username });
  }
  return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
  if (token) activeTokens.delete(token);
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAdmin, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Mật khẩu phải từ 4 ký tự trở lên.' });
  }
  const auth = await getAuthConfig();
  auth.password = newPassword;
  await saveAuthConfig(auth);
  res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

// Helper read/write database (MongoDB Atlas + Fallback Local JSON)
async function readData() {
  const db = await getDb();
  if (db) {
    try {
      const clanDoc = await db.collection('clan').findOne({}) || {};
      delete clanDoc._id;
      const members = await db.collection('members').find({}).toArray();
      members.forEach(m => delete m._id);
      const incenseLogs = await db.collection('incenseLogs').find({}).sort({ createdAt: -1 }).toArray();
      incenseLogs.forEach(i => delete i._id);
      return { clan: clanDoc, members, incenseLogs };
    } catch (e) {
      console.error('Lỗi truy vấn MongoDB Atlas, đọc từ JSON:', e.message);
    }
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi khi đọc file data:', err);
    return { clan: {}, members: [], incenseLogs: [] };
  }
}

async function writeData(data) {
  const db = await getDb();
  if (db) {
    try {
      if (data.clan) {
        await db.collection('clan').deleteMany({});
        await db.collection('clan').insertOne({ ...data.clan });
      }
      if (data.members && Array.isArray(data.members)) {
        await db.collection('members').deleteMany({});
        if (data.members.length > 0) {
          await db.collection('members').insertMany(data.members.map(m => {
            const copy = { ...m };
            delete copy._id;
            return copy;
          }));
        }
      }
      if (data.incenseLogs && Array.isArray(data.incenseLogs)) {
        await db.collection('incenseLogs').deleteMany({});
        if (data.incenseLogs.length > 0) {
          await db.collection('incenseLogs').insertMany(data.incenseLogs.map(i => {
            const copy = { ...i };
            delete copy._id;
            return copy;
          }));
        }
      }
    } catch (e) {
      console.error('Lỗi khi ghi vào MongoDB Atlas:', e.message);
    }
  }

  // Backup write to local file
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {}
  return true;
}

// 1. Get Clan & Family Tree Data
app.get('/api/clan', async (req, res) => {
  const data = await readData();
  res.json(data);
});

// 2. Update Clan Info & History & Rules
app.put('/api/clan', requireAdmin, async (req, res) => {
  const data = await readData();
  data.clan = { ...data.clan, ...req.body };
  await writeData(data);
  res.json({ success: true, clan: data.clan });
});

// 3. Add Member
app.post('/api/members', requireAdmin, async (req, res) => {
  const data = await readData();
  const newMember = {
    id: 'm_' + Date.now(),
    code: 'code_' + Date.now(),
    fullName: req.body.fullName || 'Chưa đặt tên',
    honorific: req.body.honorific || '',
    alias: req.body.alias || '',
    gender: req.body.gender || 'male',
    generation: Number(req.body.generation) || 1,
    branch: req.body.branch || 'Gốc',
    birthYear: req.body.birthYear || '',
    deathYear: req.body.deathYear || '',
    isAlive: req.body.isAlive !== undefined ? req.body.isAlive : true,
    lunarDeathDay: req.body.lunarDeathDay ? Number(req.body.lunarDeathDay) : null,
    lunarDeathMonth: req.body.lunarDeathMonth ? Number(req.body.lunarDeathMonth) : null,
    burialPlace: req.body.burialPlace || '',
    fatherId: req.body.fatherId || null,
    motherId: req.body.motherId || null,
    spouseIds: req.body.spouseIds || [],
    childrenIds: req.body.childrenIds || [],
    birthOrder: Number(req.body.birthOrder) || 1,
    phone: req.body.phone || '',
    currentAddress: req.body.currentAddress || '',
    biography: req.body.biography || '',
    avatar: req.body.avatar || ''
  };

  data.members.push(newMember);

  // Update parent's childrenIds
  if (newMember.fatherId) {
    const father = data.members.find(m => m.id === newMember.fatherId);
    if (father && !father.childrenIds.includes(newMember.id)) {
      father.childrenIds.push(newMember.id);
    }
  }
  if (newMember.motherId) {
    const mother = data.members.find(m => m.id === newMember.motherId);
    if (mother && !mother.childrenIds.includes(newMember.id)) {
      mother.childrenIds.push(newMember.id);
    }
  }

  // Update spouse
  if (newMember.spouseIds && newMember.spouseIds.length > 0) {
    newMember.spouseIds.forEach(spId => {
      const spouse = data.members.find(m => m.id === spId);
      if (spouse && !spouse.spouseIds.includes(newMember.id)) {
        spouse.spouseIds.push(newMember.id);
      }
    });
  }

  await writeData(data);
  res.json({ success: true, member: newMember });
});

// 4. Update Member
app.put('/api/members/:id', requireAdmin, async (req, res) => {
  const data = await readData();
  const idx = data.members.findIndex(m => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Không tìm thấy thành viên' });
  }

  const oldMember = data.members[idx];
  const updatedMember = { ...oldMember, ...req.body, id: oldMember.id };

  // Handle spouse synchronization
  if (req.body.spouseIds) {
    oldMember.spouseIds.forEach(spId => {
      if (!req.body.spouseIds.includes(spId)) {
        const sp = data.members.find(m => m.id === spId);
        if (sp) sp.spouseIds = sp.spouseIds.filter(id => id !== oldMember.id);
      }
    });
    req.body.spouseIds.forEach(spId => {
      const sp = data.members.find(m => m.id === spId);
      if (sp && !sp.spouseIds.includes(oldMember.id)) {
        sp.spouseIds.push(oldMember.id);
      }
    });
  }

  // Handle parent changes
  if (oldMember.fatherId && oldMember.fatherId !== updatedMember.fatherId) {
    const oldFather = data.members.find(m => m.id === oldMember.fatherId);
    if (oldFather) {
      oldFather.childrenIds = oldFather.childrenIds.filter(id => id !== oldMember.id);
    }
  }
  if (updatedMember.fatherId) {
    const newFather = data.members.find(m => m.id === updatedMember.fatherId);
    if (newFather && !newFather.childrenIds.includes(updatedMember.id)) {
      newFather.childrenIds.push(updatedMember.id);
    }
  }

  if (oldMember.motherId && oldMember.motherId !== updatedMember.motherId) {
    const oldMother = data.members.find(m => m.id === oldMember.motherId);
    if (oldMother) {
      oldMother.childrenIds = oldMother.childrenIds.filter(id => id !== oldMember.id);
    }
  }
  if (updatedMember.motherId) {
    const newMother = data.members.find(m => m.id === updatedMember.motherId);
    if (newMother && !newMother.childrenIds.includes(updatedMember.id)) {
      newMother.childrenIds.push(updatedMember.id);
    }
  }

  data.members[idx] = updatedMember;
  await writeData(data);
  res.json({ success: true, member: updatedMember });
});

// 5. Delete Member
app.delete('/api/members/:id', requireAdmin, async (req, res) => {
  const data = await readData();
  const idToDelete = req.params.id;
  const idx = data.members.findIndex(m => m.id === idToDelete);
  if (idx === -1) {
    return res.status(404).json({ error: 'Không tìm thấy thành viên để xóa' });
  }

  // Clean up relations
  data.members.forEach(m => {
    if (m.fatherId === idToDelete) m.fatherId = null;
    if (m.motherId === idToDelete) m.motherId = null;
    if (m.spouseIds) m.spouseIds = m.spouseIds.filter(id => id !== idToDelete);
    if (m.childrenIds) m.childrenIds = m.childrenIds.filter(id => id !== idToDelete);
  });

  data.members.splice(idx, 1);
  await writeData(data);
  res.json({ success: true, message: 'Đã xóa thành viên khỏi phả hệ' });
});

// 6. Incense Offering
app.post('/api/incense', async (req, res) => {
  const data = await readData();
  const log = {
    id: 'inc-' + Date.now(),
    userName: req.body.userName || 'Con cháu họ Quách',
    sticks: req.body.sticks || 3,
    wishes: req.body.wishes || 'Cầu mong tiên tổ phù hộ bình an, dòng họ vạn đại trường tồn.',
    createdAt: new Date().toISOString()
  };
  if (!data.incenseLogs) data.incenseLogs = [];
  data.incenseLogs.unshift(log);
  await writeData(data);
  res.json({ success: true, log });
});

// 7. EXPORT EXCEL .XLSX API
const handleExportExcel = async (req, res) => {
  try {
    const data = await readData();
    const members = data.members || [];
    const clan = data.clan || {};

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gia Phả Đại Việt';
    workbook.lastModifiedBy = 'Trung Tâm Điều Hành Gia Phả';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Danh Bạ Họ Quách', {
      views: [{ showGridLines: true }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    });

    // 1. Title Rows
    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'GIA PHẢ ĐẠI VIỆT — TRUNG TÂM ĐIỀU HÀNH DÒNG HỌ';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD75B2C' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    sheet.mergeCells('A2:L2');
    const subCell1 = sheet.getCell('A2');
    subCell1.value = `DANH BẠ THÀNH VIÊN ${clan.name ? clan.name.toUpperCase() : 'HỌ QUÁCH'} (${members.length} THÀNH VIÊN)`;
    subCell1.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF5F7852' } };
    subCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF1E3' } };
    subCell1.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 26;

    sheet.mergeCells('A3:L3');
    const subCell2 = sheet.getCell('A3');
    subCell2.value = `Khởi tổ Cụ Quách Văn Trễ (sinh năm 1800) — 10 Thế Hệ Đồng Tộc • Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`;
    subCell2.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF7A6552' } };
    subCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF8F0' } };
    subCell2.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 20;

    sheet.getRow(4).height = 10;

    // 2. Table Headers
    const headers = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Họ và Tên', key: 'fullName', width: 26 },
      { header: 'Danh Xưng / Vai Vế', key: 'honorific', width: 22 },
      { header: 'Giới Tính', key: 'gender', width: 12 },
      { header: 'Đời Thứ', key: 'generation', width: 12 },
      { header: 'Chi Họ / Cành Nhánh', key: 'branch', width: 22 },
      { header: 'Năm Sinh', key: 'birthYear', width: 14 },
      { header: 'Năm Mất / Giỗ', key: 'deathText', width: 18 },
      { header: 'Tình Trạng', key: 'status', width: 14 },
      { header: 'Số Điện Thoại', key: 'phone', width: 18 },
      { header: 'Địa Chỉ Hiện Nay / Quê Quán', key: 'address', width: 32 },
      { header: 'Nơi An Táng', key: 'burial', width: 28 }
    ];

    const headerRow = sheet.getRow(5);
    headers.forEach((h, idx) => {
      const col = sheet.getColumn(idx + 1);
      col.width = h.width;
      const cell = headerRow.getCell(idx + 1);
      cell.value = h.header;
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5F7852' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF3B5E2B' } },
        left: { style: 'thin', color: { argb: 'FF3B5E2B' } },
        bottom: { style: 'medium', color: { argb: 'FF3B5E2B' } },
        right: { style: 'thin', color: { argb: 'FF3B5E2B' } }
      };
    });
    headerRow.height = 28;

    // 3. Data Rows
    const sortedMembers = [...members].sort((a, b) => {
      const genA = Number(a.generation) || 999;
      const genB = Number(b.generation) || 999;
      if (genA !== genB) return genA - genB;
      const ordA = Number(a.birthOrder) || 999;
      const ordB = Number(b.birthOrder) || 999;
      return ordA - ordB;
    });

    sortedMembers.forEach((m, idx) => {
      const rowNum = idx + 6;
      const row = sheet.getRow(rowNum);
      const isEven = idx % 2 === 0;
      const rowBgColor = isEven ? 'FFFFFFFF' : 'FFFDF8F2';

      let genderText = 'Nam';
      if (m.gender === 'female') genderText = 'Nữ';

      let deathText = '';
      if (!m.isAlive) {
        if (m.deathYear) deathText = `Mất ${m.deathYear}`;
        if (m.lunarDeathDay && m.lunarDeathMonth) {
          deathText += (deathText ? ' ' : '') + `(Giỗ: ${m.lunarDeathDay}/${m.lunarDeathMonth} ÂL)`;
        }
      }

      const rowValues = [
        idx + 1,
        m.fullName || '',
        m.honorific || '',
        genderText,
        m.generation ? `Đời ${m.generation}` : '',
        m.branch || 'Gốc',
        m.birthYear ? String(m.birthYear) : '',
        deathText,
        m.isAlive ? 'Còn sống' : 'Đã khuất',
        m.phone || '',
        m.currentAddress || '',
        m.burialPlace || ''
      ];

      rowValues.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF333333' } };

        if (colIdx === 0 || colIdx === 3 || colIdx === 4 || colIdx === 6 || colIdx === 8) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0D0C0' } },
          left: { style: 'thin', color: { argb: 'FFE0D0C0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0D0C0' } },
          right: { style: 'thin', color: { argb: 'FFE0D0C0' } }
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Danh_Ba_Dai_Toc_Ho_Quach.xlsx"');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(buffer);
  } catch (err) {
    console.error('Lỗi khi xuất file Excel:', err);
    res.status(500).json({ error: 'Không thể xuất file Excel: ' + err.message });
  }
};

app.get('/api/export-excel', handleExportExcel);
app.get('/api/members/export-excel', handleExportExcel);

// 8. Backup & Restore
app.get('/api/backup', async (req, res) => {
  const data = await readData();
  res.setHeader('Content-Disposition', 'attachment; filename="giapha_ho_quach_backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

app.post('/api/restore', requireAdmin, async (req, res) => {
  const uploaded = req.body;
  if (!uploaded || !uploaded.clan || !Array.isArray(uploaded.members)) {
    return res.status(400).json({ error: 'Định dạng dữ liệu không hợp lệ' });
  }
  await writeData(uploaded);
  res.json({ success: true, count: uploaded.members.length });
});

// Serve frontend if built
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}

// Start standalone server if not on serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Gia Phả Đại Việt (Họ Quách) đang chạy tại: http://localhost:${PORT}`);
    console.log(`Kết nối Database: MongoDB Atlas (giaphahoquach)`);
  });
}

export default app;
