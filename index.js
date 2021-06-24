const config = require("./config.json")
const dgram = require('dgram');
const udpSocket = dgram.createSocket('udp4');

// Change the number to run another process
// Available = [0,1,2]
let process = 0;

let chance = config[process].chance;
let port = config[process].port;
let id = config[process].id;
let nodos = config[process].nodos;

let localClock = 0;

let clocks = {"p0": 0, "p1": 0, "p2": 0}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomNodo() {
    let random = Math.floor(Math.random() * nodos.length);
    return nodos[random];
}

function incrementLocalClock() {
    console.log('incrementing local clock')
    localClock++;
    if (id === '0') {
        clocks.p0 = localClock
    }
    if (id === '1') {
        clocks.p1 = localClock
    }
    if (id === '2') {
        clocks.p2 = localClock
    }
    console.log('localClock: ' + localClock)
}

function messageEvent(port, i) {
    console.log('Sending message to: ' + port);
    incrementLocalClock()
    if (id === '0') {
        clocks.p0 = localClock
    }
    if (id === '1') {
        clocks.p1 = localClock
    }
    if (id === '2') {
        clocks.p2 = localClock
    }

    const message = new Buffer.from(JSON.stringify(clocks));
    udpSocket.send(message, 0, message.length, port, 'localhost', (err) => {

    });
}

function localEvent() {
    incrementLocalClock()
    console.log('local event')
}

function refreshClock(msg) {
    console.log('refreshing clock')
    if (parseInt(msg.p0) > parseInt(clocks.p0) && id !== '0') {
        console.log('p0 refresh')
        clocks.p0 = msg.p0
    }
    if (parseInt(msg.p1) > parseInt(clocks.p1) && id !== '1') {
        console.log('p1 refresh')
        clocks.p1 = msg.p1
    }
    if (parseInt(msg.p2) > parseInt(clocks.p2) && id !== '2') {
        console.log('p2 refresh')
        clocks.p2 = msg.p2
    }
    console.log('local clock: ' + JSON.stringify(clocks))
}

async function start() {
    for (let i = 0; i < config.events; i++) {
        var random = Math.floor(Math.random() * 20);
        if (chance > random) {
            messageEvent(getRandomNodo(), i)
            await sleep(3234)
        } else {
            localEvent();
            await sleep(3123)
        }
    }
    console.log(JSON.stringify(clocks))
}

udpSocket.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    udpSocket.close();
});

udpSocket.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    incrementLocalClock();
    refreshClock(JSON.parse(Buffer.from(msg)))
});

udpSocket.on('listening', () => {
    const address = udpSocket.address();
    console.log(config[process])
    console.log(`server listening ${address.address}:${address.port}`);
    start();
});

udpSocket.bind(port);
