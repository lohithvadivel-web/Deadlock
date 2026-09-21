const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const PORT = process.env.PORT || 8080;
const COOLDOWN_MS = 3500; // 3.5 seconds anti-spam rate limit per vehicle node

// Path to the newer frontend HTML file located in the parent directory
const FRONTEND_FILE = path.join(__dirname, '..', 'vehiclenet_spatial_concept.html');
const FRONTEND_DIR = path.join(__dirname, '..');

// Serve static files from parent frontend directory
app.use(express.static(FRONTEND_DIR));

// Default route serves the cleaner spatial dashboard interface
app.get('/', (req, res) => {
    res.sendFile(FRONTEND_FILE);
});

// Health check & telemetry REST endpoints
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ONLINE',
        system: 'VehicleNet DSRC/C-V2X Mesh Server',
        activeNodes: nodes.size,
        connectedClients: clientSockets.size,
        localIp: localIp,
        port: PORT,
        uptimeSeconds: Math.floor(process.uptime())
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        serverIp: localIp,
        port: PORT,
        wsUrl: `ws://${localIp}:${PORT}/ws`,
        httpUrl: `http://${localIp}:${PORT}`,
        activeLaptops: Array.from(nodes.values()).filter(n => !n.isSimulated).length
    });
});

app.get('/api/nodes', (req, res) => {
    const activeNodes = [];
    nodes.forEach(n => {
        activeNodes.push({
            id: n.id,
            label: n.label,
            x: Math.round(n.x),
            y: Math.round(n.y),
            speed: n.speed,
            heading: n.heading,
            commRangeMeters: n.commRangeMeters,
            status: n.status,
            isSimulated: n.isSimulated
        });
    });
    res.json({ count: activeNodes.length, nodes: activeNodes });
});

// Create HTTP server wrapping Express app
const server = http.createServer(app);

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server, path: '/ws' });

// Handle WebSocket server error events
wss.on('error', (err) => {
    if (err.code !== 'EADDRINUSE') {
        console.error('[V2V WSS ERROR]', err);
    }
});

// In-Memory store for active vehicle nodes & socket handles
const nodes = new Map();
const clientSockets = new Map();

class VehicleNode {
    constructor(id, label, x, y, speed = 60, heading = 42, commRangeMeters = 300, isSimulated = false) {
        this.id = id;
        this.label = label;
        this.x = x; // Relative X coordinate in meters
        this.y = y; // Relative Y coordinate in meters
        this.speed = speed; // km/h
        this.heading = heading; // Degrees (0 = North, 90 = East)
        this.commRangeMeters = commRangeMeters;
        this.status = 'NORMAL';
        this.isSimulated = isSimulated;
        this.lastTxTime = 0;
    }

    updatePosition(dtSeconds = 1.2) {
        const speedMs = (this.speed / 3.6);
        const rad = (this.heading - 90) * (Math.PI / 180);
        this.x += speedMs * Math.cos(rad) * dtSeconds * 0.1;
        this.y += speedMs * Math.sin(rad) * dtSeconds * 0.1;
    }
}

// Ambient simulated vehicles array (empty by default so no fake sources appear without connected clients)
const simVehicles = [];
simVehicles.forEach(v => nodes.set(v.id, v));

function calcDistance(n1, n2) {
    return Math.hypot(n2.x - n1.x, n2.y - n1.y);
}

function calcRelativeBearing(sourceNode, targetNode) {
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
    let navHeading = (90 - angleDeg + 360) % 360;
    let relativeBearing = (navHeading - sourceNode.heading + 360) % 360;
    if (relativeBearing > 180) relativeBearing -= 360;
    return Math.round(relativeBearing);
}

// Preset positions for multi-laptop clients to appear separated on radar
const CLIENT_OFFSETS = [
    { x: 0, y: 0, label: 'Host Laptop' },
    { x: 45, y: 65, label: 'Peer Laptop 2' },
    { x: -55, y: 80, label: 'Peer Laptop 3' },
    { x: 70, y: -40, label: 'Peer Laptop 4' }
];

