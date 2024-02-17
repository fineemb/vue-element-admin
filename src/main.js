import Vue from 'vue'

import Cookies from 'js-cookie'

import 'normalize.css/normalize.css' // a modern alternative to CSS resets

import Element from 'element-ui'
import './styles/element-variables.scss'
import './styles/aliicon.css'
import locale from 'element-ui/lib/locale/lang/zh-CN'
// import enLang from 'element-ui/lib/locale/lang/en'// 如果使用中文语言包请默认支持，无需额外引入，请删除该依赖

import '@/styles/index.scss' // global css

import App from './App'
import store from './store'
import router from './router'
import socket from './api/socket'

import './icons' // icon
import './permission' // permission control
import './utils/error-log' // error log

import * as filters from './filters' // global filters

import 'xe-utils'
// import XEUtils from 'xe-utils'
import VXETable from 'vxe-table'
import VXETablePluginMenus from 'vxe-table-plugin-menus'
import 'vxe-table/lib/style.css'
Vue.use(VXETable)
VXETable.use(VXETablePluginMenus)
// Vue.use(XEUtils)

VXETable.formats.add('dateFormat', ({ cellValue }) => {
  console.log(cellValue)
  if (!cellValue) return '无'
  if (typeof (cellValue) === 'number')cellValue = cellValue * 1000
  // var value = cellValue.$date || cellValue * 1000
  const date = new Date(cellValue)
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
  // return XEUtils.commafy(XEUtils.toNumber(cellValue), { digits })
})
/**
 * If you don't want to use mock-server
 * you want to use MockJs for mock api
 * you can execute: mockXHR()
 *
 * Currently MockJs will be used in the production environment,
 * please remove it before going online ! ! !
 */
if (process.env.NODE_ENV === 'production') {
  const { mockXHR } = require('../mock')
  mockXHR()
}
socket.connect()
Vue.use(Element, {
  size: Cookies.get('size') || 'medium', // set element-ui default size
  locale: locale // 如果使用中文，无需设置，请删除
})

// register global utility filters
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

Vue.config.productionTip = false

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
