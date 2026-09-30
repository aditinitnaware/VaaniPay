import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    process.exit(0);
  });
});
