
import { FOOD_DB } from './modules/food-database.js';

// === State ===
let recipe = JSON.parse(localStorage.getItem('keto_recipe') || '[]');
let weeklyPlan = JSON.parse(localStorage.getItem('keto_weekly_plan') || '{}');
let recipes = JSON.parse(localStorage.getItem('keto_recipes') || "[]");

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const TIMES = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];

// Initialize weeklyPlan if empty
if (!weeklyPlan || Object.keys(weeklyPlan).length === 0) {
    weeklyPlan = {
        "Lunes": { "Desayuno": [], "Almuerzo": [], "Cena": [], "Snack": [] },
        "Martes": { "Desayuno": [], "Almuerzo": [], "Cena": [], "Snack": [] },
        "Miércoles": { "Desayuno": [], "Almuerzo": [], "Cena": [], "Snack": [] },
        "Jueves": { "Desayuno": [], "Almuerzo": [], "Cena": [], "Snack": [] },
        "Viernes": { "Desayuno": [], "Almuerzo": [], "Cena": [], "Snack": [] },
        "Sábado": { "Desayuno": [], "Almuerzo": [], "Cena": [], "Snack": [] },
        "Domingo": { "Desayuno": [], "Almuerzo": [], "Cena": [], "Snack": [] }
    };
    // localStorage.setItem('keto_weekly_plan', JSON.stringify(weeklyPlan));
}

// === DOM Helpers ===
const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') {
            n.className = v;
        } else if (k.startsWith('on') && typeof v === 'function') {
            n.addEventListener(k.slice(2), v);
        } else {
            n.setAttribute(k, v);
        }
    });
    children.forEach(c => {
        if (c instanceof Node) n.appendChild(c);
        else n.appendChild(document.createTextNode(String(c)));
    });
    return n;
};
const fmt = (x) => (Math.round((x + Number.EPSILON) * 100) / 100).toFixed(1);
const safeParse = (key, fallback) => {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return (v ?? fallback);
    } catch {
        return fallback;
    }
};
const setStatus = (text) => {
    const s = $("#status");
    if (!s) return;
    s.textContent = text;
    setTimeout(() => { s.textContent = "Listo"; }, 1200);
};

// === Core Logic ===

function renderDB() {
    const tbody = $("#dbTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    FOOD_DB.forEach(f => {
        const tr = el("tr", {},
            el("td", {}, f.name),
            el("td", { class: "right" }, fmt(f.fat_per_100g)),
            el("td", { class: "right" }, fmt(f.protein_per_100g)),
            el("td", { class: "right" }, fmt(f.netcarbs_per_100g)),
            el("td", { class: "right" }, fmt(f.kcal_per_100g))
        );
        tbody.appendChild(tr);
    });
    const sel = $("#foodSelect");
    if (sel) {
        sel.innerHTML = "";
        FOOD_DB.forEach((f, i) => {
            const o = el("option", { value: i }, f.name);
            sel.appendChild(o);
        });
    }
}

function renderRecipe() {
    const tbody = $("#recipeTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    recipe.forEach((row, i) => {
        const tr = el("tr", {},
            el("td", {}, row.name),
            el("td", { class: "right" },
                el("input", { type: "number", class: "edit-grams", value: fmt(row.grams), min: "0", onchange: (e) => updateGrams(i, e.target.value) })
            ),
            el("td", { class: "right" }, fmt(row.fat)),
            el("td", { class: "right" }, fmt(row.protein)),
            el("td", { class: "right" }, fmt(row.carbs)),
            el("td", { class: "right" }, fmt(row.kcal)),
            el("td", {},
                el("button", { class: "btn secondary", onclick: () => removeRow(i) }, "Eliminar")
            )
        );
        tbody.appendChild(tr);
    });
    computeTotals();
}

function updateGrams(index, newGrams) {
    newGrams = parseFloat(newGrams);
    if (newGrams <= 0) {
        removeRow(index);
        return;
    }
    const row = recipe[index];
    const f = FOOD_DB.find(food => food.name === row.name);
    if (f) {
        recipe[index] = {
            name: row.name,
            grams: newGrams,
            fat: f.fat_per_100g * newGrams / 100,
            protein: f.protein_per_100g * newGrams / 100,
            carbs: f.netcarbs_per_100g * newGrams / 100,
            kcal: f.kcal_per_100g * newGrams / 100
        };
        save();
        renderRecipe();
    }
}

function removeRow(i) {
    recipe.splice(i, 1);
    save();
    renderRecipe();
}

function save() {
    localStorage.setItem('keto_recipe', JSON.stringify(recipe));
    setStatus('Receta guardada');
}

