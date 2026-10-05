const chart = document.querySelector("#chart");
const barsContainer = document.querySelector("#bars");
const algorithmSelect = document.querySelector("#algorithm");
const sizeInput = document.querySelector("#array-size");
const sizeOutput = document.querySelector("#size-value");
const speedInput = document.querySelector("#speed");
const speedOutput = document.querySelector("#speed-value");
const generateButton = document.querySelector("#generate-button");
const resetButton = document.querySelector("#reset-button");
const sortButton = document.querySelector("#sort-button");
const stopButton = document.querySelector("#stop-button");
const raceButton = document.querySelector("#race-button");
const raceAlgorithmA = document.querySelector("#race-algorithm-a");
const raceAlgorithmB = document.querySelector("#race-algorithm-b");
const raceWinner = document.querySelector("#race-winner");
const raceWinnerText = document.querySelector("#race-winner-text");
const statusbar = document.querySelector(".statusbar");
const statusText = document.querySelector("#status-text");
const comparisonCount = document.querySelector("#comparison-count");
const swapCount = document.querySelector("#swap-count");
const arrayCount = document.querySelector("#array-count");
const sortTime = document.querySelector("#sort-time");

const complexityName = document.querySelector("#complexity-name");
const complexityBest = document.querySelector("#complexity-best");
const complexityAverage = document.querySelector("#complexity-average");
const complexityWorst = document.querySelector("#complexity-worst");
const complexitySpace = document.querySelector("#complexity-space");

