/* ============================================================
   RMQTT Dashboard — 客户端页
   搜索、列表、踢出客户端
   ============================================================ */
window.ClientsPage = Vue.defineComponent({
  name: 'ClientsPage',
  template: `
    <div>
      <div class="search-bar">
        <input class="form-input" v-model="search" placeholder="搜索 ClientID..."
               @keyup.enter="loadClients" />
        <select class="form-select" v-model="filterOnline" style="width:120px;">
          <option value="">全部状态</option>
          <option value="1">在线</option>
          <option value="0">离线</option>
        </select>
        <button class="btn btn-primary" @click="loadClients">搜索</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ClientID</th>
              <th>节点</th>
              <th>IP</th>
              <th>协议</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in clients" :key="c.clientid">
              <td>{{ c.clientid }}</td>
              <td>{{ c.node || '-' }}</td>
              <td>{{ c.ipaddress || '-' }}</th>
              <td>MQTT{{ c.proto_ver || '-' }}</td>
              <td><span :class="c.connected ? 'status-online' : 'status-offline'">
                {{ c.connected ? '● 在线' : '○ 离线' }}
              </span></td>
              <td>
                <button class="btn-icon" style="width:auto;padding:4px 12px;font-size:12px;"
                        v-if="c.connected" @click="kick(c.clientid)" title="踢出">
                  踢出
                </button>
              </td>
            </tr>
            <tr v-if="clients.length === 0">
              <td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  setup() {
    const search = Vue.ref('');
    const filterOnline = Vue.ref('');
    const clients = Vue.ref([]);

    async function loadClients() {
      try {
        const params = { limit: 100 };
        if (search.value) params.clientid = search.value;
        if (filterOnline.value !== '') params.connected = filterOnline.value;
        const data = await http.get('/clients', params);
        clients.value = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error(e);
      }
    }

    async function kick(clientid) {
      if (!confirm('确认踢出客户端 ' + clientid + ' ？')) return;
      try {
        await http.del('/clients/' + encodeURIComponent(clientid));
        loadClients();
      } catch (e) {
        alert('踢出失败: ' + e.message);
      }
    }

    Vue.onMounted(loadClients);

    return { search, filterOnline, clients, loadClients, kick };
  },
});
