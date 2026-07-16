/* ============================================================
   RMQTT Dashboard — 概览页
   三标签布局：集群概览 / 节点 / 指标
   ============================================================ */
;(function() {
  'use strict';

  const { ref, onMounted, onUnmounted, nextTick } = Vue;

  window.OverviewPage = Vue.defineComponent({
    name: 'OverviewPage',
    components: { NodeDetail: window.NodeDetail },
    template: `
      <div>
        <!-- 标签栏 -->
        <div class="tab-bar">
          <button v-for="tab in tabs" :key="tab.key"
                  class="tab-btn" :class="{ active: activeTab === tab.key }"
                  @click="activeTab = tab.key">{{ tab.label }}</button>
        </div>

        <!-- ─── Tab 1: 集群概览 ─── -->
        <div v-show="activeTab === 'overview'">
          <div class="overview-top">
            <div class="gauge-card" id="gaugeConnContainer"></div>
            <div class="msg-rate-card" id="msgRateContainer"></div>
            <div class="overview-metrics">
              <metric-card icon="💬" :label="$t('overview.total_sessions')" :value="stats.sessions" color="#22c55e"></metric-card>
              <metric-card icon="✓" :label="$t('overview.online_sessions')" :value="stats.connections" color="#3b82f6"></metric-card>
              <metric-card icon="#" :label="$t('overview.topics_count')" :value="stats.topics" color="#8b5cf6"></metric-card>
              <metric-card icon="+" :label="$t('overview.subscriptions_count')" :value="stats.subscriptions" color="#f59e0b"></metric-card>
              <metric-card icon="↗" :label="$t('overview.shared_subscriptions_count')" :value="stats.sharedSubscriptions" color="#06b6d4"></metric-card>
              <metric-card icon="📋" :label="$t('overview.retained_count')" :value="stats.retained" color="#22c55e"></metric-card>
            </div>
          </div>

          <!-- 节点信息卡片 -->
          <div class="node-info-card">
            <div class="node-info-header">
              <div class="node-info-title">
                <span class="node-name">{{ nodes.length }} {{ $t('overview.nodes_count') }}</span>
              </div>
              <h3>{{ $t('overview.node_info') }}</h3>
              <a class="node-info-link" @click="activeTab = 'nodes'">{{ $t('overview.view_node_list') }}</a>
            </div>
            <div v-for="n in nodes" :key="n.node_id" class="node-info-body">
              <div class="node-info-icon">
                <svg viewBox="0 0 100 100" class="hexagon-icon">
                  <defs>
                    <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="hexGradOffline" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" :fill="n.running ? 'url(#hexGrad)' : 'url(#hexGradOffline)'" />
                </svg>
              </div>
              <div class="node-info-grid">
                <div class="node-info-item">
                  <span class="node-info-label">{{ $t('overview.node_name') }}</span>
                  <span class="node-info-value">{{ n.node_name || '-' }}</span>
                </div>
                <div class="node-info-item">
                  <span class="node-info-label">{{ $t('overview.node_role') }}</span>
                  <span class="node-info-value">core</span>
                </div>
                <div class="node-info-item">
                  <span class="node-info-label">{{ $t('overview.node_uptime') }}</span>
                  <span class="node-info-value">{{ formatUptime(n.uptime) }}</span>
                </div>
                <div class="node-info-item">
                  <span class="node-info-label">{{ $t('overview.node_version') }}</span>
                  <span class="node-info-value">{{ n.version || '-' }}</span>
                </div>
                <div class="node-info-item">
                  <span class="node-info-label">{{ $t('overview.connections_count') }}</span>
                  <span class="node-info-value">{{ n.connections != null ? n.connections : '-' }}</span>
                </div>
                <div class="node-info-item">
                  <span class="node-info-label">{{ $t('overview.max_fds') }}</span>
                  <span class="node-info-value">-</span>
                </div>
                <div class="node-info-item">
                  <span class="node-info-label">{{ $t('overview.cpu_load') }}</span>
                  <span class="node-info-value">{{ n.load1 != null ? (n.load1.toFixed(2) + '/' + n.load5.toFixed(2) + '/' + n.load15.toFixed(2)) : '-' }}</span>
                </div>
                <div class="node-info-item">
                  <span class="node-info-label">{{ $t('overview.node_memory') }}</span>
                  <span class="node-info-value">{{ n.memory_used ? (formatBytes(n.memory_used) + '/' + formatBytes(n.memory_total)) : '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-toolbar">
            <span class="chart-toolbar-label">{{ $t('overview.time_range') }}</span>
            <button v-for="r in timeRanges" :key="r.key"
                    class="time-btn" :class="{ active: timeRange === r.key }"
                    @click="setTimeRange(r.key)">{{ r.label }}</button>
          </div>
          <div class="chart-grid">
            <div class="chart-card">
              <h3>{{ $t('overview.msg_in_trend') }}</h3>
              <div class="chart-box" id="chartMsgIn"></div>
            </div>
            <div class="chart-card">
              <h3>{{ $t('overview.msg_out_trend') }}</h3>
              <div class="chart-box" id="chartMsgOut"></div>
            </div>
            <div class="chart-card">
              <h3>{{ $t('overview.msg_dropped_trend') }}</h3>
              <div class="chart-box" id="chartMsgDropped"></div>
            </div>
            <div class="chart-card">
              <h3>{{ $t('overview.connections_trend') }}</h3>
              <div class="chart-box" id="chartConnections"></div>
            </div>
            <div class="chart-card">
              <h3>{{ $t('overview.topics_trend') }}</h3>
              <div class="chart-box" id="chartTopics"></div>
            </div>
            <div class="chart-card">
              <h3>{{ $t('overview.subscriptions_trend') }}</h3>
              <div class="chart-box" id="chartSubscriptions"></div>
            </div>
          </div>
        </div>

        <!-- ─── Tab 2: 节点 ─── -->
        <div v-show="activeTab === 'nodes'">
          <div class="ring-section">
            <h3 class="section-title">{{ $t('overview.node_distribution') }}</h3>
            <div class="ring-layout">
              <div class="ring-chart-box" id="ringContainer"></div>
              <div class="ring-legend">
                <div v-for="n in nodes" :key="n.node_id" class="ring-legend-item">
                  <span class="ring-dot" :style="{ background: nodeColor(n.node_id) }"></span>
                  <span class="ring-name">{{ n.node_name }}</span>
                  <span class="ring-value">{{ n.connections || 0 }}</span>
                </div>
                <div class="ring-total">
                  <span>{{ $t('overview.total') }}</span>
                  <span class="ring-total-value">{{ totalConnections }}</span>
                </div>
              </div>
            </div>
          </div>
          <h3 class="section-title">{{ $t('overview.nodes') }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ $t('overview.node_id') }}</th>
                  <th>{{ $t('overview.node_name_th') }}</th>
                  <th>{{ $t('overview.status') }}</th>
                  <th>{{ $t('overview.connections_count') }}</th>
                  <th>{{ $t('overview.msg_per_sec') }}</th>
                  <th>{{ $t('overview.cpu') }}</th>
                  <th>{{ $t('overview.memory') }}</th>
                  <th>{{ $t('overview.uptime') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="n in nodes" :key="n.node_id" class="clickable-row" @click="showNode(n)">
                  <td>{{ n.node_id }}</td>
                  <td>{{ n.node_name }}</td>
                  <td><span :class="n.running ? 'status-online' : 'status-offline'">
                    {{ n.running ? $t('overview.online') : $t('overview.offline') }}
                  </span></td>
                  <td>{{ n.connections }}</td>
                  <td>-</td>
                  <td>{{ formatCpu(n.load1) }}</td>
                  <td>{{ formatBytes(n.memory_used) }}/{{ formatBytes(n.memory_total) }}</td>
                  <td>{{ formatUptime(n.uptime) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── Tab 3: 指标 ─── -->
        <div v-show="activeTab === 'metrics'">
          <div v-for="group in metricGroups" :key="group.key" class="metric-section">
            <h3 class="section-title">{{ group.label }}</h3>
            <div class="metric-grid">
              <div v-for="m in group.items" :key="m.key" class="metric-card">
                <div class="metric-label">{{ m.label }}</div>
                <div class="metric-value">{{ getMetric(m.key) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 节点详情弹窗 -->
        <node-detail :node="selectedNode" :visible="showNodeDetail" @close="showNodeDetail = false" />
      </div>
    `,
    setup() {
      // 标签页
      const localeState = Vue.inject('localeState');
      function $t(key, params) {
        void localeState.version;
        return window.i18n.$t(key, params);
      }

      const tabs = Vue.computed(function() {
        void localeState.version;
        return [
          { key: 'overview', label: $t('overview.title') },
          { key: 'nodes',    label: $t('overview.nodes_title') },
          { key: 'metrics',  label: $t('overview.metrics_title') },
        ];
      });
      const activeTab = ref('overview');

      const stats = ref({
        connections: 0,
        sessions: 0,
        subscriptions: 0,
        topics: 0,
        sharedSubscriptions: 0,
        retained: 0,
      });
      const nodes = ref([]);
      const nodesOnline = ref(0);
      const nodesTotal = ref(0);
      const pubRate = ref('0');
      const delRate = ref('0');
      const totalConnections = ref(0);
      const metricsData = ref({});

      // 时间范围
      const timeRanges = [
        { key: '1h', label: '1h' },
        { key: '6h', label: '6h' },
        { key: '12h', label: '12h' },
        { key: '1d', label: '1d' },
      ];
      const timeRange = ref('1h');

      // 节点详情
      const selectedNode = ref(null);
      const showNodeDetail = ref(false);

      // 指标分组（改用 $t 支持 i18n）
      const metricGroups = Vue.computed(function() {
        void localeState.version;
        return [
          { key: 'connections', label: $t('overview.group_connections'), items: [
            { key: 'client_connected', label: $t('overview.client_connected') },
            { key: 'client_disconnected', label: $t('overview.client_disconnected') },
            { key: 'sessions_count', label: $t('overview.sessions_count') },
            { key: 'handshakings.count', label: $t('overview.handshakings_count') },
            { key: 'handshakings.max', label: $t('overview.handshakings_max') },
            { key: 'handshakings_active.count', label: $t('overview.handshakings_active_count') },
            { key: 'handshakings_rate.count', label: $t('overview.handshakings_rate_count') },
            { key: 'handshakings_rate.max', label: $t('overview.handshakings_rate_max') },
          ]},
          { key: 'messages', label: $t('overview.group_messages'), items: [
            { key: 'messages_publish', label: $t('overview.messages_publish') },
            { key: 'messages_delivered', label: $t('overview.messages_delivered') },
            { key: 'messages_discarded', label: $t('overview.messages_discarded') },
          ]},
          { key: 'subs', label: $t('overview.group_subs'), items: [
            { key: 'subscriptions_count', label: $t('overview.subscriptions_count') },
            { key: 'shared_subscriptions_count', label: $t('overview.shared_subscriptions_count') },
          ]},
          { key: 'packets', label: $t('overview.group_packets'), items: [
            { key: 'packets_connect', label: 'CONNECT' },
            { key: 'packets_publish', label: 'PUBLISH' },
            { key: 'packets_subscribe', label: 'SUBSCRIBE' },
            { key: 'packets_pingreq', label: 'PINGREQ' },
          ]},
        ];
      });

      // 历史数据
      const metricsHistory = ref([]);
      const MAX_POINTS = 60;

      // 兼容 metrics API 返回的 dot 格式（messages.publish）和 underscore 格式（messages_publish）
      function ms(v, key) {
        if (v == null) return 0;
        var val = v[key];
        if (val != null) return +val;
        var alt = key.indexOf('.') >= 0 ? key.replace(/\./g, '_') : key.replace(/_/g, '.');
        return +(v[alt] || 0);
      }

      let timer = null;
      let chartMsgIn = null;
      let chartMsgOut = null;
      let chartMsgDropped = null;
      let chartConnections = null;
      let chartTopics = null;
      let chartSubscriptions = null;
      let gaugeConn = null;
      let msgRatePanel = null;
      let ringChart = null;

      function getMetric(key) {
        var v = metricsData.value[key];
        return v != null ? v : '-';
      }

      function formatCpu(load) {
        return load != null ? load.toFixed(1) + '%' : '-';
      }

      function formatBytes(bytes) {
        if (!bytes) return '-';
        var gb = bytes / (1024 * 1024 * 1024);
        return gb >= 1 ? gb.toFixed(1) + 'G' : (bytes / (1024 * 1024)).toFixed(0) + 'M';
      }

      function formatUptime(str) {
        if (!str) return '-';
        var isZh = window.i18n && window.i18n.locale && window.i18n.locale.indexOf('zh') === 0;
        // 解析各时间单位
        var parts = [];
        str.replace(/(\d+)\s*(days?|hours?|minutes?|seconds?)/gi, function(m, num, unit) {
          var key = unit.toLowerCase().replace(/s$/, '');
          parts.push({ key: key, num: parseInt(num, 10) });
        });
        if (parts.length === 0) return str;
        // 找到第一个非零位置
        var startIdx = parts.findIndex(function(p) { return p.num > 0; });
        if (startIdx === -1) startIdx = parts.length - 1; // 全部为0时至少显示最后一位
        var units = isZh
          ? { day: '天', hour: '小时', minute: '分', second: '秒' }
          : { day: ' day ', hour: ' hour ', minute: ' minute ', second: ' second ' };
        var result = '';
        for (var i = startIdx; i < parts.length; i++) {
          var p = parts[i];
          var u = units[p.key] || ' ' + p.key + ' ';
          result += p.num + u;
        }
        return result.trim() || '-';
      }

      function nodeColor(id) {
        var colors = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];
        return colors[(id - 1) % colors.length];
      }

      function setTimeRange(key) { timeRange.value = key; }

      function showNode(n) {
        selectedNode.value = n;
        showNodeDetail.value = true;
      }

      async function fetchData() {
        try {
          var [statsData, nodesData] = await Promise.all([
            http.get('/stats/sum').catch(function() { return null; }),
            http.get('/nodes').catch(function() { return null; }),
          ]);

          if (statsData) {
            var raw = statsData.stats || statsData;
            stats.value = {
              connections: raw['connections.count'] ?? 0,
              sessions: raw['sessions.count'] ?? 0,
              subscriptions: raw['subscriptions.count'] ?? 0,
              topics: raw['topics.count'] ?? 0,
              sharedSubscriptions: raw['subscriptions_shared.count'] ?? 0,
              retained: raw['retaineds.count'] ?? 0,
            };
            // 设备连接速率使用 handshakings_rate.count，并在仪表盘上标记 handshakings_rate.max
            var hsRate = raw['handshakings_rate.count'];
            var hsRateMax = raw['handshakings_rate.max'];
            if (hsRate != null && gaugeConn) {
              gaugeConn.update(+hsRate, hsRateMax != null ? +hsRateMax : 0);
            }
          }
          if (nodesData) {
            var list = Array.isArray(nodesData) ? nodesData : [];
            nodes.value = list;
            nodesOnline.value = list.filter(function(n) { return n.running; }).length;
            nodesTotal.value = list.length;
            totalConnections.value = list.reduce(function(s, n) { return s + (n.connections || 0); }, 0);
            if (ringChart) ringChart.update(list);
          }

          // 获取指标（使用 metrics/sum 汇总数据）
          var metricsSum = await http.get('/metrics/sum').catch(function() { return null; });
          if (metricsSum) {
            metricsData.value = metricsSum;
            var now = Date.now();
            metricsHistory.value.push({
              time: now,
              msgIn: ms(metricsSum, 'messages.publish'),
              msgOut: ms(metricsSum, 'messages.delivered'),
              msgDropped: ms(metricsSum, 'messages.dropped'),
              connections: stats.value.connections,
              topics: stats.value.topics,
              subscriptions: stats.value.subscriptions,
            });
            if (metricsHistory.value.length > MAX_POINTS) metricsHistory.value.shift();

            var arr = metricsHistory.value;
            if (arr.length >= 2) {
              var prev = arr[arr.length - 2];
              var curr = arr[arr.length - 1];
              var elapsed = (curr.time - prev.time) / 1000;
              var pubRate = (curr.msgIn - prev.msgIn) / elapsed;
              var delRate = (curr.msgOut - prev.msgOut) / elapsed;

              // 计算全部相邻差值的速率，用于条形图显示真实波动
              var inRates = [], outRates = [];
              for (var i = 1; i < arr.length; i++) {
                var dt = (arr[i].time - arr[i-1].time) / 1000;
                if (dt > 0) {
                  inRates.push({ t: arr[i].time, v: (arr[i].msgIn - arr[i-1].msgIn) / dt, c: Math.round(arr[i].msgIn - arr[i-1].msgIn) });
                  outRates.push({ t: arr[i].time, v: (arr[i].msgOut - arr[i-1].msgOut) / dt, c: Math.round(arr[i].msgOut - arr[i-1].msgOut) });
                }
              }

              if (msgRatePanel) {
                msgRatePanel.update({
                  inRate: +pubRate.toFixed(1),
                  outRate: +delRate.toFixed(1),
                  inHistory: inRates,
                  outHistory: outRates,
                  publish: ms(metricsSum, 'messages.publish'),
                  delivered: ms(metricsSum, 'messages.delivered'),
                  acked: ms(metricsSum, 'messages.acked'),
                });
              }
            }
          }

          updateCharts();
        } catch (e) {
          console.error('fetch overview error:', e);
        }
      }

      function updateCharts() {
        var data = metricsHistory.value;
        if (data.length < 2) return;

        var times = data.map(function(d) {
          var t = new Date(d.time);
          return t.getHours().toString().padStart(2,'0') + ':' + t.getMinutes().toString().padStart(2,'0');
        });

        function updateLineChart(chart, seriesName, values, color, areaColor) {
          if (!chart) return;
          var series = {
            name: seriesName, type: 'line', data: values, smooth: true,
            lineStyle: { color: color }, itemStyle: { color: color },
            symbol: 'none',
          };
          if (areaColor) series.areaStyle = { color: areaColor };
          chart.setOption({
            tooltip: { trigger: 'axis', textStyle: { color: '#000' }, confine: true },
            grid: { left: 40, right: 16, top: 24, bottom: 20 },
            xAxis: { data: times, axisLabel: { color: '#8899aa', fontSize: 11 }, axisLine: { lineStyle: { color: '#2a3245' } } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: '#2a3245' } }, axisLabel: { color: '#8899aa' } },
            legend: { show: false },
            series: [series],
          }, true);
        }

        var msgIn = data.map(function(d, i) { return i > 0 ? d.msgIn - data[i-1].msgIn : 0; });
        var msgOut = data.map(function(d, i) { return i > 0 ? d.msgOut - data[i-1].msgOut : 0; });
        var msgDropped = data.map(function(d, i) { return i > 0 ? d.msgDropped - data[i-1].msgDropped : 0; });

        updateLineChart(chartMsgIn, $t('overview.msg_in_trend'), msgIn, '#3b82f6');
        updateLineChart(chartMsgOut, $t('overview.msg_out_trend'), msgOut, '#22c55e');
        updateLineChart(chartMsgDropped, $t('overview.msg_dropped_trend'), msgDropped, '#ef4444');
        updateLineChart(chartConnections, $t('overview.connections_trend'), data.map(function(d) { return d.connections; }), '#f59e0b', 'rgba(245,158,11,0.1)');
        updateLineChart(chartTopics, $t('overview.topics_trend'), data.map(function(d) { return d.topics; }), '#8b5cf6');
        updateLineChart(chartSubscriptions, $t('overview.subscriptions_trend'), data.map(function(d) { return d.subscriptions; }), '#06b6d4');
      }

      onMounted(function() {
        fetchData();
        nextTick(function() {
          gaugeConn = new window.GaugeChart(document.getElementById('gaugeConnContainer'), 'gauge.connections', 'gauge.unit');
          msgRatePanel = new window.MsgRatePanel(document.getElementById('msgRateContainer'));
          ringChart = window.RingChart.init(document.getElementById('ringContainer'));
          chartMsgIn = echarts.init(document.getElementById('chartMsgIn'));
          chartMsgOut = echarts.init(document.getElementById('chartMsgOut'));
          chartMsgDropped = echarts.init(document.getElementById('chartMsgDropped'));
          chartConnections = echarts.init(document.getElementById('chartConnections'));
          chartTopics = echarts.init(document.getElementById('chartTopics'));
          chartSubscriptions = echarts.init(document.getElementById('chartSubscriptions'));
          fetchData();
        });
        timer = setInterval(fetchData, 2000);
      });

      onUnmounted(function() {
        if (timer) clearInterval(timer);
        if (gaugeConn) gaugeConn.dispose();
        if (msgRatePanel) msgRatePanel.dispose();
        if (ringChart) ringChart.dispose();
        if (chartMsgIn) chartMsgIn.dispose();
        if (chartMsgOut) chartMsgOut.dispose();
        if (chartMsgDropped) chartMsgDropped.dispose();
        if (chartConnections) chartConnections.dispose();
        if (chartTopics) chartTopics.dispose();
        if (chartSubscriptions) chartSubscriptions.dispose();
      });

      return {
        tabs, activeTab,
        stats, nodes, nodesOnline, nodesTotal, pubRate, delRate,
        totalConnections, metricsData, metricGroups, getMetric,
        timeRanges, timeRange, setTimeRange,
        selectedNode, showNodeDetail, showNode,
        formatCpu, formatBytes, formatUptime, nodeColor,
        $t,
      };
    },
  });
})();
