import { NextResponse } from 'next/server';
import { Country, State, City } from 'country-state-city';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const countryParam = (searchParams.get('country') || '').trim();
  const stateParam   = (searchParams.get('state')   || '').trim();
  const q            = (searchParams.get('q')        || '').toLowerCase().trim();

  if (!stateParam) {
    return NextResponse.json({
      error: 'state parameter required',
      examples: [
        '/api/flutter/location/cities?country=India&state=Maharashtra',
        '/api/flutter/location/cities?country=IN&state=MH',
        '/api/flutter/location/cities?state=Maharashtra',
        '/api/flutter/location/cities?state=Maharashtra&q=mum',
      ]
    }, { status: 400 });
  }

  // Step 1: Resolve countryCode from name or ISO
  let countryCode = '';
  if (countryParam) {
    // If it looks like an ISO code (2-3 uppercase letters)
    if (/^[A-Z]{2,3}$/.test(countryParam)) {
      countryCode = countryParam;
    } else {
      const found = Country.getAllCountries().find(
        c => c.name.toLowerCase() === countryParam.toLowerCase()
      );
      countryCode = found ? found.isoCode : '';
    }
  }

  // Step 2: Resolve stateCode from name or ISO
  let stateCode = '';
  let resolvedCountryCode = countryCode;

  // If it looks like an ISO code (2-3 uppercase letters)
  if (/^[A-Z]{2,3}$/.test(stateParam)) {
    stateCode = stateParam;
    // countryCode must be provided when using ISO state code
    if (!resolvedCountryCode) {
      return NextResponse.json({
        error: 'country parameter required when using state ISO code',
        example: '/api/flutter/location/cities?country=IN&state=MH'
      }, { status: 400 });
    }
  } else {
    // It's a state name — search by name
    const allStates = resolvedCountryCode
      ? State.getStatesOfCountry(resolvedCountryCode)
      : State.getAllStates();

    const found = allStates.find(
      s => s.name.toLowerCase() === stateParam.toLowerCase()
    );

    if (!found) {
      // Try partial match as fallback
      const partial = allStates.find(
        s => s.name.toLowerCase().includes(stateParam.toLowerCase())
      );
      if (!partial) {
        return NextResponse.json({
          error: `State "${stateParam}" not found`,
          hint: 'Use exact state name (e.g. Maharashtra) or ISO code (e.g. MH)',
        }, { status: 404 });
      }
      stateCode = partial.isoCode;
      resolvedCountryCode = partial.countryCode;
    } else {
      stateCode = found.isoCode;
      resolvedCountryCode = found.countryCode;
    }
  }

  // Step 3: Get cities
  let cities = City.getCitiesOfState(resolvedCountryCode, stateCode).map(c => ({
    name: c.name,
    stateCode,
    countryCode: resolvedCountryCode,
  }));

  // Step 4: Optional search filter
  if (q) {
    cities = cities.filter(c => c.name.toLowerCase().includes(q));
  }

  return NextResponse.json(cities);
}
