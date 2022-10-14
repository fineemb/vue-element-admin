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
      show-footer
      size="small"
      :footer-method="footerMethod"
      :footer-cell-class-name="footerCellClassName2"
      :loading="loading"
      :export-config="{}"
      :pager-config="tablePage"
      :columns="tableColumn"
      :radio-config="{highlight: true}"
      :edit-config="{trigger: 'dblclick', mode: 'cell'}"
      :toolbar-config="toolbarConfig"
      :data="list"
      @edit-closed="editClosedEvent"
      @page-change="handlePageChange"
    >
      <template #toolbar_buttons>
        <div class="filter-container">
          <el-cascader v-model="listQuery.orderID" class="filter-item" placeholder="订单选择" :options="orders" :props="{ multiple: true, checkStrictly: true }" filterable allow-create default-first-option clearable @change="handleFilter" />
          <el-select v-model="listQuery.type" clearable placeholder="出入库" class="filter-item" @change="handleFilter">
            <el-option v-for="item in [{label:'出货',value:'DV'},{label:'入库',value:'WV'}]" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-input v-model="listQuery.factory" placeholder="加工场" style="width: 110px;" class="filter-item" clearable @keyup.enter.native="handleFilter" />
          <el-date-picker v-model="listQuery.date" class="filter-item" type="datetimerange" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" align="right" @change="handleFilter" />
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-refresh" @click="handleFilter">刷新</el-button>
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
              <el-dropdown-item command="settled">{{ listQuery.showSettled?'隐藏已结算':'显示已结算' }}</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button v-waves class="filter-item" type="primary" icon="el-icon-full-screen" @click="zoom" />
        </div>
      </template>
      <template v-slot:files_default="{ row, column }">
        <span>
          <el-button v-if="row.files && row.files.length>0" :data-url="row.files?row.files[0]:''" type="primary" plain icon="el-icon-picture" circle @click.native="handleShowPic(column,row)" />
        </span>
      </template>
      <template v-slot:type_default="{ row }">
        <span>{{ row.type==="DV"?"出货":"入库" }}</span>
      </template>
    </vxe-grid>
  </div>
</template>

