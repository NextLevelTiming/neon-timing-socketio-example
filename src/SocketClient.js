import {io} from "socket.io-client";
import debounce from "lodash.debounce";

class SocketClient {
    constructor() {
        this.socket = null;
        this.apiKey = this.getApiKey();
        this.hostSupportedEvents = [];
        this.clientSupportedEvents = ['race','flag'];
        this.did = window.localStorage.getItem('nt-did');
        if (!this.did) {
            this.did = Math.random().toString(36).slice(2);
            window.localStorage.setItem('nt-did', this.did);
        }

        this.debounceAttemptConnection = debounce(() => {
            this.attemptConnection();
        }, 2000);

        this.attemptConnection();
    }

    attemptConnection() {
        if (this.socket) {
            console.log('Stopping previous connection attempt');
            this.socket.disconnect();
        }
        console.log('Connecting to socket');
        this.socket = io('ws://localhost:3001/neon-timing?token=' + this.apiKey, {
            transports: ['websocket'],
            upgrade: false,
            reconnectionDelayMax: 2000
        });
        this.socket.on("connect", () => {
            const engine = this.socket.io.engine;
            this.hostSupportedEvents = [];
            console.log('Connection opened');

            engine.on("close", (reason) => {
                this.hostSupportedEvents = [];
                console.log('Connection closed');
            });
        });
        this.socket.on('host_event', message => {
            console.log('received event from host', message, JSON.stringify(message).length);
            if (message.cmd === 'handshake_init') {
                if (message.protocol !== 'NT1') {
                    console.log('Protocol is not valid.')
                    this.socket.disconnect();
                }
                this.hostSupportedEvents = message.events;
                this.sendClientEvent({
                    cmd: 'handshake_ack',
                    events: this.clientSupportedEvents,
                    device: 'PC Demo',
                    init_time: message.time
                });
            }
        });
    }

    setApiKey(apiKey) {
        localStorage.setItem('nt-api-key', apiKey);
        this.apiKey = apiKey;
        this.debounceAttemptConnection();
    }

    getApiKey() {
        return localStorage.getItem('nt-api-key') ?? '';
    }

    sendClientEvent(event) {
        if (!this.socket || !this.socket.connected) {
            console.log('socket is not connected, cannot send message');
            return;
        }
        if (event.evt && !this.hostSupportedEvents.includes(event.evt)) {
            console.log('Host does not support ' + event.evt + ' events');
            return;
        }
        const data = {
            ...event,
            time: Date.now(),
            protocol: 'NT1',
            did: this.did
        };
        console.log('sending client event', data, JSON.stringify(event).length);
        this.socket.emit('client_event', data);
    }
}

export default new SocketClient();
