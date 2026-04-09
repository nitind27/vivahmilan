// Cashfree API helper — direct HTTP calls, lazy env reading
function getBaseUrl() {
  return process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

function getHeaders() {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secret) {
    throw new Error(`Cashfree credentials missing. APP_ID: ${appId ? 'set' : 'MISSING'}, SECRET: ${secret ? 'set' : 'MISSING'}`);
  }

  return {
    'x-client-id': appId,
    'x-client-secret': secret,
    'x-api-version': '2023-08-01',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

export async function createOrder(payload) {
  const url = `${getBaseUrl()}/orders`;
  const headers = getHeaders();

  console.log('Cashfree createOrder →', url);
  console.log('App ID:', process.env.CASHFREE_APP_ID?.slice(0, 8) + '...');

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Cashfree error response:', JSON.stringify(data));
    throw new Error(data.message || `HTTP ${res.status}: Order creation failed`);
  }

  return data;
}

export async function fetchOrder(orderId) {
  const url = `${getBaseUrl()}/orders/${orderId}`;
  const headers = getHeaders();

  const res = await fetch(url, {
    method: 'GET',
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Cashfree fetchOrder error:', JSON.stringify(data));
    throw new Error(data.message || `HTTP ${res.status}: Order fetch failed`);
  }

  return data;
}
