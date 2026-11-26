# STOCK VULCA — Consulta de cubiertas

Página web para que los vendedores consulten **stock y precios** de cubiertas
(GOODYEAR, SPORTRAK y ROADKING) desde la computadora o el celular.

El stock sale directamente del Excel que vos subís: **cambiás el Excel y la página
se actualiza sola**, sin tocar nada de código.

---

## 1. Actualizar el stock del día

**Desde la página, que es lo más cómodo:**

1. Sacá el reporte de stock como siempre y guardalo con el nombre **`stock.xlsx`**.
2. Abajo de todo de la página, abrí **"Actualizar el stock"** y apretá el botón
   **SUBIR EL STOCK A GITHUB**: se abre GitHub justo en la carpeta correcta.
3. Arrastrá el archivo y apretá el botón verde **`Commit changes`**.
   (Al tener el mismo nombre, reemplaza el anterior.)
4. Esperá ~1 minuto y recargá. Arriba a la izquierda vas a ver la fecha y hora
   de la última actualización.

Hace falta estar con tu cuenta de GitHub. Los vendedores pueden abrir ese botón pero
no pueden cambiar nada, porque GitHub no se lo permite.

**Para probar antes de subir:** en esa misma sección, abajo, podés elegir un archivo de tu
computadora —el stock o una lista de precios, se da cuenta sola de cuál es— y ver cómo
queda. Si es una lista de precios, la prueba sobre el stock publicado y te dice cuántas
medidas quedarían con precio. Se lee solo en tu navegador, la página te avisa con un cartel
azul que es una prueba, y el botón **Volver al publicado** te saca de ahí. Lo que ven los
vendedores no cambia hasta que subís el archivo.

> La página siempre pide la versión más nueva del archivo, así que el vendedor no
> necesita borrar caché ni nada por el estilo.

---

## 2. Cómo tiene que estar armado el Excel

Es **el mismo formato del reporte que ya usás**: una hoja por marca y, en cada hoja,
una fila por artículo.

| Código | Marca | Artículo | Total |
|---|---|---|---|
| 93247357 | GOODYEAR | 175/65R14 ASSURANCE MAXLIFE 86H XL | 547 |

Los títulos van en la primera fila con datos; si arriba hay filas en blanco o un título
suelto, no molesta.

- **El nombre de la hoja es la marca.** Sirven tanto los nombres completos
  (`GOODYEAR`, `SPORTRAK`, `ROADKING`) como las abreviaturas `GY`, `SP` y `RK`.
  Por eso las Kelly, que están dentro de la hoja GOODYEAR, aparecen como GOODYEAR
  y el nombre "KELLY" queda en el diseño.
- La columna del artículo (`Artículo` o `DENOMINACION`) trae **medida y diseño juntos**:
  la página los separa sola.
  `175/65R14 ASSURANCE MAXLIFE 86H XL` → medida **175/65 R14** + diseño **ASSURANCE MAXLIFE 86H XL**.
  Reconoce todos los formatos: `205/55ZR16`, `225/75R16C`, `205R16C`, `295/80R22.5`,
  `LT245/70R16`, `P225/70R15`, `31X10.50R15LT`, `7.50-16`, `16.9-24`.
  Si un renglón no tiene medida (las cámaras, por ejemplo), muestra el texto completo.
- La columna de stock puede llamarse `Total`, `Stock`, `CANTIDAD`, `UNIDADES` o como la
  sucursal (`CENTRAL-AUTOVIA`). Si tiene otro nombre, igual toma la última columna de números.
- La columna de código sirve para traer el precio (ver más abajo).
- Las hojas cuyo nombre empieza con `_` (guión bajo) no se leen.

### Tope de 20 unidades

Si una medida tiene más de 20 cubiertas, en la web dice **20 u.** igual.
Ejemplo: 253 en el Excel → el vendedor ve `20 u.`.
Las que tienen 20 o menos se muestran con el número real (17, 11, 8…).
Para cambiar ese tope, está en `assets/app.js`, línea `topeStock: 20`.

### Precios

Los precios **no** van en el archivo de stock: van en dos archivos aparte, que son las
listas de Goodyear tal como vienen, sin tocarles nada:

| Archivo en `data/` | Qué es |
|---|---|
| `precios_ruta.xlsx` | Lista Consumer **RUTA** |
| `precios_mdp.xlsx` | Lista Consumer **MDP** |

