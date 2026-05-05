import { NextResponse } from 'next/server';
import { Country, State, City } from 'country-state-city';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const countryParam = searchParams.get('country') || '';
  const stateParam   = searchParams.get('state')   || '';
  const q            = (searchParams.get('q') || '').toLowerCase().trim();

  if (!stateParam) {
    return NextResponse.json({ error: 'state parameter required. Pass ISO code (e.g. MH) or name (e.g. Maharashtra)' }, { status: 400 });
  }

  // Resolve country: accept ISO code OR name (optional for cities)
  let countryCode = countryParam.trim();
  if (countryCode.length > 3) {
    const found = Country.getAllCountries().find(
      c => c.name.toLowerCase() === countryCode.toLowerCase()
    );
    countryCode = found ? found.isoCode : '';
  }

  // Resolve state: accept ISO code OR state name
  let stateCode = stateParam.trim();
  if (stateCode.length > 3 || (stateCode.length <= 3 && !/^[A-Z]{2,3}$/.test(stateCode))) {
    // Looks like a name — search across all states (or within country if provided)
    const allStates = countryCode
      ? State.getStatesOfCountry(countryCode)
      : State.getAllStates();

    const found = allStates.find(
      s => s.name.toLowerCase() === stateParam.toLowerCase()
    );

    if (!found) {
      return NextResponse.json({ error: `State "${stateParam}" not found. Use ISO code (e.g. MH) or exact name (e.g. Maharashtra)` }, { status: 404 });
    }
    stateCode   = found.isoCode;
    countryCode = found.countryCode;
  }

  if (!countryCode) {
    return NextResponse.json({ error: 'country parameter required when using state ISO code' }, { status: 400 });
  }

  let cities = City.getCitiesOfState(countryCode, stateCode).map(c => ({
    name: c.name,
    stateCode,
    countryCode,
  }));

  // Optional search filter
  if (q) {
    cities = cities.filter(c => c.name.toLowerCase().includes(q));
  }

  return NextResponse.json(cities);
}
