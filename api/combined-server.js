const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { spawn } = require("child_process");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const archiver = require("archiver");
const mqtt = require("mqtt");

const axios = require("axios");

// Create Express app
const app = express();
const server = http.createServer(app);

// Enable CORS for all routes with specific configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Enable Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Enable JSON parsing
app.use(express.json());

// Store active processes and their socket connections
const activeProcesses = {};
const processSocketMap = new Map();

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("Created data directory as it does not exist");
}

// Serve static files
app.use(express.static(__dirname));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

let mqttTopic1, mqttTopic2, mqttTopic3, mqttTopic4, mqttTopic5;

// File operations
const FileHandler = {
  async readJsonFile(file) {
    try {
      // Check if path exists and is a file (not a directory)
      const stats = await fs.promises.stat(file).catch(() => null);
      if (!stats) {
        console.error(`File not found: ${file}`);
        return null;
      }
      if (stats.isDirectory()) {
        console.error(`Path is a directory, not a file: ${file}`);
        return null;
      }

      const data = await fs.promises.readFile(file, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.error(`File not found: ${file}`);
        return null;
      }
      if (error.code === "EISDIR") {
        console.error(`Path is a directory, not a file: ${file}`);
        return null;
      }
      console.error("Error reading JSON file:", error.message);
      throw error;
    }
  },

  async writeJsonFile(filePath, data) {
    try {
      // Ensure the directory exists
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });

      // Convert to string if object
      const jsonString =
        typeof data === "string" ? data : JSON.stringify(data, null, 2);

      // Create a temporary file path
      const tempFilePath = `${filePath}.tmp`;

      // Write to temporary file first
      await fs.promises.writeFile(tempFilePath, jsonString, "utf8");

      // Validate the written content
      try {
        const checkContent = await fs.promises.readFile(tempFilePath, "utf8");
        JSON.parse(checkContent); // Validate JSON
      } catch (validationError) {
        // If validation fails, don't proceed with the rename
        console.error(
          `JSON validation failed for ${filePath}: ${validationError.message}`,
        );
        // Clean up temp file if it exists
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (unlinkError) {
          // Ignore unlink errors
        }
        throw new Error(
          `Failed to write valid JSON: ${validationError.message}`,
        );
      }

      // Check if temp file exists before renaming
      try {
        await fs.promises.access(tempFilePath);
        // Rename temp file to target file (atomic operation)
        await fs.promises.rename(tempFilePath, filePath);
      } catch (accessError) {
        console.error(`Temporary file ${tempFilePath} does not exist`);
        throw new Error(`Temporary file was not created properly`);
      }
    } catch (error) {
      console.error("Error writing to JSON file:", error);
      throw error;
    }
  },

  // Helper function to clean and repair JSON content
  cleanJsonContent(content) {
    if (!content || typeof content !== "string") return content;

    try {
      // Try to find valid JSON by looking for matching braces
      const match = content.match(/^\s*(\{[\s\S]*\})\s*$/);
      return match ? match[1] : content.trim();
    } catch (err) {
      return content.trim();
    }
  },
};

// MQTT Client setup
let mqttClient = mqtt.connect(
  "mqtts://5c0b21424f334243b66237dfd2f9b565.s1.eu.hivemq.cloud:8883",
  {
    clientId: 56432,
    username: "admin",
    password: "Admin@321",
    rejectUnauthorized: false, // For secure connections
  },
);

let mqttTopics = [
  "rmg/iot/sensor/es1",
  "rmg/iot/sensor/es2",
  "dts/wtp/sensors",
  "dts/wtp/agitator_1/status",
  "dts/wtp/wtp_controller/status",
];

mqttClient.on("connect", () => {
  mqttClient.subscribe(mqttTopics, (err) => {
    if (err) {
      console.error("Failed to subscribe:", err);
    }
  });
});

