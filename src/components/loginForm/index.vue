<template>
  <div class="login-main">
    <el-form class="el-form login-form" :model="loginForm" :rules="loginRulesForm" ref="loginFormRef"
             @keyup.enter.native="submitForm">
      <el-form-item prop="username">
        <el-input
            type="text"
            :placeholder="$t('message.login.placeholder1')"
            prefix-icon="el-icon-user"
            v-model="loginForm.username"
            clearable
            autocomplete="off"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
            type="password"
            :placeholder="$t('message.login.placeholder2')"
            prefix-icon="el-icon-lock"
            v-model="loginForm.password"
            clearable
            autocomplete="off"
            :show-password="true"
        />
      </el-form-item>

      <el-form-item prop="captcha">
        <div class="el-row" span="24">
          <div class="el-col el-col-14">
            <el-input
                type="text"
                maxlength="5"
                :placeholder="$t('message.login.placeholder3')"
                prefix-icon="el-icon-position"
                v-model="loginForm.captcha"
                clearable
                autocomplete="off"
            />
          </div>
          <div class="el-col el-col-10">
            <div class="login-code" @click="getIdentifyingCode(true)">
              <img id="imgIdentifyingCode" class="login-code-img" alt="点击更换" title="点击更换"/>
            </div>
          </div>
        </div>
      </el-form-item>
      <el-form-item style="margin: 30px 0px 20px">
        <el-button type="primary" class="login-submit" @click="submitForm" :loading="submit.loading">
          <span>{{ $t('message.login.btnText') }}</span>
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {Session} from '@/utils/storage';
import {formatAxis} from '@/utils/formatTime';
import {PrevLoading} from '@/utils/loading.js';
import {useLoginApi} from '@/api/login';

export default {
  name: 'loginForm',
  computed: {
    currentTime() {
      return formatAxis(new Date());
    },
  },
  data() {
    return {
      submit: {
        loading: false,
      },
      loginForm: {
        username: '',
        password: '',
        captcha: '',
        randomStr: Math.floor(Math.random() * 999999999),
      },
      loginRulesForm: {
        username: [
          {required: true, message: '请输入手机号', trigger: 'blur'},
          // {
          // 	pattern: /^1[3-9]\d{9}$/,
          // 	message: '请输入正确的手机号格式',
          // 	trigger: 'blur',
          // },
        ],
        password: [{required: true, message: '请输入密码', trigger: 'blur'}],
        captcha: [
          {required: true, message: '请输入验证码', trigger: 'blur'},
          {min: 5, max: 5, message: '验证码长度不正确', trigger: 'blur'},
        ],
      },
      lastClickTime: 0,
      clickDebounce: 300,
    };
  },
  mounted() {
    this.getRandomStr();
    this.getIdentifyingCode(true);
  },
  methods: {
    // 生成随机字符串
    getRandomStr() {
      this.loginForm.randomStr = Math.floor(Math.random() * 999999999);
    },

    // 获取验证码图片
    getIdentifyingCode(bRefresh) {
      let identifyCodeSrc = 'sys/code/' + this.loginForm.randomStr;
      if (bRefresh) {
        this.getRandomStr();
        identifyCodeSrc = 'sys/code/' + this.loginForm.randomStr;
      }
      const objs = document.getElementById('imgIdentifyingCode');
      objs.src = identifyCodeSrc;
    },

    // 登录提交
    submitForm() {
      const now = Date.now();

      if (now - this.lastClickTime < this.clickDebounce) return console.log('防抖拦截重复点击');

      this.lastClickTime = now;

      this.$refs.loginFormRef.validate((valid) => {
        if (!valid) return;

        this.submit.loading = true;
        useLoginApi()
            .signIn(this.loginForm)
            .then((res) => {
              // eslint-disable-next-line no-console
              console.log('登录接口返回:', res);
              // 兼容不同的返回格式
              const token = res.token || res.data?.token;
              if (!token) {
                console.error('登录返回数据中没有 token');
                this.$message.error('登录失败：返回数据格式错误');
                return;
              }
              // eslint-disable-next-line no-console
              this.$message.success(`${this.currentTime}，${this.$t('message.login.signInText')}`);
              // 存储 token 到浏览器缓存
              Session.set('token', token);
              localStorage.setItem('token', token);
              PrevLoading.start();
              this.$router.push('/');
            })
            .catch((err) => {
              // eslint-disable-next-line no-console
              console.error('登录失败:', err);
              this.getIdentifyingCode(true);
            })
            .finally(() => {
              this.submit.loading = false;
            });
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.login-main {
  margin: 0 auto;

  .login-form {
    ::v-deep .el-input__inner {
      background: var(--prev-bg-color);
      border: 1px solid var(--prev-border-color-base);
      color: var(--prev-color-text-primary);
      &:focus {
        border-color: var(--prev-color-primary);
        box-shadow: 0 0 8px rgba(0,184,212,.1);
      }
      &::placeholder {
        color: var(--prev-color-text-placeholder);
      }
    }
    ::v-deep .el-input__prefix .el-icon-user,
    ::v-deep .el-input__prefix .el-icon-lock,
    ::v-deep .el-input__prefix .el-icon-position {
      color: var(--prev-color-text-secondary);
    }

    .el-form-item {
      margin-bottom: 20px !important;

      .login-code {
        display: flex;
        align-items: center;
        justify-content: space-around;
        margin: 0 0 0 10px;
        user-select: none;

        .login-code-img {
          width: 120px;
          height: 40px;
          border: 1px solid var(--prev-border-color-base);
          border-radius: 6px;
          background: var(--prev-bg-color);
          cursor: pointer;
          transition: all ease 0.2s;

          &:hover {
            border-color: var(--prev-color-primary);
            box-shadow: 0 0 10px rgba(0,229,255,.12);
          }
        }
      }

      .login-submit {
        width: 100%;
        letter-spacing: 2px;
        height: 44px;
        font-size: 16px;
        background: linear-gradient(135deg, var(--prev-color-primary), var(--prev-color-primary-dark)) !important;
        border: none !important;
        box-shadow: 0 4px 16px rgba(0,184,212,.18);
        transition: all 0.25s ease;
        &:hover {
          box-shadow: 0 6px 24px rgba(0,184,212,.3);
          transform: translateY(-1px);
        }
      }
    }
  }
}
</style>
