const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// ── Uncaught Exceptions & Unhandled Rejections ──────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
  // Log but do not crash the server for unhandled promise rejections (usually database/network blips)
});

process.on('uncaughtException', (error) => {
  console.error('CRITICAL: Uncaught Exception thrown:', error);
  // Uncaught exceptions place Node in an undefined state; log and exit cleanly so PM2/Render can restart it.
  gracefulShutdown(1);
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = (code = 0) => {
  console.log('Initiating graceful shutdown...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(code);
  });

  // Force close after 10s if connections persist
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(code);
  }, 10000);
};

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received.');
  gracefulShutdown(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received.');
  gracefulShutdown(0);
});
