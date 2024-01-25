<template v-slot:test>
  <div class="drawer-container">
    <div>
      <h3 class="drawer-title">系统布局配置</h3>

      <div class="drawer-item">
        <span>主题色</span>
        <theme-picker style="float: right;height: 26px;margin: -3px 8px 0 0;" @change="themeChange" />
      </div>

      <div class="drawer-item">
        <span>开启 Tags-View</span>
        <el-switch v-model="tagsView" class="drawer-switch" />
      </div>

      <div class="drawer-item">
        <span>固定 Header</span>
        <el-switch v-model="fixedHeader" class="drawer-switch" />
      </div>

      <div class="drawer-item">
        <span>侧边栏 Logo</span>
        <el-switch v-model="sidebarLogo" class="drawer-switch" />
      </div>
      <h3 class="drawer-title">花样下发记录 <el-button size="mini" icon="el-icon-refresh" circle @click="getData()" /></h3>
      <vxe-grid
        ref="xTable"
        border
        show-header-overflow
        show-overflow
        show-footer
        highlight-hover-row
        resizable
        keep-source
        size="small"
        :loading="loading"
        :export-config="{}"
        :columns="tableColumn"
        :radio-config="{highlight: true}"
        :tooltip-config="{contentMethod: showTooltipMethod}"
        :data="list"
      >
        <template #operate="{ row }">
          <el-popconfirm title="确定要重新发送吗？" @onConfirm="reUploadRowEvent(row)">
            <vxe-button slot="reference" icon="el-icon-upload" title="重发" circle />
          </el-popconfirm>
        </template>
        <template #duration_default="{ row }">
          <span>{{ secondToDate(row.duration) }}</span>
        </template>
        <template #machine_default="{ row }">
          <span>{{ machineFormat(row.mac) }}</span>
        </template>
      </vxe-grid>
    </div>
  </div>
</template>

<script>
import ThemePicker from '@/components/ThemePicker'
import { getTask, reTask } from '@/api/user'

export default {
  components: { ThemePicker },
  data() {
    return {
      list: [],
      tableColumn: [
        { field: 'deviceCode', title: '机器', width: 50 },
        { field: 'designName', title: '花样名', width: 140, titlePrefix: { content: '悬停显示当前花样针数' }},
        { field: 'state', title: '状态', width: 80, titlePrefix: { content: '悬停显示失败原因' }},
        { field: 'createDate', title: '创建时间', width: 140 },
        { title: '操作', slots: { default: 'operate' }}
      ]
    }
  },
  computed: {
    fixedHeader: {
      get() {
        return this.$store.state.settings.fixedHeader
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'fixedHeader',
          value: val
        })
      }
    },
    showRightPanel() {
      console.log(this.$store.state)
      return this.$store.state.settings.showRightPanel
    },
    tagsView: {
      get() {
        return this.$store.state.settings.tagsView
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'tagsView',
          value: val
        })
      }
    },
    sidebarLogo: {
      get() {
        return this.$store.state.settings.sidebarLogo
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'sidebarLogo',
          value: val
        })
      }
    }
  },
  watch: {
    showRightPanel(value) {
      console.log('show: ', value)
      if (value) {
        this.getData()
      }
    }
  },
  methods: {
    themeChange(val) {
      this.$store.dispatch('settings/changeSetting', {
        key: 'theme',
        value: val
      })
    },
    reUploadRowEvent(e) {
      console.log(e)
      reTask({
        designName: e.designName,
        deviceCode: e.deviceCode,
        deviceModel: e.deviceModel,
        id: e.id
      }).then(response => {
        this.getData()
      })
    },
    getData() {
      getTask().then(response => {
        console.log(response)
        this.loading = false
        this.list = response.data
        this.columns = this.$refs.xTable.getColumns()
      })
    },
    showTooltipMethod({ type, column, row, items, _columnIndex }) {
      // console.log(column)
      const { property } = column
      if (property === 'designName' && type !== 'header') {
        console.log(row.designStitch)
        return row.designStitch
      }
      if (property === 'state' && type !== 'header') {
        console.log(row.reason)
        return row.reason
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.drawer-container {
  padding: 24px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;

  .drawer-title {
    margin-bottom: 12px;
    color: rgba(0, 0, 0, .85);
    font-size: 14px;
    line-height: 22px;
  }

  .drawer-item {
    color: rgba(0, 0, 0, .65);
    font-size: 14px;
    padding: 12px 0;
  }

  .drawer-switch {
    float: right
  }
}
</style>
<style>
.vxe-table--tooltip-wrapper {
    z-index: 100000 !important;
  }
  .el-popover {
    z-index: 1000000 !important;
  }
</style>
