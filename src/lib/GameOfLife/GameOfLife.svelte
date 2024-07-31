<script lang="ts">
  import { onMount } from "svelte";
  import { patterns } from "./patterns.js";

  // Canvas and context variables
  let canvas;
  let canvasDisplay;

  // Grid and cell properties
  let cellGrid = []; // 2D array representing the state of each cell (0 or 1)
  let cellColorGrid = []; // 2D array storing the color of each cell
  let gridHeight, gridWidth; // Dimensions of the grid in cells
  let cellSize = 3; // Size of each cell in pixels

  // Game state variables
  let animationDelay = 0; // Delay between generations in milliseconds
  let generation = 0; // Current generation count
  let isPlaying = false; // Flag to indicate if the game is running
  let surviveRules = []; // Number of neighbors for a cell to survive
  let birthRules = []; // Number of neighbors for a new cell to be born
  let lastRuleClickTime = 0; // Timestamp of the last rule button click (for debouncing)

  // Pattern selection
  let selectedPattern = "Glider"; // Currently selected pattern
  let playInterval; // Interval ID for the game loop
  let ruleNumber: Number; // Rule number for the Game of Life
  let defaultRuleNumber = 16480; // Conway's B3/S23 rules as Binary to Dec Number

  //randomness mode off
  let isRandomModeOnByDefault = 1;
  let isRandomMode = false;
  let randomInterval;

  // Add new variables for minimizable controls
  let isBottomBarMinimized = 0;

  // Function to toggle bottom bar visibility
  function toggleBottomBar() {
    isBottomBarMinimized = !isBottomBarMinimized;
  }

  // Initialize the game when the component is mounted
  onMount(() => {
    defaultRuleNumber = Math.floor(Math.random() * Math.pow(2, 18));

    generateRuleSet(defaultRuleNumber);

    if (isRandomModeOnByDefault) {
      toggleRandomMode();
      togglePlay();
    }
    initializeGame();
  });

  // Reset the game state and initialize the grid
  function initializeGame() {
    // Calculate grid dimensions based on window size
    gridWidth = Math.floor(window.innerWidth / cellSize);
    gridHeight = Math.floor((window.innerHeight - 100) / cellSize); // Adjusted for UI elements

    // Initialize cellGrid and cellColorGrid with empty cells
    cellGrid = Array(gridHeight)
      .fill()
      .map(() => Array(gridWidth).fill(0));
    cellColorGrid = Array(gridHeight)
      .fill()
      .map(() => Array(gridWidth).fill(0));

    // Set up the canvas
    canvas.width = gridWidth * cellSize;
    canvas.height = gridHeight * cellSize;
    canvasDisplay = canvas.getContext("2d");

    // Fill the canvas with white to represent empty cells
    canvasDisplay.fillStyle = "white";
    canvasDisplay.fillRect(0, 0, gridWidth * cellSize, gridHeight * cellSize);

    // Reset the generation count
    generation = 0;
  }

  // Handle canvas click events
  function handleCanvasClick(e) {
    // Calculate the cell coordinates from the click position
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    if (selectedPattern === "Point On/Off") {
      // Toggle the state of the clicked cell
      cellGrid[y][x] = cellGrid[y][x] ? 0 : 1;
      cellGrid[y][x] ? activateCell(x, y) : deactivateCell(x, y);
    } else {
      // Apply the selected pattern at the clicked position
      const pattern = patterns.find((p) => p.name === selectedPattern).array;
      pattern.forEach(([dx, dy]) => {
        activateCell(x + dx, y + dy);
      });
    }
  }

  // Activate a cell at the given coordinates
  function activateCell(x, y) {
    // Check if the coordinates are within the grid
    if (x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) return;

    // Set the cell state to active
    cellGrid[y][x] = 1;

    // Arrays to store neighbor colors and coordinates
    const neighborColors = [];
    const neighborCells = [
      [x - 1, y - 1],
      [x - 1, y],
      [x - 1, y + 1],
      [x, y - 1],
      [x, y + 1],
      [x + 1, y - 1],
      [x + 1, y],
      [x + 1, y + 1],
    ];
    const extendedNeighborCells = [
      [x - 2, y - 2],
      [x - 2, y - 1],
      [x - 2, y],
      [x - 2, y + 1],
      [x - 2, y + 2],
      [x + 2, y - 2],
      [x + 2, y - 1],
      [x + 2, y],
      [x + 2, y + 1],
      [x + 2, y + 2],
      [x - 1, y + 2],
      [x + 1, y + 2],
      [x - 1, y - 2],
      [x + 1, y - 2],
      [x, y + 2],
      [x, y - 2],
    ];

    // Collect colors of active neighboring cells
    for (const [nX, nY] of neighborCells) {
      if (
        nX >= 0 &&
        nY >= 0 &&
        nX < gridWidth &&
        nY < gridHeight &&
        cellGrid[nY][nX] === 1
      ) {
        const cellColor = cellColorGrid[nY][nX];
        if (cellColor && cellColor !== [0, 0, 0]) {
          neighborColors.push(cellColor);
        }
      }
    }

    let resultColor = [0, 0, 0];
    if (neighborColors.length) {
      // Calculate the average color of neighboring cells
      const sum = neighborColors.reduce(
        (acc, cur) => {
          return [acc[0] + cur[0], acc[1] + cur[1], acc[2] + cur[2]];
        },
        [0, 0, 0]
      );

      resultColor = sum.map((v) => Math.floor(v / neighborColors.length));
    } 
    
    // Generate color if no neighbor colors are found

    // This is a simple rule to generate a color based on the
    // rule number, generation, and cell position
    if (!neighborColors?.length) {
      resultColor = Array(3)
        .fill()
        .map((v, index) =>
          Math.floor((ruleNumber * generation * (1 + index)) % 256)
        );
    }

    // Ensure the color is not white
    // if (resultColor === "FFF") resultColor = "FC4";

    // Set the cell color and draw it on the canvas
    canvasDisplay.fillStyle = "rgb(" + resultColor.join(",") + ")"; // + resultColor;
    cellColorGrid[y][x] = resultColor;
    canvasDisplay.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }

  // Deactivate a cell at the given coordinates
  function deactivateCell(x, y) {
    // Check if the coordinates are within the grid
    if (x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) return;

    // Set the cell state to inactive and clear its color
    cellGrid[y][x] = 0;
    cellColorGrid[y][x] = 0;

    // Draw a white square to represent an inactive cell
    canvasDisplay.fillStyle = "#FFF";
    canvasDisplay.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }

  // Run one generation of the Game of Life
  function runGeneration() {
    // Create a copy of the current grid state
    const tempGrid = cellGrid.map((row) => [...row]);

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        // Optimization: Skip empty rows
        if (
          y > 0 &&
          y < gridHeight - 1 &&
          !tempGrid[y - 1].includes(1) &&
          !tempGrid[y].includes(1) &&
          !tempGrid[y + 1].includes(1)
        ) {
          break;
        }

        // Count live neighbors for the current cell
        const neighborCount = countNeighbors(x, y, tempGrid);

        // Apply Game of Life rules
        if (
          (tempGrid[y][x] === 0 && birthRules.includes(neighborCount)) ||
          (tempGrid[y][x] === 1 &&
            (surviveRules.includes(neighborCount) ||
              birthRules.includes(neighborCount)))
        ) {
          activateCell(x, y);
        } else if (
          tempGrid[y][x] === 1 &&
          !birthRules.includes(neighborCount) &&
          !surviveRules.includes(neighborCount)
        ) {
          deactivateCell(x, y);
        }
      }
    }

    //process next rule set
    if (isRandomMode) {
      numberGensLeftForRuleSet--;
      if (numberGensLeftForRuleSet <= 0) {
        //log "good rule set" which did not die out
        // console.log(
        //   "Universe ",
        //   ruleNumber,
        //   " survived until generation ",
        //   generation,
        //   " generations"
        // );
        changeRandomRules();
      }
    }

    //ensure the universe is not dead

    if (
      JSON.stringify(priorGenGrid) === JSON.stringify(cellGrid) ||
      JSON.stringify(prior2ndGenGrid) === JSON.stringify(cellGrid) ||
      JSON.stringify(prior3rdGenGrid) === JSON.stringify(cellGrid)
    ) {
      changeRandomRules();
    }

    // Save the current grid state for future reference

    priorGenGrid = JSON.parse(JSON.stringify(cellGrid));
    prior2ndGenGrid = JSON.parse(JSON.stringify(priorGenGrid));
    prior3rdGenGrid = JSON.parse(JSON.stringify(prior2ndGenGrid));
  }

  let priorGenGrid = [],
    prior2ndGenGrid = [],
    prior3rdGenGrid = [];

  // Count the number of live neighbors for a given cell
  function countNeighbors(x, y, grid) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        // Skip the cell itself
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        // Check if the neighbor is within the grid and active
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          count += grid[ny][nx];
        }
      }
    }
    return count;
  }

  // Toggle play/pause state of the game
  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      // Start the game loop
      playInterval = setInterval(() => {
        generation++;
        runGeneration();
      }, animationDelay * 20);
    } else {
      // Stop the game loop
      clearInterval(playInterval);
    }
  }
  // Toggle a rule (birth or survive) for the Game of Life
  function toggleRule(type, value) {
    // Debounce rule changes to prevent accidental double-clicks
    const now = new Date().getTime();
    if (now - lastRuleClickTime < 500) return;
    lastRuleClickTime = now;

    if (type === "birth") {
      if (birthRules.includes(value)) {
        // Remove the rule if it already exists
        birthRules = birthRules.filter((v) => v !== value);
      } else {
        // Add the rule and sort the array
        birthRules = [...birthRules, value].sort((a, b) => a - b);
      }
    } else {
      if (surviveRules.includes(value)) {
        // Remove the rule if it already exists
        surviveRules = surviveRules.filter((v) => v !== value);
      } else {
        // Add the rule and sort the array
        surviveRules = [...surviveRules, value].sort((a, b) => a - b);
      }
    }

    //update its decimal rule number
    ruleSetBinaryToRuleNumber();
  }

  //Create the gnerative effect of random evolutionary interactions
  let numberGensLeftForRuleSet = 100;

  function toggleRandomMode() {
    isRandomMode = !isRandomMode;
    if (isRandomMode) {
      // randomInterval = setInterval(() => {
      //   changeRandomRules();
      // }, 5000);
    } else {
      // clearInterval(randomInterval);
    }
  }

  function changeRandomRules() {
    // updateRuleSet("birth");
    // updateRuleSet("survive");
    // placeRandomPattern();

    generateRuleSet();
    numberGensLeftForRuleSet = ruleNumber % 128;

    // Ensure at least 3 values in each array and prefer values less than 3
    // ensureMinimumRules("birth");
    // ensureMinimumRules("survive");

    // Force Svelte to update the component
    birthRules = [...birthRules];
    surviveRules = [...surviveRules];
  }

  function placeRandomPattern() {
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const patternArray = randomPattern.array;

    // Get random position for the pattern
    const x = Math.floor(Math.random() * (gridWidth - patternArray[0].length));
    const y = Math.floor(Math.random() * (gridHeight - patternArray.length));

    // Place the pattern on the grid
    patternArray.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell === 1) {
          const newX = x + dx;
          const newY = y + dy;
          if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
            activateCell(newX, newY);
          }
        }
      });
    });
  }

  function generateNextRuleNumber() {
    let ruleNumberNew =
      Math.abs(1 + (ruleNumber || 1) * generation) % Math.pow(2, 18);

    return ruleNumberNew;
  }

  function generateRuleSet(ruleNumberNew = false) {
    // Update rule number with new or
    // Generate a random number up to 2^18 (exclusive)
    ruleNumber = ruleNumberNew || generateNextRuleNumber();

    birthRules = [];
    surviveRules = [];

    // Convert the number to binary and pad to 18 digits
    ruleNumber
      .toString(2) //
      .padStart(18, "0")
      .split("")
      .forEach((bit, index) => {
        //convert every 1 to a rule based on the 1's index
        if (bit != "1") return;
        if (index <= 9) birthRules.push(index);
        if (index > 9) surviveRules.push(index - 9);
      });

    return {
      ruleNumber,
      birthRules,
      surviveRules,
    };
  }

  function ruleSetBinaryToRuleNumber() {
    let indexes = birthRules.concat(surviveRules.map((v) => v + 9));

    // Initialize an array of 18 zeros
    let binaryArray = new Array(18).fill("0");
    for (let index of indexes) binaryArray[index] = "1";

    // Join the array to create a binary string
    let binary = binaryArray.join("");

    //binary to decimal
    ruleNumber = parseInt(binary, 2);
  }
