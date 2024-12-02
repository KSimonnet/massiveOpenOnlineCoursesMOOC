(() => {
  let yt_left_ctrls, yt_player;
  let curr_video_id = "";
  let curr_video_bookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([curr_video_id], (obj) => {
        resolve(obj[curr_video_id] ? JSON.parse(obj[curr_video_id]) : []);
      });
    });
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
      [curr_video_id]: JSON.stringify(
        [...curr_video_bookmarks, new_bookmark].sort((a, b) => a.time - b.time),
      ),
    });
  };

  const newVideoLoaded = async () => {
    let bookmark_btn = document.querySelector(".bookmark-btn"); // Returns null if button doesn't exist
    curr_video_bookmarks = await fetchBookmarks();

    if (!bookmark_btn) {
      bookmark_btn = document.createElement("img");

      bookmark_btn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmark_btn.classList.add("ytp-button", "bookmark-btn"); // rather than `bookmark_btn.className` in order not to overwrite any existing classes
      bookmark_btn.title = "Click to bookmark current timestamp";

      yt_left_ctrls = document.querySelector(".ytp-left-controls");
      yt_player = document.querySelector(".video-stream");

      yt_left_ctrls.appendChild(bookmark_btn);
      bookmark_btn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  chrome.runtime.onMessage.addListener((message, sender, response) => {
    const { type, bkm_timestamp, video_id } = message;

    if (type === "NEW") {
      curr_video_id = video_id;
      newVideoLoaded();
    } else if (type === "PLAY") {
      yt_player.currentTime = bkm_timestamp;
    } else if (type === "DELETE") {
      curr_video_bookmarks = curr_video_bookmarks.filter(
        (b) => b.time !== bkm_timestamp,
      );
      chrome.storage.sync.set({
        [curr_video_id]: JSON.stringify(curr_video_bookmarks),
      });

      response(curr_video_bookmarks);
    }
  });

  newVideoLoaded();
})();

const getTime = (t) => {
  var date = new Date(0); // initialise date to be able to use its method `.setSeconds()` and convert the time from YouTube
  date.setSeconds(t); // 1970-01-01T00:31:04.000Z
  return date.toISOString().substring(11, 19);
};
