const config = require("./config.json")
const dgram = require('dgram');
const udpSocket = dgram.createSocket('udp4');

let localIp = config.localIp
let chance = config.chance;
let port = config.port;
let id = config.id;
let nodos = config.nodos;

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
            await sleep(3321)
        } else {
            localEvent()
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
    console.log(config)
    console.log(`server listening ${address.address}:${address.port}`);
    listenMulticast()

});

udpSocket.bind(port);

function listenMulticast() {
    //Multicast Client receiving sent messages
    var PORT = 41848;
    var MCAST_ADDR = config; //same mcast address as Server
    var HOST = '192.168.15.24'; //this is your own IP
    var dgram = require('dgram');
    var client = dgram.createSocket({type: 'udp4', reuseAddr: true})

    client.on('listening', function () {
        var address = client.address();
        console.log('UDP Client listening on ' + address.address + ":" + address.port);
        client.setBroadcast(true)
        client.setMulticastTTL(128);
        client.addMembership(MCAST_ADDR);
    });

    client.on('message', function (message, remote) {
        console.log('MCast Msg: From: ' + remote.address + ':' + remote.port + ' - ' + message);
        start();
    });

    client.bind(PORT, HOST);
}


