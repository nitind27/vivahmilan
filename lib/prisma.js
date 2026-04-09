// Pure mysql2 wrapper — NO Prisma client, NO adapter
import { pool, query, queryOne, execute } from "./db.js";

function makeModel(table) {
  return {
    async findUnique({ where, include } = {}) {
      const [col, val] = Object.entries(where)[0];
      const row = await queryOne("SELECT * FROM `" + table + "` WHERE `" + col + "` = ? LIMIT 1", [val]);
      if (!row || !include) return row;
      return resolveIncludes(row, table, include);
    },
    async findFirst({ where = {}, include, orderBy, take } = {}) {
      const { sql, params } = buildWhere(where);
      const order = buildOrder(orderBy);
      const rows = await query("SELECT * FROM `" + table + "` " + sql + " " + order + " LIMIT " + (take || 1), params);
      const row = rows[0] ?? null;
      if (!row || !include) return row;
      return resolveIncludes(row, table, include);
    },
    async findMany({ where = {}, include, orderBy, take, skip } = {}) {
      const { sql, params } = buildWhere(where);
      const order = buildOrder(orderBy);
      const limit = take ? "LIMIT " + take : "";
      const offset = skip ? "OFFSET " + skip : "";
      const rows = await query("SELECT * FROM `" + table + "` " + sql + " " + order + " " + limit + " " + offset, params);
      if (!include) return rows;
      return Promise.all(rows.map(r => resolveIncludes(r, table, include)));
    },
    async create({ data }) {
      const nested = {}, flat = {};
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === "object" && !(v instanceof Date) && ("create" in v || "connect" in v)) nested[k] = v;
        else flat[k] = v;
      }
      if (!flat.id) flat.id = crypto.randomUUID();
      if (!flat.createdAt) flat.createdAt = new Date();
      if (!flat.updatedAt) flat.updatedAt = new Date();
      const cols = Object.keys(flat).map(k => "`" + k + "`").join(", ");
      const ph = Object.keys(flat).map(() => "?").join(", ");
      await execute("INSERT INTO `" + table + "` (" + cols + ") VALUES (" + ph + ")", Object.values(flat));
      for (const [rel, val] of Object.entries(nested)) {
        if (val.create) {
          const relTable = getRelTable(table, rel);
          if (relTable) {
            const creates = Array.isArray(val.create) ? val.create : [val.create];
            for (const cd of creates) {
              const rd = { ...cd, id: cd.id || crypto.randomUUID(), createdAt: new Date() };
              const fk = getForeignKey(table);
              if (fk) rd[fk] = flat.id;
              if (relTable === "profile") rd.updatedAt = new Date();
              const rc = Object.keys(rd).map(k => "`" + k + "`").join(", ");
              const rp = Object.keys(rd).map(() => "?").join(", ");
              await execute("INSERT INTO `" + relTable + "` (" + rc + ") VALUES (" + rp + ")", Object.values(rd));
            }
          }
        }
      }
      return queryOne("SELECT * FROM `" + table + "` WHERE id = ?", [flat.id]);
    },
    async update({ where, data }) {
      const [col, val] = Object.entries(where)[0];
      const flat = {};
      for (const [k, v] of Object.entries(data)) {
        if (v === null || !(typeof v === "object") || v instanceof Date) flat[k] = v;
      }
      flat.updatedAt = new Date();
      const sets = Object.keys(flat).map(k => "`" + k + "` = ?").join(", ");
      await execute("UPDATE `" + table + "` SET " + sets + " WHERE `" + col + "` = ?", [...Object.values(flat), val]);
      return queryOne("SELECT * FROM `" + table + "` WHERE `" + col + "` = ?", [val]);
    },
    async upsert({ where, create, update }) {
      const [col, val] = Object.entries(where)[0];
      const existing = await queryOne("SELECT id FROM `" + table + "` WHERE `" + col + "` = ?", [val]);
      if (existing) return this.update({ where, data: update });
      return this.create({ data: { ...create, [col]: val } });
    },
    async delete({ where }) {
      const [col, val] = Object.entries(where)[0];
      await execute("DELETE FROM `" + table + "` WHERE `" + col + "` = ?", [val]);
      return { success: true };
    },
    async deleteMany({ where = {} } = {}) {
      const { sql, params } = buildWhere(where);
      const r = await execute("DELETE FROM `" + table + "` " + sql, params);
      return { count: r.affectedRows };
    },
    async updateMany({ where = {}, data } = {}) {
      const { sql, params } = buildWhere(where);
      const sets = Object.keys(data).map(k => "`" + k + "` = ?").join(", ");
      const r = await execute("UPDATE `" + table + "` SET " + sets + " " + sql, [...Object.values(data), ...params]);
      return { count: r.affectedRows };
    },
    async count({ where = {} } = {}) {
      const { sql, params } = buildWhere(where);
      const row = await queryOne("SELECT COUNT(*) as cnt FROM `" + table + "` " + sql, params);
      return Number(row?.cnt ?? 0);
    },
  };
}

