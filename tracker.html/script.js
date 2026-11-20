const TAREAS = [
  "Leer 10 páginas",
  "Estudiar",
  "Trabajar en proyectos",
  "Andar",
  "Menos de 3 h con el móvil",
  "Ayudar en casa",
  "Hacer ejercicio"
];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const KEY = "tracker-objetivos";

// ---------- Datos guardados en el navegador ----------
// datos = { meses: { "2026-11": { "1": [true,false,...], "2": [...] } }, notas: "..." }
function cargar() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { meses: {}, notas: "" }; }
  catch { return { meses: {}, notas: "" }; }
}
function guardar() { localStorage.setItem(KEY, JSON.stringify(datos)); }
let datos = cargar();

// ---------- Fecha y mes actual ----------
const hoy = new Date();
const año = hoy.getFullYear();
const mes = hoy.getMonth();
const diaHoy = hoy.getDate();
const clave = (a, m) => `${a}-${String(m + 1).padStart(2, "0")}`;
const claveActual = clave(año, mes);
const diasDelMes = (a, m) => new Date(a, m + 1, 0).getDate();

// Tareas hechas cada día de un mes (array con un número por día)
function conteos(k, dias) {
  const m = datos.meses[k] || {};
  return Array.from({ length: dias }, (_, i) => (m[i + 1] || []).filter(Boolean).length);
}

// ---------- Checklist ----------
function pintarTabla() {
  const dias = diasDelMes(año, mes);
  const m = datos.meses[claveActual] || {};
  let h = "<tr><th>Tarea</th>";
  for (let d = 1; d <= dias; d++) h += `<th class="${d === diaHoy ? "hoy" : ""}">${d}</th>`;
  h += "</tr>";
  TAREAS.forEach((t, ti) => {
    h += `<tr><td>${t}</td>`;
    for (let d = 1; d <= dias; d++) {
      const marcado = (m[d] || [])[ti] ? "checked" : "";
      const futuro = d > diaHoy ? "disabled" : "";
      h += `<td class="${d === diaHoy ? "hoy" : ""}"><input type="checkbox" data-d="${d}" data-t="${ti}" ${marcado} ${futuro} aria-label="${t}, día ${d}"></td>`;
    }
    h += "</tr>";
  });
  document.getElementById("tabla").innerHTML = h;
}

document.getElementById("tabla").addEventListener("change", e => {
  const c = e.target;
  if (c.type !== "checkbox") return;
  const d = c.dataset.d, t = Number(c.dataset.t);
  datos.meses[claveActual] = datos.meses[claveActual] || {};
  const dia = datos.meses[claveActual][d] || TAREAS.map(() => false);
  dia[t] = c.checked;
  datos.meses[claveActual][d] = dia;
  guardar();
  pintarGrafico();
});

// ---------- Gráfico (dibujado a mano, sin librerías) ----------
function dibujar(canvas, valores, dias, hasta) {
  const c = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const p = { l: 36, r: 16, t: 16, b: 30 };
  const w = W - p.l - p.r, h = H - p.t - p.b, max = TAREAS.length;
  const x = i => p.l + (dias === 1 ? 0 : i * w / (dias - 1));
  const y = v => p.t + h - v * h / max;

  c.clearRect(0, 0, W, H);
  c.font = "13px Manrope, system-ui, sans-serif";
  c.lineWidth = 1;
  for (let v = 0; v <= max; v++) {
    c.strokeStyle = "#262626";
    c.beginPath(); c.moveTo(p.l, y(v)); c.lineTo(W - p.r, y(v)); c.stroke();
    c.fillStyle = "#8c8c8c";
    c.fillText(v, 12, y(v) + 4);
  }
  for (let i = 0; i < dias; i += 2) c.fillText(i + 1, x(i) - 4, H - 8);

  if (hasta < 1) return;
  c.strokeStyle = "#8ab4ff";
  c.lineWidth = 2.5;
  c.beginPath();
  for (let i = 0; i < hasta; i++) i ? c.lineTo(x(i), y(valores[i])) : c.moveTo(x(i), y(valores[i]));
  c.stroke();
  c.fillStyle = "#8ab4ff";
  for (let i = 0; i < hasta; i++) { c.beginPath(); c.arc(x(i), y(valores[i]), 3.5, 0, Math.PI * 2); c.fill(); }
}

function textoResumen(valores, dias, hasta) {
  const hechas = valores.slice(0, hasta).reduce((a, b) => a + b, 0);
  const posibles = hasta * TAREAS.length;
  const pct = posibles ? Math.round(hechas / posibles * 100) : 0;
  return `${hechas} de ${posibles} tareas hechas (${pct}%)`;
}

function pintarGrafico() {
  const dias = diasDelMes(año, mes);
  const v = conteos(claveActual, dias);
  dibujar(document.getElementById("grafico"), v, dias, diaHoy);
  document.getElementById("resumen").textContent = textoResumen(v, dias, diaHoy);
}

// ---------- Meses pasados ----------
function pintarPasados() {
  const cont = document.getElementById("listaPasados");
  const claves = Object.keys(datos.meses).filter(k => k !== claveActual).sort().reverse();
  if (!claves.length) {
    cont.innerHTML = '<p class="vacio">Todavía no hay meses anteriores. Aparecerán aquí cuando cambie el mes.</p>';
    return;
  }
  cont.innerHTML = "";
  claves.forEach(k => {
    const [a, m] = k.split("-").map(Number);
    const dias = diasDelMes(a, m - 1);
    const v = conteos(k, dias);
    const div = document.createElement("div");
    div.className = "mes-pasado";
    div.innerHTML = `<h3>${MESES[m - 1]} ${a}</h3><canvas width="900" height="260"></canvas><p class="resumen">${textoResumen(v, dias, dias)}</p>`;
    cont.appendChild(div);
    dibujar(div.querySelector("canvas"), v, dias, dias);
  });
}

document.getElementById("btnPasados").addEventListener("click", e => {
  const sec = document.getElementById("pasados");
  sec.hidden = !sec.hidden;
  e.target.textContent = sec.hidden ? "Ver meses pasados" : "Ocultar meses pasados";
  if (!sec.hidden) pintarPasados();
});

// ---------- Notas ----------
const notas = document.getElementById("notas");
notas.value = datos.notas || "";
notas.addEventListener("input", () => { datos.notas = notas.value; guardar(); });

// ---------- Inicio ----------
document.getElementById("titulo").textContent = `${MESES[mes]} ${año}`;
pintarTabla();
pintarGrafico();