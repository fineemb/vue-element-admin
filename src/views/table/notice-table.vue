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
      :context-menu="{body: {options: bodyMenus}}"
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
      @context-menu-click="contextMenuClickEvent"
    >
      <template #toolbar_buttons>
        <div class="filter-container">
          <el-date-picker v-model="listQuery.date" style="width: 380px;" class="filter-item" type="datetimerange" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" align="right" @change="handleFilter" />
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-refresh" @click="handleFilter" />
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-full-screen" @click="zoom" />
        </div>
      </template>
      <template #operate="{ row }">
        <el-popconfirm title="这条数据确定要删除吗？" @confirm="removeRowEvent(row)">
          <vxe-button slot="reference" icon="el-icon-delete" title="删除" circle />
        </el-popconfirm>
      </template>
    </vxe-grid>
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">
        <el-form-item label="时间范围" prop="timestamp">
          <!-- <el-date-picker v-model="temp.timestamp" type="datetime" placeholder="Please pick a date" /> -->
          <el-date-picker v-model="temp.date" class="filter-item" type="datetimerange" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" align="right" @change="handleFilter" />
        </el-form-item>
        <el-form-item label="机台">
          <el-select v-model="temp.machine" class="filter-item" placeholder="选择机器">
            <el-option v-for="item in machines" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="getDHData">
          确认
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { addData, getData, upData, delData, reDHData } from '@/api/user'
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
      dialogFormVisible: false,
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
      bodyMenus: [
        [
          { code: 'INSERT_AT_ROW_s', name: '新增数据' },
          { code: 'REVERT_CELL', name: '还原值', prefixIcon: 'vxe-icon-repeat' }
        ],
        [
          { code: 'CLEAR_FILTER', name: '清除筛选' },
          { code: 'CLEAR_ALL_FILTER', name: '清除所有筛选' },
          {
            name: '排序',
            children: [
              { code: 'CLEAR_SORT', name: '清除排序' },
              { code: 'SORT_ASC', name: '升序', prefixIcon: 'vxe-icon-sort-alpha-asc' },
              { code: 'SORT_DESC', name: '倒序', prefixIcon: 'vxe-icon-sort-alpha-desc' }
            ]
          }
        ]
      ],
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
        { field: 'id', title: 'ID', width: 80, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
        { field: 'title', title: '标题', width: 80, editRender: { name: 'input' }},
        { field: 'message', title: '内容', editRender: { name: 'input' }},
        { field: 'start', title: '开始时间', width: 170, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'end', title: '结束时间', width: 170, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'createTime', title: '创建时间', width: 170, editRender: { name: '$input', props: { type: 'datetime' }}},
        { title: '操作', width: 170, slots: { default: 'operate' }}
      ],
      editRules: {
        field: [
          { required: true, message: '必须包含标题' }
        ],
        message: [
          { required: true, message: '必须包含内容' }
        ],
        end: [
          { required: true, message: '必须包含结束时间' }
        ]
      },
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
        date: [],
        machine: ''
      },
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
    // this.getrOrders()
  },
  methods: {
    reData(e) {
      this.resetTemp()
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    getDHData() {
      var that = this
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          console.log(valid, this.temp)
          var data = {
            date: [dateMethods.toDateString(this.temp.date[0], 'yyyy-MM-dd HH:mm:ss'), dateMethods.toDateString(this.temp.date[1], 'yyyy-MM-dd HH:mm:ss')],
            machine: this.temp.machine
          }
          reDHData(data).then(() => {
            that.dialogFormVisible = false
            that.$notify({
              title: 'Success',
              message: '抓取数据成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
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
        'collection': 'notice',
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
    async editClosedEvent({ row, column }) {
      const $table = this.$refs.xTable
      const field = column.property
      const cellValue = row[field]
      // 判断单元格值是否被修改
      if ($table.isUpdateByRow(row, field)) {
        const newRow = { ...row }
        newRow.createTime = dateMethods.timestamp(newRow.createTime) / 1000
        newRow.end = dateMethods.timestamp(newRow.end) / 1000
        newRow.start = dateMethods.timestamp(newRow.start) / 1000
        newRow.id = newRow.id * 1
        delete newRow._XID
        delete newRow._X_ROW_KEY
        console.log('editClosedEvent', newRow)
        upData({ 'collection': 'notice', 'id': newRow._id, 'data': newRow }).then(response => {
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
        if (row.title && row.message && row.end && row.start) {
          this.createData(row)
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
        date: [],
        machine: ''
      }
    },
    handleCreate(row) {
      // console.log(e)
      const $grid = this.$refs.xTable
      $grid.insertAt({
        'id': null,
        'createTime': dateMethods.toDateString(new Date()),
        'end': row?.end ?? dateMethods.toDateString(new Date()),
        'start': dateMethods.toDateString(new Date()),
        'title': row?.title ?? '',
        'message': row?.message ?? ''
      }, row)
    },
    createData(data) {
      const that = this
      const newRow = { ...data }
      newRow.createTime = dateMethods.timestamp(newRow.createTime) / 1000
      newRow.end = dateMethods.timestamp(newRow.end) / 1000
      newRow.start = dateMethods.timestamp(newRow.start) / 1000
      newRow._id = newRow.createTime + '_notice'
      newRow.id = newRow.id * 1
      delete newRow._XID
      delete newRow._X_ROW_KEY
      console.log('记录到数据库', newRow)
      addData({
        collection: 'notice',
        data: newRow
      }).then(() => {
        that.$notify({
          title: '添加成功',
          message: '添加通知信息成功',
          type: 'success',
          duration: 2000
        })
      })
    },
    contextMenuClickEvent({ menu, row, column }) {
      const xGrid = this.$refs.xGrid
      switch (menu.code) {
        case 'INSERT_AT_ROW_s':
          this.handleCreate(row)
          xGrid.clearTreeExpandLoaded(row)
          break
        case 'reloadNodes':
          xGrid.reloadTreeChilds(row)
          break
        case 'expand':
          xGrid.setTreeExpand(row, true)
          break
        case 'contract':
          xGrid.setTreeExpand(row, false)
          break
      }
    },
    // 点击删除
    removeRowEvent(row) {
      console.log(row)
      delData({ 'collection': 'notice', 'id': row._id }).then(response => {
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

  .vxe-toolbar.size--small {
      height: auto;
    }
    .filter-item {margin-right: 5px;}
  </style>
