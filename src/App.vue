<template>
  <div id="app" @click="updateLastTime">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  methods: {
    updateLastTime() {
      this.$store.commit('login/SET_LASTTIME', new Date().getTime())
    }
  }
}
</script>