// Handle WebSocket connections for real-time V2V mesh protocol
wss.on('connection', (ws) => {
    let currentVehicleId = null;

    ws.on('message', (messageRaw) => {
        try {
            const data = JSON.parse(messageRaw.toString());

            switch (data.type) {
                case 'REGISTER': {
                    let assignedId = data.id || ('VN-' + Math.floor(1000 + Math.random() * 9000));
                    currentVehicleId = assignedId;

                    // Multi-laptop distinct positioning
                    const realClients = Array.from(nodes.values()).filter(n => !n.isSimulated);
                    const slotIndex = realClients.length;
                    const offsetConfig = CLIENT_OFFSETS[slotIndex % CLIENT_OFFSETS.length];

                    const defaultLabel = slotIndex === 0 ? 'Laptop 1 (Host)' : `Laptop ${slotIndex + 1}`;
                    const clientNode = new VehicleNode(
                        assignedId,
                        data.label || defaultLabel,
                        data.x !== undefined ? data.x : offsetConfig.x,
                        data.y !== undefined ? data.y : offsetConfig.y,
                        data.speed || 64,
                        data.heading || 42,
                        data.commRangeMeters || 300,
                        false
                    );

                    nodes.set(assignedId, clientNode);
                    clientSockets.set(assignedId, ws);

                    console.log(`[V2V MESH] Node Connected: ${assignedId} (${clientNode.label}) at pos (${clientNode.x}, ${clientNode.y})`);

                    ws.send(JSON.stringify({
                        type: 'REGISTERED',
                        id: assignedId,
                        serverIp: localIp,
                        port: PORT,
                        x: clientNode.x,
                        y: clientNode.y
                    }));
                    
                    // Broadcast updated peer lists to all clients
                    broadcastPeersUpdate();
                    break;
                }

                case 'POSITION_UPDATE': {
                    if (!currentVehicleId || !nodes.has(currentVehicleId)) return;
                    const node = nodes.get(currentVehicleId);
                    if (data.heading !== undefined) node.heading = data.heading;
                    if (data.speed !== undefined) node.speed = data.speed;
                    if (data.x !== undefined) node.x = data.x;
                    if (data.y !== undefined) node.y = data.y;
                    break;
                }

                case 'SET_RANGE': {
                    if (!currentVehicleId || !nodes.has(currentVehicleId)) return;
                    const node = nodes.get(currentVehicleId);
                    if (data.rangeMeters) {
                        node.commRangeMeters = data.rangeMeters;
                        console.log(`[V2V MESH] Node ${currentVehicleId} set comm radius: ${data.rangeMeters}m`);
                    }
                    break;
                }

                case 'COMM_SEND': {
                    if (!currentVehicleId || !nodes.has(currentVehicleId)) return;
                    const senderNode = nodes.get(currentVehicleId);
                    const now = Date.now();

                    // Cooldown anti-spam protection (3.5s per vehicle)
                    if (now - senderNode.lastTxTime < COOLDOWN_MS) {
                        ws.send(JSON.stringify({ type: 'COOLDOWN_ACTIVE' }));
                        return;
                    }

                    senderNode.lastTxTime = now;

                    const packet = {
                        id: 'TX-' + Math.floor(100000 + Math.random() * 900000),
                        senderId: currentVehicleId,
                        senderLabel: senderNode.label,
                        targetId: data.targetId || 'BROADCAST_ALL',
                        code: data.code || 'CUSTOM_MSG',
                        message: data.message || 'Telemetry Signal',
                        severity: data.severity || 'INFO',
                        timestamp: new Date().toLocaleTimeString()
                    };

                    ws.send(JSON.stringify({
                        type: 'COMM_SENT_ACK',
                        packet: { ...packet, direction: 'OUTBOUND' }
                    }));

                    if (packet.targetId === 'BROADCAST_ALL') {
                        nodes.forEach((targetNode, targetId) => {
                            if (targetId === currentVehicleId) return;

                            const dist = calcDistance(senderNode, targetNode);
                            if (dist <= senderNode.commRangeMeters) {
                                if (packet.severity === 'CRITICAL' || packet.severity === 'WARNING') {
                                    senderNode.status = packet.severity;
                                }

                                if (!targetNode.isSimulated && clientSockets.has(targetId)) {
                                    const targetWs = clientSockets.get(targetId);
                                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                                        targetWs.send(JSON.stringify({
                                            type: 'COMM_RECEIVE',
                                            packet: { ...packet, distance: Math.round(dist), direction: 'INBOUND' }
                                        }));
                                    }
                                }
                            }
                        });
                    } else {
                        const targetNode = nodes.get(packet.targetId);
                        if (targetNode) {
                            const dist = calcDistance(senderNode, targetNode);
                            if (dist <= senderNode.commRangeMeters) {
                                if (!targetNode.isSimulated && clientSockets.has(targetNode.id)) {
                                    const targetWs = clientSockets.get(targetNode.id);
                                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                                        targetWs.send(JSON.stringify({
                                            type: 'COMM_RECEIVE',
                                            packet: { ...packet, distance: Math.round(dist), direction: 'INBOUND' }
                                        }));
                                    }
                                }
                            } else {
                                ws.send(JSON.stringify({
                                    type: 'DELIVERY_FAILED',
                                    reason: `Target vehicle out of broadcast radius (${Math.round(dist)}m > ${senderNode.commRangeMeters}m)`,
                                    targetId: packet.targetId
                                }));
                            }
                        }
                    }
                    break;
                }
            }
        } catch (err) {
            console.error('[V2V MESH ERROR] Error parsing message:', err);
        }
    });

    ws.on('close', () => {
        if (currentVehicleId) {
            console.log(`[V2V MESH] Node Disconnected: ${currentVehicleId}`);
            nodes.delete(currentVehicleId);
            clientSockets.delete(currentVehicleId);
            broadcastPeersUpdate();
        }
    });
});

