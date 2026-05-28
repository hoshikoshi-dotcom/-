/* 電子野帳 PWA v2.6 - 折返・土木音声強化 */
(() => {
  'use strict';
  const SK = 'level_survey_projects_v2', LK = 'level_survey_v1';
  const store = { activeId: '', projects: [] };
  const $ = (s) => document.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 10);
  const fmt = (v, d = 3) => (v == null || isNaN(v)) ? '' : Number(v).toFixed(d);
  const nowIso = () => new Date().toISOString();

  function toast(msg, ms = 1800) {
    const el = $('#toast'); if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms);
  }

  const KAN = {'〇':'0','零':'0','れい':'0','ぜろ':'0','まる':'0','マル':'0',
    '一':'1','壱':'1','いち':'1','イチ':'1','ひと':'1',
    '二':'2','弐':'2','に':'2','ニ':'2','にい':'2','ニー':'2','ふた':'2',
    '三':'3','参':'3','さん':'3','サン':'3','み':'3',
    '四':'4','よん':'4','ヨン':'4','し':'4','よ':'4',
    '五':'5','伍':'5','ご':'5','ゴ':'5','いつ':'5',
    '六':'6','ろく':'6','ロク':'6','む':'6',
    '七':'7','なな':'7','ナナ':'7','しち':'7',
    '八':'8','はち':'8','ハチ':'8','や':'8',
    '九':'9','きゅう':'9','キュウ':'9','く':'9'};

  function parseNum(text) {
    if (!text) return null;
    let s = String(text).trim().replace(/\s+/g, '').replace(/(です|だよ|ね)$/g, '');
    if (/^[-+]?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
    s = s.replace(/メートル|ﾒｰﾄﾙ/g, '.').replace(/いって?ん/g, '1.').replace(/はって?ん/g, '8.')
         .replace(/じゅって?ん|じって?ん/g, '10.').replace(/てん|テン/g, '.').replace(/[点・，、,]/g, '.').replace(/[mMｍ]/g, '');
    const ks = Object.keys(KAN).sort((a, b) => b.length - a.length);
    for (const k of ks) s = s.split(k).join(KAN[k]);
    s = s.replace(/[^0-9.\-+]/g, '');
    if (!s || s === '.' || s === '-' || s === '+') return null;
    const dot = s.indexOf('.');
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
    const v = parseFloat(s);
    return isNaN(v) ? null : v;
  }

  // 測点名: 土木測量用の語彙拡張
  function parseName(text) {
    if (!text) return '';
    let s = String(text).trim().replace(/(です|ですね|ね|。|、)$/g, '');
    if (!s) return '';
    // 土木の測点キーワード
    const PT_KW = ['始点','終点','中間点','起点','中心点','中心','中央','交点','交差点','基点','視通点','変化点','曲点','頂点','終端','測点','仮BM','仮ベンチマーク','曲線始点','曲線終点'];
    for (const k of PT_KW) {
      if (s === k) return k.replace('仮ベンチマーク','仮BM');
      const m = s.match(new RegExp('^' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s　]*(\\d+)$'));
      if (m) return k.replace('仮ベンチマーク','仮BM') + m[1];
    }
    // ナンバーXXX+YYY形式
    let n = s.replace(/[\s　]/g, '')
      .replace(/(エヌオー|エヌ・オー|ナンバー|なんばー|ばんごう|番号|ナンバ)\.?/gi, 'No.')
      .replace(/(ステーション|すてーしょん|STA|sta)\.?/gi, 'STA.')
      .replace(/(ケーピー|けーぴー|KP|kp)\.?/gi, 'KP.')
      .replace(/(プラス|ぷらす|たす|＋)/g, '+')
      .replace(/(マイナス|まいなす|ひく|−|‐)/g, '-')
      .replace(/[点・]/g, '.')
      .replace(/[、，,。]+/g, '');
    const ks = Object.keys(KAN).sort((a, b) => b.length - a.length);
    for (const k of ks) n = n.split(k).join(KAN[k]);
    // No.XXX+YYY / STA.XXX+YYY / KP.XXX+YYY
    let m = n.match(/^(No\.|STA\.|KP\.)?(\d+(?:\.\d+)?)([+\-]\d+(?:\.\d+)?)?$/i);
    if (m) {
      const prefix = m[1] || (m[3] ? 'No.' : '');
      const main = m[2].replace(/^0+(?=\d)/, '');
      return `${prefix}${main}${m[3] || ''}`;
    }
    if (/^\d+(\.\d+)?$/.test(n)) return n;
    // 略称
    s = s.replace(/びーえむ|ビーエム|ベンチマーク|べんちまーく/gi, 'BM');
    s = s.replace(/てぃーぴー|ティーピー|ターニング|ターニングポイント|もりかえてん|もりかえ点|もりかえ/gi, 'TP');
    s = s.replace(/びーぴー|ビーピー/gi, 'BP');
    s = s.replace(/いーぴー|イーピー/gi, 'EP');
    s = s.replace(/あいぴー|アイピー/gi, 'IP');
    s = s.replace(/びーしー|ビーシー/gi, 'BC');
    s = s.replace(/いーしー|イーシー/gi, 'EC');
    s = s.replace(/ぴーしー|ピーシー/gi, 'PC');
    s = s.replace(/ぴーてぃー|ピーティー/gi, 'PT');
    s = s.replace(/シーエル|しーえる|センターライン|センター・ライン/gi, 'CL');
    s = s.replace(/ハイフン/g, '-');
    return s.replace(/[\s　]+/g, '');
  }

  // 備考: 土木用語の誤認識を軽く補正
  const NOTE_CORR = [
    [/もりかえ(点)?/g, 'もりかえ点'],
    [/(視通)(良好|不良)?/g, (m,a,b)=>'視通'+(b||'')],
    [/タチアイ|たちあい/g, '立会'],
    [/ケンソク|けんそく/g, '検測'],
    [/デキガタ|できがた/g, '出来形'],
    [/ロショウ|ろしょう/g, '路床'],
    [/ロバン|ろばん/g, '路盤'],
    [/ヒョウソウ|ひょうそう/g, '表層'],
    [/キソウ|きそう/g, '基層'],
    [/モリド|もりど/g, '盛土'],
    [/キリド|きりど/g, '切土'],
    [/ノリメン|のりめん/g, '法面'],
    [/ノリカタ|のりかた/g, '法肩'],
    [/ノリジリ|のりじり/g, '法尻'],
    [/ゴガン|ごがん/g, '護岸'],
    [/ソッコウ|そっこう/g, '側溝'],
    [/カンキョ|かんきょ/g, '管渠'],
    [/シュウスイマス|しゅうすいます/g, '集水桝'],
    [/ハイスイ|はいすい/g, '排水'],
    [/オセン|おせん/g, '汚染'],
    [/シツドウ|しつどう/g, '湿土'],
    [/コンクリート/g, 'コンクリート'],
    [/テッキン|てっきん/g, '鉄筋'],
    [/ハイキン|はいきん/g, '配筋'],
    [/コウシュ|こうしゅ/g, '工種'],
    [/ヒンシツ|ひんしつ/g, '品質'],
    [/シンセツ|しんせつ/g, '新設'],
    [/フッキュウ|ふっきゅう/g, '復旧'],
    [/シクツ|しくつ/g, '試掘'],
    [/トドメ|どどめ/g, '土留'],
    [/カクニン|かくにん/g, '確認']
  ];
  function parseNote(text) {
    if (!text) return '';
    let s = String(text).trim().replace(/(です|ですね|だよ|ね|。)$/g, '');
    s = s.replace(/(\s|　)+/g, ' ').trim();
    for (const [re, rep] of NOTE_CORR) s = s.replace(re, rep);
    return s;
  }

  function ap() { return store.projects.find(p => p.id === store.activeId) || null; }
  function save() { try { localStorage.setItem(SK, JSON.stringify(store)); } catch(e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(SK);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.projects)) {
          store.activeId = d.activeId || '';
          store.projects = d.projects.map(p => ({ id: p.id, name: p.name || '無題',
            rows: Array.isArray(p.rows) ? p.rows : [], updatedAt: p.updatedAt || nowIso() }));
          return true;
        }
      }
      const lg = localStorage.getItem(LK);
      if (lg) {
        const d = JSON.parse(lg);
        if (d && Array.isArray(d.rows)) {
          const rows = d.rows.map(r => ({ id: r.id || uid(), name: r.name || '',
            bs: r.bs || '', fs: r.fs || '', gl: r.elevInput || '', note: r.note || '' }));
          const p = { id: uid(), name: d.projectName || '旧データ', rows, updatedAt: nowIso() };
          store.projects = [p]; store.activeId = p.id; save(); return true;
        }
      }
    } catch (e) {}
    return false;
  }
  function ensureP() {
    if (!store.projects.length) {
      const p = { id: uid(), name: '現場1',
        rows: [{ id: uid(), name: 'BM', bs: '', fs: '', gl: '', note: '' },
               { id: uid(), name: '1', bs: '', fs: '', gl: '', note: '' },
               { id: uid(), name: '2', bs: '', fs: '', gl: '', note: '' }],
        updatedAt: nowIso() };
      store.projects.push(p); store.activeId = p.id;
    }
    if (!store.activeId || !ap()) store.activeId = store.projects[0].id;
    const p = ap();
    if (!p.rows || !p.rows.length) {
      p.rows = [{ id: uid(), name: 'BM', bs: '', fs: '', gl: '', note: '' },
                { id: uid(), name: '1', bs: '', fs: '', gl: '', note: '' }];
    }
  }

  function calc() {
    const p = ap(); if (!p) return [];
    let cIH = null; const out = [];
    for (const r of p.rows) {
      const bs = r.bs == '' || r.bs == null ? null : Number(r.bs);
      const fs = r.fs == '' || r.fs == null ? null : Number(r.fs);
      const m = r.gl == '' || r.gl == null ? null : Number(r.gl);
      let gl = null, ih = null, src = '';
      if (m != null && !isNaN(m)) { gl = m; src = 'manual'; }
      else if (cIH != null && fs != null && !isNaN(fs)) { gl = cIH - fs; src = 'calc'; }
      if (gl != null && bs != null && !isNaN(bs)) { ih = gl + bs; cIH = ih; }
      out.push({ ih, gl, source: src });
    }
    return out;
  }

  let rec = null, recBuf = '', tgt = null;
  function setupRec() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = 'ja-JP'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 3;
    r.onresult = (ev) => {
      let txt = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      recBuf = txt;
      let disp = txt || '―';
      if (tgt && tgt.mode === 'note') disp = parseNote(txt) || txt || '―';
      else if (tgt && tgt.mode === 'text') disp = parseName(txt) || txt || '―';
      else { const v = parseNum(txt); disp = v != null ? fmt(v) : (txt || '―'); }
      $('#voiceResult').textContent = disp;
      const last = ev.results[ev.results.length - 1];
      if (last && last.isFinal) {
        clearTimeout(window._voiceAutoT);
        window._voiceAutoT = setTimeout(() => closeVoice(true), 250);
      }
    };
    r.onend = () => $('#voiceMicBtn').classList.remove('recording');
    r.onerror = (e) => {
      $('#voiceMicBtn').classList.remove('recording');
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('マイク権限を許可してください');
      else if (e.error === 'no-speech') toast('音声を検出できませんでした');
    };
    return r;
  }
  function openVoice(row, field, label, mode) {
    tgt = { row, field, label, mode: mode || 'number' };
    $('#voiceTarget').textContent = `${label} - ${row.name || ''}`;
    $('#voiceResult').textContent = '―';
    let hint = '例:「いってんにいさんよん」「1.234」';
    if (mode === 'text') hint = '例:「No.295+20」「KP100+50」「STA200」「始点」「中間点」「終点」「BM」「TP」「もりかえ」';
    else if (mode === 'note') hint = '例:「もりかえ点」「視通良好」「立会」「検測」「出来形」「路床」「盛土」「法面」「鉄筋」など';
    $('#voiceHint').textContent = hint;
    recBuf = '';
    $('#voiceModal').classList.add('show');
    if (!rec) rec = setupRec();
    if (!rec) { $('#voiceResult').textContent = '※ 非対応'; toast('Safari (iOS 14.5+)で利用可'); return; }
    try { rec.start(); $('#voiceMicBtn').classList.add('recording'); } catch (e) {}
  }
  function closeVoice(commit) {
    clearTimeout(window._voiceAutoT);
    try { rec && rec.stop(); } catch (e) {}
    $('#voiceMicBtn').classList.remove('recording');
    if (commit && tgt) {
      let v = null;
      if (tgt.mode === 'note') v = parseNote(recBuf);
      else if (tgt.mode === 'text') v = parseName(recBuf);
      else { const n = parseNum(recBuf); v = n != null ? String(n) : null; }
      if (v) {
        tgt.row[tgt.field] = v;
        mark(); render();
        toast(`${tgt.label} = ${tgt.mode === 'number' ? fmt(Number(v)) : v}`);
      } else {
        toast('認識できませんでした');
      }
    }
    $('#voiceModal').classList.remove('show');
    tgt = null; recBuf = '';
  }
  function mark() { const p = ap(); if (p) p.updatedAt = nowIso(); save(); }

  function saveFocus() {
    const a = document.activeElement;
    if (!a || !a.dataset || !a.dataset.fid) return null;
    return { fid: a.dataset.fid, pos: a.selectionStart, end: a.selectionEnd };
  }
  function restoreFocus(s) {
    if (!s) return;
    const el = document.querySelector(`[data-fid="${s.fid}"]`);
    if (el) {
      el.focus();
      try { el.setSelectionRange(s.pos != null ? s.pos : el.value.length, s.end != null ? s.end : el.value.length); } catch (e) {}
    }
  }
  function autoResize(el) {
    if (!el) return;
    el.style.height = 'auto';
    const h = Math.max(42, el.scrollHeight);
    el.style.height = h + 'px';
  }

  function mkInput(row, field, label, opts) {
    opts = opts || {};
    const w = document.createElement('div'); w.className = 'cell-wrap';
    const i = document.createElement(opts.multiline ? 'textarea' : 'input');
    i.className = 'cell-input';
    if (opts.multiline) { i.rows = 1; }
    else { i.type = 'text'; if (opts.numeric) i.inputMode = 'decimal'; }
    i.value = opts.value != null ? opts.value : (row[field] || '');
    i.placeholder = label;
    i.dataset.fid = `${row.id}_${field}`;
    i.addEventListener('input', () => {
      const v = opts.numeric ? i.value.replace(/[^0-9.\-]/g, '') : i.value;
      row[field] = v;
      mark();
      if (opts.multiline) autoResize(i);
      if (opts.recalc) render();
    });
    w.appendChild(i);
    if (opts.mic !== false) {
      const m = document.createElement('button');
      m.className = 'mic-btn'; m.type = 'button'; m.textContent = '🎤'; m.title = '音声入力';
      const voiceMode = opts.voiceMode || (opts.numeric ? 'number' : 'text');
      m.onclick = (e) => { e.preventDefault(); openVoice(row, field, label, voiceMode); };
      w.appendChild(m);
    }
    return { wrap: w, input: i };
  }

  function mkGL(row, cGL) {
    const w = document.createElement('div'); w.className = 'cell-wrap';
    const i = document.createElement('input');
    i.className = 'cell-input'; i.type = 'text'; i.inputMode = 'decimal';
    if (row.gl) i.value = row.gl;
    else if (cGL != null) i.value = fmt(cGL);
    else i.value = '';
    i.placeholder = 'GL';
    i.dataset.fid = `${row.id}_gl`;
    i.addEventListener('input', () => {
      row.gl = i.value.replace(/[^0-9.\-]/g, '');
      mark(); render();
    });
    w.appendChild(i);
    const m = document.createElement('button');
    m.className = 'mic-btn'; m.type = 'button'; m.textContent = '🎤'; m.title = '音声入力';
    m.onclick = (e) => { e.preventDefault(); openVoice(row, 'gl', 'GL', 'number'); };
    w.appendChild(m);
    return w;
  }

  function render() {
    const focus = saveFocus();
    const p = ap(); if (!p) return;
    const c = calc(); const tb = $('#rowsBody'); tb.innerHTML = '';
    let sBS = 0, sFS = 0;
    const taList = [];
    p.rows.forEach((r, i) => {
      const tr = document.createElement('tr'); tr.dataset.id = r.id;
      // 測点 (折返textarea)
      const t1 = document.createElement('td'); const nameC = mkInput(r, 'name', '測点', { multiline: true });
      t1.appendChild(nameC.wrap); tr.appendChild(t1); taList.push(nameC.input);
      // BS
      const t2 = document.createElement('td'); t2.appendChild(mkInput(r, 'bs', 'BS', { numeric: true, recalc: true }).wrap); tr.appendChild(t2);
      // IH
      const t3 = document.createElement('td'); const ih = c[i].ih;
      t3.innerHTML = `<span class="cell-readonly ${ih == null ? 'empty' : ''}">${ih != null ? fmt(ih) : '―'}</span>`;
      tr.appendChild(t3);
      // FS
      const t4 = document.createElement('td'); t4.appendChild(mkInput(r, 'fs', 'FS', { numeric: true, recalc: true }).wrap); tr.appendChild(t4);
      // GL
      const t5 = document.createElement('td'); t5.appendChild(mkGL(r, c[i].gl)); tr.appendChild(t5);
      // ±
      const tAct = document.createElement('td');
      const wA = document.createElement('div'); wA.className = 'row-actions';
      const a = document.createElement('button'); a.className = 'mini-btn add'; a.textContent = '+'; a.onclick = () => insRow(i);
      const d = document.createElement('button'); d.className = 'mini-btn del'; d.textContent = '−'; d.onclick = () => delRow(i);
      wA.appendChild(a); wA.appendChild(d); tAct.appendChild(wA); tr.appendChild(tAct);
      // 備考 (折返textarea)
      const tNote = document.createElement('td'); const noteC = mkInput(r, 'note', '備考', { multiline: true, voiceMode: 'note' });
      tNote.appendChild(noteC.wrap); tr.appendChild(tNote); taList.push(noteC.input);
      tb.appendChild(tr);
      const b = parseFloat(r.bs); if (!isNaN(b)) sBS += b;
      const f = parseFloat(r.fs); if (!isNaN(f)) sFS += f;
    });
    $('#sumBS').textContent = fmt(sBS);
    $('#sumFS').textContent = fmt(sFS);
    $('#diff').textContent = fmt(sBS - sFS);
    $('#ptCount').textContent = p.rows.length;
    $('#projectName').value = p.name || '';
    $('#appTitle').textContent = p.name || 'level-survey';
    refreshSel();
    // textarea自動リサイズ (DOM挿入後)
    requestAnimationFrame(() => taList.forEach(autoResize));
    restoreFocus(focus);
  }
  function insRow(i) { const p = ap(); p.rows.splice(i + 1, 0, { id: uid(), name: '', bs: '', fs: '', gl: '', note: '' }); mark(); render(); }
  function delRow(i) {
    const p = ap();
    if (p.rows.length <= 1) { toast('これ以上削除できません'); return; }
    if (!confirm('この行を削除しますか?')) return;
    p.rows.splice(i, 1); mark(); render();
  }
  function refreshSel() {
    const sel = $('#projectSelect'); if (!sel) return;
    sel.innerHTML = '';
    store.projects.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .forEach(p => {
        const o = document.createElement('option');
        o.value = p.id; o.textContent = `${p.name || '無題'} (${p.rows.length}点)`;
        if (p.id === store.activeId) o.selected = true;
        sel.appendChild(o);
      });
  }
  function newProj() {
    const name = prompt('現場名を入力', `現場${store.projects.length + 1}`);
    if (!name) return;
    const p = { id: uid(), name: name.trim(),
      rows: [{ id: uid(), name: 'BM', bs: '', fs: '', gl: '', note: '' },
             { id: uid(), name: '1', bs: '', fs: '', gl: '', note: '' }],
      updatedAt: nowIso() };
    store.projects.push(p); store.activeId = p.id; save(); render(); toast(`「${p.name}」作成`);
  }
  function renameProj() {
    const p = ap(); if (!p) return;
    const name = prompt('現場名を変更', p.name || '');
    if (name == null) return;
    p.name = name.trim() || '無題';
    mark(); render(); toast('現場名を変更しました');
  }
  function delProj() {
    const p = ap(); if (!p) return;
    if (store.projects.length <= 1) { toast('最後の現場は削除不可'); return; }
    if (!confirm(`現場「${p.name}」を削除?`)) return;
    store.projects = store.projects.filter(x => x.id !== p.id);
    store.activeId = store.projects[0].id; save(); render(); toast('削除しました');
  }
  function dupProj() {
    const p = ap(); if (!p) return;
    const np = { id: uid(), name: `${p.name} のコピー`, rows: p.rows.map(r => ({ ...r, id: uid() })), updatedAt: nowIso() };
    store.projects.push(np); store.activeId = np.id; save(); render(); toast('複製しました');
  }
  function ymd() { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`; }

  function expXlsx() {
    if (typeof XLSX === 'undefined') { toast('Excel未読込'); return; }
    const p = ap(); if (!p) return;
    const c = calc();
    const aoa = [
      ['水準測量野帳','','','','','',''],
      ['現場:', p.name||'', '', '日付:', new Date().toLocaleDateString('ja-JP'),'',''],
      [],
      ['No','測点','BS (後視)','IH (器械高)','FS (前視)','GL (地盤高)','備考']
    ];
    let sBS=0,sFS=0;
    p.rows.forEach((r,i) => {
      const ci=c[i]; const bs=r.bs===''?'':Number(r.bs); const fs=r.fs===''?'':Number(r.fs);
      const ih=ci.ih==null?'':Number(ci.ih.toFixed(4)); const gl=ci.gl==null?'':Number(ci.gl.toFixed(4));
      aoa.push([i+1, r.name||'', bs, ih, fs, gl, r.note||'']);
      const b=parseFloat(r.bs); if (!isNaN(b)) sBS+=b;
      const f=parseFloat(r.fs); if (!isNaN(f)) sFS+=f;
    });
    aoa.push([], ['合計','',Number(sBS.toFixed(4)),'',Number(sFS.toFixed(4)),'',''],
      ['差(BS-FS)','',Number((sBS-sFS).toFixed(4)),'','','','']);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols']=[{wch:6},{wch:14},{wch:10},{wch:10},{wch:10},{wch:10},{wch:18}];
    ws['!merges']=[{s:{r:0,c:0},e:{r:0,c:6}}];
    XLSX.utils.book_append_sheet(wb, ws, '水準野帳');
    XLSX.writeFile(wb, `水準野帳_${p.name||'project'}_${ymd()}.xlsx`);
    toast('Excel出力');
  }
  function expJson() {
    const blob = new Blob([JSON.stringify(store,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`level-survey-backup_${ymd()}.json`; a.click();
    URL.revokeObjectURL(url); toast('JSONバックアップ');
  }
  function impJson(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !Array.isArray(d.projects)) throw new Error('形式不正');
        if (!confirm(`${d.projects.length}件読み込みます。`)) return;
        store.activeId = d.activeId || (d.projects[0] && d.projects[0].id) || '';
        store.projects = d.projects; save(); render(); toast('読み込みました');
      } catch (e) { toast('読み込み失敗: '+e.message); }
    };
    r.readAsText(file);
  }

  function on(s, ev, fn) { const e = $(s); if (e) try { e.addEventListener(ev, fn); } catch(x){} }
  function sc(s, fn) { const e = $(s); if (e) e.onclick = fn; }
  function hideMenu() { const m = $('#menuPop'); if (m) m.classList.remove('show'); }

  function bindUI() {
    try {
      on('#projectName', 'input', (e) => {
        const p = ap(); if (p) { p.name = e.target.value; mark(); $('#appTitle').textContent = p.name||'level-survey'; refreshSel(); }
      });
      on('#projectSelect', 'change', (e) => { store.activeId = e.target.value; save(); render(); });
      sc('#renameProjectBtn', renameProj);
      sc('#newProjectBtn', newProj);
      sc('#dupProjectBtn', dupProj);
      sc('#delProjectBtn', delProj);
      sc('#addRowBtn', () => { const p = ap(); p.rows.push({id:uid(),name:'',bs:'',fs:'',gl:'',note:''}); mark(); render(); });
      sc('#exportBtn', expXlsx);
      sc('#menuBtn', (e) => { e.stopPropagation(); const m=$('#menuPop'); if(m)m.classList.toggle('show'); });
      document.addEventListener('click', (e) => {
        const m = $('#menuPop');
        if (m && !m.contains(e.target) && e.target.id !== 'menuBtn') m.classList.remove('show');
      });
      sc('#menuClear', () => {
        const p = ap(); if (!confirm(`現場「${p.name}」を全クリア?`)) return;
        p.rows = [{id:uid(),name:'BM',bs:'',fs:'',gl:'',note:''},{id:uid(),name:'1',bs:'',fs:'',gl:'',note:''}];
        mark(); render(); hideMenu();
      });
      sc('#menuSample', () => {
        const p = ap();
        p.rows = [
          {id:uid(),name:'BM',bs:'1.234',fs:'',gl:'10.000',note:'基準点 視通良好'},
          {id:uid(),name:'No.295+20',bs:'',fs:'0.823',gl:'',note:'路床高'},
          {id:uid(),name:'2',bs:'1.456',fs:'1.234',gl:'',note:'TP もりかえ点'},
          {id:uid(),name:'中間点',bs:'',fs:'0.987',gl:'',note:'盛土区間'},
          {id:uid(),name:'終点',bs:'',fs:'1.123',gl:'',note:'EP 検測立会'}
        ];
        mark(); render(); hideMenu(); toast('サンプル入力');
      });
      sc('#menuExport', () => { expXlsx(); hideMenu(); });
      sc('#menuExportJson', () => { expJson(); hideMenu(); });
      sc('#menuImportJson', () => { const f = $('#importFile'); if (f) f.click(); hideMenu(); });
      on('#importFile', 'change', (e) => { const f = e.target.files[0]; if (f) impJson(f); e.target.value = ''; });
      sc('#menuPrint', () => { window.print(); hideMenu(); });
      sc('#helpBtn', () => alert(
        '【使い方】\n1. 「現場」で切替、✏改名/＋新規/📋複製/🗑削除\n2. 各セルは手入力もOK、🎤で音声入力\n3. 1行目GLに既知標高を入力\n4. BS/FS入力でIH/GLを自動計算\n5. GLは手入力で上書き可\n6. ±列で行追加/削除\n7. 測点・備考は長文なら自動折返\n8. 備考は右側スクロール\n9. 「出力」でExcelダウンロード\n\n【測点 音声例】\n・「ナンバー295プラス20」「295+20」→ No.295+20\n・「KP100+50」「STA200」「始点」「中間点」「終点」\n・「BM」「TP」「BC」「EC」「もりかえ」\n\n【備考 音声例】\n・路床/路盤/表層/基層/盛土/切土/法面\n・もりかえ点/視通良好/立会/検測/出来形\n・鉄筋/配筋/コンクリート/側溝/排水'
      ));
      sc('#voiceMicBtn', () => {
        if (!rec) rec = setupRec();
        if (!rec) { toast('音声入力非対応'); return; }
        try { rec.start(); $('#voiceMicBtn').classList.add('recording'); recBuf=''; $('#voiceResult').textContent='―'; }
        catch (e) { try { rec.stop(); } catch(_){} }
      });
      sc('#voiceCancel', () => closeVoice(false));
      sc('#voiceConfirm', () => closeVoice(true));
      on('#voiceModal', 'click', (e) => { if (e.target.id === 'voiceModal') closeVoice(false); });
    } catch (e) {
      console.error('bindUI:', e);
      toast('UI初期化エラー: ' + e.message);
    }
  }

  function init() {
    try {
      load(); ensureP(); bindUI(); render();
      try { if (!rec) rec = setupRec(); } catch (e) {}
    } catch (e) { console.error('init:', e); alert('起動エラー: '+e.message); }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
