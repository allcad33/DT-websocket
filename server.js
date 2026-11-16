const { spawn, exec } = require('child_process');
const path = require('path');

// Function to start admin frontend
function startAdminFrontend() {
    const adminProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, 'admin'),
        stdio: 'pipe',
        shell: true
    });

    adminProcess.stdout.on('data', (data) => {
        console.log(`[Frontend] ${data.toString().trim()}`);
    });

    adminProcess.stderr.on('data', (data) => {
        console.error(`[Frontend] Error: ${data.toString().trim()}`);
    });

    adminProcess.on('error', (error) => {
        console.error(`Failed to start admin frontend: ${error.message}`);
    });
}

// Function to start the combined server
async function startCombinedServer() {
    try {
        // Start combined-server.js from the api directory
        const serverProcess = spawn('npm', ['run', 'dev'], {
            cwd: path.join(__dirname, 'api'),
            stdio: 'pipe',
            detached: false,
            shell: true
        });
        
        serverProcess.stdout.on('data', (data) => {
            console.log(`[Backend] ${data.toString().trim()}`);
        });
        
        serverProcess.stderr.on('data', (data) => {
            console.error(`[Backend] Error: ${data.toString().trim()}`);
        });
        
        serverProcess.on('error', (error) => {
            console.error(`Failed to start combined server: ${error.message}`);
        });
        
        console.log('Starting combined server on port 3000...');
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Server should be available at: http://localhost:3030');
        console.log('WebSocket available at: ws://localhost:3030');
        console.log('API available at: http://localhost:3030/api/*');
        
    } catch (error) {
        console.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', async () => {    
    try {
        console.log('Server stopped.');
    } catch (error) {
        console.error(`Error stopping server: ${error.message}`);
    }
    
    process.exit(0);
});

// Main function to start all services
async function startAllServices() {
    try {
        console.log('Starting all services...');
        
        // Then start the services
        await startCombinedServer();
        startAdminFrontend();
        
        // Keep the main process running
        process.stdin.resume();
    } catch (error) {
        console.error('Failed to start services:', error);
        process.exit(1);
    }
}

// Start everything
startAllServices();
