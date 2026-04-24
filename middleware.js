// Maintenance mode is handled in server.mjs directly — no middleware needed
import { NextResponse } from 'next/server';
export function middleware() { return NextResponse.next(); }
export const config = { matcher: [] };
