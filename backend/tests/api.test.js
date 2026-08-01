const assert = require('assert');
const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const makeRequest = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      method,
      headers
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', err => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('=== Starting CivicAI Backend Integration Tests ===');

  try {
    // 1. Health check
    console.log('Testing /health endpoint...');
    const health = await makeRequest('GET', '/../health'); // goes to root /health
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.status, 'healthy');
    console.log('✓ Health check passed.');

    // 2. Auth signup
    console.log('Testing Citizen Auth Registration...');
    const email = `test_citizen_${Date.now()}@civicai.org`;
    const signup = await makeRequest('POST', '/auth/signup', {
      email,
      password: 'Citizen@123',
      name: 'Test Citizen User',
      role: 'citizen',
      phone: '9988776655'
    });
    assert.strictEqual(signup.status, 201);
    assert.ok(signup.data.token);
    assert.strictEqual(signup.data.user.role, 'citizen');
    console.log('✓ Registration passed.');

    const token = signup.data.token;

    // 3. Auth login
    console.log('Testing Auth Log In...');
    const login = await makeRequest('POST', '/auth/login', {
      email,
      password: 'Citizen@123'
    });
    assert.strictEqual(login.status, 200);
    assert.ok(login.data.token);
    console.log('✓ Login passed.');

    // 4. Session profile check
    console.log('Testing /me profile session check...');
    const profile = await makeRequest('GET', '/auth/me', null, token);
    assert.strictEqual(profile.status, 200);
    assert.strictEqual(profile.data.email, email);
    console.log('✓ Session profile verification passed.');

    // 5. Admin seed check
    console.log('Testing Admin Log In (Seed Account)...');
    const adminLogin = await makeRequest('POST', '/auth/login', {
      email: 'admin@civicai.org',
      password: 'Admin@123'
    });
    assert.strictEqual(adminLogin.status, 200);
    const adminToken = adminLogin.data.token;
    console.log('✓ Admin seed account login passed.');

    // 6. Departments list
    console.log('Testing Department listings...');
    const depts = await makeRequest('GET', '/admin/departments', null, adminToken);
    assert.strictEqual(depts.status, 200);
    assert.ok(Array.isArray(depts.data));
    assert.ok(depts.data.length > 0);
    console.log('✓ Department listings query passed.');

    console.log('\n================================================');
    console.log('✓ ALL BACKEND SYSTEM TESTS COMPLETED SUCCESSFULLY');
    console.log('================================================');
  } catch (err) {
    console.error('\n❌ TEST RUN ERROR:', err.message);
    process.exit(1);
  }
};

// If this test script is run directly, execute it
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