function computeTotals() {
    const tot = recipe.reduce((acc, r) => {
        acc.g += Number(r.grams || 0);
        acc.f += Number(r.fat || 0);
        acc.p += Number(r.protein || 0);
        acc.c += Number(r.carbs || 0);
        acc.k += Number(r.kcal || 0);
        return acc;
    }, { g: 0, f: 0, p: 0, c: 0, k: 0 });

    if ($("#tot_g")) $("#tot_g").textContent = fmt(tot.g);
    if ($("#tot_f")) $("#tot_f").textContent = fmt(tot.f);
    if ($("#tot_p")) $("#tot_p").textContent = fmt(tot.p);
    if ($("#tot_c")) $("#tot_c").textContent = fmt(tot.c);
    if ($("#tot_kcal")) $("#tot_kcal").textContent = fmt(tot.k);
    if ($("#kcalBox")) $("#kcalBox").textContent = fmt(tot.k);

    const denom = (tot.p + tot.c);
    const ratio = denom > 0 ? (tot.f / denom) : 0;
    const badge = $("#ratioBadge");
    if (badge) {
        badge.textContent = fmt(ratio);
        badge.classList.remove("ratio-high", "ratio-ok", "ratio-low");
        let txt = "Objetivo 1.0–2.0";
        if (ratio >= 2.0) { badge.classList.add("ratio-high"); txt = "Alto (≥ 2.0)"; }
        else if (ratio >= 1.0) { badge.classList.add("ratio-ok"); txt = "Moderado (1.0–1.9)"; }
        else { badge.classList.add("ratio-low"); txt = "Bajo (< 1.0)"; }
        if ($("#ratioText")) $("#ratioText").textContent = txt;
    }

    const kcalF = tot.f * 9, kcalP = tot.p * 4, kcalC = tot.c * 4;
    const kcalTotal = kcalF + kcalP + kcalC;
    const pct = (k) => kcalTotal > 0 ? Math.round((k / kcalTotal) * 100) : 0;
    if ($("#pctF")) $("#pctF").textContent = pct(kcalF) + "%";
    if ($("#pctP")) $("#pctP").textContent = pct(kcalP) + "%";
    if ($("#pctC")) $("#pctC").textContent = pct(kcalC) + "%";
}

// === Weekly Plan Logic ===

function renderWeeklyPlan() {
    const years = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']; // Just ensuring local var matches standard
    const days = DAYS;
    const times = TIMES;
    days.forEach(day => {
        times.forEach(time => {
            const cell = document.querySelector(`#${day}-${time}`);
            if (!cell) return;
            cell.innerHTML = '';
            if (weeklyPlan[day] && weeklyPlan[day][time]) {
                const ul = el('ul', {});
                weeklyPlan[day][time].forEach((entry, i) => {
                    let displayText = entry.displayName || (entry.name ? `<strong>${entry.name}</strong>` : "[Receta sin nombre]");
                    const contentSpan = document.createElement('span');
                    contentSpan.innerHTML = displayText;

                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = '❌';
                    deleteBtn.style.marginLeft = '8px';
                    deleteBtn.className = 'btn danger';
                    deleteBtn.style.padding = '2px 6px';
                    deleteBtn.style.fontSize = '0.8em';
                    deleteBtn.addEventListener('click', () => removeFromWeeklyPlan(day, time, i));

                    const li = el('li', {}, contentSpan, deleteBtn);
                    ul.appendChild(li);
                });
                cell.appendChild(ul);
            }
        });

        const kcalCell = document.querySelector(`#${day}-Kcal`);
        if (kcalCell) {
            kcalCell.textContent = calculateDailyKcal(day);
        }
    });
}

function calculateDailyKcal(day) {
    const times = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];
    let totalKcal = 0;
    times.forEach(time => {
        if (weeklyPlan[day] && weeklyPlan[day][time]) {
            weeklyPlan[day][time].forEach((entry) => {
                if (entry.totals && entry.totals.kcal) {
                    totalKcal += entry.totals.kcal || 0;
                } else if (entry.recipe) {
                    // Fallback to summing ingredients if totals missing
                    totalKcal += entry.recipe.reduce((sum, ing) => sum + Number(ing.kcal) || 0, 0);
                }
            });
        }
    });
    return fmt(totalKcal);
}

function removeFromWeeklyPlan(day, time, index) {
    if (!weeklyPlan[day]?.[time]) return;
    weeklyPlan[day][time].splice(index, 1);
    if (weeklyPlan[day][time].length === 0) delete weeklyPlan[day][time];
    // Don't delete day key to keep structure valid
    saveWeeklyPlan();
    renderWeeklyPlan();
    renderShoppingList();
}

function saveWeeklyPlan() {
    localStorage.setItem('keto_weekly_plan', JSON.stringify(weeklyPlan));
    setStatus('Plan guardado');
}

function fixCorruptedWeeklyPlan() {
    let changed = false;
    Object.keys(weeklyPlan).forEach(day => {
        Object.keys(weeklyPlan[day] || {}).forEach(meal => {
            if (!Array.isArray(weeklyPlan[day][meal])) return;
            weeklyPlan[day][meal] = weeklyPlan[day][meal].map(r => {
                // Fix missing recipe array
                if (!r.recipe || !Array.isArray(r.recipe) || r.recipe.length === 0) {
                    if (r.totals) {
                        changed = true;
                        return {
                            ...r,
                            recipe: [{
                                name: r.name,
                                grams: 100,
                                fat: r.totals.fat || 0,
                                protein: r.totals.protein || 0,
                                carbs: r.totals.carbs || 0,
                                kcal: r.totals.kcal || 0
                            }]
                        };
                    }
                }
                // Fix all zeros
                const hasOnlyZeros = r.recipe?.every(ing =>
                    (ing.fat || 0) === 0 && (ing.protein || 0) === 0 && (ing.carbs || 0) === 0 && (ing.kcal || 0) === 0
                );
                if (hasOnlyZeros && r.totals) {
                    changed = true;
                    return {
                        ...r,
                        recipe: [{
                            name: r.name,
                            grams: 100,
                            fat: r.totals.fat || 0,
                            protein: r.totals.protein || 0,
                            carbs: r.totals.carbs || 0,
                            kcal: r.totals.kcal || 0
                        }]
                    };
                }
                return r;
            });
        });
    });

    if (changed) {
        saveWeeklyPlan();
        renderWeeklyPlan();
        renderShoppingList();
        console.log("🛠️ Se corrigieron recetas corruptas en weeklyPlan");
    }
}

