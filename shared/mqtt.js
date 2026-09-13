
// WebSocket connection used for V2V communication.
//
// The backend / MQTT WebSocket broker is expected
// to be available at ws://localhost:9001.

const MQTT_URL = "ws://localhost:9001";

let socket = null;
let connected = false;

const subscriptions = new Map();


// Connect to the MQTT WebSocket endpoint
export function connect() {
    return new Promise((resolve, reject) => {

        if (socket && socket.readyState === WebSocket.OPEN) {
            resolve(socket);
            return;
        }

        socket = new WebSocket(MQTT_URL);

        socket.onopen = () => {
            connected = true;

            console.log("MQTT WebSocket connected:", MQTT_URL);

            resolve(socket);
        };

        socket.onmessage = (event) => {
            handleMessage(event.data);
        };

        socket.onerror = (error) => {
            console.error("MQTT WebSocket error:", error);

            if (!connected) {
                reject(error);
            }
        };

        socket.onclose = () => {
            connected = false;

            console.log("MQTT WebSocket disconnected");
        };
    });
}


// Subscribe to a topic
export function subscribe(topic, callback) {
    if (!subscriptions.has(topic)) {
        subscriptions.set(topic, []);
    }

    subscriptions.get(topic).push(callback);

    console.log("Subscribed to:", topic);
}


// Publish a message to a topic
export function publish(topic, message) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("MQTT is not connected. Cannot publish:", topic);
        return false;
    }

    const packet = JSON.stringify({
        topic: topic,
        payload: message
    });

    socket.send(packet);

    console.log("Published:", topic, message);

    return true;
}


// Handle incoming messages
function handleMessage(data) {
    let packet;

    try {
        packet = JSON.parse(data);
    } catch (error) {
        console.warn("Received non-JSON MQTT message:", data);
        return;
    }

    const topic = packet.topic;
    const payload = packet.payload;

    if (!topic) {
        console.warn("Received message without topic:", packet);
        return;
    }

    const callbacks = subscriptions.get(topic) || [];

    callbacks.forEach((callback) => {
        callback(payload);
    });
}


// Check connection status
export function isConnected() {
    return connected;
}


// Disconnect from MQTT
export function disconnect() {
    if (socket) {
        socket.close();
        socket = null;
    }

    connected = false;
}