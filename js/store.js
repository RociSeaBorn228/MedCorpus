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

  function baseUser(data) {
    return {
      id: data.id,
      email: String(data.email || "").trim().toLowerCase(),
      passHash: data.passHash,
      role: data.role || "user",
      firstName: String(data.firstName || "").trim(),
      lastName: String(data.lastName || "").trim(),
      discord: String(data.discord || "").trim(),
      photo: String(data.photo || "").trim(),
      positions: Array.isArray(data.positions) ? data.positions.filter(function (p) {
        return POSITIONS.indexOf(p) !== -1;
      }) : [],
      rank: RANKS.indexOf(data.rank) !== -1 ? data.rank : "Интерн",
      clan: CLANS.indexOf(data.clan) !== -1 ? data.clan : "Нет клана",
      status: STATUSES.indexOf(data.status) !== -1 ? data.status : "active",
      warnings: normalizeWarnings(data.warnings),
      createdAt: data.createdAt || iso(0, 12)
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
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.error("Не удалось сохранить данные", e);
    }
    emit(db);
    return db;
  }

  function getDB() {
    var raw = null;
    try { raw = localStorage.getItem(DB_KEY); } catch (e) { raw = null; }

    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.reports)) {
          var changed = false;
          parsed.users = parsed.users.map(function (u) {
            return baseUser(u);
          });
          if (parsed.version !== DB_VERSION) changed = true;
          parsed.version = DB_VERSION;
          if (changed) {
            try { localStorage.setItem(DB_KEY, JSON.stringify(parsed)); } catch (e) { /* ignore */ }
          }
          return parsed;
        }
      } catch (e) {
        console.warn("Повреждённые данные, создаю заново", e);
      }
    }

    var fresh = seed();
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
      createdAt: new Date().toISOString()
    };
    if (!report.title || !report.body) throw new Error("Заполните заголовок и текст рапорта.");
    db.reports.push(report);
    save(db);
    return report;
  }

  function updateReport(id, patch) {
    var db = getDB();
    db.reports = db.reports.map(function (r) {
      return r.id === id ? Object.assign({}, r, patch) : r;
    });
    save(db);
  }

  function deleteReport(id) {
    var db = getDB();
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
    return !!user && (user.positions.indexOf("Глава Медицинского Корпуса") !== -1);
  }

  function isDeputy(user) {
    return !!user && (user.positions.indexOf("Заместитель Главы") !== -1);
  }

  function rankWeight(user) {
    if (isLead(user)) return 0;
    if (isDeputy(user)) return 1;
    if (user.positions.indexOf("Главный врач больницы Листа") !== -1) return 2;
    if (user.positions.indexOf("Второй врач Конохи") !== -1) return 3;
    if (user.rank === "Ст. медик") return 4;
    if (user.rank === "Медик") return 5;
    return 6;
  }

  function rosterUsers() {
    return users()
      .filter(function (u) { return u.role !== "developer"; })
      .sort(function (a, b) {
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        var diff = rankWeight(a) - rankWeight(b);
        if (diff) return diff;
        return displayName(a).localeCompare(displayName(b), "ru");
      });
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
    isLead: isLead,
    isDeputy: isDeputy,
    rankWeight: rankWeight,
    rosterUsers: rosterUsers,
    subscribe: subscribe,
    uid: uid
  };
})();
