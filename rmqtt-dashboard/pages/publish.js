/* ============================================================
   RMQTT Dashboard — 消息发布页
   ============================================================ */
window.PublishPage = Vue.defineComponent({
  name: 'PublishPage',
  template: `
    <div style="max-width:600px;">
      <div class="form-group">
        <label>Topic</label>
        <input class="form-input" v-model="topic" placeholder="例如：data/sensor/temp" />
      </div>
      <div class="form-group">
        <label>Payload</label>
        <textarea class="form-textarea" v-model="payload" placeholder="消息内容"></textarea>
      </div>
      <div class="form-group" style="display:flex;gap:16px;">
        <div>
          <label>QoS</label>
          <select class="form-select" v-model.number="qos" style="width:100px;">
            <option :value="0">0</option>
            <option :value="1">1</option>
            <option :value="2">2</option>
          </select>
        </div>
        <div>
          <label>&nbsp;</label>
          <div style="display:flex;align-items:center;gap:6px;padding-top:8px;">
            <input type="checkbox" id="chkRetain" v-model="retain" />
            <label for="chkRetain" style="margin:0;">Retain</label>
          </div>
        </div>
      </div>
      <div class="form-group" v-if="result">
        <label>结果</label>
        <pre style="background:var(--bg);padding:8px;border-radius:var(--radius);font-size:12px;">{{ result }}</pre>
      </div>
      <button class="btn btn-primary" @click="doPublish" :disabled="!topic || sending">
        {{ sending ? '发布中...' : '发布消息' }}
      </button>
    </div>
  `,
  setup() {
    const topic = Vue.ref('');
    const payload = Vue.ref('');
    const qos = Vue.ref(0);
    const retain = Vue.ref(false);
    const sending = Vue.ref(false);
    const result = Vue.ref('');

    async function doPublish() {
      sending.value = true;
      result.value = '';
      try {
        const res = await http.post('/mqtt/publish', {
          topic: topic.value,
          payload: payload.value,
          qos: qos.value,
          retain: retain.value,
        });
        result.value = JSON.stringify(res, null, 2);
      } catch (e) {
        result.value = '发布失败: ' + e.message;
      } finally {
        sending.value = false;
      }
    }

    return { topic, payload, qos, retain, sending, result, doPublish };
  },
});
