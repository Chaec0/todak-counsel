/* ==================================================
   ✏️ 여기만 고치면 됩니다 (코딩을 몰라도 수정 가능)
   ================================================== */

// 고민 유형별 영상 설정
// title: 영상 제목 / src: 영상 파일 / poster: 영상이 뜨기 전 그림 / subtitle: 자막(VTT) 파일
// poster와 subtitle은 파일이 없으면 그냥 건너뜁니다.
const VIDEOS = {
  anxiety: { // 학업 및 진로 (불안)
    title: "괜히 겁먹었어",
    src: "assets/video_anxiety.mp4",
    poster: "assets/poster_anxiety.jpg",
    subtitle: "assets/subtitle_anxiety.vtt",
  },
  lonely: { // 인간관계 (외로움)
    title: "싫어서가 아니야",
    src: "assets/video_lonely.mp4",
    poster: "assets/poster_lonely.jpg",
    subtitle: "assets/subtitle_lonely.vtt",
  },
  guilt: { // 자기 자신 (자책)
    title: "가끔은 조금 늦어도 괜찮아",
    src: "assets/video_guilt.mp4",
    poster: "assets/poster_guilt.jpg",
    subtitle: "assets/subtitle_guilt.vtt",
  },
};

// 영상별 치유포인트: 마지막 화면과 응원 카드에 나옵니다.
const HEALING = {
  anxiety: { keyword: "직면",   line: "부족한 부분을 발견하면 속상하지. 그래도 그게 네가 해온 모든 걸 부정하는 건 아니야." },
  lonely:  { keyword: "담담함", line: "누군가의 거절이 항상 너에 대한 거절은 아니야. 없는 이유까지 혼자 만들어 내며 상처받지 않아도 돼." },
  guilt:   { keyword: "여유",   line: "항상 잘하려고 애써 왔잖아. 가끔 생기는 작은 실수까지 너를 몰아붙이지 않아도 돼." },
};

// 오늘의 응원 문구: 따옴표 안의 글을 고치거나 줄을 추가하세요. (해결책 말고 공감과 인정 위주로!)
const MESSAGES = {
  anxiety: [
    "제일 괜찮다고 생각한 부분을 지적받으면 귀가 축 처지지. 그 마음, 나도 알아.",
    "파일을 열기 싫은 날도 있어. 못한 부분을 다시 보는 건 원래 겁나는 일이야.",
    "부족한 부분이 보였다고 네가 해 온 것까지 없어지는 건 아니야.",
    "며칠 동안 붙들고 있던 시간은 그대로 네 거야. 지적 하나로 사라지지 않아.",
  ],
  lonely: [
    "메시지를 썼다 지웠다 하다 겨우 보냈는데 거절당하면, 마음이 금세 가라앉지.",
    "답장 한 줄을 몇 번이고 다시 읽게 되는 날이 있어. 나도 그랬어.",
    "\"이번 주말은 어렵다\"는 말이 \"네가 싫다\"는 말은 아니었을지도 몰라.",
    "먼저 연락한 것만으로도 큰 용기였어. 그 마음은 그대로 소중해.",
  ],
  guilt: [
    "늦잠 하나에 하루가 다 망한 것 같은 아침이 있지. 나도 그런 날이 있어.",
    "눈앞에서 버스를 놓치면 괜히 풀이 죽지. 늘 일찍 다녔으니까 더 그래.",
    "늘 잘하려고 애써 왔잖아. 가끔 조금 늦어도 너는 그대로 괜찮아.",
    "숨 좀 고른다고 뒤처지는 건 아니야. 오늘 하늘도 꽤 맑더라.",
  ],
};

// 이미지 경로는 여기서만 관리합니다.
const TODAK_IMAGE = "assets/todak.png";            // 토닥이 캐릭터 (없으면 "토닥이 이미지 자리" 점선 박스가 나옵니다)
const ROOM_IMAGE = "assets/todak_room.png";        // 방 배경 (없으면 기본으로 그린 방이 나옵니다)
const TODAK_CARD_SCRIPT = "assets/todak_card.js";  // 응원 카드 저장용 토닥이

// 영상 파일이 없을 때 "준비 중" 화면을 보여줄 시간 (1000 = 1초)
const PLACEHOLDER_MS = 3000;

