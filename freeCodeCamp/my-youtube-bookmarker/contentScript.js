// (() => {
//   let yt_left_ctrl, yt_player;
//   let curr_video = "";
//   let curr_video_bookmarks = [];

// const addNewBookmarkEventHandler = async () => {
//   const curr_time = yt_player.currentTime;
//   const new_bookmark = {
//     time: curr_time,
//     desc: `Bookmarked at ${getTime(curr_time)}`,
//   };
//   curr_video_bookmarks = await fetchBookmarks();
//   console.log("curr_video_bookmarks: ", curr_video_bookmarks);

//   chrome.storage.sync.set({
//     [curr_video]: JSON.stringify(
//       [...curr_video_bookmarks, new_bookmark].sort((a, b) => a.time - b.time),
//     ),
//   });
// };

//   const newVideoLoaded = async () => {
//     let bookmark_btn = document.querySelector(".bookmark-btn"); // Returns null if button doesn't exist
//     curr_video_bookmarks = await fetchBookmarks();
//     if (!bookmark_btn) {
//       bookmark_btn = document.createElement("img");
//       bookmark_btn.src = chrome.runtime.getURL("assets/bookmark.png");
//       bookmark_btn.classList.add("ytp-button", "bookmark-btn"); // rather than `bookmark_btn.className` in order not to overwrite any existing classes
//       bookmark_btn.title = "Click to bookmark current timestamp";

//       yt_left_ctrl = document.getElementsByClassName("ytp-left-controls")[0];
//       yt_player = document.getElementsByClassName("video-stream")[0];

//       yt_left_ctrl.appendChild(bookmark_btn);
//       bookmark_btn.addEventListener("click", addNewBookmarkEventHandler);

//       // const appendBookmarkButton = () => {
//       //   try {
//       //     yt_left_ctrl = document.querySelector(".ytp-left-controls");
//       //     if (yt_left_ctrl) {
//       //       yt_left_ctrl.appendChild(bookmark_btn);
//       //       yt_left_ctrl.addEventListener("click", addNewBookmarkEventHandler);
//       //       observer.disconnect(); // Stop observing once the element is found and the button is appended
//       //     }
//       //   } catch (error) {
//       //     console.error("Error appending bookmark button:", error);
//       //   }
//       // };

//       // const observer = new MutationObserver((mutations) => {
//       //   mutations.forEach(() => {
//       //     appendBookmarkButton();
//       //   });
//       // });

//       // observer.observe(document.body, { childList: true, subtree: true });

//       // // Try to append the button immediately in case the element is already present
//       // appendBookmarkButton();
//     }
//   };

//   const fetchBookmarks = () => {
//     return new Promise((resolve) => {
//       chrome.storage.sync.get([curr_video], (data) => {
//         console.log("chrome.storage data: ", data);
//         resolve(data[curr_video] ? JSON.parse(data[curr_video]) : []);
//       });
//     });
//   };

//   chrome.runtime.onMessage.addListener((message, sender, response) => {
//     const { type, bkm_timestamp, video_id } = message;
//     if (type === "NEW") {
//       curr_video = video_id;
//       newVideoLoaded();
//     } else if (type === "PLAY") {
//       yt_player.currentTime = bkm_timestamp; // .seekTo(bkm_timestamp)
//     } else if (type === "DELETE") {
//       curr_video_bookmarks = curr_video_bookmarks.filter(
//         (bookmark) => bookmark.time !== bkm_timestamp,
//       );
//       chrome.storage.sync.set({
//         [curr_video]: JSON.stringify(curr_video_bookmarks),
//       });
//       response(curr_video_bookmarks);
//     }
//   });

//   newVideoLoaded();
// })();

const getTime = (t) => {
  var date = new Date(0); // initialise date to be able to use its method `.setSeconds()` and convert the time from YouTube
  date.setSeconds(t); // 1970-01-01T00:31:04.000Z
  return date.toISOString().substring(11, 19);
};

(() => {
  let yt_left_ctrl, yt_player;
  let currentVideo = "";
  let curr_video_bookmarks = [];

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = yt_player.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: "Bookmark at " + getTime(currentTime),
    };

    curr_video_bookmarks = await fetchBookmarks();

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(
        [...curr_video_bookmarks, newBookmark].sort((a, b) => a.time - b.time),
      ),
    });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists =
      document.getElementsByClassName("bookmark-btn")[0];

    curr_video_bookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";
      bookmarkBtn.title = "Click to bookmark current timestamp";

      yt_left_ctrl = document.getElementsByClassName("ytp-left-controls")[0];
      yt_player = document.getElementsByClassName("video-stream")[0];

      yt_left_ctrl.appendChild(bookmarkBtn);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, bkm_timestamp, video_id } = obj;

    if (type === "NEW") {
      currentVideo = video_id;
      newVideoLoaded();
    } else if (type === "PLAY") {
      yt_player.currentTime = bkm_timestamp;
    } else if (type === "DELETE") {
      curr_video_bookmarks = curr_video_bookmarks.filter(
        (b) => b.time != bkm_timestamp,
      );
      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify(curr_video_bookmarks),
      });

      response(curr_video_bookmarks);
    }
  });

  newVideoLoaded();
})();
