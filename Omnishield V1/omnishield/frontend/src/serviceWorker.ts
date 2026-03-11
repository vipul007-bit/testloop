// ============================================================
// src/serviceWorker.ts
// PWA Service Worker — Cache strategies + Background Sync drain
// ============================================================

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

import { syncEngine } from './lib/syncEngine'

const CACHE_NAME = 'omnishield-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
]

// ── Install: pre-cache static assets ─────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

// ── Activate: clean old caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

// ── Fetch: routing strategy ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Network-first + stale-while-revalidate for surveillance stats
  if (url.pathname === '/api/v1/surveillance/stats') {
    event.respondWith(networkFirstWithCache(request))
    return
  }

  // Cache-first for all static assets
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font' ||
      request.destination === 'image') {
    event.respondWith(cacheFirst(request))
    return
  }

  // Pass through API calls
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    return
  }

  // SPA fallback — serve index.html for all navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(r => r ?? fetch(request)),
    )
  }
})

// ── Background Sync: drain pending reports ────────────────────
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'omnishield-report-sync') {
    event.waitUntil(
      syncEngine.drainQueue().then(async result => {
        // Notify all open tabs about updated queue depth
        const depth = await syncEngine.getQueueDepth()
        const clients = await self.clients.matchAll({ type: 'window' })
        clients.forEach(client =>
          client.postMessage({ type: 'QUEUE_DEPTH', count: depth, result }),
        )
      }),
    )
  }
})

// ── Cache helpers ─────────────────────────────────────────────

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  const cache = await caches.open(CACHE_NAME)
  cache.put(request, response.clone())
  return response
}

async function networkFirstWithCache(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    cache.put(request, response.clone()) // update cache in background
    return response
  } catch {
    // Stale-while-revalidate: serve cached version if network fails
    const cached = await cache.match(request)
    if (cached) return cached
    throw new Error('Network unavailable and no cache for ' + request.url)
  }
}
