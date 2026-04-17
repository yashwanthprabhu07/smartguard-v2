/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy Flask backend during dev so SSE and API calls work without CORS pain.
  // Change FLASK_URL in .env.local if your backend runs elsewhere.
  async rewrites() {
    const flask = process.env.FLASK_URL || "http://localhost:3000";
    return [
      { source: "/api/stream/:machine_id", destination: `${flask}/stream/:machine_id` },
      { source: "/api/set_mode", destination: `${flask}/set_mode` },
      { source: "/api/alert", destination: `${flask}/alert` },
    ];
  },
};

module.exports = nextConfig;
