// Vercel Serverless Entry Point for Express Backend
const app = require('./server.js');

module.exports = (req, res) => {
  app(req, res);
};
