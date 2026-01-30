// Vercel API Handler - Wraps Express app for serverless deployment
const app = require('../backend/server.js');

// Vercel serverless handler
module.exports = (req, res) => {
  app(req, res);
};
