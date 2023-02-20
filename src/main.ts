import { websockify } from "@e9x/websockify";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
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

let i = 0;

wss.on("connection", (socket) => {
  console.log("connection:");
  // Set the default sock file path
  /*const sockPath =
    (platform() === "win32"
      ? join("\\\\?\\pipe", process.cwd(), "session.sock")
      : join(process.cwd(), "session.sock")) + Math.random().toString(36);*/

  const port = 6100 + i++;

  const vncServer = spawn(
    "vncserver",
    [
      "-geometry",
      "1280x720",
      "-fg",
      "-autokill",
      "-xstartup",
      fileURLToPath(new URL("../xstartup.sh", import.meta.url)),
      "-rfbport",
      port.toString(),
      // "-rfbunixpath",
      // sockPath,
    ],
    {
      stdio: "pipe",
    }
  );

  const { stdout, stderr } = vncServer;

  if (!stdout || !stderr) throw new Error("missing stdout");

  stdout.pipe(process.stdout);
  stderr.pipe(process.stderr);

  // Use the sockPath variable in your web server configuration
  // console.log(`Using sock file path: ${sockPath}`);

  const started = new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      stderr.off("data", onData);
      vncServer.off("error", onError);
    };

    const onData = (data: Buffer) => {
      if (data.toString().includes("Starting applications specified in")) {
        cleanup();
        setTimeout(() => resolve(), 3000);
      }
    };

    const onError = () => {
      cleanup();
      reject();
    };

    stderr.on("data", onData);
    vncServer.once("error", onError);
  });

  vncServer.on("exit", () => socket.close());

  socket.on("close", () => {
    console.log("socket close");
    vncServer.kill("SIGINT");
    setTimeout(() => {
      vncServer.kill("SIGTERM");
    }, 3000);
  });

  started.then(() =>
    websockify(socket, {
      port,
      // path: sockPath,
    })
  );
});

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
