<script setup>
import { computed } from 'vue'

const props = defineProps({
  direction: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: '100%'
  },
  noBg: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  bgImg: {
    type: Boolean,
    default: false
  },
  xNoHidden: {
    type: Boolean,
    default: false
  }
})

const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `

const getRootClass = computed(() => {
  return {
    'direction-row': props.direction === 'row',
    'bg-img': props.bgImg
  }
})

const getRootStyle = computed(() => {
  return {
    height: props.height
  }
})
</script>

<template>
  <div
    v-loading="loading"
    class="flex-layout"
    :class="getRootClass"
    :style="getRootStyle"
    element-loading-text="拼命加载中"
    :element-loading-spinner="svg"
    element-loading-background="rgba(0, 0, 0, 0.2)"
  >
    <div class="flex-layout-header">
      <slot name="header" />
    </div>
    <div class="flex-layout-body" :class="{ 'no-bg': noBg, 'x-no-hidden': xNoHidden }">
      <slot />
    </div>
    <div class="flex-layout-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.flex-layout {
	display: flex;
	flex-direction: column;
	height: 100%;
	&.bg-img {
		background-image: url("../assets/images/dw_bg.jpg");
		background-size: 100% 100%;
	}
	&.direction-row {
		flex-direction: row;
	}
	&.full-ht {
		height: 100%;
	}
}
.flex-layout-body {
	flex: 1;
	background-color: #052272;
}
.flex-layout-body.no-bg {
	background-color: #05227200;
}
</style>
