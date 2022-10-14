<template>
  <div class="app-container">
    <div class="filter-container">
      <div v-for="item in machines" :key="item.mac" class="bg-purple updateBox">
        <el-progress :percentage="item.curStitch?item.curStitch/item.patternStitch*100:0" :show-text="false" :stroke-width="5" :color="item.reason" />
        <el-alert v-if="item.status===404" class="patternAlert" :title="item.status===404?'文件'+item.filename+'未找到不能预览':''" type="error" />
        <el-tooltip>
          <div slot="content">{{ item.userName }}</div>
          <el-avatar :src="item.userIcon" style="position: absolute;top: -7px;right: -7px;z-index: 1;"> 未知 </el-avatar>
        </el-tooltip>
        <el-upload class="upload" drag :on-success="handleSuccess" :data="{mac: item.value}" :action="upload_url">
          <el-tooltip>
            <div slot="content">文件名：{{ item.filename }}<br>状态：{{ item.ss }}<br>针数：{{ item.patternStitch }}<br>当前位置：{{ item.curStitch }}</div>
            <canvas :id="item.value" :ref="item.value" class="dstView">这里是看花样预览的</canvas>
          </el-tooltip>
          <!-- <i class="el-icon-upload"></i> -->
          <div class="el-upload__text"><el-tag effect="dark" class="mark" type="primary">{{ item.label }}</el-tag>将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </div>
    </div>
  </div>
</template>

