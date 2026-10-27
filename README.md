# STOCK VULCA — Consulta de cubiertas

Página web para que los vendedores consulten **stock y precios** de cubiertas
(GOODYEAR, SPORTRACK y ROADKING) desde la computadora o el celular.

El stock sale directamente de un archivo Excel que vos actualizás: **cambiás el Excel y la página
se actualiza sola**, sin tocar nada de código.

---

## 1. Actualizar el stock del día

1. Abrí tu Excel en la compu, cargá el stock y los precios, y guardalo con el nombre **`stock.xlsx`**.
2. Entrá al repositorio en GitHub → carpeta **`data`**.
3. Botón **`Add file` → `Upload files`** y arrastrá tu `stock.xlsx`.
   (Al tener el mismo nombre, reemplaza el anterior.)
4. Abajo, **`Commit changes`**.
5. Esperá ~1 minuto y recargá la página. Arriba a la derecha vas a ver la fecha y hora
   de la última actualización.

> La página siempre pide la versión más nueva del archivo, así que el vendedor no necesita
> borrar caché ni nada por el estilo.

---

## 2. Cómo tiene que estar armado el Excel

Podés usar **una hoja por marca** (recomendado) o una sola hoja con la columna `MARCA`.
Si la hoja se llama `GOODYEAR` y no hay columna `MARCA`, se toma el nombre de la hoja como marca.

La **fila 1** son los títulos de las columnas:

| MARCA | DISEÑO | MEDIDA | STOCK | PRECIO RUTA | PRECIO MDP | OBSERVACION |
|---|---|---|---|---|---|---|
| GOODYEAR | ASSURANCE MAXLIFE | 175/65 R14 | 12 | 118500 | 125900 | |
| GOODYEAR | EAGLE SPORT | 205/50 R17 | 2 | 236000 | 249900 | ULTIMAS UNIDADES |

**Reglas:**

- **MEDIDA** es la única columna obligatoria.
- **STOCK**: número. `0` = sin stock (aparece en gris y al final de la lista).
  Si ponés texto (`SI`, `CONSULTAR`), también lo muestra.
- **PRECIO RUTA / PRECIO MDP**: solo números. Se aceptan `118500`, `118.500` y `$ 118.500,50`.
  Si la celda está vacía, en la página dice **"A confirmar"**.
- **OBSERVACION**: opcional, texto corto que aparece resaltado en la ficha.
- Las hojas cuyo nombre empieza con `_` (guión bajo) no se leen.
- Los títulos pueden variar: también entiende `MODELO`/`DIBUJO` por `DISEÑO`,
  `CANTIDAD`/`UNIDADES` por `STOCK`, `RUTA` y `MDP` solos, etc.
- Si arriba de la tabla tenés un título o filas sueltas, no molesta: busca sola la fila de títulos.

### Cartel de "Datos de ejemplo"

El archivo que viene cargado es una **plantilla de prueba**. Tiene una hoja llamada
`_INSTRUCCIONES` y, mientras esa hoja exista, la página muestra el cartel amarillo
*"Datos de ejemplo"*. **Borrá esa hoja** cuando subas tu planilla real y el cartel desaparece.

---

## 3. Cómo busca el vendedor

Escribe en el buscador y los resultados aparecen al instante. Da lo mismo cómo escriba la medida:

- `17565` → encuentra 175/65 R14
- `175/65`, `175 65 14`, `175-65-14`, `175/65 r14` → lo mismo
- También puede buscar por diseño (`maxlife`) o por marca (`roadking`)
- Se pueden combinar: `17565 goodyear`

Además tiene filtro por marca, botón **"Solo con stock"**, orden (medida, marca, stock o precio)
y un botón **"Copiar"** en cada ficha para pegar la info en WhatsApp.

**Los dos precios se distinguen por color:**
**RUTA = bloque negro** · **MDP = bloque amarillo**, cada uno con su etiqueta.

---

## 4. Publicar la página (GitHub Pages)

Una sola vez:

1. En el repositorio: **`Settings`** → menú izquierdo **`Pages`**.
2. En *Source* elegí **`Deploy from a branch`**.
3. En *Branch* elegí la rama donde está el código y la carpeta **`/ (root)`** → **`Save`**.
4. A los 1–2 minutos queda publicada en:
   **https://santinovespa-png.github.io/STOCK-VULCA/**

> El repositorio tiene que ser **público** para usar GitHub Pages con la cuenta gratuita.
> Si querés que no aparezca en Google, ya viene con la etiqueta `noindex`; de todos modos,
> cualquiera con el link puede verla, así que no pongas ahí datos que no quieras mostrar.

---

## 5. Archivos del proyecto

```
index.html          La página
assets/styles.css   Diseño (colores Goodyear: amarillo #ffd100 y negro)
assets/app.js       Lectura del Excel + buscador
data/stock.xlsx     ← EL ÚNICO ARCHIVO QUE TENÉS QUE TOCAR TODOS LOS DÍAS
```

- Para cambiar el título de arriba, editá `index.html` (busque `STOCK VULCA`).
- Para cambiar colores, editá las variables del principio de `assets/styles.css`.
- Si en vez de Excel preferís CSV, subí `data/stock.csv` con las mismas columnas:
  si no encuentra el `.xlsx`, lo usa como alternativa.

---

## 6. Si algo no anda

| Qué pasa | Por qué |
|---|---|
| Dice *"No se pudo cargar el stock"* | Todavía no subiste `data/stock.xlsx`, o abriste el `index.html` haciendo doble clic en la PC (hay que entrar por el link de GitHub Pages). |
| Sale *"Sin resultados"* | Probá con menos números (`175` en vez de `175/65R14`). |
| Un precio dice *"A confirmar"* | Esa celda del Excel está vacía. |
| No se actualizó | Esperá 1 minuto (GitHub tarda en publicar) y recargá. |

Para probar un Excel antes de subirlo, al pie de la página está
**"Probar con un Excel de mi PC"**: lo lee solo en tu navegador, no lo sube a ningún lado.
