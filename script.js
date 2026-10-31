/* ==================================================
   ✏️ 여기만 고치면 됩니다 (코딩을 몰라도 수정 가능)
   ================================================== */

// 고민 유형별 영상 파일 경로
const VIDEOS = {
  anxiety: "assets/video_anxiety.mp4", // 학업 및 진로 (불안)
  lonely:  "assets/video_lonely.mp4",  // 인간관계 (외로움)
  guilt:   "assets/video_guilt.mp4",   // 자기 자신 (자책)
};

// 오늘의 응원 문구: 따옴표 안의 글을 고치거나 줄을 추가하세요. (해결책 말고 공감과 인정 위주로!)
const MESSAGES = {
  anxiety: [
    "아직 정답을 몰라도 괜찮아. 지금 이렇게 고민하는 것도 잘 해내고 있다는 뜻이야.",
    "앞이 잘 안 보이면 마음이 자꾸 조급해지지. 그 불안한 마음, 나도 알 것 같아.",
    "시험이랑 과제에 치이다 보면 숨 돌릴 틈도 없잖아. 오늘 정말 애 많이 썼어.",
    "미래가 걱정되는 건 그만큼 네 삶을 소중히 여긴다는 거야.",
  ],
  lonely: [
    "사람들 사이에 있어도 혼자인 것 같은 날이 있어. 그런 날은 마음이 참 시리지.",
    "친구랑 어긋난 날엔 하루 종일 마음이 무겁지. 그만큼 그 사람을 아꼈던 거야.",
    "남들 눈이 자꾸 신경 쓰이는 거, 나도 그래. 너만 그런 게 아니야.",
    "오늘 많이 외로웠겠다. 여기까지 와 줘서 고마워.",
  ],
  guilt: [
    "실수한 장면이 자꾸 떠오르지. 나도 그런 밤이 있어.",
    "남들은 다 잘하는 것 같아 보이는 날, 괜히 작아지는 그 기분 나도 알아.",
    "자꾸 스스로를 탓하게 되는 날이 있지. 그만큼 잘하고 싶었던 거잖아.",
    "자신 없는 날에도 너는 그대로 너야. 오늘 여기까지 온 것만으로 충분해.",
  ],
};

// 방 그림 파일 경로 (파일이 없으면 🐰가 있는 기본 방이 나옵니다)
const ROOM_IMAGE = "assets/todak_room.png";

// 영상 파일이 없을 때 "준비 중" 화면을 보여줄 시간 (1000 = 1초)
const PLACEHOLDER_MS = 3000;

/* ==================================================
   여기부터는 동작 코드입니다
   ================================================== */

const $ = (id) => document.getElementById(id);
const app = $("app");
const videoScene = $("scene-video");
const video = $("video-player");
const soundButton = $("btn-sound");
const playButton = $("btn-play");
const videoNotice = $("video-notice");
const sheet = $("sheet");
const saveButton = $("btn-save");
const sheetStatus = $("sheet-status");

let currentType = null;   // 지금 고른 고민 유형
let isVideoScene = false; // 영상 Scene 진행 중인지 (이동이 두 번 일어나지 않게 막는다)
let waitTimer = null;     // placeholder 타이머
let lastMessage = null;   // 바로 전에 보여준 응원 문구

/* ----- Scene 전환 ----- */
function showScene(id) {
  document.querySelectorAll(".scene").forEach((scene) => {
    scene.classList.toggle("is-active", scene.id === id);
  });
  $(id).scrollTop = 0;
  $(id).focus({ preventScroll: true });
}

/* ----- 방 그림: 파일이 있을 때만 적용 ----- */
const roomProbe = new Image();
roomProbe.onload = () => {
  document.documentElement.style.setProperty("--room-photo", `url("${ROOM_IMAGE}")`);
  document.body.classList.add("has-room-photo");
};
roomProbe.src = ROOM_IMAGE;

/* ----- Scene 3. 영상 재생 ----- */
function startVideo(type) {
  currentType = type;
  isVideoScene = true;
  videoScene.classList.remove("has-video");
  videoNotice.hidden = true;
  playButton.hidden = true;
  soundButton.hidden = true;
  showScene("scene-video");

  const src = VIDEOS[type];
  if (!src) {
    showVideoPlaceholder();
    return;
  }
  setMuted(true);
  video.src = src;
  video.play().catch((error) => {
    // 저전력 모드 등으로 자동 재생이 막히면 직접 누를 수 있게 한다
    if (error.name === "NotAllowedError" && isVideoScene) playButton.hidden = false;
  });
}

// 영상 파일이 없거나 재생할 수 없을 때: 잠시 안내 후 다음 Scene으로
function showVideoPlaceholder() {
  videoScene.classList.remove("has-video");
  soundButton.hidden = true;
  playButton.hidden = true;
  videoScene.style.setProperty("--wait-ms", `${PLACEHOLDER_MS}ms`);
  videoNotice.hidden = false;
  clearTimeout(waitTimer);
  waitTimer = setTimeout(finishVideo, PLACEHOLDER_MS);
}

function finishVideo() {
  if (!isVideoScene) return;
  isVideoScene = false;
  clearTimeout(waitTimer);
  video.pause();
  video.removeAttribute("src");
  video.load();
  showScene("scene-last");
}

function setMuted(muted) {
  video.muted = muted;
  soundButton.textContent = muted ? "🔇 소리 켜기" : "🔊 소리 끄기";
  soundButton.setAttribute("aria-pressed", String(!muted));
}

video.addEventListener("loadeddata", () => {
  if (!isVideoScene) return;
  videoScene.classList.add("has-video");
  soundButton.hidden = false;
});
video.addEventListener("error", () => {
  if (isVideoScene) showVideoPlaceholder();
});
video.addEventListener("playing", () => { playButton.hidden = true; });
video.addEventListener("ended", finishVideo);

soundButton.addEventListener("click", () => setMuted(!video.muted));
playButton.addEventListener("click", () => video.play());
$("btn-skip").addEventListener("click", finishVideo);

/* ----- 오늘의 응원 카드 ----- */
// 파일로 직접 열어도 저장 이미지에 토닥이가 빠지지 않도록 글자로 바꾼 그림을 쓴다
if (window.TODAK_CARD_IMAGE) $("cheer-todak").src = window.TODAK_CARD_IMAGE;
else $("cheer-todak").hidden = true;

function pickMessage(type) {
  const list = MESSAGES[type];
  const choices = list.length > 1 ? list.filter((text) => text !== lastMessage) : list;
  lastMessage = choices[Math.floor(Math.random() * choices.length)];
  return lastMessage;
}

function openSheet() {
  $("cheer-message").textContent = pickMessage(currentType);
  sheetStatus.textContent = "";
  $("scene-last").inert = true; // 시트가 열린 동안 뒤 화면은 누를 수 없게
  app.classList.add("sheet-open");
  sheet.focus({ preventScroll: true });
}

function closeSheet() {
  app.classList.remove("sheet-open");
  $("scene-last").inert = false;
  $("btn-cheer").focus({ preventScroll: true });
}

// 카드를 PNG 이미지로 저장
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
      scale: Math.max(2, window.devicePixelRatio || 1),
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
