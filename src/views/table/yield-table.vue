<template>
  <div class="app-container">
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
      :edit-rules="editRules"
      :print-config="{}"
      :loading="loading"
      :export-config="{}"
      :pager-config="tablePage"
      :columns="tableColumn"
      :radio-config="{highlight: true}"
      :edit-config="{trigger: 'dblclick', mode: 'cell'}"
      :data="list"
      :footer-method="footerMethod"
      :toolbar-config="toolbarConfig"
      @edit-closed="editClosedEvent"
      @page-change="handlePageChange"
    >
      <template #toolbar_buttons>
        <div class="filter-container">
          <el-input v-model="listQuery.filename" placeholder="花样名称" style="width: 110px;" class="filter-item" clearable @keyup.enter.native="handleFilter" />
          <!-- <el-cascader v-model="listQuery.filename" class="filter-item" placeholder="订单选择" :options="orders" :props="{ expandTrigger: 'hover' }" filterable allow-create default-first-option clearable @change="handleFilter" /> -->
          <el-select v-model="listQuery.machine" clearable placeholder="选择机器" class="filter-item" @change="handleFilter">
            <el-option v-for="item in machines" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="listQuery.userId" clearable placeholder="选择员工" class="filter-item" @change="handleFilter">
            <el-option v-for="item in users" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="listQuery.reason" multiple clearable placeholder="选择事件" class="filter-item" @change="handleFilter">
            <el-option v-for="item in reasons" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-date-picker v-model="listQuery.date" class="filter-item" type="datetimerange" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" align="right" @change="handleFilter" />
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-refresh" @click="handleFilter" />
          <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
            添加事件
          </el-button>
          <el-dropdown class="filter-item" split-button type="primary" @command="printAndExport">
            导出与打印
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="printEvent">打印</el-dropdown-item>
              <el-dropdown-item command="exportDataEvent">导出</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
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
      <template #reason_default="{ row }">
        <span>{{ reasonFormat(row) }}</span>
      </template>
    </vxe-grid>
  </div>
</template>

<script>
import { getUserInfo, addYield, getData, upData, delData, getrOrders } from '@/api/user'
import waves from '@/directive/waves' // waves directive
import dateMethods from 'xe-utils/date'
// arr to obj, such as { CN : "China", US : "USA" }
// 打印样式
const printStyle = `
      .title {
        text-align: center;
      }
      .my-list-row {
        display: inline-block;
        width: 100%;
      }
      .my-list-col {
        float: left;
        width: 33.33%;
        height: 28px;
        line-height: 28px;
      }
      .my-top,
      .my-bottom {
        font-size: 12px;
      }
      .my-top {
        margin-bottom: 5px;
      }
      .my-bottom {
        margin-top: 30px;
        text-align: right;
      }
      `

// 打印顶部内容模板
const topHtml = `
      <h1 class="title">生产流水</h1>
      <div class="my-top">
        <div class="my-list-row">
          <div class="my-list-col">商品名称：vxe-table</div>
          <div class="my-list-col">发货单号：X2665847132654</div>
          <div class="my-list-col">发货日期：2020-09-20</div>
        </div>
        <div class="my-list-row">
          <div class="my-list-col">收货姓名：小徐</div>
          <div class="my-list-col">收货地址：火星第七区18号001</div>
          <div class="my-list-col">联系电话：10086</div>
        </div>
      </div>
      `

// 打印底部内容模板
const bottomHtml = `
      <div class="my-bottom">
        <div class="my-list-row">
          <div class="my-list-col"></div>
          <div class="my-list-col">创建人：小徐</div>
          <div class="my-list-col">创建日期：2020-09-20</div>
        </div>
      </div>
      `
