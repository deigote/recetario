'use strict';
const app = document.querySelector('#app');
let data;
let searchQuery = '';
// Ajustes por ración, solo en memoria: recargar recupera el JSON original.
const recipeEdits = new Map();
const baseAmount = ingredient => ingredient.unit === 'ml' ? ingredient.quantity : ingredient.grams;
const amountUnit = ingredient => ingredient.unit === 'ml' ? 'ml' : 'g';
const normalizeTitle = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = n => new Intl.NumberFormat('es', {maximumFractionDigits:2}).format(n);
function ingredientNutrition(ingredient, amount) {
  const food = data.foods[ingredient.food];
  const values = amountUnit(ingredient) === 'ml' ? food.per100ml : food.per100g;
  const keys = ['kcal', 'protein', 'carbs', 'fat'];
  if (!Number.isFinite(amount) || !values || keys.some(key => !Number.isFinite(values[key]))) return null;
  return Object.fromEntries([...keys, 'polyols'].map(key => [key, (values[key] ?? 0) * amount / 100]));
}
function nutritionPerServing(recipe, amounts) {
  const total = {kcal:0, protein:0, carbs:0, fat:0, polyols:0, missing:[]};
  let included = 0;
  recipe.ingredients.forEach((ingredient, index) => {
    const values = ingredientNutrition(ingredient, amounts[index]);
    if (!values) {total.missing.push(data.foods[ingredient.food].name); return;}
    for (const key of ['kcal', 'protein', 'carbs', 'fat', 'polyols']) total[key] += values[key];
    included++;
  });
  return included ? total : null;
}
function servingText(text, recipe, amounts) {
  return text.replace(/\{\{([a-z_]+)\}\}/g, (_, food) => {
    const index = recipe.ingredients.findIndex(ingredient => ingredient.food === food);
    return index < 0 || amounts[index] === null ? '—' : number(amounts[index]);
  });
}
function photo(recipe, css) {
  return recipe.photo ? `<img class="${css}" src="${esc(recipe.photo)}" alt="${esc(recipe.title)}">` : '';
}
function render() {
  const id = location.hash.slice(1);
  if (!id) {
    document.title = 'Recetario';
    app.innerHTML = `<div class="home-head"><div><h1>Tus recetas</h1><p class="intro">Elige qué cocinar.</p></div><div class="search"><label for="recipe-search">Buscar por título</label><input id="recipe-search" type="search" placeholder="Busca una receta…" value="${esc(searchQuery)}" autocomplete="off" aria-controls="recipe-sections"></div></div><p id="search-status" class="sr-only" role="status"></p><div id="recipe-sections"></div>`;
    function filterRecipes() {
      const query = normalizeTitle(searchQuery);
      const recipes = data.recipes.filter(recipe => normalizeTitle(recipe.title).includes(query));
      const categories = [...new Set(['Desayuno', 'Comida', ...recipes.map(recipe => recipe.category || 'Comida')])];
      document.querySelector('#recipe-sections').innerHTML = categories.map(category => {
        const group = recipes.filter(recipe => (recipe.category || 'Comida') === category);
        if (!group.length) return '';
        return `<section class="recipe-section"><h2>${esc(category)}</h2><div class="grid">${group.map(recipe => `<a class="card" href="#${esc(recipe.id)}">${photo(recipe,'photo') || '<div class="photo-pending">Foto pendiente</div>'}<h3>${esc(recipe.title)}</h3></a>`).join('')}</div></section>`;
      }).join('') || '<p class="empty-state">No hay recetas con ese título. Prueba con otra palabra.</p>';
      document.querySelector('#search-status').textContent = `${recipes.length} ${recipes.length === 1 ? 'receta encontrada' : 'recetas encontradas'}`;
    }
    document.querySelector('#recipe-search').addEventListener('input', event => {
      searchQuery = event.target.value;
      filterRecipes();
    });
    filterRecipes();
    return;
  }
  const recipe = data.recipes.find(r => r.id === id);
  if (!recipe) {app.innerHTML='<a class="back" href="#">← Todas las recetas</a><h1>Receta no encontrada</h1>';return;}
  document.title = `${recipe.title} · Recetario`;
  if (!recipeEdits.has(recipe.id)) recipeEdits.set(recipe.id, {
    portions: recipe.defaultServings,
    amounts: recipe.ingredients.map(baseAmount)
  });
  const state = recipeEdits.get(recipe.id);
  app.innerHTML = `<a class="back" href="#">← Todas las recetas</a><div class="recipe-head"><div><h1>${esc(recipe.title)}</h1><p class="intro">${esc(recipe.description)}</p></div>${photo(recipe,'recipe-photo')}</div><div class="nutrition">${[['kcal','kcal'],['protein','Proteínas · g'],['carbs','Hidratos · g'],['fat','Grasas · g']].map(([key,label])=>`<div class="metric"><strong id="metric-${key}">—</strong><span>${label}</span></div>`).join('')}</div><p class="nutrition-note" id="nutrition-note"></p><p class="nutrition-note" id="polyols-note" hidden></p><div class="controls"><label for="servings">Voy a cocinar</label><div class="stepper"><button id="minus" aria-label="Una ración menos">−</button><input id="servings" type="number" min="1" max="100" step="1" value="${state.portions}" aria-label="Número de raciones"><button id="plus" aria-label="Una ración más">+</button><span>raciones</span></div></div><div class="columns"><section><h2 id="ingredients-heading">Ingredientes</h2><p class="ingredient-legend">Para las raciones elegidas · P: proteínas · H: hidratos · G: grasas (g)</p><ul class="ingredients">${recipe.ingredients.map((i,index)=>`<li><label><input type="checkbox"><span>${esc(data.foods[i.food].name)}</span></label><div class="ingredient-values"><div class="amount-editor"><input id="amount-${index}" type="number" min="0" step="any" inputmode="decimal" placeholder="—" aria-label="${esc(data.foods[i.food].name)}: cantidad en ${amountUnit(i)}" aria-describedby="ingredient-nutrition-${index}"><span>${amountUnit(i)}</span></div><span class="ingredient-nutrition" id="ingredient-nutrition-${index}"></span></div><span class="amount" id="ingredient-note-${index}"></span></li>`).join('')}</ul><p class="pending">Puedes ajustar las cantidades. Los cambios se mantienen al cambiar raciones; al recargar vuelves a la receta original.</p></section><section><h2>Preparación</h2><ol class="steps">${recipe.steps.map((s,index)=>`<li><div><h3><label><input type="checkbox" aria-label="Paso ${index+1}: ${esc(s.title)}"><span>${esc(s.title)}</span></label></h3><p id="step-text-${index}"></p></div></li>`).join('')}</ol>${recipe.steps.length ? '' : '<p class="pending">Preparación pendiente de añadir.</p>'}</section></div>`;
  const targets = recipe.nutritionTargets ?? data.nutritionTargets;
  const target = targets?.perServing;
  if (target) {
    const reference = document.createElement('p');
    reference.className = 'nutrition-note';
    const parts = [];
    if (Number.isFinite(target.kcal)) parts.push(`≈${number(target.kcal)} kcal`);
    if (target.protein) parts.push(`${number(target.protein.min)}–${number(target.protein.max)} g proteínas`);
    if (Number.isFinite(target.carbs)) parts.push(`≈${number(target.carbs)} g hidratos`);
    if (target.fat) parts.push(`${number(target.fat.min)}–${number(target.fat.max)} g grasas`);
    reference.textContent = `Tu referencia por ración: ${parts.join(' · ')}.${recipe.nutritionTargets?.notes ? ` ${recipe.nutritionTargets.notes}` : ''}`;
    document.querySelector('#nutrition-note').after(reference);
  }
  if (recipe.nutritionNote) {
    const note = document.createElement('p');
    note.className = 'nutrition-note';
    note.id = 'recipe-nutrition-note';
    note.textContent = recipe.nutritionNote;
    document.querySelector('#nutrition-note').after(note);
  }
  const input = document.querySelector('#servings');
  function update(activeAmount = null) {
    const portions = state.portions;
    const total = nutritionPerServing(recipe, state.amounts);
    document.querySelector('#ingredients-heading').textContent = `Ingredientes para ${portions} ${portions === 1 ? 'ración' : 'raciones'}`;
    document.querySelector('#minus').disabled = portions <= 1;
    document.querySelector('#plus').disabled = portions >= 100;
    recipe.ingredients.forEach((ingredient, index) => {
      const amount = state.amounts[index] === null ? null : state.amounts[index] * portions;
      const editor = document.querySelector(`#amount-${index}`);
      if (index !== activeAmount) {
        editor.value = amount === null ? '' : Number(amount.toFixed(2));
        editor.removeAttribute('aria-invalid');
      }
      const values = ingredientNutrition(ingredient, amount);
      document.querySelector(`#ingredient-nutrition-${index}`).textContent = values
        ? `${number(values.kcal)} kcal · P ${number(values.protein)} · H ${number(values.carbs)} · G ${number(values.fat)}`
        : amount === null ? 'Cantidad pendiente' : 'Macros pendientes';
      const packageNote = ingredient.unit === 'paquete' && amount !== null && ingredient.grams > 0
        ? `${number(amount * ingredient.quantity / ingredient.grams)} paquetes · ` : '';
      document.querySelector(`#ingredient-note-${index}`).textContent = packageNote + (ingredient.note || '');
    });
    for (const key of ['kcal', 'protein', 'carbs', 'fat']) {
      document.querySelector(`#metric-${key}`).textContent = total ? number(total[key]) : '—';
    }
    document.querySelector('#nutrition-note').textContent = total
      ? `Estimación por ración.${total.missing.length ? ` Cálculo parcial: no incluye ${total.missing.join(', ')}, pendiente de completar.` : ''} ${total.missing.length ? 'Subtotal' : 'Total'} para ${portions}: ${number(total.kcal*portions)} kcal · ${number(total.protein*portions)} g proteínas · ${number(total.carbs*portions)} g hidratos · ${number(total.fat*portions)} g grasas.`
      : 'Valores por ración pendientes: faltan cantidades y datos nutricionales de los ingredientes.';
    const polyols = document.querySelector('#polyols-note');
    polyols.hidden = !(total?.polyols > 0);
    polyols.textContent = total?.polyols > 0
      ? `Los hidratos incluyen ${number(total.polyols)} g de polialcoholes por ración. Sin ellos: ${number(total.carbs-total.polyols)} g de hidratos. El eritritol aporta 0 kcal.` : '';
    recipe.steps.forEach((step, index) => {
      document.querySelector(`#step-text-${index}`).textContent = servingText(step.text, recipe, state.amounts);
    });
  }
  function changeServings() {
    const value = input.valueAsNumber;
    if (!Number.isInteger(value) || value < 1 || value > 100) return;
    state.portions = value;
    update();
  }
  input.addEventListener('input', changeServings);
  input.addEventListener('change', () => {
    input.value = Math.max(1, Math.min(100, Math.round(input.valueAsNumber || state.portions)));
    changeServings();
  });
  for (const [id, delta] of [['minus', -1], ['plus', 1]]) {
    document.querySelector(`#${id}`).addEventListener('click', () => {
      input.value = state.portions + delta;
      changeServings();
    });
  }
  recipe.ingredients.forEach((ingredient, index) => {
    const editor = document.querySelector(`#amount-${index}`);
    function editAmount() {
      const amount = editor.valueAsNumber;
      if (editor.validity.badInput || (editor.value !== '' && (!Number.isFinite(amount) || amount < 0))) {
        editor.setAttribute('aria-invalid', 'true');
        return;
      }
      editor.removeAttribute('aria-invalid');
      // Normalizar al editar, no al cambiar raciones: evita perder ajustes o acumular redondeos.
      state.amounts[index] = editor.value === '' ? null : amount / state.portions;
      update(index);
    }
    editor.addEventListener('input', editAmount);
    editor.addEventListener('change', () => {editAmount(); update();});
    editor.addEventListener('blur', () => update());
  });
  update();
}
window.addEventListener('hashchange',()=>{if(data)render();window.scrollTo(0,0);});
fetch('data/recipes.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(result=>{data=result;render();}).catch(()=>{app.innerHTML='<h1>No se pudieron cargar las recetas</h1><p>Comprueba que el servidor local esté funcionando y que el archivo de recetas sea válido.</p><a href="">Volver a intentar</a>';});
