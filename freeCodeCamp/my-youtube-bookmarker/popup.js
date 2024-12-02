// import { getCurrentTab } from "./utils.js";

// // adding a new bookmark row to the popup
// const addNewBookmark = (bookmarks_container, bookmark) => {
//   const bookmark_title_elm = document.createElement("div");
//   const new_bookmark = document.createElement("div");
//   const controls_elm = document.createElement("div");

//   bookmark_title_elm.textContent = bookmark.desc;
//   bookmark_title_elm.classList.add("bookmark-title");
//   controls_elm.classList.add("bookmark-controls");

//   setBookmarkAttributes("play", onPlay, controls_elm);
//   setBookmarkAttributes("delete", onDelete, controls_elm);

//   new_bookmark.id = `bookmark-${bookmark.time}`;
//   new_bookmark.classList.add("bookmark");
//   new_bookmark.setAttribute("timestamp", bookmark.time);

//   new_bookmark.appendChild(bookmark_title_elm);
//   new_bookmark.appendChild(controls_elm);
//   bookmarks_container.appendChild(new_bookmark);
// };

// const viewBookmarks = (existing_bookmarks = []) => {
//   const bookmarks_container = document.querySelector("#bookmarks");
//   bookmarks_container.innerHTML = "";

//   if (existing_bookmarks.length > 0) {
//     existing_bookmarks.forEach((bookmark) => {
//       addNewBookmark(bookmarks_container, bookmark);
//     });
//   } else {
//     bookmarks_container.innerHTML = '<i class="row">No bookmarks found</i>';
//   }
//   return;
// };

// const onPlay = async (e) => {
//   const bookmark_timestamp =
//     e.target.parentNode.parentNode.getAttribute("timestamp");
//   const active_tab = await getCurrentTab();

//   chrome.tabs.sendMessage(active_tab.id, {
//     type: "PLAY",
//     bkm_timestamp: bookmark_timestamp,
//   });
// };

// const onDelete = async (e) => {
//   const bookmark_timestamp =
//     e.target.parentNode.parentNode.getAttribute("timestamp");
//   const active_tab = await getCurrentTab();
//   const bookmark_elm_to_delete = document.getElementById(
//     `bookmark-${bookmark_timestamp}`,
//   );
//   bookmark_elm_to_delete.parentNode.removeChild(bookmark_elm_to_delete);

//   chrome.tabs.sendMessage(
//     active_tab.id,
//     {
//       type: "DELETE",
//       bkm_timestamp: bookmark_timestamp,
//     },
//     viewBookmarks, // since `viewBookmarks` does not rely on `this`, it can directly be passed as a callback function.
//   );
// };

// // function setBookmarkAttributes(src, event_listener, ctrl_parent) {
// // const ctrl_elm = document.createElement("img");
// // ctrl_elm.src = `assets/${src}.png`;
// // ctrl_elm.title = src;
// // ctrl_elm.addEventListener("click", event_listener);
// // ctrl_parent.appendChild(ctrl_elm);
// // }

// const setBookmarkAttributes = (src, event_listener, ctrl_parent) => {
//   const ctrl_elm = document.createElement("img");
//   ctrl_elm.src = `assets/${src}.png`;
//   ctrl_elm.title = src;
//   ctrl_elm.addEventListener("click", event_listener);
//   ctrl_parent.appendChild(ctrl_elm);
// };

// document.addEventListener("DOMContentLoaded", async () => {
//   try {
//     const active_tab = await getCurrentTab();
//     const query_params = active_tab.url.substring(
//       active_tab.url.indexOf("?") + 1,
//     );
//     const url_params = new URLSearchParams(query_params);
//     const curr_video_id = url_params.get("v");

//     if (curr_video_id && active_tab.url.includes("youtube.com/watch")) {
//       // updates the content of chrome.storage
//       chrome.storage.sync.get([curr_video_id], (data) => {
//         const curr_video_bookmarks = data[curr_video_id]
//           ? JSON.parse(data[curr_video_id])
//           : [];
//         viewBookmarks(curr_video_bookmarks);
//       });
//     } else {
//       document.querySelector(".container").innerHTML =
//         "<div class='title'>This page doesn't contain a YouTube video</div>";
//     }
//   } catch (error) {
//     console.error("Error in DOMContentLoaded event:", error);
//   }
// });

// ***************************************************************************************************************** //
import { getCurrentTab } from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
  const bookmarkTitleElement = document.createElement("div");
  const controlsElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks = []) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }

  return;
};

const onPlay = async (e) => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getCurrentTab();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    bkm_timestamp: bookmarkTime,
  });
};

const onDelete = async (e) => {
  const activeTab = await getCurrentTab();
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const bookmarkElementToDelete = document.getElementById(
    "bookmark-" + bookmarkTime,
  );

  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  chrome.tabs.sendMessage(
    activeTab.id,
    {
      type: "DELETE",
      bkm_timestamp: bookmarkTime,
    },
    viewBookmarks,
  );
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getCurrentTab();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  const currentVideo = urlParameters.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo]
        ? JSON.parse(data[currentVideo])
        : [];

      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    const container = document.getElementsByClassName("container")[0];

    container.innerHTML =
      '<div class="title">This is not a youtube video page.</div>';
  }
});