/* ==================================================
   여기부터는 동작 코드입니다
   ================================================== */

const LOADING_TEXT = "토닥이가 이야기를 가져오고 있어요";
const LOADING_SLOW_TEXT = "조금만 기다려줘";
const LOADING_SLOW_MS = 5000; // 이 시간이 지나도 로딩 중이면 문구를 바꾼다
const SKIP_DELAY_MS = 3000;   // 영상 시작 후 건너뛰기가 보이기까지의 시간
const ENDING_FADE_MS = 1000;  // 영상이 끝난 뒤 사라지는 시간

const $ = (id) => document.getElementById(id);
const app = $("app");
const videoScene = $("scene-video");
const video = $("video-player");
const track = $("video-track");
const soundButton = $("btn-sound");
const playButton = $("btn-play");
const pauseButton = $("btn-pause");
const skipButton = $("btn-skip");
const videoBottom = $("video-bottom");
const progress = $("video-progress");
const progressBar = $("video-progress-bar");
const videoWait = $("video-wait");
const videoWaitText = $("video-wait-text");
const videoWaitBar = $("video-wait-bar");
const sheet = $("sheet");
const saveButton = $("btn-save");
const sheetStatus = $("sheet-status");

let currentType = null;   // 지금 고른 고민 유형
let isVideoScene = false; // 영상 Scene 진행 중인지 (이동이 두 번 일어나지 않게 막는다)
let isEnding = false;     // 영상이 끝나고 페이드 중인지
let waitTimer = null;     // placeholder 또는 종료 페이드 타이머
let slowTimer = null;     // 로딩 지연 타이머
let skipTimer = null;     // 건너뛰기 표시 타이머
let lastMessage = null;   // 바로 전에 보여준 응원 문구

/* ----- Scene 전환 ----- */
function showScene(id) {
  document.querySelectorAll(".scene").forEach((scene) => {
    scene.classList.toggle("is-active", scene.id === id);
  });
  $(id).scrollTop = 0;
  // 자동으로 넘어가도 포커스가 사라지지 않게 새 Scene으로 옮긴다
  const focusTarget = $(id).querySelector("[data-focus]") || $(id);
  focusTarget.focus({ preventScroll: true });
}

/* ----- 크리스마스 방 소품을 방마다 넣기 ----- */
document.querySelectorAll(".room").forEach((room) => {
  room.prepend($("room-decor").content.cloneNode(true));
});

/* ----- 이미지: 파일이 있을 때만 적용 ----- */
const roomProbe = new Image();
roomProbe.onload = () => {
  document.documentElement.style.setProperty("--room-photo", `url("${ROOM_IMAGE}")`);
  document.body.classList.add("has-room-photo");
};
roomProbe.src = ROOM_IMAGE;

const todakImages = document.querySelectorAll("img[data-todak]");
const todakProbe = new Image();
todakProbe.onload = () => {
  todakImages.forEach((image) => { image.src = TODAK_IMAGE; });
};
todakProbe.onerror = () => {
  todakImages.forEach((image) => {
    const box = document.createElement("span");
    box.className = "todak-empty";
    box.textContent = "토닥이 이미지 자리";
    image.replaceWith(box);
  });
};
todakProbe.src = TODAK_IMAGE;

// 파일로 직접 열어도 저장 이미지에 토닥이가 빠지지 않도록 글자로 바꾼 그림을 쓴다
const cardScript = document.createElement("script");
cardScript.src = TODAK_CARD_SCRIPT;
cardScript.onload = () => {
  $("cheer-todak").src = window.TODAK_CARD_IMAGE;
  $("cheer-todak").hidden = false;
};
document.body.append(cardScript);

/* ----- Scene 3. 영상 재생 ----- */
function startVideo(type) {
  currentType = type;
  isVideoScene = true;
  isEnding = false;
  clearVideoTimers();
  videoScene.classList.remove("has-video", "has-poster", "is-ending");
  playButton.hidden = true;
  skipButton.hidden = true;
  setVideoUIVisible(false);
  setProgress(0);
  showHealing(type);
  showScene("scene-video");

  const config = VIDEOS[type];
  showVideoTitle(config && config.title);
  if (!config || !config.src) {
    showVideoPlaceholder();
    return;
  }
  showLoading();
  loadPoster(config.poster);
  loadSubtitle(config.subtitle);
  setMuted(true);
  video.src = config.src;
  video.play().catch((error) => {
    // 저전력 모드 등으로 자동 재생이 막히면 직접 누를 수 있게 한다
    if (error.name === "NotAllowedError" && isVideoScene) {
      hideLoading();
      playButton.hidden = false;
      skipButton.hidden = false;
    }
  });
}

