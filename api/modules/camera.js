const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Path to the camera configuration file
const CAMERA_CONFIG_PATH = path.join(__dirname, "..", "cameraconfig.json");

// Ensure the camera config file exists
const ensureCameraConfigExists = () => {
  if (!fs.existsSync(CAMERA_CONFIG_PATH)) {
    fs.writeFileSync(CAMERA_CONFIG_PATH, JSON.stringify([], null, 2));
  }
};

// Read all cameras from the config file
const readCameras = () => {
  try {
    ensureCameraConfigExists();
    const data = fs.readFileSync(CAMERA_CONFIG_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading camera config:", error);
    return [];
  }
};

// Write cameras to the config file
const writeCameras = (cameras) => {
  try {
    ensureCameraConfigExists();
    fs.writeFileSync(CAMERA_CONFIG_PATH, JSON.stringify(cameras, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing camera config:", error);
    return false;
  }
};

// Helper to run reboot curl command
function rebootCommand(ip, port) {
  return new Promise((resolve, reject) => {
    const curlCmd = `curl -X POST -d '{"name":"camera._cmdLine","parameters":{"cmd":"/sbin/reboot"}}' http://${ip}:${port}/osc/commands/execute`;

    exec(curlCmd, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Camera operations - save array and get cameras
const cameraController = {
  // Get all cameras
  getCameras: (req, res) => {
    try {
      const cameras = readCameras();
      res.json({
        success: true,
        data: cameras,
        count: cameras.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch cameras",
        error: error.message,
      });
    }
  },

  // Save array of cameras
  saveCameras: (req, res) => {
    try {
      const { cameras } = req.body;

      if (!Array.isArray(cameras)) {
        return res.status(400).json({
          success: false,
          message: "Cameras must be an array",
        });
      }

      if (writeCameras(cameras)) {
        res.json({
          success: true,
          message: `${cameras.length} cameras saved successfully`,
          count: cameras.length,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to save cameras",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to save cameras",
        error: error.message,
      });
    }
  },

  restartCamera: (req, res) => {
    try {
      const { id } = req.params;
      const cameras = readCameras();
      const camera = cameras.find((cam) => cam.id === id);

      if (!camera) {
        return res.status(404).json({
          success: false,
          message: `Camera ${id} not found`,
        });
      }

      const { ip, port } = camera;

      rebootCommand(ip, port)
        .then((output) => {
          res.json({
            success: true,
            message: `Camera ${id} rebooted successfully`,
            camera: id,
            output,
          });
        })
        .catch((err) => {
          res.status(200).json({
            success: false,
            message: `Failed to reboot camera ${id}`,
            camera: id,
            error: err,
          });
        });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to restart camera",
        error: error.message,
      });
    }
  },
};

module.exports = cameraController;