Cuando Goodyear manda listas nuevas, las renombrás así y las subís a la carpeta `data`
igual que el stock. No hay que combinarlas ni copiar nada a mano: abajo de la página,
en **"Actualizar stock y precios"**, está el botón **SUBIR LOS PRECIOS**, que abre GitHub
en la carpeta correcta. Podés arrastrar los dos archivos juntos.

**Subí siempre las dos listas.** Si cambiás solo una, las fichas quedan con el precio RUTA
de una lista y el MDP de otra.

**No hace falta renombrarlas a mano.** Cada vez que entra un archivo a `data`, GitHub lo
renombra solo mirando si el nombre dice STOCK, RUTA o MDP
(`.github/workflows/renombrar-archivos.yml`). Así podés arrastrar la lista tal como la
manda Goodyear, `LISTA CONSUMER RUTA NOV 26.xlsx` y todo. Tarda unos segundos y queda un
commit de `github-actions` avisando qué renombró.

Dos cosas que el automatismo **no** hace, a propósito: si subís dos archivos que apuntan al
mismo destino (por ejemplo dos stock juntos) no toca ninguno, y si el nombre no dice ninguna
de esas tres palabras lo deja como está. Para sacarlo, se borra ese archivo `.yml`.

**Cómo se junta cada precio con su medida:** por el **código**, nunca por el nombre ni por
la medida. Hay dos códigos en juego:

- el de la lista de Goodyear (`CÓDIGO`, tipo 110372), que es el de proveedor;
- el que trae hoy el reporte de stock (`Código`, tipo 93247357), que es el interno.

El archivo **`data/codigos.csv`** une los dos. Salió del reporte de octubre, que traía las
dos columnas en la misma fila, así que cada par es dato real y no una suposición. Si algún
día el reporte vuelve a traer la columna `Código Provee`, la página la usa directo y el
puente deja de hacer falta: no hay que cambiar nada.

Antes de mostrar un precio se controla que la medida de la lista sea la misma que la del
stock. Y si dos cubiertas distintas terminan apuntando al mismo renglón de la lista,
**ninguna de las dos lleva precio**: es preferible que falte antes que mostrar uno equivocado.

La fecha de vigencia de la lista (`VIGENCIA 13/10/26`) sale sola y se muestra arriba,
al lado de la fecha del stock.

**Cuando el código no coincide:** a veces la misma cubierta tiene un código en el stock
y otro en la lista (código viejo y nuevo). Esos casos se conectan a mano en
`assets/app.js`, en la lista `equivalencias`, que hoy tiene cuatro:

```
'110740': '117315',   // 215/65R16 WRANGLER FORTITUDE HT
'118403': '141066',   // 205/45R17 EAGLE TOURING
'110842': '108303',   // 215/45R16 EFFICIENTGRIP PERFORMANCE
'117861': '142517'    // 225/45R17 EAGLE SPORT 2
```

A la izquierda el código del stock, a la derecha el de la lista. Hay ocho más, de cubiertas
que Goodyear renumeró en la lista de noviembre 2026 (la misma medida y el mismo diseño
pasaron de un código a otro). Si aparece otro caso, pasámelo y lo agrego; ahí también se
controla que la medida coincida, así que no se pueden conectar mal dos cubiertas distintas.

Ojo con esto: cuando Goodyear saca un producto de la lista, esa medida pasa a decir
"Precio a confirmar". No es un error de la página, es que ya no tiene precio de lista.

### Precios de Sportrak y descuentos

Sportrak manda las listas en **PDF**, no en Excel, y sin columna de código. Por eso van en
un archivo aparte, `data/precios_sportrak.csv`, que armo yo con los dos PDF (RUTA y MDP):

```
MEDIDA,DISENO,RUTA,MDP,VIGENCIA
165/70 R13,SP716,73000,75400,11/11/26
```

Se cruza con el stock por **medida + código de diseño** (SP716, SP786...), que es lo único
que traen esas listas. Cuando te llegue la lista nueva, pasame los dos PDF y lo actualizo.
Si cambia un precio suelto, el `.csv` se puede editar directo en GitHub.

**Los descuentos.** En cada ficha de Sportrak el vendedor elige con qué descuento quiere ver
el precio: **Lista** (sin descuento, es lo que aparece al principio), **6+5+5** o **6+5**.

