/* ==========================================================================
   Медкорпус Конохи — слой данных (localStorage)
   Демо-режим: данные живут в браузере посетителя.
   ========================================================================== */
(function () {
  "use strict";

  var DB_KEY = "medcorpus.db.v1";
  var SESSION_KEY = "medcorpus.session.v1";
  var DB_VERSION = 2;

  var LEAD_POSITIONS = ["Глава Медицинского Корпуса", "Заместитель Главы"];
  var STAFF_POSITIONS = [
    "Медик",
    "Полевой медик",
    "Хирург",
    "Интерн",
    "Скальпель",
    "Тайдзюцу",
    "Главный врач больницы Листа",
    "Второй врач Конохи"
  ];
  var POSITIONS = LEAD_POSITIONS.concat(STAFF_POSITIONS);
  var RANKS = ["Медик", "Интерн", "Ст. медик"];
  var CLANS = ["Учиха", "Нара", "Хьюга", "Нет клана"];
  var STATUSES = ["active", "inactive"];
  var WARNING_SLOTS = { oral: 3, written: 2 };

  var ADMIN_PASS_HASH = "56f2aa096cceec87df49202e3aafd1a730e67e0dbb1542d564e046c8ace65758";
  var DEMO_PASS_HASH = "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d";

  var listeners = [];

  function iso(daysAgo, hour) {
    var d = new Date();
    d.setDate(d.getDate() - (daysAgo || 0));
    d.setHours(hour || 10, 0, 0, 0);
    return d.toISOString();
  }

  function emptyWarnings() {
    return { oral: [false, false, false], written: [false, false] };
  }

  function normalizeWarnings(input) {
    var source = input || {};
    var oral = Array.isArray(source.oral) ? source.oral : [];
    var written = Array.isArray(source.written) ? source.written : [];
    return {
      oral: [0, 1, 2].map(function (i) { return !!oral[i]; }),
      written: [0, 1].map(function (i) { return !!written[i]; })
    };
  }

  function normalizePosition(value) {
    return String(value == null ? "" : value).trim().toLowerCase();
  }

  function canonicalPosition(value) {
    var needle = normalizePosition(value);
    for (var i = 0; i < POSITIONS.length; i += 1) {
      if (normalizePosition(POSITIONS[i]) === needle) return POSITIONS[i];
    }
    return "";
  }

  function hasPosition(user, position) {
    var needle = normalizePosition(position);
    if (!user || !Array.isArray(user.positions)) return false;
    return user.positions.some(function (item) {
      return normalizePosition(item) === needle;
    });
  }

  function baseUser(data) {
    var rank = String(data.rank || "").trim();
    return {
      id: data.id,
      email: String(data.email || "").trim().toLowerCase(),
      passHash: data.passHash,
      role: data.role || "user",
      firstName: String(data.firstName || "").trim(),
      lastName: String(data.lastName || "").trim(),
      discord: String(data.discord || "").trim(),
      photo: String(data.photo || "").trim(),
      positions: Array.isArray(data.positions) ? data.positions.map(canonicalPosition).filter(function (p, i, arr) {
        return p && arr.indexOf(p) === i;
      }) : [],
      rank: RANKS.indexOf(rank) !== -1 ? rank : "Интерн",
      clan: CLANS.indexOf(data.clan) !== -1 ? data.clan : "Нет клана",
      status: STATUSES.indexOf(data.status) !== -1 ? data.status : "active",
      warnings: normalizeWarnings(data.warnings),
      createdAt: data.createdAt || iso(0, 12),
      updatedAt: Number(data.updatedAt) || 0
    };
  }

  function seed() {
    var users = [
      baseUser({
        id: "u-admin",
        email: "fff28341@gmail.com",
        passHash: ADMIN_PASS_HASH,
        role: "developer",
        firstName: "Roci",
        lastName: "",
        discord: "roci",
        rank: "Медик",
        clan: "Нет клана",
        status: "active",
        createdAt: iso(120, 12)
      }),
      baseUser({
        id: "u1",
        email: "akira@medcorpus.local",
        passHash: DEMO_PASS_HASH,
        firstName: "Акира",
        lastName: "Сенджу",
        discord: "akira#0001",
        positions: ["Глава Медицинского Корпуса", "Хирург"],
        rank: "Ст. медик",
        clan: "Нет клана",
        status: "active",
        createdAt: iso(110, 9)
      }),
      baseUser({
        id: "u2",
        email: "yuki@medcorpus.local",
        passHash: DEMO_PASS_HASH,
        firstName: "Юки",
        lastName: "Нара",
        discord: "yuki#0002",
        positions: ["Заместитель Главы", "Главный врач больницы Листа"],
        rank: "Ст. медик",
        clan: "Нара",
        status: "active",
        createdAt: iso(104, 9)
      }),
      baseUser({
        id: "u3",
        email: "ren@medcorpus.local",
        passHash: DEMO_PASS_HASH,
        firstName: "Рен",
        lastName: "Учиха",
        discord: "ren#0003",
        positions: ["Второй врач Конохи", "Хирург", "Скальпель"],
        rank: "Ст. медик",
        clan: "Учиха",
        status: "active",
        createdAt: iso(96, 9)
      }),
      baseUser({
        id: "u4",
        email: "mio@medcorpus.local",
        passHash: DEMO_PASS_HASH,
        firstName: "Мио",
        lastName: "Хьюга",
        discord: "mio#0004",
        positions: ["Полевой медик", "Медик"],
        rank: "Медик",
        clan: "Хьюга",
        status: "active",
        createdAt: iso(80, 9)
      }),
      baseUser({
        id: "u5",
        email: "kaede@medcorpus.local",
        passHash: DEMO_PASS_HASH,
        firstName: "Каэдэ",
        lastName: "Нара",
        discord: "kaede#0005",
        positions: ["Полевой медик", "Тайдзюцу"],
        rank: "Медик",
        clan: "Нара",
        status: "active",
        createdAt: iso(74, 9)
      }),
      baseUser({
        id: "u6",
        email: "sora@medcorpus.local",
        passHash: DEMO_PASS_HASH,
        firstName: "Сора",
        lastName: "Учиха",
        discord: "sora#0006",
        positions: ["Медик", "Скальпель"],
        rank: "Медик",
        clan: "Учиха",
        status: "active",
        createdAt: iso(60, 9)
      }),
      baseUser({
        id: "u7",
        email: "haru@medcorpus.local",
        passHash: DEMO_PASS_HASH,
        firstName: "Хару",
        lastName: "Мицу",
        discord: "haru#0007",
        positions: ["Интерн"],
        rank: "Интерн",
        clan: "Нет клана",
        status: "active",
        createdAt: iso(32, 9)
      }),
      baseUser({
        id: "u8",
        email: "tetsu@medcorpus.local",
        passHash: DEMO_PASS_HASH,
        firstName: "Тэцу",
        lastName: "Нара",
        discord: "tetsu#0008",
        positions: ["Медик"],
        rank: "Медик",
        clan: "Нара",
        status: "inactive",
        warnings: { oral: [true, false, false], written: [false, false] },
        createdAt: iso(140, 9)
      }),
      baseUser({
        id: "u9",
        email: "aya@medcorpus.local",
        passHash: DEMO_PASS_HASH,
        firstName: "Ая",
        lastName: "Хьюга",
        discord: "aya#0009",
        positions: ["Хирург", "Второй врач Конохи"],
        rank: "Ст. медик",
        clan: "Хьюга",
        status: "active",
        createdAt: iso(90, 9)
      })
    ];

    var reports = [
      {
        id: "r1",
        userId: "u4",
        title: "Отчёт о полевой смене",
        body: "За время смены принято 6 раненых. Двое с отравлением неизвестным составом, антидот подбирали на месте. Запас стандартных противоядий израсходован на 70%. Прошу пополнить аптечку перед следующим выходом.",
        status: "new",
        createdAt: iso(1, 18)
      },
      {
        id: "r2",
        userId: "u5",
        title: "Рапорт о переводе в хирургию",
        body: "Прошу рассмотреть перевод в хирургическое отделение. Имею практику полевой медицины и тайдзюцу, готова пройти аттестацию на скальпель чакры.",
        status: "read",
        createdAt: iso(4, 14)
      }
    ];

    return { version: DB_VERSION, users: users, reports: reports };
  }

  function emit(db) {
    listeners.forEach(function (fn) {
      try { fn(db); } catch (e) { console.error(e); }
    });
  }

  function persist(db) {
    db.version = DB_VERSION;
    db.updatedAt = Date.now();
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.error("Не удалось сохранить данные", e);
    }
    emit(db);
    queueCloudPush(db);
    return db;
  }

  function getDB() {
    var raw = null;
    try { raw = localStorage.getItem(DB_KEY); } catch (e) { raw = null; }

    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.reports)) {
          var normalized = normalizeDb(parsed);
          if (canon(normalized) !== canon(parsed)) {
            try { localStorage.setItem(DB_KEY, JSON.stringify(normalized)); } catch (e) { /* ignore */ }
          }
          return normalized;
        }
      } catch (e) {
        console.warn("Повреждённые данные, создаю заново", e);
      }
    }

    var fresh = normalizeDb(seed());
    fresh.updatedAt = 0;
    try { localStorage.setItem(DB_KEY, JSON.stringify(fresh)); } catch (e) { /* ignore */ }
    return fresh;
  }

  function save(db) { return persist(db); }

  function subscribe(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (item) { return item !== fn; });
    };
  }

  function users() { return getDB().users.slice(); }

  function userById(id) {
    return getDB().users.filter(function (u) { return u.id === id; })[0] || null;
  }

  function userByEmail(email) {
    var needle = String(email || "").trim().toLowerCase();
    return getDB().users.filter(function (u) { return u.email === needle; })[0] || null;
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function createUser(data) {
    var db = getDB();
    var email = String(data.email || "").trim().toLowerCase();
    if (!email) throw new Error("Укажите email.");
    if (db.users.some(function (u) { return u.email === email; })) {
      throw new Error("Пользователь с таким email уже существует.");
    }
    var user = baseUser({
      id: data.id || uid("u"),
      email: email,
      passHash: data.passHash,
      role: data.role || "user",
      firstName: data.firstName,
      lastName: data.lastName,
      discord: data.discord,
      photo: data.photo,
      positions: data.positions,
      rank: data.rank,
      clan: data.clan,
      status: data.status,
      warnings: data.warnings,
      createdAt: iso(0, 12)
    });
    if (!user.firstName) throw new Error("Укажите имя.");
    user.updatedAt = Math.max(Date.now(), (Number(db.epoch) || 0) + 1);
    db.users.push(user);
    save(db);
    return user;
  }

  function updateUser(id, patch) {
    var db = getDB();
    var found = null;
    db.users = db.users.map(function (u) {
      if (u.id !== id) return u;
      found = baseUser(Object.assign({}, u, patch, { id: u.id, email: patch.email ? String(patch.email).toLowerCase() : u.email }));
      return found;
    });
    if (!found) throw new Error("Пользователь не найден.");
    found.updatedAt = Math.max(Date.now(), (Number(db.epoch) || 0) + 1);
    save(db);
    return found;
  }

  function deleteUser(id) {
    var db = getDB();
    var target = db.users.filter(function (u) { return u.id === id; })[0];
    if (!target) throw new Error("Пользователь не найден.");
    if (target.role === "developer") throw new Error("Аккаунт разработчика удалить нельзя.");

    var session = null;
    try { session = localStorage.getItem(SESSION_KEY); } catch (e) { session = null; }
    if (session === id) throw new Error("Нельзя удалить аккаунт, под которым вы вошли.");

    var now = Math.max(Date.now(), (Number(db.epoch) || 0) + 1);
    db.removed = db.removed || { users: {}, reports: {} };
    db.removed.users[id] = now;
    db.reports.forEach(function (r) {
      if (r.userId === id) db.removed.reports[r.id] = now;
    });

    db.users = db.users.filter(function (u) { return u.id !== id; });
    db.reports = db.reports.filter(function (r) { return r.userId !== id; });
    save(db);
    return target;
  }

  function reports() {
    return getDB().reports.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function addReport(userId, title, body) {
    var db = getDB();
    var report = {
      id: uid("r"),
      userId: userId,
      title: String(title || "").trim(),
      body: String(body || "").trim(),
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: Math.max(Date.now(), (Number(db.epoch) || 0) + 1)
    };
    if (!report.title || !report.body) throw new Error("Заполните заголовок и текст рапорта.");
    db.reports.push(report);
    save(db);
    return report;
  }

  function updateReport(id, patch) {
    var db = getDB();
    var now = Math.max(Date.now(), (Number(db.epoch) || 0) + 1);
    db.reports = db.reports.map(function (r) {
      return r.id === id ? normalizeReport(Object.assign({}, r, patch, { updatedAt: now })) : r;
    });
    save(db);
  }

  function deleteReport(id) {
    var db = getDB();
    db.removed = db.removed || { users: {}, reports: {} };
    db.removed.reports[id] = Math.max(Date.now(), (Number(db.epoch) || 0) + 1);
    db.reports = db.reports.filter(function (r) { return r.id !== id; });
    save(db);
  }

  function loginSession(id) {
    try { localStorage.setItem(SESSION_KEY, id); } catch (e) { /* ignore */ }
  }

  function logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    emit(getDB());
  }

  function sessionUser() {
    var id = null;
    try { id = localStorage.getItem(SESSION_KEY); } catch (e) { id = null; }
    if (!id) return null;
    var user = userById(id);
    if (!user) {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
      return null;
    }
    return user;
  }

  function displayName(user) {
    if (!user) return "";
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Без имени";
  }

  function warningCount(user) {
    var w = normalizeWarnings(user && user.warnings);
    var oral = w.oral.filter(Boolean).length;
    var written = w.written.filter(Boolean).length;
    return { oral: oral, written: written, total: oral + written };
  }

  function isLead(user) {
    return hasPosition(user, "Глава Медицинского Корпуса");
  }

  function isDeputy(user) {
    return hasPosition(user, "Заместитель Главы");
  }

  function rankWeight(user) {
    if (isLead(user)) return 0;
    if (isDeputy(user)) return 1;
    if (hasPosition(user, "Главный врач больницы Листа")) return 2;
    if (hasPosition(user, "Второй врач Конохи")) return 3;
    if (user.rank === "Ст. медик") return 4;
    if (user.rank === "Медик") return 5;
    return 6;
  }

  function rosterUsers() {
    return users()
      .filter(function (u) {
        /* Разработчик тоже состоит в корпусе, если ему назначена должность. */
        if (u.role !== "developer") return true;
        return u.positions.length > 0;
      })
      .sort(function (a, b) {
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        var diff = rankWeight(a) - rankWeight(b);
        if (diff) return diff;
        return displayName(a).localeCompare(displayName(b), "ru");
      });
  }

  /* ---------- Облачная синхронизация (Supabase) ---------- */
  var CONFIG = window.MC_CONFIG || {};
  var CLOUD_ON = !!(CONFIG.supabaseUrl && CONFIG.supabaseKey);
  var CLOUD_TABLE = CONFIG.table || "medcorpus_state";
  var CLOUD_ROW = CONFIG.rowId || "main";
  var CLOUD_BASE = String(CONFIG.supabaseUrl || "").replace(/\/+$/, "");
  if (/\/rest\/v1$/.test(CLOUD_BASE)) CLOUD_BASE = CLOUD_BASE.replace(/\/rest\/v1$/, "");
  var CLOUD_URL = CLOUD_ON ? CLOUD_BASE + "/rest/v1/" + CLOUD_TABLE : "";
  var CLOUD_POLL_MS = 15000;

  var cloudTimer = null;

  function cloudHeaders() {
    return {
      "apikey": CONFIG.supabaseKey,
      "Authorization": "Bearer " + CONFIG.supabaseKey,
      "Content-Type": "application/json"
    };
  }

  function readRaw() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.reports)) return parsed;
    } catch (e) { /* ignore */ }
    return null;
  }

  /* ---------- Слияние состояний ----------
     Каждый пользователь и рапорт хранит собственный updatedAt, а удаления
     помечаются «надгробиями». Поэтому регистрация или правка из любого
     браузера не пропадает, даже если другой браузер в этот момент
     отправил своё состояние. */

  function normalizeReport(data) {
    var source = data || {};
    return {
      id: source.id,
      userId: source.userId,
      title: String(source.title || ""),
      body: String(source.body || ""),
      status: source.status || "new",
      createdAt: source.createdAt || "",
      updatedAt: Number(source.updatedAt) || 0
    };
  }

  function normalizeTombs(input) {
    var out = {};
    if (!input || typeof input !== "object") return out;
    Object.keys(input).forEach(function (id) {
      var ts = Number(input[id]);
      if (id && ts > 0) out[id] = ts;
    });
    return out;
  }

  function normalizeDb(data) {
    var db = data && typeof data === "object" ? data : {};
    var removed = db.removed && typeof db.removed === "object" ? db.removed : {};
    return {
      version: DB_VERSION,
      epoch: Number(db.epoch) || 0,
      updatedAt: Number(db.updatedAt) || 0,
      users: Array.isArray(db.users) ? db.users.map(baseUser) : [],
      reports: Array.isArray(db.reports) ? db.reports.map(normalizeReport) : [],
      removed: {
        users: normalizeTombs(removed.users),
        reports: normalizeTombs(removed.reports)
      }
    };
  }

  /* Стабильная сериализация: одинаковые данные дают одинаковую строку. */
  function canon(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(canon).join(",") + "]";
    return "{" + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ":" + canon(value[key]);
    }).join(",") + "}";
  }

  /* epochFloor — метка явной публикации из другого браузера. Локальные
     записи, созданные до неё, считаются устаревшими; записи, созданные
     после (например, новая регистрация), сохраняются. */
  function mergeCollection(localItems, remoteItems, localTombs, remoteTombs, epochFloor) {
    var locals = {};
    var remotes = {};
    var tombs = {};
    var floor = Number(epochFloor) || 0;

    (localItems || []).forEach(function (item) {
      if (item && item.id && (!floor || Number(item.updatedAt) > floor)) locals[item.id] = item;
    });
    (remoteItems || []).forEach(function (item) { if (item && item.id) remotes[item.id] = item; });

    Object.keys(localTombs || {}).forEach(function (id) {
      if (floor && Number(localTombs[id]) <= floor) return;
      tombs[id] = Math.max(tombs[id] || 0, localTombs[id]);
    });
    Object.keys(remoteTombs || {}).forEach(function (id) {
      tombs[id] = Math.max(tombs[id] || 0, remoteTombs[id]);
    });

    var ids = {};
    Object.keys(locals).forEach(function (id) { ids[id] = true; });
    Object.keys(remotes).forEach(function (id) { ids[id] = true; });

    var items = [];
    var localWins = false;

    Object.keys(ids).forEach(function (id) {
      var l = locals[id];
      var r = remotes[id];
      var lt = l ? Number(l.updatedAt) || 0 : 0;
      var rt = r ? Number(r.updatedAt) || 0 : 0;
      var t = tombs[id] || 0;

      if (t && t >= lt && t >= rt) {
        if (r) localWins = true; /* удаление ещё не дошло до облака */
        return;
      }

      if (l && r) {
        if (lt > rt) { items.push(l); localWins = true; }
        else items.push(r);
      } else if (l) {
        items.push(l);
        localWins = true;
      } else if (r) {
        items.push(r);
      }
    });

    return { items: items, tombs: tombs, localWins: localWins };
  }

  function mergeDb(localData, remoteData, epochFloor) {
    var local = normalizeDb(localData);
    var remote = normalizeDb(remoteData);

    var users = mergeCollection(local.users, remote.users, local.removed.users, remote.removed.users, epochFloor);
    var reports = mergeCollection(local.reports, remote.reports, local.removed.reports, remote.removed.reports, epochFloor);

    return {
      state: {
        version: DB_VERSION,
        epoch: Math.max(local.epoch, remote.epoch),
        updatedAt: Math.max(local.updatedAt, remote.updatedAt),
        users: users.items,
        reports: reports.items,
        removed: { users: users.tombs, reports: reports.tombs }
      },
      localWins: users.localWins || reports.localWins
    };
  }

  function adopt(db) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
    emit(db);
  }

  function cloudPull() {
    return fetch(CLOUD_URL + "?id=eq." + encodeURIComponent(CLOUD_ROW) + "&select=data", {
      headers: cloudHeaders(),
      cache: "no-store"
    }).then(function (res) {
      if (!res.ok) throw new Error("Supabase pull: " + res.status);
      return res.json();
    }).then(function (rows) {
      return rows && rows[0] ? rows[0].data : null;
    });
  }

  function cloudPush(db) {
    if (!CLOUD_ON || !db) return Promise.resolve(false);
    return fetch(CLOUD_URL + "?on_conflict=id", {
      method: "POST",
      headers: Object.assign({}, cloudHeaders(), {
        "Prefer": "resolution=merge-duplicates,return=minimal"
      }),
      body: JSON.stringify([{
        id: CLOUD_ROW,
        data: db,
        updated_at: new Date().toISOString()
      }])
    }).then(function (res) {
      if (!res.ok) throw new Error("Supabase push: " + res.status);
      return true;
    });
  }

  function hasLocalChanges(db) {
    var source = db || normalizeDb(readRaw());
    if (!source) return false;
    return source.users.some(function (u) { return Number(u.updatedAt) > 0; }) ||
      source.reports.some(function (r) { return Number(r.updatedAt) > 0; }) ||
      Object.keys(source.removed.users).length > 0 ||
      Object.keys(source.removed.reports).length > 0;
  }

  /* Все обращения к облаку идут по очереди: ответ одного запроса не должен
     перезаписывать изменения, сделанные во время другого. */
  var cloudQueue = Promise.resolve();

  function runCloud(task) {
    var next = cloudQueue.then(task, task);
    cloudQueue = next.catch(function () { /* ignore */ });
    return next;
  }

  function queueCloudPush(db) {
    if (!CLOUD_ON || !db) return;
    if (cloudTimer) clearTimeout(cloudTimer);
    cloudTimer = setTimeout(function () {
      cloudTimer = null;
      flushCloudPush().catch(function (error) {
        console.warn("Не удалось сохранить данные в облако:", error);
      });
    }, 600);
  }

  /* Отправка с предварительным чтением облака: записи других устройств
     сохраняются, а метка явной публикации (epoch) никогда не понижается. */
  function flushCloudPush() {
    if (!CLOUD_ON) return Promise.resolve(false);
    if (cloudTimer) { clearTimeout(cloudTimer); cloudTimer = null; }

    return runCloud(function () {
      var local = normalizeDb(readRaw() || getDB());

      return cloudPull().catch(function () { return null; }).then(function (remote) {
        if (!remote || !Array.isArray(remote.users)) {
          if (!hasLocalChanges(local)) return false;
          return cloudPush(local);
        }

        var remoteDb = normalizeDb(remote);
        var localEpoch = Number(local.epoch) || 0;
        var remoteEpoch = Number(remoteDb.epoch) || 0;
        var merged;

        if (remoteEpoch > localEpoch) {
          /* Кто-то опубликовал базу позже нас: его состояние главнее, но
             регистрации, сделанные уже после публикации, сохраняем. */
          merged = mergeDb(local, remoteDb, remoteEpoch).state;
          merged.epoch = remoteEpoch;
        } else {
          merged = mergeDb(local, remoteDb).state;
          merged.epoch = Math.max(localEpoch, remoteEpoch);
        }

        if (canon(merged) !== canon(local)) adopt(merged);
        if (canon(merged) === canon(remoteDb)) return false;
        return cloudPush(merged);
      });
    });
  }

  function applyRemote(remoteData) {
    if (!remoteData || !Array.isArray(remoteData.users)) return false;

    var remote = normalizeDb(remoteData);
    var local = readRaw();
    if (!local) {
      adopt(remote);
      return true;
    }

    var localDb = normalizeDb(local);
    var localEpoch = localDb.epoch || 0;
    var remoteEpoch = remote.epoch || 0;

    /* Публикация из другого браузера: принимаем её состояние, но сохраняем
       записи, появившиеся здесь уже после этой публикации. */
    if (remoteEpoch > localEpoch) {
      var published = mergeDb(localDb, remote, remoteEpoch).state;
      published.epoch = remoteEpoch;
      var publishedChanged = canon(published) !== canon(localDb);
      if (publishedChanged) adopt(published);
      if (canon(published) !== canon(remote)) queueCloudPush(published);
      return publishedChanged;
    }

    /* Этот браузер опубликован позже — отправляем его состояние. */
    if (localEpoch > remoteEpoch) {
      queueCloudPush(localDb);
      return false;
    }

    var merged = mergeDb(localDb, remote).state;
    var changed = canon(merged) !== canon(localDb);

    if (changed) adopt(merged);
    if (canon(merged) !== canon(remote)) {
      /* В этом браузере есть записи, которых нет в облаке: отправляем их. */
      queueCloudPush(merged);
    }
    return changed;
  }

  function cloudTick() {
    if (!CLOUD_ON) return Promise.resolve();

    return runCloud(function () {
      return cloudPull().then(function (remote) {
        if (!remote) {
          /* В облаке ещё нет строки: создаём её, только если в этом браузере
             уже есть настоящие изменения (например, регистрация). */
          var local = normalizeDb(readRaw() || getDB());
          if (hasLocalChanges(local)) {
            notifyCloudState(true);
            return cloudPush(local);
          }
          notifyCloudState(false);
          return null;
        }
        notifyCloudState(true);
        applyRemote(remote);
        return null;
      }).catch(function (error) {
        notifyCloudState(null);
        console.warn("Синхронизация с облаком недоступна:", error);
        return null;
      });
    });
  }

  function notifyCloudState(hasData) {
    try {
      document.dispatchEvent(new CustomEvent("mccloud", { detail: { hasData: hasData } }));
    } catch (e) { /* ignore */ }
  }

  /* Явная публикация: состояние этого браузера становится общим. */
  function publishLocal() {
    if (!CLOUD_ON) return Promise.reject(new Error("Общая база не подключена."));
    if (cloudTimer) { clearTimeout(cloudTimer); cloudTimer = null; }

    return runCloud(function () {
      var local = normalizeDb(getDB());
      return cloudPull().catch(function () { return null; }).then(function (remote) {
        var remoteEpoch = remote ? Number(remote.epoch) || 0 : 0;
        local.epoch = Math.max(Date.now(), remoteEpoch + 1, (local.epoch || 0) + 1);
        local.updatedAt = Date.now();
        adopt(local);
        return cloudPush(local);
      }).then(function () {
        notifyCloudState(true);
        return normalizeDb(getDB());
      });
    });
  }

  /* Явная загрузка данных из общей базы, даже если они «старше» локальных. */
  function loadRemote() {
    if (!CLOUD_ON) return Promise.reject(new Error("Общая база не подключена."));
    return runCloud(function () {
      return cloudPull().then(function (remote) {
        if (!remote || !Array.isArray(remote.users)) throw new Error("В общей базе пока нет данных.");
        var adopted = normalizeDb(remote);
        adopt(adopted);
        notifyCloudState(true);
        return adopted;
      });
    });
  }

  function startCloud() {
    if (!CLOUD_ON) return;
    cloudTick();
    setInterval(cloudTick, CLOUD_POLL_MS);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) cloudTick();
    });
    window.addEventListener("online", cloudTick);
  }

  window.MCStore = {
    POSITIONS: POSITIONS,
    LEAD_POSITIONS: LEAD_POSITIONS,
    STAFF_POSITIONS: STAFF_POSITIONS,
    RANKS: RANKS,
    CLANS: CLANS,
    WARNING_SLOTS: WARNING_SLOTS,
    getDB: getDB,
    users: users,
    userById: userById,
    userByEmail: userByEmail,
    createUser: createUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    reports: reports,
    addReport: addReport,
    updateReport: updateReport,
    deleteReport: deleteReport,
    loginSession: loginSession,
    logout: logout,
    sessionUser: sessionUser,
    displayName: displayName,
    warningCount: warningCount,
    normalizeWarnings: normalizeWarnings,
    normalizePosition: normalizePosition,
    hasPosition: hasPosition,
    isLead: isLead,
    isDeputy: isDeputy,
    rankWeight: rankWeight,
    rosterUsers: rosterUsers,
    subscribe: subscribe,
    uid: uid,
    cloudEnabled: CLOUD_ON,
    syncNow: cloudTick,
    pushNow: flushCloudPush,
    hasLocalChanges: hasLocalChanges,
    publishLocal: publishLocal,
    loadRemote: loadRemote
  };

  startCloud();
})();
