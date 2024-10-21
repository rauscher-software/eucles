class ArrayList extends Array {
  constructor() {
    super(...[]);
  }
  size() {
    return this.length;
  }
  add(x) {
    this.push(x);
  }
  get(i) {
    return this[i];
  }
  remove(i) {
    this.splice(i, 1);
  }
}

let started = false;
let play = true;
let focus = true;

window.addEventListener("focus", () => focus = true);
window.addEventListener("blur", () => focus = false);

// [processing-p5-convert] import processing.sound.*;
let instruments;
let interval = 150;
let bpm = 100;
let lastTime = 0;
let step = 0;
let totalSteps = 16;
let rotateLeft = false;
let rotateRight = false;
let bpmCol = 0;

function setup() {
  const canvas = createCanvas(640, 520);
  noStroke();
  textSize(22);
  textFont('monospace');
  textAlign(CENTER, CENTER);
  canvas.elt.addEventListener("contextmenu", (e) => { e.preventDefault() })
  instruments = new ArrayList();
  instruments.add(
    new Instrument(
      this, "kick.wav", 0.5, 1, totalSteps, int(random(1, 9)), 9,
      0, 135, 81, 160, 120, 100
    )
  );
  instruments.add(
    new Instrument(
      this, "snare.wav", 0.5, 2, totalSteps, int(random(1, 5)), 5,
      200, 119, 168, 480, 120, 100
    )
  );
  instruments.add(
    new Instrument(
      this, "bell.wav", 0.5, 3, totalSteps, int(random(1, 11)), 11,
      131, 118, 156, 160, 400, 100
    )
  );
  instruments.add(
    new Instrument(
      this, "stix.wav", 0.5, 4, totalSteps, int(random(1, 17)),
      17, 49, 63, 103, 480, 400, 100
    )
  );
}

function makeOptions(instrument){
  play = false;
  // overlay
  let overlay = document.getElementById('options-overlay');
  overlay.style.cssText ='background: black; z-index: 10000;';
  // options window
  let optionsWindow = document.createElement('div');
  optionsWindow.classList.add('options-window');
  optionsWindow.innerHTML += `
    <h2 style="color: rgb(${instrument.r},${instrument.g},${instrument.b});">
      Necklace ${instrument.index} Options
    </h2>
    <hr>
    <p>Volume (0 - 10)</p>
  `;
  // volume
  let volume = document.createElement('input');
  volume.type = 'number';
  volume.min = 0;
  volume.max = 10;
  volume.value = instrument.vol*10;
  volume.addEventListener("change", (e) => {
    instrument.vol = e.target.valueAsNumber / 10;
    instrument.sound.setVolume(instrument.vol);
  });
  optionsWindow.appendChild(volume);
  // load sample
  let hr1 = document.createElement('hr');
  optionsWindow.appendChild(hr1);
  let sampleText = document.createElement('p');
  sampleText.innerText = 'Load Sample';
  optionsWindow.appendChild(sampleText);
  let sampleInput = document.createElement('input');
  sampleInput.type = 'file';
  sampleInput.accept = 'audio/*';
  sampleInput.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        instrument.sound = loadSound(e.target.result);
        instrument.sound.setVolume(instrument.vol);
      };
      reader.readAsDataURL(file);
    }
  };
  optionsWindow.appendChild(sampleInput);
  // confirm button
  let hr2 = document.createElement('hr');
  optionsWindow.appendChild(hr2);
  let confirm = document.createElement('button');
  confirm.innerText = 'OK';
  confirm.addEventListener("click", () => {
    overlay.innerHTML = '';
    overlay.style.cssText = '';
    play = true;
  });
  optionsWindow.appendChild(confirm);
  overlay.appendChild(optionsWindow);
}

function mouseWheel(event) {
  for (let instrument of instruments) {
    if (event.wheelDelta < 0 && instrument.isActive) {
      rotateLeft = true;  // Set flag to rotate left
    } else if (event.wheelDelta > 0 && instrument.isActive) {
      rotateRight = true;  // Set flag to rotate right
    }
  }
}

function mousePressed() {
  if (keyIsPressed !== true) {
    for (let instrument of instruments) {
      // add pulse
      if (mouseButton == LEFT && instrument.isActive && play) {
        instrument.pulses += 1;
        if (instrument.pulses == 0) instrument.pulses = 1;
        if (instrument.pulses > totalSteps) instrument.pulses = totalSteps;
        instrument.newPattern(totalSteps, instrument.pulses); // remove pulse
      } else if (mouseButton == RIGHT && instrument.isActive && play) {
        instrument.pulses -= 1;
        if (instrument.pulses == 0) instrument.pulses = 1;
        if (instrument.pulses > totalSteps) instrument.pulses = totalSteps;
        instrument.newPattern(totalSteps, instrument.pulses);
      }
    }
  }
}

function doubleClicked() {
  // if shift key is held on double click
  if (keyIsPressed === true && keyCode == 16) {
    for (let instrument of instruments) {
      if (instrument.isActive){
        makeOptions(instrument);
      }
    }
  }
}

function keyPressed() {
  // play/pause
  if (key == 'p') {
    play = !play;
  }
  // new random pattern
  if (key == 'r') {
    for (let instrument of instruments) {
      instrument.newPattern(totalSteps, int(random(1, instrument.maxP)));
    }
  }
  // faster
  if (key == 'f') {
    bpm += 1;
    interval = 60000/(bpm*4);
    bpmCol = 255;
  }
  // slower
  if (key == 's') {
    bpm -= 1;
    interval = 60000/(bpm*4);
    bpmCol = 255;
  }
  // enter bpm
  if (key == 'b') {
    play = false;
    let speed = prompt("Please enter BPM", bpm);
    if (speed != null){
      let parsedBPM = parseInt(speed);
      if (parsedBPM !== NaN && parsedBPM > 0 && parsedBPM < 450) {
        bpm = parsedBPM;
        interval = 60000/(bpm*4);
        bpmCol = 255;
      }
      play = true;
    }
    else {
      play = true;
    }
  }
}

