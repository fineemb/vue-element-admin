<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'

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
    },
    setOption(data) {
      const start_ = data.start
      const end_ = data.end // 自定义时间
      const seriesData = []
      const yAxisData_plant = [] // 工厂名

      data.data.forEach((item, index) => {
        yAxisData_plant.push(item.plant)
        const bg = ['#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80', '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa', '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050', '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089']
        item.list.forEach((listItem, listIndex) => {
          const startTime = new Date(listItem.startTime).getTime()
          const endTime = new Date(listItem.endTime).getTime()
          //   const sss = listItem.patternName.match(/([A-Z])[A-Z]*([A-Z])-([A-Z])[A-Z]*-[A-Z]*/i)
          //   const color = '#' + sss[1].charCodeAt() + sss[2].charCodeAt() + sss[3].charCodeAt()
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
                color: bg[listItem.colorNum % bg.length]
              }
            }
          })
        })
      })
      this.chart.setOption(
        {
          tooltip: {
            formatter: function(params) {
              return params.marker + params.name
            }
          },
          grid: {
            top: 48,
            left: 40,
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
              fontSize: 14
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
    }
  }
}
</script>