function checkAndHandleExistingRecipes(day, timeOfDay) {
    if (!weeklyPlan[day]) weeklyPlan[day] = {};
    if (!weeklyPlan[day][timeOfDay]) {
        weeklyPlan[day][timeOfDay] = [];
    } else if (!Array.isArray(weeklyPlan[day][timeOfDay])) {
        weeklyPlan[day][timeOfDay] = [weeklyPlan[day][timeOfDay]];
    }

    const existingRecipes = weeklyPlan[day][timeOfDay];
    let proceedToAdd = true;
    let shouldReplace = false;

    if (existingRecipes && existingRecipes.length > 0) {
        let recipeNames = existingRecipes.map((r, index) => `${index + 1}. ${r.name}`).join('\n');
        const userChoice = prompt(
            `⚠️ Ya existe(n) ${existingRecipes.length} receta(s) en ${day} - ${timeOfDay}:\n${recipeNames}\n\n` +
            `¿Qué deseas hacer?\n` +
            `1. Añadir la nueva receta (manteniendo las existentes)\n` +
            `2. Reemplazar (eliminar las existentes y añadir la nueva)\n` +
            `3. Cancelar\n\n` +
            `Introduce 1, 2 o 3:`
        );

        if (userChoice === "2") {
            weeklyPlan[day][timeOfDay] = [];
            shouldReplace = true;
        } else if (userChoice === "3" || userChoice === null) {
            alert("Operación cancelada. No se añadió la receta.");
            proceedToAdd = false;
        }
    }

    return { proceedToAdd, shouldReplace };
}

