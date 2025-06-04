// Node.js script to run the seeding

(async () => {
  const fetch = (await import('node-fetch')).default;

  const sampleJobs = [
    // ... (same jobs array as above)
  ];

  async function seedJobs() {
    const API_BASE = 'http://localhost:3000/api';

    try {
      // Create employer account
      const employerData = {
        name: "AKT Talents Admin",
        email: "admin@AKT Talents.com",
        password: "password123",
        role: "EMPLOYER"
      };

      const employerResponse = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employerData)
      });

      // Handle response (add your logic here)
      console.log(await employerResponse.json());
    } catch (error) {
      console.error('Error seeding jobs:', error);
    }
  }

  await seedJobs();
})();