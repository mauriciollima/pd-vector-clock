const config = require("./config.json")
const dgram = require('dgram');
const udpSocket = dgram.createSocket('udp4');

//Setup from from config.json
let multicastIp = config.multicastIp;
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
    //console.log('Incrementing local clock')
    localClock++;
    setLocalClock();
    //console.log('->localClock: ' + localClock)
}

function messageEvent(port, i) {
    setLocalClock();
    let strClocks = JSON.stringify(clocks)
    console.log('<=== ' + id + ' Sending message ' + strClocks + ' to: ' + port.substr(3, 3));
    const message = new Buffer.from(strClocks);
    udpSocket.send(message, 0, message.length, port, 'localhost', (err) => {

    });
}

function setLocalClock() {
    if (id === '0') {
        clocks.p0 = localClock
    }
    if (id === '1') {
        clocks.p1 = localClock
    }
    if (id === '2') {
        clocks.p2 = localClock
    }
}

function localEvent() {
    incrementLocalClock()
    console.log(id + ' Local event: ' + JSON.stringify(clocks));
}

function refreshClock(msg) {
    if (parseInt(msg.p0) > parseInt(clocks.p0) && id !== '0') {
        clocks.p0 = msg.p0
    }
    if (parseInt(msg.p1) > parseInt(clocks.p1) && id !== '1') {
        clocks.p1 = msg.p1
    }
    if (parseInt(msg.p2) > parseInt(clocks.p2) && id !== '2') {
        clocks.p2 = msg.p2
    }
}

async function start() {
    for (let i = 0; i < config.events; i++) {
        var random = Math.floor(Math.random() * 20);
        if (chance > random) {
            messageEvent(getRandomNodo(), i)
            await sleep(config.minDelay)
        } else {
            localEvent()
            await sleep(config.maxDelay)
        }
    }
    console.log('Final clock: ' + JSON.stringify(clocks))
    udpSocket.close();
}


//Socket listening start
udpSocket.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    udpSocket.close();
});

udpSocket.on('message', (msg, rinfo) => {
    console.log('===> ' + id + ` Got message: ${msg} from: ` + rinfo.port.toString().substr(3, 3));
    incrementLocalClock();
    refreshClock(JSON.parse(Buffer.from(msg)))
});

udpSocket.on('listening', () => {
    const address = udpSocket.address();
    console.log(config)
    console.log(`Socket listening ${address.address}:${address.port}`);
    listenMulticast()

});

udpSocket.bind(port);


//Multicast listening start
function listenMulticast() {
    var PORT = 41848;
    var MCAST_ADDR = multicastIp
    var dgram = require('dgram');
    var client = dgram.createSocket({type: 'udp4', reuseAddr: true})

    client.on('listening', function () {
        var address = client.address();
        console.log('Multicast listening ' + address.address + ":" + address.port);
        client.setBroadcast(true)
        client.setMulticastTTL(128);
        client.addMembership(MCAST_ADDR);
    });

    client.on('message', function (message, remote) {
        console.log('Multicast message from: ' + remote.address + ':' + remote.port + ' - ' + message);
        start();
    });
    client.bind(PORT);
}
