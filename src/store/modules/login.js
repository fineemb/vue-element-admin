/**
 * ClassName: vue-admin-template-master <br/>
 * Description:  <br/>
 * Date: 2021/5/9 10:43 PM <br/>
 * <br/>
 *
 * @author Yolanda
 *
 * 修改记录
 * @version 1.0.0 2021/5/9 Yolanda Initial Version<br/>
 *
 */
const state = {
  // 上一次点击页面的时间
  lastTime: new Date().getTime()

}

const mutations = {
  SET_LASTTIME: (state, lastTime) => {
    state.lastTime = lastTime
    // console.log('更新最后操作时间：', lastTime)
  }
}

const actions = {

}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

