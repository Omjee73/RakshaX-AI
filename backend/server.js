const http = require("http");

const app = require("./app");
const env = require("./config/env");
const connectDatabase = require("./config/db");

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);
  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

startServer();
