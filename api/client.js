const io = require("socket.io-client");
const fs = require("fs");
const path = require("path");
const {
  websocketUrl,
  WebSocketInterval,
  WebSocketEnableLoop,
} = require("./config");

// Process command line arguments
const args = process.argv.slice(2);

// Configuration
const config = {
  wsUrl: websocketUrl,
  jsonFiles: [],
  enableLoop: WebSocketEnableLoop,
  interval: WebSocketInterval,
};

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("Created data directory as it does not exist");
}

// Ensure defaultjson.json exists, create it if it doesn't
const defaultJsonPath = path.join(__dirname, "data", "defaultjson.json");
if (!fileExists(defaultJsonPath)) {
  console.log("Creating defaultjson.json as it does not exist");
  const defaultData = {
    type: "default",
    timestamp: new Date().toISOString(),
    message: "This is the default JSON data",
    status: "active",
  };
  fs.writeFileSync(
    defaultJsonPath,
    JSON.stringify(defaultData, null, 2),
    "utf8"
  );
}

// Handle command line arguments
if (args.length > 0) {
  config.jsonFiles = [];

  // Process each argument
  args.forEach((arg) => {
    // Check for direct commands first
    switch (arg) {
      case "info":
        const textDir = path.join(__dirname, "data", "TEXT");
        if (fs.existsSync(textDir)) {
          // Get all JSON files from the TEXT directory
          const files = fs
            .readdirSync(textDir)
            .filter((file) => file.endsWith(".json"))
            .map((file) => path.join("TEXT", file));

          config.jsonFiles = files;
          console.log("Adding all files from TEXT directory:", files);
        } else {
          console.log("TEXT directory not found, will use defaultjson.json");
        }
        break;
      case "image":
        const imageDir = path.join(__dirname, "data", "IMAGE");
        if (fs.existsSync(imageDir)) {
          // Get all JSON files from the IMAGE directory
          const files = fs
            .readdirSync(imageDir)
            .filter((file) => file.endsWith(".json"))
            .map((file) => path.join("IMAGE", file));

          config.jsonFiles = files;
          console.log("Adding all files from IMAGE directory:", files);
        } else {
          console.log("IMAGE directory not found, will use defaultjson.json");
        }
        break;
      case "allprocess":
        const allDir = path.join(__dirname, "data", "ALL");
        if (fs.existsSync(allDir)) {
          // Get all JSON files from the ALL directory
          const files = fs
            .readdirSync(allDir)
            .filter((file) => file.endsWith(".json"))
            .map((file) => path.join("ALL", file));

          config.jsonFiles = files;
          console.log("Adding all files from ALL directory:", files);
        } else {
          console.log("ALL directory not found, will use defaultjson.json");
        }
        break;
      case "pdf":
        const pdfDir = path.join(__dirname, "data", "PDF");
        if (fs.existsSync(pdfDir)) {
          // Get all JSON files from the PDF directory
          const files = fs
            .readdirSync(pdfDir)
            .filter((file) => file.endsWith(".json"))
            .map((file) => path.join("PDF", file));

          config.jsonFiles = files;
          console.log("Adding all files from PDF directory:", files);
        } else {
          console.log("PDF directory not found, will use defaultjson.json");
        }
        break;
      case "mqtt":
        const mqttpath = path.join(__dirname, "data", "API");
        if (fileExists(mqttpath)) {
          const files = fs
            .readdirSync(mqttpath)
            .filter((file) => file.endsWith(".json"))
            .map((file) => path.join("API", file));

          config.jsonFiles = files;
          console.log("Adding API files with defaultjson.json");
        } else {
          console.log("API files not found, will use defaultjson.json");
        }
        break;
      case "video":
        const videoPath = path.join(__dirname, "data", "IFRAME");
        if (fs.existsSync(videoPath)) {
          // Get all JSON files from the ALL directory
          const files = fs
            .readdirSync(videoPath)
            .filter((file) => file.endsWith(".json"))
            .map((file) => path.join("IFRAME", file));

          config.jsonFiles = files;
          console.log("Adding all files from ALL directory:", files);
        } else {
          console.log("ALL directory not found, will use defaultjson.json");
        }
        break;
      case "scadamqtt":
        const scadamqttPath = path.join(__dirname, "data", "SCADAMQTT");
        if (fileExists(scadamqttPath)) {
          const files = fs
            .readdirSync(scadamqttPath)
            .filter((file) => file.endsWith(".json"))
            .map((file) => path.join("SCADAMQTT", file));

          config.jsonFiles = files;
          console.log("Adding all files from SCADAMQTT directory:", files);
        } else {
          console.log("pump.json not found, will use defaultjson.json");
        }
        break;
      case "poll":
        // Keep default file but enable polling
        config.enableLoop = 1;
        break;
      case "default":
        // Explicitly use only defaultjson.json
        config.jsonFiles = [];
        console.log("Using empty configuration");
        break;
      default:
        // Check for key=value pairs
        if (arg.includes("=")) {
          const [key, value] = arg.split("=");
          if (key === "content") {
            const contentValue = value;
            const contentPath = path.join(
              __dirname,
              "data",
              `${contentValue}.json`
            );
            if (fileExists(contentPath)) {
              config.jsonFiles = [];
              config.jsonFiles.push(`${contentValue}.json`);
              console.log(`Adding ${contentValue}.json`);
            } else {
              console.log(`${contentValue}.json not found`);
            }
          } else if (key === "wsUrl") {
            config.wsUrl = value;
            console.log(`WebSocket URL set to ${value}`);
          } else if (key === "interval") {
            config.interval = parseInt(value, 10) || 1000;
            console.log(`Interval set to ${config.interval}ms`);
          } else if (key === "loop") {
            config.enableLoop = parseInt(value, 10) || 1;
            console.log(`Loop mode set to ${config.enableLoop}`);
          }
        }
    }
  });
} else {
  // No arguments provided, use default configuration
  config.jsonFiles = [];
  console.log("No arguments provided, using empty configuration");
}

