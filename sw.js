// גרסה 2: קודם מנסים להביא מהרשת, ורק אם אין אינטרנט נופלים למטמון.
// ככה עדכון שמתפרסם נראה מיד, והאפליקציה עדיין עובדת בלי רשת.
const CACHE = "bechavruta-v2";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isPage = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isPage) {
    // דף: רשת קודם, מטמון כגיבוי
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("index.html").then((hit) => hit || caches.match("./")))
    );
    return;
  }

  // אייקונים וקבצים קבועים: מטמון קודם
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
    )
  );
});
