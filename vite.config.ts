import fs from "fs";
import { defineConfig } from "vite";

const isLocal = false;

export default defineConfig({
  build: {
    outDir: 'dist'
  },
  server: isLocal
    ? {
        https: {
          key: fs.readFileSync("./certs/key.pem"),
          cert: fs.readFileSync("./certs/fullchain.pem"),
        },
        port: 443,
      }
    : {
        port: 5173,
      },
      base: isLocal? '/' : '/matrix-chess-widget/'
});
