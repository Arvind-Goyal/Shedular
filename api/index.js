const app = require('../server/server');

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[API Serverless Entrypoint]: Running locally on http://localhost:${PORT}`);
  });
}

module.exports = app;
