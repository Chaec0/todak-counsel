/* ==================================================
   ✏️ 여기만 고치면 됩니다 (코딩을 몰라도 수정 가능)
   ================================================== */

// 고민 유형별 영상 설정
// src: 영상 파일 / poster: 영상이 뜨기 전 그림 / subtitle: 자막(VTT) 파일
// poster와 subtitle은 파일이 없으면 그냥 건너뜁니다.
const VIDEOS = {
  anxiety: { // 영상 A. 학업 및 진로 (불안)
    src: "assets/video_anxiety.mp4",
    poster: "assets/poster_anxiety.jpg",
    subtitle: "assets/subtitle_anxiety.vtt",
  },
  lonely: { // 영상 B. 인간관계 (외로움)
    src: "assets/video_lonely.mp4",
    poster: "assets/poster_lonely.jpg",
    subtitle: "assets/subtitle_lonely.vtt",
  },
  guilt: { // 영상 C. 자기 자신 (자책)
    src: "assets/video_guilt.mp4",
    poster: "assets/poster_guilt.jpg",
    subtitle: "assets/subtitle_guilt.vtt",
  },
};

// 영상별 치유포인트: 마지막 화면과 응원 카드에 나옵니다.
const HEALING = {
  anxiety: { keyword: "자기인정", line: "남들과 비교하기 전에, 내가 걸어온 길도 한번 돌아봐 줘." },
  lonely:  { keyword: "소통",     line: "혼자 짐작하던 마음도, 말로 꺼내면 생각보다 가벼워질 때가 있어." },
  guilt:   { keyword: "자기수용", line: "실수했다는 것과 부족한 사람이라는 건 달라. 친구에게 해 주는 말, 너에게도 해 줘." },
};

// 오늘의 응원 문구: 따옴표 안의 글을 고치거나 줄을 추가하세요. (해결책 말고 공감과 인정 위주로!)
const MESSAGES = {
  anxiety: [
    "다들 앞서가는 소식만 보이는 날엔 괜히 작아지지. 그 마음, 나도 알아.",
    "남의 소식에 마음이 쪼그라든 날에도, 네가 쌓아 온 시간은 그대로 있어.",
    "처음 입학했을 때의 네가 지금의 너를 보면 꽤 놀랄 거야. 그만큼 걸어왔잖아.",
    "아직 보여 줄 게 없는 것 같아도, 네가 버텨 온 날들은 전부 네 거야.",
  ],
  lonely: [
    "답장 하나에 하루 종일 마음이 왔다 갔다 했지. 그만큼 그 친구가 소중한 거야.",
    "혼자 이런저런 생각을 하다 보면 더 서운해지지. 나도 그런 날이 있어.",
    "서운했다는 말, 꺼내도 괜찮아. 그런다고 네가 속 좁은 사람이 되는 건 아니야.",
    "삼켜 버린 마음도 네 진짜 마음이야. 언젠가 말하고 싶어지면, 그래도 괜찮아.",
  ],
  guilt: [
    "발표가 끝나고도 그 장면만 몇 번이고 떠올랐지. 그런 밤, 나도 알아.",
    "친구가 실수했다면 넌 분명 다정하게 말해 줬을 거야. 너한테도 그래도 괜찮아.",
    "실수 하나로 네가 달라지는 건 아니야. 오늘은 너한테 조금 다정해도 돼.",
    "스스로를 탓하느라 오늘 밤이 참 길었겠다. 그만큼 잘하고 싶었던 거잖아.",
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
