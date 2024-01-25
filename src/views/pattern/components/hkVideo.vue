<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import hkModule from '@/views/video/components/js/hkVideo/hkModule'
import FlexLayout from '@/components/FlexLayout.vue'
const props = defineProps({
  companyVideoData: {
    type: Object,
    default() {
      return []
    }
  }
})

// 海康威视模块
const {
  divPlugin, iWndowType, gIWndIndex,
  videoInitPlugin, clickLogin
} = hkModule()

const clickLogins = () => {
  for (let i = 0; i < props.companyVideoData.length; i++) {
    const item = props.companyVideoData[i]
    setTimeout(() => {
      clickLogin(item, i)
    }, 1000)
  }
}

onMounted(() => {
  videoInitPlugin(() => {
    clickLogins()
  })
})

onUnmounted(() => {
  for (let i = 0; i < props.companyVideoData.length; i++) {
    const item = props.companyVideoData[i]
    WebVideoCtrl.I_Logout(item.ip)
  }
  WebVideoCtrl.I_GetPluginOBJECT().JS_DestroyPlugin()
})
</script>

<template>
  <div class="video-player">
    <div id="divPlugin" ref="divPlugin" class="divPlugin" />
  </div>
</template>

<style scoped>
.video-player {
	position: relative;
	width: 100%;
	height: 100%;
}
.divPlugin {
	width: 100%;
	height: 100%;
}
.hk-tools-wrapper {
	position: absolute;
	width: 300px;
	right: 0;
	top: 0;
	bottom: 0;
	background-color: #ffffff;
	z-index: 99;
}
</style>
