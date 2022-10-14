import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}
export function getInfo(token) {
  return request({
    url: '/user/info',
    method: 'get',
    params: { token }
  })
}
export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}
export function getUserInfo() {
  return request({
    url: '/userinfo',
    method: 'get'
  })
}
export function getData(data) {
  return request({
    url: '/getDatas',
    method: 'post',
    data
  })
}
export function upData(data) {
  return request({
    url: '/upData',
    method: 'post',
    data
  })
}
export function delData(data) {
  return request({
    url: '/delData',
    method: 'post',
    data
  })
}
export function addYield(data) {
  return request({
    url: '/addYield',
    method: 'post',
    data
  })
}

export function getSchedule(data) {
  return request({
    url: '/getSchedule',
    method: 'post',
    data
  })
}
export function getrOrders(data) {
  return request({
    url: '/getrorders',
    method: 'get'
  })
}
export function getIOlist(data) {
  return request({
    url: '/getIOlist',
    method: 'post',
    data
  })
}
export function getDownloadUrl(data) {
  return request({
    url: '/getDownloadUrl',
    method: 'post',
    data
  })
}
export function getRunHeads(data) {
  return request({
    url: '/getRunHead',
    method: 'post',
    data
  })
}
export function getCellData(data) {
  return request({
    url: '/getCellData',
    method: 'post',
    data
  })
}
export function getDstFile(data) {
  return request({
    url: '/getDstFile',
    method: 'post',
    data
  })
}
export function updateIsSettled(data) {
  return request({
    url: '/updateIsSettled',
    method: 'post',
    data
  })
}
