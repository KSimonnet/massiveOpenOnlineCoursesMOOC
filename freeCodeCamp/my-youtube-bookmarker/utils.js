// https://developer.chrome.com/docs/extensions/reference/api/tabs#get_the_current_tab
export async function getCurrentTab() {
  const tabs = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  });

  return tabs[0];
}
