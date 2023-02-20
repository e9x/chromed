import { pickPort, recyclePort } from "./ports.js";
import { websockify } from "@e9x/websockify";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const listenL = parseLocation(process.argv[2] || process.env.LISTEN || "");

if (!listenL) {
  console.log("Usage:");
  console.log(`\t${process.argv[0]} ${process.argv[1]} <listen address:port>`);
  console.log("Env:");
  console.log(`\tLISTEN=<address:port>`);
  process.exit(1);
}

const http = createServer();

const wss = new WebSocketServer({
  server: http,
});

wss.on("connection", (socket, req) => {
  const port = pickPort();

  console.log(
    "Using port",
    port,
    "for connection from",
    req.socket.remoteAddress
  );

  const vncServer = spawn("docker", ["run", "-p", `${port}:5901`, "chromed"], {
    stdio: ["inherit", "pipe", "inherit"],
  });

  const { stdout } = vncServer;

  if (!stdout) throw new Error("missing stdout");

  stdout.pipe(process.stdout);

  // Use the sockPath variable in your web server configuration
  // console.log(`Using sock file path: ${sockPath}`);

  const started = new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      stdout.off("data", onData);
      vncServer.off("error", onError);
    };

    const onData = (data: Buffer) => {
      if (data.toString().includes("New Xtigervnc server")) {
        cleanup();
        setTimeout(() => resolve(), 1000);
      }
    };

    const onError = () => {
      cleanup();
      reject();
    };

    stdout.on("data", onData);
    vncServer.once("error", onError);
  });

  vncServer.on("exit", () => {
    socket.close();
    recyclePort(port);
  });

  socket.on("close", () => {
    vncServer.kill("SIGINT");
  });

  started.then(() =>
    websockify(socket, {
      port,
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

function parseLocation(l: string) {
  const split = l.split(":");

  if (split.length !== 2) return false;

  const host = split[0];
  const port = Number(split[1]);

  if (isNaN(port)) return false;

  return {
    host,
    port,
  };
}
