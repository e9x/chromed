const ports = new Set<number>();

export function pickPort() {
  for (let i = 6100; i < 6200; i++) {
    if (ports.has(i)) continue;
    ports.add(i);
    return i;
  }

  throw new Error("Out of ports");
}

export function recyclePort(port: number) {
  ports.delete(port);
}