// start
function startSketch() {
  if (!started) {
    started = true;
    let startScreen = document.getElementById('start-screen');
    if (startScreen) {
      startScreen.style.display = 'none';
    }
  }
}

// main draw function
function draw() {
  // check if sketch has been started, is paused or is out of focus
  if (!started || !play || !focus) {
    return;
  }
  // reduce bpm brightness
  if (bpmCol > 0) bpmCol -= 7;
  // check if instrument is being hovered
  for (let instrument of instruments) {
    instrument.isActive = instrument.hovered();
  } // setp forward in time
  let timeNow = millis();
  if (timeNow - lastTime >= interval) {
    rotatePatterns(); // rotate patterns according to flags
    background(0); // draw ring
    for (let instrument of instruments) {
      instrument.drawPattern(step);
    }
    // play sound and increment step
    stepForward();
    lastTime = timeNow;
  }
}

function rotatePatterns() {
  for (let instrument of instruments) {
    if (rotateLeft && instrument.isActive) {
      instrument.rotatePattern("left");
    } else if (rotateRight && instrument.isActive) {
      instrument.rotatePattern("right");
    }
  }
  rotateLeft = false;
  rotateRight = false;
}

function stepForward() {
  for (let instrument of instruments) {
    instrument.play(step);
  }
  step++;
  if (step >= totalSteps) {
    step = 0;
  }
}

class Instrument {
  sound;
  vol;
  index;
  pattern;
  totalSteps;
  pulses;
  r;
  g;
  b;
  maxP;
  xPos;
  yPos;
  radius;
  isActive;
  constructor(
    sketch,
    sampleFile,
    vol,
    index,
    totalSteps,
    pulses,
    maxP,
    r,
    g,
    b,
    xPos,
    yPos,
    radius
  ) {
    this.sound = loadSound(sampleFile);
    this.vol = vol;
    this.sound.setVolume(vol);
    this.index = index;
    this.totalSteps = totalSteps;
    this.pulses = pulses;
    this.maxP = maxP;
    this.r = r;
    this.g = g;
    this.b = b;
    this.xPos = xPos;
    this.yPos = yPos;
    this.radius = radius;
    this.isActive = false;
    this.pattern = generateEuclideanPattern(totalSteps, pulses);
  }
  play(step) {
    if (this.pattern[step] == 1) {
      this.sound.play();
    }
  }
  newPattern(steps, pulses) {
    this.pattern = [];
    this.pulses = pulses;
    this.pattern = generateEuclideanPattern(steps, pulses);
  }
  hovered() {
    return (
      mouseX > this.xPos - this.radius &&
      mouseX < this.xPos + this.radius &&
      mouseY > this.yPos - this.radius &&
      mouseY < this.yPos + this.radius
    );
  }
  rotatePattern(direction) {
    if (direction == "left") {
      let first = this.pattern[0];
      for (let i = 0; i < this.pattern.length - 1; i++) {
        this.pattern[i] = this.pattern[i + 1];
      }
      this.pattern[this.pattern.length - 1] = first;
    } else if (direction == "right") {
      let last = this.pattern[this.pattern.length - 1];
      for (let i = this.pattern.length - 1; i > 0; i--) {
        this.pattern[i] = this.pattern[i - 1];
      }
      this.pattern[0] = last;
    }
  }
  drawPattern(step) {
    for (let i = 0; i < this.totalSteps; i++) {
      let angle = TWO_PI * (i / float(this.totalSteps));
      let x = this.xPos + this.radius * cos(angle);
      let y = this.yPos + this.radius * sin(angle);
      if (i == step || this.isActive) {
        fill(255);
      } else {
        fill(this.r, this.g, this.b);
      }
      if (this.pattern[i] == 1) {
        ellipse(x, y, 4 + this.vol*16, 4 + this.vol*16);
      } else {
        ellipse(x, y, 4, 4);
      }
    }
    fill(bpmCol);
    text(bpm + ' BPM', 320, 260);
  }
}

function generateEuclideanPattern(steps, pulses) {
  let pattern = [];
  let counts = [];
  let remainders = [];
  let divisor = steps - pulses;
  remainders.push(pulses);
  let level = 0;

  // Build counts and remainders
  while (true) {
    counts.push(Math.floor(divisor / remainders[level]));
    remainders.push(divisor % remainders[level]);
    divisor = remainders[level];
    level += 1;
    if (remainders[level] <= 1) {
      break;
    }
  }

  counts.push(divisor);

  // Recursive function to build the pattern
  function buildPattern(level) {
    if (level === -1) {
      pattern.push(0);
    } else if (level === -2) {
      pattern.push(1);
    } else {
      for (let i = 0; i < counts[level]; i++) {
        buildPattern(level - 1);
      }
      if (remainders[level] !== 0) {
        buildPattern(level - 2);
      }
    }
  }

  buildPattern(level);

  // Rotate pattern to start with the first '1'
  let firstIndex = pattern.indexOf(1);
  let rotatedPattern = pattern.slice(firstIndex).concat(pattern.slice(0, firstIndex));

  // Ensure the pattern length matches the number of steps
  return rotatedPattern.slice(0, steps);
}
