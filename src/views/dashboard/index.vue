<template>
  <div class="dashboard-container">
    <component :is="currentRole" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import adminDashboard from './admin'
import editorDashboard from './editor'

export default {
  name: 'Dashboard',
  components: { adminDashboard, editorDashboard },
  data() {
    return {
      currentRole: 'adminDashboard',
      lastTime: null,
      currentTime: null,
      sys_timeout: 10 * 60 * 1000,
      check_time: 10 * 1000,
      whole_timer: null
    }
  },
  computed: {
    ...mapGetters([
      'roles'
    ])
  },
  created() {
    if (!this.roles.includes('admin')) {
      this.currentRole = 'editorDashboard'
    }
    this.isLoginOut()
  },
  methods: {
    isTimeOut() {
      this.lastTime = this.$store.state.login.lastTime
      this.currentTime = new Date().getTime()
      console.log((this.currentTime - this.lastTime) / 1000 / 60)
      if ((this.currentTime - this.lastTime) > this.sys_timeout) {
        return true
      } else {
        return false
      }
    },
    isLoginOut() {
      clearInterval(this.whole_timer)
      const that = this
      this.whole_timer = setInterval(async function() {
        if (that.isTimeOut()) {
          await that.$store.dispatch('user/logout')
          console.log(that.$route.fullPath)
          that.$router.push({ path: `/login?redirect=${that.$route.fullPath}` || '/' })
          setTimeout(function() {
            clearInterval(that.whole_timer)
          }, 1000)
        }
      }, that.check_time)
    }
  }
}
</script>
