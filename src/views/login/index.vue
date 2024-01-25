<template>

  <div class="login-container">
    <div class="title-container">
      <h3 class="title">纺艺刺绣后台管理系统</h3>
      <div class="login_header">
        <a :class="{active:cur==false + ' al'}" @click="cur=false">微信登录</a>
        <a :class="{active:cur==true + ' al'}" @click="cur=true">密码登录</a>
      </div>
    </div>
    <div v-show="cur==true" class="Cbody_item">
      <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" autocomplete="on" label-position="left">
        <el-form-item prop="username">
          <span class="svg-container">
            <svg-icon icon-class="user" />
          </span>
          <el-input
            ref="username"
            v-model="loginForm.username"
            placeholder="用户名"
            name="username"
            type="text"
            tabindex="1"
            autocomplete="on"
          />
        </el-form-item>
        <el-tooltip v-model="capsTooltip" content="Caps lock is On" placement="right" manual>
          <el-form-item prop="password">
            <span class="svg-container">
              <svg-icon icon-class="password" />
            </span>
            <el-input
              :key="passwordType"
              ref="password"
              v-model="loginForm.password"
              :type="passwordType"
              placeholder="密码"
              name="password"
              tabindex="2"
              autocomplete="on"
              @keyup.native="checkCapslock"
              @blur="capsTooltip = false"
              @keyup.enter.native="handleLogin"
            />
            <span class="show-pwd" @click="showPwd">
              <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
            </span>
          </el-form-item>
        </el-tooltip>
        <el-button :loading="loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="handleLogin">登录</el-button>
      </el-form>
    </div>
    <div v-show="cur==false" class="Cbody_item">
      <wxlogin
        id="wxcode"
        style="text-align: center"
        theme="white"
        appid="wx7d03fb839eb55f81"
        href="data:text/css;base64,QGNoYXJzZXQgInV0Zi04IjsuaW1wb3dlckJveCAucXJjb2Rle3dpZHRoOjE4MHB4O2JvcmRlcjowO21hcmdpbi10b3A6MTNweH0uaW1wb3dlckJveCAudGl0bGV7ZGlzcGxheTpub25lfS5pbXBvd2VyQm94IC5pbmZve3dpZHRoOjE2MHB4fS5zdGF0dXNfaWNvbntkaXNwbGF5Om5vbmV9LmltcG93ZXJCb3ggLnN0YXR1c3t0ZXh0LWFsaWduOmNlbnRlcn0ud3JwX2NvZGV7d2lkdGg6MjA2cHg7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlcjoxcHggc29saWQgI2U1ZTVlNTtoZWlnaHQ6MjA2cHg7bWFyZ2luOjAgYXV0bztib3JkZXItcmFkaXVzOjRweH0="
        scope="snsapi_login"
        :redirect_uri="redirect_uri"
      />
    </div>
  </div></template>

<script>
import { validUsername } from '@/utils/validate'
import wxlogin from 'vue-wxlogin'

export default {
  name: 'Login',
  components: { wxlogin },
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!validUsername(value)) {
        callback(new Error('请输入正确的用户名'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (value.length < 6) {
        callback(new Error('密码长度不能低于6位'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      },
      passwordType: 'password',
      capsTooltip: false,
      loading: false,
      showDialog: false,
      cur: false,
      redirect_uri: encodeURIComponent('https://factory.dnxh.cn:886/#/authredirect?redirect=' + window.location.origin),
      otherQuery: {}
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        const query = route.query
        if (query) {
          this.redirect = query.redirect
          this.otherQuery = this.getOtherQuery(query)
        }
      },
      immediate: true
    }
  },
  created() {
    // window.addEventListener('storage', this.afterQRScan)
    const { query } = this.$route
    const { code } = query
    if (code) {
      console.log(code)
      this.afterQRScan(code)
    }
    // this.redirect_uri = encodeURIComponent('https://factory.dnxh.cn:886/#/authredirect?redirect=' + window.location.origin)
  },
  mounted() {
    if (this.loginForm.username === '') {
      this.$refs.username.focus()
    } else if (this.loginForm.password === '') {
      this.$refs.password.focus()
    }
  },
  destroyed() {
    window.removeEventListener('storage', this.afterQRScan)
  },
  methods: {
    checkCapslock(e) {
      const { key } = e
      this.capsTooltip = key && key.length === 1 && (key >= 'A' && key <= 'Z')
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          this.$store.dispatch('user/login', this.loginForm)
            .then(() => {
              this.$router.push({ path: this.redirect || '/', query: this.otherQuery })
              this.loading = false
            })
            .catch(() => {
              this.loading = false
            })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    getOtherQuery(query) {
      return Object.keys(query).reduce((acc, cur) => {
        if (cur !== 'redirect') {
          acc[cur] = query[cur]
        }
        return acc
      }, {})
    },
    afterQRScan(code) {
      if (code) {
        this.$store.dispatch('user/LoginByThirdparty', code).then((e) => {
          console.log(e)
          this.$router.push({ path: this.redirect || '/' })
        })
      } else {
        alert('第三方登录失败')
      }
    }
  }
}
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}
.login_header>a, .login_header>a:focus, .login_header>a:hover{
	color: #fff;
  margin: 50px;
}
.Cbody_item{
	border: 0px solid #999;
	overflow: hidden;
}

.login_header {
  margin-bottom: 30px;
  text-align: center;
}
.login_header span{
	margin-right: 20px;
	cursor: pointer;
}

.active{
    color:#fff;
    padding-bottom: 10px;
    border-bottom: 3px solid #fff;
}
.hidden{
		display: none;
	}
/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: #454545;
  }
}
</style>

<style lang="scss" scoped>
$bg:#283443;
$dark_gray:#889aa4;
$light_gray:#eee;

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 10px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;
    padding: 160px 35px 0;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

  .thirdparty-button {
    position: absolute;
    right: 35px;
  }

  @media only screen and (max-width: 470px) {
    .thirdparty-button {
      display: none;
    }
  }
}
</style>
