import { Readable } from 'stream'
import { Socket } from 'socket.io'
import debug from 'debug'
import { signalling } from '.'

const log = debug('ez-rtc')
const readable = new Readable({
  read() {} // noop
})

export default function (socket: Socket): Readable {
  socket.on('join', data => {
    socket.broadcast.emit('join', data)
    log(`${data.id} joined`)
  })
  socket.on('leave', data => {
    socket.broadcast.emit('leave', data)
    log(`${data.id} left`)
  })
  socket.on('signal', data => {
    socket.to(data.to).emit(data)
    if (data.type === 'sdp-answer') {
      readable.push(data.by)
    }
    log(`${data.by} signalled a ${data.type} to peer ${data.to}`)
  })

  return readable
}