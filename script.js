
/* -----------------------------------------
   LISTA DE PAÍSES (EDITABLE)
----------------------------------------- */

const countries = [
    { name: "España", population: 48000000 },
    { name: "Francia", population: 67000000 },
    { name: "Italia", population: 59000000 },
    { name: "Afganistán", population: 45000000 },
    { name: "Åland", population: 30000 },
    { name: "Albania", population: 2700000 },
    { name: "Alemania", population: 84000000 },
    { name: "Andorra", population: 89000 },
    { name: "Angola", population: 37000000 },
    { name: "Anguila", population: 15000 },
    { name: "Antigua y Barbuda", population: 97000 },
    { name: "Arabia Saudita", population: 35000000 },
    { name: "Argelia", population: 48000000 },
    { name: "Argentina", population: 46000000 },
    { name: "Armenia", population: 3000000 },
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
   AUTOLOGIN
----------------------------------------- */

window.onload = () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
        const data = JSON.parse(savedUser);
        playerName = data.name;
        xp = data.xp;
        document.getElementById("logoutBtn").style.display = "block";
        startGame();
    }
};

/* -----------------------------------------
   LOGIN / REGISTRO
----------------------------------------- */

function login() {
    const name = document.getElementById("playerNameInput").value.trim();
    const pass = document.getElementById("passwordInput").value.trim();

    if (!name || !pass) return alert("Introduce nombre y contraseña");

    const hashed = CryptoJS.SHA256(pass).toString();

    db.ref("players/" + name).once("value", snap => {
        if (!snap.exists()) {
            db.ref("players/" + name).set({
                password: hashed,
                xp: 0,
                level: 1
            });

            playerName = name;
            xp = 0;

            saveLocal();
            document.getElementById("logoutBtn").style.display = "block";
            startGame();
        } else {
            const data = snap.val();

            if (data.password !== hashed) {
                return alert("Contraseña incorrecta");
            }

            playerName = name;
            xp = data.xp || 0;

            saveLocal();
            document.getElementById("logoutBtn").style.display = "block";
            startGame();
        }
    });
}

function saveLocal() {
    localStorage.setItem("user", JSON.stringify({
        name: playerName,
        xp: xp
    }));
}

function logout() {
    localStorage.removeItem("user");
    location.reload();
}

/* -----------------------------------------
   INICIO DEL JUEGO
----------------------------------------- */

function startGame() {
    lives = 3;
    updateLivesDisplay();
    updateXPDisplay();
    updateLevelText();
    nextCountry();
    showScreen("game-screen");
    updateProgressBar();
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
   XP PROPORCIONAL
----------------------------------------- */

function calculateXP(real, answer) {
    const error = Math.abs(real - answer) / real;

    if (error > 0.05) {
        lives--;
        return 100;
    }

    const xpGain = 100 + (900 * (1 - (error / 0.05)));
    return Math.round(xpGain);
}

/* -----------------------------------------
   VIDAS VISUALES
----------------------------------------- */

function updateLivesDisplay() {
    document.getElementById("lives").textContent = "❤️".repeat(lives);
}

/* -----------------------------------------
   NOTIFICACIÓN DE SUBIDA DE NIVEL
----------------------------------------- */

function showLevelUp(level) {
    const box = document.getElementById("level-up-notification");
    box.textContent = `¡Nivel ${level}!`;
    box.style.display = "block";

    setTimeout(() => {
        box.style.display = "none";
    }, 2000);
}

/* -----------------------------------------
   ENVIAR RESPUESTA
----------------------------------------- */

function submitAnswer() {
    let answer = Number(document.getElementById("populationInput").value);

    if (isNaN(answer) || answer <= 0) {
        alert("Introduce un número válido");
        return;
    }

    answer = answer * 1_000_000;

    const error = Math.abs(currentCountry.population - answer) / currentCountry.population;
    const errorPercent = (error * 100).toFixed(2);

    const oldLevel = getLevel();

    const gained = calculateXP(currentCountry.population, answer);
    xp += gained;

    saveLocal();
    updateXPDisplay();
    updateLivesDisplay();

    const newLevel = getLevel();
    if (newLevel > oldLevel) {
        showLevelUp(newLevel);
    }
    updateLevelText();

    document.getElementById("round-result").textContent =
        `Has fallado un ${errorPercent}% y has ganado ${gained} XP`;

    if (lives <= 0) {
        setTimeout(() => gameOver(), 1500);
        return;
    }

    setTimeout(() => {
        nextCountry();
    }, 1500);
    const resultElement = document.getElementById("round-result");

if (error <= 0.05) {
    resultElement.style.color = "#4caf50"; // Verde si acierta
    resultElement.textContent = `¡Excelente! Error de solo ${errorPercent}% (+${gained} XP)`;
} else {
    resultElement.style.color = "#f44336"; // Rojo si falla
    resultElement.textContent = `¡Casi! Error del ${errorPercent}%. Pierdes una vida.`;
}
}

/* -----------------------------------------
   GAME OVER
----------------------------------------- */

function gameOver() {
    xp -= 500;
    if (xp < 0) xp = 0;

    saveXP();
    saveLocal();

    document.getElementById("final-xp").textContent = `XP total: ${xp}`;
    document.getElementById("final-level").textContent = `Nivel: ${getLevel()}`;

    showScreen("gameover-screen");
}

/* -----------------------------------------
   REINICIAR PARTIDA
----------------------------------------- */

function restartGame() {
    lives = 3;
    updateLivesDisplay();
    nextCountry();
    showScreen("game-screen");
}

/* -----------------------------------------
   VOLVER AL MENÚ
----------------------------------------- */

function goToMenu() {
    saveXP();
    saveLocal();

    // Mostrar notificación
    const box = document.getElementById("save-notification");
    box.style.display = "block";

    setTimeout(() => {
        box.style.display = "none";
    }, 2000);

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
    updateProgressBar();
}

function updateLevelText() {
    document.getElementById("level-text").textContent = `Nivel ${getLevel()}`;
}

/* -----------------------------------------
   GUARDAR XP EN FIREBASE
----------------------------------------- */

function saveXP() {
    db.ref("players/" + playerName).update({
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
function updateProgressBar() {
    let currentLevelXP = 0;
    let nextLevelThreshold = 1000;
    let level = 1;

    // Calculamos los umbrales del nivel actual
    while (xp >= nextLevelThreshold) {
        currentLevelXP = nextLevelThreshold;
        level++;
        nextLevelThreshold += 2000 + (level * 1000);
    }

    const xpInThisLevel = xp - currentLevelXP;
    const totalRequiredInLevel = nextLevelThreshold - currentLevelXP;
    
    // Calculamos el porcentaje
    let percentage = (xpInThisLevel / totalRequiredInLevel) * 100;
    
    // Limitar entre 0 y 100 por seguridad
    percentage = Math.max(0, Math.min(100, percentage));

    // Aplicar al DOM
    const bar = document.getElementById("progress-bar");
    if (bar) {
        bar.style.width = percentage + "%";
    }
}