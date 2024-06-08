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
      :cell-style="cellStyle"
      :print-config="{isMerge:true}"
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
          <el-input v-model="listQuery.filename" placeholder="订单名称" style="width: 110px;" class="filter-item" @keyup.enter.native="handleFilter" />
          <el-select v-model="listQuery.machine" clearable placeholder="选择机器" style="width: 110px;" class="filter-item" @change="handleFilter">
            <el-option v-for="item in machines" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="listQuery.creator" clearable placeholder="选择员工" style="width: 110px;" class="filter-item" @change="handleFilter">
            <el-option v-for="item in users" :key="item.userId" :label="item.name" :value="item.name" />
          </el-select>
          <el-select v-model="listQuery.shiftID" clearable placeholder="选择班次" style="width: 110px;" class="filter-item" @change="handleFilter">
            <el-option v-for="item in [{shiftID:0,name:'夜班'},{shiftID:1,name:'白班'}]" :key="item.shiftID" :label="item.name" :value="item.shiftID" />
          </el-select>
          <el-date-picker v-model="listQuery.date" class="filter-item" type="datetimerange" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" align="right" @change="handleFilter" />
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-refresh" @click="handleFilter" />
          <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
            补记工资
          </el-button>
          <el-dropdown class="filter-item" split-button type="primary" @command="handleBatch">
            批处理
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="isSettled">标记为已结算</el-dropdown-item>
              <el-dropdown-item command="noSettled" disabled>标记为未结算</el-dropdown-item>
              <el-dropdown-item command="del" divided disabled>删除</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-dropdown class="filter-item" split-button type="primary" @command="printAndExport">
            导出与打印
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="printEvent">打印</el-dropdown-item>
              <el-dropdown-item command="exportDataEvent">导出</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-dropdown class="filter-item" split-button type="primary" @command="handleBatch">
            显示
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="print">{{ print?'显示全部':'打印模式' }}</el-dropdown-item>
              <el-dropdown-item command="settled">{{ listQuery.showSettled?'隐藏已结算':'显示已结算' }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-full-screen" @click="zoom" />
        </div>
        <div class="filter-container">
          <vxe-checkbox v-for="(column,index) in columns" :key="index" v-model="column.visible" @change="refreshColEvent">{{ column.title }}</vxe-checkbox>
        </div>
      </template>
      <template #operate="{ row }">
        <vxe-button icon="fa fa-trash" title="删除" circle @click="removeRowEvent(row)" />
      </template>
      <template #duration_default="{ row }">
        <span>{{ secondToDate(row.duration) }}</span>
      </template>
      <template #user_default="{ row }">
        <span>{{ userFormat(row.userId) }}</span>
      </template>
      <template #machine_default="{ row }">
        <span>{{ machineFormat(row.machineMac) }}</span>
      </template>
    </vxe-grid>
  </div>
</template>

<script>
import { createArticle, updateArticle } from '@/api/article'
import { getUserInfo, getData, upData, delData, updateIsSettled } from '@/api/user'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import dateMethods from 'xe-utils/date'
import * as Printjs from 'print-js'
// arr to obj, such as { CN : "China", US : "USA" }// 打印样式
const printStyle = `
      table {font-size: 8px;}
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
      tfoot {
        display: table-row-group;
      }
      `
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
      ds: 0,
      ns: 0,
      showEdit: [],
      showBtn: [],
      showBtnOrdinary: true,
      print: false,
      tableKey: 0,
      list: [],
      columns: [],
      multipleSelection: [],
      total: 0,
      listLoading: true,
      pageNum: 1,
      pageSize: 10,
      currentPage: 1,
      listQuery: {
        machine: undefined,
        filename: undefined,
        date: undefined,
        creator: undefined,
        showSettled: false
      },
      ColEvent: {
        WV: true,
        createTime: true,
        machineMac: true
      },
      users: [],
      bodyMenus: [
        [
          { code: 'INSERT_AT_ROW', name: '新增行' },
          { code: 'DELETE_ROW', name: '删除行' },
          { code: 'EDIT_CELL', name: '编辑' },
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
        ],
        // 引入 vxe-table-plugin-menus 之后可以直接使用以下内置 code，使用最简单
        [
          { code: 'PRINT_ALL', name: '打印', prefixIcon: 'vxe-icon-print', params: { columns: ['machineMac', 'shiftId', 'tapename', 'stitches', 'machinenum', 'basepay', 'bonus', 'perk', 'unitPrice', 'review_data.price4m', 'endtime', 'review_data.remark'] }},
          { code: 'EXPORT_ALL', name: '导出 CSV', prefixIcon: 'vxe-icon-download', params: { filename: '导出数据', type: 'csv' }}
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
      mergeFooterItems: [
        { row: 0, col: 0, rowspan: 1, colspan: 8 }
      ],
      toolbarConfig: {
        slots: {
          buttons: 'toolbar_buttons'
        }
      },
      tableColumn: [
        { type: 'checkbox', width: 40 },
        { field: 'machineMac', title: '机器', width: 50, slots: { default: 'machine_default' }},
        { field: 'userId', title: '员工', width: 70, slots: { default: 'user_default' }},
        { field: 'shiftId', title: '班次', width: 70, editRender: { name: '$select', options: [{ label: '白班', value: 1 }, { label: '夜班', value: 0 }], props: { placeholder: '请选择班次' }}},
        { field: 'tapename', title: '文件名', width: 200 },
        { field: 'stitches', title: '总针数', width: 90, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
        { field: 'unitNum', title: '片数', width: 70, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
        { field: 'machinenum', title: '车数', width: 70, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
        { title: '工资', children: [
          { field: 'basepay', title: '基本', width: 70, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
          // { field: 'applique', title: '贴布', width: 80, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
          { field: 'bonus', title: '改车', width: 70, editRender: { name: '$input', type: 'number', props: { type: 'number' }}},
          { field: 'perk', title: '补贴', width: 70, editRender: { name: '$input', type: 'number', props: { type: 'number' }}}
        ] },
        { field: 'unitPrice', title: '元/千针', width: 80, editRender: { name: '$input', type: 'float', props: { type: 'float' }}},
        { field: 'review_data.price4m', title: '元/车', width: 80, editRender: { name: '$input', type: 'float', props: { type: 'float', digits: 1 }}},
        { field: 'createTime', title: '上班', width: 150, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'endtime', title: '下班', width: 200, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'createTime', title: '记录时间', width: 150, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'review_data.remark', title: '备注', editRender: { name: 'input' }}
      ],

      footerData: [
        ['和值', '666', '', '1', ''],
        ['平均', '', 'xx', '', '666']
      ],
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
        machine: '',
        datetime: new Date(),
        userId: '',
        shiftId: '',
        addTypevalue: 2
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
      },
      loading: false
    }
  },
  created() {
    this.getList()
    this.getUser()
  },
  methods: {
    refreshColEvent() {
      const $table = this.$refs.xTable
      if ($table) {
        $table.refreshColumn()
      }
    },
    cellStyle({ row, rowIndex, column }) {
      if (row.isSettled) {
        return {
          backgroundColor: '#187',
          color: '#ffffff'
        }
      }
    },
    zoom(e) {
      this.$refs.xTable.zoom()
    },
    handleChange(value) {
      console.log(value)
    },
    getUser() {
      getUserInfo().then(response => {
        // console.log(response)
        this.users = response.data
      })
    },
    handlePageChange({ currentPage, pageSize }) {
      this.tablePage.currentPage = currentPage
      this.tablePage.pageSize = pageSize
      this.getList()
    },
    printAndExport(e) {
      if (e === 'printEvent') {
        // 打印
        this.$refs.xTable.openPrint({
          sheetName: '工资结算明细',
          style: printStyle,
          beforePrintMethod: ({ content }) => {
            // 拦截打印之前，返回自定义的 html 内容
            return `
      <h1 class="title">工资结算明细</h1>
      <div class="my-top">
        <div class="my-list-row">
          <div class="my-list-col">员工：` + [...new Set(this.list.map(a => a.creator))].join(',') + `</div>
          <div class="my-list-col">班次：白班(` + this.ds + ')  夜班(' + this.ns + `)</div>
          <div class="my-list-col">机台：` + [...new Set(this.list.map(a => a.machineID))].join(',') + `</div>
        </div>
      </div>
      ` + content + `
      <div class="my-bottom">
        <div class="my-list-row">
          <div class="my-list-col">创建人：泛艺工作室</div>
          <div class="my-list-col">创建日期：` + dateMethods.toDateString(new Date()) + `</div>
          <div class="my-list-col">员工签字：_________________________</div>
        </div>
      </div>
      `
          }
        })
      }
      if (e === 'exportDataEvent') {
        // 导出数据
        this.$refs.xTable.openExport()
      }
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
        newRow.endtime = dateMethods.timestamp(newRow.endtime) / 1000
        newRow.logTime = dateMethods.timestamp(newRow.logTime) / 1000
        newRow.starttime = dateMethods.timestamp(newRow.starttime) / 1000
        newRow.stitches = newRow.stitches * 1
        newRow.shiftId = newRow.shiftId * 1
        newRow.unitNum = newRow.unitNum * 1
        newRow.unitPrice = newRow.unitPrice * 1
        newRow.userId = newRow.userId * 1
        newRow.price = newRow.price * 1
        newRow.basepay = newRow.basepay * 1
        newRow.bonus = newRow.bonus * 1
        delete newRow._XID
        delete newRow._X_ROW_KEY
        console.log('editClosedEvent', newRow)
        upData({ 'collection': 'workdatas', 'id': newRow._id, 'data': newRow }).then(response => {
          console.log(response)
          // 局部更新单元格为已保存状态
          $table.reloadRow(row, null, field)
          this.$message({
            type: 'success',
            message: '数据已经更新为：' + cellValue + '!'
          })
        })
      }
    },
    getList() {
      this.ds = 0
      this.ns = 0
      this.loading = true
      this.listQuery.offset = (this.tablePage.currentPage - 1) * this.tablePage.pageSize
      this.listQuery.limit = this.tablePage.pageSize
      const fileName = this.listQuery.filename ? 'tapename: /' + this.listQuery.filename + '/i,' : ''
      const machine = this.listQuery.machine ? 'machineMac: "' + this.listQuery.machine + '",' : ''
      const user = this.listQuery.creator ? 'creator: "' + this.listQuery.creator + '",' : ''
      const showSettled = !this.listQuery.showSettled ? 'isSettled:_.exists(false).or(_.eq(false)),' : ''
      const shiftID = this.listQuery.shiftID === '' || this.listQuery.shiftID === undefined ? '' : 'shiftId: ' + this.listQuery.shiftID + ','
      const date = this.listQuery.date ? 'endtime:' + '_.gt(' + Math.round(Date.parse(this.listQuery.date[0]) / 1000) + ').and(_.lt(' + Math.round(Date.parse(this.listQuery.date[1]) / 1000) + '))' + ',' : ''
      const s = {
        'collection': 'workdatas',
        'offset': (this.tablePage.currentPage - 1) * this.tablePage.pageSize,
        'limit': this.tablePage.pageSize,
        'where': fileName + date + user + machine + shiftID + showSettled,
        'orderBy': '"endtime", "desc"'
      }
      getData(s).then(response => {
        const data = response.data.map(function(obj) {
          var rObj = obj
          rObj['createTime'] = dateMethods.toDateString(obj.createTime * 1000)
          rObj['starttime'] = dateMethods.toDateString(obj.starttime * 1000)
          rObj['endtime'] = dateMethods.toDateString(obj.endtime * 1000)
          rObj['logTime'] = dateMethods.toDateString(obj.logTime * 1000)
          rObj['basepay'] = Math.round(obj.basepay)
          rObj['perk'] = Math.round(obj.perk + (obj.applique ? obj.applique : 0))
          return rObj
        })
        this.list = data
        this.tablePage.total = response.pager.Total
        this.loading = false
        this.columns = this.$refs.xTable.getColumns()
      })
    },
    sumNum(list, field) {
      let count = 0
      list.forEach(item => {
        count += Number(item[field] ? item[field] : 0)
      })
      return count + '元'
    },
    footerMethod({ columns, data }) {
      console.log(data, columns)
      const days = []
      const night = []
      const d = dateMethods
      for (var i = 0; i < data.length; i++) {
        if (data[i].shiftId === 1) days.push(d.toDateString(data[i].endtime, 'yyyyMMdd'))
        if (data[i].shiftId === 0) night.push(d.toDateString(data[i].endtime, 'yyyyMMdd'))
      }
      this.ds = [...new Set(days)].length
      this.ns = [...new Set(night)].length
      return [
        columns.map((column, columnIndex) => {
          if (column.field === 'machinenum') {
            return '合计'
          }
          if (['basepay', 'applique', 'bonus', 'perk'].includes(column.property)) {
            return this.sumNum(data, column.property)
          }
          return null
        }),
        columns.map((column, columnIndex) => {
          if (column.field === 'machinenum') {
            return '总计'
          }
          if (column.field === 'basepay') {
            let count = 0
            data.forEach(row => {
              count += row.basepay * 1
              count += row.bonus * 1
              count += row.perk * 1
            })
            return count + '元'
          }
          return null
        })
      ]
    },
    footerColspanMethod({ _rowIndex, _columnIndex }) {
      // if (_rowIndex === 1) {
      //   if (_columnIndex === 0) {
      //     return {
      //       rowspan: 1,
      //       colspan: 8
      //     }
      //   } else if (_columnIndex === 1) {
      //     return {
      //       rowspan: 1,
      //       colspan: 9
      //     }
      //   }
      // }
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
    handleSelectionChange(val) {
      console.log(val)
      this.multipleSelection = val
    },
    handleBatch(e) {
      console.log(e)
      const $table = this.$refs.xTable
      const checkboxRecords = $table.getCheckboxRecords()
      if (checkboxRecords && checkboxRecords.length > 0 && e === 'isSettled') {
        console.log(checkboxRecords)
        // 标记为已结算
        updateIsSettled({ item: checkboxRecords }).then(response => {
          console.log(response)
          this.getList()
          this.$message({
            type: 'success',
            message: '已经全部标记为已结算!'
          })
        })
      }
      if (e === 'print') {
        // 打印模式
        this.print = !this.print
      }
      if (e === 'settled') {
        // 标记为已结算
        this.listQuery.showSettled = !this.listQuery.showSettled
        this.getList()
      }
      if (e === 'orderBy') {
        // 排序
        this.listQuery.orderBy === 'desc' ? this.listQuery.orderBy = 'asc' : this.listQuery.orderBy = 'desc'
        this.getList()
      }
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        machine: '',
        datetime: new Date(),
        userId: '',
        shiftId: '',
        addTypevalue: 2
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
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.temp.id = parseInt(Math.random() * 100) + 1024 // mock a id
          this.temp.author = 'vue-element-admin'
          createArticle(this.temp).then(() => {
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.timestamp = +new Date(tempData.timestamp) // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464
          updateArticle(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'machineMac') {
          return this.machines.find(item => item.value === v[j]).label
        } else if (j === 'endtime') {
          return parseTime(v[j])
        } else if (j === 'userId') {
          return v[j] ? this.users.find(item => item.userId === v[j]).name : ''
        } else {
          return v[j]
        }
      }))
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    },
    dateFormat(row, column) {
      if (!row[column.property]) return '无'
      var value = row[column.property].$date || row[column.property] * 1000
      const date = new Date(value)
      const y = date.getFullYear()
      let MM = date.getMonth() + 1
      MM = MM < 10 ? ('0' + MM) : MM
      let d = date.getDate()
      d = d < 10 ? ('0' + d) : d
      let h = date.getHours()
      h = h < 10 ? ('0' + h) : h
      let m = date.getMinutes()
      m = m < 10 ? ('0' + m) : m
      let s = date.getSeconds()
      s = s < 10 ? ('0' + s) : s
      return y + '-' + MM + '-' + d + ' ' + h + ':' + m + ':' + s
    },
    unitPriceFormat(row, column) {
      var value = row[column.property]
      return (row.review_data && row.review_data.price4m) ? '=>' : value
    },
    shiftFormat(value) {
      return (value === 0 || value === 1) ? this.shift.find(item => item.shiftId === value).label : ''
    },
    userFormat(value) {
      var s = value ? (this.users.find(item => item.userId * 1 === value)?.name) : '--'
      return s
    },
    machineFormat(value) {
      var s = value ? this.machines.find(item => item.value === value).label : value + '号'
      return s
    },
    //  直接引用  css文件
    printHtmlCss() {
      const style = '@page { margin: 0 } @media print { h1 { color: blue } .el-table thead.is-group th {background: #F5F7FA;} td {    border-bottom: 1px solid #dfe6ec;}}' // 直接写样式
      Printjs({
        printable: 'container',
        type: 'html',
        css: [
          'https://unpkg.com/element-ui/lib/theme-chalk/index.css'
        ], // 引入css文件
        style: style,
        scanStyles: false
      })
    },
    printHtmlCustomStyle() {
      const style = '@page { margin: 0 } @media print { h1 { color: blue } }' // 直接写样式
      Printjs({
        printable: 'container',
        type: 'html',
        style: style,
        scanStyles: false
      })
    },
    // 点击编辑
    handleEdit(index, row) {
      console.log(index, row)
      this.showEdit[index] = true
      this.showBtn[index] = true
      this.$set(this.showEdit, index, true)
      this.$set(this.showBtn, index, true)
    },
    // 取消编辑
    handleCancel(index) {
      console.log(index)
      //  this.getData();
      this.showEdit[index] = false
      this.showBtn[index] = false
      this.$set(this.showEdit, index, false)
      this.$set(this.showBtn, index, false)
    },
    // 点击删除
    handleDelete(index, row) {
      const that = this
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        delData({ 'collection': 'dahaoyield', 'id': row._id }).then(response => {
          console.log(response)
          this.getList()
          this.$message({
            type: 'success',
            message: '数据已经删除!'
          })
        })
      }).catch(() => {
        that.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    getWagesSummaries(param) {
      const { columns, data } = param
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = ''
          return
        }

        const values = data.map(item => Number(item[column.property]))
        if (column.property === 'basepay' || column.property === 'overtime' || column.property === 'bonus' || column.property === 'perk') {
          sums[index] = values.reduce((prev, curr) => {
            const value = Number(curr)
            if (!isNaN(value)) {
              return Math.round(prev + curr)
            } else {
              return Math.round(prev)
            }
          }, 0)
          sums[index] += ' 元'
        } else {
          sums[index] = ''
        }
      })

      return sums
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
    },
    tableRowClassName({ row, rowIndex }) {
      if (row.isSettled) {
        return 'isSettled'
      }
      return ''
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
