// Using native fetch
const login = async () => {
  const url = 'https://pkbizmap-backend.vercel.app/api/auth/login';
  const data = {
    email: 'aliahsan47ali@gmail.com',
    password: 'A1h2s3a4n5@ali47'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", result);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
};
login();
