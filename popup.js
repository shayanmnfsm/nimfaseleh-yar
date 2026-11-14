'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('input');
  const outputEl = document.getElementById('output');
  const fixBtn = document.getElementById('fixBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const themeBtn = document.getElementById('themeBtn');
  const statsEl = document.getElementById('stats');
  const charCountEl = document.getElementById('charCount');

  const optionsMap = {
    arabicChars: document.getElementById('opt-arabicChars'),
    digits: document.getElementById('opt-digits'),
    halfSpace: document.getElementById('opt-halfSpace'),
    punctuation: document.getElementById('opt-punctuation'),
    latinDigits: document.getElementById('opt-latinDigits')
  };

  const catNames = {
    arabicChars: "حروف عربی",
    digits: "اعداد عربی",
    halfSpace: "نیم‌فاصله",
    punctuation: "نشانه‌گذاری",
    latinDigits: "اعداد لاتین"
  };

  const storage = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null;

  const toFaDigits = (s) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

  const debounce = (fn, ms) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  };

  const systemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const currentOptions = () => {
    const opts = {};
    for (const key in optionsMap) opts[key] = optionsMap[key].checked;
    return opts;
  };

  const saveOptions = () => {
    const opts = currentOptions();
    if (storage) storage.set({ nfyOptions: opts });
    return opts;
  };

  const saveDraft = debounce(() => {
    if (storage) storage.set({ nfyDraft: inputEl.value });
  }, 500);

  const updateCharCount = () => {
    const n = inputEl.value.length;
    charCountEl.textContent = n ? `${toFaDigits(n)} حرف` : '';
  };

  const runFix = () => {
    const raw = inputEl.value;
    if (!raw.trim()) {
      outputEl.value = '';
      statsEl.textContent = 'متنی وارد نشده است';
      return;
    }

    const { text, counts } = window.NimFaselehYar.fixPersianText(raw, currentOptions());
    outputEl.value = text;

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) {
      statsEl.textContent = 'متنی برای اصلاح پیدا نشد — متن شما درست است';
    } else {
      let msg = `${toFaDigits(total)} اصلاح انجام شد\n`;
      const details = [];
      for (const k in counts) {
        if (counts[k] > 0) details.push(`${catNames[k]}: ${toFaDigits(counts[k])}`);
      }
      statsEl.textContent = msg + details.join('، ');
    }
  };

  const liveFix = debounce(runFix, 300);

  const copyOutput = () => {
    if (!outputEl.value) return;
    const text = outputEl.value;

    const doSuccess = () => {
      const original = copyBtn.textContent;
      copyBtn.textContent = 'کپی شد ✓';
      setTimeout(() => copyBtn.textContent = original, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doSuccess).catch(() => {
        outputEl.select();
        document.execCommand('copy');
        doSuccess();
      });
    } else {
      outputEl.select();
      document.execCommand('copy');
      doSuccess();
    }
  };

  const loadSettings = () => {
    const defaults = {
      arabicChars: true,
      digits: true,
      halfSpace: true,
      punctuation: true,
      latinDigits: false
    };

    const apply = (res) => {
      applyTheme(res.nfyTheme || systemTheme());
      const opts = res.nfyOptions || defaults;
      for (const key in optionsMap) {
        optionsMap[key].checked = opts[key] ?? defaults[key];
      }
      if (typeof res.nfyDraft === 'string' && res.nfyDraft) {
        inputEl.value = res.nfyDraft;
        updateCharCount();
        runFix();
      }
    };

    if (storage) {
      storage.get(['nfyTheme', 'nfyOptions', 'nfyDraft'], apply);
    } else {
      apply({});
    }
    inputEl.focus();
  };

  fixBtn.addEventListener('click', runFix);

  copyBtn.addEventListener('click', copyOutput);

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    statsEl.textContent = 'هنوز متنی اصلاح نشده است';
    updateCharCount();
    if (storage) storage.remove('nfyDraft');
    inputEl.focus();
  });

  inputEl.addEventListener('input', () => {
    updateCharCount();
    saveDraft();
    liveFix();
  });

  inputEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runFix();
      copyOutput();
    }
  });

  for (const key in optionsMap) {
    optionsMap[key].addEventListener('change', () => {
      saveOptions();
      if (inputEl.value.trim()) runFix();
    });
  }

  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    if (storage) storage.set({ nfyTheme: next });
  });

  loadSettings();
});
