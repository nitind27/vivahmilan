import { NextResponse } from 'next/server';
import { Country } from 'country-state-city';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();

  let countries = Country.getAllCountries().map(c => ({
    isoCode: c.isoCode,
    name: c.name,
    flag: c.flag,
    phonecode: c.phonecode,
  }));

  // Optional search filter
  if (q) {
    countries = countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.isoCode.toLowerCase().includes(q)
    );
  }

  return NextResponse.json(countries);
}
