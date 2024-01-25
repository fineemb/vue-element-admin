import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function setOpenID(openid) {
  return Cookies.set('OpenID', openid)
}

export function getOpenID() {
  return Cookies.set('OpenID')
}
export function removeToken() {
  return Cookies.remove(TokenKey)
}
export function removeOpenID() {
  return Cookies.remove('OpenID')
}
