import io, { Socket } from 'socket.io-client'
import { EventEmitter } from 'events'
import debug from 'debug'

const log = debug('ez-rtc')

interface Options {
  media: object
  socket: Socket
  dataChannel: boolean
  iceServers: RTCConfiguration
}

interface Signal {
  by: string
  to: string
  type: string
  sdp: RTCSessionDescription
  ice: RTCIceCandidate
}

class EzRTC extends EventEmitter {
  opts: Options
  socket: Socket
  localStream: MediaStream
  peerConnections: Map<string, RTCPeerConnection>
  sendChannels: Map<string, RTCDataChannel>

  constructor(opts: Options) {
    super()
    this.opts = opts
    if (!opts.socket) {
      this.socket = io.connect()
    } else {
      this.socket = opts.socket
    }

    this.peerConnections = new Map()
    this.sendChannels = new Map()
  }
  async getLocalStream(): Promise<MediaStream | undefined> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(
        this.opts.media
      )
    } catch (err) {
      this.handleErrors(err)
    }

    return this.localStream
  }
  async makeOffer(id: string): Promise<void> {
    const pc = await this.getPeerConnection(id)

    const sdp = await pc.createOffer()
    await pc.setLocalDescription(sdp)

    this.socket.emit('signal', {
      type: 'sdp-offer',
      by: this.socket.id,
      to: id,
      sdp
    })
  }
  async getPeerConnection(id: string): Promise<RTCPeerConnection> {
    const active = this.peerConnections.get(id)
    if (active) {
      return active
    }

    const servers = this.opts.iceServers || {
      iceServers: [
        { urls: 'stun:stun.ekiga.net' },
        { urls: 'stun:stun.fwdnet.net' },
        { urls: 'stun:stun.ideasip.com' },
        { urls: 'stun:stun.rixtelecom.se' }
      ]
    }
    const pc = new RTCPeerConnection(servers)

    await this.getLocalStream()

    this.localStream
      .getTracks()
      .forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, this.localStream)
      })

    pc.onicecandidate = evt => {
      if (evt.candidate) {
        this.socket.emit('signal', {
          to: id,
          by: this.socket.id,
          ice: evt.candidate,
          type: 'ice'
        })
      }
    }
    pc.ontrack = ({ streams }) => {
      this.emit('streams', streams)
    }

    if (this.opts.dataChannel) {
      pc.ondatachannel = ({ channel }) => {
        channel.onmessage = ({ data }) => {
          try {
            data = JSON.parse(data)
            this.emit('data', data)
          } catch (err) {
            this.handleErrors(err)
          }
        }
      }
      this.sendChannels.set(
        id,
        pc.createDataChannel('Send Channel', {
          ordered: false
          //reliable: false
        })
      )
    }

    this.peerConnections.set(id, pc)

    return pc
  }
  async handleSignal(signal: Signal) {
    const pc = await this.getPeerConnection(signal.by)
    switch (signal.type) {
      case 'sdp-offer':
        log('Setting remote description by offer')
        await pc.setRemoteDescription(
          new RTCSessionDescription(signal.sdp)
        )
        const sdp = await pc.createAnswer()
        await pc.setLocalDescription(sdp)
        this.socket.emit('signal', {
          by: signal.to,
          to: signal.by,
          sdp: sdp,
          type: 'sdp-answer'
        })
        break
      case 'sdp-answer':
        log('Setting remote description by answer')
        await pc.setRemoteDescription(
          new RTCSessionDescription(signal.sdp)
        )
        break
      case 'ice':
        if (signal.ice) {
          log('Adding ice candidates')
          pc.addIceCandidate(new RTCIceCandidate(signal.ice))
        }
        break
    }
  }
  handleErrors(err: any) {
    log(err)
  }
}

export default EzRTC