// 영상 제목: 로딩 화면과 재생 중 하단에 함께 보여 준다
function showVideoTitle(title) {
  $("video-wait-title").textContent = title || "";
  $("video-title").textContent = title || "";
  video.setAttribute("aria-label", title ? `토닥이 영상: ${title}` : "토닥이 영상");
}

function clearVideoTimers() {
  clearTimeout(waitTimer);
  clearTimeout(slowTimer);
  clearTimeout(skipTimer);
  skipTimer = null;
}

function setVideoUIVisible(visible) {
  soundButton.hidden = !visible;
  videoBottom.hidden = !visible;
}

function setProgress(ratio) {
  progressBar.style.transform = `scaleX(${ratio})`;
  progress.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
}

// 로딩 안내: 오래 걸리면 문구를 바꾸고, 멈춘 채 갇히지 않게 건너뛰기도 꺼내 준다
function showLoading() {
  videoWaitText.textContent = LOADING_TEXT;
  videoWaitBar.hidden = true;
  videoWait.hidden = false;
  clearTimeout(slowTimer);
  slowTimer = setTimeout(() => {
    videoWaitText.textContent = LOADING_SLOW_TEXT;
    skipButton.hidden = false;
  }, LOADING_SLOW_MS);
}

function hideLoading() {
  clearTimeout(slowTimer);
  videoWait.hidden = true;
}

// 포스터 그림: 파일이 있을 때만 쓴다
function loadPoster(src) {
  video.removeAttribute("poster");
  if (!src) return;
  const type = currentType;
  const probe = new Image();
  probe.onload = () => {
    if (!isVideoScene || currentType !== type || !videoWaitBar.hidden) return;
    video.poster = src;
    videoScene.classList.add("has-poster");
  };
  probe.src = src;
}

// 자막: 파일이 없으면 브라우저가 조용히 무시한다
function loadSubtitle(src) {
  track.track.mode = "disabled";
  if (!src) {
    track.removeAttribute("src");
    return;
  }
  track.src = src;
  track.track.mode = "showing";
}

// 자막이 하단 버튼과 겹치지 않게 조금 위로 올린다
track.addEventListener("load", () => {
  Array.from(track.track.cues || []).forEach((cue) => { cue.line = -4; });
});

// 영상 파일이 없거나 재생할 수 없을 때: 잠시 안내 후 다음 Scene으로
function showVideoPlaceholder() {
  clearVideoTimers();
  videoScene.classList.remove("has-video", "has-poster");
  app.classList.remove("is-landscape-video");
  setVideoUIVisible(false);
  playButton.hidden = true;
  skipButton.hidden = true;
  videoScene.style.setProperty("--wait-ms", `${PLACEHOLDER_MS}ms`);
  videoWaitText.textContent = "토닥이가 준비 중이에요";
  videoWaitBar.hidden = false;
  videoWait.hidden = false;
  waitTimer = setTimeout(finishVideo, PLACEHOLDER_MS);
}

// 영상이 끝나면 1초 동안 사라진 뒤 마지막 Scene으로
function fadeOutVideo() {
  if (!isVideoScene || isEnding) return;
  isEnding = true;
  videoScene.classList.add("is-ending");
  waitTimer = setTimeout(finishVideo, ENDING_FADE_MS);
}

function finishVideo() {
  if (!isVideoScene) return;
  isVideoScene = false;
  isEnding = false;
  clearVideoTimers();
  video.pause();
  video.removeAttribute("src");
  video.removeAttribute("poster");
  video.load();
  app.classList.remove("is-landscape-video");
  showScene("scene-last");
}

function setMuted(muted) {
  video.muted = muted;
  soundButton.textContent = muted ? "소리 켜기" : "소리 끄기";
  soundButton.setAttribute("aria-label", muted ? "영상 소리 켜기" : "영상 소리 끄기");
  soundButton.classList.toggle("btn-chip--attention", muted);
}

