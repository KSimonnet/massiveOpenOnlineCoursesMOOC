import { getCurrentTab } from "./utils";

// adding a new bookmark row to the popup
const addNewBookmark = () => {};

const viewBookmarks = () => {};

const onPlay = (e) => {};

const onDelete = (e) => {};

const setBookmarkAttributes = () => {};

document.addEventListener("DOMContentLoaded", async () => {
  const active_tab = await getCurrentTab();
  console.log(`active_tab from content script: ${active_tab.url}`); // active_tab.url is the URL of the current tab
  const query_params = active_tab.url.substring(
    active_tab.url.indexOf("?") + 1,
  );
  const url_params = new URLSearchParams(query_params);
  console.log(`url_params from content script: ${url_params}`);

  const curr_video = url_params.get("v");

  if (curr_video && active_tab.url.includes("youtube.com/watch")) {
    // chrome.storage.sync.get(curr_video, (data) => {
    //   const curr_video_bookmarks = data[curr_video]
    //     ? JSON.parse(data[curr_video])
    //     : [];
    // });
  } else {
    const container = document.querySelector(".container");
    console.log("container: ", container);
    container.innerHTML =
      "<div class='title'>This page doesn't contain a YouTube video</div>";
  }
});
