import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureFaqTable, formatFaqRow } from '@/lib/faq';

export async function GET(req) {
  await ensureFaqTable();
  const { searchParams } = new URL(req.url);
  const blog = searchParams.get('blog') === '1';
  const help = searchParams.get('help') === '1';

  let sql = 'SELECT * FROM faqitem WHERE isActive = 1';
  const params = [];

  if (blog) {
    sql += ' AND showOnBlog = 1';
  } else if (help) {
    sql += ' AND showOnHelp = 1';
  }

  sql += ' ORDER BY category ASC, sortOrder ASC, createdAt ASC';

  const rows = await query(sql, params);
  return NextResponse.json(rows.map(formatFaqRow));
}
