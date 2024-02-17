<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.orderID" placeholder="订单ID" style="width: 180px;" class="filter-item" @keyup.enter.native="handleFilter" />
      <el-date-picker v-model="listQuery.date" class="filter-item" type="datetimerange" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" align="right" @change="handleFilter" />
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-refresh" @click="handleFilter" />
      <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">
        导出
      </el-button>
    </div>
    <el-row :gutter="5">
      <el-col :xs="24" :sm="24" :lg="8"><div class="grid-content bg-purple" />
        <el-container>
          <el-header>入库信息</el-header>
          <el-main>
            <el-table
              v-loading="listLoading"
              :data="WV"
              show-summary
              border
              fit
              highlight-current-row
              style="width: 100%;"
            >
              <el-table-column sortable prop="color" label="颜色" />
              <el-table-column prop="bm" label="被面">
                <template slot-scope="scope">
                  <el-popover
                    placement="right"
                    width="500"
                    trigger="click"
                    @show="handleShowMore(scope.column, scope.row, 'WV')"
                  >
                    <el-table v-loading="listLoading" :data="MD">
                      <el-table-column :formatter="dateFormat" width="160" property="createTime" label="时间" />
                      <el-table-column width="50" property="size" label="尺码" />
                      <el-table-column width="50" property="qty" label="数量" />
                      <el-table-column property="remark" label="备注" />
                    </el-table>
                    <span slot="reference">{{ scope.row.bm }}</span>
                  </el-popover>
                </template>
              </el-table-column>
              <el-table-column prop="drz" label="单人枕">
                <template slot-scope="scope">
                  <el-popover
                    placement="right"
                    width="500"
                    trigger="click"
                    @show="handleShowMore(scope.column, scope.row, 'WV')"
                  >
                    <el-table v-loading="listLoading" :data="MD">
                      <el-table-column :formatter="dateFormat" width="160" property="createTime" label="时间" />
                      <el-table-column width="50" property="size" label="尺码" />
                      <el-table-column width="50" property="qty" label="数量" />
                      <el-table-column property="remark" label="备注" />
                    </el-table>
                    <span slot="reference">{{ scope.row.drz }}</span>
                  </el-popover>
                </template>
              </el-table-column>
              <el-table-column prop="xbz" label="小抱枕" />
              <el-table-column prop="bz" label="边子" />
              <el-table-column prop="fd" label="方垫" />
            </el-table>
          </el-main>
        </el-container>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="8"><div class="grid-content bg-purple" />
        <el-container>
          <el-header>生产信息</el-header>
          <el-main>
            <el-table
              v-loading="listLoading"
              :data="SE"
              border
              fit
              highlight-current-row
              style="width: 100%;"
            >
              <el-table-column sortable prop="_id" label="版带名" />
              <el-table-column prop="runHeads" label="数量(片)仅供参考">
                <template slot="header">
                  <el-tooltip class="item" effect="dark" content="请考虑组合头绣的情况，数值仅供参考" placement="top-start">
                    <span style="width: 100%;display: block;">件数</span>
                  </el-tooltip>
                </template>
              </el-table-column>
            </el-table>
          </el-main>
        </el-container>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="8"><div class="grid-content bg-purple" />
        <el-container>
          <el-header>出货信息</el-header>
          <el-main>
            <el-table
              v-loading="listLoading"
              :data="DV"
              show-summary
              border
              fit
              highlight-current-row
              style="width: 100%;"
            >
              <el-table-column sortable prop="color" label="颜色" />
              <el-table-column prop="bm" label="被面">
                <template slot-scope="scope">
                  <el-popover
                    placement="right"
                    width="500"
                    trigger="click"
                    @show="handleShowMore(scope.column, scope.row, 'DV')"
                  >
                    <el-table v-loading="listLoading" :data="MD">
                      <el-table-column :formatter="dateFormat" width="160" property="createTime" label="时间" />
                      <el-table-column width="50" property="size" label="尺码" />
                      <el-table-column width="50" property="qty" label="数量" />
                      <el-table-column property="remark" label="备注" />
                    </el-table>
                    <span slot="reference">{{ scope.row.bm }}</span>
                  </el-popover>
                </template>
              </el-table-column>
              <el-table-column prop="drz" label="单人枕">
                <template slot-scope="scope">
                  <el-popover
                    placement="right"
                    width="500"
                    trigger="click"
                    @show="handleShowMore(scope.column, scope.row, 'DV')"
                  >
                    <el-table v-loading="listLoading" :data="MD">
                      <el-table-column :formatter="dateFormat" width="160" property="createTime" label="时间" />
                      <el-table-column width="50" property="size" label="尺码" />
                      <el-table-column width="50" property="qty" label="数量" />
                      <el-table-column property="remark" label="备注" />
                    </el-table>
                    <span slot="reference">{{ scope.row.drz }}</span>
                  </el-popover>
                </template>
              </el-table-column>
              <el-table-column prop="xbz" label="小抱枕" />
              <el-table-column prop="bz" label="边子" />
              <el-table-column prop="fd" label="方垫" />
            </el-table>
          </el-main>
        </el-container>
      </el-col>
    </el-row>
    <pagination v-show="list.length>0" :total="list.length" :page.sync="pageNum" :limit.sync="pageSize" />
  </div>
