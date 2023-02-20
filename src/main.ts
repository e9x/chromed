import { websockify } from "@e9x/websockify";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

function parseLocation(l: string) {
  const split = l.split(":");

  if (split.length !== 2) throw new Error("Invalid format");

  const host = split[0];
  const port = Number(split[1]);

  if (isNaN(port)) throw new Error("Invalid port");

  return {
    host,
    port,
  };
}

const listenL = parseLocation(process.argv[2]);

const http = createServer();

const wss = new WebSocketServer({
  server: http,
});

// Set the default sock file path
const sockPath =
  platform() === "win32"
    ? join("\\\\?\\pipe", process.cwd(), "session.sock")
    : join(process.cwd(), "session.sock");

spawn(
  "vncserver",
  [
    "-geometry",
    "1280x720",
    "-fg",
    "-xstartup",
    fileURLToPath(new URL("../xstartup.sh", import.meta.url)),
    "-rfbunixpath",
    sockPath,
  ],
  {
    stdio: "inherit",
  }
);

// Use the sockPath variable in your web server configuration
console.log(`Using sock file path: ${sockPath}`);

wss.on("connection", (socket) =>
  websockify(socket, {
    path: sockPath,
  })
);

http.on("request", (req, res) => {
  res.writeHead(405, {
    "content-type": "text/plain",
  });

  res.write("This is a websockify server that only accepts WebSocket traffic.");

  res.end();
});

http.on("listening", () => {
  console.log(`Listening on http://${listenL.host}:${listenL.port}/`);
});

http.listen(listenL);
