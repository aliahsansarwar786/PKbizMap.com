// Native fetch

const testAdmin = async () => {
  const loginRes = await fetch('https://pkbizmap-backend.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aliahsan47ali@gmail.com', password: 'A1h2s3a4n5@ali47' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log("Login Cookie:", cookie);

  const dashRes = await fetch('https://pkbizmap-backend.vercel.app/api/admin/dashboard', {
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  const data = await dashRes.json();
  console.log("Dashboard Status:", dashRes.status);
  console.log("Dashboard Data:", data);
};
testAdmin();
