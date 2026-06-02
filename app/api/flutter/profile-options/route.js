import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getProfileOptionCategories } from '@/lib/profileOptionsSeed.js';

/** Public profile dropdown options (religion, caste, education, etc.) */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const grouped = searchParams.get('grouped') === '1';

  if (!category) {
    if (grouped) {
      const all = await query(
        'SELECT category, value, label, `group`, sortOrder FROM profileoption WHERE isActive = 1 ORDER BY category ASC, sortOrder ASC, label ASC'
      );
      const byCat = {};
      for (const row of all) {
        if (!byCat[row.category]) byCat[row.category] = [];
        byCat[row.category].push({
          value: row.value,
          label: row.label,
          group: row.group,
          sortOrder: row.sortOrder,
        });
      }
      return NextResponse.json({
        categories: getProfileOptionCategories(),
        options: byCat,
      });
    }
    const all = await query(
      'SELECT id, category, value, label, `group`, sortOrder FROM profileoption WHERE isActive = 1 ORDER BY category ASC, sortOrder ASC, label ASC'
    );
    return NextResponse.json(all);
  }

  const options = await query(
    'SELECT id, value, label, `group`, sortOrder FROM profileoption WHERE category = ? AND isActive = 1 ORDER BY sortOrder ASC, label ASC',
    [category]
  );
  return NextResponse.json(options);
}