</script>

<div
  class="h-screen w-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden"
>
  <div class="flex-grow relative">
    <canvas
      bind:this={canvas}
      on:click={handleCanvasClick}
      class="absolute inset-0 w-full h-full cursor-pointer"
    ></canvas>
  </div>

  {#if !isBottomBarMinimized}
    <div
      class="relative bottom-bar bg-gray-100 dark:bg-gray-800 shadow-md fixed bottom-0 left-0 right-0 transition-transform duration-300 ease-in-out overflow-x-auto"
      class:translate-y-full={isBottomBarMinimized}
    >
      <button
        on:click={toggleBottomBar}
        class="absolute top-1 right-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none text-xl font-bold w-6 h-6 flex items-center justify-center"
        aria-label="Minimize controls"
      >
        ×
      </button>
      <div class="flex flex-col p-1 sm:p-2">
        <div class="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
          <button
            on:click={togglePlay}
            class="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <svg
              class="w-4 h-4 sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {#if isPlaying}
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              {:else}
                <polygon points="5 3 19 12 5 21" />
              {/if}
            </svg>
          </button>

          <select
            bind:value={selectedPattern}
            class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-1 py-0.5 sm:px-2 sm:py-1 text-2xs sm:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each patterns as pattern}
              <option value={pattern.name}>{pattern.name}</option>
            {/each}
          </select>

          <span
            class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1 py-0.5 rounded-full text-2xs sm:text-xs font-medium"
          >
            {generation}
          </span>

          <button
            on:click={toggleRandomMode}
            class={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 text-white rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 ${
              isRandomMode
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
            aria-label="Toggle Random Rules"
          >
            <svg
              class="w-4 h-4 sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div class="flex items-center space-x-1 sm:space-x-2">
          <div class="flex items-center space-x-1">
            <span class="text-2xs sm:text-xs font-medium whitespace-nowrap"
              >R{ruleNumber || ""} B</span
            >
            <div class="flex space-x-0.5">
              {#each Array(9) as _, i}
                <button
                  on:click={() => toggleRule("birth", i)}
                  class={`w-5 h-5 sm:w-6 sm:h-6 text-2xs sm:text-xs font-medium rounded focus:outline-none ${
                    birthRules.includes(i)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {i}
                </button>
              {/each}
            </div>
          </div>

          <div class="flex items-center space-x-1">
            <span class="text-2xs sm:text-xs font-medium whitespace-nowrap"
              >S</span
            >
            <div class="flex space-x-0.5">
              {#each Array(9) as _, i}
                <button
                  on:click={() => toggleRule("survive", i)}
                  class={`w-5 h-5 sm:w-6 sm:h-6 text-2xs sm:text-xs font-medium rounded focus:outline-none ${
                    surviveRules.includes(i)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {i}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <button
      on:click={toggleBottomBar}
      class="control-icon fixed bottom-2 right-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 p-1.5 rounded-full shadow-md hover:bg-gray-700 dark:hover:bg-gray-300 focus:outline-none transition-opacity duration-300 ease-in-out"
      class:opacity-0={!isBottomBarMinimized}
      class:pointer-events-none={!isBottomBarMinimized}
      aria-label="Show controls"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="4" y1="12" x2="20" y2="12"></line>
        <line x1="4" y1="6" x2="20" y2="6"></line>
        <line x1="4" y1="18" x2="20" y2="18"></line>
      </svg>
    </button>
  {/if}
</div>

<style>
  /* Add these styles to your component or global stylesheet */
  .bottom-bar {
    transition: transform 0.3s ease-in-out;
    max-height: 30vh; /* Reduced max-height for smaller screens */
  }
  .control-icon {
    transition: opacity 0.3s ease-in-out;
  }
  /* Add a custom text size smaller than Tailwind's xs */
  .text-2xs {
    font-size: 0.65rem;
    line-height: 0.75rem;
  }
</style>
