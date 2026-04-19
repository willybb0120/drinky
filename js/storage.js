(function (global) {
  'use strict';

  const KEY = 'drinky-data';
  const DEFAULT_GOAL = 2000;
  const DEFAULT_CONTAINERS = [
    { id: 'c1', name: '馬克杯', volumeMl: 250, icon: '☕', isDeleted: false },
    { id: 'c2', name: '水壺', volumeMl: 500, icon: '🍶', isDeleted: false },
    { id: 'c3', name: '大水瓶', volumeMl: 1000, icon: '💧', isDeleted: false }
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : {};
      if (!Array.isArray(data.containers)) {
        data.containers = DEFAULT_CONTAINERS.map(c => ({ ...c }));
      }
      if (typeof data.goal !== 'number') data.goal = DEFAULT_GOAL;
      if (!data.days || typeof data.days !== 'object') data.days = {};
      return data;
    } catch (e) {
      return {
        containers: DEFAULT_CONTAINERS.map(c => ({ ...c })),
        goal: DEFAULT_GOAL,
        days: {}
      };
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getDay(key) {
    const data = load();
    const k = key || todayKey();
    if (!data.days[k]) data.days[k] = { records: [] };
    return { data, key: k, day: data.days[k] };
  }

  const Storage = {
    todayKey,

    getGoal() {
      return load().goal;
    },

    setGoal(ml) {
      const data = load();
      data.goal = Math.max(100, Math.min(10000, Math.round(ml)));
      save(data);
      return data.goal;
    },

    getContainers(includeDeleted = false) {
      const list = load().containers;
      return includeDeleted ? list : list.filter(c => !c.isDeleted);
    },

    getContainerById(id) {
      return load().containers.find(c => c.id === id);
    },

    addContainer({ name, volumeMl, icon }) {
      const data = load();
      const id = 'c' + Date.now() + Math.floor(Math.random() * 1000);
      const container = {
        id,
        name: String(name).trim().slice(0, 20),
        volumeMl: Math.max(1, Math.round(Number(volumeMl))),
        icon: String(icon).trim().slice(0, 2) || '💧',
        isDeleted: false
      };
      data.containers.push(container);
      save(data);
      return container;
    },

    updateContainer(id, patch) {
      const data = load();
      const c = data.containers.find(x => x.id === id);
      if (!c) return null;
      if (patch.name !== undefined) c.name = String(patch.name).trim().slice(0, 20);
      if (patch.volumeMl !== undefined) c.volumeMl = Math.max(1, Math.round(Number(patch.volumeMl)));
      if (patch.icon !== undefined) c.icon = String(patch.icon).trim().slice(0, 2) || c.icon;
      save(data);
      return c;
    },

    softDeleteContainer(id) {
      const data = load();
      const c = data.containers.find(x => x.id === id);
      if (!c) return false;
      c.isDeleted = true;
      save(data);
      return true;
    },

    getTodayRecords() {
      const { day } = getDay();
      return day.records.slice().sort((a, b) => a.at - b.at);
    },

    getDayRecords(key) {
      const { day } = getDay(key);
      return day.records.slice().sort((a, b) => a.at - b.at);
    },

    getTodayTotal() {
      return this.getTodayRecords().reduce((sum, r) => sum + r.ml, 0);
    },

    addRecord(ml, containerId) {
      const data = load();
      const k = todayKey();
      if (!data.days[k]) data.days[k] = { records: [] };
      const container = containerId
        ? data.containers.find(c => c.id === containerId)
        : null;
      const record = {
        id: 'r' + Date.now() + Math.floor(Math.random() * 1000),
        ml: Math.max(1, Math.round(Number(ml))),
        at: Date.now()
      };
      if (container) {
        record.containerId = container.id;
        record.containerNameSnapshot = container.name;
        record.containerIconSnapshot = container.icon;
      }
      data.days[k].records.push(record);
      save(data);
      return record;
    },

    getMonthTotals(year, month) {
      const data = load();
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
      const result = {};
      Object.keys(data.days).forEach(key => {
        if (key.startsWith(prefix)) {
          const day = data.days[key];
          result[key] = Array.isArray(day.records)
            ? day.records.reduce((s, r) => s + r.ml, 0)
            : 0;
        }
      });
      return result;
    },

    deleteRecord(id) {
      const data = load();
      const k = todayKey();
      if (!data.days[k]) return false;
      const before = data.days[k].records.length;
      data.days[k].records = data.days[k].records.filter(r => r.id !== id);
      save(data);
      return data.days[k].records.length < before;
    }
  };

  global.Storage = Storage;
})(window);