<script>
// import axios from 'axios'
import eventBus from '../../utils/eventBus'
import { getUserInfo, getDstFile } from '@/api/user'
import waves from '@/directive/waves' // waves directive
// arr to obj, such as { CN : "China", US : "USA" }
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
      showEdit: [],
      showBtn: [],
      upload_url: process.env.VUE_APP_BASE_API + '/upload',
      showBtnOrdinary: true,
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      orders: [],
      users: [],
      states: {},
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
    eventBus.$on('message', this.message)
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
    handleSuccess(response, file, fileList) {
      console.log(response)
      if (response.reason) {
        this.$message.error('上传失败：' + response.reason)
      } else {
        this.$message.success('版带上传成功')
      }
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
      if (res.type === 'state') {
        const icon = this.users.find(e => e.name === res.data.user.userId)?.avatarUrl || ''
        const userName = this.users.find(e => e.name === res.data.user.userId)?.name || ''
        const curStitch = res.data.pattern.curStitch
        const reason = res.data.machineState.reason
        const patternStitch = res.data.pattern.patternStitch
        const filename = res.data.pattern.patternName
        const machineIndex = this.machines.findIndex(e => e.value === res.data.mac)
        const md = this.machines[machineIndex]
        // console.log(machineIndex)
        md['userIcon'] = icon
        md['userName'] = userName
        md['ss'] = res.data.machineState.state + ' (' + res.data.machineState.reason + ')'
        // let color =
        md['reason'] = (reason === 'complete') ? '#5cb87a' : ((reason === 'break') ? '#aa3535' : '#409eff')
        if (this.machines[machineIndex].filename && this.machines[machineIndex].curStitch !== curStitch) {
          // 刷新版带
          // this.dstCanvas(this.machines[machineIndex].file, this.machines[machineIndex].value)
          md['curStitch'] = curStitch
          md['patternStitch'] = patternStitch
        }
        this.machines.splice(machineIndex, 1, md)
        if (filename && this.machines[machineIndex].filename !== filename) {
          // 刷新版带
          getDstFile({ file: filename, mac: res.data.mac }).then(response => {
            if (response.message === 404) {
              this.$message.error('服务器未找到这个文件' + decodeURI(response.file))
            }
            if (response.message === 200) {
              md['filename'] = response.filename
              md['file'] = response.data.data
              this.machines.splice(machineIndex, 1, md)
              this.dstCanvas(response.data.data, response.mac)
            }
          }, error => {
            console.log(error)
            md['filename'] = decodeURI(error.response?.data.filename)
            md['status'] = error.response?.data.message
            this.machines.splice(machineIndex, 1, md)
          })
        }
      }
    },
    dstCanvas: function(data, mac) {
      const curStitch = this.machines.find(e => e.value === mac).curStitch
      const uint8 = new Uint8Array(data)
      const head = String.fromCharCode.apply(null, uint8.slice(0, 512))
      const headinfo = /LA:(.*)\rST:(.*)\rCO:(.*)\r\+X:(.*)\r-X:(.*)\r\+Y:(.*)\r-Y:(.*)\rAX:(.*)\rAY:(.*)\r[(MX:)||(TP:)](.*)/g.exec(head)
      if (!headinfo) return
      // eslint-disable-next-line no-unused-vars
      let designInfo = {}
      if (headinfo.length < 11) {
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
      const stitchesData = uint8.slice(512, uint8.length)
      let flag = 0
      let color = 0
      let onestitle = []
      const stitchs = []
      const canvasHeight = 145
      const canvasWidht = 290
      const r = Math.min((canvasWidht - 20) / designInfo.width, (canvasHeight - 20) / designInfo.height)
      for (const i in stitchesData) {
        // console.log(stitchesData[i]);
        let tx, ty, tz, tl
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
          var s = { x: tx * r, y: ty * r, z: tz, c: color, f: tf, l: tl * r }
          stitchs.push(s)
          flag = 0
          onestitle = []
        }
      }

      // console.log(stitchs)
      var canvas = document.getElementById(mac)
      if (!canvas) return
      var context = canvas.getContext('2d')
      const colors = ['blue', 'red', 'black', 'yellow', 'purple', 'lime', 'navy', 'green', 'orange', 'brown']
      const offsetx = designInfo.width * r < 290 ? (290 - designInfo.width * r) / 2 : 0
      const offsety = designInfo.height * r < 145 ? (145 - designInfo.height * r) / 2 : 0
      let x = designInfo.start.x * r + offsetx
      let y = designInfo.start.y * r + offsety
      const dpr = window.devicePixelRatio
      let nowcolor = -1
      let step = -1
      canvas.width = 290
      canvas.height = 145
      context.scale(dpr, dpr)
      context.translate(0.5, 0.5)
      context.lineWidth = r
      context.strokeStyle = colors[((nowcolor + 1 > 9) ? 0 : nowcolor + 1)]
      context.stroke()
      context.beginPath()
      context.moveTo(x, y)
      for (var i = 0; i < stitchs.length; i++) {
        if (i > 0) {
          if (stitchs[i].c !== step) {
            nowcolor++
            step++
            if (nowcolor > 9) { nowcolor = 0 }
          }
          context.strokeStyle = colors[nowcolor]
          var zz = stitchs[i].z
          if (i > 0) { zz = (stitchs[i].z === 0 && stitchs[i - 1].z === 1) ? 1 : (stitchs[i].z === 1 && stitchs[i - 1].z === 0) ? 0 : stitchs[i].z }

          if (zz === 1) {
            if (i < stitchs.length - 1) {
              x = x + stitchs[i].x
              y = y + stitchs[i].y
              i++
            }
            context.strokeStyle = 'rgba(0,0,0,0)'
          } else {
            context.strokeStyle = i > curStitch ? 'gray' : colors[nowcolor]
          }
          if (i === curStitch) {
            context.fillStyle = 'red'
            // context.fillRect(x - 4, y - 4, 8, 8)
            context.arc(x, y, 6, 0, 360, false)
            context.lineWidth = 0.1
            context.strokeStyle = 'red'
            context.moveTo(x, y)
            context.lineTo(x - 500, y)
            context.lineTo(x + 500, y)
            context.moveTo(x, y)
            context.lineTo(x, y - 500)
            context.lineTo(x, y + 500)
            context.stroke()
          }
          context.stroke()
          context.beginPath()
          context.moveTo(x, y)
          // console.log(x,y)
        }

        x = x + stitchs[i].x
        y = y + stitchs[i].y
        context.lineTo(x, y)
      }
      context.fillStyle = 'green'
      context.fillRect(designInfo.start.x * r + offsetx - 4, designInfo.start.y * r + offsety - 4, 8, 8)
      // context.lineWidth = 0.5
      // context.strokeStyle = 'green'
      // context.moveTo(designInfo.start.x * r, designInfo.start.y * r)
      // context.lineTo(designInfo.start.x * r - 500, designInfo.start.y * r)
      // context.lineTo(designInfo.start.x * r + 500, designInfo.start.y * r)
      // context.moveTo(designInfo.start.x * r, designInfo.start.y * r)
      // context.lineTo(designInfo.start.x * r, designInfo.start.y * r - 500)
      // context.lineTo(designInfo.start.x * r, designInfo.start.y * r + 500)
      // context.stroke()

      // context.beginPath()
      // context.fillStyle = 'red'
      // context.fillRect(x - 3, y - 3, 6, 6)
      // context.lineWidth = 0.5
      // context.strokeStyle = 'red'
      // context.moveTo(x, y)
      // context.lineTo(x - 500, y)
      // context.lineTo(x + 500, y)
      // context.moveTo(x, y)
      // context.lineTo(x, y - 500)
      // context.lineTo(x, y + 500)
      // context.stroke()
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
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .filter-container > * {
    margin: 8px;
  }
  .dstView {
    height: 145px;
    background: whitesmoke;
  }
  .upload,.el-upload,.el-upload-dragger {
        width: 300px;
        height: 210px;
        position: relative;
  }
  .el-upload-list {
    margin-top: 0;
    position: absolute;
    z-index: 1000;
    top: 0;
  }
  .el-upload-dragger .el-icon-upload{
    line-height: 28px;
    margin: 0;
    font-size: 48px;
  }
  .updateBox {
        position: relative
  }
  .patternAlert {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: 88%;
  }
</style>
