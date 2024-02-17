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
    ochartData: {
      type: Object,
      required: true
    },
    chartLoad: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    ochartData: {
      deep: true,
      handler(val) {
        this.setOption(val)
      }
    },
    chartLoad: {
      deep: true,
      handler(val) {
        if (val) {
          this.showLoading()
        }
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

      data.data.forEach((item, index) => {
        yAxisData_plant.push(item.plant)
        item.list.forEach((listItem, listIndex) => {
          const startTime = new Date(listItem.startTime).getTime()
          const endTime = new Date(listItem.endTime).getTime()
          seriesData.push({
            name: listItem.patternName,
            value: [
              index,
              startTime,
              endTime,
              listItem.quantity
            ],
            itemStyle: {
              normal: {
                color: this.stringToColorCode(listItem.patternName) // bg[listItem.colorNum % bg.length]
              }
            }
          })
        })
      })
      this.chart.setOption(
        {
          tooltip: {
            formatter: function(params) {
              return params.name + ' <br/>产量：' + params.value[3] + ' <br/>开始时间：' + dateMethods.toDateString(params.value[1], 'yyyy-MM-dd HH:mm:ss') + ' <br/>结束时间：' + dateMethods.toDateString(params.value[2], 'yyyy-MM-dd HH:mm:ss') + ' <br/>连续耗时：' + dateMethods.getDateDiff(params.value[1], params.value[2]).dd + '天'
            }
          },
          grid: {
            top: 48,
            left: 80,
            right: 40,
            bottom: 50,
            height: 400
          },
          dataZoom: [{
            type: 'inside',
            show: true,
            startValue: new Date(start_).getTime(),
            endValue: new Date(start_).getTime() + 3600 * 24 * 1000 * 7,
            minValueSpan: 3600 * 24 * 1000,
            start: 90,
            end: 100
          }, {
            start: 90,
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
                var texts = [date.getFullYear(), (date.getMonth() + 1), date.getDate()].join('/')
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
