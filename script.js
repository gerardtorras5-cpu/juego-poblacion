/* -----------------------------------------
   LISTA DE PAÍSES (EDITABLE POR GERARD)
----------------------------------------- */

const countries = [
    { name: "España", population: 48000000 },
    { name: "Francia", population: 67000000 },
    { name: "Italia", population: 59000000 }
    // Añade aquí los países que quieras
];

/* -----------------------------------------
   FIREBASE
----------------------------------------- */

const firebaseConfig = {
  apiKey: "AIzaSyAqJNHxxOV-6t48hoF-whix1Vb-dYOPpOs",
  authDomain: "juego-poblacion.firebaseapp.com",
  databaseURL: "https://juego-poblacion-default-rtdb.firebaseio.com",
  projectId: "juego-poblacion",
  storageBucket: "juego-poblacion.firebasestorage.app",
  messagingSenderId: "85902178536",
  appId: "1:85902178536:web:b434b6bb2f9d4e19b1b15d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* -----------------------------------------
   VARIABLES DEL JUEGO
----------------------------------------- */

let playerName = "";
let xp = 0;
let lives = 3;
let currentCountry = null;

/* -----------------------------------------
   CAMBIO DE PANTALLAS
----------------------------------------- */

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

/* -----------------------------------------
   INICIO DEL JUEGO
----------------------------------------- */

function startGame() {
    const nameInput = document.getElementById("playerNameInput").value.trim();
    if (nameInput === "") return alert("Introduce un nombre");

    playerName = nameInput;

    // Cargar XP si ya existe
    db.ref("players/" + playerName).once("value", snap => {
        if (snap.exists()) xp = snap.val().xp;
        updateXPDisplay();
        updateLevelBar();
    });

    lives = 3;
    nextCountry();
    showScreen("game-screen");
}

/* -----------------------------------------
   MOSTRAR PAÍS
----------------------------------------- */

function nextCountry() {
    currentCountry = countries[Math.floor(Math.random() * countries.length)];
    document.getElementById("country-name").textContent = currentCountry.name;
    document.getElementById("populationInput").value = "";
    document.getElementById("round-result").textContent = "";
}

/* -----------------------------------------
   CALCULAR XP SEGÚN ERROR
----------------------------------------- */

function calculateXP(real, answer) {
    const error = Math.abs(real - answer) / real;

    if (error === 0) return 1000;
    if (error <= 0.01) return 800;
    if (error <= 0.03) return 500;
    if (error <= 0.05) return 300;

    lives--;
    return 100;
}

/* -----------------------------------------
   ENVIAR RESPUESTA
----------------------------------------- */

function submitAnswer() {
    const answer = Number(document.getElementById("populationInput").value);
    if (!answer) return;

    const gained = calculateXP(currentCountry.population, answer);
    xp += gained;

    updateXPDisplay();
    updateLevelBar();

    document.getElementById("round-result").textContent =
        `Has ganado ${gained} XP`;

    if (lives <= 0) return gameOver();

    nextCountry();
}

/* -----------------------------------------
   GAME OVER
----------------------------------------- */

function gameOver() {
    xp -= 200;
    if (xp < 0) xp = 0;

    saveXP();

    document.getElementById("final-xp").textContent = `XP total: ${xp}`;
    document.getElementById("final-level").textContent = `Nivel: ${getLevel()}`;

    showScreen("gameover-screen");
}

/* -----------------------------------------
   REINICIAR PARTIDA
----------------------------------------- */

function restartGame() {
    lives = 3;
    nextCountry();
    showScreen("game-screen");
}

/* -----------------------------------------
   VOLVER AL MENÚ
----------------------------------------- */

function goToMenu() {
    showScreen("start-screen");
}

/* -----------------------------------------
   XP + NIVELES
----------------------------------------- */

function getLevel() {
    let level = 1;
    let required = 1000;

    while (xp >= required) {
        level++;
        required += 2000 + (level * 1000);
    }

    return level;
}

function updateXPDisplay() {
    document.getElementById("xp").textContent = `XP: ${xp}`;
}

function updateLevelBar() {
    const level = getLevel();
    const prevXP = level === 1 ? 0 : 1000 + (level - 2) * 3000;
    const nextXP = 1000 + (level - 1) * 3000;

    const progress = ((xp - prevXP) / (nextXP - prevXP)) * 100;

    document.getElementById("level-text").textContent = `Nivel ${level}`;
    document.getElementById("level-progress").style.width = progress + "%";
}

/* -----------------------------------------
   GUARDAR XP EN FIREBASE
----------------------------------------- */

function saveXP() {
    db.ref("players/" + playerName).set({
        xp: xp,
        level: getLevel(),
        updated: Date.now()
    });
}

/* -----------------------------------------
   RANKING GLOBAL
----------------------------------------- */

function showRanking() {
    const tbody = document.querySelector("#ranking-table tbody");
    tbody.innerHTML = "";

    db.ref("players").orderByChild("xp").once("value", snap => {
        const players = [];

        snap.forEach(child => {
            players.push({
                name: child.key,
                xp: child.val().xp,
                level: child.val().level
            });
        });

        players.reverse().forEach(p => {
            const row = `<tr>
                <td>${p.name}</td>
                <td>${p.level}</td>
                <td>${p.xp}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    });

    showScreen("ranking-screen");
}