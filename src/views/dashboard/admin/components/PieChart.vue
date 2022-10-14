<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
import eventBus from '../../../../utils/eventBus'
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
      default: '300px'
    }
  },
  data() {
    return {
      chart: null
    }
  },
  mounted() {
    eventBus.$on('message', this.message)
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
    eventBus.$off('message', this.message)
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$el, 'macarons')
    },
    message(value) {
      // console.log('message = ', value)
      if (value.type === 'machineState') {
        this.chart.setOption(value.data)
      }
    }
  }
}
</script>
