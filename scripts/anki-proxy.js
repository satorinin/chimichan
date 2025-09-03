#!/usr/bin/env node
// Simple CORS-forwarding proxy for AnkiConnect (development only)
// Usage: node scripts/anki-proxy.js [listenPort] [ankiHost]
// Example: node scripts/anki-proxy.js 3000 http://127.0.0.1:8765

import http from 'http';
import { URL } from 'url';

const listenPort = parseInt(process.argv[2], 10) || 3000;
const ankiHost = process.argv[3] || 'http://127.0.0.1:8765';

function log(...args) { console.log('[anki-proxy]', ...args); }

const server = http.createServer(async (req, res) => {
  // Allow any origin (development only)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only POSTs are used by AnkiConnect
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
    return;
  }

  try {
    // Collect the request body
    const body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    // Forward to AnkiConnect
    const ankiUrl = new URL(ankiHost);
    const opts = {
      method: 'POST',
      hostname: ankiUrl.hostname,
      port: ankiUrl.port || 80,
      path: ankiUrl.pathname || '/',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const forwardReq = http.request(opts, (forwardRes) => {
      const forwardChunks = [];
      forwardRes.on('data', (c) => forwardChunks.push(c));
      forwardRes.on('end', () => {
        const buf = Buffer.concat(forwardChunks);
        // Mirror status and content-type
        res.writeHead(forwardRes.statusCode || 200, { 'Content-Type': forwardRes.headers['content-type'] || 'application/json' });
        res.end(buf);
      });
    });

    forwardReq.on('error', (err) => {
      log('error forwarding to AnkiConnect', err.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: ' + err.message);
    });

    forwardReq.write(body);
    forwardReq.end();
  } catch (e) {
    log('proxy error', e && e.message ? e.message : e);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal proxy error');
  }
});

server.listen(listenPort, () => {
  log(`listening on http://127.0.0.1:${listenPort} -> forwarding to ${ankiHost}`);
});
