<template>
  <div class="app-container">
    <vxe-grid
      ref="xTable"
      border
      show-header-overflow
      show-overflow
      highlight-hover-row
      resizable
      keep-source
      size="small"
      :print-config="{isMerge:true}"
      :loading="loading"
      :export-config="{}"
      :pager-config="tablePage"
      :columns="tableColumn"
      :radio-config="{highlight: true}"
      :edit-config="{trigger: 'dblclick', mode: 'cell'}"
      :data="list"
      :toolbar-config="toolbarConfig"
      @edit-closed="editClosedEvent"
      @page-change="handlePageChange"
    >
      <template #toolbar_buttons>
        <div class="filter-container">
          <el-input v-model="listQuery.filename" placeholder="文件名称" style="width: 180px;" class="filter-item" @keyup.enter.native="handleFilter" />
          <el-select v-model="listQuery.machine" clearable placeholder="选择机器" style="width: 180px;" class="filter-item" @change="handleFilter">
            <el-option v-for="item in machines" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-refresh" @click="handleFilter">刷新</el-button>
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-full-screen" @click="zoom" />
        </div>
      </template>
      <template #operate="{ row }">
        <el-popconfirm title="这条数据确定要删除吗？" @onConfirm="removeRowEvent(row)">
          <vxe-button slot="reference" icon="el-icon-delete" title="删除" circle />
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
</template>

<script>
import { getData, upData, delData } from '@/api/user'
import waves from '@/directive/waves' // waves directive
import dateMethods from 'xe-utils/date'
// arr to obj, such as { CN : "China", US : "USA" }// 打印样式
export default {
  name: 'WagesTable',
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
      list: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      currentPage: 1,
      listQuery: {
        machine: undefined,
        filename: undefined
      },
      tablePage: {
        total: 1,
        currentPage: 1,
        pageSize: 20,
        align: 'left',
        pageSizes: [10, 20, 50, 100, 200, 500],
        layouts: ['Sizes', 'PrevJump', 'PrevPage', 'Number', 'NextPage', 'NextJump', 'FullJump', 'Total'],
        perfect: true
      },
      toolbarConfig: {
        slots: {
          buttons: 'toolbar_buttons'
        }
      },
      tableColumn: [
        { type: 'checkbox', width: 50 },
        { field: 'mac', title: '机器', width: 80, slots: { default: 'machine_default' }},
        { field: 'tapename', title: '文件名', width: 150 },
        { field: 'tapestitches', title: '针数', width: 100, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
        { field: 'mixHeads', title: '头数', width: 80, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
        { title: '工价', children: [
          { field: 'review.review_data.price', title: '元/千针', width: 100, editRender: { name: '$input', type: 'float', props: { type: 'float' }}},
          { field: 'review.review_data.price4m', title: '元/车', width: 100, editRender: { name: '$input', type: 'float', props: { type: 'float', digits: 1 }}},
          { field: 'review.review_data.appliqueS', title: '片/件', width: 100, editRender: { name: '$input', type: 'float', props: { type: 'number' }}},
          { field: 'review.review_data.appliquePrice', title: '分/片', width: 100, editRender: { name: '$input', type: 'float', props: { type: 'number' }}},
          { field: 'review.review_data.perk', title: '补贴', width: 100, editRender: { name: '$input', type: 'number', props: { type: 'number' }}}
        ] },
        { field: 'review.review_updateTime', title: '记录时间', width: 200, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'review.review_data.remark', title: '备注', editRender: { name: 'input' }},
        { title: '操作', slots: { default: 'operate' }}
      ],
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
      rules: {
        machine: [{ required: true, message: '必须选择机器', trigger: 'change' }],
        datetime: [{ type: 'date', required: true, message: '时间是必须的', trigger: 'change' }],
        userId: [{ required: true, message: '必须选择员工', trigger: 'change' }],
        shiftId: [{ required: true, message: '必须选择班次', trigger: 'change' }]
      },
      loading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    zoom(e) {
      this.$refs.xTable.zoom()
    },
    handlePageChange({ currentPage, pageSize }) {
      this.tablePage.currentPage = currentPage
      this.tablePage.pageSize = pageSize
      this.getList()
    },
    // 编辑实时更新数据
    editClosedEvent({ row, column }) {
      const $table = this.$refs.xTable
      const field = column.property
      const cellValue = row[field]
      // 判断单元格值是否被修改
      if ($table.isUpdateByRow(row, field)) {
        const newRow = { ...row }
        newRow.createTime = Math.round(dateMethods.timestamp(newRow.createTime) / 1000)
        newRow.tapestitches = newRow.tapestitches * 1
        newRow.mixHeads = newRow.mixHeads * 1
        delete newRow._XID
        delete newRow._X_ROW_KEY
        console.log('editClosedEvent', newRow)
        upData({ 'collection': 'wage-report', 'id': newRow._id, 'data': newRow }).then(response => {
          console.log(response)
          $table.reloadRow(row, null, field)
          this.$message({
            type: 'success',
            message: '数据已经更新为：' + cellValue + '!'
          })
        })
      }
    },
    getList() {
      this.loading = true
      this.listQuery.offset = (this.tablePage.currentPage - 1) * this.tablePage.pageSize
      this.listQuery.limit = this.tablePage.pageSize
      const fileName = this.listQuery.filename ? 'tapename: "' + this.listQuery.filename + '",' : ''
      const machine = this.listQuery.machine ? 'mac: "' + this.listQuery.machine + '",' : ''
      const s = {
        'collection': 'wage-report',
        'offset': (this.tablePage.currentPage - 1) * this.tablePage.pageSize,
        'limit': this.tablePage.pageSize,
        'where': fileName + machine,
        'orderBy': '"_id", "desc"'
      }
      getData(s).then(response => {
        const data = response.data.map(function(obj) {
          var rObj = obj
          rObj.review.review_updateTime = dateMethods.toDateString(new Date(rObj.review.review_updateTime * 1000))
          return rObj
        })
        this.list = data
        this.tablePage.total = response.pager.Total
        this.loading = false
      })
    },
    // 点击删除
    removeRowEvent(row) {
      delData({ 'collection': 'wage-report', 'id': row._id }).then(response => {
        console.log(response)
        this.getList()
        this.$message({
          type: 'success',
          message: '数据已经删除!'
        })
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    resetTemp() {
      this.temp = {
        machine: ''
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    machineFormat(value) {
      var s = value ? this.machines.find(item => item.value === value).label : value + '号'
      return s
    },
    handleVary(index, row) {
      console.log(index, row)
    },
    handleSizeChange(val) {
      console.log(`每页 ${val} 条`)
      this.pagesize = val
    },
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`)
      this.pageNum = val
    }
  }
}
</script>
<style>

.vxe-toolbar.size--small {
    height: auto;
  }
  .filter-item {margin-right: 5px;}
  .el-table .isSettled {
    background: #f0f9eb;
  }
</style>
