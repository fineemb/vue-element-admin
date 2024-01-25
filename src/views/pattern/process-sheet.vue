<template>
  <div class="app-container" @scroll="handleScroll">
    <el-row :gutter="10">
      <el-col :xs="24" :sm="10" :md="6" :lg="7" :xl="6">
        <!-- <el-button @click="clearBreak">清零</el-button>
        <el-button-group>
          <el-button icon="el-icon-zoom-in" circle data-type="in" @click="setZoom" />
          <el-button icon="el-icon-zoom-out" circle data-type="out" @click="setZoom" />
          <el-button icon="el-icon-full-screen" circle data-type="full" @click="setZoom" />
          <el-button icon="el-icon-arrow-left" circle data-type="left" @click="play" @mousedown.native="moveStart" @mouseup.native="moveStop" />
          <el-button icon="el-icon-arrow-right" circle data-type="right" @click="play" @mousedown.native="moveStart" @mouseup.native="moveStop" />
        </el-button-group> -->

        <el-form :style="{'margin-top': controlPanelTop+'px'}">
          <el-button v-print="printMe">打印!</el-button>
          <el-slider v-model="canvasZoom" />
          <el-form-item label="枕套宽度">
            <el-input v-model="ztWidth" style="width: 200px;" placeholder="输入枕套宽度" @change="reDraw('frame')"><span slot="suffix">CM</span></el-input>
          </el-form-item>
          <el-form-item label="枕套高度">
            <el-input v-model="ztHeight" style="width: 200px;" placeholder="输入枕套高度" @change="reDraw('frame')"><span slot="suffix">CM</span></el-input>
          </el-form-item>
          <el-form-item label="被面宽度">
            <el-input v-model="bmWidth" style="width: 200px;" placeholder="输入被面宽度" @change="reDraw('frame')"><span slot="suffix">CM</span></el-input>
          </el-form-item>
          <el-form-item label="被面高度">
            <el-input v-model="bmHeight" style="width: 200px;" placeholder="输入被面高度" @change="reDraw('frame')"><span slot="suffix">CM</span></el-input>
          </el-form-item>
        </el-form>
        <el-collapse v-model="activeNames" accordion>
          <el-collapse-item v-for="(item, index) in dsts" :key="index" :title="item.name" :name="item.name + index">
            <div>换色：{{ item.c }}次 针数：{{ item.s }}针</div>
            <div>起针点：{{ item.start.x }}-{{ item.start.y }}</div>
            <el-checkbox-group v-model="item.mirror" style="margin-top: 15px;" @change="reDraw('dst')">
              <el-checkbox-button key="mirrorVertically" label="mirrorVertically">垂直镜像</el-checkbox-button>
              <el-checkbox-button key="mirrorHorizontal" label="mirrorHorizontal">水平镜像</el-checkbox-button>
            </el-checkbox-group>
            <el-radio-group v-model="item.part" style="margin-top: 15px;" @input="reDraw('dst')">
              <el-radio :label="1">左枕</el-radio>
              <el-radio :label="2">右枕</el-radio>
              <el-radio :label="3">被面</el-radio>
            </el-radio-group>
            <div class="postiton">
              <el-row>
                <el-col :span="9">
                  <el-radio-group v-model="item.position" @input="reDraw('dst')">
                    <el-row>
                      <el-col :span="8"><el-radio :label="1">┌</el-radio></el-col>
                      <el-col :span="8"><el-radio :label="2">┬</el-radio></el-col>
                      <el-col :span="8"><el-radio :label="3">┐</el-radio></el-col>
                    </el-row>
                    <el-row>
                      <el-col :span="8"><el-radio :label="4">├</el-radio></el-col>
                      <el-col :span="8"><el-radio :label="5">┼</el-radio></el-col>
                      <el-col :span="8"><el-radio :label="6">┤</el-radio></el-col>
                    </el-row>
                    <el-row>
                      <el-col :span="8"><el-radio :label="7">└</el-radio></el-col>
                      <el-col :span="8"><el-radio :label="8">┴</el-radio></el-col>
                      <el-col :span="8"><el-radio :label="9">┘</el-radio></el-col>
                    </el-row>
                  </el-radio-group>
                </el-col>
                <el-col :span="15">
                  <el-form style="margin-top: 15px;">
                    <el-form-item label="X距离">
                      <el-input v-model="item.xoffset" style="width: 160px;" placeholder="输入尺寸" @change="reDraw('dst')"><span slot="suffix">CM</span></el-input>
                    </el-form-item>
                    <el-form-item label="Y距离">
                      <el-input v-model="item.yoffset" style="width: 160px;" placeholder="输入尺寸" @change="reDraw('dst')"><span slot="suffix">CM</span></el-input>
                    </el-form-item>
                    <el-form-item label="旋转">
                      <el-input v-model="item.rotate" style="width: 167px;" placeholder="输入角度" @change="reDraw('dst')"><span slot="suffix">°</span></el-input>
                    </el-form-item>
                  </el-form>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-col>
      <el-col :xs="24" :sm="14" :md="18" :lg="17" :xl="18">
        <div id="print">
          <canvas
            id="canvas"
            ref="canvas"
            class="dstViewa"
            width="794"
            height="1123"
            :style="{'zoom':canvasZoom/100}"
            @dragenter="handleDragEnter"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
            @mousedown.native="moveStart"
            @mouseup.native="moveStop"
          >这里是看花样预览的</canvas>
        </div>
      </el-col>

    </el-row>

  </div>
