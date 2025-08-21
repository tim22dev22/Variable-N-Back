const grid = document.getElementById("grid");
const startBtn = document.getElementById("startBtn");
const scoreLabel = document.getElementById("scoreLabel");

const numTrialsInput = document.getElementById("numTrialsInput");

const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const headerText = document.getElementById("headerText");

const interferenceSlider = document.getElementById("interferenceSlider");
const interferenceLabel = document.getElementById("interferenceLabel");

interferenceSlider.addEventListener("input", () => {
  interferenceLabel.textContent = ""+interferenceSlider.value+"%";
});
const delaySlider = document.getElementById("delaySlider");
const delayLabel = document.getElementById("delayLabel");

delaySlider.addEventListener("input", () => {
  delayLabel.textContent = ""+delaySlider.value+"ms";
});

const matchRateSlider = document.getElementById("matchRateSlider");
const matchRateLabel = document.getElementById("matchRateLabel");

matchRateSlider.addEventListener("input", () => {
  matchRateLabel.textContent = ""+matchRateSlider.value+"%";
});

const toggleAdaptive = document.getElementById("toggleAdaptive");
const toggleImage = document.getElementById("toggleImage");
const toggleColor = document.getElementById("toggleColor");
const toggleAudio = document.getElementById("toggleAudio");
const originalColor='lightgray';
const incorrectColor='#FF0000';
const correctColor='#00FF00';
const missedColor='#FFFF00';
const cellColor='rgb(238, 238, 238)';
const cellHighlightColor='black';


audioFolder="audio/letters/";
/*const audioStimuli = [
  new Audio(audioFolder + 'c.wav'),
  new Audio(audioFolder + 'h.wav'),
  new Audio(audioFolder + 'k.wav'),
  new Audio(audioFolder + 'l.wav'),
  new Audio(audioFolder + 'q.wav'),
  new Audio(audioFolder + 'r.wav'),
  new Audio(audioFolder + 's.wav'),
  new Audio(audioFolder + 't.wav')
];*/
/*const audioFiles = [
  audioFolder +'c.wav',
  audioFolder +'h.wav',
  audioFolder +'k.wav',
  audioFolder +'l.wav',
  audioFolder +'q.wav',
  audioFolder +'r.wav',
  audioFolder +'s.wav',
  audioFolder +'t.wav'
];*/
const imageNames = [
  'diamond.png',
  'semicircle.png',
  'hexagon.png',
  'octagon.png',
  'pentagon.png',
  'square.png',
  'star.png',
  'triangle.png'
]; 
const imageFolder = 'images/';
const preloadedImages = {};

imageNames.forEach(name => {
    const img = new Image();
    img.src = imageFolder + name; // or ".png" if they’re images
    preloadedImages[name] = img;
});

const colorStimuli = ['red', 'green', 'blue', 'yellow', 'cyan', 'lime', 'magenta', 'orange'];

const isLocalFile = location.protocol === 'file:';
const audioNames = ['c','h','k','l','q','r','s','t'];
let audioElements = {};
if (isLocalFile) {
  audioNames.forEach(name => {
      audioElements[name] = document.getElementById('audio-' + name);
  });
}
else{
  audioNames.forEach(name => {
    audioElements[name] = new Howl({
        src: [`audio/letters/${name}.mp3`], // adjust path for server/local if needed
        volume: 0.7,
        preload: true,   // preload to avoid first-play delay
        html5: false
    });
  });
}


