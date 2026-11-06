// 設定：音效／音樂、存檔備份碼、重新開始、製作資訊。
import { topBar, janitor, esc, confirmBox, bearSay } from './uikit.js';

let j = null, bar = null;

export default {
  async mount(root, params, app) {
    j = janitor();
    const s = app.save;
    const { GAME_NAME, VERSION } = app.config;
    root.classList.add('u-screen', 'u-settings');
    bar = topBar(app, { title: '設定' });
    root.appendChild(bar.el);
    const body = document.createElement('div');
    body.className = 'u-set';
    body.innerHTML = `
      <section class="card u-set-card u-enter" style="--d:0">
        <h3>聲音</h3>
        <div class="u-set-row"><span>音效</span><button class="u-switch" role="switch" data-k="sfx"><i></i></button></div>
        <div class="u-set-row"><span>音樂</span><button class="u-switch" role="switch" data-k="music"><i></i></button></div>
      </section>
      <section class="card u-set-card u-enter" style="--d:1">
        <h3>存檔備份</h3>
        <p class="u-set-note">換手機或清掉瀏覽器資料前，先把存檔碼複製起來，之後貼回來就能接著玩。</p>
        <div class="u-row"><button class="btn mint" data-act="export">匯出存檔碼</button><button class="btn ghost" data-act="import">匯入存檔碼</button></div>
        <div class="u-set-code" hidden>
          <textarea class="u-code" rows="4" spellcheck="false"></textarea>
          <div class="u-row"><button class="btn honey" data-act="copy">複製</button><button class="btn" data-act="doImport" hidden>匯入</button></div>
        </div>
      </section>
      <section class="card u-set-card u-enter" style="--d:2">
        <h3>重新開始</h3>
        <p class="u-set-note">所有關卡星星、衣服、家具和貼紙都會清掉。</p>
        <button class="btn ghost u-danger" data-act="reset">從頭開始玩</button>
      </section>
      <section class="card u-set-card u-enter" style="--d:3">
        <h3>製作資訊</h3>
        <p class="u-set-note"><b>${esc(GAME_NAME)}</b>　版本 ${esc(VERSION)}<br>畫面全部由程式繪製，音效與音樂由程式合成。<br>
        大不溜的叫聲：Wikimedia Commons〈Ladrido perro.ogg〉，作者 Edo.pt2，授權 CC0 1.0（公眾領域）。</p>
        <details class="u-credits"><summary>完整出處說明</summary><pre class="u-credits-txt">讀取中…</pre></details>
      </section>`;
    root.appendChild(body);
    const $ = sel => body.querySelector(sel);

    function drawSwitches() {
      const st = s.settings();
      body.querySelectorAll('.u-switch').forEach(b => {
        const on = !!st[b.dataset.k];
        b.classList.toggle('on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }

    let mode = null;
    j.on(body, 'click', async e => {
      const sw = e.target.closest('.u-switch');
      if (sw) {
        const k = sw.dataset.k;
        const v = !s.settings()[k];
        s.setSetting(k, v);
        if (k === 'sfx') app.audio.setSfx(v); else { app.audio.setMusic(v); if (v) app.audio.playMusic('home'); }
        app.audio.sfx('tap');
        drawSwitches();
        return;
      }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      app.audio.sfx('tap');
      const box = $('.u-set-code'), ta = $('.u-code');
      if (act === 'export') {
        mode = 'export';
        box.hidden = false;
        ta.value = s.exportCode();
        ta.readOnly = true;
        $('[data-act="copy"]').hidden = false;
        $('[data-act="doImport"]').hidden = true;
        ta.focus(); ta.select();
      } else if (act === 'import') {
        mode = 'import';
        box.hidden = false;
        ta.value = '';
        ta.readOnly = false;
        ta.placeholder = '把之前複製的存檔碼貼在這裡';
        $('[data-act="copy"]').hidden = true;
        $('[data-act="doImport"]').hidden = false;
        ta.focus();
      } else if (act === 'copy') {
        let ok = false;
        try { await navigator.clipboard.writeText(ta.value); ok = true; } catch (err) {
          ta.select();
          try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
        }
        app.toast(ok ? '已複製存檔碼！' : '請長按文字框手動複製');
      } else if (act === 'doImport') {
        const yes = await confirmBox(app, { title: '要匯入這個存檔嗎？', text: '目前的進度會被取代喔。', ok: '匯入' });
        if (!yes) return;
        if (s.importCode(ta.value)) {
          app.audio.setSfx(s.settings().sfx); app.audio.setMusic(s.settings().music);
          app.toast('匯入成功！歡迎回來～');
          drawSwitches();
          box.hidden = true;
        } else {
          bearSay(app, '這個存檔碼怪怪的，再檢查一次好嗎？');
        }
      } else if (act === 'reset') {
        const a = await confirmBox(app, { title: '真的要從頭開始嗎？', text: '所有星星、衣服、家具和貼紙都會不見喔。', ok: '要從頭開始', cancel: '不要', danger: true });
        if (!a) return;
        const b = await confirmBox(app, { title: '真的真的確定嗎？', text: '丁噹熊和大不溜會捨不得的…清掉就救不回來了。', ok: '確定清掉', cancel: '我再想想', danger: true });
        if (!b) return;
        s.reset();
        app.audio.setSfx(true); app.audio.setMusic(true);
        app.toast('已經重新開始囉～');
        app.go('home');
      }
    });
    drawSwitches();

    // 讀完整出處（失敗就算了）
    fetch('assets/sounds/CREDITS.txt').then(r => (r.ok ? r.text() : Promise.reject(r.status)))
      .then(t => { const p = $('.u-credits-txt'); if (p) p.textContent = t; })
      .catch(() => { const p = $('.u-credits-txt'); if (p) p.textContent = '（讀不到出處檔）'; });
  },
  unmount() {
    j?.clean(); j = null;
    bar?.destroy(); bar = null;
    document.querySelectorAll('.u-modal').forEach(m => m.remove());
  },
};
