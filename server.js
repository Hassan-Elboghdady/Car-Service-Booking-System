const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const normalizedEnv = fs
    .readFileSync(envPath)
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\u0000/g, '');
  const parsedEnv = dotenv.parse(normalizedEnv);

  Object.assign(process.env, parsedEnv);
} else {
  dotenv.config();
}

const PORT = process.env.PORT || 5000;

function startServer() {
  const httpsKeyPath = process.env.HTTPS_KEY_PATH;
  const httpsCertPath = process.env.HTTPS_CERT_PATH;

  if (httpsKeyPath && httpsCertPath && fs.existsSync(httpsKeyPath) && fs.existsSync(httpsCertPath)) {
    const credentials = {
      key: fs.readFileSync(httpsKeyPath),
      cert: fs.readFileSync(httpsCertPath),
    };

    https.createServer(credentials, app).listen(PORT, () => {
      console.log(`HTTPS server is running on https://localhost:${PORT}`);
    });
    return;
  }

  http.createServer(app).listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Connect to MongoDB first, then start the server.
connectDB()
  .then(() => {
    startServer();
  })
  .catch((error) => {
    console.error('Failed to start the server:', error.message);
    process.exit(1);
  });