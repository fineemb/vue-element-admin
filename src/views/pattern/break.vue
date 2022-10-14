<template>
  <div class="app-container">
    <el-row :gutter="10">
      <el-col :xs="24" :sm="17" :md="18" :lg="19" :xl="20">
        <div class="filter-container">
          <el-select v-model="mac" clearable placeholder="选择机器" class="filter-item" @change="selectMachine">
            <el-option v-for="item in machines" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button @click="clearBreak">清零</el-button>
          <el-button-group>
            <el-button icon="el-icon-zoom-in" circle data-type="in" @click="setZoom" />
            <el-button icon="el-icon-zoom-out" circle data-type="out" @click="setZoom" />
            <el-button icon="el-icon-full-screen" circle data-type="full" @click="setZoom" />
            <el-button icon="el-icon-arrow-left" circle data-type="left" @click="play" @mousedown.native="moveStart" @mouseup.native="moveStop" />
            <el-button icon="el-icon-arrow-right" circle data-type="right" @click="play" @mousedown.native="moveStart" @mouseup.native="moveStop" />
          </el-button-group>
          <div style="font-size: 14px;line-height: 2.5;">{{ filename }}: {{ state }} - {{ curStitch }}/{{ patternStitch }} {{ breakData.length>0?'断线'+breakData.length+'次':'' }}</div>
          <canvas id="canvas" ref="canvas" class="dstViewa" @mousedown.native="moveStart" @mouseup.native="moveStop">这里是看花样预览的</canvas>
        </div>
      </el-col>
      <el-col :xs="24" :sm="7" :md="6" :lg="5" :xl="4">
        <el-table :data="breakData" style="width: 100%" height="700" highlight-current-row @cell-click="setHighLight">
          <el-table-column prop="s" label="位置" width="120" />
          <el-table-column prop="c" label="色序" width="120" :filters="colorFilters" :filter-method="filterHandler" />
        </el-table>
      </el-col>
    </el-row>

  </div>
</template>

<script>
// import axios from 'axios'
import eventBus from '../../utils/eventBus'
import { getUserInfo, getDstFile } from '@/api/user'
import waves from '@/directive/waves' // waves directive
var canvas = null
var context = null
let canvasHeight = 145
let canvasWidht = 290
var dragOffset = {}
var mouseIsDown = false