Se aplican **uno atrás del otro, no sumados**: 6+5+5 sobre $ 73.000 da $ 61.930
(73.000 − 6% = 68.620, − 5% = 65.189, − 5% = 61.930), y no $ 61.320 que sería restar 16%
de una. El precio que se copia sale ya con el descuento elegido, y mientras hay un descuento
puesto la etiqueta del bloque lo dice (`RUTA -6+5+5`), para que no haya confusión.

El descuento es **por ficha**: elegirlo en una medida no cambia las demás. Goodyear no lleva
descuentos, así que esas fichas no muestran los botones. Para cambiar los porcentajes o
agregar otra opción, está en `assets/app.js`, en `descuentos`.

**Por qué algunas medidas dicen "Precio a confirmar":**

- No están en la lista Consumer: camión y ómnibus (22.5", 17.5"), agrícolas y cámaras.
- Son productos que no figuran en la lista con su código (modelos viejos o discontinuados).
- SPORTRAK y ROADKING: no tienen lista de precios cargada.
- Son productos nuevos, que todavía no están en `data/codigos.csv`. Pasame un reporte con
  la columna `Código Provee` y se resuelven solos.
- Dos productos distintos apuntan al mismo renglón de la lista. Ahí no se le pone precio a
  ninguno de los dos, para no arriesgar a mostrar el equivocado.

Los precios se muestran redondeados al peso (la lista trae decimales).

---

## 3. Cómo busca el vendedor

Escribe en el buscador y los resultados aparecen al instante. Da lo mismo cómo
escriba la medida:

- `17565` → encuentra 175/65 R14
- `175/65`, `175 65 14`, `175-65-14`, `175/65 r14` → lo mismo
- También busca por diseño (`maxlife`, `wrangler`, `kelly`) o por marca (`roadking`)
- Se pueden combinar: `17565 goodyear`

Además tiene filtro por marca, botón **"Solo con stock"** y orden (medida, marca,
stock o precio).

**Los dos precios se distinguen por color:**
**RUTA = bloque amarillo** · **MDP = bloque negro**, cada uno con su etiqueta.

### Mandar un precio por WhatsApp

Cada precio es un atajo a WhatsApp. Tocando el bloque se manda **solo ese precio**, con el
texto en este orden: **marca, medida, diseño y precio**.

- Tocás el bloque amarillo → `GOODYEAR 175/65 R14 ASSURANCE MAXLIFE 86H XL $ 98.193`
- Tocás el negro → lo mismo pero con el precio MDP

**Con foto.** Las cubiertas Sportrak tienen la foto de su diseño en `assets/cubiertas/`
(`SP716.jpg`, `SP786.jpg`...), recortadas de los dos posters de Sportrak. Cuando el diseño
tiene foto, al tocar el precio aparece un cartelito para elegir **Precio + foto** o
**Solo el precio**.

Con foto usa el menú de compartir del celular, donde el vendedor elige WhatsApp y el
contacto. En una computadora, que no puede compartir archivos así, el botón pasa a decir
**Bajar la foto**: la descarga y deja el precio copiado para adjuntarlo a mano. Si el diseño
no tiene foto, tocar el precio va derecho a WhatsApp como siempre.

Para agregar fotos de otros diseños, se ponen en esa carpeta con el nombre del código
(`SP778.jpg`) y se agregan a la lista `fotos.disenos` en `assets/app.js`.

De esta manera el cliente nunca recibe los dos precios juntos. El precio además queda
**copiado**, por si lo quieren pegar en otro lado, y el bloque avisa **✓ COPIADO** por un
segundo.

En la computadora abre WhatsApp Web en otra pestaña; si no están con la sesión iniciada,
el precio igual quedó copiado. Para volver a que solo copie, sin abrir WhatsApp, está en
`assets/app.js`, en `whatsapp: true`.

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
data/stock.xlsx         ← se reemplaza TODOS LOS DÍAS
data/precios_ruta.xlsx  ← lista RUTA, se reemplaza cuando cambian los precios
data/precios_mdp.xlsx   ← lista MDP, idem
data/codigos.csv        ← puente entre el código del stock y el de la lista de precios
data/precios_sportrak.csv ← precios Sportrak, sacados de sus PDF
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
| Una medida dice *"Precio a confirmar"* | Su código no está en la lista de precios. Mirá la sección "Precios". |
| No se actualizó | Esperá 1 minuto (GitHub tarda en publicar) y recargá. |

Para probar un Excel antes de subirlo, al pie de la página está
**"Probar con un Excel de mi PC"**: lo lee solo en tu navegador, no lo sube a ningún lado.
