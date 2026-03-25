const countries = [
  { name: "Argentina", population: 46 },
  { name: "Estados Unidos", population: 346 },
  { name: "España", population: 48 },
  { name: "Francia", population: 68 },
  { name: "Brasil", population: 203 },
  { name: "México", population: 129 }
];

const TOLERANCE = 0.05;
let current = null;
let totalXP = 0;

// Cargar XP desde localStorage
function loadXP() {
  const saved = localStorage.getItem("xp");
  totalXP = saved ? parseInt(saved) : 0;
  document.getElementById("xp-total").textContent = totalXP;
}

// Guardar XP
function saveXP() {
  localStorage.setItem("xp", totalXP);
}

function pickRandomCountry() {
  current = countries[Math.floor(Math.random() * countries.length)];
  document.getElementById("country-name").textContent = current.name;
  document.getElementById("result").style.display = "none";
  document.getElementById("answer").value = "";
}

function checkAnswer() {
  const input = parseFloat(document.getElementById("answer").value);
  const result = document.getElementById("result");

  if (isNaN(input)) {
    result.textContent = "Introduce un número válido.";
    result.style.background = "#7f1d1d";
    result.style.color = "#fecaca";
    result.style.display = "block";
    return;
  }

  const real = current.population;
  const errorPercent = Math.abs((input - real) / real) * 100;

  let xp = Math.max(0, 100 - errorPercent * 10);
  xp = Math.round(xp);

  totalXP += xp;
  saveXP();

  document.getElementById("xp-total").textContent = totalXP;

  if (errorPercent <= 5) {
    result.style.background = "#14532d";
    result.style.color = "#bbf7d0";
    result.textContent =
      `✔️ ¡Correcto!\n${current.name} tiene ${real} millones.\nError: ${errorPercent.toFixed(1)}%.\nGanaste ${xp} XP.`;
  } else {
    result.style.background = "#7f1d1d";
    result.style.color = "#fecaca";
    result.textContent =
      `❌ Incorrecto.\nPoblación real: ${real} millones.\nTu respuesta: ${input}.\nError: ${errorPercent.toFixed(1)}%.\nGanaste ${xp} XP.`;
  }

  result.style.display = "block";
}

document.getElementById("check").onclick = checkAnswer;
document.getElementById("new").onclick = pickRandomCountry;

loadXP();
pickRandomCountry();
