const { WebSocket } = require('ws');

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:8080/ws';

console.log('=======================================================');
console.log('   VehicleNet 2-Laptop Live Communication Simulation   ');
console.log(`   Connecting to Server: ${SERVER_URL}`);
console.log('=======================================================\n');

// Laptop 1 Client (Host/Lead Vehicle)
const laptop1 = new WebSocket(SERVER_URL);

// Laptop 2 Client (Peer/Following Vehicle)
const laptop2 = new WebSocket(SERVER_URL);

let laptop1Id = 'VN-LAPTOP-1';
let laptop2Id = 'VN-LAPTOP-2';

laptop1.on('open', () => {
    console.log('🟢 [LAPTOP 1] Connected to V2V Mesh Server.');
    laptop1.send(JSON.stringify({
        type: 'REGISTER',
        id: laptop1Id,
        label: 'Laptop 1 (Lead Vehicle)',
        speed: 70,
        heading: 42,
        commRangeMeters: 300,
        x: 0,
        y: 0
    }));
});

laptop2.on('open', () => {
    console.log('🟢 [LAPTOP 2] Connected to V2V Mesh Server.');
    laptop2.send(JSON.stringify({
        type: 'REGISTER',
        id: laptop2Id,
        label: 'Laptop 2 (Following Vehicle)',
        speed: 75,
        heading: 40,
        commRangeMeters: 300,
        x: 45,
        y: 60
    }));
});

laptop1.on('message', (raw) => {
    const data = JSON.parse(raw.toString());
    if (data.type === 'REGISTERED') {
        console.log(`✅ [LAPTOP 1] Registered on mesh as ID: ${data.id}`);
    } else if (data.type === 'COMM_RECEIVE') {
        const p = data.packet;
        console.log(`\n📩 [LAPTOP 1] INBOUND SIGNAL RECEIVED from ${p.senderId} (${p.distance}m away):`);
        console.log(`   > Message:  "${p.message}"`);
        console.log(`   > Severity: [${p.severity}]`);
        console.log(`   > Time:     ${p.timestamp}`);
    } else if (data.type === 'PEERS_UPDATE') {
        console.log(`📡 [LAPTOP 1 Radar Update] ${data.peers.length} active peer(s) in range.`);
    }
});

laptop2.on('message', (raw) => {
    const data = JSON.parse(raw.toString());
    if (data.type === 'REGISTERED') {
        console.log(`✅ [LAPTOP 2] Registered on mesh as ID: ${data.id}`);
        
        // After registering, Laptop 2 sends a message to Laptop 1
        setTimeout(() => {
            console.log('\n-------------------------------------------------------');
            console.log('📤 [LAPTOP 2] Transmitting message to Laptop 1...');
            laptop2.send(JSON.stringify({
                type: 'COMM_SEND',
                targetId: laptop1Id,
                code: 'CUSTOM_MSG',
                message: 'Hello Laptop 1! Overtaking on left lane.',
                severity: 'WARNING'
            }));
        }, 1500);

    } else if (data.type === 'COMM_RECEIVE') {
        const p = data.packet;
        console.log(`\n📩 [LAPTOP 2] INBOUND SIGNAL RECEIVED from ${p.senderId} (${p.distance}m away):`);
        console.log(`   > Message:  "${p.message}"`);
        console.log(`   > Severity: [${p.severity}]`);
        console.log(`   > Time:     ${p.timestamp}`);

        // Laptop 2 replies to Laptop 1 after receiving a message
        if (p.senderId === laptop1Id && p.code === 'EMERGENCY_BRAKE') {
            setTimeout(() => {
                console.log('\n-------------------------------------------------------');
                console.log('📤 [LAPTOP 2] Sending Acknowledgment to Laptop 1...');
                laptop2.send(JSON.stringify({
                    type: 'COMM_SEND',
                    targetId: laptop1Id,
                    code: 'ACK_SIGNAL',
                    message: 'Roger Laptop 1! Hard braking acknowledged, holding safe distance.',
                    severity: 'INFO'
                }));
            }, 1000);
        }
    } else if (data.type === 'PEERS_UPDATE') {
        console.log(`📡 [LAPTOP 2 Radar Update] ${data.peers.length} active peer(s) in range.`);
    }
});

// Trigger a transmission sequence after both connected
setTimeout(() => {
    console.log('\n-------------------------------------------------------');
    console.log('🚨 [LAPTOP 1] Broadcasting Emergency Brake Alert...');
    laptop1.send(JSON.stringify({
        type: 'COMM_SEND',
        targetId: 'BROADCAST_ALL',
        code: 'EMERGENCY_BRAKE',
        message: 'EMERGENCY BRAKE APPLIED: Sudden debris ahead!',
        severity: 'CRITICAL'
    }));
}, 4000);

// Auto-cleanup after demonstration
setTimeout(() => {
    console.log('\n=======================================================');
    console.log('   Simulation Complete - Both Laptops Successfully   ');
    console.log('   Exchanged Messages over WebSocket Mesh Relay.     ');
    console.log('=======================================================\n');
    laptop1.close();
    laptop2.close();
    process.exit(0);
}, 8000);
