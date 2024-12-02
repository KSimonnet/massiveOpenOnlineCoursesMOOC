import { getCurrentTab } from "./utils.js";

const addNewBookmark = (bookmarks_container, bookmark) => {
  const bookmark_title_elm = document.createElement("div");
  const controls_elm = document.createElement("div");
  const new_bookmark = document.createElement("div");

  bookmark_title_elm.textContent = bookmark.desc;
  bookmark_title_elm.className = "bookmark-title";
  controls_elm.className = "bookmark-controls";

  setBookmarkAttributes("play", onPlay, controls_elm);
  setBookmarkAttributes("delete", onDelete, controls_elm);

  new_bookmark.id = `bookmark-${bookmark.time}`;
  new_bookmark.className = "bookmark";
  new_bookmark.setAttribute("timestamp", bookmark.time);

  new_bookmark.appendChild(bookmark_title_elm);
  new_bookmark.appendChild(controls_elm);
  bookmarks_container.appendChild(new_bookmark);
};

const viewBookmarks = (existing_bookmarks = []) => {
  // reset the content of the bookmarks container
  const bookmarks_container = document.getElementById("bookmarks");
  bookmarks_container.innerHTML = "";

  if (existing_bookmarks.length > 0) {
    existing_bookmarks.forEach((bookmark) => {
      addNewBookmark(bookmarks_container, bookmark);
    });
  } else {
    bookmarks_container.innerHTML = '<i class="row">No bookmarks found</i>';
  }

  return;
};

const onPlay = async (e) => {
  const active_tab = await getCurrentTab();
  const bookmark_timestamp =
    e.target.parentNode.parentNode.getAttribute("timestamp");

  // update Chrome storage
  chrome.tabs.sendMessage(active_tab.id, {
    type: "PLAY",
    bkm_timestamp: bookmark_timestamp,
  });
};

const onDelete = async (e) => {
  const active_tab = await getCurrentTab();
  const bookmark_timestamp =
    e.target.parentNode.parentNode.getAttribute("timestamp");
  const bkm_elm_to_delete = document.getElementById(
    `bookmark-${bookmark_timestamp}`,
  );

  bkm_elm_to_delete.parentNode.removeChild(bkm_elm_to_delete);

  // update Chrome storage
  chrome.tabs.sendMessage(
    active_tab.id,
    {
      type: "DELETE",
      bkm_timestamp: bookmark_timestamp,
    },
    viewBookmarks,
  );
};

const setBookmarkAttributes = (src, eventListener, control_parent_elm) => {
  const control_elm = document.createElement("img");

  control_elm.src = `assets/${src}.png`;
  control_elm.title = src;
  control_elm.addEventListener("click", eventListener);
  control_parent_elm.appendChild(control_elm);
};

document.addEventListener("DOMContentLoaded", async () => {
  const active_tab = await getCurrentTab();
  const query_params = active_tab.url.substring(
    active_tab.url.indexOf("?") + 1,
  );
  const url_params = new URLSearchParams(query_params);
  const curr_vid_id = url_params.get("v");
  console.log("curr_vid_id: ", curr_vid_id);

  if (curr_vid_id && active_tab.url.includes("youtube.com/watch")) {
    chrome.storage.sync.get([curr_vid_id], (data) => {
      const curr_vid_bookmarks = data[curr_vid_id]
        ? JSON.parse(data[curr_vid_id])
        : [];

      viewBookmarks(curr_vid_bookmarks);
    });
  } else {
    document.querySelector(".container").innerHTML =
      "<div class='title'>This page doesn't contain a YouTube video</div>";
  }
});
