/** Build SQL date window for admin analytics (days=1 = calendar today). */
export function getAnalyticsWindow(days) {
  const d = Math.max(1, parseInt(days, 10) || 30);

  if (d === 1) {
    return {
      days: 1,
      isToday: true,
      label: 'Today',
      whereSql: 'DATE(createdAt) = CURDATE()',
      params: [],
    };
  }

  const since = new Date(Date.now() - d * 86400000).toISOString().slice(0, 19).replace('T', ' ');
  return {
    days: d,
    isToday: false,
    label: `Last ${d} days`,
    whereSql: 'createdAt >= ?',
    params: [since],
  };
}

export function whereClause(window, tableAlias = '') {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  if (window.isToday) {
    return { sql: `DATE(${prefix}createdAt) = CURDATE()`, params: [] };
  }
  return { sql: `${prefix}createdAt >= ?`, params: window.params };
}
