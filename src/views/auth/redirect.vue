<script>
export default {
  name: 'AuthRedirect',
  created() {
    // const hash = window.location.search.slice(1)
    const { query } = this.$route
    console.log(this.$route)
    // console.log(query.redirect + '/#/auth-redirect?' + query.code)
    window.location.href = query.redirect + '/#/login?code=' + query.code
  },
  render: function(h) {
    return h() // avoid warning message
  }
}
</script>
