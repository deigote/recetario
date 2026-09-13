# Recetario

Web local sin paquetes externos, sin compilación ni base de datos. Necesita Python 3. Todos los recursos se sirven desde este directorio; funciona sin conexión a internet.

## Arrancar

Haz doble clic en `Iniciar.command`, deja su terminal abierta y visita http://localhost:8765. Para detenerlo, pulsa Ctrl+C en esa terminal. También puedes ejecutar `python3 server.py` en esta carpeta.

Desde el móvil o tablet en la misma wifi: `http://IP-DEL-MAC:8765`. La IP se consulta en Ajustes del Sistema → Red. Permite conexiones locales a Python si macOS lo solicita. El Mac debe estar encendido y despierto. No hace falta abrir puertos del router.

## Añadir recetas con un agente

Ordena siempre `ingredients` por su primera utilización en los pasos de preparación, también al modificar recetas existentes. Si varios se añaden juntos, sigue el orden en que aparecen en el paso; los ingredientes que se añaden al servir van al final. Cuando haya alternativas, sigue el método habitual del usuario y conserva la alternativa en la nota. Este orden se guarda directamente en el JSON; no hace falta ordenación automática en la interfaz.

Edita `data/recipes.json`. `foods` es el catálogo reutilizable. Cada alimento admite `per100g` con `kcal`, `protein`, `carbs`, `fat` (gramos excepto kcal), además de campos opcionales `source` y `notes` para registrar etiqueta, marca y si se pesó crudo o cocinado.

Cada receta tiene un `id` único, título, descripción, `defaultServings`, `ingredients`, `steps` y `photo` (ruta local como `photos/udon.jpg`, o null). Todas las cantidades se guardan por UNA ración. Los ingredientes referencian `food`; `quantity` y `unit` expresan la cantidad por ración; `grams` es su masa por ración para calcular nutrición. Por ejemplo, el udon lleva quantity: 0.6666666666666666, unit: "paquete", grams: 133.33333333333334 (dos tercios de un paquete de 200 g). Conserva la precisión en los datos: solo se redondea al mostrar. `defaultServings` únicamente fija el valor inicial del selector: 3 para el udon y 4 para el porridge. Cambiar este valor no altera cantidades guardadas ni macros por ración. El selector multiplica directamente las cantidades y nutrición por ración por las raciones elegidas. Para líquidos etiquetados por volumen, usar `per100ml` en el alimento y `quantity` con `unit: "ml"` en el ingrediente; se calcula directamente por volumen sin asumir densidad.

Las cantidades y gramos desconocidos son `null`, nunca cero. `per100g` permanece null hasta incorporar una etiqueta o fuente verificada. Los ingredientes con masa y los cuatro valores nutricionales se suman. Si faltan datos, se muestra un subtotal claramente marcado como parcial, con los nombres de los ingredientes excluidos. Si no hay ningún ingrediente completo, no se muestran cifras. Nunca se presenta un subtotal como el total completo. La energía se suma desde el dato kcal; no se deduce de los macros redondeados. El total escala con las raciones y los valores por ración permanecen constantes. Los valores calculados son estimaciones según ingredientes y cantidades; documenta grasa descartada o porción comestible si corresponde.

La receta inicial refleja el relato del usuario: tres raciones, dos paquetes de udon, 24 g de aceite, 30 g de levadura. Actualización: 450 g de pollo de parte comestible (aproximados, sin hueso), 300 g de champiñones y 450 g de zanahoria en total (150 g por ración). Pesos confirmados antes de cocinar; pollo sin piel. Caldo Gallina Blanca Casero de Pollo 100% Natural: 5 kcal, 0,4 g proteína, 0,2 g hidratos y 0,3 g grasa por 100 ml. Cantidad no medida: excluido explícitamente del subtotal. Udon: paquetes de 200 g; 122 kcal, 26 g de hidratos, 3 g de proteína y 0 g de grasa por 100 g, aportados por el usuario. HSN Engevita y alimentos básicos incorporados con sus fuentes; pollo con referencia genérica ICBF. No se han inventado datos nutricionales ni tiempos. Las fotos locales actuales son imágenes generadas aportadas por el usuario; pueden sustituirse en `photos/`.

## Comprobación manual