function togglePlay() {
  if (!isVideoScene || isEnding || !videoScene.classList.contains("has-video")) return;
  if (video.paused) video.play().catch(() => {});
  else video.pause();
}

function updatePauseButton() {
  pauseButton.textContent = video.paused ? "재생" : "일시정지";
  pauseButton.setAttribute("aria-label", video.paused ? "영상 재생" : "영상 일시정지");
}

video.addEventListener("loadeddata", () => {
  if (!isVideoScene) return;
  videoScene.classList.add("has-video");
  app.classList.toggle("is-landscape-video", video.videoWidth > video.videoHeight);
  setVideoUIVisible(true);
});
video.addEventListener("playing", () => {
  if (!isVideoScene) return;
  hideLoading();
  playButton.hidden = true;
  if (skipTimer === null) {
    skipTimer = setTimeout(() => { skipButton.hidden = false; }, SKIP_DELAY_MS);
  }
});
video.addEventListener("waiting", () => {
  if (isVideoScene && !isEnding && videoWait.hidden) showLoading();
});
video.addEventListener("error", () => {
  if (isVideoScene && !isEnding) showVideoPlaceholder();
});
video.addEventListener("timeupdate", () => {
  if (video.duration) setProgress(video.currentTime / video.duration);
});
video.addEventListener("play", updatePauseButton);
video.addEventListener("pause", updatePauseButton);
video.addEventListener("ended", fadeOutVideo);
video.addEventListener("click", togglePlay);

soundButton.addEventListener("click", () => setMuted(!video.muted));
playButton.addEventListener("click", () => video.play().catch(() => {}));
pauseButton.addEventListener("click", togglePlay);
skipButton.addEventListener("click", finishVideo);

/* ----- 마지막 Scene: 치유포인트 ----- */
function showHealing(type) {
  const healing = HEALING[type];
  $("healing-chip").textContent = `오늘의 키워드 · ${healing.keyword}`;
  $("healing-line").textContent = healing.line;
  $("cheer-keyword").textContent = healing.keyword;
}

/* ----- 오늘의 응원 카드 ----- */
function pickMessage(type) {
  const list = MESSAGES[type];
  const choices = list.length > 1 ? list.filter((text) => text !== lastMessage) : list;
  lastMessage = choices[Math.floor(Math.random() * choices.length)];
  return lastMessage;
}

function openSheet() {
  $("cheer-message").textContent = pickMessage(currentType);
  sheetStatus.textContent = "";
  sheet.scrollTop = 0;
  $("scene-last").inert = true; // 시트가 열린 동안 뒤 화면은 누를 수 없게
  app.classList.add("sheet-open");
  sheet.focus({ preventScroll: true });
}

function closeSheet() {
  app.classList.remove("sheet-open");
  $("scene-last").inert = false;
  $("btn-cheer").focus({ preventScroll: true });
}

// 카드를 PNG 이미지로 저장 (글꼴이 다 불러와진 뒤에 찍는다)
async function saveCard() {
  if (typeof html2canvas !== "function") {
    sheetStatus.textContent = "저장 도구를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.";
    return;
  }
  saveButton.disabled = true;
  sheetStatus.textContent = "이미지를 만들고 있어요…";
  try {
    await document.fonts.ready;
    const canvas = await html2canvas($("cheer-card"), {
      scale: 2,
      backgroundColor: "#fffaf3",
      logging: false,
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "토닥이_오늘의응원.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    sheetStatus.textContent = "이미지를 저장했어요.";
  } catch (error) {
    console.error(error);
    sheetStatus.textContent = "저장하지 못했어요. 화면을 캡처해서 간직해 줘.";
  } finally {
    saveButton.disabled = false;
  }
}

/* ----- 버튼 연결 ----- */
$("btn-start").addEventListener("click", () => showScene("scene-choose"));
document.querySelectorAll(".worry-card").forEach((card) => {
  card.addEventListener("click", () => startVideo(card.dataset.type));
});
$("btn-again").addEventListener("click", () => showScene("scene-choose"));
$("btn-cheer").addEventListener("click", openSheet);
$("btn-close").addEventListener("click", closeSheet);
$("sheet-backdrop").addEventListener("click", closeSheet);
saveButton.addEventListener("click", saveCard);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && app.classList.contains("sheet-open")) closeSheet();
});
