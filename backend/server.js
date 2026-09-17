// MediSwift storage selector
// Local VS Code: JSON fallback. Vercel/production: PostgreSQL when DATABASE_URL exists.
module.exports = process.env.DATABASE_URL
  ? require('./server.pg')
  : require('./server.local');

if (require.main === module) {
  // The selected module only starts automatically when it itself is main, so start here.
  const app = module.exports;
  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, () => {
    console.log('');
    console.log('======================================');
    console.log('       MEDISWIFT RUNNING');
    console.log('======================================');
    console.log(`Website: http://localhost:${PORT}`);
    console.log(`API:     http://localhost:${PORT}/api`);
    console.log(`Storage: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Local JSON fallback'}`);
    console.log('');
  });
}