function broadcastPeersUpdate() {
    clientSockets.forEach((ws, clientId) => {
        sendPeersUpdate(clientId, ws);
    });
}

function sendPeersUpdate(clientId, clientWs) {
    const clientNode = nodes.get(clientId);
    if (!clientNode) return;

    const peerList = [];
    nodes.forEach((otherNode, otherId) => {
        if (otherId === clientId) return;

        const dist = calcDistance(clientNode, otherNode);
        if (dist <= clientNode.commRangeMeters) {
            peerList.push({
                id: otherNode.id,
                label: otherNode.label,
                distance: Math.round(dist),
                bearing: calcRelativeBearing(clientNode, otherNode),
                speed: otherNode.speed,
                status: otherNode.status,
                isRealClient: !otherNode.isSimulated
            });
        }
    });

    if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'PEERS_UPDATE', peers: peerList }));
    }
}

// Periodic Telemetry Loop (1.2s)
setInterval(() => {
    nodes.forEach((node) => {
        if (node.isSimulated) {
            node.updatePosition(1.2);
            node.x += (Math.random() - 0.49) * 0.8;
            node.y += (Math.random() - 0.49) * 0.8;
        }
    });

    broadcastPeersUpdate();
}, 1200);

const os = require('os');

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if ((alias.family === 'IPv4' || alias.family === 4) && !alias.internal) {
                candidates.push({
                    name: devName,
                    address: alias.address,
                    isVirtual: /wsl|hyper-v|virtualbox|vmware|vEthernet/i.test(devName)
                });
            }
        }
    }

    return (candidates.find(candidate => !candidate.isVirtual) || candidates[0])?.address || 'localhost';
}

const localIp = getLocalIpAddress();

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[ERROR] Port ${PORT} is already in use by another process.`);
        console.error(`[SUGGESTION] Set PORT environment variable or terminate the process using port ${PORT}.`);
    } else {
        console.error('[V2V SERVER ERROR]', err);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` VehicleNet Express & WebSocket Mesh Relay Server     `);
    console.log(` Local Access:      http://localhost:${PORT}`);
    console.log(` Multi-Laptop LAN:  http://${localIp}:${PORT}`);
    console.log(` WebSocket Mesh:    ws://${localIp}:${PORT}/ws`);
    console.log(`=======================================================`);
});


