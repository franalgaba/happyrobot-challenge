import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
const indexFile = join(distDir, "index.html");
const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 8080);
const apiBaseUrl = (process.env.API_BASE_URL ?? "").replace(/\/$/, "");
const apiKey = process.env.API_KEY ?? "";
const LOCAL_REQUEST_BASE_URL = "http://localhost";
const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const TEXT_CONTENT_TYPE = "text/plain; charset=utf-8";

const dashboardApiPaths = new Set([
  "/api/reports/summary",
  "/api/reports/calls",
  "/api/reports/loads",
  "/api/reports/negotiations",
]);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
};

function writeHead(res, status, headers = {}) {
  res.writeHead(status, { ...securityHeaders, ...headers });
}

function sendText(res, status, body) {
  writeHead(res, status, { "Content-Type": TEXT_CONTENT_TYPE });
  res.end(body);
}

function sendJson(res, status, body, headers = {}) {
  writeHead(res, status, { "Content-Type": JSON_CONTENT_TYPE, ...headers });
  res.end(JSON.stringify(body));
}

function errorBody(code, message) {
  return { error: { code, message } };
}

function safePath(pathname) {
  return normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
}

function resolveAssetPath(pathname) {
  const filePath = resolve(distDir, `.${safePath(pathname)}`);
  const relativePath = relative(distDir, filePath);
  if (relativePath.startsWith("..") || relativePath === "" || isAbsolute(relativePath)) {
    return undefined;
  }
  return filePath;
}

function sendFile(res, filePath, method) {
  const stats = statSync(filePath);
  const extension = extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] ?? "application/octet-stream";

  writeHead(res, 200, {
    "Cache-Control": "public, max-age=600",
    "Content-Length": stats.size,
    "Content-Type": contentType,
  });

  if (method === "HEAD") {
    res.end();
    return;
  }

  createReadStream(filePath).pipe(res);
}

function isSupportedMethod(method) {
  return method === "GET" || method === "HEAD";
}

function canProxyDashboardApi(method, pathname) {
  return isSupportedMethod(method) && dashboardApiPaths.has(pathname);
}

function isApiRequest(pathname) {
  return pathname.startsWith("/api/");
}

function apiProxyIsConfigured() {
  return Boolean(apiBaseUrl && apiKey);
}

function upstreamReportUrl(requestUrl) {
  return new URL(`${apiBaseUrl}${requestUrl.pathname}${requestUrl.search}`);
}

async function proxyDashboardApi(res, requestUrl, method) {
  if (!apiProxyIsConfigured()) {
    sendJson(
      res,
      503,
      errorBody("dashboard_api_unavailable", "Dashboard API proxy is not configured."),
    );
    return;
  }

  const upstreamResponse = await fetch(upstreamReportUrl(requestUrl), {
    method,
    headers: { "X-API-Key": apiKey },
  });
  const contentType = upstreamResponse.headers.get("Content-Type") ?? JSON_CONTENT_TYPE;

  writeHead(res, upstreamResponse.status, {
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  });

  if (method === "HEAD") {
    res.end();
    return;
  }

  res.end(await upstreamResponse.text());
}

function handleApiRequest(res, requestUrl, method) {
  if (!canProxyDashboardApi(method, requestUrl.pathname)) {
    sendJson(res, 404, errorBody("not_found", "Route not found."));
    return;
  }

  void proxyDashboardApi(res, requestUrl, method).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    sendJson(res, 502, errorBody("dashboard_api_proxy_failed", "Dashboard API proxy failed."));
  });
}

function handleHealthRequest(res) {
  sendText(res, 200, "ok");
}

function requestPathname(pathname) {
  return pathname === "/" ? "/index.html" : pathname;
}

function handleStaticRequest(res, requestUrl, method) {
  const filePath = resolveAssetPath(requestPathname(requestUrl.pathname));

  if (filePath && existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(res, filePath, method);
    return;
  }

  if (existsSync(indexFile)) {
    sendFile(res, indexFile, method);
    return;
  }

  sendText(res, 500, "Build output missing. Run `bun run build` before starting.");
}

function handleRequest(req, res) {
  const method = req.method ?? "GET";
  if (!isSupportedMethod(method)) {
    sendText(res, 405, "Method Not Allowed");
    return;
  }

  const requestUrl = new URL(req.url ?? "/", LOCAL_REQUEST_BASE_URL);
  if (isApiRequest(requestUrl.pathname)) {
    handleApiRequest(res, requestUrl, method);
    return;
  }

  if (requestUrl.pathname === "/health") {
    handleHealthRequest(res);
    return;
  }

  handleStaticRequest(res, requestUrl, method);
}

const server = createServer(handleRequest);

server.listen(port, host, () => {
  console.log(`Dashboard listening on http://${host}:${port}`);
});
