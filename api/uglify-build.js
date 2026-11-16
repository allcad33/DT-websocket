const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

// Define the source and destination directories
const srcDir = path.join(__dirname, "..", "api");
const outDir = path.join(__dirname, "..", "apiBuild");

// Ensure the output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const excludeFromMinification = [
  "config.js",
  "nodemon.json",
  "cameraconfig.json",
  "package.json",
  "package-lock.json",
];
const copyFolders = ["node_modules", "data", "modules"];
// Copy excluded files separately to ensure they are preserved
excludeFromMinification.forEach((file) => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(outDir, file);
  if (fs.existsSync(srcPath)) {
    console.log(`Copying excluded file: ${file}`);
    fs.copyFileSync(srcPath, destPath);
  }
});

// Copy specified folders
copyFolders.forEach((folder) => {
  const srcPath = path.join(srcDir, folder);
  const destPath = path.join(outDir, folder);
  if (fs.existsSync(srcPath)) {
    console.log(`Copying folder: ${folder}`);
    fs.cpSync(srcPath, destPath, {
      recursive: true,
      force: true,
    });
  } else {
    console.log(`Warning: Folder not found: ${folder}`);
  }
});

// Function to obfuscate JS files or copy non-JS files
function obfuscateFile(filePath) {
  const fileExt = path.extname(filePath);
  const outputFilePath = path.join(outDir, path.basename(filePath));

  if (fileExt === ".js") {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const result = JavaScriptObfuscator.obfuscate(fileContent, {
      compact: true,
      controlFlowFlattening: true,
    });

    fs.writeFileSync(outputFilePath, result.getObfuscatedCode());
    console.log(`Obfuscated: ${path.basename(filePath)}`);
  } else {
    fs.copyFileSync(filePath, outputFilePath);
    console.log(`Copied as-is: ${path.basename(filePath)}`);
  }
}

// Process files in the source directory
if (fs.existsSync(srcDir)) {
  console.log("Processing source files...");
  fs.readdirSync(srcDir).forEach((file) => {
    const filePath = path.join(srcDir, file);
    if (fs.lstatSync(filePath).isFile()) {
      // Check if file should be excluded from obfuscation
      if (!excludeFromMinification.includes(file)) {
        obfuscateFile(filePath);
      }
    }
  });
}

console.log("Build complete. Files are in the apiBuild directory.");
