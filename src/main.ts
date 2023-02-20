import { websockify } from "@e9x/websockify";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

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

let i = 0;

wss.on("connection", (socket) => {
  console.log("connection:");
  // Set the default sock file path
  /*const sockPath =
    (platform() === "win32"
      ? join("\\\\?\\pipe", process.cwd(), "session.sock")
      : join(process.cwd(), "session.sock")) + Math.random().toString(36);*/

  const port = 6100 + i++;

  const vncServer = spawn("docker", ["run", "-p", `${port}:5901`, "chromed"], {
    stdio: "pipe",
  });

  console.log(port);

  const { stdout, stderr } = vncServer;

  if (!stdout || !stderr) throw new Error("missing stdout");

  stdout.pipe(process.stdout);
  stderr.pipe(process.stderr);

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

  vncServer.on("exit", () => socket.close());

  socket.on("close", () => {
    vncServer.kill("SIGINT");
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
