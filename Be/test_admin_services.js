async function run() {
  const login = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'admin@service-marketplace.local', password: 'Password123!'})
  });
  const data = await login.json();
  const token = data.data?.accessToken;
  const res = await fetch('http://localhost:3000/admin/services', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const resData = await res.json();
  console.log(resData.data?.[0]?.createdAt);
}
run();
