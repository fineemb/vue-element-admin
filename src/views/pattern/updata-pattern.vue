<template>
  <div class="app-container">
    <div class="filter-container">
      <div id="divPlugin" />
      <div v-for="item in machines" :key="item.mac" class="updateBox">
        <el-progress class="progress" :percentage="item.percentage" :show-text="false" :stroke-width="5" :color="item.reason" />
        <el-alert v-if="item.status===404" class="patternAlert" :title="item.status===404?'文件'+item.filename+'未找到不能预览':''" type="error" />
        <el-button class="cctv" type="primary" icon="el-icon-video-camera" circle @click="hk_login(item.cctv, item.port, item.username, item.password)" />
        <el-button class="info" type="primary" icon="el-icon-s-data" circle />
        <el-button class="msg" type="primary" icon="el-icon-s-comment" circle @click="send_msg(item.id)" />
        <div @click="openDesigns(item.id)">
          <el-tooltip placement="top-start">
            <div slot="content">{{ item.userName }}<br>点击管理花样</div>
            <el-badge :value="item.label" class="macid" style="position: absolute;top: -7px;right: -7px;z-index: 1;" type="primary">
              <el-avatar :src="item.userIcon">未知</el-avatar>
            </el-badge>
          </el-tooltip>
        </div>
        <!-- <el-tooltip>
          <div slot="content" :data="{mac: item.mac}" @click="openDesigns">{{ item.userName }}</div>
        </el-tooltip> -->
        <el-upload class="upload" drag :on-success="handleSuccess" multiple :data="{mac: item.value, name: uploadName}" :action="upload_url" :before-upload="beforeUpload" :name="uploadName">
          <el-tooltip>
            <div slot="content">文件名：{{ item.filename }}<br>状态：{{ item.ss }}<br>针数：{{ item.patternStitch }}<br>当前位置：{{ item.curStitch }}</div>
            <canvas :id="item.value" :ref="item.value" class="dstView">这里是看花样预览的</canvas>
          </el-tooltip>
          <!-- <i class="el-icon-upload"></i> -->
          <!-- <div class="el-upload__text"><el-tag effect="dark" class="mark" type="primary">{{ item.label }}</el-tag>将文件拖到此处，或<em>点击上传</em></div> -->
        </el-upload>
      </div>
      <el-drawer
        title="当前花样列表"
        :visible.sync="drawer"
        direction="rtl"
        :before-close="designsClose"
        custom-class="drawer"
      >
        <span slot="title">{{ openDevice }}机器花样管理
          <el-button v-if="checkedDesigns.length > 0" size="mini" type="danger" icon="el-icon-delete" circle @click="delDesign()" />
        </span>
        <el-checkbox-group v-model="checkedDesigns" class="designCheckboxGroup" @change="handleCheckedDesignsChange">
          <el-checkbox v-for="(item, index) in design4device" :key="item.machinePatternCode" :label="index" class="updateBox">
            <el-alert v-if="item.status===404" class="patternAlert" :title="item.status===404?'文件'+item.filename+'未找到不能预览':''" type="error" />
            <div class="design">
              <el-tooltip>
                <div slot="content">机器内编号：{{ item.machinePatternCode }}</div>
                <canvas :id="'design_'+item.machinePatternCode" :ref="item.patternName" class="dstView">这里是看花样预览的</canvas>
              </el-tooltip>
              <!-- <i class="el-icon-upload"></i> -->
              <div class="design_text">文件名：{{ item.patternName }}<br>针数：<em>{{ item.patternStitch }}</em></div>
            </div>
          </el-checkbox>
        </el-checkbox-group>
      </el-drawer>
    </div>
  </div>
</template>

