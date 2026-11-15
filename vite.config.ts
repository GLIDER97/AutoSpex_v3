import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// OPENROUTER_API_KEY and GOOGLE_MAPS_API_KEY are server-only secrets. They are
// read by the Vercel functions in api/ and must never be inlined into client
// code with `define` or exposed with a VITE_ prefix.
const SERVER_ENV = ['OPENROUTER_API_KEY', 'GOOGLE_MAPS_API_KEY', 'AI_TEXT_MODEL', 'AI_IMAGE_MODEL', 'ALLOWED_ORIGINS'];

/** The functions in api/ with the HTTP method each one answers. */
const ROUTES: Record<string, { file: string; method: 'GET' | 'POST' }> = {
  '/api/ai': { file: '/api/ai.ts', method: 'POST' },
  '/api/places': { file: '/api/places.ts', method: 'GET' },
};

/**
 * Serves the api/ functions during `npm run dev`, so the AI tools and shop
 * search work locally the same way they do on Vercel. Not used in builds.
 */
function devApi(env: Record<string, string>): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      for (const name of SERVER_ENV) if (env[name] && !process.env[name]) process.env[name] = env[name];

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
        const route = ROUTES[url.pathname];
        if (!route) return next();
        try {
          if (req.method !== route.method) {
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
          const request = new Request(url, {
            method: route.method,
            headers,
            body: route.method === 'POST' ? Buffer.concat(chunks) : undefined,
          });

          const handler = (await server.ssrLoadModule(route.file))[route.method];
          const response: Response = await handler(request);
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
      plugins: [react(), devApi(env)],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
