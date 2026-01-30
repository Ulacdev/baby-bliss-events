// Vercel Serverless API Handler for Express backend
const app = require('../server.js');

module.exports = (req, res) => {
  app(req, res);
};