mqttClient.on("message", async (topic, message) => {
  try {
    const newDataString = message.toString();

    switch (topic) {
      case "rmg/iot/sensor/es1":
        try {
          mqttTopic1 = JSON.parse(newDataString);
        } catch (parseError) {
          console.error("Error parsing mqttTopic1 JSON:", parseError);
          return;
        }
        break;
      case "rmg/iot/sensor/es2":
        try {
          mqttTopic2 = JSON.parse(newDataString);
        } catch (parseError) {
          console.error("Error parsing mqttTopic2 JSON:", parseError);
          return;
        }
        break;
      case "dts/wtp/sensors":
        try {
          mqttTopic3 = JSON.parse(newDataString);
          // console.log("mqttTopic3 ==>", mqttTopic3);
        } catch (parseError) {
          console.error("Error parsing mqttTopic3 JSON:", parseError);
          return;
        }
        break;
      case "dts/wtp/agitator_1/status":
        try {
          mqttTopic4 = JSON.parse(newDataString);
        } catch (parseError) {
          console.error("Error parsing mqttTopicagitator_1 JSON:", parseError);
          return;
        }
        break;
      case "dts/wtp/wtp_controller/status":
        try {
          mqttTopic5 = JSON.parse(newDataString);
        } catch (parseError) {
          console.error(
            "Error parsing mqttTopicwtp_controller JSON:",
            parseError,
          );
          return;
        }
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Error processing MQTT message:", error);
  }
});

setInterval(() => {
  updateModalJson();
}, 10000);

/**
 * Fetches device status from Shelly Cloud API.
 * @returns {Promise<object>} Response data from Shelly API.
 */
async function getShellyDeviceData() {
  const url = "https://shelly-189-eu.shelly.cloud/device/all_status";
  const authKey =
    "MzM3NWMwdWlk2CCE1D1CCBE32F744EE4B721EE7791E13327D32CBEEEA2C318105B48BFA8FB044CD035F371E70448";

  try {
    const response = await axios.post(
      url,
      new URLSearchParams({
        show_info: "true",
        auth_key: authKey,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    return response.data.data.devices_status;
  } catch (error) {
    const status = error.response?.status;
    const isRateLimit = status === 429;
    if (isRateLimit) {
      console.warn(
        "Shelly API rate limit (429). Retry after a longer interval.",
      );
    } else {
      console.error("Error fetching Shelly device data:", error.message);
    }
    return null;
  }
}

let shellyDeviceData = null;

const SHELLY_POLL_INTERVAL_MS = 20000;

setInterval(async () => {
  const data = await getShellyDeviceData();
  if (data != null) {
    shellyDeviceData = data;
  }
}, SHELLY_POLL_INTERVAL_MS);

/**
 * Loads IotCode.json and evaluates its expression-based entries with mqttTopic1/mqttTopic2 in scope.
 * File format is kept as-is (e.g. "&key": mqttTopic1?.field + " gm").
 */
function loadIotCodeData() {
  const iotCodePath = path.join(
    __dirname,
    "data",
    "UpdateData",
    "IotCode.json",
  );
  if (!fs.existsSync(iotCodePath)) return {};
  try {
    const raw = fs.readFileSync(iotCodePath, "utf8").trim();
    const inner = raw.replace(/^\s*\{\s*/, "").replace(/\s*\}\s*$/, "");
    if (!inner) return {};
    const fn = new Function(
      "shellyDeviceData,mqttTopic1,mqttTopic2,mqttTopic3,mqttTopic4,mqttTopic5",
      "return { " + inner + " }",
    );
    return fn(
      shellyDeviceData,
      mqttTopic1,
      mqttTopic2,
      mqttTopic3,
      mqttTopic4,
      mqttTopic5,
    );
  } catch (err) {
    console.error("Error loading IotCode.json:", err.message);
    return {};
  }
}

async function updateModalJson() {
  const short_code_data = {
    "&sensor_1_limestone": mqttTopic1?.limestone + " gm",
    "&sensor_1_clay": mqttTopic1?.clay + " gm",
    "&sensor_1_iron_ore": mqttTopic1?.iron_ore + " gm",
    "&sensor_1_sand": mqttTopic1?.sand + " gm",
    "&sensor_1_raw_material": mqttTopic1?.raw_material + " gm",
    "&sensor_2_kiln_temperature": mqttTopic2?.["kiln temperature"] + " °C",
    "&sensor_2_kiln_humidity": mqttTopic2?.["kiln humidity"] + " %",
    "&sensor_2_kiln_blower": mqttTopic2?.["kiln blower"],
    "&sensor_2_kiln_heater": mqttTopic2?.["kiln heater"],
    "&sensor_2_pulley_temperature": mqttTopic2?.pulley_temperature + " °C",
    "&sensor_2_vibration_level": mqttTopic2?.vibration_level,
    "&sensor_2_motor": mqttTopic2?.motor,
    "&sensor_2_pulley1": mqttTopic2?.pulley1,
    "&sensor_2_pulley2": mqttTopic2?.pulley2,
    "&sensor_2_pulley3": mqttTopic2?.pulley3,
    "&sensor_2_rotor": mqttTopic2?.rotor,
    "&sensor_2_pulley_heater": mqttTopic2?.pulley_heater,
    "&sensor_2_pulley_blower": mqttTopic2?.pulley_blower,
    "&sensor_2_pulley_vibration_motor": mqttTopic2?.pulley_vibration_motor,
    // shelly device data
    ...loadIotCodeData(),
  };

  console.log("short_code_data---->", short_code_data);
  try {
    let fileListArray = fileList.split(",");

    // Verify which files are present and which are not in data/ALL folder
    const scadamqttFolderPath = path.join(__dirname, "data", "ALL");
    const presentFiles = [];

    fileListArray.forEach((fileName) => {
      const trimmedFileName = fileName.trim();
      // Skip empty strings
      if (!trimmedFileName) {
        return;
      }

      const filePath = path.join(scadamqttFolderPath, trimmedFileName);
      // Check if path exists and is a file (not a directory)
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          presentFiles.push(trimmedFileName);
        } else {
          console.warn(`Skipping directory: ${trimmedFileName}`);
        }
      }
    });
    if (presentFiles.length > 0) {
      console.log(
        "All files present in data/ALL folder for mapping:",
        presentFiles,
      );
    }

    for (let i = 0; i < presentFiles.length; i++) {
      const el = presentFiles[i];

      let fileData = await FileHandler.readJsonFile(
        path.join(__dirname, "data", "ALL", el),
      );

      // Skip if fileData is null or doesn't have roiList
      if (!fileData || !fileData.roiList) {
        console.warn(`Skipping file ${el}: invalid or missing data`);
        continue;
      }

      fileData.roiList.forEach((roi) => {
        if (roi?.content && roi?.content?.type === "RichInfo") {
          roi?.content?.sections.forEach((element) => {
            // If short_code already exists, use it; otherwise check text
            if (!element?.short_code) {
              let short_code = element?.text;
              if (
                short_code &&
                typeof short_code === "string" &&
                short_code.startsWith("$")
              ) {
                element.short_code = short_code.replace("$", "");
              }
            }

            // Only parse if short_code exists and is a valid string
            if (element.short_code && typeof element.short_code === "string") {
              try {
                let parsedShortCode = JSON.parse(element.short_code);

                let text = "";

                parsedShortCode.forEach((item, index) => {
                  if (
                    item?.value &&
                    short_code_data.hasOwnProperty(item.value)
                  ) {
                    const label = item?.key || "";
                    const value = short_code_data[item.value];

                    text += `${label}: ${value}${
                      index !== parsedShortCode.length - 1 ? "\n" : ""
                    }`;
                  } else {
                    const label = item?.key || "";
                    const value = item.value;

                    text += `${label}: ${value}${
                      index !== parsedShortCode.length - 1 ? "\n" : ""
                    }`;
                  }
                });

                element.text = text;
              } catch (error) {
                console.error("Error parsing short_code:");
              }
            }
          });
        }
      });

      // Write the modified fileData back to the file
      await FileHandler.writeJsonFile(
        path.join(__dirname, "data", "ALL", el),
        fileData,
      );

      console.log(`${el} file updated successfully`);
    }
    return;
  } catch (error) {
    console.error("Error updating modal.json:", error);
  }
}

// Function to merge JSON objects
function mergeJsonObjects(objects) {
  const merged = JSON.parse(JSON.stringify(objects[0]));
  for (let i = 1; i < objects.length; i++) {
    const obj = objects[i];
    for (const key in obj) {
      if (key === "roiList" && merged.roiList) {
        merged.roiList = merged.roiList.concat(obj.roiList);
      } else {
        merged[key] = obj[key];
      }
    }
  }
  merged.timestamp = new Date().toISOString();
  return merged;
}

// Function to forcefully disconnect all sockets
function disconnectAllSockets() {
  // Disconnect all socket.io clients
  io.sockets.sockets.forEach((socket) => {
    socket.disconnect(true);
  });
  // Clear the socket map
  processSocketMap.clear();
}

// Function to start a client process
async function startClientProcess(param, id) {
  const processId = id || Date.now().toString();

  // Stop conflicting processes first
  if (
    param &&
    [
      "info",
      "image",
      "pdf",
      "video",
      "allprocess",
      "mqtt",
      "scadamqtt",
    ].includes(param)
  ) {
    const conflictingProcesses = Object.entries(activeProcesses).filter(
      ([_, proc]) =>
        proc.running &&
        [
          "info",
          "image",
          "pdf",
          "video",
          "allprocess",
          "mqtt",
          "scadamqtt",
        ].includes(proc.param) &&
        proc.param !== param,
    );

    if (conflictingProcesses.length > 0) {
      // Disconnect all sockets first
      disconnectAllSockets();

      // Stop conflicting processes
      conflictingProcesses.forEach(([pid, proc]) => {
        try {
          proc.process.kill("SIGKILL");
          delete activeProcesses[pid];
        } catch (error) {
          console.error(
            `Error stopping conflicting process ${pid}:`,
            error.message,
          );
        }
      });

      // Small delay to ensure cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  let params = [];
  if (param) {
    params = [param];
    console.log(`Starting client with param: ${param}`);
  }

  const clientProcess = spawn("node", ["client.js", ...params], {
    stdio: "pipe",
    detached: false,
  });

  activeProcesses[processId] = {
    process: clientProcess,
    param: param,
    startTime: new Date().toISOString(),
    endTime: null,
    exitCode: null,
    running: true,
    lastLogs: [],
  };

  clientProcess.stdout.on("data", (data) => {
    const message = data.toString().trim();
    const logEntry = {
      type: "stdout",
      message: message,
      time: new Date().toISOString(),
    };

    if (activeProcesses[processId]) {
      activeProcesses[processId].lastLogs.push(logEntry);
      if (activeProcesses[processId].lastLogs.length > 5) {
        activeProcesses[processId].lastLogs.shift();
      }
    }

    console.log(`[${processId}] ${message}`);
  });

  clientProcess.stderr.on("data", (data) => {
    const message = data.toString().trim();
    const logEntry = {
      type: "stderr",
      message: message,
      time: new Date().toISOString(),
    };

    if (activeProcesses[processId]) {
      activeProcesses[processId].lastLogs.push(logEntry);
      if (activeProcesses[processId].lastLogs.length > 5) {
        activeProcesses[processId].lastLogs.shift();
      }
    }

    console.error(`[${processId}] Error: ${message}`);
  });

  clientProcess.on("exit", (code) => {
    if (activeProcesses[processId]) {
      activeProcesses[processId].running = false;
      activeProcesses[processId].exitCode = code;
      activeProcesses[processId].endTime = new Date().toISOString();
    }
    console.log(`Process ${processId} exited with code ${code}`);
  });

  return processId;
}

// Function to stop all running processes
async function stopAllProcesses(excludeDefault = true) {
  // First disconnect all sockets
  disconnectAllSockets();

  const processIds = Object.keys(activeProcesses);

  const stopPromises = processIds.map((pid) => {
    return new Promise((resolve) => {
      const process = activeProcesses[pid];
      if (process && process.running) {
        try {
          // Force kill immediately
          process.process.kill("SIGKILL");
          process.running = false;
          process.endTime = new Date().toISOString();
          process.exitCode = "killed";
          delete activeProcesses[pid];
        } catch (error) {
          console.error(`Error stopping process ${pid}:`, error.message);
          delete activeProcesses[pid];
        }
      } else {
        delete activeProcesses[pid];
      }
      resolve();
    });
  });

  await Promise.all(stopPromises);
  console.log("All specified processes have been stopped and cleaned up");
}

// WebSocket connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("identify", (processId) => {
    if (processId && activeProcesses[processId]) {
      // Remove any existing socket for this process
      const existingSocket = processSocketMap.get(processId);
      if (existingSocket && existingSocket !== socket) {
        existingSocket.disconnect(true);
      }
      processSocketMap.set(processId, socket);
      console.log(`Socket ${socket.id} identified with process ${processId}`);
    }
  });

  socket.on("serverData", (data) => {
    console.log(`Received data from client ${socket.id}`);
    socket.broadcast.emit("serverData", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    for (const [processId, sock] of processSocketMap.entries()) {
      if (sock === socket) {
        processSocketMap.delete(processId);
        console.log(`Removed socket mapping for process ${processId}`);
        break;
      }
    }
  });
});

// API Routes

// Get list of JSON files
app.get("/api/json-files", (req, res) => {
  try {
    const files = fs
      .readdirSync(path.join(__dirname, "data"))
      .filter((file) => file.endsWith(".json"))
      .map((file) => ({
        name: file,
        size: fs.statSync(path.join(__dirname, "data", file)).size,
      }));
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get JSON file content
app.get("/api/json-content/:filename", (req, res) => {
  try {
    const filename = req.params.filename;

    if (filename.includes(",")) {
      const filenames = filename.split(",");
      const jsonObjects = [];

      for (const file of filenames) {
        if (file.includes("..") || !file.endsWith(".json")) {
          return res.status(400).json({ error: `Invalid filename: ${file}` });
        }

        const filePath = path.join(__dirname, "data", file);
        if (!fs.existsSync(filePath)) {
          console.log(`File not found: ${file}, skipping`);
          continue;
        }

        try {
          const fileContent = fs.readFileSync(filePath, "utf8");
          jsonObjects.push(JSON.parse(fileContent));
        } catch (fileError) {
          console.error(`Error reading ${file}:`, fileError.message);
        }
      }

      if (jsonObjects.length === 0) {
        return res.status(404).json({ error: "No valid files found" });
      }

      const mergedJson = mergeJsonObjects(jsonObjects);
      res.json({ content: JSON.stringify(mergedJson) });
      return;
    }

    if (filename.includes("..") || !filename.endsWith(".json")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(__dirname, "data", filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Read and return the requested file directly without merging with defaultjson.json
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const fileJson = JSON.parse(fileContent);
      res.json({ content: JSON.stringify(fileJson) });
      return;
    } catch (error) {
      console.error("Error reading JSON file:", error.message);
      return res.status(500).json({ error: "Error reading JSON file" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start client endpoints
app.get("/api/start/:param?", async (req, res) => {
  try {
    const param = req.params.param || "";
    const id = req.query.id || Date.now().toString();

    // Stop all existing processes before starting new ones
    await stopAllProcesses();

    // Start new process
    const processId = await startClientProcess(param, id);

    res.json({
      success: true,
      message: `Started client with param: ${param}`,
      id: processId,
    });
  } catch (error) {
    console.error("Error starting client:", error);
    res.status(500).json({
      success: false,
      message: `Error starting client: ${error.message}`,
    });
  }
});

// Stop client endpoints
app.get("/api/stop/:id", (req, res) => {
  const { id } = req.params;

  if (!activeProcesses[id] || !activeProcesses[id].process) {
    return res.status(404).json({
      success: false,
      message: `No active process found with ID ${id}`,
    });
  }

  try {
    activeProcesses[id].process.kill();

    res.json({
      success: true,
      message: `Stopped process ${id}`,
    });
  } catch (error) {
    console.error(`Error stopping process ${id}:`, error);
    res.status(500).json({
      success: false,
      message: `Error stopping process: ${error.message}`,
    });
  }
});

// Stop all clients
app.get("/api/stop-all", (req, res) => {
  const processIds = Object.keys(activeProcesses);

  if (processIds.length === 0) {
    const defaultId = `default-${Date.now()}`;
    startClientProcess("default", defaultId);

    return res.json({
      success: true,
      message: "No active processes to stop. Started a default client.",
      defaultClientId: defaultId,
    });
  }

  let hasDefaultClient = false;
  let defaultClientId = null;

  processIds.forEach((id) => {
    const proc = activeProcesses[id];
    if (proc && (proc.param === "" || proc.param === "default")) {
      hasDefaultClient = true;
      defaultClientId = id;
    }
  });

  const results = {
    success: true,
    stopped: [],
    failed: [],
  };

  processIds.forEach((id) => {
    const proc = activeProcesses[id];

    if (
      hasDefaultClient &&
      (proc.param === "" || proc.param === "default") &&
      id === defaultClientId
    ) {
      console.log(`Keeping default client: ${id}`);
      return;
    }

    try {
      if (activeProcesses[id] && activeProcesses[id].process) {
        activeProcesses[id].process.kill();
        results.stopped.push(id);
      }
    } catch (error) {
      console.error(`Error stopping process ${id}:`, error);
      results.failed.push({ id, error: error.message });
      results.success = false;
    }
  });

  if (!hasDefaultClient) {
    const defaultId = `default-${Date.now()}`;
    startClientProcess("default", defaultId);
    defaultClientId = defaultId;
  }

  res.json({
    ...results,
    message: `Stopped ${results.stopped.length} processes, failed to stop ${
      results.failed.length
    } processes. ${
      hasDefaultClient
        ? "Kept existing default client."
        : "Started a new default client."
    }`,
    defaultClientId: defaultClientId,
  });
});

// Get status of all processes
app.get("/api/status", (req, res) => {
  const processes = {};

  Object.keys(activeProcesses).forEach((id) => {
    const proc = activeProcesses[id];
    processes[id] = {
      param: proc.param,
      startTime: proc.startTime,
      endTime: proc.endTime || null,
      exitCode: proc.exitCode !== undefined ? proc.exitCode : null,
      running: !proc.exitCode && proc.process && !proc.process.killed,
      lastLogs: proc.lastLogs,
    };
  });

  res.json({
    success: true,
    processes,
  });
});

// Get logs for a specific process
app.get("/api/logs/:id", (req, res) => {
  const { id } = req.params;

  if (!activeProcesses[id]) {
    return res.status(404).json({
      success: false,
      message: `No process found with ID ${id}`,
    });
  }

  res.json({
    success: true,
    id,
    logs: activeProcesses[id].lastLogs,
  });
});

app.post("/api/create-folder", async (req, res) => {
  try {
    const { folderName } = req.body;

    if (!folderName) {
      return res.status(400).json({
        success: false,
        message: "Folder name is required",
      });
    }

    // Sanitize folder name to prevent directory traversal
    const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9-_]/g, "");
    const folderPath = path.join(__dirname, "data", sanitizedFolderName);

    // Check if folder already exists
    try {
      await fs.promises.access(folderPath);
      return res.status(409).json({
        success: false,
        message: "Folder already exists",
      });
    } catch (error) {
      // Folder doesn't exist, proceed with creation
    }

    // Create the folder
    await fs.promises.mkdir(folderPath, { recursive: true });

    // Create a default JSON file in the new folder
    const defaultJsonPath = path.join(folderPath, "default.json");
    const defaultData = {
      type: sanitizedFolderName,
      timestamp: new Date().toISOString(),
      data: [],
    };

    await fs.promises.writeFile(
      defaultJsonPath,
      JSON.stringify(defaultData, null, 2),
      "utf8",
    );

    res.status(201).json({
      success: true,
      message: "Folder created successfully",
      path: folderPath,
      defaultFile: defaultJsonPath,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({
      success: false,
      message: "Error creating folder",
      error: error.message,
    });
  }
});

// Add an endpoint to list all folders
app.get("/api/folders", async (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data");
    const dirents = await fs.promises.readdir(dataPath, {
      withFileTypes: true,
    });

    const folderList = dirents
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => ({
        name: dirent.name,
        path: path.join("data", dirent.name),
      }));

    res.json({
      success: true,
      folders: folderList,
    });
  } catch (error) {
    console.error("Error listing folders:", error);
    res.status(500).json({
      success: false,
      message: "Error listing folders",
      error: error.message,
    });
  }
});

// Add new endpoint for getting folder contents
app.get("/api/folder-contents/:folderName", async (req, res) => {
  try {
    const folderName = req.params.folderName;
    const folderPath = path.join(__dirname, "data", folderName);

    // Check if folder exists
    try {
      await fs.promises.access(folderPath, fs.constants.F_OK);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "Folder not found",
      });
    }

    // Get all files in the folder
    const files = await fs.promises.readdir(folderPath, {
      withFileTypes: true,
    });

    // Get file details for each file
    const fileDetails = await Promise.all(
      files
        .filter((file) => file.isFile())
        .map(async (file) => {
          const filePath = path.join(folderPath, file.name);
          const stats = await fs.promises.stat(filePath);

          return {
            name: file.name,
            size: stats.size,
            modifiedAt: stats.mtime,
            isDirectory: false,
          };
        }),
    );

    res.json({
      success: true,
      files: fileDetails,
    });
  } catch (error) {
    console.error("Error getting folder contents:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get folder contents",
    });
  }
});

// Add new endpoint for deleting a file
app.delete("/api/file/:folderName/:fileName", async (req, res) => {
  try {
    const { folderName, fileName } = req.params;

    // Decode the URL-encoded file name
    const decodedFileName = decodeURIComponent(fileName);

    console.log("Delete request received:");
    console.log("Folder:", folderName);
    console.log("Original File Name:", fileName);
    console.log("Decoded File Name:", decodedFileName);

    // Get the absolute path to the data directory
    const dataDir = path.join(__dirname, "data");
    const folderPath = path.join(dataDir, folderName);
    const filePath = path.join(folderPath, decodedFileName);

    console.log("Full paths:");
    console.log("Data Directory:", dataDir);
    console.log("Folder Path:", folderPath);
    console.log("File Path:", filePath);

    // Check if folder exists
    try {
      await fs.promises.access(folderPath, fs.constants.F_OK);
    } catch (error) {
      console.error("Folder not found:", folderPath);
      return res.status(404).json({
        success: false,
        error: "Folder not found",
        details: {
          folderPath,
          error: error.message,
        },
      });
    }

    // Check if file exists
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
    } catch (error) {
      console.error("File not found:", filePath);
      return res.status(404).json({
        success: false,
        error: "File not found",
        details: {
          filePath,
          error: error.message,
        },
      });
    }

    // Delete the file
    await fs.promises.unlink(filePath);

    res.json({
      success: true,
      message: "File deleted successfully",
      path: filePath,
    });
  } catch (error) {
    console.error("Error in delete operation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete file",
      details: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderPath = path.join(__dirname, "data", req.params.folderName);
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    // Use original filename without sanitization
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10, // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Only allow JSON files
    if (file.mimetype === "application/json") {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are allowed"));
    }
  },
});

// Add file upload endpoint
app.post(
  "/api/upload/:folderName",
  upload.array("files", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No files uploaded",
        });
      }

      const folderPath = path.join(__dirname, "data", req.params.folderName);

      // Check if folder exists
      try {
        await fs.promises.access(folderPath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: "Folder not found",
        });
      }

      // Process each uploaded file
      const uploadedFiles = req.files.map((file) => ({
        name: file.originalname,
        size: file.size,
        path: file.path,
        mimetype: file.mimetype,
      }));

      res.json({
        success: true,
        message: "Files uploaded successfully",
        files: uploadedFiles,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload files",
        details: error.message,
      });
    }
  },
);

// Add new endpoint for deleting a folder
app.delete("/api/folder/:folderName", async (req, res) => {
  try {
    const { folderName } = req.params;
    const folderPath = path.join(__dirname, "data", folderName);

    // Check if folder exists
    try {
      await fs.promises.access(folderPath, fs.constants.F_OK);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "Folder not found",
      });
    }

    // Read directory contents
    const files = await fs.promises.readdir(folderPath);

    // Delete all files in the folder
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      await fs.promises.unlink(filePath);
    }

    // Delete the folder itself
    await fs.promises.rmdir(folderPath);

    res.json({
      success: true,
      message: "Folder deleted successfully",
      path: folderPath,
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete folder",
      details: error.message,
    });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;

    // Define users array with plain text passwords
    const users = [
      { id: 1, username: "admin", password: "admin" },
      { id: 2, username: "user", password: "user123" },
    ];

    // Find user in the array
    const user = users.find(
      (u) => u.username === username && u.password === password,
    );

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Return success response with user ID
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Add endpoint for getting file content
app.get("/api/file-content/:folderName/:fileName", async (req, res) => {
  try {
    const { folderName, fileName } = req.params;
    const decodedFileName = decodeURIComponent(fileName);
    const filePath = path.join(__dirname, "data", folderName, decodedFileName);

    // Check if file exists
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Read file content
    const content = await fs.promises.readFile(filePath, "utf8");
    res.json({
      success: true,
      content: content,
    });
  } catch (error) {
    console.error("Error reading file content:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read file content",
    });
  }
});

