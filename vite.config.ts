import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// GEMINI_API_KEY is a server-only secret. It is read by api/gemini.ts (a Vercel
// function) and must never be inlined into client code with `define` or exposed
// with a VITE_ prefix.

/**
 * Serves api/gemini.ts at /api/gemini during `npm run dev`, so the AI tools work
 * locally the same way they do on Vercel. Not used in production builds.
 */
function geminiDevApi(apiKey: string | undefined): Plugin {
  return {
    name: 'gemini-dev-api',
    apply: 'serve',
    configureServer(server) {
      if (apiKey && !process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = apiKey;

      server.middlewares.use('/api/gemini', async (req, res, next) => {
        try {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
          }
          const request = new Request(`http://${req.headers.host ?? 'localhost'}/api/gemini`, {
            method: 'POST',
            headers,
            body: Buffer.concat(chunks),
          });

          const { POST } = await server.ssrLoadModule('/api/gemini.ts');
          const response: Response = await POST(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), geminiDevApi(env.GEMINI_API_KEY)],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
