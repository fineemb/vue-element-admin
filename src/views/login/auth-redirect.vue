<script>
export default {
  name: 'AuthRedirect',
  created() {
    const { query } = this.$route
    const { code } = query
    console.log(code)
    if (window.localStorage) {
      window.localStorage.setItem('x-admin-oauth-code', code)
      window.open('about:blank', '_self')
      window.close()
    }
  },
  render: function(h) {
    return h() // avoid warning message
  }
}
</script>