// Add endpoint for updating file content
app.put("/api/file-content/:folderName/:fileName", async (req, res) => {
  try {
    const { folderName, fileName } = req.params;
    const { content } = req.body;
    const decodedFileName = decodeURIComponent(fileName);
    const filePath = path.join(__dirname, "data", folderName, decodedFileName);

    // Check if file exists
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Write updated content
    await fs.promises.writeFile(filePath, content, "utf8");
    res.json({
      success: true,
      message: "File content updated successfully",
    });
  } catch (error) {
    console.error("Error updating file content:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update file content",
    });
  }
});

// Add endpoint for getting config data
app.get("/api/config", async (req, res) => {
  try {
    const configPath = path.join(__dirname, "config.js");
    const configContent = await fs.promises.readFile(configPath, "utf8");

    // Parse the config content to extract the exported values
    const configData = {
      websocketUrl: configContent.match(
        /export const websocketUrl = "([^"]+)"/,
      )?.[1],
      bitrixBroker: configContent.match(
        /export const bitrixBroker = "([^"]+)"/,
      )?.[1],
      bitrixTopic: configContent.match(
        /export const bitrixTopic = "([^"]+)"/,
      )?.[1],
      bitrixUsername: configContent.match(
        /export const bitrixUsername = "([^"]+)"/,
      )?.[1],
      bitrixPassword: configContent.match(
        /export const bitrixPassword = "([^"]+)"/,
      )?.[1],
      scadamqttBroker: configContent.match(
        /export const scadamqttBroker = "([^"]+)"/,
      )?.[1],
      scadamqttTopic: configContent.match(
        /export const scadamqttTopic = "([^"]+)"/,
      )?.[1],
      scadamqttUsername: configContent.match(
        /export const scadamqttUsername = "([^"]+)"/,
      )?.[1],
      scadamqttPassword: configContent.match(
        /export const scadamqttPassword = "([^"]+)"/,
      )?.[1],
      fileList: configContent.match(/export const fileList = "([^"]+)"/)?.[1],
    };

    res.json({
      success: true,
      config: configData,
    });
  } catch (error) {
    console.error("Error reading config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read config file",
    });
  }
});

