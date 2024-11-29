chrome.tabs.onUpdated.addListener((tab_id, tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    const query_params = tab.url.substring(tab.url.indexOf("?") + 1);
    const url_params = new URLSearchParams(query_params);
    console.log(`url_params.v: ${url_params.get("v")}`);

    chrome.tabs.sendMessage(tab_id, {
      type: "NEW",
      video_id: url_params.get("v"),
    });
  }
});
