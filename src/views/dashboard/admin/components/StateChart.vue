<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'
import dateMethods from 'xe-utils/date'

export default {
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '350px'
    },
    autoResize: {
      type: Boolean,
      default: true
    },
    schartData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    schartData: {
      deep: true,
      handler(val) {
        this.setOption(val)
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$el, 'macarons')
      this.showLoading()
    },
    showLoading() {
      this.chart.showLoading()
    },
    setOption(data) {
      this.chart.hideLoading()
      const start_ = data.start
      const end_ = data.end // 自定义时间
      const seriesData = []
      const yAxisData_plant = [] // 工厂名
      const legend = []

      data.data.forEach((item, index) => {
        yAxisData_plant.push(item.plant)

        const stateDic = {
          runlow: '运行(低速)',
          runnormal: '运行(正常)',
          runhigh: '运行(高速)',
          offline: '离线',
          freebreak: '闲置(断线)',
          freeunknow: '闲置(出框)',
          freecomplete: '闲置(完成)',
          freemanual: '闲置(手动)',
          error13: '绣框越限',
          error9: '回退到头又拉回退杆'
        }
        const stateColor = {
          runlow: '#63c2ff',
          runnormal: '#63c2ff',
          runhigh: '#63c2ff',
          offline: '#9E9E9E',
          freebreak: '#c8b2f4',
          freeunknow: '#32dadd',
          freecomplete: '#ed868c',
          freemanual: '#ffb980',
          error9: '#FFFFFF',
          error13: '#FFFFFF'
        }
        item.list.forEach((listItem, listIndex) => {
          const startTime = new Date(listItem.startTime).getTime()
          const endTime = new Date(listItem.endTime).getTime()
          //   const sss = listItem.patternName.match(/([A-Z])[A-Z]*([A-Z])-([A-Z])[A-Z]*-[A-Z]*/i)
          //   const color = '#' + sss[1].charCodeAt() + sss[2].charCodeAt() + sss[3].charCodeAt()
          const stateVaule = stateDic[listItem.state] || listItem.state
          const stateC = stateColor[listItem.state] || '#FFFFFF'
          if (!legend.includes(stateVaule))legend.push(stateVaule)
          seriesData.push({
            name: stateVaule,
            value: [
              index,
              startTime,
              endTime,
              listItem.userId,
              listItem.designId,
              listItem.duration
            ],
            itemStyle: {
              normal: {
                color: stateC // bg[listItem.colorNum % bg.length]
              }
            }
          })
        })
      })
      console.log(legend)
      this.chart.setOption(
        {
          tooltip: {
            formatter: function(params) {
              return '员工：' + params.value[3] + ' <br/>花样名：' + params.value[4] + ' <br/>状态：' + params.name + ' <br/>开始时间：' + dateMethods.toDateString(params.value[1], 'yyyy-MM-dd HH:mm:ss') + '<br/>持续时间：' + dateMethods.getDateDiff(params.value[1], params.value[2]).HH + ':' + dateMethods.getDateDiff(params.value[1], params.value[2]).mm + ':' + dateMethods.getDateDiff(params.value[1], params.value[2]).ss + '<br/>'
            }
          },
          grid: {
            top: 50,
            left: 80,
            right: 40,
            bottom: 50,
            height: 400
          },
          dataZoom: [{
            type: 'inside',
            show: true,
            startValue: new Date(start_).getTime(),
            endValue: new Date(end_).getTime(),
            minValueSpan: 3600 * 6 * 1000,
            start: 66,
            end: 100
          }, {
            start: 66,
            end: 100
          }],
          xAxis: {
            type: 'time',
            min: new Date(start_).getTime(),
            max: new Date(end_).getTime(),
            scale: true,
            position: 'top',
            splitNumber: 7,
            axisLabel: {
              show: true,
              interval: 0,
              margin: 15,
              fontSize: 14,
              formatter: function(value, index) {
                var date = new Date(value)
                var texts = [date.getFullYear(), (date.getMonth() + 1), date.getDate()].join('/') + ' ' + [date.getDate(), date.getMinutes(), date.getSeconds()].join(':')
                return texts
              }
            },
            axisLine: { show: false },
            splitLine: {
              show: true
            }
          },
          yAxis: {
            axisLine: {
              onZero: false,
              show: false
            },
            axisLabel: {
              show: true,
              fontSize: 14,
              formatter: function(value, index) {
                return value + '号机台'
              }
            },
            splitLine: {
              show: true
            },
            inverse: true,
            data: yAxisData_plant
          },
          series: [{
            type: 'custom',
            renderItem: function(params, api) {
              var categoryIndex = api.value(0)
              var start = api.coord([api.value(1), categoryIndex])
              var end = api.coord([api.value(2), categoryIndex])
              //   var height = api.size([0, 1])[1] * 0.6
              var rectShape = echarts.graphic.clipRectByRect({
                x: start[0],
                y: start[1] - 5,
                width: end[0] - start[0],
                height: 7
              }, {
                x: params.coordSys.x,
                y: params.coordSys.y,
                width: params.coordSys.width,
                height: params.coordSys.height
              })

              return rectShape && {
                type: 'rect',
                shape: rectShape,
                style: api.style()
              }
            },
            encode: {
              x: [1, 2],
              y: 0
            },
            data: seriesData
          }]
        }
      )
    },
    stringToColorCode(str) {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
      }
      let color = '#'
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        color += ('00' + value.toString(16)).substr(-2)
      }
      return color
    }

  }
}
</script>