// Add endpoint for updating config data
app.put("/api/config", async (req, res) => {
  try {
    const configPath = path.join(__dirname, "config.js");
    const newConfig = req.body;

    // Read the current config file
    const currentConfigContent = await fs.promises.readFile(configPath, "utf8");

    // Parse existing config values
    const existingConfig = {
      websocketUrl:
        currentConfigContent.match(
          /export const websocketUrl = "([^"]+)"/,
        )?.[1] || "",
      bitrixBroker:
        currentConfigContent.match(
          /export const bitrixBroker = "([^"]+)"/,
        )?.[1] || "",
      bitrixTopic:
        currentConfigContent.match(
          /export const bitrixTopic = "([^"]+)"/,
        )?.[1] || "",
      bitrixUsername:
        currentConfigContent.match(
          /export const bitrixUsername = "([^"]+)"/,
        )?.[1] || "",
      bitrixPassword:
        currentConfigContent.match(
          /export const bitrixPassword = "([^"]+)"/,
        )?.[1] || "",
      scadamqttBroker:
        currentConfigContent.match(
          /export const scadamqttBroker = "([^"]+)"/,
        )?.[1] || "",
      scadamqttTopic:
        currentConfigContent.match(
          /export const scadamqttTopic = "([^"]+)"/,
        )?.[1] || "",
      scadamqttUsername:
        currentConfigContent.match(
          /export const scadamqttUsername = "([^"]+)"/,
        )?.[1] || "",
      scadamqttPassword:
        currentConfigContent.match(
          /export const scadamqttPassword = "([^"]+)"/,
        )?.[1] || "",
      fileList:
        currentConfigContent.match(/export const fileList = "([^"]+)"/)?.[1] ||
        "",
    };

    // Merge only provided fields with existing config
    const mergedConfig = {
      websocketUrl:
        newConfig.websocketUrl !== undefined
          ? newConfig.websocketUrl
          : existingConfig.websocketUrl,
      bitrixBroker:
        newConfig.bitrixBroker !== undefined
          ? newConfig.bitrixBroker
          : existingConfig.bitrixBroker,
      bitrixTopic:
        newConfig.bitrixTopic !== undefined
          ? newConfig.bitrixTopic
          : existingConfig.bitrixTopic,
      bitrixUsername:
        newConfig.bitrixUsername !== undefined
          ? newConfig.bitrixUsername
          : existingConfig.bitrixUsername,
      bitrixPassword:
        newConfig.bitrixPassword !== undefined
          ? newConfig.bitrixPassword
          : existingConfig.bitrixPassword,
      scadamqttBroker:
        newConfig.scadamqttBroker !== undefined
          ? newConfig.scadamqttBroker
          : existingConfig.scadamqttBroker,
      scadamqttTopic:
        newConfig.scadamqttTopic !== undefined
          ? newConfig.scadamqttTopic
          : existingConfig.scadamqttTopic,
      scadamqttUsername:
        newConfig.scadamqttUsername !== undefined
          ? newConfig.scadamqttUsername
          : existingConfig.scadamqttUsername,
      scadamqttPassword:
        newConfig.scadamqttPassword !== undefined
          ? newConfig.scadamqttPassword
          : existingConfig.scadamqttPassword,
      fileList:
        newConfig.fileList !== undefined
          ? newConfig.fileList
          : existingConfig.fileList
            ? existingConfig.fileList
            : "",
    };

    // Escape quotes in values to prevent injection
    const escapeValue = (value) => {
      if (value === null || value === undefined) return "";
      return String(value).replace(/"/g, '\\"');
    };

    // Create the new config content
    const newConfigContent = `// MQTT Configuration
export const websocketUrl = "${escapeValue(mergedConfig.websocketUrl)}";
export const WebSocketInterval = 1000;
export const WebSocketEnableLoop = 1;
export const bitrixBroker = "${escapeValue(mergedConfig.bitrixBroker)}";
export const bitrixTopic = "${escapeValue(mergedConfig.bitrixTopic)}";
export const bitrixUsername = "${escapeValue(mergedConfig.bitrixUsername)}";
export const bitrixPassword = "${escapeValue(mergedConfig.bitrixPassword)}";
export const scadamqttBroker = "${escapeValue(mergedConfig.scadamqttBroker)}";
export const scadamqttTopic = "${escapeValue(mergedConfig.scadamqttTopic)}";
export const scadamqttUsername = "${escapeValue(
      mergedConfig.scadamqttUsername,
    )}";
export const scadamqttPassword = "${escapeValue(
      mergedConfig.scadamqttPassword,
    )}";
export const fileList = "${escapeValue(mergedConfig.fileList)}";

// MQTT Configuration object
export const mqttconfig = {
  mqtt: {
    broker: bitrixBroker,
    topic: bitrixTopic,
    username: bitrixUsername,
    password: bitrixPassword,
    clientId: bitrixTopic + Math.random().toString(16).substr(3, 9),
  },
  scadamqtt: {
    broker: scadamqttBroker,
    topic: scadamqttTopic,
    username: scadamqttUsername,
    password: scadamqttPassword,
    clientId: scadamqttTopic + Math.random().toString(16).substr(3, 9),
  }
};

// Ignore folders
export const ignoreFolders = ["API", "SCADAMQTT"];`;

    // Write the new config back to the file
    await fs.promises.writeFile(configPath, newConfigContent, "utf8");

    // Restart the MQTT client with new configuration (only if it exists)
    if (typeof mqttClient !== "undefined" && mqttClient) {
      try {
        mqttClient.end();
      } catch (err) {
        console.error("Error closing MQTT client:", err);
      }
    }

    res.json({
      success: true,
      message: "Configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating config:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update configuration",
      details: error.message,
    });
  }
});

