const express = require("express");
const router = express.Router();
const cameraController = require("./modules/camera");

// Camera routes - get, save, and restart cameras
router.get("/cameras", cameraController.getCameras);
router.post("/cameras", cameraController.saveCameras);
router.post("/cameras/:id/restart", cameraController.restartCamera);

module.exports = router;
