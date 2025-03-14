const grid = document.getElementById("grid");
const timerDisplay = document.getElementById("time");
const resultDisplay = document.getElementById("result");
const download = document.getElementById("download");
const difficultySelect = document.getElementById("difficulty");
const shinyCheckbox = document.getElementById("shiny");
const startButton = document.getElementById("start");
let cards = [];
let firstCard, secondCard;
let lockBoard = false;
let matches = 0;
let timer;
let startTime;
let gameStarted = false;

function getRareTrue(probability = 0.2) {
  return Math.random() < probability;
}

// Initialize the game
async function initGame() {
  resetBoard();
  const difficulty = difficultySelect.value;
  const numberOfPokemon = getNumberOfPokemon(difficulty);
  const pokemonIds = generateRandomPokemonIds(numberOfPokemon);
  const pokemonImages = await fetchPokemonImages(pokemonIds);
  cards = shuffleArray(pokemonImages.concat(pokemonImages));
  grid.innerHTML = "";
  cards.forEach((image, index) => createCard(image, index));
  matches = 0;
  resultDisplay.innerHTML = "";
}

// Get number of Pokemon based on difficulty
function getNumberOfPokemon(difficulty) {
  switch (difficulty) {
    case "easy":
      return 9;
    case "medium":
      return 18;
    case "hard":
      return 33;
    default:
      return 6;
  }
}

// Generate random Pokemon IDs
function generateRandomPokemonIds(number) {
  const ids = [];
  while (ids.length < number) {
    const randomId = Math.floor(Math.random() * 151) + 1; // Gen 1 Pokemon (1-151)
    if (!ids.includes(randomId)) ids.push(randomId);
  }
  return ids;
}

// Fetch Pokemon images from PokeAPI
async function fetchPokemonImages(ids) {
  const images = [];
  for (const id of ids) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await response.json();
    useShiny = getRareTrue(0.08);
    const imageUrl = useShiny
      ? data.sprites.front_shiny
      : data.sprites.front_default;
    images.push(imageUrl);
  }
  return images;
}

// Create a card element
function createCard(image, index) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.index = index;

  const front = document.createElement("div");
  front.classList.add("front");

  // Use an <img> tag instead of background-image
  const img = document.createElement("img");
  img.src = image;
  img.alt = "Pokemon";
  front.appendChild(img);

  const back = document.createElement("div");
  back.classList.add("back");

  card.appendChild(front);
  card.appendChild(back);
  card.addEventListener("click", flipCard);
  grid.appendChild(card);
}

// Flip a card
function flipCard() {
  if (lockBoard || this === firstCard || this.classList.contains("matched"))
    return;

  this.classList.add("flipped");

  // Show the front and hide the back
  this.querySelector(".front").style.display = "block";
  this.querySelector(".back").style.display = "none";

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  lockBoard = true;

  checkForMatch();
}

function resetBoard() {
  [firstCard, secondCard].forEach((card) => {
    if (card) {
      card.classList.remove("flipped");
      card.querySelector(".front").style.display = "none";
      card.querySelector(".back").style.display = "block";
    }
  });

  [firstCard, secondCard, lockBoard] = [null, null, false];
}

// Check if the two flipped cards match
function checkForMatch() {
  const isMatch =
    firstCard.querySelector(".front img").src ===
    secondCard.querySelector(".front img").src;

  if (isMatch) {
    matches++;

    // Play the match sound
    const matchSound = document.getElementById("matchSound");
    matchSound.currentTime = 0; // Reset the sound to the beginning
    matchSound.play();

    // Add the 'matched' class to the matched cards
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    if (matches === cards.length / 2) {
      stopTimer();
      showResult();
    }
  } else {
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetBoard();
    }, 1000);
  }
}

// Shuffle the array
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Timer functions
function startTimer() {
  if (gameStarted) return;
  gameStarted = true;
  startTime = Date.now();
  timer = setInterval(() => {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  gameStarted = false;
}

function showResult() {
  const time = timerDisplay.textContent;
  const timestamp = new Date().toLocaleString();

  resultDisplay.innerHTML = `
  <div id="result-container" class="result">
      <br>
    <label for="username">Enter your name:</label>
    <input type="text" id="username" placeholder="Your Name">
    <button onclick="saveResult()">Submit</button>
    <hr>

  </div>
`;
}

function saveResult() {
  const time = timerDisplay.textContent;
  const userName = document.getElementById("username").value;

  if (!userName) {
    alert("Please enter your name!");
    return;
  }

  const timestamp = new Date().toLocaleString();

  // Update result display with user's name and game completion info
  resultDisplay.innerHTML = `
      <div id="result-container" class="result">
        <img src="trophy.png" alt="Trophy">
        <p>Congratulations, ${userName}! <br> You completed the game in ${time} on ${difficultySelect.value} Difficulty.</p>
        <p>Timestamp: ${timestamp}</p>
            <br>

      </div>
    `;

  // Add the download button
  download.innerHTML = `<button class="downloadBtn" onclick="downloadResult()">Save as PNG</button>`;
}

function downloadResult() {
  const proofContainer = document.getElementById("proof");

  // Wait for the DOM to update
  setTimeout(() => {
    // Wait for all images to load
    const images = proofContainer.querySelectorAll("img");
    const imagePromises = Array.from(images).map(
      (img) =>
        new Promise((resolve, reject) => {
          if (img.complete && img.naturalWidth !== 0) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = reject; // Handle broken images
          }
        })
    );

    Promise.all(imagePromises)
      .then(() => {
        // Capture the screenshot after all images are loaded
        html2canvas(proofContainer, { useCORS: true }).then((canvas) => {
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "proof.png"; // Name of the downloaded file
          link.click();
        });
      })
      .catch((error) => {
        console.error("Error loading images:", error);
        alert("Failed to load images. Please try again.");
      });
  }, 100); // 100ms delay to allow DOM updates
}

// Start the game when the button is clicked
async function startClicked() {
  await initGame();
  startTimer();
}
startButton.addEventListener("click", startClicked);