// Add endpoint for verifying token
app.post("/api/auth/verify-token", (req, res) => {
  try {
    const { token } = req.body;
    const users = [
      { id: 1, username: "admin", password: "admin" },
      { id: 2, username: "user", password: "user123" },
    ];
    if (token == "" && token == "undefined") {
      return res.status(400).json({
        success: false,
        error: "Token and user ID are required",
      });
    }

    // Token and user ID are valid
    res.json({
      success: true,
      message: "Token and user ID are valid",
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Download folder as ZIP
app.get("/api/download-folder/:folderName", async (req, res) => {
  try {
    const { folderName } = req.params;
    const folderPath = path.join(__dirname, "data", folderName);

    // Check if folder exists
    try {
      await fs.promises.access(folderPath, fs.constants.F_OK);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "Folder not found",
      });
    }

    // Create a zip archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level
    });

    // Set the response headers
    res.attachment(`${folderName}.zip`);
    archive.pipe(res);

    // Add the entire folder to the archive
    archive.directory(folderPath, folderName);

    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error("Error creating zip archive:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create zip archive",
      details: error.message,
    });
  }
});

// MQTT Publish endpoint (GET with query parameters)
app.get("/api/mqtt/publish", async (req, res) => {
  try {
    const { topic, message, status, inputs } = req.query;
    console.log(
      `topic: ${topic}, message: ${message}, status: ${status}, inputs: ${inputs}`,
    );

    if (!topic || !message) {
      return res.status(400).json({
        success: false,
        error: "topic and message are required",
      });
    }

    // Parse status - preserve type: boolean for true/false, number for 0/1
    let statusValue;
    if (status !== undefined) {
      if (status === "true" || status === true) {
        statusValue = true;
      } else if (status === "false" || status === false) {
        statusValue = false;
      } else if (status === "1" || status === 1) {
        statusValue = 1;
      } else if (status === "0" || status === 0) {
        statusValue = 0;
      } else {
        statusValue = status;
      }
    }

    // Construct MQTT topic
    let mqttTopic;

    if (topic == 1 || topic == 2) {
      mqttTopic = `rmg/iot/command/es${topic}`;
    } else {
      mqttTopic = topic;
    }

    let messagePayload = {};

    if (topic == 1) {
      if (message == "raw_material_control") {
        messagePayload = { raw_material_control: statusValue };
      } else if (message == "raw_material_target" && inputs) {
        const inputValues = inputs.split(",").map((val) => {
          const num = Number(val.trim());
          return isNaN(num) ? val.trim() : num;
        });
        messagePayload = {
          limestone_target: inputValues[0] || 0,
          clay_target: inputValues[1] || 0,
          iron_ore_target: inputValues[2] || 0,
          sand_target: inputValues[3] || 0,
        };
      }
    } else if (topic == 2) {
      messagePayload = {
        method: message,
        params: statusValue,
      };
    } else {
      messagePayload =
        status !== undefined ? { [message]: statusValue } : { message };
    }

    const messageString = JSON.stringify(messagePayload);

    // Publish to MQTT
    mqttClient.publish(mqttTopic, messageString, (err) => {
      if (err) {
        console.error(`Error publishing to topic ${mqttTopic}:`, err);
        return res.status(500).json({
          success: false,
          error: `Failed to publish message: ${err.message}`,
        });
      }

      console.log(`Published to topic ${mqttTopic}:`, messageString);
      res.json({
        success: true,
        message: "Message published successfully",
        topic: mqttTopic,
        payload: messagePayload,
      });
    });
  } catch (error) {
    console.error("Error in MQTT publish endpoint:", error);
    res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`,
    });
  }
});

// Import Camera routes
const cameraRoutes = require("./camera-routes");
const { fileList } = require("./config");
const { log } = require("console");

// Use Camera routes
app.use("/api", cameraRoutes);

// Start the combined server
const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
  console.log(`REST API endpoints available at http://localhost:${PORT}/api/*`);
});
