chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "fix-field",
      title: "اصلاح متن فارسی در این فیلد",
      contexts: ["editable"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "fix-field" && tab && tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["fixer.js", "inject.js"]
    }).catch(err => console.error("NimFaselehYar Error:", err));
  }
});