const complexities = {
  quick: { name: "Quick sort", best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
  merge: { name: "Merge sort", best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  insertion: { name: "Insertion sort", best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  selection: { name: "Selection sort", best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  bubble: { name: "Bubble sort", best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
};

const raceLanes = [
  {
    id: "a",
    select: raceAlgorithmA,
    name: document.querySelector("#race-name-a"),
    card: document.querySelector("#race-name-a").closest(".race-lane"),
    chart: document.querySelector("#race-chart-a"),
    bars: document.querySelector("#race-bars-a"),
    status: document.querySelector("#race-status-a"),
    comparisons: document.querySelector("#race-comparisons-a"),
    swaps: document.querySelector("#race-swaps-a"),
    time: document.querySelector("#race-time-a"),
  },
  {
    id: "b",
    select: raceAlgorithmB,
    name: document.querySelector("#race-name-b"),
    card: document.querySelector("#race-name-b").closest(".race-lane"),
    chart: document.querySelector("#race-chart-b"),
    bars: document.querySelector("#race-bars-b"),
    status: document.querySelector("#race-status-b"),
    comparisons: document.querySelector("#race-comparisons-b"),
    swaps: document.querySelector("#race-swaps-b"),
    time: document.querySelector("#race-time-b"),
  },
];

let values = [];
let sourceValues = [];
let isSorting = false;
let isRaceRunning = false;
let runId = 0;
let raceRunId = 0;
let comparisons = 0;
let swaps = 0;
let sortStartedAt = null;

function generateRandomArray(size) {
  const itemCount = Math.max(1, Math.floor(Number(size) || 1));
  return Array.from({ length: itemCount }, () => Math.floor(Math.random() * 92) + 8);
}

function renderBars() {
  barsContainer.replaceChildren();
  values.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.setProperty("--bar-height", `${value}%`);
    bar.dataset.index = String(index);
    barsContainer.append(bar);
  });
  chart.setAttribute("aria-label", `Array visualization with ${values.length} unsorted values`);
}

function setStatus(message, state = "ready") {
  statusText.textContent = message;
  statusbar.classList.toggle("is-running", state === "running");
  statusbar.classList.toggle("is-done", state === "done");
}

function updateCounts() {
  comparisonCount.textContent = String(comparisons);
  swapCount.textContent = String(swaps);
}

function formatTime(milliseconds) {
  return `${(milliseconds / 1000).toFixed(2)} s`;
}

function elapsedSortTime() {
  if (sortStartedAt === null) return 0;
  return Math.max(0, performance.now() - sortStartedAt);
}

function updateComplexity() {
  const details = complexities[algorithmSelect.value];
  complexityName.textContent = details.name;
  complexityBest.textContent = details.best;
  complexityAverage.textContent = details.average;
  complexityWorst.textContent = details.worst;
  complexitySpace.textContent = details.space;
}

function updateBusyControls() {
  const busy = isSorting || isRaceRunning;
  sortButton.disabled = busy;
  generateButton.disabled = busy;
  sizeInput.disabled = busy;
  algorithmSelect.disabled = busy;
  resetButton.disabled = isRaceRunning;
  stopButton.disabled = !isSorting;
  raceButton.disabled = busy;
  raceAlgorithmA.disabled = busy;
  raceAlgorithmB.disabled = busy;
}

function syncRaceAlgorithms(changedSelect) {
  if (raceAlgorithmA.value === raceAlgorithmB.value) {
    const otherSelect = changedSelect === raceAlgorithmA ? raceAlgorithmB : raceAlgorithmA;
    const alternative = [...otherSelect.options].find((option) => option.value !== changedSelect.value);
    if (alternative) otherSelect.value = alternative.value;
  }

  [...raceAlgorithmA.options].forEach((option) => {
    option.disabled = option.value === raceAlgorithmB.value;
  });
  [...raceAlgorithmB.options].forEach((option) => {
    option.disabled = option.value === raceAlgorithmA.value;
  });
  raceLanes.forEach((lane) => {
    lane.name.textContent = complexities[lane.select.value].name;
  });
}

function renderRaceBars(lane, array) {
  lane.bars.replaceChildren();
  array.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "bar race-bar";
    bar.style.setProperty("--bar-height", `${value}%`);
    bar.dataset.index = String(index);
    lane.bars.append(bar);
  });
  lane.chart.setAttribute("aria-label", `${lane.name.textContent} race visualization with ${array.length} values`);
}

function renderRacePreview() {
  raceLanes.forEach((lane) => {
    lane.card.classList.remove("is-running", "is-complete");
    lane.status.textContent = "Ready";
    lane.comparisons.textContent = "0";
    lane.swaps.textContent = "0";
    lane.time.textContent = "—";
    renderRaceBars(lane, sourceValues);
  });
  raceWinner.hidden = true;
  raceWinnerText.textContent = "";
  raceButton.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span> Race';
}

function clearHighlights() {
  barsContainer.querySelectorAll(".bar").forEach((bar) => {
    bar.classList.remove("is-comparing", "is-swapping");
  });
}

function generateNewArray() {
  runId += 1;
  isSorting = false;
  sortStartedAt = null;
  sizeOutput.value = sizeInput.value;
  sizeOutput.textContent = sizeInput.value;
  sourceValues = generateRandomArray(sizeInput.value);
  values = [...sourceValues];
  comparisons = 0;
  swaps = 0;
  updateCounts();
  arrayCount.textContent = String(values.length);
  sortTime.textContent = formatTime(0);
  renderBars();
  syncRaceAlgorithms(raceAlgorithmA);
  renderRacePreview();
  setStatus("Ready");
  sortButton.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span> Start Sorting';
  updateBusyControls();
}

function resetArray() {
  generateNewArray();
}

function addCompare(operations, first, second) {
  operations.push({ type: "compare", first, second });
}

function addSwap(operations, array, first, second) {
  if (first === second) return;
  operations.push({ type: "swap", first, second });
  [array[first], array[second]] = [array[second], array[first]];
}

function createOperations(input, algorithm) {
  const array = [...input];
  const operations = [];

  if (algorithm === "bubble") {
    for (let end = array.length - 1; end > 0; end -= 1) {
      let moved = false;
      for (let index = 0; index < end; index += 1) {
        addCompare(operations, index, index + 1);
        if (array[index] > array[index + 1]) {
          addSwap(operations, array, index, index + 1);
          moved = true;
        }
      }
      if (!moved) {
        operations.push({ type: "mark-sorted", start: 0, end });
        break;
      }
      operations.push({ type: "mark-sorted", start: end, end });
    }
    operations.push({ type: "mark-sorted", start: 0, end: 0 });
  }

  if (algorithm === "selection") {
    for (let start = 0; start < array.length - 1; start += 1) {
      let smallest = start;
      for (let index = start + 1; index < array.length; index += 1) {
        addCompare(operations, smallest, index);
        if (array[index] < array[smallest]) smallest = index;
      }
      addSwap(operations, array, start, smallest);
      operations.push({ type: "mark-sorted", start, end: start });
    }
  }

  if (algorithm === "insertion") {
    for (let index = 1; index < array.length; index += 1) {
      let position = index;
      while (position > 0) {
        addCompare(operations, position - 1, position);
        if (array[position - 1] <= array[position]) break;
        addSwap(operations, array, position - 1, position);
        position -= 1;
      }
      operations.push({ type: "mark-sorted", start: 0, end: index });
    }
  }

  if (algorithm === "merge") {
    function mergeSort(start, end) {
      if (end - start < 2) return;
      const middle = Math.floor((start + end) / 2);
      mergeSort(start, middle);
      mergeSort(middle, end);
      const left = array.slice(start, middle);
      const right = array.slice(middle, end);
      let leftIndex = 0;
      let rightIndex = 0;
      let target = start;

      while (leftIndex < left.length && rightIndex < right.length) {
        addCompare(operations, start + leftIndex, middle + rightIndex);
        if (left[leftIndex] <= right[rightIndex]) array[target] = left[leftIndex++];
        else array[target] = right[rightIndex++];
        operations.push({ type: "write", index: target, value: array[target] });
        target += 1;
      }
      while (leftIndex < left.length) {
        array[target] = left[leftIndex++];
        operations.push({ type: "write", index: target, value: array[target] });
        target += 1;
      }
      while (rightIndex < right.length) {
        array[target] = right[rightIndex++];
        operations.push({ type: "write", index: target, value: array[target] });
        target += 1;
      }
    }
    mergeSort(0, array.length);
  }

  if (algorithm === "quick") {
    function quickSort(low, high) {
      if (low >= high) return;
      const pivot = array[high];
      let smaller = low;
      for (let index = low; index < high; index += 1) {
        addCompare(operations, index, high);
        if (array[index] < pivot) {
          addSwap(operations, array, smaller, index);
          smaller += 1;
        }
      }
      const pivotIndex = smaller;
      addSwap(operations, array, pivotIndex, high);
      operations.push({ type: "mark-sorted", start: pivotIndex, end: pivotIndex });
      quickSort(low, pivotIndex - 1);
      quickSort(pivotIndex + 1, high);
    }
    quickSort(0, array.length - 1);
  }

  return operations;
}

function waitForStep(delay, currentRun) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    function tick() {
      if (currentRun !== runId) return resolve(false);
      if (performance.now() - startedAt >= delay) return resolve(true);
      window.setTimeout(tick, 20);
    }
    tick();
  });
}