Abrir la receta y elegir 6 raciones: deben aparecer 4 paquetes, 48 g de aceite y 60 g de levadura. Volver a 3: 2 paquetes, 24 g y 30 g. Las cantidades desconocidas siguen pendientes. Comprobar navegación atrás, casillas de ingredientes y pasos, y vista estrecha desde el móvil. Las casillas se pueden marcar y desmarcar; se mantienen al cambiar raciones y se reinician al abrir de nuevo la receta o recargar, igual que las de ingredientes.

Los objetivos personales aproximados se guardan en `nutritionTargets`, por ración, y se muestran como referencia separada de la nutrición calculada. No modifican automáticamente los ingredientes.

## Porridge de desayuno

Segunda receta: cantidades guardadas por ración (30 g de avena, 180 g de leche, 100 g de arándanos, 10 g de miel, 10 g de colágeno, 5 g de creatina, 10 g de eritritol, 5 g de canela y 125 g de requesón), con 4 raciones por defecto. Objetivo propio aproximado de 300 kcal, sin rangos de macros inventados. `nutritionTargets` dentro de una receta sustituye la referencia global. Los campos numéricos de objetivos son opcionales. `steps: []` muestra preparación pendiente.

Referencias y supuestos en cada alimento y en `nutritionNote`: se asumen Pastoret 0%, colágeno HSN Raw bovino sin sabor y creatina pura. Colágeno estimado como proteína pura (400 kcal/100 g), no presentado como etiqueta verificada. Sin pasos ni tiempos inventados.

Preparación del porridge confirmada: avena y leche 90 minutos en alta en Crock-Pot; canela, eritritol y colágeno al abrir; mezclar y repartir. Al consumir, microondas 2 minutos y después arándanos congelados, requesón y miel por ración. Creatina: 5 g por ración, 20 g para las 4 raciones habituales. El usuario la añade al abrir, junto al colágeno. Se documenta como alternativa mezclarla con el requesón justo antes de comer; no usar ambos momentos para evitar duplicar la dosis. Los tiempos corresponden al método del usuario, no se multiplican con el selector.

`polyols` es un desglose opcional dentro de `per100g`/`per100ml`, ya incluido en `carbs`. Se suma por separado para explicar el eritritol: 61,295 g hidratos/ración incluyendo 10 g polialcoholes; 51,295 g excluyéndolos. Las kcal se mantienen según cada fuente.

## Navegación y fotos

La portada agrupa las recetas por `category` (Desayuno, Comida y Postres), con foto y título. El buscador filtra el título al escribir, sin distinguir mayúsculas ni tildes, y conserva la búsqueda al volver desde una receta. La cuadrícula muestra tres columnas en escritorio, dos en tablet y una en móviles estrechos. En la ficha, la foto aparece pequeña junto al título; en pantallas estrechas pasa debajo. Para cambiar las imágenes, sustituye `photos/porridge.jpg`, `photos/udon.jpg` o `photos/helado-chocolate.jpg`, o actualiza el campo `photo`.

## Ajustes temporales al cocinar

Cada ingrediente muestra un campo editable con los gramos del lote seleccionado (ml para el caldo, cuya etiqueta es por volumen) y sus kcal/P/H/G para esa misma cantidad. El udon se edita en gramos y conserva una equivalencia orientativa en paquetes. Los valores de cabecera son por ración y el resumen muestra también el total del lote.

Los ajustes se mantienen solo en memoria, por receta, incluso al volver desde la portada. Al editar se divide la cantidad introducida entre las raciones actuales; al cambiar raciones se multiplica esa nueva cantidad por ración, sin redondear el estado interno. Ejemplo: 100 g para 2 raciones pasa a 50 g para 1 y a 150 g para 3. Recargar restaura el JSON original; no se escribe en disco ni en almacenamiento del navegador. Cero excluye el aporte; vacío indica cantidad desconocida y subtotal parcial. Cantidades negativas o no numéricas no se aplican.

En los pasos, las cantidades explícitas por ración pueden usar `{{food_id}}` (por ejemplo `{{honey}} g de miel`) para reflejar los ajustes. Mantén las unidades y la expresión «por ración» en el texto; los tiempos no se escalan. Evita cantidades fijas en las notas que contradigan los ajustes.

