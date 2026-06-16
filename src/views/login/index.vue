<template>
  <div class="login">
    <!-- 粒子背景 -->
    <div class="vue-particles">
      <vue-particles
          color="#00E5FF"
          :particleOpacity="0.35"
          :particlesNumber="70"
          shapeType="star"
          :linesColor="'rgba(0,229,255,.05)'"
          :linesWidth="1"
          :lineLinked="true"
          :lineOpacity="0.12"
          :linesDistance="150"
          :moveSpeed="2"
          hoverMode="grab"
          clickMode="push"
          style="height: 100%"
      ></vue-particles>
    </div>

    <!-- 毛玻璃登录卡片 -->
    <div class="login-card">
      <div class="login-logo">
        <div class="logo-icon">
          <i class="el-icon-cpu"></i>
        </div>
        <h1 class="logo-title">{{ themeConfig.globalViceTitle }}</h1>
        <p class="logo-desc">{{ themeConfig.globalViceDes }}</p>
      </div>

      <div class="login-form-wrap">
        <el-tabs v-model="activeMode" class="mode-tabs">
          <el-tab-pane label="登 录" name="login">
            <loginForm v-if="activeMode === 'login'" />
            <p class="switch-mode" @click="activeMode = 'register'">暂无账号？去注册 →</p>
          </el-tab-pane>
          <el-tab-pane label="注 册" name="register">
            <registerForm v-if="activeMode === 'register'" />
            <p class="switch-mode" @click="activeMode = 'login'">已有账号？去登录 →</p>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script>
import {mapState} from 'vuex';
import loginForm from '@/components/loginForm/index.vue';
import registerForm from '@/components/registerForm/index.vue';

export default {
  name: 'login',
  components: {loginForm, registerForm},
  computed: {
    ...mapState('themeConfig', ['themeConfig']),
  },
  data() {
    return {
      activeMode: 'login',
    };
  },
};
</script>

<style scoped lang="scss">
.login {
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  .vue-particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    background: radial-gradient(ellipse at 30% 20%, var(--prev-bg-white) 0%, var(--prev-bg-main-color) 50%, var(--prev-bg-menuBar) 100%);
  }

  .login-card {
    position: relative;
    z-index: 1;
    width: 440px;
    padding: 48px 40px 36px;
    background: var(--prev-glass-bg);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 18px;
    border: var(--prev-glow-border);
    box-shadow: var(--prev-glow-shadow), 0 8px 32px rgba(0,0,0,.06);
  }

  .login-logo {
    text-align: center;
    margin-bottom: 32px;

    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(0,229,255,.12), rgba(0,184,212,.08));
      border: 1px solid rgba(0,229,255,.15);
      margin-bottom: 16px;

      i {
        font-size: 32px;
        color: var(--prev-color-primary);
        filter: drop-shadow(0 0 16px rgba(0,229,255,.5));
      }
    }

    .logo-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--prev-color-text-white);
      letter-spacing: 2px;
      margin: 0 0 8px;
    }

    .logo-desc {
      font-size: 13px;
      color: var(--prev-color-text-secondary);
      letter-spacing: 1px;
      margin: 0;
    }
  }

  .login-form-wrap {
    ::v-deep .mode-tabs {
      .el-tabs__header {
        margin-bottom: 24px;
      }
      .el-tabs__nav-wrap::after {
        background-color: rgba(0,212,255,.08);
      }
      .el-tabs__item {
        color: var(--prev-color-text-secondary);
        font-size: 16px;
        letter-spacing: 4px;
        &:hover {
          color: var(--prev-color-primary);
        }
        &.is-active {
          color: var(--prev-color-primary);
          font-weight: 600;
        }
      }
      .el-tabs__active-bar {
        background-color: var(--prev-color-primary);
        box-shadow: 0 0 10px rgba(0,212,255,.4);
      }
    }

    .switch-mode {
      text-align: right;
      color: var(--prev-color-text-secondary);
      font-size: 12px;
      cursor: pointer;
      margin-top: 12px;
      transition: color 0.2s;
      &:hover {
        color: var(--prev-color-primary);
      }
    }
  }
}
</style>
