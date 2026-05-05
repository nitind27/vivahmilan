import { NextResponse } from 'next/server';
import { Country, State } from 'country-state-city';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const countryParam = searchParams.get('country') || '';
  const q = (searchParams.get('q') || '').toLowerCase().trim();

  if (!countryParam) {
    return NextResponse.json({ error: 'country parameter required. Pass ISO code (e.g. IN) or name (e.g. India)' }, { status: 400 });
  }

  // Resolve country: accept ISO code OR country name
  let countryCode = countryParam.trim();
  if (countryCode.length > 3) {
    // Looks like a name — find ISO code
    const found = Country.getAllCountries().find(
      c => c.name.toLowerCase() === countryCode.toLowerCase()
    );
    if (!found) return NextResponse.json({ error: `Country "${countryParam}" not found. Use ISO code (e.g. IN) or exact name.` }, { status: 404 });
    countryCode = found.isoCode;
  }

  let states = State.getStatesOfCountry(countryCode).map(s => ({
    isoCode: s.isoCode,
    name: s.name,
    countryCode: s.countryCode,
  }));

  // Optional search filter
  if (q) {
    states = states.filter(s => s.name.toLowerCase().includes(q));
  }

  return NextResponse.json(states);
}
