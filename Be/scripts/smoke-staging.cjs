const baseUrl = normalizeBaseUrl(process.env.SMOKE_BASE_URL);
const adminEmail = process.env.SMOKE_ADMIN_EMAIL;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;

if (!baseUrl) {
  console.error(
    'SMOKE_BASE_URL is required, for example https://api.example.com',
  );
  process.exit(1);
}

async function main() {
  await checkJson('GET', '/health', { expectedStatuses: [200] });
  await checkJson('GET', '/health/ready', { expectedStatuses: [200, 503] });
  await checkJson('GET', '/services/search', { expectedStatuses: [200] });
  await checkJson('GET', '/categories/tree', { expectedStatuses: [200] });
  await checkRawVnpayIpn();

  if (adminEmail && adminPassword) {
    const login = await checkJson('POST', '/auth/login', {
      expectedStatuses: [200],
      body: { email: adminEmail, password: adminPassword },
    });
    const accessToken = login?.data?.accessToken;
    if (typeof accessToken !== 'string' || !accessToken) {
      throw new Error('POST /auth/login did not return data.accessToken');
    }

    await checkJson('GET', '/auth/profile', {
      expectedStatuses: [200],
      accessToken,
    });
    await checkJson('GET', '/admin/audit-logs', {
      expectedStatuses: [200, 403],
      accessToken,
    });
  } else {
    console.log(
      'Skipping authenticated smoke checks: admin credentials not set.',
    );
  }

  console.log('Staging smoke checks completed.');
}

async function checkJson(method, path, options = {}) {
  const response = await request(method, path, options);
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  const statusOk = options.expectedStatuses.includes(response.status);

  if (!statusOk) {
    throw new Error(`${method} ${path} returned ${response.status}: ${text}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(
      `${method} ${path} returned non-JSON content-type: ${contentType}`,
    );
  }

  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error(`${method} ${path} returned invalid JSON`);
  }
}

async function checkRawVnpayIpn() {
  const response = await request(
    'GET',
    '/provider-wallets/vnpay/ipn?vnp_TxnRef=smoke-invalid',
    {
      expectedStatuses: [200],
    },
  );
  const text = await response.text();

  if (response.status >= 500) {
    throw new Error(
      `GET /provider-wallets/vnpay/ipn returned ${response.status}: ${text}`,
    );
  }

  try {
    const body = text ? JSON.parse(text) : undefined;
    if (body && body.success === true) {
      throw new Error(
        'VNPay IPN returned wrapped success response instead of raw VNPay body',
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('wrapped success')) {
      throw error;
    }
  }
}

async function request(method, path, options = {}) {
  const headers = { Accept: 'application/json' };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (options.accessToken)
    headers.Authorization = `Bearer ${options.accessToken}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  console.log(`${method} ${path} -> ${response.status}`);
  return response;
}

function normalizeBaseUrl(value) {
  if (!value) return '';
  return value.replace(/\/+$/, '');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Staging smoke failed: ${message}`);
  process.exit(1);
});
