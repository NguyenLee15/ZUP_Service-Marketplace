async function main() {
  try {
    const res = await fetch('http://localhost:3000/auth/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'anty13803@gmail.com', password: 'password123' }) 
    });
    const data = await res.json();
    const token = data.data.accessToken;
    const profile = await fetch('http://localhost:3000/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
    const profileData = await profile.json();
    console.log(JSON.stringify(profileData.data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
main();