export default {
  name: 'YieldTable',
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
      showBtnOrdinary: true,
      tableKey: 0,
      list: [],
      total: 0,
      loading: true,
      listQuery: {
        page: 1,
        limit: 10,
        reason: undefined,
        machine: undefined,
        filename: undefined,
        date: undefined,
        userId: undefined
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
        { field: 'mac', title: '机器', width: 80 },
        { field: 'userId', title: '员工', width: 80, editRender: {}},
        { field: 'shiftId', title: '班次', width: 80, editRender: { name: '$select', options: [{ label: '白班', value: 1 }, { label: '夜班', value: 0 }], props: { placeholder: '请选择班次' }}},
        { field: 'logTime', title: '登录时间', width: 200, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'patternName', title: '文件名', width: 120, editRender: { name: 'input' }},
        { field: 'countNum', title: '完成针数', width: 100, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
        { field: 'runHeads', title: '片数', width: 80, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
        { field: 'reason', title: '事件', slots: { default: 'reason_default' }, width: 100 },
        { field: 'start', title: '开始时间', width: 200, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'end', title: '完成时间', width: 200, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'duration', title: '持续时间', width: 150, slots: { default: 'duration_default' }},
        { field: 'createTime', title: '记录时间', width: 200, editRender: { name: '$input', props: { type: 'datetime' }}},
        { title: '操作', slots: { default: 'operate' }}
      ],
      editRules: {
        mac: [
          { required: true, message: '必须选择机器' }
        ],
        userId: [
          { required: true, message: '必须选择员工' }
        ],
        shiftId: [
          { required: true, message: '必须选择班次' }
        ],
        reason: [
          { required: true, message: '必须选择事件' }
        ]
      },
      orders: [],
      users: [],
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
      shift: [{
        'shiftId': 0,
        'label': '夜班'
      }, {
        'shiftId': 1,
        'label': '白班'
      }, {
        'shiftId': 2,
        'label': ''
      }],
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '这个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setDate(1)
            start.setHours(0, 0, 0)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '上个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setMonth(start.getMonth() ? start.getMonth() - 1 : 11)
            if (start.getMonth() === 0) { start.setFullYear(start.getFullYear - 1) }
            start.setDate(1)
            start.setHours(0, 0, 0)
            end.setDate(1)
            end.setHours(0, 0, 0)
            picker.$emit('pick', [start, end])
          }
        }]
      },
      temp: {
        mac: '',
        datetime: new Date(),
        userId: '',
        shiftId: '',
        operateType: 2
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: '添加事件'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        machine: [{ required: true, message: '必须选择机器', trigger: 'change' }],
        datetime: [{ type: 'date', required: true, message: '时间是必须的', trigger: 'change' }],
        userId: [{ required: true, message: '必须选择员工', trigger: 'change' }],
        shiftId: [{ required: true, message: '必须选择班次', trigger: 'change' }]
      }
    }
  },
  created() {
    this.getList()
    this.getUser()
    this.getrOrders()
  },
  methods: {
    zoom(e) {
      this.$refs.xTable.zoom()
    },
    printAndExport(e) {
      if (e === 'printEvent') {
        // 打印
        this.$refs.xTable.openPrint({
          sheetName: '打印出货单据',
          style: printStyle,
          beforePrintMethod: ({ content }) => {
            // 拦截打印之前，返回自定义的 html 内容
            return topHtml + content + bottomHtml
          }
        })
      }
      if (e === 'exportDataEvent') {
        // 导出数据
        this.$refs.xTable.openExport()
      }
    },
    handleChange(value) {
      console.log(value)
    },
    getUser() {
      getUserInfo().then(response => {
        console.log(response)
        this.users = response.data.map(function(j) { return { 'value': j.userId * 1, 'label': j.name } })
        this.$set(this.tableColumn, 1, { field: 'mac', title: '机器', width: 80, editRender: { name: '$select', options: this.machines, props: { placeholder: '请选择机器' }}})
        this.$set(this.tableColumn, 8, { field: 'reason', title: '事件', width: 80, editRender: { name: '$select', options: this.reasons, props: { placeholder: '请选择事件' }}, slots: { default: 'reason_default' }})
        this.$set(this.tableColumn, 2, { field: 'userId', title: '员工', width: 80, editRender: { name: '$select', options: this.users, props: { placeholder: '请选择员工' }}})
      })
    },
    getrOrders() {
      getrOrders().then(response => {
        console.log(response)
        var data = response.data
        for (var i = 0; i < data.length; i++) {
          var order = data[i]
          var item = {
            value: order.orderID,
            label: order.orderName + '(' + order.customername + ')',
            children: []
          }

          var tapes = order.tapes
          if (tapes) {
            for (var t = 0; t < tapes.length; t++) {
              var tape = tapes[t]
              var titem = {
                value: tape.filename,
                label: tape.part + '(' + tape.filename + ')'
              }
              item.children.push(titem)
            }
          }
          this.orders.push(item)
        }
      })
    },
    handlePageChange({ currentPage, pageSize }) {
      this.tablePage.currentPage = currentPage
      this.tablePage.pageSize = pageSize
      this.getList()
    },
    getList() {
      this.loading = true
      this.listQuery.offset = (this.tablePage.currentPage - 1) * this.tablePage.pageSize
      this.listQuery.limit = this.tablePage.pageSize
      const fileName = (this.listQuery.filename && this.listQuery.filename.length > 1) ? 'patternName: /' + this.listQuery.filename + '.*/i,' : ''
      const machine = this.listQuery.machine ? 'mac: "' + this.listQuery.machine + '",' : ''
      const user = this.listQuery.userId ? 'userId: ' + this.listQuery.userId + ',' : ''
      const reason = this.listQuery.reason && this.listQuery.reason.length > 0 ? 'reason:_.in([' + this.listQuery.reason.join(',') + ']),' : ''
      const date = this.listQuery.date ? 'end:' + '_.gt(' + Math.round(Date.parse(this.listQuery.date[0]) / 1000) + ').and(_.lt(' + Math.round(Date.parse(this.listQuery.date[1]) / 1000) + '))' + ',' : ''
      const s = {
        'collection': 'dahaoyield',
        'offset': (this.tablePage.currentPage - 1) * this.tablePage.pageSize,
        'limit': this.tablePage.pageSize,
        'where': fileName + date + reason + user + machine,
        'orderBy': '"end", "desc"'
      }
      getData(s).then(response => {
        const data = response.data.map(function(obj) {
          var rObj = obj
          rObj['createTime'] = dateMethods.toDateString(obj.createTime * 1000)
          rObj['start'] = dateMethods.toDateString(obj.start * 1000)
          rObj['end'] = dateMethods.toDateString(obj.end * 1000)
          rObj['logTime'] = dateMethods.toDateString(obj.logTime * 1000)
          return rObj
        })
        this.list = data
        this.tablePage.total = response.pager.Total
        console.log(response)
        this.showBtn = []
        this.loading = false
      })
    },
    // 编辑实时更新数据
    editClosedEvent({ row, column }) {
      const $table = this.$refs.xTable
      const field = column.property
      const cellValue = row[field]
      // 判断单元格值是否被修改
      if ($table.isUpdateByRow(row, field)) {
        const newRow = { ...row }
        newRow.createTime = dateMethods.timestamp(newRow.createTime) / 1000
        newRow.end = dateMethods.timestamp(newRow.end) / 1000
        newRow.logTime = dateMethods.timestamp(newRow.logTime) / 1000
        newRow.start = dateMethods.timestamp(newRow.start) / 1000
        newRow.runHeads = newRow.runHeads * 1
        newRow.countNum = newRow.countNum * 1
        newRow.userId = newRow.userId * 1
        delete newRow._XID
        delete newRow._X_ROW_KEY
        console.log('editClosedEvent', newRow)
        upData({ 'collection': 'dahaoyield', 'id': newRow._id, 'data': newRow }).then(response => {
          console.log(response)
          // 局部更新单元格为已保存状态
          $table.reloadRow(row, null, field)
          this.$message({
            type: 'success',
            message: '数据已经更新为：' + cellValue + '!'
          })
        })
      }
      if ($table.isInsertByRow(row)) {
        console.log(row)
        if (row.mac && row.userId !== null && row.reason && row.shiftId !== null) {
          if (row.reason === 8) {
            this.$confirm('选择上下班', '提示', {
              distinguishCancelAndClose: true,
              confirmButtonText: '下班',
              cancelButtonText: '上班',
              type: 'warning'
            }).then(() => {
              row.operateType = 1
              this.$message({
                type: 'success',
                message: '下班'
              })
              this.createData(row)
            }).catch(action => {
              if (action === 'cancel') {
                row.operateType = 0
                this.$message({
                  type: 'success',
                  message: '上班'
                })
                this.createData(row)
              }
            })
          } else {
            this.createData(row)
          }
        } else {
          this.$message({
            type: 'error',
            message: '请选择必填选项!'
          })
        }
      }
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
        type: 'success'
      })
      row.status = status
    },
    resetTemp() {
      this.temp = {
        mac: '',
        datetime: new Date(),
        userId: '',
        shiftId: '',
        operateType: 2
      }
    },
    handleCreate() {
      const $grid = this.$refs.xTable
      $grid.insert({
        '_id': null,
        'countNum': 0,
        'createTime': dateMethods.toDateString(new Date()),
        'duration': null,
        'end': dateMethods.toDateString(new Date()),
        'logTime': dateMethods.toDateString(new Date()),
        'mac': '',
        'patternName': '',
        'patternStitch': 0,
        'reason': null,
        'runHeads': 0,
        'shiftId': null,
        'start': dateMethods.toDateString(new Date()),
        'type': 1,
        'user': '',
        'userId': null
      })
      // this.resetTemp()
      // this.dialogStatus = 'create'
      // this.dialogFormVisible = true
      // this.$nextTick(() => {
      //   this.$refs['dataForm'].clearValidate()
      // })
    },
    createData(data) {
      const that = this
      const newRow = { ...data }
      newRow.createTime = dateMethods.timestamp(newRow.createTime) / 1000
      newRow.end = dateMethods.timestamp(newRow.end) / 1000
      newRow.logTime = dateMethods.timestamp(newRow.logTime) / 1000
      newRow.start = dateMethods.timestamp(newRow.start) / 1000
      newRow.runHeads = newRow.runHeads * 1
      newRow.countNum = newRow.countNum * 1
      newRow.userId = newRow.userId * 1
      newRow._id = newRow.createTime + '_' + newRow.mac + '_yield'
      delete newRow._XID
      delete newRow._X_ROW_KEY
      console.log('记录到数据库', newRow)
      addYield(newRow).then(() => {
        that.$notify({
          title: 'Success',
          message: 'Created Successfully',
          type: 'success',
          duration: 2000
        })
      })
    },
    // 点击删除
    removeRowEvent(row) {
      delData({ 'collection': 'dahaoyield', 'id': row._id }).then(response => {
        console.log(response)
        this.getList()
        this.$message({
          type: 'success',
          message: '数据已经删除!'
        })
      })
    },
    reasonFormat(row) {
      var value = row.reason
      var operateType = row.operateType !== undefined ? (row.operateType ? '下班打卡' : '上班打卡') : (this.reasons.find(item => item.value === value)?.label)
      return operateType
    },
    secondToDate(result) {
      var h = Math.floor(result / 1000 / 3600)
      var m = Math.floor((result / 1000 / 60 % 60))
      var s = Math.floor((result / 1000 % 60))
      return result ? ((h ? h + '' : '') + (h ? '时' : '') + m + '分' + s + '秒') : ''
    },
    sumNum(list, field) {
      let count = 0
      list.forEach(item => {
        count += Number(item[field])
      })
      return count
    },
    footerMethod({ columns, data }) {
      console.log(data, columns)
      return [
        columns.map((column, columnIndex) => {
          if (columnIndex === 0) {
            return '合计'
          }
          if (['runHeads'].includes(column.property)) {
            return this.sumNum(data, column.property)
          }
          return null
        })
      ]
    },
    handleDelete(index, row) {
      const that = this
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
      }).catch(() => {
        that.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    }
  }
}
</script>
<style>
  .filter-item {margin-right: 5px;}
</style>
