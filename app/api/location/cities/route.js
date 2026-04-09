import { NextResponse } from 'next/server';
import { City } from 'country-state-city';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const countryCode = searchParams.get('country');
  const stateCode   = searchParams.get('state');
  if (!countryCode || !stateCode) return NextResponse.json([]);

  const cities = City.getCitiesOfState(countryCode, stateCode).map(c => ({
    name: c.name,
  }));
  return NextResponse.json(cities);
}