function stepDelay() {
  const speed = Number(speedInput.value);
  return Math.max(18, 190 - speed * 34);
}

function waitForRaceStep(delay, currentRace) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    function tick() {
      if (currentRace !== raceRunId) return resolve(false);
      if (performance.now() - startedAt >= delay) return resolve(true);
      window.setTimeout(tick, 20);
    }
    tick();
  });
}

async function animateRaceLane(lane, algorithm, sharedArray, currentRace) {
  const startedAt = performance.now();
  const operations = createOperations(sharedArray, algorithm);
  const workingValues = [...sharedArray];
  const bars = [...lane.bars.children];
  let laneComparisons = 0;
  let laneSwaps = 0;

  lane.card.classList.remove("is-complete");
  lane.card.classList.add("is-running");
  lane.status.textContent = "Sorting";
  lane.comparisons.textContent = "0";
  lane.swaps.textContent = "0";
  lane.time.textContent = "0.00 s";

  for (const operation of operations) {
    if (currentRace !== raceRunId) return null;
    bars.forEach((bar) => bar.classList.remove("is-comparing", "is-swapping"));

    if (operation.type === "compare") {
      laneComparisons += 1;
      bars[operation.first]?.classList.add("is-comparing");
      bars[operation.second]?.classList.add("is-comparing");
    } else if (operation.type === "swap") {
      laneSwaps += 1;
      [workingValues[operation.first], workingValues[operation.second]] = [
        workingValues[operation.second],
        workingValues[operation.first],
      ];
      bars[operation.first]?.classList.add("is-swapping");
      bars[operation.second]?.classList.add("is-swapping");
      bars[operation.first]?.style.setProperty("--bar-height", `${workingValues[operation.first]}%`);
      bars[operation.second]?.style.setProperty("--bar-height", `${workingValues[operation.second]}%`);
    } else if (operation.type === "write") {
      workingValues[operation.index] = operation.value;
      bars[operation.index]?.classList.add("is-swapping");
      bars[operation.index]?.style.setProperty("--bar-height", `${operation.value}%`);
    } else if (operation.type === "mark-sorted") {
      for (let index = operation.start; index <= operation.end; index += 1) {
        bars[index]?.classList.add("is-sorted");
      }
    }

    lane.comparisons.textContent = String(laneComparisons);
    lane.swaps.textContent = String(laneSwaps);
    const delay = operation.type === "mark-sorted" ? 0 : stepDelay();
    if (!(await waitForRaceStep(delay, currentRace))) return null;
    lane.time.textContent = formatTime(performance.now() - startedAt);
  }

  if (currentRace !== raceRunId) return null;
  bars.forEach((bar) => {
    bar.classList.remove("is-comparing", "is-swapping");
    bar.classList.add("is-sorted");
  });
  const finishedAt = performance.now();
  const duration = finishedAt - startedAt;
  lane.card.classList.remove("is-running");
  lane.card.classList.add("is-complete");
  lane.status.textContent = "Completed";
  lane.time.textContent = formatTime(duration);
  return { name: complexities[algorithm].name, finishedAt, duration };
}

