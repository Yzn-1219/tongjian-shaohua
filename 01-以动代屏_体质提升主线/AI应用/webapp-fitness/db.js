// ===== IndexedDB 数据层 =====
const DB = (function() {
  const DB_NAME = 'fitness-app';
  const DB_VERSION = 1;
  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { db = req.result; resolve(db); };
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('trainings')) {
          const s = d.createObjectStore('trainings', { keyPath: 'id' });
          s.createIndex('date', 'date', { unique: false });
        }
        if (!d.objectStoreNames.contains('bodydata')) {
          d.createObjectStore('bodydata', { keyPath: 'id' });
        }
      };
    });
  }

  function tx(store, mode) {
    if (!db) throw new Error('DB not open');
    return db.transaction(store, mode).objectStore(store);
  }

  // 训练记录
  async function addTraining(rec) {
    if (!rec.id) rec.id = Date.now();
    if (!rec.created_at) rec.created_at = Date.now();
    return new Promise((resolve, reject) => {
      const r = tx('trainings', 'readwrite').add(rec);
      r.onsuccess = () => resolve(rec);
      r.onerror = () => reject(r.error);
    });
  }

  async function getAllTrainings() {
    return new Promise((resolve, reject) => {
      const r = tx('trainings', 'readonly').getAll();
      r.onsuccess = () => resolve(r.result.sort((a,b) => b.created_at - a.created_at));
      r.onerror = () => reject(r.error);
    });
  }

  async function getRecentTrainings(n) {
    const all = await getAllTrainings();
    return all.slice(0, n);
  }

  async function getTrainingsByDate(date) {
    return new Promise((resolve, reject) => {
      const idx = tx('trainings', 'readonly').index('date');
      const r = idx.getAll(date);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  async function deleteTraining(id) {
    return new Promise((resolve, reject) => {
      const r = tx('trainings', 'readwrite').delete(id);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  }

  // 身体数据
  async function addBodyData(rec) {
    if (!rec.id) rec.id = Date.now();
    if (!rec.created_at) rec.created_at = Date.now();
    return new Promise((resolve, reject) => {
      const r = tx('bodydata', 'readwrite').add(rec);
      r.onsuccess = () => resolve(rec);
      r.onerror = () => reject(r.error);
    });
  }

  async function getAllBodyData() {
    return new Promise((resolve, reject) => {
      const r = tx('bodydata', 'readonly').getAll();
      r.onsuccess = () => resolve(r.result.sort((a,b) => a.created_at - b.created_at));
      r.onerror = () => reject(r.error);
    });
  }

  async function getRecentBodyData(n) {
    const all = await getAllBodyData();
    return all.slice(-n);
  }

  // 导出导入
  async function exportAll() {
    const trainings = await getAllTrainings();
    const bodydata = await getAllBodyData();
    return { trainings, bodydata, exportedAt: new Date().toISOString() };
  }

  async function importAll(data) {
    if (!data || !data.trainings) throw new Error('Invalid import data');
    for (const t of data.trainings) {
      try { await addTraining(t); } catch(e) { /* skip dup */ }
    }
    if (data.bodydata) {
      for (const b of data.bodydata) {
        try { await addBodyData(b); } catch(e) { /* skip dup */ }
      }
    }
  }

  return { open, addTraining, getAllTrainings, getRecentTrainings, getTrainingsByDate, deleteTraining,
           addBodyData, getAllBodyData, getRecentBodyData, exportAll, importAll };
})();