export default {
  name: 'UpdataPattern',
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      machine: '',
      mac: '',
      filename: '',
      file: null,
      patternStitch: 0,
      curStitch: 0,
      highLight: 0,
      offsetx: 0,
      offsety: 0,
      zoom: 1,
      stitchesFlag: 2300,
      colors: ['blue', 'red', 'black', 'yellow', 'purple', 'lime', 'navy', 'green', 'orange', 'brown'],
      users: [],
      breakPot: [],
      stitchs: [],
      state: '',
      patternBreak: [],
      breakData: [],
      colorFilters: [],
      canvasHeight: 145,
      canvasWidht: 290,
      canvasOffset: { x: 0, y: 0 },
      reasons: [{
        'value': 1,
        'label': '完成刺绣'
      }, {
        'value': 2,
        'label': '用户登出'
      }, {
        'value': 3,
        'label': '解除刺绣'
      }, {
        'value': 4,
        'label': '返回原点'
      }, {
        'value': 5,
        'label': '清空累计'
      }, {
        'value': 8,
        'label': '交班打卡'
      }],
      machines: [{
        value: '1281909412AA',
        label: '01号'
      }, {
        value: '1282404669AA',
        label: '02号'
      }, {
        value: '1282404744AA',
        label: '03号'
      }, {
        value: '1281909392AA',
        label: '04号'
      }, {
        value: '1282404761AA',
        label: '05号'
      }, {
        value: '1281909414AA',
        label: '06号'
      }, {
        value: '1281909398AA',
        label: '07号'
      }, {
        value: '1282404640AA',
        label: '08号'
      }, {
        value: '1282404672AA',
        label: '09号'
      }, {
        value: '1281909385AA',
        label: '10号'
      }, {
        value: '1281905521AA',
        label: '11号'
      }, {
        value: '1281905538AA',
        label: '12号'
      }, {
        value: '1281905287AA',
        label: '13号'
      }, {
        value: '1281909382AA',
        label: '14号'
      }, {
        value: '1281909405AA',
        label: '15号'
      }, {
        value: '1282404633AA',
        label: '16号'
      }, {
        value: '1282001535AA',
        label: '打样机'
      }],
      downloadLoading: false
    }
  },
  mounted() {
    const _this = this
    eventBus.$on('message', this.message)
    canvas = document.getElementById('canvas')
    canvas.onmousedown = function(e) {
      console.log(e)
      mouseIsDown = true
      dragOffset.x = e.x
      dragOffset.y = e.y
    }
    canvas.onmouseup = function(e) {
      console.log(e)
      _this.offsetx += _this.canvasOffset.x
      _this.offsety += _this.canvasOffset.y
      _this.dstCanvas(_this.curStitch)
      // if (mouseIsDown) mouseClick(e)
      mouseIsDown = false
    }

    canvas.onmousemove = function(e) {
      if (!mouseIsDown) return
      _this.canvasOffset.x = e.x - dragOffset.x
      _this.canvasOffset.y = e.y - dragOffset.y
      console.log(_this.canvasOffset.x, _this.canvasOffset.y)
      return false
    }
    context = canvas.getContext('2d')
    this.$nextTick(() => {
      canvasWidht = this.$refs.canvas.offsetWidth
      canvasHeight = this.$refs.canvas.offsetHeight
    })
  },
  beforeDestroy() {
    eventBus.$off('message', this.message)
  },
  created() {
    this.getUser()
  },
  methods: {
    getUser() {
      getUserInfo().then(response => {
        // console.log(response)
        this.users = response.data
      })
    },
    selectMachine() {
      this.$message({ message: '开始等待刷新数据', type: 'info', duration: 0 })
    },
    handleSuccess(response, file, fileList) {
      console.log(response)
      if (response.reason) {
        this.$message.error('上传失败：' + response.reason)
      } else {
        this.$message('版带上传成功')
      }
    },
    clearBreak(res) {
      console.log(res)
      this.breakData = []
      eventBus.$emit('sendMsg', { 'cmd': 'clearBreak', data: {
        mac: this.mac,
        filename: this.filename
      }})
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
    },
    setHighLight(row, column, cell, event) {
      // console.log(row.s)
      this.highLight = row.s
      // this.stitchesFlag = row.s
      this.dstCanvas(this.curStitch)
    },
    setZoom(e) {
      // console.log(e.currentTarget.dataset.type)
      const type = e.currentTarget.dataset.type
      if (type === 'in') {
        this.zoom = this.zoom * 2
      }
      if (type === 'out') {
        this.zoom = this.zoom * 0.5
      }
      if (type === 'full') {
        this.zoom = Math.min((canvasWidht - 20) / this.designInfo.width, (canvasHeight - 20) / this.designInfo.height)
        this.offsetx = this.designInfo.width * this.zoom < canvasWidht ? (canvasWidht - this.designInfo.width * this.zoom) / 2 : 0
        this.offsety = this.designInfo.height * this.zoom < canvasHeight ? (canvasHeight - this.designInfo.height * this.zoom) / 2 : 0
      }
      this.dstCanvas(this.curStitch)
    },
    play(e) {
      const type = e.currentTarget.dataset.type
      if (type === 'left') {
        if (this.stitchesFlag > 0) this.stitchesFlag--
        console.log(this.stitchesFlag)
        this.dstCanvas(this.curStitch)
      }
      if (type === 'right') {
        if (this.stitchesFlag < this.stitchs.length) this.stitchesFlag++
        console.log(this.stitchesFlag)
        this.dstCanvas(this.curStitch)
      }
    },
    // 持续移动
    moveStart(e) {
      const type = e.currentTarget.dataset.type
      const _this = this
      this.timer && this.moveStop()
      this.timer = setInterval(() => {
        if (type === 'left') {
          if (_this.stitchesFlag > 0) _this.stitchesFlag--
        }
        if (type === 'right') {
          if (_this.stitchesFlag < _this.stitchs.length) _this.stitchesFlag++
        }
        _this.dstCanvas(_this.curStitch)
        // console.log(_this.stitchesFlag)
      }, 0)
    },
    // 停止移动
    moveStop() {
      clearInterval(this.timer)
    },

    message(res) {
      // console.log(res)
      if (res.type === 'userInfo') {
        const icon = this.users.find(e => e.userId === res.data.user.userId).avatarUrl
        const machineIndex = this.machines.findIndex(e => e.value === res.data.mac)
        const md = this.machines[machineIndex]
        md['userIcon'] = icon
        this.machines.splice(machineIndex, 1, md)
      }
      if (res.type === 'patternBreak') {
        this.patternBreak = res.data
        this.loadBreak()
      }
      if (res.type === 'state' && res.data.mac === this.mac) {
        // console.log(res)
        const filename = res.data.pattern.patternName
        // const curStitch = res.data.pattern.curStitch
        const patternStitch = res.data.pattern.patternStitch
        const position = res.data.machineState.position
        const type = res.data.machineState.type
        this.state = res.data.machineState.state + ' (' + res.data.machineState.reason + ')'
        this.patternBreak = res.data.patternBreak
        this.patternStitch = patternStitch
        this.position = position
        this.type = type
        if (filename && this.filename !== filename) {
          this.$message.closeAll()
          this.$message({ message: '开始下载文件', type: 'info', duration: 0 })
          // 刷新版带
          getDstFile({ file: filename, mac: res.data.mac }).then(response => {
            this.$message.closeAll()
            this.$message({ message: '文件下载成功，开始绘制', type: 'info', duration: 0 })
            this.filename = response.filename
            this.file = response.data.data
            this.loadBreak()
            this.dstRead(response.data.data)
            this.dstCanvas(res.data.pattern.curStitch)
          })
        }
        if (this.filename && this.curStitch !== res.data.pattern.curStitch) {
          this.dstCanvas(res.data.pattern.curStitch)
          this.curStitch = res.data.pattern.curStitch
          this.state = res.data.machineState.state + ' (' + res.data.machineState.reason + ')'
        }
      }
    },
    loadBreak: function() {
      const patternBreak = this.patternBreak[this.filename]
      const Break = []
      if (patternBreak) {
        for (var j = 0; j < patternBreak.length; j++) {
          if (patternBreak[j].mac === this.mac) {
            Break.push(patternBreak[j].curStitch)
          }
        }
      }
      this.breakPot = Break
    },
    dstRead: function(data) {
      const uint8 = new Uint8Array(data)
      const head = String.fromCharCode.apply(null, uint8.slice(0, 512))
      const headinfo = /LA:(.*)\rST:(.*)\rCO:(.*)\r\+X:(.*)\r-X:(.*)\r\+Y:(.*)\r-Y:(.*)\rAX:(.*)\rAY:(.*)\r[(MX:)||(TP:)](.*)/g.exec(head)
      const stitchesData = uint8.slice(512, uint8.length)
      let flag = 0
      let color = 0
      let onestitle = []
      const stitchs = []
      let designInfo = {}
      if (headinfo.length < 11) {
        this.$message({ message: '文件是坏的', type: 'error' })
        // 文件坏的
      } else {
        designInfo = {
          stitches: headinfo[2] * 1,
          colors: headinfo[3] * 1 + 1,
          width: headinfo[4] * 1 + headinfo[5] * 1,
          height: headinfo[6] * 1 + headinfo[7] * 1,
          start: { x: headinfo[5] * 1, y: headinfo[6] * 1 }
        }
      }
      this.designInfo = designInfo
      this.zoom = Math.min((canvasWidht - 20) / designInfo.width, (canvasHeight - 20) / designInfo.height)
      this.offsetx = this.designInfo.width * this.zoom < canvasWidht ? (canvasWidht - this.designInfo.width * this.zoom) / 2 : 0
      this.offsety = this.designInfo.height * this.zoom < canvasHeight ? (canvasHeight - this.designInfo.height * this.zoom) / 2 : 0
      for (const i in stitchesData) {
        let tx; let ty; let tz; let tl; let breakaaaa = false
        onestitle[flag] = stitchesData[i]
        flag++
        if (flag === 3) {
          tx = -9.0 * this.bit(onestitle[0], 3) + 9 * this.bit(onestitle[0], 2) - this.bit(onestitle[0], 1) + this.bit(onestitle[0], 0) -
                      27 * this.bit(onestitle[1], 3) + 27 * this.bit(onestitle[1], 2) - 3 * this.bit(onestitle[1], 1) + 3 * this.bit(onestitle[1], 0) -
                      81 * this.bit(onestitle[2], 3) + 81 * this.bit(onestitle[2], 2)

          ty = -9.0 * this.bit(onestitle[0], 4) + 9 * this.bit(onestitle[0], 5) - this.bit(onestitle[0], 6) + this.bit(onestitle[0], 7) -
                      27 * this.bit(onestitle[1], 4) + 27 * this.bit(onestitle[1], 5) - 3 * this.bit(onestitle[1], 6) + 3 * this.bit(onestitle[1], 7) -
                      81 * this.bit(onestitle[2], 4) + 81 * this.bit(onestitle[2], 5)
          ty = (ty < 0) ? Math.abs(ty) : ty - ty * 2

          tz = this.bit(onestitle[2], 6) + this.bit(onestitle[2], 7)
          const tf = onestitle[2]
          tl = Math.floor(Math.sqrt(Math.pow(Math.abs(tx), 2) + Math.pow(Math.abs(ty), 2)) * 10)
          if (tz === 2)color++
          for (var n = 0; n < this.breakPot.length; n++) {
            if (this.breakPot[n] === stitchs.length) {
              breakaaaa = true
            }
          }
          var s = { x: tx, y: ty, z: tz, c: color, f: tf, l: tl, b: breakaaaa }
          stitchs.push(s)
          flag = 0
          onestitle = []
        }
      }
      this.stitchs = stitchs
      this.stitchesFlag = stitchs.length
    },
    dstCanvas: function(curStitch) {
      console.time('time')
      const breakData = []
      const colors = this.colors
      const r = this.zoom
      const offsetx = this.offsetx
      const offsety = this.offsety
      let x = this.designInfo.start.x * r + offsetx
      let y = this.designInfo.start.y * r + offsety
      // const dpr = window.devicePixelRatio
      let nowcolor = -1
      let step = -1
      canvas.width = canvasWidht
      canvas.height = canvasHeight
      // context.scale(dpr, dpr)
      context.translate(0.5, 0.5)
      context.lineWidth = r
      context.strokeStyle = colors[((nowcolor + 1 > 9) ? 0 : nowcolor + 1)]
      context.miterLimit = 1
      context.beginPath()
      context.moveTo(x, y)
      for (var i = 0; i < this.stitchesFlag; i++) {
        if (this.stitchs[i].c !== step) {
          nowcolor++
          step++
          if (nowcolor > 9) { nowcolor = 0 }
          context.stroke()
          context.strokeStyle = i > curStitch ? 'gray' : colors[nowcolor]
          context.beginPath()
        }
        context.strokeStyle = colors[nowcolor]
        var zz = this.stitchs[i].z
        if (i > 0 && i < this.stitchs.length - 1) { zz = (this.stitchs[i].z === 0 && this.stitchs[i - 1].z !== 0) ? 1 : this.stitchs[i].z }

        if (zz) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }
        if (this.stitchs[i].b) {
          context.stroke()
          breakData.push({ 'c': this.stitchs[i].c + 1, 's': i })
          context.save()
          context.lineWidth = (i === this.highLight ? 16 : 8)
          context.strokeStyle = colors[nowcolor]
          context.beginPath()
          context.globalAlpha = (i === this.highLight ? 1 : 0.4)
          context.arc(x, y, 7, 0, 360, false)
          context.stroke()
          context.restore()
          context.beginPath()
        }
        if (i === curStitch) {
          context.stroke()
          context.save()
          context.arc(x, y, 6, 0, 360, false)
          context.lineWidth = 0.1
          context.strokeStyle = 'red'
          context.moveTo(x, y)
          context.lineTo(x - 200, y)
          context.lineTo(x + 200, y)
          context.moveTo(x, y)
          context.lineTo(x, y - 200)
          context.lineTo(x, y + 200)
          context.stroke()
          context.restore()
          context.beginPath()
        }
        x = x + this.stitchs[i].x * r
        y = y + this.stitchs[i].y * r
      }
      context.quadraticCurveTo(80, 80, 0, 0)
      context.stroke()
      this.breakData = breakData
      context.fillStyle = 'green'
      context.fillRect(this.designInfo.start.x * r + offsetx - 4, this.designInfo.start.y * r + offsety - 4, 8, 8)
      this.$message.closeAll()
      console.timeEnd('time')
    },
    bit: function(byt, loc) {
      return (byt >> loc) & 1
    }
  }
}
</script>

<style>
  .filter-item {margin-right: 5px;}
  .filter-container {
    display:  -webkit-box;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .filter-container > * {
    margin: 8px;
  }
  .dstViewa {
    height: 600px;
    width: 100%;
    background: whitesmoke;
  }
  .updateBox {
        position: relative
  }
</style>