async function startRace() {
  if (isSorting || isRaceRunning) return;
  syncRaceAlgorithms(raceAlgorithmA);

  const currentRace = ++raceRunId;
  const sharedArray = [...sourceValues];
  isRaceRunning = true;
  raceWinner.hidden = true;
  raceWinnerText.textContent = "";
  raceButton.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span> Racing…';
  raceLanes.forEach((lane) => renderRaceBars(lane, sharedArray));
  updateBusyControls();

  const algorithmA = raceAlgorithmA.value;
  const algorithmB = raceAlgorithmB.value;
  const [resultA, resultB] = await Promise.all([
    animateRaceLane(raceLanes[0], algorithmA, sharedArray, currentRace),
    animateRaceLane(raceLanes[1], algorithmB, sharedArray, currentRace),
  ]);

  if (currentRace !== raceRunId || !resultA || !resultB) return;
  isRaceRunning = false;
  updateBusyControls();
  const winner = resultA.finishedAt <= resultB.finishedAt ? resultA : resultB;
  raceWinnerText.textContent = `${winner.name} finished first`;
  raceWinner.hidden = false;
  raceButton.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span> Race Again';
}

async function playSort() {
  if (isSorting || isRaceRunning) return;

  isSorting = true;
  const currentRun = ++runId;
  const algorithmName = algorithmSelect.options[algorithmSelect.selectedIndex].text;
  const operations = createOperations(values, algorithmSelect.value);
  const bars = [...barsContainer.children];
  bars.forEach((bar) => bar.classList.remove("is-sorted"));
  sortStartedAt = performance.now();
  comparisons = 0;
  swaps = 0;
  updateCounts();
  updateBusyControls();
  setStatus("Sorting", "running");

  for (const operation of operations) {
    if (currentRun !== runId) return;
    const delay = operation.type === "mark-sorted" ? 0 : stepDelay();
    clearHighlights();

    if (operation.type === "compare") {
      comparisons += 1;
      bars[operation.first]?.classList.add("is-comparing");
      bars[operation.second]?.classList.add("is-comparing");
    } else if (operation.type === "swap") {
      swaps += 1;
      [values[operation.first], values[operation.second]] = [values[operation.second], values[operation.first]];
      bars[operation.first]?.classList.add("is-swapping");
      bars[operation.second]?.classList.add("is-swapping");
      bars[operation.first]?.style.setProperty("--bar-height", `${values[operation.first]}%`);
      bars[operation.second]?.style.setProperty("--bar-height", `${values[operation.second]}%`);
    } else if (operation.type === "write") {
      values[operation.index] = operation.value;
      bars[operation.index]?.classList.add("is-swapping");
      bars[operation.index]?.style.setProperty("--bar-height", `${operation.value}%`);
    } else if (operation.type === "mark-sorted") {
      for (let index = operation.start; index <= operation.end; index += 1) {
        bars[index]?.classList.add("is-sorted");
      }
    }

    updateCounts();
    if (!(await waitForStep(delay, currentRun))) return;
    sortTime.textContent = formatTime(elapsedSortTime());
  }

  if (currentRun !== runId) return;
  clearHighlights();
  bars.forEach((bar) => bar.classList.add("is-sorted"));
  chart.setAttribute("aria-label", `Sorted array of ${values.length} values using ${algorithmName}`);
  isSorting = false;
  sortTime.textContent = formatTime(elapsedSortTime());
  sortStartedAt = null;
  updateBusyControls();
  sortButton.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span> Start Sorting';
  setStatus("Completed", "done");
}

function stopSorting() {
  if (!isSorting) return;
  runId += 1;
  sortTime.textContent = formatTime(elapsedSortTime());
  sortStartedAt = null;
  isSorting = false;
  clearHighlights();
  sortButton.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span> Start Sorting';
  updateBusyControls();
  setStatus("Ready");
}

generateButton.addEventListener("click", generateNewArray);
resetButton.addEventListener("click", resetArray);
sortButton.addEventListener("click", playSort);
stopButton.addEventListener("click", stopSorting);
raceButton.addEventListener("click", startRace);
algorithmSelect.addEventListener("change", updateComplexity);
raceAlgorithmA.addEventListener("change", () => {
  syncRaceAlgorithms(raceAlgorithmA);
  renderRacePreview();
});
raceAlgorithmB.addEventListener("change", () => {
  syncRaceAlgorithms(raceAlgorithmB);
  renderRacePreview();
});

sizeInput.addEventListener("input", () => {
  sizeOutput.value = sizeInput.value;
  sizeOutput.textContent = sizeInput.value;
  generateNewArray();
});

speedInput.addEventListener("input", () => {
  const speed = Number(speedInput.value) / 2;
  speedOutput.value = `${speed.toFixed(1)}×`;
  speedOutput.textContent = `${speed.toFixed(1)}×`;
});

updateComplexity();
generateNewArray();
