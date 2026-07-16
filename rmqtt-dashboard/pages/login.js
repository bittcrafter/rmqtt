/* ============================================================
   RMQTT Dashboard — 登录页
   用户输入 http-api 的 Bearer Token
   ============================================================ */
window.LoginPage = Vue.defineComponent({
  name: 'LoginPage',
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>RMQTT</h1>
        <p>输入 Bearer Token 登录 Dashboard</p>
        <div class="form-group">
          <label>Bearer Token</label>
          <input class="form-input" type="password" v-model="token"
                 placeholder="请输入 Token" @keyup.enter="login" />
        </div>
        <div class="form-group" v-if="error" style="color:var(--red);font-size:13px;">
          {{ error }}
        </div>
        <button class="btn btn-primary" @click="login" :disabled="loading">
          {{ loading ? '验证中...' : '登录' }}
        </button>
      </div>
    </div>
  `,
  setup() {
    const token = Vue.ref('');
    const loading = Vue.ref(false);
    const error = Vue.ref('');

    async function login() {
      if (!token.value.trim()) { error.value = '请输入 Token'; return; }
      loading.value = true;
      error.value = '';
      try {
        // 用 /api/v1/brokers 验证 Token 有效性
        const result = await http.get('/brokers');
        if (result) {
          store.setToken(token.value.trim());
          location.hash = '#/';
        }
      } catch (e) {
        error.value = 'Token 无效或服务不可用';
      } finally {
        loading.value = false;
      }
    }

    return { token, loading, error, login };
  },
});