console.log(`Loading JSON files: ${config.jsonFiles.join(", ")}`);

// Function to merge JSON objects
function mergeJsonObjects(objects) {
  // Create a deep copy of the first object
  const merged = JSON.parse(JSON.stringify(objects[0]));

  // For each additional object
  for (let i = 1; i < objects.length; i++) {
    const obj = objects[i];

    // Merge top-level properties
    for (const key in obj) {
      if (key === "roiList" && merged.roiList) {
        // Special handling for roiList - concatenate arrays
        merged.roiList = merged.roiList.concat(obj.roiList);
      } else {
        // For other properties, just overwrite
        merged[key] = obj[key];
      }
    }
  }

  // Update timestamp to current time
  merged.timestamp = new Date().toISOString();

  return merged;
}
// Read and send JSON files
function readAndMergeJsonFiles() {
  try {
    let folder = "";
    args.forEach((arg) => {
      switch (arg) {
        case "info":
          folder = "TEXT";
          break;
        case "image":
          folder = "IMAGE";
          break;
        case "allprocess":
          folder = "ALL";
          break;
        case "pdf":
          folder = "PDF";
          break;
        case "mqtt":
          folder = "API";
          break;
        case "video":
          folder = "IFRAME";
          break;
        case "scadamqtt":
          folder = "SCADAMQTT";
          break;
      }
    });

    let finalPath = path.join(__dirname, "data", folder);
    let finalFiles = fs
      .readdirSync(finalPath)
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.join(folder, file));

    config.jsonFiles = finalFiles;

    // If no files to process, return empty object
    if (config.jsonFiles.length === 0) {
      return {};
    }

    // Process each file
    for (const file of config.jsonFiles) {
      try {
        const filePath = path.join(__dirname, "data", file);
        const data = fs.readFileSync(filePath, "utf8");
        const jsonObj = JSON.parse(data);
        socket.emit("serverData", jsonObj);
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Error in reading files:", error.message);
    return {};
  }
}

// Main function to send data
function sendData() {
  try {
    readAndMergeJsonFiles();
  } catch (error) {
    console.error("Error in send cycle:", error);
  }
}
// Create Socket.IO client
const httpUrl = config.wsUrl.replace("ws://", "http://");
const socket = io(httpUrl, {
  path: "/socket",
  transports: ["websocket"],
  autoConnect: false,
});

// Socket.IO event handlers
socket.on("connect", () => {
  console.log("Connected to server");
  if (config.enableLoop) {
    console.log(`Starting loop with ${config.interval}ms interval`);
    // Initial send
    sendData();
    // Set up interval for updates
    setInterval(sendData, config.interval);
  } else {
    sendData();
    setTimeout(() => {
      console.log("Single send complete, disconnecting...");
      socket.disconnect();
      process.exit(0);
    }, 1000);
  }
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
  if (!config.enableLoop) {
    process.exit(0);
  }
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
  if (!config.enableLoop) {
    process.exit(1);
  }
});

// Start the connection
console.log("Connecting to server...");
socket.connect();