function playAudio(name) {
  if (isLocalFile) {
    const el = audioElements[name];
    if (!el) return;
    el.currentTime = 0;
    el.play();
  } else {
      const sound = audioElements[name];
      if (!sound) return;
      sound.play();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//const defaultNumTrials = 3; // number of flashes per game
//let trialCount = 0;   // counter
let isPlaying = false;
let currentSequence = [];

let stimuliScores = {
  position: { correct: 0, falsePositive: 0, missed: 0 },
  audio:    { correct: 0, falsePositive: 0, missed: 0 },
  color:    { correct: 0, falsePositive: 0, missed: 0 },
  image:    { correct: 0, falsePositive: 0, missed: 0 }
};
let userPressed = {
  position: false,
  audio: false,
  color: false,
  image: false
}
let maxN=2;
let n = 2; 
let trialDelay;
let matchRate;
let interference;
let adaptive;

const buttonMap = {
  positionBtn: "position",
  audioBtn: "audio",
  colorBtn: "color",
  imageBtn: "image"
};

const stimuliTypes = ["position", "audio", "color", "image"];
const cells = [];
let activeStimuli = [];
const gridSize=3;
// create a 3x3 grid
for (let i = 0; i < gridSize*gridSize; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  grid.appendChild(cell);

  const img = document.createElement("img");
  img.classList.add("cell-image");
  img.src = ""; // initially empty, will set later

  // 3. Create the overlay
  const overlay = document.createElement("div");
  overlay.classList.add("cell-overlay");

  // 4. Append image and overlay to the cell
  cell.appendChild(img);
  cell.appendChild(overlay);

  // 5. Append cell to the grid
  grid.appendChild(cell);

  // 6. Store references for later (updating images/colors)
  cells.push({ cell, img, overlay });
}


function addTrial(stimuli) {
  currentSequence.push(stimuli);
}

function cleanCells(){
  for (const cell of cells) {
    cell.cell.style.backgroundColor=cellColor;
    cell.img.src = "";
    cell.overlay.style.backgroundColor = "transparent";
  }
}

function highlightCell(chosenCell) {
  cells[chosenCell].cell.style.backgroundColor=cellHighlightColor;
  
}

function displayStats(){
  let totaltp=0;
  let totalfp=0;
  let totalmissed=0;
  for (const type of activeStimuli) {
    const tp=stimuliScores[type].correct;
    const fp=stimuliScores[type].falsePositive;
    const missed=stimuliScores[type].missed;
    totaltp+=tp;
    totalfp+=fp;
    totalmissed+=missed;
    const btn = document.getElementById(type+"Btn");
    const numerator = tp;
    const denominator = tp+fp+missed;
    const fraction = ""+numerator + "/" + denominator;
    let percentage="0%";
    if (denominator>0){
      percentage = ""+(numerator*100 / (denominator)).toFixed(0)+"%";
    }

    btn.innerHTML = type.charAt(0).toUpperCase() + type.slice(1) + "<br>" + fraction + "<br>" + percentage;
    
  }
  startBtn.textContent="Start";
  totalNumerator = totaltp;
  totalDenominator = (totaltp+totalfp+totalmissed)
  let percentage="0%";
  if (totalDenominator>0){
    percentage = (totalNumerator*100 / totalDenominator).toFixed(0) + "%";
  }
  scoreLabel.textContent="score: "+percentage;
  headerText.textContent = `n = ${nInput.value}`;
}

function chooseStimuli(trialCount, type, length){
  let num = Math.floor(Math.random() * length);
  if (trialCount > n){
    if (Math.random()<matchRate/100){
      num = currentSequence[trialCount-n-1][type];
      return num;
    }
    else{
      if (Math.random()<interference/100){
        let possiblities=[];
        if (trialCount>n+1){
          possiblities.push(currentSequence[trialCount-n-2][type])
        }
        if (n>1){
          possiblities.push(num=currentSequence[trialCount-n][type]);
        }
        if (possiblities.length>0){
          num = possiblities[Math.floor(Math.random()*possiblities.length)];
          return num;
        }
      }
      while (num==currentSequence[trialCount-n-1][type]){
        num = Math.floor(Math.random() * length);
      }
    }
  }
  return num;
}

function chooseRandomN(){
  totalWeight = maxN * (maxN+1) /2;

  num = Math.floor(Math.random()*totalWeight);
  for (let i = 1; i <= maxN; i++) {
    lower = i* (i-1)/2; //inclusive
    higher = i *(i+1)/2; //exclusive
    if (num >= lower && num < higher){
      return i;
    }
  }
}

playTerminated=false;

async function play(numTrials){
  if (isPlaying){
    return;
  }
  n = Number(nInput.value);
  maxN = Number(nInput.value);
  interference=interferenceSlider.value;
  trialDelay=delaySlider.value;
  matchRate=matchRateSlider.value;
  adaptive=toggleAdaptive.checked;
  //reset scores
  activeStimuli=['position'];
  if (toggleImage.checked) activeStimuli.push('image');
  if (toggleColor.checked) activeStimuli.push('color');
  if (toggleAudio.checked) activeStimuli.push('audio');

  stimuliScores = {};
  activeStimuli.forEach(stimulus => {
    stimuliScores[stimulus] = { correct: 0, falsePositive: 0, missed: 0 };
  });

  for (const type of stimuliTypes) {
    const btn = document.getElementById(type+"Btn");
    btn.innerHTML=type.charAt(0).toUpperCase() + type.slice(1);
  }
  scoreLabel.textContent="score: ";

  currentSequence = [];

  isPlaying=true;
  for (let trialCount = 1; trialCount <= numTrials; trialCount++) {
    if (playTerminated){
      playTerminated=false;
      break;
    }
    if (adaptive){
      n=chooseRandomN();
      headerText.textContent = `n = ${n}`;
    }

    const position = chooseStimuli(trialCount, "position", gridSize*gridSize);

    highlightCell(position);
    const stimuli = {position: position};

    for (const stim of activeStimuli) {
      if (stim === "image") {
         /* show image */ 
         const image = chooseStimuli(trialCount, "image", imageNames.length);

          const name = imageNames[image];
          cells[position].img.src = preloadedImages[name].src;
          stimuli.image = image;
      }
      else if (stim === "color") {
         /* show color */ 
         const color = chooseStimuli(trialCount, "color", colorStimuli.length);
         cells[position].overlay.style.backgroundColor = colorStimuli[color];
         stimuli.color=color;
      }
      else if (stim === "audio") {
         const audio = chooseStimuli(trialCount, "audio", audioNames.length);
         stimuli.audio=audio;
         /*const audioFile=audioStimuli[audio];
         if (audioFile) {
          audioFile.currentTime = 0; // reset so it can replay
          audioFile.play();
        }
        else{
          console.log("audio didn't work?");
        }*/
        playAudio(audioNames[audio]);
      }
    }
    if (playTerminated){
      playTerminated=false;
      break;
    }
    addTrial(stimuli);
    startBtn.textContent=""+(numTrials-trialCount)+"/"+numTrials;
    const highlightDuration = trialDelay*(4/5);
    await sleep(highlightDuration);
    cleanCells();
    await sleep(trialDelay-highlightDuration);

    if (playTerminated){
      playTerminated=false;
      break;
    }

    // check responses after trial
    endOfTrialCheck();
  }
  isPlaying=false;
  displayStats();
}



nInput.addEventListener("input", () => {
  if (isPlaying){
    return;
  }
  const nLevel = nInput.value;
  headerText.textContent = `n = ${nLevel}`;
});


function endOfTrialCheck() {
  if (currentSequence.length <= n) return;
  const last = currentSequence[currentSequence.length - 1];
  const nBack = currentSequence[currentSequence.length - 1 - n];

  activeStimuli.forEach(type => {

    document.getElementById(type+"Btn").style.backgroundColor=originalColor;
    const isMatch = last[type] === nBack[type];
    const pressed = userPressed[type]; // e.g., { position: true, audio: false, ... }

    if (isMatch && userPressed[type]) {
      stimuliScores[type].correct++;
    } else if (isMatch && !userPressed[type]) {
      stimuliScores[type].missed++;
      document.getElementById(type+"Btn").style.backgroundColor=missedColor;
      setTimeout(() => {
        document.getElementById(type+"Btn").style.backgroundColor=originalColor;
      }, trialDelay/3);

    } else if (!isMatch && userPressed[type]) {
      stimuliScores[type].falsePositive++;
    }

    userPressed[type] = false;
    
  });
}
function handleButtonPress(type, btn) {
  if (currentSequence.length > n) {
    userPressed[type] = true;
    const last = currentSequence[currentSequence.length - 1][type];
    const nBack = currentSequence[currentSequence.length - 1 - n][type];

    if (last === nBack) {
      btn.style.backgroundColor = correctColor;
    } else {
      btn.style.backgroundColor = incorrectColor;
    }
  }
}

for (const [btnId, type] of Object.entries(buttonMap)) {
  const btn = document.getElementById(btnId);

  let isPressed = false;

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault(); // prevent focus or scrolling
    if (!isPlaying || isPressed) return;

    isPressed = true;
    
  });

  btn.addEventListener("pointerup", (e) => {
    e.preventDefault();
    if (!isPressed) return;

    isPressed = false;
    handleButtonPress(type, btn);
  });

  // Optional: handle leaving the button while pressing
  btn.addEventListener("pointercancel", () => {
    isPressed = false;
  });
  
}

