# Recetario

Web local sin paquetes externos, sin compilación ni base de datos. Necesita Python 3. Todos los recursos se sirven desde este directorio; funciona sin conexión a internet.

## Arrancar

Haz doble clic en `Iniciar.command`, deja su terminal abierta y visita http://localhost:8765. Para detenerlo, pulsa Ctrl+C en esa terminal. También puedes ejecutar `python3 server.py` en esta carpeta.

Desde el móvil o tablet en la misma wifi: `http://IP-DEL-MAC:8765`. La IP se consulta en Ajustes del Sistema → Red. Permite conexiones locales a Python si macOS lo solicita. El Mac debe estar encendido y despierto. No hace falta abrir puertos del router.

## Añadir recetas con un agente

Edita `data/recipes.json`. `foods` es el catálogo reutilizable. Cada alimento admite `per100g` con `kcal`, `protein`, `carbs`, `fat` (gramos excepto kcal), además de campos opcionales `source` y `notes` para registrar etiqueta, marca y si se pesó crudo o cocinado.

Cada receta tiene un `id` único, título, descripción, `defaultServings`, `ingredients`, `steps` y `photo` (ruta local como `photos/udon.jpg`, o null). Todas las cantidades se guardan por UNA ración. Los ingredientes referencian `food`; `quantity` y `unit` expresan la cantidad por ración; `grams` es su masa por ración para calcular nutrición. Por ejemplo, el udon lleva quantity: 0.6666666666666666, unit: "paquete", grams: 133.33333333333334 (dos tercios de un paquete de 200 g). Conserva la precisión en los datos: solo se redondea al mostrar. `defaultServings` únicamente fija el valor inicial del selector: 3 para el udon y 4 para el porridge. Cambiar este valor no altera cantidades guardadas ni macros por ración. El selector multiplica directamente las cantidades y nutrición por ración por las raciones elegidas. Para líquidos etiquetados por volumen, usar `per100ml` en el alimento y `quantity` con `unit: "ml"` en el ingrediente; se calcula directamente por volumen sin asumir densidad.

Las cantidades y gramos desconocidos son `null`, nunca cero. `per100g` permanece null hasta incorporar una etiqueta o fuente verificada. Los ingredientes con masa y los cuatro valores nutricionales se suman. Si faltan datos, se muestra un subtotal claramente marcado como parcial, con los nombres de los ingredientes excluidos. Si no hay ningún ingrediente completo, no se muestran cifras. Nunca se presenta un subtotal como el total completo. La energía se suma desde el dato kcal; no se deduce de los macros redondeados. El total escala con las raciones y los valores por ración permanecen constantes. Los valores calculados son estimaciones según ingredientes y cantidades; documenta grasa descartada o porción comestible si corresponde.

La receta inicial refleja el relato del usuario: tres raciones, dos paquetes de udon, 24 g de aceite, 30 g de levadura. Actualización: 450 g de pollo de parte comestible (aproximados, sin hueso), 300 g de champiñones y 450 g de zanahoria en total (150 g por ración). Pesos confirmados antes de cocinar; pollo sin piel. Caldo Gallina Blanca Casero de Pollo 100% Natural: 5 kcal, 0,4 g proteína, 0,2 g hidratos y 0,3 g grasa por 100 ml. Cantidad no medida: excluido explícitamente del subtotal. Udon: paquetes de 200 g; 122 kcal, 26 g de hidratos, 3 g de proteína y 0 g de grasa por 100 g, aportados por el usuario. HSN Engevita y alimentos básicos incorporados con sus fuentes; pollo con referencia genérica ICBF. No se han inventado datos nutricionales ni tiempos. Las fotos locales actuales son imágenes generadas aportadas por el usuario; pueden sustituirse en `photos/`.

## Comprobación manual

Abrir la receta y elegir 6 raciones: deben aparecer 4 paquetes, 48 g de aceite y 60 g de levadura. Volver a 3: 2 paquetes, 24 g y 30 g. Las cantidades desconocidas siguen pendientes. Comprobar navegación atrás, casillas de ingredientes y vista estrecha desde el móvil.

Los objetivos personales aproximados se guardan en `nutritionTargets`, por ración, y se muestran como referencia separada de la nutrición calculada. No modifican automáticamente los ingredientes.

## Porridge de desayuno

Segunda receta: cantidades guardadas por ración (30 g de avena, 180 g de leche, 100 g de arándanos, 10 g de miel, 10 g de colágeno, 5 g de creatina, 10 g de eritritol, 5 g de canela y 125 g de requesón), con 4 raciones por defecto. Objetivo propio aproximado de 300 kcal, sin rangos de macros inventados. `nutritionTargets` dentro de una receta sustituye la referencia global. Los campos numéricos de objetivos son opcionales. `steps: []` muestra preparación pendiente.

Referencias y supuestos en cada alimento y en `nutritionNote`: se asumen Pastoret 0%, colágeno HSN Raw bovino sin sabor y creatina pura. Colágeno estimado como proteína pura (400 kcal/100 g), no presentado como etiqueta verificada. Sin pasos ni tiempos inventados.

Preparación del porridge confirmada: avena y leche 90 minutos en alta en Crock-Pot; canela, eritritol y colágeno al abrir; mezclar y repartir. Al consumir, microondas 2 minutos y después arándanos congelados, requesón y miel por ración. Creatina: 5 g por ración, 20 g para las 4 raciones habituales. El usuario la añade al abrir, junto al colágeno. Se documenta como alternativa mezclarla con el requesón justo antes de comer; no usar ambos momentos para evitar duplicar la dosis. Los tiempos corresponden al método del usuario, no se multiplican con el selector.

`polyols` es un desglose opcional dentro de `per100g`/`per100ml`, ya incluido en `carbs`. Se suma por separado para explicar el eritritol: 61,295 g hidratos/ración incluyendo 10 g polialcoholes; 51,295 g excluyéndolos. Las kcal se mantienen según cada fuente.

## Navegación y fotos

La portada agrupa las recetas por `category` (Desayuno y Comida), con foto y título. El buscador filtra el título al escribir, sin distinguir mayúsculas ni tildes, y conserva la búsqueda al volver desde una receta. La cuadrícula muestra tres columnas en escritorio, dos en tablet y una en móviles estrechos. En la ficha, la foto aparece pequeña junto al título; en pantallas estrechas pasa debajo. Para cambiar las imágenes, sustituye `photos/porridge.jpg` o `photos/udon.jpg`, o actualiza el campo `photo`.