<script>
import { getUserInfo, getData, upData, delData, getrOrders, getDownloadUrl, updateIsSettled } from '@/api/user'
import waves from '@/directive/waves' // waves directive
// import { parseTime } from '@/utils'
import dateMethods from 'xe-utils/date'
// import Pagination from '@/components/Pagination' // secondary package based on el-pagination
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
  name: 'OrdersTable',
  directives: { waves },
  data() {
    return {
      list: [],
      loading: true,
      listQuery: {
        customerID: undefined,
        orderID: [],
        type: undefined,
        color: undefined,
        date: undefined,
        showSettled: false,
        factory: undefined
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
        { field: 'customername', title: '客户', width: 80 },
        { field: 'factory', title: '加工场', width: 80, editRender: { name: 'input' }},
        { field: 'orderID', title: '订单ID', width: 100 },
        { field: 'orderName', title: '订单名', width: 80 },
        { field: 'color', title: '颜色', width: 80 },
        { field: 'size', title: '规格', width: 80 },
        { field: 'partName', title: '部位', width: 80 },
        { field: 'type', title: '出入库', slots: { default: 'type_default' }, width: 80 },
        { field: 'qty', title: '数量', width: 80, editRender: { name: '$input', props: { type: 'number' }}},
        { field: 'price', title: '单价', width: 80 },
        { field: 'sum', title: '小计', width: 80 },
        { field: 'files', title: '底单', slots: { default: 'files_default' }, width: 60 },
        { field: 'createTimes', title: '记录时间', width: 240, editRender: { name: '$input', props: { type: 'datetime' }}},
        { field: 'remark', title: '备注', editRender: { name: 'input' }}
      ],
      orders: [],
      users: [],
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
      }
    }
  },
  created() {
    this.getrOrders()
    this.getUser()
  },
  methods: {
    zoom(e) {
      this.$refs.xTable.zoom()
    },
    printAndExport(e) {
      if (e === 'printEvent') {
        // 打印
        this.$refs.xTable.openPrint({
          sheetName: '出入库流水',
          style: printStyle,
          beforePrintMethod: ({ content }) => {
            // 拦截打印之前，返回自定义的 html 内容
            return `
      <h1 class="title">出入库流水</h1>
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
      ` + content + `
      <div class="my-bottom">
        <div class="my-list-row">
          <div class="my-list-col"></div>
          <div class="my-list-col">创建人：泛艺智造</div>
          <div class="my-list-col">创建日期：` + dateMethods.toDateString(new Date()) + `</div>
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
    getUser() {
      getUserInfo().then(response => {
        // console.log(response)
        this.users = response.data
      })
    },
    getrOrders() {
      getrOrders().then(response => {
        console.log(response)
        var data = response.data
        this.order = data
        for (var i = 0; i < data.length; i++) {
          var order = data[i]
          var item = {
            value: order.orderID,
            label: order.orderName + '(' + order.customername + ')',
            children: []
          }

          var colors = order.colors
          if (colors) {
            for (var t = 0; t < colors.length; t++) {
              var color = colors[t]
              var titem = {
                value: color,
                label: color
              }
              item.children.push(titem)
            }
          }
          this.orders.push(item)
        }
        this.getList()
      })
    },
    handlePageChange({ currentPage, pageSize }) {
      this.tablePage.currentPage = currentPage
      this.tablePage.pageSize = pageSize
      this.getList()
    },
    getList() {
      this.loading = true
      var customerID = this.listQuery.customerID ? 'customerID: "' + this.listQuery.customerID + '",' : ''
      var showSettled = !this.listQuery.showSettled ? 'isSettled:_.exists(false).or(_.eq(false)),' : ''
      // var orderID = this.listQuery.orderID && this.listQuery.orderID.length > 0 ? 'orderID: "' + this.listQuery.orderID + '",' : ''
      var order = this.listQuery.orderID
      var orderID = []
      var color = []
      if (order && order.length > 0) {
        orderID = Array.from(new Set(order.map(function(col, i) {
          return col[0]
        }))).filter(word => word !== undefined)
        color = Array.from(new Set(order.map(function(col, i) {
          return col[1]
        }))).filter(word => word !== undefined)
      }
      if (color.length > 0) color = 'color:_.or(["' + color.join('","') + '"]),'
      if (orderID.length > 0) orderID = 'orderID:_.or(["' + orderID.join('","') + '"]),'
      var factory = this.listQuery.factory ? 'factory: "' + this.listQuery.factory + '",' : ''
      var type = this.listQuery.type ? 'type: "' + this.listQuery.type + '",' : ''
      var date = this.listQuery.date ? 'createTimes:(_.and(_.gte(' + Math.round(Date.parse(this.listQuery.date[0]) / 1000) + '), _.lte(' + Math.round(Date.parse(this.listQuery.date[1]) / 1000) + '))),' : ''
      const s = {
        'collection': 'iolist',
        'offset': (this.tablePage.currentPage - 1) * this.tablePage.pageSize,
        'limit': this.tablePage.pageSize,
        'where': customerID + showSettled + orderID + color + type + date + factory,
        'orderBy': '"createTimes","desc"'
      }
      getData(s).then(response => {
        const data = response.data.map(function(obj) {
          var rObj = obj
          rObj['createTimes'] = dateMethods.toDateString(obj.createTimes * 1000)
          return rObj
        })
        // 兼容老版数据格式
        const newData = []
        for (var i = 0; i < data.length; i++) {
          const item = data[i]
          if (item.partID === 'bm') {
            const price = this.order.find(e => e.orderID === item.orderID).price ?? 0
            item['price'] = price
            item['sum'] = price * item.qty
          }
          if (item.parts) {
            for (var n = 0; n < item.parts.length; n++) {
              newData.push({
                color: item.color,
                createTimes: item.createTimes,
                customerID: item.customerID,
                customername: item.customername,
                files: item.files,
                isSettled: item.isSettled ?? false,
                orderID: item.orderID,
                orderName: item.orderName,
                type: item.type,
                remark: item.remark,
                partID: item.parts[n].name,
                partName: item.parts[n].name,
                qty: item.parts[n].qty,
                size: item.parts[n].size ?? ''
              })
            }
          } else {
            newData.push(item)
          }
        }
        this.list = newData
        this.tablePage.total = response.pager.Total
        console.log(response)
        this.showEdit = []
        this.showBtn = []
        this.loading = false
      })
    },
    sumNum(list, field) {
      let count = 0
      list.forEach(item => {
        count += Number(item[field])
      })
      return count + '元'
    },
    footerCellClassName2({ $rowIndex, columnIndex }) {
      if ($rowIndex === 0) {
        if (columnIndex === 1 || columnIndex === 2 || columnIndex === 3 || columnIndex === 7 || columnIndex === 8 || columnIndex === 9) {
          return 'col-grey1'
        }
        return 'col-grey'
      }
    },
    footerMethod({ columns, data }) {
      console.log(data, columns)
      const bm = data.filter(e => e.partID === 'bm').reduce((total, currentValue, currentIndex, arr) => { return total + currentValue.qty * 1 }, 0)
      const drz = data.filter(e => e.partID === 'drz').reduce((total, currentValue, currentIndex, arr) => { return total + currentValue.qty * 1 }, 0)
      const xbz = data.filter(e => e.partID === 'xbz').reduce((total, currentValue, currentIndex, arr) => { return total + currentValue.qty * 1 }, 0)
      const ss = data.filter(e => e.partID === 'bm').reduce((total, currentValue, currentIndex, arr) => { return total + currentValue.sum * 1 }, 0)
      const s = data.filter(e => e.partID === 'bm' && e.size === '小码').reduce((total, currentValue, currentIndex, arr) => { return total + currentValue.qty * 1 }, 0)
      const m = data.filter(e => e.partID === 'bm' && e.size === '标准').reduce((total, currentValue, currentIndex, arr) => { return total + currentValue.qty * 1 }, 0)
      const l = data.filter(e => e.partID === 'bm' && e.size === '加大').reduce((total, currentValue, currentIndex, arr) => { return total + currentValue.qty * 1 }, 0)
      return [
        columns.map((column, columnIndex) => {
          if (columnIndex === 1) {
            return '单人枕'
          }
          if (columnIndex === 2) {
            return '被面'
          }
          if (columnIndex === 3) {
            return '小抱枕'
          }
          if (columnIndex === 7) {
            return '小码'
          }
          if (columnIndex === 8) {
            return '标准'
          }
          if (columnIndex === 9) {
            return '加大'
          }
          if (columnIndex === 9) {
            return '总计'
          }
          return null
        }),
        columns.map((column, columnIndex) => {
          if (columnIndex === 1) {
            return drz
          }
          if (columnIndex === 2) {
            return bm
          }
          if (columnIndex === 3) {
            return xbz
          }
          if (columnIndex === 7) {
            return s
          }
          if (columnIndex === 8) {
            return m
          }
          if (columnIndex === 9) {
            return l
          }
          if (columnIndex === 11) {
            return ss
          }
          return null
        })
      ]
    },
    handleFilter() {
      this.getList()
    },
    IOFormat(row, column) {
      var value = row[column.property]
      var s = value === 'DV' ? '出库' : '入库'
      return s
    },
    partFormat(row, column) {
      var value = row[column.property]
      var s = this.parts.find(item => item.value === value).name
      return s
    },
    // 点击删除
    handleDelete(index, row) {
      const that = this
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        delData({ 'collection': 'iolist', 'id': row._id }).then(response => {
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
    handleShowPic(index, row) {
      console.log(index, row)
      const file = row.files[0]
      getDownloadUrl({ fileid: file }).then(response => {
        console.log(response)
        this.$notify({
          title: '底单查看',
          dangerouslyUseHTMLString: true,
          duration: 0,
          message: `<image style="max-width: 550px; height: 900px;object-fit: scale-down;"
                  src="` + response.file_list[0].download_url + `"></image>`
        })
      })
    },
    handleBatch(e) {
      console.log(e)
      if (this.multipleSelection && this.multipleSelection.length > 0 && e === 'isSettled') {
        // 标记为已结算
        updateIsSettled(this.multipleSelection).then(response => {
          console.log(response)
          this.getList()
          this.$message({
            type: 'success',
            message: '已经全部标记为已结算!'
          })
        })
      }
      if (e === 'print') {
        // 标记为已结算
        this.print = !this.print
      }
      if (e === 'settled') {
        // 标记为已结算
        this.listQuery.showSettled = !this.listQuery.showSettled
        this.getList()
      }
    },
    // 编辑实时更新数据
    editClosedEvent(e) {
      const newRow = { ...e.row }
      newRow.createTimes = dateMethods.timestamp(newRow.createTimes) / 1000
      console.log('editClosedEvent', newRow)
      delete newRow._XID
      upData({ 'collection': 'iolist', 'id': newRow._id, 'data': newRow }).then(response => {
        console.log(response)
        this.$message({
          type: 'success',
          message: '数据已经更新!'
        })
      })
    }
  }
}
</script>
<style>
  .filter-item {margin-right: 5px;}
  .el-table__row > td {

    padding: 0;
  }
  .grid-head,.grid-content {
    border-top: 1px solid #dfe6ec;
    border-right: 1px solid #dfe6ec;
    line-height: 30px;
        padding: 0 10px;
  }

  .bg-purple.qty {
    border-right: none;
  }
  .bg-purple.size > span {
    color:transparent
  }
  .parts.index0 > .el-col >*{
    border-top: none;
  }
  .parts.index0 {
    background: #F5F7FA;
  }
  .bg-purple.grid-head {
    border-top: none;
  }
  .el-notification {
    width: 550px;
  }
  .el-table .isSettled {
    background: #f0f9eb;
  }
  .el-table .isNumber {
    background: #f0f9eb
  }
  .col-grey {
    background-color: #f8f8f9;
  }
  .col-grey1 {
    background-color: #dedee4;
  }
</style>
