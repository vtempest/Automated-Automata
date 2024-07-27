<script>
  import { onMount } from "svelte";
  import { patterns } from "./patterns.js";

  // Canvas and context variables
  let canvas;
  let ctx;

  // Grid and cell properties
  let cellGrid = []; // 2D array representing the state of each cell (0 or 1)
  let cellColorGrid = []; // 2D array storing the color of each cell
  let gridHeight, gridWidth; // Dimensions of the grid in cells
  let cellSize = 5; // Size of each cell in pixels

  // Game state variables
  let animationDelay = 10; // Delay between generations in milliseconds
  let generation = 0; // Current generation count
  let isPlaying = false; // Flag to indicate if the game is running
  let surviveRules = [2, 3]; // Number of neighbors for a cell to survive
  let birthRules = [3]; // Number of neighbors for a new cell to be born
  let lastRuleClickTime = 0; // Timestamp of the last rule button click (for debouncing)

  // Pattern selection
  let selectedPattern = "Point On/Off"; // Currently selected pattern
  let playInterval; // Interval ID for the game loop

  //randomness mode off
  let isRandomModeOnByDefault = 1;
  let isRandomMode = false;
  let randomInterval;

  // Initialize the game when the component is mounted
  onMount(() => {
    if (isRandomModeOnByDefault) {
      toggleRandomMode();
      togglePlay()
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
    ctx = canvas.getContext("2d");

    // Fill the canvas with white to represent empty cells
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, gridWidth * cellSize, gridHeight * cellSize);

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
        if (cellColor && cellColor !== "000" && cellColor !== "FFF") {
          neighborColors.push(cellColor);
        }
      }
    }

    let resultColor = "";
    if (neighborColors.length) {
      // Calculate the average color of neighboring cells
      const sum = neighborColors.reduce(
        (acc, cur) => {
          return [
            acc[0] + parseInt(cur.slice(0, 2), 16),
            acc[1] + parseInt(cur.slice(2, 4), 16),
            acc[2] + parseInt(cur.slice(4, 6), 16),
          ];
        },
        [0, 0, 0]
      );

      resultColor = sum
        .map((v) =>
          Math.floor(v / neighborColors.length)
            .toString(16)
            .padStart(2, "0")
        )
        .join("");
    } else {
      // If no immediate neighbors, check extended neighborhood
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

      for (const [nX, nY] of extendedNeighborCells) {
        if (
          nX >= 0 &&
          nY >= 0 &&
          nX < gridWidth &&
          nY < gridHeight &&
          cellGrid[nY][nX] === 1
        ) {
          const cellColor = cellColorGrid[nY][nX];
          if (cellColor && cellColor !== "FFF") {
            resultColor = cellColor;
            break;
          }
        }
      }
    }

    // Generate a random color if no neighbor colors are found
    if (!resultColor || resultColor === "FFF") {
      resultColor = Array(3)
        .fill()
        .map(() =>
          Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, "0")
        )
        .join("");
    }

    // Ensure the color is not white
    if (resultColor === "FFF") resultColor = "FC4";

    // Set the cell color and draw it on the canvas
    ctx.fillStyle = "#" + resultColor;
    cellColorGrid[y][x] = resultColor;
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }

  // Deactivate a cell at the given coordinates
  function deactivateCell(x, y) {
    // Check if the coordinates are within the grid
    if (x < 0 || y < 0 || x >= gridWidth || y >= gridHeight) return;

    // Set the cell state to inactive and clear its color
    cellGrid[y][x] = 0;
    cellColorGrid[y][x] = 0;

    // Draw a white square to represent an inactive cell
    ctx.fillStyle = "#FFF";
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
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
  }

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

  // Change the speed of the animation
  function changeSpeed(delta) {
    animationDelay = Math.max(0, animationDelay + delta);
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
  }

  //RANDOMNESSS


  function toggleRandomMode() {
    isRandomMode = !isRandomMode;
    if (isRandomMode) {
      randomInterval = setInterval(() => {
        changeRandomRules();
        placeRandomPattern();
      }, 5000);
    } else {
      clearInterval(randomInterval);
    }
  }

  function changeRandomRules() {
    updateRuleSet("birth");
    updateRuleSet("survive");

    // Ensure at least 3 values in each array and prefer values less than 3
    ensureMinimumRules("birth");
    ensureMinimumRules("survive");

    // Force Svelte to update the component
    birthRules = [...birthRules];
    surviveRules = [...surviveRules];
  }

  function updateRuleSet(ruleType) {
    const rules = ruleType === "birth" ? birthRules : surviveRules;
    const newRules = [...rules];

    // Randomly add or remove 1-2 rules
    const changes = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < changes; i++) {
      if (Math.random() < 0.5 && newRules.length > 3) {
        // Remove a rule
        const indexToRemove = Math.floor(Math.random() * newRules.length);
        newRules.splice(indexToRemove, 1);
      } else {
        // Add a rule
        const newValue = Math.floor(Math.random() * 9);
        if (!newRules.includes(newValue)) {
          newRules.push(newValue);
        }
      }
    }

    if (ruleType === "birth") {
      birthRules = newRules;
    } else {
      surviveRules = newRules;
    }
  }

  function ensureMinimumRules(ruleType) {
    const rules = ruleType === "birth" ? birthRules : surviveRules;

    // Ensure at least one value less than 3
    if (!rules.some((v) => v < 3)) {
      const lowValue = Math.floor(Math.random() * 3);
      rules.push(lowValue);
    }

    // Ensure at least 3 values total
    while (rules.length < 3) {
      const newValue = Math.floor(Math.random() * 9);
      if (!rules.includes(newValue)) {
        rules.push(newValue);
      }
    }

    rules.sort((a, b) => a - b);
    if (ruleType === "birth") {
      birthRules = rules;
    } else {
      surviveRules = rules;
    }
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
</script>
<div class="h-screen w-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
  <div class="flex-grow relative">
    <canvas
      bind:this={canvas}
      on:click={handleCanvasClick}
      class="absolute inset-0 w-full h-full cursor-pointer"
    ></canvas>
  </div>

  <div class="bg-gray-100 dark:bg-gray-800 shadow-md fixed bottom-0 left-0 right-0">
    <div class="flex items-center space-x-2 p-2 overflow-x-auto">
      <button
        on:click={togglePlay}
        class="flex-shrink-0 w-12 h-12 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
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
        class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {#each patterns as pattern}
          <option value={pattern.name}>{pattern.name}</option>
        {/each}
      </select>

      <span
        class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium"
      >
        {generation}
      </span>

      <button
        on:click={toggleRandomMode}
        class={`flex-shrink-0 w-12 h-12 text-white rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
          isRandomMode
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-600 hover:bg-gray-700"
        }`}
        aria-label="Toggle Random Rules"
      >
        <svg
          class="w-6 h-6"
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

      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium whitespace-nowrap">Born:</span>
        <div class="flex space-x-1">
          {#each Array(9) as _, i}
            <button
              on:click={() => toggleRule("birth", i)}
              class={`w-8 h-8 text-sm font-medium rounded-md focus:outline-none ${
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

      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium whitespace-nowrap">Survive:</span>
        <div class="flex space-x-1">
          {#each Array(9) as _, i}
            <button
              on:click={() => toggleRule("survive", i)}
              class={`w-8 h-8 text-sm font-medium rounded-md focus:outline-none ${
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