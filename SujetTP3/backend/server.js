const http = require("http");
const redis = require("redis");

const PORT = process.env.PORT || 3001;
const REDIS_HOST = process.env.REDIS_HOST || "cache";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient({
  socket: { host: REDIS_HOST, port: parseInt(REDIS_PORT) },
});

client.on("error", (err) => console.error("Redis error:", err));

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "GET" && req.url === "/tasks") {
    const raw = await client.lRange("tasks", 0, -1);
    res.writeHead(200);
    res.end(JSON.stringify(raw.map((t) => JSON.parse(t))));
    return;
  }

  if (req.method === "POST" && req.url === "/tasks") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      const { titre } = JSON.parse(body);
      const task = {
        id: Date.now().toString(),
        titre,
        createdAt: new Date().toISOString(),
      };
      await client.lPush("tasks", JSON.stringify(task));
      res.writeHead(201);
      res.end(JSON.stringify(task));
    });
    return;
  }

  if (req.method === "DELETE" && req.url.startsWith("/tasks/")) {
    const id = req.url.split("/")[2];
    const raw = await client.lRange("tasks", 0, -1);
    const filtered = raw.filter((t) => JSON.parse(t).id !== id);
    await client.del("tasks");
    for (const t of filtered) await client.rPush("tasks", t);
    res.writeHead(200);
    res.end(JSON.stringify({ deleted: id }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Route introuvable" }));
});

client.connect().then(() => {
  console.log("Connecté à Redis");
  server.listen(PORT, () => console.log(`TaskFlow API démarrée sur le port ${PORT}`));
}).catch((err) => {
  console.error("Erreur connexion Redis:", err.message);
  process.exit(1);
});