function buildWhere(where) {
  if (!where || !Object.keys(where).length) return { sql: "", params: [] };
  const conditions = [], params = [];
  for (const [k, v] of Object.entries(where)) {
    if (k === "OR") {
      const parts = v.map(c => { const { sql: s, params: p } = buildWhere(c); params.push(...p); return s.replace("WHERE ", ""); });
      conditions.push("(" + parts.join(" OR ") + ")");
    } else if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      if ("startsWith" in v) { conditions.push("`" + k + "` LIKE ?"); params.push(v.startsWith + "%"); }
      else if ("contains" in v) { conditions.push("`" + k + "` LIKE ?"); params.push("%" + v.contains + "%"); }
      else if ("not" in v) { conditions.push("`" + k + "` != ?"); params.push(v.not); }
      else if ("in" in v) { conditions.push("`" + k + "` IN (?)"); params.push(v.in); }
      else if ("gte" in v) { conditions.push("`" + k + "` >= ?"); params.push(v.gte); }
      else if ("lte" in v) { conditions.push("`" + k + "` <= ?"); params.push(v.lte); }
      else if ("gt" in v) { conditions.push("`" + k + "` > ?"); params.push(v.gt); }
      else if ("lt" in v) { conditions.push("`" + k + "` < ?"); params.push(v.lt); }
    } else {
      if (v === null) conditions.push("`" + k + "` IS NULL");
      else { conditions.push("`" + k + "` = ?"); params.push(v); }
    }
  }
  return { sql: conditions.length ? "WHERE " + conditions.join(" AND ") : "", params };
}

function buildOrder(orderBy) {
  if (!orderBy) return "";
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts = entries.flatMap(o => Object.entries(o).map(([k, v]) => "`" + k + "` " + v.toUpperCase()));
  return parts.length ? "ORDER BY " + parts.join(", ") : "";
}

function getRelTable(t, rel) {
  const map = { user: { profile: "profile", photos: "photo", otps: "otp", documents: "document", notifications: "notification", subscriptions: "subscription", accounts: "account", sessions: "session" }, chatroom: { messages: "message" } };
  return map[t]?.[rel] ?? null;
}

function getForeignKey(t) {
  return { user: "userId", chatroom: "chatRoomId" }[t] ?? null;
}

async function resolveIncludes(row, table, include) {
  const result = { ...row };
  for (const [rel, opts] of Object.entries(include)) {
    if (!opts) continue;
    const relTable = getRelTable(table, rel);
    if (!relTable) continue;
    const fk = getForeignKey(table);
    if (!fk) continue;
    const relWhere = typeof opts === "object" && opts.where ? opts.where : {};
    const { sql, params } = buildWhere({ [fk]: row.id, ...relWhere });
    const order = typeof opts === "object" ? buildOrder(opts.orderBy) : "";
    const limit = typeof opts === "object" && opts.take ? "LIMIT " + opts.take : "";
    result[rel] = await query("SELECT * FROM `" + relTable + "` " + sql + " " + order + " " + limit, params);
  }
  return result;
}

const prisma = {
  user: makeModel("user"), profile: makeModel("profile"), photo: makeModel("photo"),
  interest: makeModel("interest"), chatRoom: makeModel("chatroom"), message: makeModel("message"),
  shortlist: makeModel("shortlist"), profileView: makeModel("profileview"),
  notification: makeModel("notification"), profileOption: makeModel("profileoption"),
  planConfig: makeModel("planconfig"), subscription: makeModel("subscription"),
  document: makeModel("document"), report: makeModel("report"), block: makeModel("block"),
  oTP: makeModel("otp"), otp: makeModel("otp"),
  verificationToken: makeModel("verificationtoken"), account: makeModel("account"),
  session: makeModel("session"),
  $disconnect: async () => {},
};

export default prisma;
