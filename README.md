# STOCK VULCA — Consulta de cubiertas

Página web para que los vendedores consulten **stock y precios** de cubiertas
(GOODYEAR, SPORTRAK y ROADKING) desde la computadora o el celular.

El stock sale directamente del Excel que vos subís: **cambiás el Excel y la página
se actualiza sola**, sin tocar nada de código.

---

## 1. Actualizar el stock del día

1. Sacá el reporte de stock como siempre y guardalo con el nombre **`stock.xlsx`**.
2. Entrá al repositorio en GitHub → carpeta **`data`**.
3. Botón **`Add file` → `Upload files`** y arrastrá tu `stock.xlsx`.
   (Al tener el mismo nombre, reemplaza el anterior.)
4. Abajo, **`Commit changes`**.
5. Esperá ~1 minuto y recargá la página. Arriba a la izquierda vas a ver la fecha
   y hora de la última actualización.

> La página siempre pide la versión más nueva del archivo, así que el vendedor no
> necesita borrar caché ni nada por el estilo.

---

## 2. Cómo tiene que estar armado el Excel

Es **el mismo formato del reporte que ya usás**: una hoja por marca y, en cada hoja,
una fila por artículo.

| Código Provee | Código | Marca | Artículo | Stock |
|---|---|---|---|---|
| 110372 | 93247357 | GOODYEAR | 175/65R14 ASSURANCE MAXLIFE 86H XL | 253 |

- **El nombre de la hoja es la marca** (`GOODYEAR`, `SPORTRAK`, `ROADKING`).
  Por eso las Kelly, que están dentro de la hoja GOODYEAR, aparecen como GOODYEAR
  y el nombre "KELLY" queda en el diseño.
- La columna del artículo (`Artículo` o `DENOMINACION`) trae **medida y diseño juntos**:
  la página los separa sola.
  `175/65R14 ASSURANCE MAXLIFE 86H XL` → medida **175/65 R14** + diseño **ASSURANCE MAXLIFE 86H XL**.
  Reconoce todos los formatos: `205/55ZR16`, `225/75R16C`, `205R16C`, `295/80R22.5`,
  `LT245/70R16`, `P225/70R15`, `31X10.50R15LT`, `7.50-16`, `16.9-24`.
  Si un renglón no tiene medida (las cámaras, por ejemplo), muestra el texto completo.
- La columna de stock puede llamarse `Stock`, `CANTIDAD`, `UNIDADES` o como la sucursal
  (`CENTRAL-AUTOVIA`). Si tiene otro nombre, igual toma la última columna de números.
- Las columnas de código se ignoran solas.
- Las hojas cuyo nombre empieza con `_` (guión bajo) no se leen.

### Tope de 20 unidades

Si una medida tiene más de 20 cubiertas, en la web dice **20 u.** igual.
Ejemplo: 253 en el Excel → el vendedor ve `20 u.`.
Las que tienen 20 o menos se muestran con el número real (17, 11, 8…).
Para cambiar ese tope, está en `assets/app.js`, línea `topeStock: 20`.

### Precios

Hoy ninguna medida tiene precio cargado, así que todas las fichas dicen
**"Precio a confirmar"**. Cuando pases la lista de GOODYEAR se agregan dos columnas
al Excel, `PRECIO RUTA` y `PRECIO MDP`, y esas fichas pasan a mostrar los dos bloques
de precio. Las que queden sin precio (SPORTRAK y ROADKING) siguen con la franja gris.

Los precios se escriben solo con números: vale `118500`, `118.500` y `$ 118.500,50`.

---

## 3. Cómo busca el vendedor

Escribe en el buscador y los resultados aparecen al instante. Da lo mismo cómo
escriba la medida:

- `17565` → encuentra 175/65 R14
- `175/65`, `175 65 14`, `175-65-14`, `175/65 r14` → lo mismo
- También busca por diseño (`maxlife`, `wrangler`, `kelly`) o por marca (`roadking`)
- Se pueden combinar: `17565 goodyear`

Además tiene filtro por marca, botón **"Solo con stock"**, orden (medida, marca,
stock o precio) y un botón **"Copiar"** en cada ficha para pegar la info en WhatsApp.

**Cuando haya precios, los dos se distinguen por color:**
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
> cualquiera con el link puede verla.

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
| Dice *"No se pudo cargar el stock"* | No se subió `data/stock.xlsx`, o abriste el `index.html` haciendo doble clic en la PC (hay que entrar por el link de GitHub Pages). |
| Sale *"Sin resultados"* | Probá con menos números (`175` en vez de `175/65R14`). |
| Una medida no aparece | Fijate que esa fila tenga algo escrito en la columna del artículo. |
| No se actualizó | Esperá 1 minuto (GitHub tarda en publicar) y recargá. |

Para probar un Excel antes de subirlo, al pie de la página está
**"Probar con un Excel de mi PC"**: lo lee solo en tu navegador, no lo sube a ningún lado.
