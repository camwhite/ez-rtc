// client side example
import { EzRTC } from 'ez-rtc'
import io from 'socket.io-client'

class Peer extends EzRTC {
  constructor(opts) {
    super(opts)
  }
  // Some kind of exchange is necessary to init the
  // local stream and make the offer the peer(s)
  // this is the most basic example...
  async exchange(peer) {
    await this.getLocalStream()
    try {
      await this.makeOffer(peer)
    } catch (err) {
      console.error(err)
    }
  }
}

const socket = io.connect('localhost:1337')
const peer = new Peer({
  ...someConfig,
  socket // a connected socket is optional
})

;(async () => {
  await peer.exchange(this.channel.user_id)
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
  socket.join(socket.user.id) // room from the from db
  const signal = signalling(socket, {
    room: socket.user.id
  })
  signal.on('peer', data => {
    console.log(`Peer id is: ${data.peer.id}`)
  })
})
