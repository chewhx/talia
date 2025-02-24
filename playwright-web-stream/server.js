// const { chromium } = require("playwright");
// const express = require("express");
// const WebSocket = require("ws");

// const app = express();
// const wss = new WebSocket.Server({ port: 8080 });

// let page; // Store the Playwright page globally

// (async () => {
//   const browser = await chromium.launch({ headless: false });
//   const context = await browser.newContext();
//   page = await context.newPage();

//   await page.goto("http://localhost:8082"); // Replace with Web App B

//   // Stream screenshots
//   setInterval(async () => {
//     if (!page) return;
//     const screenshot = await page.screenshot({ type: "jpeg" });
//     wss.clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(screenshot);
//       }
//     });
//   }, 500);

//   console.log("Streaming Web App B...");
// })();

// // Handle WebSocket messages (for interaction)
// wss.on("connection", (ws) => {
//   ws.on("message", async (message) => {
//     if (!page) return;
//     const data = JSON.parse(message);

//     try {
//       if (data.type === "click") {
//         await page.click(data.selector);
//       } else if (data.type === "type") {
//         await page.fill(data.selector, data.text);
//       } else if (data.type === "scroll") {
//         await page.evaluate(() => window.scrollBy(0, 200));
//       } else if (data.type === "press") {
//         await page.keyboard.press(data.key);
//       }

//       console.log(`Executed: ${data.type}`);
//     } catch (error) {
//       console.error("Error executing command:", error);
//     }
//   });
// });

// app.listen(8081, () => console.log("Server running on port 8081"));

const { chromium } = require("playwright");
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
const app = express();
const server = http.createServer(app);

// Enable CORS for the HTTP server
app.use(
  cors({
    origin: "http://localhost:3000", // Allow WebSocket connections from this origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Create the Socket.IO server on the existing HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow WebSocket connections from this origin
    methods: ["GET", "POST"],
  },
});

let page; // Store the Playwright page

(async () => {
  const browser = await chromium.launch({ headless: false }); // Visible browser
  const context = await browser.newContext();
  page = await context.newPage();

  await page.goto("http://localhost:8082"); // Replace with Web App B

  console.log("Web App B is open...");
})();

// Handle user interactions from Web App A
io.on("connection", (socket) => {
  console.log("User connected to WebRTC control");

  socket.on("mouseClick", async ({ x, y }) => {
    await page.mouse.click(x, y);
  });

  socket.on("mouseMove", async ({ x, y }) => {
    await page.mouse.move(x, y);
  });

  socket.on("keyPress", async (key) => {
    await page.keyboard.press(key);
  });

  socket.on("scroll", async ({ deltaX, deltaY }) => {
    await page.evaluate(
      ({ x, y }) => {
        window.scrollBy(x, y);
      },
      { x: deltaX, y: deltaY }
    );
  });
});

server.listen(8081, () => console.log("Server running on port 8081"));
