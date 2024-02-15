const express = require("express");
require("dotenv").config();
const { StatusSuccess } = require("./src/config/index.js");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const http = require("http");
const request = require("request");
// Function to create and start Express server
function startServer(port) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(StatusSuccess);

  const routes = require("./src/routes/index.js");
  app.use("/", routes);

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
  });
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
if (process.env.NODE_ENV === "multi") {
  if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork({ PORT: +process.env.PORT + i + 1 });
    }

    let curCPU = 1;

    const server = http.createServer((req, res) => {
      const workerPort = +process.env.PORT + curCPU;
      const workerUrl = process.env.BASE_URL + `${workerPort}${req.url}`;
      req.pipe(request(workerUrl)).pipe(res);
      curCPU = (curCPU % numCPUs) + 1;
    });
    server.listen(process.env.PORT);
    cluster.on("exit", (worker, code, signal) => {
      cluster.fork({ PORT: +process.env.PORT + curCPU }); // Pass the PORT to the new worker
      curCPU = (curCPU % numCPUs) + 1;
    });
  } else {
    const workerPort = process.env.PORT;
    startServer(workerPort);
  }
} else {
  console.log("Running in development mode");
  startServer(process.env.PORT);
}
