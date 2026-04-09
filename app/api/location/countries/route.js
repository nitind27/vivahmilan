import { NextResponse } from 'next/server';
import { Country } from 'country-state-city';

export async function GET() {
  const countries = Country.getAllCountries().map(c => ({
    isoCode: c.isoCode,
    name: c.name,
    flag: c.flag,
    phonecode: c.phonecode,
  }));
  return NextResponse.json(countries);
}
