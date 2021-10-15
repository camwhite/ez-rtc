// client side example
import { EzRTC } from 'ez-rtc'
import io from 'socket.io-client'

class Peer extends EzRTC {
  constructor(opts) {
    super(opts)
  }
  async init() {
    await this.getLocalStream()
    this.socket.emit('join', this.makeOffer)
  }
}

const socket = io.connect('localhost:1337')
const peer = new Peer({
  ...someConfig,
  socket // a connected socket
})

;(async () => {
  await peer.init()
  peer.on('stream', data => {
    this.streams.push(data)
  })
})()

// server side example
import http from 'http'
import * as io from 'socket.io'
import { signalling } from 'ez-rtc'

const server = http.createServer()
const sockets = io(server)

sockets.on('connection', socket => {
  const signal = signalling(socket)
  signal.on('data', peer => {
    console.log(`Peer ${peer} connected`)
  })
})