## Helado de chocolate · Postres

Cantidades originales de MFP para cuatro raciones: 15 g de yema, 20 g de azúcar moreno, 350 ml de leche Suprema semidesnatada, 4 g de Maizena, 25 g de cacao puro desgrasado Valor, 50 g de skyr Milsani y 40 g de chocolate praliné Nestlé Postres. Se guardan divididas entre cuatro y con `defaultServings: 4`. La nueva categoría aparece automáticamente. Imagen del plato aportada posteriormente por el usuario: `photos/helado-chocolate.jpg`, visible en portada y ficha. Las capturas de MFP se usaron solo como referencia de ingredientes y macros.

El usuario confirma el praliné de la captura, pero varía la tableta: prefiere un chocolate algo más dulce que para comer solo. Se conserva Nestlé Postres como referencia de macros y se indica en el ingrediente. Modelo/capacidad de CREAMi todavía pendientes. No equiparar cuatro raciones con cuatro tarros, ni masa con volumen. Respetar siempre MAX FILL y repartir sobrante si es necesario. `nutritionTargets: {perServing: null}` evita heredar el objetivo de 600 kcal de las comidas.

Cálculo inicial con las referencias documentadas en `foods`: 168,45 kcal, 8,44625 g de proteína, 16,71625 g de hidratos y 7,09875 g de grasa por ración. `originalMfp` conserva por separado el total original redondeado (168 kcal, 8,4 P, 17 H, 7,1 G). No forzar los alimentos para cuadrar MFP. El skyr usa una referencia secundaria provisional, no una etiqueta confirmada. Las cantidades inferiores a 0,5 g/100 g de proteína y grasa de Maizena se aproximan a cero y se documentan.

Preparación adaptada, todavía no probada: método recordado de Thermomix a 75 °C y chocolate fuera del calor; referencia Ninja de gelato de chocolate a 74–79 °C, enfriado y congelación de 24 h. No fijar minutos/velocidades ni escalarlos automáticamente. Maizena dispersada en frío, sin prometer gelatinización completa a 75 °C. Fuente: https://www.sharkninja.co.uk/rich-chocolate-gelato/REC4662EU.html .

Variante de colágeno aceptada y aplicada: sustituir los 350 ml de Suprema semidesnatada del lote por 350 ml de Suprema desnatada y añadir 10 g de colágeno HSN, manteniendo skyr, eritritol y los demás ingredientes. Se guardan 87,5 ml de leche y 2,5 g de colágeno por ración. El colágeno va después del chocolate, con el calentamiento desactivado; ingrediente y pasos en ese orden. La leche ahorra 45,5 kcal por lote y el colágeno estimado añade 40 kcal. La textura queda por probar: si resulta demasiado helado, revisar con el usuario. Para comparar o recuperar la versión anterior: Suprema semidesnatada en igual volumen, sin colágeno. La proteína del colágeno se contabiliza sin equipararla nutricionalmente a la proteína láctea.

Actualización de eritritol: el usuario recuerda añadir aproximadamente tanto como azúcar. Guardados 5 g por ración (20 g para cuatro), además de los 20 g de azúcar del lote. Momento propuesto con yema y azúcar, antes de calentar; ingredientes ordenados por uso. Dulzor orientativo del eritritol: 65–70 % del azúcar según Cargill, por lo que 20 g aportan el equivalente aproximado a 13–14 g de azúcar. No se presenta esta proporción como receta probada ni se vinculan los campos al editar. Fuente: https://www.cargill.com/doc/1432136521904/formulating-low-sugar-products.pdf .

Nutrición actual del helado por ración, con la variante aceptada: 167,075 kcal, 10,94625 P, 21,71625 H incluyendo 5 g de polialcoholes (16,71625 H excluyéndolos), 5,78625 G. Se mantienen intactos los valores históricos de MFP en `originalMfp`, que corresponden a la versión original con semidesnatada, sin colágeno y sin eritritol anotado. Con eritritol se propone LITE ICE CREAM / Helado light, de acuerdo con la recomendación de Ninja para recetas con edulcorantes: https://ninjakitchenapac.zendesk.com/hc/en-au/articles/5369888572303-Product-Setup-How-to-Use .