<script>
// import axios from 'axios'
// import eventBus from '../../utils/eventBus'
import { getUserInfo, getDstFile, getDesigns, delDesigns, getrMachines, refreshState, sendMsg } from '@/api/user'
import waves from '@/directive/waves' // waves directive
import { Loading } from 'element-ui'
// arr to obj, such as { CN : "China", US : "USA" }
let loadingInstance = null
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
      // loadingInstance: null,
      timer: null,
      checkedDesigns: [],
      uploadName: null,
      drawer: false,
      showEdit: [],
      showBtn: [],
      openDeviceId: null,
      openDevice: null,
      design4device: [],
      upload_url: process.env.VUE_APP_BASE_API + '/upload',
      showBtnOrdinary: true,
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      orders: [],
      users: [],
      states: {},
      machines: [],
      downloadLoading: false
    }
  },
  watch: {
    design4device: {
      handler: function(newValue) {
        console.log('New: ' + newValue)
        for (var i = 0; i < newValue.length; i++) {
          const item = newValue[i]
          getDstFile({ file: item.patternName, mac: item.patternName, machinePatternCode: item.machinePatternCode }).then(response => {
            if (response.message === 200) {
              this.dstCanvas(response.data.data, 'design_' + response.machinePatternCode, 110, 110)
            }
          }).catch(err => {
            console.log(err)
            this.$message.error('服务器未找到这个文件' + decodeURI(item.patternName))
          })
        }
      },
      deep: true
    }
  },
  mounted() {
    // eventBus.$on('message', this.message)
    this.$nextTick(() => {
      setTimeout(() => {
        this.hk_Init()
      }, 1000)
      this.timer = setInterval(() => {
        this.refreshState()
      }, 17000)
    })
  },
  beforeDestroy() {
    // eventBus.$off('message', this.message)
    clearInterval(this.timer)
    const stopAll = () => {
      return new Promise(resolve => {
        // eslint-disable-next-line no-undef
        WebVideoCtrl.I_StopAllPlay().then(() => {		// 先stop当前播放的视频，全部stop再hide
          resolve('success')
        })
      })
    }

    stopAll().then(res => {
      if (res === 'success') {
        try {
          // 在I_StopAllPlay()异步操作完成后再执行
          // eslint-disable-next-line no-undef
          WebVideoCtrl.I_HideWnd()
        } catch (e) {
          console.error('销毁失败', e)
        }
      }
    })
  },
  created() {
    this.getUser()
    this.getrMachines()
  },
  methods: {
    hk_Init() {
      const _this = this
      // eslint-disable-next-line no-undef
      WebVideoCtrl.I_InitPlugin({
        bWndFull: true,
        iWndowType: _this.reviewdialogVisible === false ? 2 : 1,
        bDebugMode: true,
        // ... 其他回调函数的定
        cbInitPluginComplete: function() {
          // console.log('插件初始化') item.value
          // eslint-disable-next-line no-undef
          WebVideoCtrl.I_InsertOBJECTPlugin('divPlugin').then(() => {
            _this.checkInit = true
            // 检查插件是否最新
            // eslint-disable-next-line no-undef
            WebVideoCtrl.I_CheckPluginVersion().then((bFlag) => {
              if (bFlag) {
                alert(
                  '检测到新的插件版本，双击开发包目录里的HCWebSDKPlugin.exe升级！'
                )
                return
              }
            })
          },
          () => {
            _this.$confirm('查看监控需要下载控件安装，安装后请重新刷新页面', '控件下载', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            })
              .then(() => {
                window.open('./static/hk/HCWebSDKPlugin.exe')
              })
              .catch(() => {
                _this.$message.info('取消')
              })
          })
        }
      })
    },
    hk_login(ip, port, username, password) {
      const _this = this
      // eslint-disable-next-line no-undef
      WebVideoCtrl.I_Login(
        ip,
        '1',
        port,
        username,
        password,
        {
          timeout: 3000,
          async: false,
          success: function(xmlDoc) {
            console.log(' 登录成功！')
            _this.hk_play(ip)
          },
          error: function(oError) {
            console.log(' 登录失败！', oError)
            if (oError.errorCode === 2001) {
              _this.hk_play(ip)
            }
          }
        }
      )
    },
    hk_play(ip) {
      const _this = this
      // eslint-disable-next-line no-undef
      var oWndInfo = WebVideoCtrl.I_GetWindowStatus(0)
      if (oWndInfo != null) { // 已经在播放了，先停止
        // eslint-disable-next-line no-undef
        WebVideoCtrl.I_Stop({
          success: function() {
            _this.hk_play(ip)
          }
        })
      }
      // eslint-disable-next-line no-undef
      WebVideoCtrl.I_StartRealPlay(
        ip + '_80', {
          iStreamType: 1,
          iChannelID: 1,
          bZeroChannel: false,
          success: function() {
            console.log(' 开始预览成功！')
          },
          error: function(oError) {
            console.log(' 开始预览失败！', oError)
          }
        })
    },
    handleCheckedDesignsChange(e) {
      console.log('选择', e)
    },
    beforeUpload(file) {
      // 对文件名进行编码转换
      const newName = encodeURIComponent(file.name)
      this.uploadName = newName
      return true
    },
    delDesign(e) {
      console.log('删除花样', e)
      loadingInstance = Loading.service({
        target: '.drawer',
        text: '正在删除花样，等待反馈中',
        customClass: 'designLoading'
      })
      // 组织删除花样数据
      const ds = []
      for (var i = 0; i < this.checkedDesigns.length; i++) {
        const d4d = this.design4device
        ds.push({
          'deviceId': this.openDeviceId,
          'machinePatternCode': d4d[this.checkedDesigns[i]].machinePatternCode,
          'patternCode': d4d[this.checkedDesigns[i]].patternCode
        })
      }
      delDesigns(ds).then(response => {
        console.log(response)
        // this.$nextTick(() => {
        loadingInstance.close()
        // })
        if (response.data === 0) {
          this.openDesigns(response.deviceId)
        } else if (response.data === 'outtime') {
          this.$message.error('删除花样超时')
        } else if (response.data === 2) {
          this.$message.error('花样正在使用，不能删除')
          this.checkedDesigns = []
          this.openDesigns(response.deviceId)
        }
      }).catch(err => {
        console.log(err)
        // this.$nextTick(() => {
        loadingInstance.close()
        // })
        this.$message.error('删除机器花样文件失败')
      })
    },
    openDesigns(e) {
      console.log('打开花样列表', e)
      this.checkedDesigns = []
      const machine = this.machines[this.machines.findIndex(x => x.id === e)]
      const state = machine.ss
      if (!state || state === 'offline (null)') {
        console.log('离线')
      } else {
        loadingInstance = Loading.service({
          target: '.drawer',
          text: '正在获取机器花样文件',
          customClass: 'designLoading'
        })
        this.drawer = true
        this.openDeviceId = e
        this.openDevice = machine.label
        getDesigns({
          'deviceId': e,
          'page': 1,
          'size': 20
        }).then(response => {
          // this.$nextTick(() => { // 以服务的方式调用的 Loading 需要异步关闭
          loadingInstance.close()
          // })
          console.log(response)
          this.design4device = response.data.items
        // this.users = response.data
        }).catch(err => {
          console.log(err)
          this.$message.error('加载机器花样文件失败')
          // this.$nextTick(() => { // 以服务的方式调用的 Loading 需要异步关闭
          this.loadingInstance.close()
          // })
        })
      }
    },
    designsClose(e) {
      // console.log('关闭花样列表', e)
      this.drawer = false
      this.design4device = []
      // this.$nextTick(() => { // 以服务的方式调用的 Loading 需要异步关闭
      loadingInstance.close()
      // })
    },
    getUser() {
      getUserInfo().then(response => {
        // console.log(response)
        this.users = response.data
      })
    },
    getrMachines() {
      getrMachines().then(response => {
        this.machines = response.data
        this.refreshState()
      })
    },
    handleSuccess(response, file, fileList) {
      this.$alert('请确认是否需要重新设置短针过滤', '过滤开关提示', {
        confirmButtonText: '确定'
      })
      console.log(response)
      if (response.reason) {
        this.$message.error('上传失败：' + response.reason)
      } else {
        this.$message.success('版带上传成功')
      }
    },
    refreshState() {
      refreshState({}).then(response => {
        console.log('macstate', response)
        const machines = response.items
        for (var i = 0; i < machines.length; i++) {
          const machine = machines[i]
          const mac = machine.authCode
          const filename = machine.designName
          const patternStitch = machine.patternStitch
          const curStitch = machine.curStitch
          const reason = machine.reason
          const state = machine.state
          const userName = machine.userName
          const icon = this.users.find(e => e.name === userName)?.avatarUrl || ''
          const machineIndex = this.machines.findIndex(e => e.value === mac)
          const md = this.machines[machineIndex]
          md['id'] = machine.id
          md['curStitch'] = curStitch
          md['patternStitch'] = patternStitch
          md['percentage'] = Math.floor(curStitch ? curStitch / patternStitch * 100 : 0)
          md['userIcon'] = icon
          md['userName'] = userName
          md['states'] = state
          md['ss'] = state + ' (' + reason + ')'
          md['reason'] = (reason === '花样完成') ? '#5cb87a' : ((reason === '断线') ? '#aa3535' : ((reason === '手动') ? '#fff21a' : '#409eff'))
          this.machines.splice(machineIndex, 1, md)
          if (this.machines[machineIndex].filename && this.machines[machineIndex].curStitch !== curStitch) {
            // 刷新画面
            this.dstCanvas(this.machines[machineIndex].file, this.machines[machineIndex].value, 290, 180)
          }
          if (filename && this.machines[machineIndex].filename !== filename) {
            // 更换版带
            getDstFile({ file: filename, mac: mac }).then(response => {
              if (response.message === 200) {
                md['filename'] = response.filename
                md['file'] = response.data.data
                this.machines.splice(machineIndex, 1, md)
                this.dstCanvas(response.data.data, response.mac, 290, 180)
              }
            }, error => {
              console.log(error)
              md['filename'] = decodeURI(error.response?.data.filename)
              md['status'] = error.response?.data.message
              this.machines.splice(machineIndex, 1, md)
            }).catch(err => {
              console.log(err)
              this.$message.error('服务器未找到这个文件' + decodeURI(filename))
            })
          }
        }
      })
    },
    send_msg(e) {
      console.log(e)
      this.$prompt('请输入消息的内容', '发送消息到机器', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(({ value }) => {
        this.$message({
          type: 'success',
          message: '消息的内容是: ' + value + e
        })
        sendMsg({
          id: e,
          msg: value
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消发送'
        })
      })
    },
    dstCanvas: function(data, mac, w, h) {
      // var scale = window.devicePixelRatio
      // const dpr = window.devicePixelRatio
      const curStitch = this.machines.find(e => e.value === mac)?.curStitch
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
      const canvasHeight = h
      const canvasWidht = w
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
      const offsetx = designInfo.width * r < w ? (w - designInfo.width * r) / 2 : 0
      const offsety = designInfo.height * r < h ? (h - designInfo.height * r) / 2 : 0
      let x = designInfo.start.x * r + offsetx
      let y = designInfo.start.y * r + offsety
      let nowcolor = -1
      let step = -1
      canvas.width = w
      canvas.height = h
      context.scale(1, 1)
      context.translate(0.5, 0.5)
      context.lineWidth = r * 3
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
  .el-drawer__body {
    overflow:auto;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex: initial;
  }
  .filter-item {margin-right: 5px;}
  .filter-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .filter-container > * {
    margin: 8px;
  }
  .cctv,.info,.msg{
    display: block;
    position: absolute;
    top: -5px;
    right: -5px;
    z-index: 1;
  }
  .updateBox:hover .cctv{
    /* animation-duration: 3s; */
    /* animation-name: shake; */
    animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  @keyframes shake {
    0%{
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(0, 50px, 0);
  }
}
  .updateBox:hover .info{
    /* animation-duration: 3s; */
    /* animation-name: shake; */
    animation: infoshake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  @keyframes infoshake {
    0%{
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(0, 90px, 0);
  }
}
  .updateBox:hover .msg{
    /* animation-duration: 3s; */
    /* animation-name: shake; */
    animation: msgshake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  @keyframes msgshake {
    0%{
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(0, 130px, 0);
  }
}
  .dstView {
    height: 185px;
    background: whitesmoke;
  }
  .upload,.el-upload,.el-upload-dragger ,#divPlugin{
        width: 300px;
        height: 185px;
        position: relative;
  }
  .design{
    width: 120px;
    height: 210px;
    position: relative;
    margin-left: 14px;
  }
  .design .dstView {
    height: 110px;
    width: 110px;
    background: whitesmoke;
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
  .designCheckboxGroup{
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .updateBox {
    position: relative;
    padding-bottom: 15px;
  }
  .updateBox.el-checkbox{
    display: block;
    margin-right: 0;
    white-space: normal;
  }
  .updateBox .el-checkbox__label{
    padding-left: 0
  }
  .updateBox .el-checkbox__input{
    position: absolute;
    top: 0;
    left: 14px;
  }
  .patternAlert {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: 88%;
  }
  .design_text {
    display: block;
    color: #606266;
    font-size: 14px;
    text-align: center;
    word-wrap: normal;
    word-break: break-all;
  }
  .progress {
    width: 88%;
  }
  .macid .el-badge__content.is-fixed{
    top: 40px;
    right: 38px;
  }
</style>
