// client side example
import { EzRTC } from 'ez-rtc'
import io from 'socket.io-client'

class Peer extends EzRTC {
  constructor(opts) {
    super(opts)
  }
  async init() {
    await this.getLocalStream()
  }
}

const socket = io.connect('localhost:1337')
const peer = new Peer({
  ...someConfig,
  socket // a connected socket
})

;(async () => {
  await peer.init()
  await peer.makeOffer(this.channel.user_id)
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

sockets.on('connect', socket => {
  const signal = signalling(socket)
  signal.on('data', peer => {
    console.log(`Peer ${peer} connected`)
  })
})