document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Spacebar") { // space to start
    startBtn.click();
  }
  if (!isPlaying){
    return;
  }
  switch (e.key.toLowerCase()) {
    case "a": // position
      handleButtonPress("position", document.getElementById("positionBtn"));
      break;
    case "f": 
      handleButtonPress("color", document.getElementById("colorBtn"));
      break;
    case "j":
      handleButtonPress("image", document.getElementById("imageBtn"));
      break;
    case "l":
      handleButtonPress("audio", document.getElementById("audioBtn"));
      break;
  }
});
waitingForAudio=false;
startBtn.addEventListener("click", async () => {
  if (waitingForAudio){
    return;
  }
  
  if (!isPlaying){
    waitingForAudio=true;
    const numTrials = parseInt(numTrialsInput.value);

    if (isNaN(numTrials) || numTrials < 1) {
      alert("Please enter a valid number of trials (1 or more).");
      return; // stop starting the game
    }
  if (!isLocalFile){
    await Howler.ctx.resume();
    audioNames.forEach(name => {
      const sound = audioElements[name];
      if (!sound) return;
  
      // play muted and wait for first 'play' event
      const id = sound.play();
      sound.volume(0, id);
  
      // Once the sound starts playing, pause and reset
      sound.once('play', () => {
        sound.pause(id);
        sound.seek(0, id);
        sound.volume(0.7, id); // restore normal volume
      });
    });
  }

    waitingForAudio=false;
    play(numTrials);
  }
  else{
    playTerminated=true;
    endOfTrialCheck();
    displayStats();
  }
});


menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("expanded");
});


//disable selecting buttons
document.querySelectorAll("button").forEach(btn => {
  // Make it non-focusable
  btn.setAttribute("tabindex", "-1");

  // Prevent keyboard activation
  btn.addEventListener("keydown", e => {
    e.preventDefault();
  });
});

const prefix="adaptivenback_";
function saveSettings() {
  document.querySelectorAll(".setting").forEach(el => {
    if (el.type === "checkbox") {
      localStorage.setItem(prefix+el.id, el.checked);
    } else {
      localStorage.setItem(prefix+el.id, el.value);
    }
  });
}
function loadSettings() {
  document.querySelectorAll(".setting").forEach(el => {
    const saved = localStorage.getItem(prefix+el.id);
    if (saved !== null) {
      if (el.type === "checkbox") {
        el.checked = (saved === "true");
      } else {
        el.value = saved;
      }
    }
  });
  nInput.dispatchEvent(new Event("input"));
  interferenceSlider.dispatchEvent(new Event("input"));
  delaySlider.dispatchEvent(new Event("input"));
  matchRateSlider.dispatchEvent(new Event("input"));
}

document.querySelectorAll(".setting").forEach(el => {
  el.addEventListener("change", saveSettings);
});

window.addEventListener("load", loadSettings);