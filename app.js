'use strict';
const app = document.querySelector('#app');
let data;
let searchQuery = '';
const normalizeTitle = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = n => new Intl.NumberFormat('es', {maximumFractionDigits:2}).format(n);
function nutritionPerServing(recipe) {
  const keys = ['kcal','protein','carbs','fat'];
  const total = {kcal:0,protein:0,carbs:0,fat:0,polyols:0,missing:[]};
  let included = 0;
  for (const ingredient of recipe.ingredients) {
    const food = data.foods[ingredient.food];
    const byVolume = Boolean(food.per100ml);
    const values = byVolume ? food.per100ml : food.per100g;
    const amount = byVolume ? (ingredient.unit === 'ml' ? ingredient.quantity : null) : ingredient.grams;
    if (!Number.isFinite(amount) || !values || keys.some(key => !Number.isFinite(values[key]))) {
      total.missing.push(food.name);
      continue;
    }
    for (const key of keys) total[key] += values[key] * amount / 100;
    total.polyols += (values.polyols ?? 0) * amount / 100;
    included++;
  }
  return included ? total : null;
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
  const total = nutritionPerServing(recipe);
  app.innerHTML = `<a class="back" href="#">← Todas las recetas</a><div class="recipe-head"><div><h1>${esc(recipe.title)}</h1><p class="intro">${esc(recipe.description)}</p></div>${photo(recipe,'recipe-photo')}</div><div class="nutrition">${[['kcal','kcal'],['protein','Proteínas · g'],['carbs','Hidratos · g'],['fat','Grasas · g']].map(([key,label])=>`<div class="metric"><strong>${total ? number(total[key]) : '—'}</strong><span>${label}</span></div>`).join('')}</div><p class="nutrition-note" id="nutrition-note"></p><div class="controls"><label for="servings">Voy a cocinar</label><div class="stepper"><button id="minus" aria-label="Una ración menos">−</button><input id="servings" type="number" min="1" max="100" step="1" value="${recipe.defaultServings}" aria-label="Número de raciones"><button id="plus" aria-label="Una ración más">+</button><span>raciones</span></div></div><div class="columns"><section><h2 id="ingredients-heading">Ingredientes</h2><ul class="ingredients">${recipe.ingredients.map((i,index)=>`<li><label><input type="checkbox"><span>${esc(data.foods[i.food].name)}<span class="amount" id="amount-${index}"></span></span></label></li>`).join('')}</ul><p class="pending">${recipe.ingredients.some(i=>i.quantity===null) ? 'Faltan algunas cantidades de la receta original. Se mostrarán aquí cuando las añadamos.' : 'Cantidades ajustadas a las raciones elegidas.'}</p></section><section><h2>Preparación</h2><ol class="steps">${recipe.steps.map(s=>`<li><div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></li>`).join('')}</ol>${recipe.steps.length ? '' : '<p class="pending">Preparación pendiente de añadir.</p>'}</section></div>`;
  if (total?.polyols > 0) {
    const note = document.createElement('p');
    note.className = 'nutrition-note';
    note.textContent = `Los hidratos incluyen ${number(total.polyols)} g de polialcoholes por ración. Sin ellos: ${number((total.carbs-total.polyols))} g de hidratos. El eritritol aporta 0 kcal.`;
    document.querySelector('#nutrition-note').after(note);
  }
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
    note.textContent = recipe.nutritionNote;
    document.querySelector('#nutrition-note').after(note);
  }
  const input = document.querySelector('#servings');
  function update() {
    const portions = Math.max(1,Math.min(100,Math.round(Number(input.value)||recipe.defaultServings)));
    input.value = portions;
    document.querySelector('#ingredients-heading').textContent = `Ingredientes para ${portions} ${portions === 1 ? 'ración' : 'raciones'}`;
    document.querySelector('#minus').disabled = portions <= 1;
    document.querySelector('#plus').disabled = portions >= 100;
    recipe.ingredients.forEach((i,index) => {
      const q = i.quantity === null ? null : i.quantity*portions;
      const amount = q === null ? 'Cantidad pendiente' : `${number(q)} ${i.unit==='paquete' ? (q===1?'paquete':'paquetes') : i.unit}`;
      document.querySelector(`#amount-${index}`).textContent = amount + (i.note ? ` · ${i.note}` : '');
    });
    document.querySelector('#nutrition-note').textContent = total ? `Estimación por ración.${total.missing.length ? ` Cálculo parcial: no incluye ${total.missing.join(', ')}, pendiente de completar.` : ''} ${total.missing.length ? 'Subtotal' : 'Total'} para ${portions}: ${number(total.kcal*portions)} kcal · ${number(total.protein*portions)} g proteínas · ${number(total.carbs*portions)} g hidratos · ${number(total.fat*portions)} g grasas.` : 'Valores por ración pendientes: faltan cantidades y datos nutricionales de los ingredientes.';
  }
  input.addEventListener('change',update);
  for (const [id,delta] of [['minus',-1],['plus',1]]) document.querySelector(`#${id}`).addEventListener('click',()=>{input.value=Number(input.value)+delta;update();});
  update();
}
window.addEventListener('hashchange',()=>{if(data)render();window.scrollTo(0,0);});
fetch('data/recipes.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(result=>{data=result;render();}).catch(()=>{app.innerHTML='<h1>No se pudieron cargar las recetas</h1><p>Comprueba que el servidor local esté funcionando y que el archivo de recetas sea válido.</p><a href="">Volver a intentar</a>';});
