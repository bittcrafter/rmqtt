/* ============================================================
   RMQTT Dashboard — 订阅管理页
   ============================================================ */
window.SubscriptionsPage = Vue.defineComponent({
  name: 'SubscriptionsPage',
  template: `
    <div>
      <div class="search-bar">
        <input class="form-input" v-model="searchClient" placeholder="搜索 ClientID..."
               @keyup.enter="loadSubs" />
        <button class="btn btn-primary" @click="loadSubs">搜索</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ClientID</th>
              <th>Topic</th>
              <th>QoS</th>
              <th>节点</th>
              <th>共享组</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in subs" :key="s.clientid + s.topic">
              <td>{{ s.clientid }}</td>
              <td><code>{{ s.topic }}</code></td>
              <td>{{ s.qos }}</td>
              <td>{{ s.node || '-' }}</td>
              <td>{{ s.share_group || '' }}</td>
              <td>
                <button class="btn-icon" style="width:auto;padding:4px 12px;font-size:12px;color:var(--red);"
                        @click="unsub(s)" title="取消订阅">
                  取消
                </button>
              </td>
            </tr>
            <tr v-if="subs.length === 0">
              <td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  setup() {
    const searchClient = Vue.ref('');
    const subs = Vue.ref([]);

    async function loadSubs() {
      try {
        const params = { limit: 100 };
        if (searchClient.value) params.clientid = searchClient.value;
        const data = await http.get('/subscriptions', params);
        subs.value = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error(e);
      }
    }

    async function unsub(s) {
      if (!confirm('取消 ' + s.clientid + ' 对 ' + s.topic + ' 的订阅？')) return;
      try {
        await http.post('/mqtt/unsubscribe', {
          clientid: s.clientid,
          topic: s.topic,
        });
        loadSubs();
      } catch (e) {
        alert('取消订阅失败: ' + e.message);
      }
    }

    Vue.onMounted(loadSubs);

    return { searchClient, subs, loadSubs, unsub };
  },
});
