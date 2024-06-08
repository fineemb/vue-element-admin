import store from '../store'
import eventBus from '../utils/eventBus.js'

/**
 * 这里只管 socket 自己的，不要去关心业务逻辑。
 * 只管接受服务端数据发送给外边和接受外边数据发送给服务端，至于是否连上了，外边无需关心，至于外边是否侦听了这里也无需关心
 */

const client = {
  connected: false,
  jumpTimer: null,
  heartJumping: true,
  jumpInterval: 5000,
  reconnectTimes: 0,
  wss: null,
  msgQueue: [],
  trace(value) {
    const { cmd, msg, data } = value
    const msgData = !data ? '' : (typeof data === 'object') ? JSON.stringify(data) : data
    console.log(cmd, msg, msgData)
  },
  disconnect() {
    if (this.wss) {
      this.wss.close()
      this.wss = null
    }
    this.connected = false
    if (this.jumpTimer) {
      clearInterval(this.jumpTimer)
    }
    this.heartJumping = true
    this.reconnectTimes = 0
    this.msgQueue = []
  },
  connect() {
    const token = store.getters.token
    console.log(token)
    if (!token) {
      this.trace({ cmd: 'connect', msg: '请先登录' })
      return
    }

    if (this.connected) {
      this.trace({ cmd: 'connect', msg: '已经连接' })
      return
    }

    const url = `${process.env.VUE_APP_WS_API}/ws/request?token=${token}`
    this.trace({ cmd: 'connect', msg: `连接 ${url}` })
    this.wss = new WebSocket(url)
    this.wss.onopen = (res) => {
      this.trace({ cmd: 'onopen', msg: `onopen` })
      this.connected = true
      this.reconnectTimes = 0
      this.msgQueue = []
      this.heartJumping = true

      // 看自己需要
      this.toSocket({ cmd: 'reply' })

      for (const item of this.msgQueue) {
        this.toSocket(item)
      }
      this.jumpHeart()

      eventBus.$off('sendMsg', this.sendMsg.bind(this))
      eventBus.$on('sendMsg', this.sendMsg.bind(this))
    }

    this.wss.onclose = (res) => {
      this.trace({ cmd: 'onclose', msg: `onclose`, data: res })
      this.connected = false
    }

    this.wss.onerror = (error) => {
      this.trace({ cmd: 'error', msg: `error`, data: error })
    }

    this.wss.onmessage = (res) => {
      // this.trace({ cmd: 'onmessage', msg: `onmessage`, data: res.data })
      let data = res.data
      if (!data) {
        return
      }
      data = JSON.parse(data)
      if (data.type === 'heart') {
        this.heartJumping = true
        return
      }
      eventBus.$emit('message', data)
    }
  },
  reconnect(force = false) {
    this.trace({ cmd: 'reconnect', msg: `reconnect`, data: { force, reconnectTimes: this.reconnectTimes }})
    if (!force && this.reconnectTimes > 10) {
      return
    }
    this.disconnect()
    this.connect()
    this.reconnectTimes++
  },
  jumpHeart() {
    if (this.jumpTimer) {
      clearInterval(this.jumpTimer)
      this.jumpTimer = null
    }

    this.jumpTimer = setInterval(() => {
      if (!this.heartJumping) {
        this.connected = false
        this.reconnect()
        return
      }

      this.heartJumping = false

      this.toSocket({ cmd: 'heart' })
    }, this.jumpInterval)
  },
  toSocket(value) {
    let data = value
    if (typeof value === 'object') {
      // console.log('socket:', store.state.user.env)
      value.env = store.state.user.env
      data = JSON.stringify(value)
    }
    this.wss.send(data)
  },
  sendMsg(value) {
    if (!this.connected) {
      this.msgQueue.push(value)
      this.reconnect(true)
    } else {
      this.toSocket(value)
    }
  }
}
export default client
