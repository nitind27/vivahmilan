// Prisma-compatible wrapper using raw mysql2 pool
// Replaces Prisma v7 custom adapter which has transaction bugs
import { pool, query, queryOne, execute } from './db.js';

// Simple proxy that maps prisma.model.method() to raw SQL
// Only implements methods actually used in this app

// Tables that have an updatedAt column
const TABLES_WITH_UPDATED_AT = new Set([
  'user', 'profile', 'interest', 'planconfig', 'siteconfig',
  'document', 'profileoption',
]);

function makeModel(table) {
  return {
    async findUnique({ where, include, select }) {
      const [col, val] = Object.entries(where)[0];
      const row = await queryOne(`SELECT * FROM \`${table}\` WHERE \`${col}\` = ? LIMIT 1`, [val]);
      if (!row || !include) return row;
      return resolveIncludes(row, table, include);
    },

    async findFirst({ where = {}, include, orderBy, take } = {}) {
      const { sql, params } = buildWhere(where);
      const order = buildOrder(orderBy);
      const rows = await query(`SELECT * FROM \`${table}\` ${sql} ${order} LIMIT ${take || 1}`, params);
      const row = rows[0] ?? null;
      if (!row || !include) return row;
      return resolveIncludes(row, table, include);
    },

    async findMany({ where = {}, include, orderBy, take, skip, select } = {}) {
      const { sql, params } = buildWhere(where);
      const order = buildOrder(orderBy);
      const limit = take ? `LIMIT ${take}` : '';
      const offset = skip ? `OFFSET ${skip}` : '';
      const rows = await query(`SELECT * FROM \`${table}\` ${sql} ${order} ${limit} ${offset}`, params);
      if (!include) return rows;
      return Promise.all(rows.map(r => resolveIncludes(r, table, include)));
    },

    async create({ data, select }) {
      const nested = {};
      const flat = {};
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && ('create' in v || 'connect' in v)) {
          nested[k] = v;
        } else {
          flat[k] = v;
        }
      }
      if (!flat.id) flat.id = crypto.randomUUID();
      if (!flat.createdAt) flat.createdAt = new Date();
      if (TABLES_WITH_UPDATED_AT.has(table) && !flat.updatedAt) flat.updatedAt = new Date();

      const cols = Object.keys(flat).map(k => `\`${k}\``).join(', ');
      const placeholders = Object.keys(flat).map(() => '?').join(', ');
      await execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`, Object.values(flat));

      // Handle nested creates
      for (const [rel, val] of Object.entries(nested)) {
        if (val.create) {
          const relTable = getRelTable(table, rel);
          if (relTable) {
            const creates = Array.isArray(val.create) ? val.create : [val.create];
            for (const cd of creates) {
              const relData = { ...cd, id: cd.id || crypto.randomUUID(), createdAt: new Date() };
              const fk = getForeignKey(table);
              if (fk) relData[fk] = flat.id;
              if (relTable === 'profile') relData.updatedAt = new Date();
              const rc = Object.keys(relData).map(k => `\`${k}\``).join(', ');
              const rp = Object.keys(relData).map(() => '?').join(', ');
              await execute(`INSERT INTO \`${relTable}\` (${rc}) VALUES (${rp})`, Object.values(relData));
            }
          }
        }
      }

      return queryOne(`SELECT * FROM \`${table}\` WHERE id = ?`, [flat.id]);
    },

    async update({ where, data }) {
      const [col, val] = Object.entries(where)[0];
      const flat = {};
      for (const [k, v] of Object.entries(data)) {
        if (v === null || typeof v !== 'object' || v instanceof Date) flat[k] = v;
      }
      if (TABLES_WITH_UPDATED_AT.has(table)) flat.updatedAt = new Date();
      const sets = Object.keys(flat).map(k => `\`${k}\` = ?`).join(', ');
      await execute(`UPDATE \`${table}\` SET ${sets} WHERE \`${col}\` = ?`, [...Object.values(flat), val]);
      return queryOne(`SELECT * FROM \`${table}\` WHERE \`${col}\` = ?`, [val]);
    },

    async upsert({ where, create, update }) {
      const [col, val] = Object.entries(where)[0];
      const existing = await queryOne(`SELECT id FROM \`${table}\` WHERE \`${col}\` = ?`, [val]);
      if (existing) {
        return this.update({ where, data: update });
      } else {
        return this.create({ data: { ...create, [col]: val } });
      }
    },

    async delete({ where }) {
      const [col, val] = Object.entries(where)[0];
      await execute(`DELETE FROM \`${table}\` WHERE \`${col}\` = ?`, [val]);
      return { success: true };
    },

    async deleteMany({ where = {} }) {
      const { sql, params } = buildWhere(where);
      const result = await execute(`DELETE FROM \`${table}\` ${sql}`, params);
      return { count: result.affectedRows };
    },

    async updateMany({ where = {}, data }) {
      const { sql, params } = buildWhere(where);
      const sets = Object.keys(data).map(k => `\`${k}\` = ?`).join(', ');
      const result = await execute(`UPDATE \`${table}\` SET ${sets} ${sql}`, [...Object.values(data), ...params]);
      return { count: result.affectedRows };
    },

    async count({ where = {} } = {}) {
      const { sql, params } = buildWhere(where);
      const row = await queryOne(`SELECT COUNT(*) as cnt FROM \`${table}\` ${sql}`, params);
      return row?.cnt ?? 0;
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildWhere(where) {
  if (!where || Object.keys(where).length === 0) return { sql: '', params: [] };
  const conditions = [];
  const params = [];
  for (const [k, v] of Object.entries(where)) {
    if (k === 'OR') {
      const parts = v.map(cond => {
        const { sql: s, params: p } = buildWhere(cond);
        params.push(...p);
        return s.replace('WHERE ', '');
      });
      conditions.push(`(${parts.join(' OR ')})`);
    } else if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      if ('startsWith' in v) { conditions.push(`\`${k}\` LIKE ?`); params.push(`${v.startsWith}%`); }
      else if ('contains' in v) { conditions.push(`\`${k}\` LIKE ?`); params.push(`%${v.contains}%`); }
      else if ('not' in v) { conditions.push(`\`${k}\` != ?`); params.push(v.not); }
      else if ('in' in v) { conditions.push(`\`${k}\` IN (?)`); params.push(v.in); }
      else if ('gte' in v) { conditions.push(`\`${k}\` >= ?`); params.push(v.gte); }
      else if ('lte' in v) { conditions.push(`\`${k}\` <= ?`); params.push(v.lte); }
      else if ('gt' in v) { conditions.push(`\`${k}\` > ?`); params.push(v.gt); }
      else if ('lt' in v) { conditions.push(`\`${k}\` < ?`); params.push(v.lt); }
    } else {
      if (v === null) { conditions.push(`\`${k}\` IS NULL`); }
      else { conditions.push(`\`${k}\` = ?`); params.push(v); }
    }
  }
  return { sql: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

function buildOrder(orderBy) {
  if (!orderBy) return '';
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts = entries.flatMap(o => Object.entries(o).map(([k, v]) => `\`${k}\` ${v.toUpperCase()}`));
  return parts.length ? `ORDER BY ${parts.join(', ')}` : '';
}

function getRelTable(parentTable, rel) {
  const map = {
    user: { profile: 'profile', photos: 'photo', otps: 'otp', documents: 'document', notifications: 'notification', subscriptions: 'subscription' },
    chatroom: { messages: 'message' },
  };
  return map[parentTable]?.[rel] ?? null;
}

function getForeignKey(parentTable) {
  const map = { user: 'userId', chatroom: 'chatRoomId' };
  return map[parentTable] ?? null;
}

async function resolveIncludes(row, table, include) {
  const result = { ...row };
  for (const [rel, opts] of Object.entries(include)) {
    if (!opts) continue;
    const relTable = getRelTable(table, rel);
    if (!relTable) continue;
    const fk = getForeignKey(table);
    if (!fk) continue;
    const relWhere = typeof opts === 'object' && opts.where ? opts.where : {};
    const { sql, params } = buildWhere({ [fk]: row.id, ...relWhere });
    const order = typeof opts === 'object' ? buildOrder(opts.orderBy) : '';
    const limit = typeof opts === 'object' && opts.take ? `LIMIT ${opts.take}` : '';
    const rows = await query(`SELECT * FROM \`${relTable}\` ${sql} ${order} ${limit}`, params);
    result[rel] = rows;
  }
  return result;
}

// ── Export prisma-compatible object ──────────────────────────────────────────

const prisma = {
  user: makeModel('user'),
  profile: makeModel('profile'),
  photo: makeModel('photo'),
  interest: makeModel('interest'),
  chatRoom: makeModel('chatroom'),
  message: makeModel('message'),
  shortlist: makeModel('shortlist'),
  profileView: makeModel('profileview'),
  notification: makeModel('notification'),
  profileOption: makeModel('profileoption'),
  planConfig: makeModel('planconfig'),
  subscription: makeModel('subscription'),
  document: makeModel('document'),
  report: makeModel('report'),
  block: makeModel('block'),
  oTP: makeModel('otp'),
  otp: makeModel('otp'),
  verificationToken: makeModel('verificationtoken'),
  account: makeModel('account'),
  session: makeModel('session'),
  $disconnect: async () => {},
  $queryRaw: async (strings, ...values) => query(strings.join('?'), values),
};

export default prisma;
