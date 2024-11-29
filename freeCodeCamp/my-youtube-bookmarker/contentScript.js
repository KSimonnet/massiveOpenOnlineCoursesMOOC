(() => {
  let yt_left_ctrl, yt_player;
  let curr_video = "";
  let curr_video_bookmarks = [];

  chrome.runtime.onMessage.addListener((message, sender, response) => {
    const { type, value, video_id } = message;
    if (type === "NEW") {
      curr_video = video_id;
      newVideoLoaded();
    }
  });

  const newVideoLoaded = async () => {
    let bookmark_btn = document.querySelector(".bookmark-btn"); // Returns null if button doesn't exist (https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection/item)
    curr_video_bookmarks = await fetchBookmarks();
    if (!bookmark_btn) {
      bookmark_btn = document.createElement("img");
      bookmark_btn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmark_btn.class_name = `yt-btn bookmark-btn`;
      bookmark_btn.title = "Click to bookmark current timestamp";

      yt_left_ctrl = document.querySelector(".ytp-left-controls"); // document.getElementsByClassName("ytp-left-controls").item(0);
      yt_player = document.querySelector(".video-stream");
      yt_left_ctrl.appendChild(bookmark_btn);
      yt_left_ctrl.addEventListener("click", addNewBookmarkEventHandler);

      bookmark_btn.classList.add("bookmark-btn");
    }
  };

  const addNewBookmarkEventHandler = async () => {
    const curr_time = yt_player.currentTime;
    const new_bookmark = {
      time: curr_time,
      desc: `Bookmarked at ${getTime(curr_time)}`,
    };
    curr_video_bookmarks = await fetchBookmarks();
    console.log("curr_video_bookmarks: ", curr_video_bookmarks);

    chrome.storage.sync.set({
      [curr_video]: JSON.stringify(
        [...curr_video_bookmarks, new_bookmark].sort((a, b) => a.time - b.time),
      ),
    });
  };

  function fetchBookmarks() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(curr_video, (data) => {
        console.log("chrome.storage data: ", data);
        resolve(data[curr_video] ? JSON.parse(data[curr_video]) : []);
      });
    });
  }

  newVideoLoaded();
})();

const getTime = (t) => {
  var date = new Date(0); // initialise date to be able to use its method `.setSeconds()` and convert the time from YouTube
  date.setSeconds(t); // 1970-01-01T00:31:04.000Z
  return date.toISOString().substring(11, 19);
};