</template>

<script>
// import axios from 'axios'
import eventBus from '../../utils/eventBus'
import { getDstFile } from '@/api/user'
import waves from '@/directive/waves' // waves directive
import Print from 'vue-print-nb'
var mouseIsDown = false
var timer = null
export default {
  name: 'UpdataPattern',
  directives: { waves, Print },
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
      canvas: null,
      context: null,
      canvasHeight: 1123, // 画布宽度
      canvasWidth: 794, // 画布高度
      controlPanelTop: 0,
      canvasZoom: 85, // 画面显示缩放比例
      frame: null,
      margin: 100, // 标注文本和线之间的距离
      b2zMargin: 100 * 2.5, // 枕套和被面之间的间隔
      dsts: [],
      part: 'bm',
      activeNames: '',
      dragOffset: { x: 0, y: 0 },
      scale: 1,
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
      canvasOffset: { x: 0, y: 0 },
      downloadLoading: false,
      ztWidth: 74,
      ztHeight: 48,
      bmWidth: 200,
      bmHeight: 230,

      printMe: {
        // 打印区域
        id: 'print'
        // 是否有打印预览
        // preview: true
      }
    }
  },
  mounted() {
    const _this = this
    eventBus.$on('message', this.message)
    this.canvas = document.getElementById('canvas')
    this.canvas.onmousedown = function(e) {
      mouseIsDown = true
      _this.dragOffset.x = e.offsetX / (_this.canvasZoom / 100)
      _this.dragOffset.y = e.offsetY / (_this.canvasZoom / 100)
      console.log(_this.dragOffset.x + '_' + _this.dragOffset.y)
      _this.checkElement(_this.dragOffset)
    }
    this.canvas.onmouseup = function(e) {
    //   console.log(e)
      _this.offsetx += _this.canvasOffset.x
      _this.offsety += _this.canvasOffset.y
      // _this.dstCanvas(_this.curStitch)
      // if (mouseIsDown) mouseClick(e)
      mouseIsDown = false
    }

    this.canvas.onmousemove = function(e) {
      if (!mouseIsDown) return
      _this.canvasOffset.x = e.x - _this.dragOffset.x
      _this.canvasOffset.y = e.y - _this.dragOffset.y
      //   console.log(_this.canvasOffset.x, _this.canvasOffset.y)
      return false
    }
    this.canvas.drag
    this.context = this.canvas.getContext('2d')
    this.$nextTick(() => {
      this.canvasWidth = this.$refs.canvas.offsetWidth
      this.canvasHeight = this.$refs.canvas.offsetHeight
    })
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.frame = this.darwFrame()
    this.context.drawImage(this.frame, 0, 0)
  },
  beforeDestroy() {
    eventBus.$off('message', this.message)
  },
  created() {
    // this.getUser()
  },
  methods: {
    doprint() {
      this.setPrintStyle()
      Print('#print', {
        afterprint: () => {},
        cancel: () => {}
      })
    },
    handleSuccess(response, file, fileList) {
      console.log(response)
      if (response.reason) {
        this.$message.error('上传失败：' + response.reason)
      } else {
        this.$message('版带上传成功')
      }
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
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
    handleDrop: function(e) {
      const _this = this
      e.stopPropagation()
      e.preventDefault()
      console.log('落点位置', [e.offsetX, e.offsetY])
      console.log(e.dataTransfer.files)
      const file = e.dataTransfer.files[0]
      const name = file.name
      const reader = new FileReader()
      reader.onload = () => {
        const ss = _this.dstRead(reader.result, e.offsetX / (_this.canvasZoom / 100), e.offsetY / (_this.canvasZoom / 100))
        const x = ss.x
        const y = ss.y
        const w = ss.designInfo.width
        const h = ss.designInfo.height
        const c = ss.designInfo.colors
        const s = ss.designInfo.stitches
        const start = ss.designInfo.start
        const img = ss.img
        const mirror = []
        const dstObj = { img, name, x, y, w, h, c, s, start, mirror }
        _this.dsts.push(dstObj)
      }
      reader.readAsArrayBuffer(file)
    },
    handleDragLeave(e) {
      e.stopPropagation()
      e.preventDefault()
    },
    handleDragEnter(e) {
      e.stopPropagation()
      e.preventDefault()
    //   this.drapText = '松开鼠标完成上传'
    },
    handleDragOver(e) {
      e.stopPropagation()
      e.preventDefault()
    },
    handleScroll(e) {
      const that = this
      clearTimeout(timer)
      timer = setTimeout(function() {
        that.controlPanelTop = e.target.scrollTop
      }, 1)
    },
    checkElement(offset) {
      const _this = this
      // const r = Math.min(_this.canvasWidth / Math.max(_this.bmWidth * 10 + _this.margin * 2, _this.ztWidth * 10 * 2 + _this.margin * 3), _this.canvasHeight / (_this.bmHeight * 10 + _this.ztHeight * 10 + _this.margin * 3))
      this.dsts.forEach((item, index) => {
        _this.context.beginPath()
        _this.context.lineWidth = 0.2
        _this.context.strokeStyle = 'red'
        _this.context.save()
        // const ro = item.w * _this.scale / 10 - item.h * _this.scale / 10
        _this.context.translate(item.x + (item.w * _this.scale / 10) / 2, item.y + (item.h * _this.scale / 10) / 2)
        _this.context.rotate(item.rotate * Math.PI / 180)
        _this.context.rect(0 - (item.w * _this.scale / 10) / 2, 0 - (item.h * _this.scale / 10) / 2, item.w * _this.scale / 10, item.h * _this.scale / 10)
        _this.context.stroke()
        _this.context.restore()
        console.log('item xy:', item.x + '_' + item.y)
        // console.log(offset)
        if (_this.context.isPointInPath(offset.x, offset.y)) {
        //   console.log(item.name)
          _this.activeNames = item.name + index
        }
      })
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
    dstRead: function(data, x, y) {
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
      for (const i in stitchesData) {
        let tx; let ty; let tz; let tl
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
          var s = { x: tx, y: ty, z: tz, c: color, f: tf, l: tl }
          stitchs.push(s)
          flag = 0
          onestitle = []
        }
      }
      const img = this.dstCanvas({
        designInfo: designInfo,
        stitchs: stitchs
      })
      const redata = {
        designInfo: designInfo,
        img: img,
        x: x,
        y: y
      }
      this.context.drawImage(img, x, y)
      return redata
    },
    dstCanvas: function(data) {
      console.time('time')
      const stitchs = data.stitchs
      const designInfo = data.designInfo
      const dstCanvas = document.createElement('canvas')
      const dstContext = dstCanvas.getContext('2d')
      const colors = this.colors
      const r = this.scale / 10
      let x = designInfo.start.x * r
      let y = designInfo.start.y * r
      let nowcolor = -1
      let step = -1
      dstCanvas.width = designInfo.width
      dstCanvas.height = designInfo.height
      dstContext.translate(0.5, 0.5)
      dstContext.lineWidth = r * 10
      dstContext.strokeStyle = colors[((nowcolor + 1 > 9) ? 0 : nowcolor + 1)]
      dstContext.miterLimit = 1
      dstContext.beginPath()
      dstContext.moveTo(x, y)
      for (var i = 0; i < stitchs.length; i++) {
        if (stitchs[i].c !== step) {
          nowcolor++
          step++
          if (nowcolor > 9) { nowcolor = 0 }
          dstContext.stroke()
          dstContext.strokeStyle = i > colors[nowcolor]
          dstContext.beginPath()
        }
        dstContext.strokeStyle = colors[nowcolor]
        var zz = stitchs[i].z
        if (i > 0 && i < stitchs.length - 1) { zz = (stitchs[i].z === 0 && stitchs[i - 1].z !== 0) ? 1 : stitchs[i].z }

        if (zz) {
          dstContext.moveTo(x, y)
        } else {
          dstContext.lineTo(x, y)
        }
        x = x + stitchs[i].x * r
        y = y + stitchs[i].y * r
      }
      dstContext.stroke()
      dstContext.fillStyle = 'green'
      dstContext.fillRect(designInfo.start.x * r - 4, designInfo.start.y * r - 4, 8, 8)

      // const rdstCanvas = document.createElement('canvas')
      // const rdstContext = rdstCanvas.getContext('2d')
      // rdstCanvas.width = designInfo.height
      // rdstCanvas.height = designInfo.width
      // rdstContext.translate(0, 0)
      // rdstContext.rotate(90 * Math.PI / 180)
      // rdstContext.drawImage(dstCanvas, 0, 0)
      console.timeEnd('time')
      return dstCanvas
    },
    reDraw(e) {
      const _this = this
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
      if (e === 'frame') {
        this.frame = this.darwFrame()
      }
      this.context.drawImage(this.frame, 0, 0)
      this.dsts.forEach((item, index) => {
        const img = item.img
        const part = item.part ?? 3 // 默认是被面
        const position = item.position ?? 9 // 默认右下角
        // 画布和图的比例
        const r = Math.min(_this.canvasWidth / Math.max(_this.bmWidth * 10 + _this.margin * 2, _this.ztWidth * 10 * 2 + _this.margin * 3), _this.canvasHeight / (_this.bmHeight * 10 + _this.ztHeight * 10 + _this.margin * 3))
        const xoffset = (item.xoffset ?? 0) * 10 * r // 按缩放比例计算偏移值
        const yoffset = (item.yoffset ?? 0) * 10 * r
        const h = item.h / 10 * r // 画布上呈现的图像尺寸
        const w = item.w / 10 * r
        const margin = _this.margin * r
        const ztWidth = _this.ztWidth * 10 * r
        const ztHeight = _this.ztHeight * 10 * r
        const bmWidth = _this.bmWidth * 10 * r
        const bmHeight = _this.bmHeight * 10 * r
        const bm_lt = [(_this.canvasWidth - bmWidth) / 2, _this.canvasHeight - margin - bmHeight] // 被面左上角坐标
        const zzt_lt = [_this.canvasWidth / 2 - ztWidth - margin / 2, (_this.canvasHeight - bmHeight) - _this.b2zMargin * r - ztHeight] // 左枕左上角坐标
        const yzt_lt = [_this.canvasWidth / 2 + margin / 2, (_this.canvasHeight - bmHeight) - _this.b2zMargin * r - ztHeight] // 右枕左上角坐标
        let offset = part === 3 ? bm_lt : (part === 2 ? yzt_lt : zzt_lt) // 计算9个方位情况下的偏移距离
        switch (position) {
          case 1: // 左上
            offset = [offset[0] + xoffset, offset[1] + yoffset]
            break
          case 2: // 中上
            offset = [offset[0] + (part === 3 ? bmWidth : ztWidth) / 2 - w / 2, offset[1] + yoffset]
            break
          case 3: // 右上
            offset = [offset[0] - xoffset + (part === 3 ? bmWidth : ztWidth) - w, offset[1] + yoffset]
            break
          case 4:
            offset = [offset[0] + xoffset, offset[1] + (part === 3 ? bmHeight : ztHeight) / 2 - h / 2]
            break
          case 5:
            offset = [offset[0] + (part === 3 ? bmWidth : ztWidth) / 2 - w / 2, offset[1] + (part === 3 ? bmHeight : ztHeight) / 2 - h / 2]
            break
          case 6:
            offset = [offset[0] + (part === 3 ? bmWidth : ztWidth) - xoffset - w, offset[1] + (part === 3 ? bmHeight : ztHeight) / 2 - h / 2]
            break
          case 7:
            offset = [offset[0] + xoffset, offset[1] + (part === 3 ? bmHeight : ztHeight) - h - yoffset]
            break
          case 8:
            offset = [offset[0] + (part === 3 ? bmWidth : ztWidth) / 2 - w / 2, offset[1] + (part === 3 ? bmHeight : ztHeight) - h - yoffset]
            break
          case 9:
            offset = [offset[0] + (part === 3 ? bmWidth : ztWidth) - w - xoffset, offset[1] + (part === 3 ? bmHeight : ztHeight) - h - yoffset]
            break
        }
        _this.dsts[index].x = offset[0]
        _this.dsts[index].y = offset[1]
        _this.context.save()
        _this.context.translate(offset[0] + w / 2, offset[1] + h / 2)
        if (item.mirror.includes('mirrorVertically'))_this.context.scale(1, -1)
        if (item.mirror.includes('mirrorHorizontal'))_this.context.scale(-1, 1)
        _this.context.rotate(item.rotate * Math.PI / 180)
        _this.context.drawImage(img, 0 - w / 2, 0 - h / 2)
        _this.context.restore()
      })
    },
    darwFrame() {
    // 绣花工艺面料尺寸
      const sizeCanvas = document.createElement('canvas')
      const cacheSize = sizeCanvas.getContext('2d')
      const cachecanvasWidth = this.canvasWidth
      const cachecanvasHeight = this.canvasHeight
      const bmWidth = this.bmWidth * 10
      const bmHeight = this.bmHeight * 10
      const ztWidth = this.ztWidth * 10
      const ztHeight = this.ztHeight * 10
      const margin = this.margin
      const dashLineLenght = 100
      const r = Math.min(cachecanvasWidth / Math.max(bmWidth + margin * 2, ztWidth * 2 + margin * 3.5), cachecanvasHeight / (bmHeight + ztHeight + margin * 3))
      this.scale = r
      sizeCanvas.width = cachecanvasWidth
      sizeCanvas.height = cachecanvasHeight
      cacheSize.lineWidth = 0.5
      cacheSize.beginPath()
      // 被面
      cacheSize.strokeRect((cachecanvasWidth - bmWidth * r) / 2, (cachecanvasHeight - bmHeight * r) - margin * r, bmWidth * r, bmHeight * r)
      // 左枕
      cacheSize.strokeRect(cachecanvasWidth / 2 - ztWidth * r - margin / 2 * r, (cachecanvasHeight - bmHeight * r) - this.b2zMargin * r - ztHeight * r, ztWidth * r, ztHeight * r) // margin2.5是枕套和被面之间的间隔
      // 右枕
      cacheSize.strokeRect(cachecanvasWidth / 2 + margin / 2 * r, (cachecanvasHeight - bmHeight * r) - this.b2zMargin * r - ztHeight * r, ztWidth * r, ztHeight * r)

      cacheSize.beginPath()
      cacheSize.strokeStyle = 'red'
      // 被面标注
      const lt = [(cachecanvasWidth - bmWidth * r) / 2, (cachecanvasHeight - bmHeight * r) - margin * r]
      const lb = [(cachecanvasWidth - bmWidth * r) / 2, cachecanvasHeight - margin * r]
      const rb = [(cachecanvasWidth - bmWidth * r) / 2 + bmWidth * r, cachecanvasHeight - margin * r]
      cacheSize.moveTo(lt[0], lt[1])
      cacheSize.lineTo(lt[0] - dashLineLenght * r, lt[1])
      cacheSize.moveTo(lb[0], lb[1])
      cacheSize.lineTo(lb[0] - dashLineLenght * r, lb[1])
      cacheSize.moveTo(lb[0], lb[1])
      cacheSize.lineTo(lb[0], lb[1] + dashLineLenght * r)
      cacheSize.moveTo(lb[0], lb[1])
      cacheSize.lineTo(lb[0], lb[1] + dashLineLenght * r)
      cacheSize.moveTo(rb[0], rb[1])
      cacheSize.lineTo(rb[0], rb[1] + dashLineLenght * r)
      cacheSize.moveTo(lt[0] - dashLineLenght * r / 2, lt[1])
      cacheSize.lineTo(lt[0] - dashLineLenght * r / 2, lt[1] + (bmHeight * r - margin) / 2)
      cacheSize.moveTo(lb[0] - dashLineLenght * r / 2, lb[1])
      cacheSize.lineTo(lb[0] - dashLineLenght * r / 2, lb[1] - (bmHeight * r - margin) / 2)
      cacheSize.moveTo(lb[0], lb[1] + dashLineLenght * r / 2)
      cacheSize.lineTo(lb[0] + (bmWidth * r - margin) / 2, lb[1] + dashLineLenght * r / 2)
      cacheSize.moveTo(lb[0] + bmWidth * r, lb[1] + dashLineLenght * r / 2)
      cacheSize.lineTo(lb[0] + bmWidth * r - (bmWidth * r - margin) / 2, lb[1] + dashLineLenght * r / 2)

      // 枕套标注
      const zt_rt = [cachecanvasWidth / 2 - ztWidth * r - margin / 2 * r, (cachecanvasHeight - bmHeight * r) - this.b2zMargin * r - ztHeight * r]
      cacheSize.moveTo(zt_rt[0], zt_rt[1])
      cacheSize.lineTo(zt_rt[0] - dashLineLenght * r, zt_rt[1])
      cacheSize.moveTo(zt_rt[0], zt_rt[1] + ztHeight * r)
      cacheSize.lineTo(zt_rt[0] - dashLineLenght * r, zt_rt[1] + ztHeight * r)
      cacheSize.moveTo(zt_rt[0], zt_rt[1] + ztHeight * r)
      cacheSize.lineTo(zt_rt[0], zt_rt[1] + ztHeight * r + dashLineLenght * r)
      cacheSize.moveTo(zt_rt[0] + ztWidth * r, zt_rt[1] + ztHeight * r)
      cacheSize.lineTo(zt_rt[0] + ztWidth * r, zt_rt[1] + ztHeight * r + dashLineLenght * r)
      cacheSize.moveTo(zt_rt[0] + ztWidth * r, zt_rt[1] + ztHeight * r + dashLineLenght * r / 2)
      cacheSize.lineTo(zt_rt[0] + ztWidth * r - (ztWidth * r - margin) / 2, zt_rt[1] + ztHeight * r + dashLineLenght * r / 2)
      cacheSize.moveTo(zt_rt[0], zt_rt[1] + ztHeight * r + dashLineLenght * r / 2)
      cacheSize.lineTo(zt_rt[0] + (ztWidth * r - margin) / 2, zt_rt[1] + ztHeight * r + dashLineLenght * r / 2)
      cacheSize.moveTo(zt_rt[0] - dashLineLenght * r / 2, zt_rt[1])
      cacheSize.lineTo(zt_rt[0] - dashLineLenght * r / 2, zt_rt[1] + (ztHeight * r - margin) / 2)
      cacheSize.moveTo(zt_rt[0] - dashLineLenght * r / 2, zt_rt[1] + ztHeight * r)
      cacheSize.lineTo(zt_rt[0] - dashLineLenght * r / 2, zt_rt[1] + ztHeight * r - (ztHeight * r - margin) / 2)

      cacheSize.stroke()
      cacheSize.textAlign = 'center'
      cacheSize.font = '15px Arial'
      cacheSize.fillText(bmWidth / 10 + 'CM', lb[0] + bmWidth * r / 2, lb[1] + dashLineLenght * r / 2 + 10, 200)
      cacheSize.fillText(ztWidth / 10 + 'CM', zt_rt[0] + ztWidth * r / 2, zt_rt[1] + ztHeight * r + dashLineLenght * r / 2 + 10, 200)

      cacheSize.translate(lt[0] - dashLineLenght * r / 2 + 10, lt[1] + bmHeight * r / 2)
      cacheSize.rotate(-Math.PI / 2)
      cacheSize.fillText(bmHeight / 10 + 'CM', 0, 0, 200)
      cacheSize.setTransform(1, 0, 0, 1, 0, 0)
      cacheSize.translate(zt_rt[0] - dashLineLenght * r / 2 + 10, zt_rt[1] + ztHeight * r / 2)
      cacheSize.rotate(-Math.PI / 2)
      cacheSize.fillText(ztHeight / 10 + 'CM', 0, 0, 200)
      // cacheSize.restore()
      const href = this.canvas.toDataURL()
      const a = document.createElement('a')
      a.download = 'test'
      a.href = href
      // a.dispatchEvent(new MouseEvent('click'))
      return sizeCanvas
    },
    bit: function(byt, loc) {
      return (byt >> loc) & 1
    }
  }
}
</script>

  <style>
    .app-container {
        height: calc(100vh - 84px);
        overflow: scroll;
    }
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
      background: whitesmoke;
    }
    .updateBox {
          position: relative
    }
    .postiton .el-radio__label {
        font-family: u2400;
        font-size: 3em;
        line-height: 1.2em;
        left: -32px;
        top: 5px;
        position: inherit;
    }
    .postiton .el-radio__input {
        top: -6px;
        z-index: 100;
    }
    .el-form-item {
      margin-bottom: 10px;
    }
    @page {
      size: A4;
      margin-top: 2.54cm; /* 1英寸等于2.54厘米 */
      margin-bottom: 2.54cm;
      margin-left: 2.54cm;
      margin-right: 2.54cm;
    }
    @media print {
      .print-page {
        page: A4;
        margin: 2.54cm;
      }
    }

  </style>

