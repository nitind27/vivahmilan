import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureFaqTable, formatFaqRow } from '@/lib/faq';

export async function GET(req) {
  await ensureFaqTable();
  const { searchParams } = new URL(req.url);
  const blog = searchParams.get('blog') === '1';
  const help = searchParams.get('help') === '1';
  const home = searchParams.get('home') === '1';
  const blogPostId = searchParams.get('blogPostId');

  let sql = 'SELECT * FROM faqitem WHERE isActive = 1';
  const params = [];

  if (blogPostId) {
    sql += ' AND blogPostId = ?';
    params.push(blogPostId);
  } else if (blog) {
    sql += ' AND showOnBlog = 1 AND blogPostId IS NULL';
  } else if (help) {
    sql += ' AND showOnHelp = 1 AND blogPostId IS NULL';
  } else if (home) {
    sql += ' AND showOnHome = 1 AND blogPostId IS NULL';
  }

  sql += ' ORDER BY category ASC, sortOrder ASC, createdAt ASC';

  const rows = await query(sql, params);
  return NextResponse.json(rows.map(formatFaqRow));
}