</template>

<script>
// import { createArticle, updateArticle } from '@/api/article'
import { getUserInfo, getrOrders, getSchedule, getRunHeads, getCellData } from '@/api/user'
import waves from '@/directive/waves' // waves directive
// import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
// import Pagination from '@/components/Pagination' // secondary package based on el-pagination
// arr to obj, such as { CN : "China", US : "USA" }
export default {
  name: 'Schedule',
  components: { Pagination },
  directives: { waves },
  data() {
    return {
      showEdit: [],
      showBtn: [],
      showBtnOrdinary: true,
      tableKey: 0,
      list: [],
      DV: [],
      WV: [],
      SE: [],
      MD: [],
      total: 0,
      listLoading: false,
      pageNum: 1,
      pageSize: 10,
      currentPage: 1,
      listQuery: {
        orderID: [],
        date: undefined
      },
      orders: [],
      users: [],
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
      parts: [
        { value: 'bm', name: '被面', unit: '条' },
        { value: 'drz', name: '单人枕', unit: '对' },
        { value: 'xbz', name: '小抱枕', unit: '只' },
        { value: 'bz', name: '边子', unit: '米' },
        { value: 'xfz', name: '信封枕', unit: '对' },
        { value: 'fd', name: '方垫', unit: '只' },
        { value: 'oz', name: '欧枕', unit: '只' },
        { value: 'tgz', name: '糖果枕', unit: '只' }
      ],
      dialogFormVisible: false,
      dialogStatus: '',
      dialogPvVisible: false,
      pvData: [],
      downloadLoading: false
    }
  },
  created() {
    this.getUser()
    this.getrOrders()
  },
  methods: {
    getUser() {
      getUserInfo().then(response => {
        this.users = response.data
      })
    },
    getrOrders() {
      getrOrders().then(response => {
        console.log(response)
        var data = response.data
        var orders = []
        for (var i = 0; i < data.length; i++) {
          var order = data[i]
          var item = {
            value: order.orderID,
            label: order.orderName + '(' + order.customername + ')'
          }
          orders.push(item)
        }
        this.orders = orders
      })
    },
    getSE() {
      this.listLoading = true
      getRunHeads(this.listQuery).then(response => {
        this.SE = response.data
        this.listLoading = false
      })
    },
    getDV() {
      this.listLoading = true
      this.listQuery.type = 'DV'
      getSchedule(this.listQuery).then(response => {
        var data = response.data
        var res = data.map(function(item, index, ary) {
          const r = { color: item.color }
          r[item._id] = item.qty
          return r
        })
        // console.log(res)
        const ouput = res.reduce((re, obj) => {
          var item = re.find((o) => o.color === obj.color)
          item ? item = Object.assign(item, obj) : re.push(obj)
          //   re.push(s)
          return re
        }, [])
        this.DV = ouput
        console.log(ouput)
        this.listLoading = false

        this.getWV()
      })
    },
    getWV() {
      this.listLoading = true
      this.listQuery.type = 'WV'
      getSchedule(this.listQuery).then(response => {
        var data = response.data
        var res = data.map(function(item, index, ary) {
          const r = { color: item.color }
          r[item._id] = item.qty
          return r
        })
        // console.log(res)
        const ouput = res.reduce((re, obj) => {
          var item = re.find((o) => o.color === obj.color)
          item ? item = Object.assign(item, obj) : re.push(obj)
          //   re.push(s)
          return re
        }, [])
        this.WV = ouput
        console.log(ouput)
        this.listLoading = false
        this.getSE()
      })
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
    handleShowMore(column, row, type) {
      console.log(column, row)
      this.listQuery.color = row.color
      this.listQuery.part = column.property
      this.listQuery.type = type
      getCellData(this.listQuery).then(response => {
        console.log(response)
        this.MD = response.data
      })
    },
    handleFilter() {
      this.getDV()
    },
    handleDownload() {
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = ['日期', '客户', '订单', '颜色', '数量', '出入库']
        const filterVal = ['createTimes', 'customername', 'orderName', 'color', 'parts', 'type']
        const data = this.formatJson(filterVal)
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: 'table-list'
        })
        this.downloadLoading = false
      })
    }
  }
}
</script>
<style>
  .filter-item {margin-right: 5px;}
  td.qty ,td.qty>.cell{
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
    .el-header, .el-footer {
    background-color: #e2e7ee;
    color: #333;
    text-align: center;
    line-height: 60px;
  }

  .el-aside {
    background-color: #D3DCE6;
    color: #333;
    text-align: center;
    line-height: 200px;
  }
  body > .el-container {
    margin-bottom: 40px;
  }
</style>
