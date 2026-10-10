const testRateLimit = async () => {
  console.log("Testing Login Rate Limiter (Limit is 20 requests)...");
  for (let i = 1; i <= 25; i++) {
    const res = await fetch('https://bizprimehub-backend.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake@example.com', password: 'wrongpassword' })
    });
    
    if (res.status === 429) {
      const data = await res.json();
      console.log(`\n🚨 Request ${i}: Status ${res.status} (BLOCKED by Rate Limiter!)`);
      console.log(`Server Message: "${data.message}"`);
      break; // Stop testing once blocked
    } else {
      console.log(`✅ Request ${i}: Status ${res.status} (Allowed)`);
    }
  }
};

testRateLimit();
