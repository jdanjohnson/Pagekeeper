const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

let mainWindow;
let serverProcess;
const PORT = 18923; // High port to avoid conflicts

function findPython() {
  // Try python3 first, then python
  const candidates = ["python3", "python"];
  for (const cmd of candidates) {
    try {
      const result = require("child_process").execSync(`${cmd} --version`, {
        encoding: "utf-8",
        timeout: 5000,
      });
      if (result.includes("Python 3")) return cmd;
    } catch (_) {}
  }
  return null;
}

function startServer() {
  return new Promise((resolve, reject) => {
    const python = findPython();
    if (!python) {
      reject(
        new Error(
          "Python 3 not found. Please install Python 3.10+ from https://www.python.org/downloads/"
        )
      );
      return;
    }

    // The server module is bundled alongside the Electron app
    const serverDir = app.isPackaged
      ? path.join(process.resourcesPath, "server")
      : path.join(__dirname, "server");

    const serverScript = path.join(serverDir, "run.py");

    serverProcess = spawn(python, [serverScript, String(PORT)], {
      cwd: serverDir,
      env: {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let started = false;

    serverProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      console.log("[server]", msg);
      if (!started && msg.includes("Application startup complete")) {
        started = true;
        resolve();
      }
    });

    serverProcess.stderr.on("data", (data) => {
      const msg = data.toString();
      console.error("[server]", msg);
      if (!started && msg.includes("Application startup complete")) {
        started = true;
        resolve();
      }
    });

    serverProcess.on("error", (err) => {
      if (!started) reject(err);
    });

    serverProcess.on("exit", (code) => {
      if (!started) reject(new Error(`Server exited with code ${code}`));
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!started) {
        // Try connecting anyway
        checkServer()
          .then(() => {
            started = true;
            resolve();
          })
          .catch(() => reject(new Error("Server failed to start within 30s")));
      }
    }, 30000);
  });
}

function checkServer() {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${PORT}/healthz`, (res) => {
        if (res.statusCode === 200) resolve();
        else reject();
      })
      .on("error", reject);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Pagekeeper",
    titleBarStyle: "hiddenInset",
    backgroundColor: "#030712",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", async () => {
  try {
    // Show a loading splash
    const splash = new BrowserWindow({
      width: 400,
      height: 300,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      backgroundColor: "#00000000",
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    splash.loadURL(
      `data:text/html;charset=utf-8,
      <html>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#030712;color:white;font-family:-apple-system,system-ui,sans-serif;border-radius:16px;">
          <div style="text-align:center">
            <div style="font-size:48px;margin-bottom:16px">&#9889;</div>
            <div style="font-size:24px;font-weight:bold;margin-bottom:8px">Pagekeeper</div>
            <div style="color:#6ee7b7;font-size:14px">Starting server...</div>
          </div>
        </body>
      </html>`
    );

    await startServer();
    splash.close();
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
      "Pagekeeper Error",
      `Failed to start: ${err.message}\n\nMake sure Python 3.10+ is installed with pip packages: fastapi, httpx, uvicorn`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
