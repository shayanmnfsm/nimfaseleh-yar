(function() {
  'use strict';

  if (!window.NimFaselehYar) {
    console.error("NimFaselehYar fixer.js not loaded.");
    return;
  }

  const toFaDigits = (s) => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

  const showToast = (message) => {
    const oldToast = document.getElementById('nfy-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'nfy-toast';
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: '#1e293b',
      color: '#ffffff',
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      zIndex: '999999',
      direction: 'rtl',
      fontFamily: 'Tahoma, sans-serif',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    });
    toast.textContent = message;
    (document.body || document.documentElement).appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  // Set the value through the native setter so frameworks (React, Vue, ...)
  // observe the change; fall back to direct assignment.
  const setNativeValue = (element, value) => {
    try {
      const proto = element.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(element, value);
    } catch (e) {
      element.value = value;
    }
  };

  const defaultOptions = {
    arabicChars: true,
    digits: true,
    halfSpace: true,
    punctuation: true,
    latinDigits: false
  };

  const storageKey = "nfyOptions";
  const storage = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage.local : null;

  const processFix = (options) => {
    const el = document.activeElement;
    if (!el) return;

    let originalText = "";
    let isInput = false;

    if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|url|email|tel)$/i.test(el.type))) {
      originalText = el.value;
      isInput = true;
    } else if (el.isContentEditable) {
      originalText = el.textContent;
    } else {
      return;
    }

    if (!originalText) {
      showToast("متنی برای اصلاح پیدا نشد");
      return;
    }

    const { text: fixedText, counts } = window.NimFaselehYar.fixPersianText(originalText, options);
    const totalFixes = Object.values(counts).reduce((a, b) => a + b, 0);

    if (isInput) {
      setNativeValue(el, fixedText);
    } else {
      // Known limitation: setting textContent on a contenteditable element
      // drops its inner HTML formatting (bold, links, etc.).
      el.textContent = fixedText;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));

    if (totalFixes > 0) {
      showToast(`${toFaDigits(totalFixes)} اصلاح انجام شد`);
    } else {
      showToast("متنی برای اصلاح پیدا نشد");
    }
  };

  if (storage) {
    storage.get(storageKey, (res) => {
      processFix(res[storageKey] || defaultOptions);
    });
  } else {
    processFix(defaultOptions);
  }
})();
