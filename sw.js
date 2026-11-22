const SHELL_CACHE = "surah32-shell-v1.84";
const FONT_CACHE = "surah32-fonts-v1";
const AUDIO_CACHE = "surah32-audio-v1";

const SHELL_ASSETS = [
  "./surah32.html",
  "./sura32.html"
];

const FONT_ASSETS = [
  "./assets/fonts/UthmanicHafs.woff2",
  "./assets/fonts/KFGQPC_HAFS.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
      caches.open(FONT_CACHE).then((cache) => cache.addAll(FONT_ASSETS))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, FONT_CACHE, AUDIO_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => (keep.has(k) ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

async function handleAudioRequest(request) {
  const cache = await caches.open(AUDIO_CACHE);
  let fullRes = await cache.match(request.url);

  if (!fullRes) {
    try {
      const netRes = await fetch(new Request(request.url, { mode: "cors", credentials: "omit" }));
      if (netRes && netRes.ok && netRes.status === 200) {
        await cache.put(request.url, netRes.clone());
        fullRes = netRes;
      } else {
        return netRes;
      }
    } catch (_) {
      return new Response("", { status: 503, statusText: "Audio offline" });
    }
  }

  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) {
    return fullRes;
  }

  const buf = await fullRes.arrayBuffer();
  const total = buf.byteLength;
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  if (!match) {
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": fullRes.headers.get("Content-Type") || "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Content-Length": String(total)
      }
    });
  }

  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
  if (isNaN(start) || isNaN(end) || start >= total || start > end) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` }
    });
  }

  const slice = buf.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": fullRes.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(slice.byteLength)
    }
  });
}

async function handleFontRequest(request) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(request.url);
  if (cached) return cached;

  try {
    const netRes = await fetch(request);
    if (netRes && netRes.ok) {
      await cache.put(request.url, netRes.clone());
    }
    return netRes;
  } catch (_) {
    return new Response("", { status: 503, statusText: "Font offline" });
  }
}

async function handlePageRequest(request, url) {
  const cache = await caches.open(SHELL_CACHE);
  const cleanUrl = url.origin + url.pathname;
  try {
    const netRes = await fetch(request);
    if (netRes && netRes.ok) {
      await cache.put(cleanUrl, netRes.clone());
    }
    return netRes;
  } catch (_) {
    const direct = await cache.match(cleanUrl);
    if (direct) return direct;
    if (url.pathname.endsWith("sura32") || url.pathname.endsWith("sura32.html")) {
      return (await cache.match("./sura32.html")) || (await cache.match("./surah32.html"));
    }
    return (await cache.match("./surah32.html")) || new Response("Offline", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.hostname === "everyayah.com" && url.pathname.endsWith(".mp3")) {
    event.respondWith(handleAudioRequest(request));
    return;
  }

  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com" ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(handleFontRequest(request));
    return;
  }

  if (
    request.mode === "navigate" ||
    url.pathname.endsWith("/surah32.html") ||
    url.pathname.endsWith("/sura32.html") ||
    url.pathname.endsWith("/surah32") ||
    url.pathname.endsWith("/sura32")
  ) {
    event.respondWith(handlePageRequest(request, url));
  }
});
