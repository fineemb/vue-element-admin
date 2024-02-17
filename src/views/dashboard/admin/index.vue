<template>
  <div class="dashboard-editor-container">
    <panel-group @handleSetLineChartData="handleSetLineChartData" />
    <el-row style="background:#fff;padding:16px 16px 0;margin-bottom:32px;">
      <!-- <el-row :gutter="32"> -->
      <el-col :xs="24" :sm="24" :lg="17">
        <el-menu
          :default-active="activeIndex1"
          class="el-menu-demo"
          mode="horizontal"
          @select="handleSelect"
          @dblclick="full"
        >
          <el-menu-item index="1">产量数据统计</el-menu-item>
          <el-menu-item index="2">工资数据分析</el-menu-item>
          <el-menu-item index="3">生产时序统计</el-menu-item>
          <el-menu-item index="4">设备状态数据分析</el-menu-item>
          <el-menu-item index="5">白夜班数据分离</el-menu-item>
        </el-menu>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="7">
        <el-date-picker
          v-model="date"
          class="filter-item el-date-picker"
          type="datetimerange"
          :picker-options="pickerOptions"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="margin-top: 10px;"
        />
      </el-col>
    </el-row>
    <line-chart id="linechart" :chart-data="lineChartData" :chart-load="lineChartLoad" height="500px" />
    <!-- </el-row> -->
    <el-row :gutter="32">
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <raddar-chart />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <pie-chart />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <bar-chart />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="8">
      <el-col :xs="{span: 24}" :sm="{span: 24}" :md="{span: 24}" :lg="{span: 12}" :xl="{span: 12}" style="padding-right:8px;margin-bottom:30px;">
        <!-- <transaction-table /> -->
      </el-col>
      <el-col :xs="{span: 24}" :sm="{span: 12}" :md="{span: 12}" :lg="{span: 6}" :xl="{span: 6}" style="margin-bottom:30px;">
        <todo-list />
      </el-col>
      <el-col :xs="{span: 24}" :sm="{span: 12}" :md="{span: 12}" :lg="{span: 6}" :xl="{span: 6}" style="margin-bottom:30px;">
        <box-card />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import eventBus from '../../../utils/eventBus'
import PanelGroup from './components/PanelGroup'
import LineChart from './components/LineChart'
import RaddarChart from './components/RaddarChart'
import PieChart from './components/PieChart'
import BarChart from './components/BarChart'
import TodoList from './components/TodoList'
import BoxCard from './components/BoxCard'
import LunarCalendar from 'lunar-calendar' // waves directive
import { beFull } from 'be-full'
import dateMethods from 'xe-utils/date'

export default {
  name: 'DashboardAdmin',
  components: {
    PanelGroup,
    LineChart,
    RaddarChart,
    PieChart,
    BarChart,
    TodoList,
    BoxCard
  },
  data() {
    return {
      activeIndex1: '1',
      lineChartData: {},
      OSChartData: {},
      StatesChartData: {},
      lineChartLoad: false,
      date: null,
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
      }
    }
  },
  created() {
    eventBus.$on('message', this.message)
  },
  mounted() {
    this.$nextTick(() => {
      console.log('sendMsg')
      eventBus.$emit('sendMsg', { 'cmd': 'getYield', data: {
        format: '%Y-%m'
      }})
    })
  },
  beforeDestroy() {
    eventBus.$off()
  },
  methods: {
    handleSelect(e) {
      console.log(e)
      if (e === '1') this.getYield()
      if (e === '2') this.getPay()
      if (e === '3') this.getOS()
      if (e === '4') this.getStates()
      if (e === '5') this.getDNpay()
    },
    getYield() {
      this.lineChartLoad = true
      console.log('getYield')
      eventBus.$emit('sendMsg', { 'cmd': 'getYield', data: {
        format: '%Y-%m'
      }})
    },
    full(e) {
      console.log(e)
      beFull(document.getElementById('linechart'), '#ffffff')
    },
    getPay() {
      console.log('getPay')
      this.lineChartLoad = true
      eventBus.$emit('sendMsg', { 'cmd': 'getPay', data: this.date ? { start: dateMethods.timestamp(this.date[0]) / 1000, end: dateMethods.timestamp(this.date[1]) / 1000 } : null })
    },
    getOS() {
      this.lineChartLoad = true
      eventBus.$emit('sendMsg', { 'cmd': 'getOS', data: {}})
    },
    getStates() {
      this.lineChartLoad = true
      eventBus.$emit('sendMsg', { 'cmd': 'getStates', data: {}})
    },
    getDNpay() {
      this.lineChartLoad = true
      eventBus.$emit('sendMsg', { 'cmd': 'getDNpay', data: this.date ? { start: dateMethods.timestamp(this.date[0]) / 1000, end: dateMethods.timestamp(this.date[1]) / 1000 } : null })
    },
    handleSetLineChartData() {
      eventBus.$emit('sendMsg', { 'cmd': 'getYield', data: {
        format: '%Y-%m-%d'
      }})
    },
    message(res) {
      // console.log(res)
      if (res.type === 'getYield') {
        console.log('dashboard', res)
        this.lineChartLoad = false
        this.lineChartData = res.data
        console.log(res)
      }

      if (res.type === 'getOS') {
        this.lineChartLoad = false
        this.lineChartData = res.data
      }

      if (res.type === 'getStates') {
        this.lineChartLoad = false
        this.lineChartData = res.data
      }
      if (res.type === 'getDNpay') {
        this.lineChartLoad = false
        this.lineChartData = res.data
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 32px;
  background-color: rgb(240, 242, 245);
  position: relative;

  .github-corner {
    position: absolute;
    top: 0px;
    border: 0;
    right: 0;
  }

  .chart-wrapper {
    background: #fff;
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}

@media (max-width:1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}
</style>
