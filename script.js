/* -----------------------------------------
   LISTA DE PAÍSES (EDITABLE)
----------------------------------------- */

const countries = [
    { name: "España", population: 48000000 },
    { name: "Francia", population: 67000000 },
    { name: "Italia", population: 59000000 }
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
            // REGISTRO
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
            // LOGIN
            const data = snap.val();

            if (data.password !== hashed) {
                return alert("Contraseña incorrecta");
            }

            playerName = name;
            xp = data.xp;

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
    updateLevelBar();
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
   XP PROPORCIONAL
----------------------------------------- */

function calculateXP(real, answer) {
    const error = Math.abs(real - answer) / real;

    // Si el error es mayor al 5% → pierdes vida
    if (error > 0.05) {
        lives--;
        return 100;
    }

    // XP proporcional entre 100 y 1000
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
   ENVIAR RESPUESTA (CON PORCENTAJE + RETRASO)
----------------------------------------- */

function submitAnswer() {
    let answer = Number(document.getElementById("populationInput").value);

    // Validación correcta del input
    if (isNaN(answer) || answer <= 0) {
        alert("Introduce un número válido");
        return;
    }

    // Convertir millones a unidades
    answer = answer * 1_000_000;

    // Calcular error
    const error = Math.abs(currentCountry.population - answer) / currentCountry.population;
    const errorPercent = (error * 100).toFixed(2);

    // Calcular XP
    const gained = calculateXP(currentCountry.population, answer);
    xp += gained;

    saveLocal();
    updateXPDisplay();
    updateLevelBar();
    updateLivesDisplay();

    // Mostrar resultado antes de pasar al siguiente país
    document.getElementById("round-result").textContent =
        `Has fallado un ${errorPercent}% y has ganado ${gained} XP`;

    // Si te quedas sin vidas → Game Over
    if (lives <= 0) {
        setTimeout(() => gameOver(), 1500);
        return;
    }

    // Esperar 1.5 segundos antes de cambiar de país
    setTimeout(() => {
        nextCountry();
    }, 1500);
}

/* -----------------------------------------
   GAME OVER
----------------------------------------- */

function gameOver() {
    xp -= 200;
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