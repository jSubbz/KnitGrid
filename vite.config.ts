import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const LOG_DIR = "logs";

/**
 * Writes session logs straight into the project's logs folder.
 *
 * The browser cannot choose a path - Firefox has no save picker at all, so the
 * app can only offer a download - but the dev server is already running on the
 * machine the folder lives on. Development only; the endpoint does not exist in
 * a build.
 */
function devLogWriter(): Plugin {
  return {
    name: "knitgrid-devlog-writer",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__devlog", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("POST only");
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
            const dir = resolve(server.config.root, LOG_DIR);
            mkdirSync(dir, { recursive: true });
            const file = resolve(dir, `knitgrid-log-${stamp}.json`);
            writeFileSync(file, body, "utf8");
            server.config.logger.info(`[devlog] wrote ${LOG_DIR}/knitgrid-log-${stamp}.json`);
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, file: `${LOG_DIR}/knitgrid-log-${stamp}.json` }));
          } catch (error) {
            res.statusCode = 500;
            res.end(String(error));
          }
        });
      });
    },
  };
}

/**
 * GitHub Pages serves the site from a subpath, and a single-page app there gets
 * a 404 on any deep link because the server looks for a real file. Copying the
 * entry document to 404.html makes Pages hand the app back instead.
 */
function pagesFallback(): Plugin {
  let outDir = "dist";
  return {
    name: "knitgrid-pages-fallback",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      try {
        const html = readFileSync(resolve(outDir, "index.html"), "utf8");
        writeFileSync(resolve(outDir, "404.html"), html, "utf8");
      } catch {
        // Nothing to copy if the entry document is not where it is expected.
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  // Pages serves from /<repo>/. A dev server and a local preview serve from /.
  base: command === "build" && process.env.KNITGRID_BASE ? process.env.KNITGRID_BASE : "/",
  plugins: [react(), devLogWriter(), pagesFallback()],
}));
