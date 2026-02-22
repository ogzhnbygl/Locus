import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom plugin to handle Vercel serverless functions locally
function vercelServerless() {
  return {
    name: 'vercel-serverless',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const filePath = path.join(__dirname, 'api', url.pathname.replace('/api/', '') + '.js');

        if (!fs.existsSync(filePath)) {
          return next();
        }

        try {
          // Parse body if needed
          let body = null;
          if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            try {
              body = JSON.parse(data);
            } catch (e) {
              body = data;
            }
          }

          // Mock Vercel req/res objects
          const vReq = {
            ...req,
            query: Object.fromEntries(url.searchParams),
            body: body,
            method: req.method,
          };

          const vRes = {
            status: (code) => {
              res.statusCode = code;
              return vRes;
            },
            json: (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return vRes;
            },
            send: (data) => {
              res.end(data);
              return vRes;
            },
            setHeader: (name, value) => {
              res.setHeader(name, value);
              return vRes;
            },
            end: (data) => {
              res.end(data);
              return vRes;
            }
          };

          // Invalidate cache to support hot reload of API files
          const importedModule = await import(filePath + '?t=' + Date.now());
          await importedModule.default(vReq, vRes);

        } catch (error) {
          console.error('API Error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vercelServerless()],
});
