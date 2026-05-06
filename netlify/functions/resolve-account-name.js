exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return { statusCode: 500, body: JSON.stringify({ error: 'PAYSTACK_SECRET_KEY not configured' }) };
    }

    const { accountNumber, bankCode } = JSON.parse(event.body || '{}');
    if (!accountNumber || !bankCode) {
      return { statusCode: 400, body: JSON.stringify({ error: 'accountNumber and bankCode are required' }) };
    }

    const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
    });

    const payload = await response.json();
    if (!response.ok || !payload?.status) {
      return { statusCode: 400, body: JSON.stringify({ error: payload?.message || 'Unable to resolve account' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ account_name: payload.data.account_name }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
