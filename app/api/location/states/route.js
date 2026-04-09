import { NextResponse } from 'next/server';
import { State } from 'country-state-city';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const countryCode = searchParams.get('country');
  if (!countryCode) return NextResponse.json([]);

  const states = State.getStatesOfCountry(countryCode).map(s => ({
    isoCode: s.isoCode,
    name: s.name,
    countryCode: s.countryCode,
  }));
  return NextResponse.json(states);
}