function addToWeeklyPlan({ name, timeOfDay, recipe }) {
    const day = prompt('Introduce el día de la semana (Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo):');
    if (!['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].includes(day)) {
        alert('Día no válido. Usa: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo.');
        return;
    }

    const checkResult = checkAndHandleExistingRecipes(day, timeOfDay);
    if (!checkResult.proceedToAdd) {
        return;
    }

    const totals = recipe.reduce((acc, r) => ({
        fat: acc.fat + r.fat,
        protein: acc.protein + r.protein,
        carbs: acc.carbs + r.carbs,
        kcal: acc.kcal + r.kcal
    }), { fat: 0, protein: 0, carbs: 0, kcal: 0 });

    const fatPercentage = totals.kcal > 0 ? Math.round((totals.fat * 9 / totals.kcal) * 100) : 0;
    const proteinPercentage = totals.kcal > 0 ? Math.round((totals.protein * 4 / totals.kcal) * 100) : 0;
    const carbsPercentage = totals.kcal > 0 ? Math.round((totals.carbs * 4 / totals.kcal) * 100) : 0;
    const ketoRatio = (totals.protein + totals.carbs) > 0
        ? (totals.fat / (totals.protein + totals.carbs)).toFixed(1)
        : 0;

    const nutritionInfo = `<strong>${name} (${Math.round(totals.kcal)}Kcal : ${fatPercentage}%G:${proteinPercentage}%PT:${carbsPercentage}%HC: Ratio:${ketoRatio})</strong>`;
    const ingredientsStr = recipe.length > 0
        ? ` (${recipe.map(ing => `${ing.name} ${fmt(ing.grams)}gr`).join(', ')})`
        : '';

    const displayName = `${nutritionInfo}${ingredientsStr}`;

    weeklyPlan[day][timeOfDay].push({ name, displayName, recipe, totals });

    saveWeeklyPlan();
    renderWeeklyPlan();
    renderShoppingList();

    alert(`✅ Receta "${name}" añadida al ${day} - ${timeOfDay}`);

    const addToRecipes = confirm('Receta añadida al plan semanal. ¿Deseas añadirla directamente a la tabla de Recetas o editarla manualmente en el formulario? (OK = Añadir directamente, Cancelar = Editar manualmente)');
    if (addToRecipes) {
        // Check if recipes exists global
        if (typeof recipes === 'undefined') window.recipes = []; // Safety
        recipes.push({
            mealType: timeOfDay,
            name,
            fat: totals.fat,
            protein: totals.protein,
            carbs: totals.carbs,
            kcal: totals.kcal,
            ingredients: recipe.map(ing => `${ing.name} (${fmt(ing.grams)}g)`).join(', ')
        });
        saveRecipes();
        renderRecipes();
    } else {
        const addRecipeForm = document.querySelector("#addRecipeForm");
        if (addRecipeForm) {
            document.querySelector("#recipeName").value = name;
            document.querySelector("#mealType").value = timeOfDay;
            document.querySelector("#fatInput").value = fmt(totals.fat);
            document.querySelector("#proteinInput").value = fmt(totals.protein);
            document.querySelector("#carbsInput").value = fmt(totals.carbs);
            document.querySelector("#kcalInput").value = fmt(totals.kcal);
            document.querySelector("#ingredientsInput").value = recipe.map(ing => `${ing.name} (${fmt(ing.grams)}g)`).join(', ');
        }
    }
}

function generateShoppingList() {
    const map = {};
    Object.keys(weeklyPlan).forEach(day => {
        Object.keys(weeklyPlan[day] || {}).forEach(time => {
            if (Array.isArray(weeklyPlan[day][time])) {
                weeklyPlan[day][time].forEach(rec => {
                    (rec.recipe || []).forEach(ing => {
                        map[ing.name] = (map[ing.name] || 0) + Number(ing.grams || 0);
                    });
                });
            }
        });
    });
    return Object.entries(map)
        .map(([name, grams]) => ({ name, grams }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

function renderShoppingList() {
    const tbody = $("#shoppingListTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const shoppingList = generateShoppingList();
    shoppingList.forEach(item => {
        const tr = el("tr", {},
            el("td", {}, item.name),
            el("td", { class: "right" }, fmt(item.grams))
        );
        tbody.appendChild(tr);
    });
}

// === Recipes List / Accordion Logic ===

function saveRecipes() {
    localStorage.setItem('keto_recipes', JSON.stringify(recipes));
    setStatus('Recetas guardadas');
}

function sortRecipes() {
    recipes.sort((a, b) => {
        // Primero ordenar por mealType
        if (a.mealType < b.mealType) return -1;
        if (a.mealType > b.mealType) return 1;
        // Si el mealType es igual, ordenar por name
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });

    localStorage.setItem('keto_recipes', JSON.stringify(recipes));
    return recipes;
}

function renderRecipes() {
    const accordion = document.querySelector("#recipesAccordion");
    if (!accordion) {
        // console.error("Error: #recipesAccordion not found in the DOM");
        return;
    }
    accordion.innerHTML = '';

    const mealTypes = [
        'Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Snack Post-Entrenamiento',
        'Snack (Barritas)', 'Snack (Sanak 1)', 'Limpieza', 'Recetas'
    ];

    mealTypes.forEach(mealType => {
        const recipesForType = recipes.filter(r => r.mealType === mealType);
        if (recipesForType.length === 0) return;

        const tab = document.createElement('div');
        tab.className = 'accordion-tab';

        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.setAttribute('data-meal-type', mealType);
        header.textContent = mealType;
        tab.appendChild(header);

        const content = document.createElement('div');
        content.className = 'accordion-content';
        content.setAttribute('data-meal-type', mealType);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        thead.innerHTML = `
      <tr>
        <th>Tipo de Comida</th>
        <th>Nombre</th>
        <th>Grasas (g)</th>
        <th>Proteínas (g)</th>
        <th>Carbohidratos (g)</th>
        <th>Kcal</th>
        <th>Ingredientes</th>
      </tr>
    `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        recipesForType.forEach(recipe => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${recipe.mealType}</td>
        <td>${recipe.name}</td>
        <td class="right">${fmt(recipe.fat)}</td>
        <td class="right">${fmt(recipe.protein)}</td>
        <td class="right">${fmt(recipe.carbs)}</td>
        <td class="right">${fmt(recipe.kcal)}</td>
        <td>${recipe.ingredients}</td>
      `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        content.appendChild(table);
        tab.appendChild(content);
        accordion.appendChild(tab);
    });

    // Initialize accordion listeners
    initializeAccordion();

    // Note: addRecipeTableListeners is not explicitly called in original code, 
    // but listeners seem to be attached via global double click on accordion container now.
    // We keep the old function just in case.
    addRecipeTableListeners();
}

function initializeAccordion() {
    const headers = document.querySelectorAll('.accordion-header');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isActive = content.classList.contains('active');

            // Close all tabs
            document.querySelectorAll('.accordion-content').forEach(c => {
                c.classList.remove('active');
            });
            document.querySelectorAll('.accordion-header').forEach(h => {
                h.classList.remove('active');
            });

            // Toggle clicked tab
            if (!isActive) {
                content.classList.add('active');
                header.classList.add('active');
            }
        });
    });
}

function addRecipeTableListeners() {
    const tables = document.querySelectorAll("#recipesAccordion .accordion-content table");
    if (tables.length === 0) return;

    tables.forEach(table => {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row, index) => {
            // Logic for single click logging kept from original
            row.addEventListener('click', () => {
                // Optional: Highlight row?
                // console.log(`Row ${index} clicked:`, row.cells[1].textContent);
            });
        });
    });
}

function addRecipe(newRecipe) {
    // Verificar duplicados (por mealType + name)
    let exists = recipes.some(r =>
        r.mealType.toLowerCase() === newRecipe.mealType.toLowerCase() &&
        r.name.toLowerCase() === newRecipe.name.toLowerCase()
    );

    if (exists) {
        console.warn(`⚠️ La receta "${newRecipe.name}" en "${newRecipe.mealType}" ya existe. No se añadirá.`);
        return recipes; // no añadimos duplicados
    }

    // Añadir receta nueva
    recipes.push(newRecipe);
    saveRecipes();

    // Ordenar inmediatamente después de añadir
    return sortRecipes();
}

// === Nutrition Analysis Logic ===

function calculateDailyNutrition(day) {
    let totalFat = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalKcal = 0;

    const meals = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];
    meals.forEach(meal => {
        if (weeklyPlan[day] && weeklyPlan[day][meal]) {
            weeklyPlan[day][meal].forEach(recipe => {
                // Use totals if available for accuracy
                if (recipe.totals) {
                    totalFat += recipe.totals.fat || 0;
                    totalProtein += recipe.totals.protein || 0;
                    totalCarbs += recipe.totals.carbs || 0;
                    totalKcal += recipe.totals.kcal || 0;
                } else if (recipe.recipe) {
                    recipe.recipe.forEach(ingredient => {
                        totalFat += Number(ingredient.fat) || 0;
                        totalProtein += Number(ingredient.protein) || 0;
                        totalCarbs += Number(ingredient.carbs) || 0;
                        totalKcal += Number(ingredient.kcal) || 0;
                    });
                }
            });
        }
    });

    const ketoRatio = (totalProtein + totalCarbs) > 0
        ? totalFat / (totalProtein + totalCarbs)
        : 0;

    return {
        fat: totalFat,
        protein: totalProtein,
        carbs: totalCarbs,
        kcal: totalKcal,
        ketoRatio: ketoRatio
    };
}

function showDailyNutrition(event) {
    const dayCell = event.target.closest('td[data-day]');
    if (!dayCell) {
        // console.error('No se encontró el elemento td con atributo data-day');
        return;
    }

    let day = dayCell.getAttribute('data-day');
    if (!day) {
        // console.warn('data-day no definido, intentando obtener desde modalNutritionTitle');
        const title = document.getElementById('modalNutritionTitle').textContent;
        const match = title.match(/Información Nutricional del (\w+)/);
        day = match ? match[1] : null;
    }

    if (!day || !DAYS.includes(day)) {
        console.error('Día no válido:', day);
        alert('Error: No se pudo determinar el día para mostrar la información nutricional.');
        return;
    }

    const nutritionData = calculateDailyNutrition(day);

    if (nutritionData.kcal === 0) {
        alert(`No hay datos nutricionales para el ${day}`);
        return;
    }

    document.getElementById('modalNutritionTitle').textContent = `Información Nutricional del ${day}`;
    document.getElementById('dailyKetoRatio').textContent = nutritionData.ketoRatio.toFixed(2);

    // const totalGrams = nutritionData.fat + nutritionData.protein + nutritionData.carbs;
    const fatPercentage = nutritionData.kcal > 0 ? Math.round((nutritionData.fat * 9 / nutritionData.kcal) * 100) : 0;
    const proteinPercentage = nutritionData.kcal > 0 ? Math.round((nutritionData.protein * 4 / nutritionData.kcal) * 100) : 0;
    const carbsPercentage = nutritionData.kcal > 0 ? Math.round((nutritionData.carbs * 4 / nutritionData.kcal) * 100) : 0;

    generateNutritionAdvice(fatPercentage, proteinPercentage, carbsPercentage, nutritionData.ketoRatio, nutritionData, day);

    const modal = document.getElementById('dailyNutritionModal');
    modal.style.display = 'flex';

    setTimeout(() => {
        renderNutritionChart(nutritionData);
    }, 100);
}

function renderNutritionChart(nutritionData) {
    const canvas = document.getElementById('nutritionChart');
    if (!canvas) {
        console.error('Canvas element with id "nutritionChart" not found.');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get 2D context for canvas.');
        return;
    }

    // Verificar datos válidos
    const total = nutritionData.fat + nutritionData.protein + nutritionData.carbs;
    if (total === 0) {
        console.error('No valid nutrition data to display in chart.');
        return;
    }

    // Destruir gráfico anterior si existe
    if (window.nutritionChartInstance) {
        window.nutritionChartInstance.destroy();
    }

    // Crear nuevo gráfico
    window.nutritionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Grasas', 'Proteínas', 'Carbohidratos'],
            datasets: [{
                data: [nutritionData.fat, nutritionData.protein, nutritionData.carbs],
                backgroundColor: [
                    '#4CAF50', // Verde para grasas
                    '#2196F3', // Azul para proteínas
                    '#FF9800'  // Naranja para carbohidratos
                ],
                borderColor: [
                    '#388E3C',
                    '#1976D2',
                    '#F57C00'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#333',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

                            // Calcular kcal por macronutriente
                            let kcal = 0;
                            if (context.label === 'Grasas') {
                                kcal = value * 9;
                            } else if (context.label === 'Proteínas' || context.label === 'Carbohidratos') {
                                kcal = value * 4;
                            }

                            // Calcular % de kcal totales
                            const totalKcal = (nutritionData.fat * 9) + (nutritionData.protein * 4) + (nutritionData.carbs * 4);
                            const kcalPercentage = totalKcal > 0 ? Math.round((kcal / totalKcal) * 100) : 0;

                            return `${label}: ${value.toFixed(1)}g (${percentage}%) - ${kcal.toFixed(0)} kcal (${kcalPercentage}% Kcal)`;
                        }
                    }
                }
            }
        }
    });
}

function generateNutritionAdvice(fatPct, proteinPct, carbsPct, ketoRatio, nutritionData, day) {
    const adviceContainer = document.getElementById('adviceContent');
    if (!adviceContainer) return;
    adviceContainer.innerHTML = '';

    const dailyKcal = (nutritionData.fat * 9) + (nutritionData.protein * 4) + (nutritionData.carbs * 4);

    const idealFat = 70;
    const idealProtein = 25;
    const idealCarbs = 4;

    const currentDistrib = document.createElement('p');
    currentDistrib.innerHTML = `<strong>Distribución actual:</strong> ${fatPct}% Grasas, ${proteinPct}% Proteínas, ${carbsPct}% HC netos`;
    adviceContainer.appendChild(currentDistrib);

    const idealDistrib = document.createElement('p');
    idealDistrib.innerHTML = `<strong>Objetivo cetogénico:</strong> ${idealFat}% Grasas, ${idealProtein}% Proteínas, ${idealCarbs}% HC netos`;
    idealDistrib.style.marginBottom = '15px';
    adviceContainer.appendChild(idealDistrib);

    const adviceList = document.createElement('ul');
    adviceList.style.paddingLeft = '20px';

    // Consejo sobre grasas
    if (fatPct < idealFat - 5) {
        const advice = document.createElement('li');
        advice.innerHTML = `<strong>Grasas:</strong> Aumenta fuentes saludables como aguacate, aceite de oliva, frutos secos y pescados grasos. Las grasas son tu principal fuente de energía en cetosis.`;
        adviceList.appendChild(advice);
    } else if (fatPct > idealFat + 5) {
        const advice = document.createElement('li');
        advice.innerHTML = `<strong>Grasas:</strong> Considera moderar el exceso de grasas si buscas pérdida de peso. La cetosis se mantiene con grasas moderadas, no necesariamente altísimas.`;
        adviceList.appendChild(advice);
    }

    // Consejo sobre proteínas
    let maxProteinPct;
    if (carbsPct >= 4) maxProteinPct = 30;
    else if (carbsPct >= 3) maxProteinPct = 32;
    else if (carbsPct >= 2) maxProteinPct = 34;
    else if (carbsPct >= 1) maxProteinPct = 36;
    else maxProteinPct = 38;

    if (proteinPct < idealProtein - 5) {
        const advice = document.createElement('li');
        advice.innerHTML = `<strong>Proteínas:</strong> Aumenta proteínas magras como pollo, pescado, huevos y tofu (1.6-2.2 g/kg de peso corporal). La proteína preserva masa muscular durante la cetosis (Pasiakos et al., 2013). Máximo permitido: ${maxProteinPct}% para ${carbsPct.toFixed(1)}% HC.`;
        adviceList.appendChild(advice);
    } else if (proteinPct > maxProteinPct) {
        const advice = document.createElement('li');
        advice.innerHTML = `<strong>Proteínas:</strong> Excedes el máximo de ${maxProteinPct}% para ${carbsPct.toFixed(1)}% HC. El exceso puede convertirse en glucosa (gluconeogénesis), afectando la cetosis. Reduce las porciones.`;
        adviceList.appendChild(advice);
    } else if (proteinPct > idealProtein + 5) {
        const advice = document.createElement('li');
        advice.innerHTML = `<strong>Proteínas:</strong> Estás cerca del límite de ${maxProteinPct}% para ${carbsPct.toFixed(1)}% HC. Modera las porciones para optimizar cetosis.`;
        adviceList.appendChild(advice);
    }

    // Consejo sobre carbohidratos
    let carbAdviceText = '';
    if (carbsPct <= 4) {
        carbAdviceText = `<strong>Carbohidratos:</strong> Tu ingesta (${carbsPct.toFixed(1)}%) está en el rango cetogénico estricto (<20 g/día, <4% energía), ideal para cetosis profunda (Volek et al., 2008). Mantén este nivel para maximizar la quema de grasa.`;
    } else if (carbsPct <= 10) {
        carbAdviceText = `<strong>Carbohidratos:</strong> Tu ingesta (${carbsPct.toFixed(1)}%) está en el rango moderado (20-50 g/día, 4-10% energía). Ajusta a <20 g/día si buscas cetosis estricta, revisando vegetales ricos en almidón (Volek et al., 2008).`;
    } else if (carbsPct <= 20) {
        carbAdviceText = `<strong>Carbohidratos:</strong> Tu ingesta (${carbsPct.toFixed(1)}%) está en el rango liberal (50-100 g/día, 10-20% energía). Reduce a <20-50 g/día para cetosis efectiva, evitando frutas y carbohidratos refinados.`;
    } else {
        carbAdviceText = `<strong>Carbohidratos:</strong> Tu ingesta (${carbsPct.toFixed(1)}%) excede el rango cetogénico (>20%). Reduce a <20 g/día (<4% energía) para inducir cetosis, eliminando vegetales ricos en almidón y frutas (Volek et al., 2008).`;
    }
    const carbAdvice = document.createElement('li');
    carbAdvice.innerHTML = carbAdviceText;
    adviceList.appendChild(carbAdvice);

    // Consejo sobre ratio cetogénico
    const ratioAdvice = document.createElement('li');
    if (ketoRatio < 1.0) {
        ratioAdvice.innerHTML = `<strong>Ratio cetogénico (${ketoRatio.toFixed(1)}):</strong> Demasiado bajo. Necesitas aumentar grasas y/o reducir proteínas+HC para alcanzar cetosis nutricional.`;
    } else if (ketoRatio >= 1.0 && ketoRatio < 2.0) {
        ratioAdvice.innerHTML = `<strong>Ratio cetogénico (${ketoRatio.toFixed(1)}):</strong> Nivel moderado. Estás en cetosis pero podrías optimizarla aumentando ligeramente las grasas.`;
    } else {
        ratioAdvice.innerHTML = `<strong>Ratio cetogénico (${ketoRatio.toFixed(1)}):</strong> Excelente! Mantienes un ratio óptimo para cetosis terapéutica según estudios clínicos.`;
    }
    adviceList.appendChild(ratioAdvice);

    // Consejo sobre déficit calórico
    const calorieAdvice = document.createElement('li');
    calorieAdvice.innerHTML = `<strong>Déficit calórico:</strong> Tu ingesta total el ${day} es de <strong>${Math.round(dailyKcal)} kcal</strong>. Para pérdida de grasa, mantén un déficit moderado (10-20% de tu gasto energético diario).`;
    adviceList.appendChild(calorieAdvice);

    adviceContainer.appendChild(adviceList);

    const finalNote = document.createElement('p');
    finalNote.className = 'small muted';
    finalNote.style.marginTop = '15px';
    finalNote.innerHTML = '💡 <em>Estos consejos son generales. Consulta con un profesional de salud para recomendaciones personalizadas.</em>';
    adviceContainer.appendChild(finalNote);
}

// === Event Listeners & Initialization ===

// Helper for display name generation (used in import)
function generateDisplayNameStub(recipe) {
    // Simplified version or full version if needed. 
    // Since addToWeeklyPlan does it inline, we might just need this for import.
    let totals = recipe.totals || { fat: 0, protein: 0, carbs: 0, kcal: 0 };
    if (!recipe.totals && recipe.recipe) {
        totals = recipe.recipe.reduce((acc, r) => ({
            fat: acc.fat + (r.fat || 0),
            protein: acc.protein + (r.protein || 0),
            carbs: acc.carbs + (r.carbs || 0),
            kcal: acc.kcal + (r.kcal || 0)
        }), { fat: 0, protein: 0, carbs: 0, kcal: 0 });
    }

    const fatPercentage = totals.kcal > 0 ? Math.round((totals.fat * 9 / totals.kcal) * 100) : 0;
    const proteinPercentage = totals.kcal > 0 ? Math.round((totals.protein * 4 / totals.kcal) * 100) : 0;
    const carbsPercentage = totals.kcal > 0 ? Math.round((totals.carbs * 4 / totals.kcal) * 100) : 0;
    const ketoRatio = (totals.protein + totals.carbs) > 0 ? (totals.fat / (totals.protein + totals.carbs)).toFixed(1) : 0;

    const nutritionInfo = `<strong>${recipe.name} (${Math.round(totals.kcal)}Kcal : ${fatPercentage}%G:${proteinPercentage}%PT:${carbsPercentage}%HC: Ratio:${ketoRatio})</strong>`;
    const ingredientsStr = (recipe.recipe && recipe.recipe.length > 0) ? ` (${recipe.recipe.map(ing => `${ing.name} ${fmt(ing.grams)}gr`).join(', ')})` : '';
    return `${nutritionInfo}${ingredientsStr}`;
}

document.addEventListener('DOMContentLoaded', () => {
    renderDB();
    fixCorruptedWeeklyPlan();
    renderRecipe(); // Render builder table
    renderWeeklyPlan();
    renderShoppingList();

    if (typeof recipes !== 'undefined' && recipes.length > 0) {
        recipes = sortRecipes();
        renderRecipes();
    }

    // Double click on daily cells
    document.querySelectorAll('#weeklyPlanTable td[data-day]').forEach(cell => {
        cell.addEventListener('dblclick', showDailyNutrition);
    });

    // Food Modal
    $("#addFoodBtn")?.addEventListener("click", () => {
        const m = $("#addFoodModal"); if (m) { m.style.display = "flex"; $("#foodName").focus(); }
    });
    $("#cancelAddFoodBtn")?.addEventListener("click", () => {
        const m = $("#addFoodModal"); if (m) { m.style.display = "none"; $("#addFoodForm").reset(); }
    });
    $("#addFoodForm")?.addEventListener("submit", (event) => {
        event.preventDefault();
        try {
            const form = event.target;
            const newFood = {
                name: form.name.value.trim(),
                fat_per_100g: parseFloat(form.fat_per_100g.value),
                protein_per_100g: parseFloat(form.protein_per_100g.value),
                netcarbs_per_100g: parseFloat(form.netcarbs_per_100g.value),
                kcal_per_100g: parseFloat(form.kcal_per_100g.value)
            };
            if (!newFood.name) throw new Error("Nombre obligatorio.");
            if (FOOD_DB.some(f => f.name.toLowerCase() === newFood.name.toLowerCase())) throw new Error("Ya existe.");

            FOOD_DB.push(newFood);
            renderDB();
            form.reset();
            $("#addFoodModal").style.display = "none";
            alert("Alimento añadido.");
        } catch (e) { alert(e.message); }
    });

    // Export Weekly Plan
    $("#exportWeeklyPlanBtn")?.addEventListener('click', async () => {
        const fileName = `plan_semanal_keto_${new Date().toISOString().split('T')[0]}.json`;
        const data = JSON.stringify(weeklyPlan, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    });

    // Import Weekly Plan
    $("#importtWeeklyPlanBtn")?.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    if (!confirm("¿Sobreescribir plan actual?")) return;
                    weeklyPlan = imported;
                    saveWeeklyPlan();
                    renderWeeklyPlan();
                    renderShoppingList();
                    alert("Importado.");
                } catch (err) { alert("Error al importar: " + err.message); }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // Clear Plan
    $("#vaciarWeeklyPlanBtn")?.addEventListener("click", () => {
        if (confirm("¿Borrar todo el plan semanal?")) {
            Object.keys(weeklyPlan).forEach(k => { weeklyPlan[k] = { "Desayuno": [], "Almuerzo": [], "Cena": [], "Snack": [] }; });
            saveWeeklyPlan();
            renderWeeklyPlan();
            renderShoppingList();
        }
    });

    // Export Shopping List
    $("#exportShoppingListBtn")?.addEventListener('click', () => {
        const list = generateShoppingList();
        const fileName = `lista_compra_${new Date().toISOString().split('T')[0]}.json`;
        const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
    });

    // Print buttons (Simplified window.open approach as per original)
    $("#printtShoppingListBtn")?.addEventListener("click", () => {
        const table = $("#shoppingListTable");
        if (table) {
            const win = window.open('', '_blank');
            win.document.write(`<html><head><title>Lista Compra</title></head><body>${table.outerHTML}</body></html>`);
            win.print();
        }
    });

    $("#printFoodBtn")?.addEventListener("click", () => {
        const table = $("#dbTable");
        if (table) {
            const win = window.open('', '_blank');
            win.document.write(`<html><head><title>Base de Datos</title></head><body>${table.outerHTML}</body></html>`);
            win.print();
        }
    });

    // Export Recipes
    $("#exportRecipesBtn")?.addEventListener('click', () => {
        const fileName = `recetas_keto_${new Date().toISOString().split('T')[0]}.json`;
        const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
    });

    // Import Recipes
    $("#importRecipesFile")?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (Array.isArray(imported)) {
                    recipes = imported;
                    saveRecipes();
                    renderRecipes();
                    alert("Recetas importadas.");
                }
            } catch (err) { alert("Error: " + err.message); }
        };
        reader.readAsText(file);
    });

    // Add Recipe Form
    $("#addRecipeForm")?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $("#recipeName").value;
        const mealType = $("#mealType").value;
        const fat = parseFloat($("#fatInput").value);
        const protein = parseFloat($("#proteinInput").value);
        const carbs = parseFloat($("#carbsInput").value);
        const kcal = parseFloat($("#kcalInput").value);
        const ingredients = $("#ingredientsInput").value;

        if (name && !isNaN(fat)) {
            addRecipe({ name, mealType, fat, protein, carbs, kcal, ingredients });
            e.target.reset();
            renderRecipes();
        }
    });
    $("#clearRecipeForm")?.addEventListener('click', () => $("#addRecipeForm").reset());

    // Nutrition Modal Close
    $("#closeNutritionModal")?.addEventListener('click', () => {
        $("#dailyNutritionModal").style.display = 'none';
    });
    $("#dailyNutritionModal")?.addEventListener('click', (e) => {
        if (e.target === $("#dailyNutritionModal")) $("#dailyNutritionModal").style.display = 'none';
    });

});

// Accordion Double Click Logic (Global)
const accordion = document.querySelector('#recipesAccordion');
if (accordion) {
    accordion.addEventListener('dblclick', (ev) => {
        const row = ev.target.closest('tbody tr');
        if (!row) return;
        const mealType = row.cells[0].textContent;
        const name = row.cells[1].textContent;
        const fat = parseFloat(row.cells[2].textContent);
        const protein = parseFloat(row.cells[3].textContent);
        const carbs = parseFloat(row.cells[4].textContent);
        const kcal = parseFloat(row.cells[5].textContent);

        // Construct pseudo-recipe
        const recipeData = [{ name, grams: 100, fat, protein, carbs, kcal }];

        // Call addToWeeklyPlan logic directly or reusing function? 
        // addToWeeklyPlan function expects { name, timeOfDay, recipe }
        // We know 'mealType' from the row, but usually user wants to choose day AND time.
        // Original code prompted for Day but assumed 'mealType' from row matched destination or prompted?
        // Original code (3600) prompted for Day. And used `mealType` from row as destination.

        const day = prompt('¿En qué día de la semana quieres colocarla?\nLunes...Domingo:');
        if (!day || !DAYS.includes(day)) return;

        // Check for existing... (Calling global function from Part 2)
        const check = checkAndHandleExistingRecipes(day, mealType);
        if (!check.proceedToAdd) return;

        // Add
        weeklyPlan[day][mealType].push({
            name,
            displayName: generateDisplayNameStub({ name, recipe: recipeData, totals: { fat, protein, carbs, kcal } }),
            recipe: recipeData,
            totals: { fat, protein, carbs, kcal }
        });
        saveWeeklyPlan();
        renderWeeklyPlan();
        renderShoppingList();
        alert(`Añadido a ${day} - ${mealType}`);
    });
}
