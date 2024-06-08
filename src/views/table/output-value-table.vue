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
      :grid-options="gridOptions"
      :context-menu="{body: {options: bodyMenus}}"
      :print-config="{isMerge:true}"
      :loading="loading"
      :export-config="{}"
      :columns="tableColumn"
      :radio-config="{highlight: true}"
      :edit-config="{trigger: 'dblclick', mode: 'cell'}"
      :data="list"
      :filter-method="filterMethod"
      :cell-style="cellStyle"
      :footer-method="footerMethod"
      :toolbar-config="toolbarConfig"
    >
      <template #toolbar_buttons>
        <div class="filter-container">
          <el-input v-model="listQuery.customerID" placeholder="客户ID" style="width: 180px;" class="filter-item" @keyup.enter.native="handleFilter" />
          <el-date-picker
            v-model="listQuery.date"
            show-lunar
            class="filter-item el-date-picker"
            type="datetimerange"
            :picker-options="pickerOptions"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            align="right"
            @change="handleFilter"
          />
          <el-dropdown class="filter-item" split-button type="primary" @command="handleBatch">
            显示
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="settled">{{ listQuery.showSettled?'隐藏已结算':'显示已结算' }}</el-dropdown-item>
              <el-dropdown-item command="orderBy">{{ listQuery.orderBy==='desc'?'倒序显示':'顺序显示' }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-dropdown class="filter-item" split-button type="primary" @command="printAndExport">
            导出与打印
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="printEvent">打印</el-dropdown-item>
              <el-dropdown-item command="exportDataEvent">导出</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-refresh" @click="handleFilter">刷新</el-button>
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-full-screen" @click="zoom" />
        </div>
        <div class="filter-container">
          <vxe-checkbox v-for="(column,index) in columns" :key="index" v-model="column.visible" @change="refreshColEvent">{{ column.title }}</vxe-checkbox>
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
import { delData, outputValue } from '@/api/user'
import waves from '@/directive/waves' // waves directive
import LunarCalendar from 'lunar-calendar' // waves directive
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
      columns: [],
      total: 0,
      pageNum: 1,
      pageSize: 10,
      currentPage: 1,
      listQuery: {
        showSettled: false
      },
      ColEvent: {
        WV: true,
        DV: true,
        diff: true
      },
      toolbarConfig: {
        slots: {
          buttons: 'toolbar_buttons'
        }
      },
      bodyMenus: [
        // 自行自定义 code 的功能，自己实现更灵活
        [
          { code: 'myCode', name: '自定义的菜单' }
        ],
        // 引入 vxe-table-plugin-menus 之后可以直接使用以下内置 code，使用最简单
        [
          { code: 'CLEAR_CELL', name: '清除内容 (Del)' },
          { code: 'COPY_CELL', name: '复制 (Ctrl+C)', prefixIcon: 'vxe-icon-copy' },
          { code: 'CUT_CELL', name: '剪贴 (Ctrl+X)', prefixIcon: 'vxe-icon-cut' },
          { code: 'PASTE_CELL', name: '粘贴 (Ctrl+V)', prefixIcon: 'vxe-icon-paste' }
        ],
        [
          { code: 'INSERT_AT_ROW', name: '新增行' },
          { code: 'DELETE_ROW', name: '删除行' },
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
          { code: 'PRINT_ALL', name: '打印', prefixIcon: 'vxe-icon-print', params: { columns: ['name', 'role', 'sex', 'num', 'age'] }},
          { code: 'EXPORT_ALL', name: '导出 CSV', prefixIcon: 'vxe-icon-download', params: { filename: '导出数据', type: 'csv' }}
        ]
      ],
      tableColumn: [
        { field: 'customerID', title: '客户', width: 80 },
        { field: '_id', title: '订单ID', width: 120 },
        { field: 'name', title: '订单名', width: 150 },
        { field: 'size', title: '尺码', width: 80 },
        { title: '数量', children: [
          { field: 'WV', title: '入库', width: 80, editRender: { name: 'input' }},
          { field: 'DV', title: '出库', width: 80, editRender: { name: 'input' }},
          { field: 'diff', title: '差值', width: 80, sortable: true, editRender: { name: 'input' }}
        ] },
        { field: 'price', title: '单价', width: 80, editRender: { name: 'input' }},
        { field: 'remark', title: '备注', editRender: { name: 'input' }}
      ],
      rules: {
        machine: [{ required: true, message: '必须选择机器', trigger: 'change' }],
        datetime: [{ type: 'date', required: true, message: '时间是必须的', trigger: 'change' }],
        userId: [{ required: true, message: '必须选择员工', trigger: 'change' }],
        shiftId: [{ required: true, message: '必须选择班次', trigger: 'change' }]
      },
      pickerOptions: {
        cellClassName: date => {
          const now = new Date(date)
          const y = now.getFullYear()
          const m = now.getMonth() + 1
          const day = now.getDate()
          const { lunarMonthName, lunarDayName } = LunarCalendar.solarToLunar(y, m, day)
          return `lunar-cell-month-${lunarMonthName} lunar-cell-day-${lunarDayName} `
        },
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
      loading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    refreshColEvent() {
      const $table = this.$refs.xTable
      if ($table) {
        $table.refreshColumn()
      }
    },
    zoom(e) {
      this.$refs.xTable.zoom()
    },
    getList() {
      // if (!this.listQuery.customerID) return
      this.loading = true
      const s = {
        'customerID': this.listQuery.customerID,
        'showSettled': this.listQuery.showSettled,
        'date': this.listQuery.date
      }
      outputValue(s).then(response => {
        console.log(response)
        this.loading = false
        this.list = response.data
        this.columns = this.$refs.xTable.getColumns()
      })
    },
    sumNum(list) {
      let count = 0
      list.forEach(item => {
        count += Number((item['price'] ? item['price'] : 0) * (item['DV'] ? item['DV'] : 0))
      })
      return count + '元'
    },
    footerMethod({ columns, data }) {
      console.log(data, columns)
      return [
        columns.map((column, columnIndex) => {
          if (columnIndex === 4) {
            return '总计'
          }
          if (columnIndex === 5) {
            return this.sumNum(data)
          }
          return null
        })
      ]
    },
    cellStyle({ row, column }) {
      if (column.field === 'diff') {
        let color = {}
        if (row.diff) {
          color = {
            backgroundColor: '#f9faa257'
          }
          if (row.diff < -5) {
            color = {
              backgroundColor: '#a9ff9e'
            }
          }
          if (row.diff < -10) {
            color = {
              backgroundColor: '#7dfd6d'
            }
          }
          if (row.diff < -20) {
            color = {
              backgroundColor: '#56b94a',
              color: 'white'
            }
          }
          if (row.diff > 5) {
            color = {
              backgroundColor: '#fbb7b7'
            }
          }
          if (row.diff > 10) {
            color = {
              backgroundColor: '#ff7e7e'
            }
          }
          if (row.diff > 20) {
            color = {
              backgroundColor: '#f94747',
              color: 'white'
            }
          }
        }
        if (row.diff === null) {
          if (row.WV) {
            color = {
              backgroundColor: '#a52a2a',
              color: 'white'
            }
          }
        }
        return color
      }
    },
    printAndExport(e) {
      if (e === 'printEvent') {
        // 打印
        this.$refs.xTable.openPrint({
          sheetName: '订单结算明细（纺艺刺绣）',
          style: printStyle,
          beforePrintMethod: ({ content }) => {
            // 拦截打印之前，返回自定义的 html 内容
            return `
      <h1 class="title">订单结算明细（纺艺刺绣）</h1>
      <div class="my-top">
      </div>
      ` + content + `
      <div class="my-bottom">
        <div class="my-list-row">
          <div class="my-list-col">创建人：泛艺工作室</div>
          <div class="my-list-col">结算截至日期（在此日期之前开出的送货单）：` + dateMethods.toDateString(new Date()) + `</div>
          <div class="my-list-col">客户签字：_________________________</div>
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
    // 点击删除
    removeRowEvent(row) {
      delData({ 'collection': 'orders', 'id': row._id }).then(response => {
        console.log(response)
        this.getList()
        this.$message({
          type: 'success',
          message: '数据已经删除!'
        })
      })
    },
    handleBatch(e) {
      console.log(e)
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

      // this.ColEvent[e] ? this.hideColEvent(e) : this.showColEvent(e)
      // this.ColEvent[e] = !this.ColEvent[e]
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
    },
    onFocus() {
      setTimeout(() => {
        const tds = [...document.querySelectorAll('.el-date-table__row td')]
        console.log(tds)
        tds.forEach(item => {
          const cls = item.classList[item.classList.length - 1].split('-')
          item.querySelector('div').dataset.content = cls[cls.length - 1]
        })
      }, 1) //  不加上定时器的话，会首先执行这个函数，然后在生成dom
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
  .el-picker-panel td div:after {
      content: attr(data-content);
      display: block;
      height: 20px;
      font-size: 12px;
      margin-top: 10px;
      opacity: 0.4;
    }

    .el-picker-panel td div span {
      flex: 1;
    }

    .el-date-table td.today div::after {
      color: #409EFF;
      font-weight: 700;
    }

    .el-picker-panel td div {
      display: flex;
      height: 40px;
      justify-content: space-between;
      flex-direction: column;
    }

    .el-date-table td.current:not(.disabled) div {
      color: #fff;
      background-color: #409EFF;
    }

    .el-date-table td.current:not(.disabled) span {
      color: #FFF;
      background-color: transparent;
    }
</style>
