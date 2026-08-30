# AnimeArts Audio Novelas — Biblioteca

Catálogo web estático (HTML + CSS + JavaScript, sin frameworks) para
las audionovelas crossover de anime/videojuegos publicadas en
Patreon. No reproduce audio: cada tarjeta lleva al oyente a la
colección correspondiente en Patreon.

```
/
├── index.html
├── style.css
├── script.js
├── novelas.json      ← toda la información del catálogo vive acá
├── README.md
└── img/
    ├── logo/          (favicon)
    ├── covers/        (portadas, formato vertical 2:3)
    └── banners/       (imágenes anchas opcionales para el modal)
```

## Cómo verlo funcionando

Como `script.js` carga `novelas.json` con `fetch()`, el sitio necesita
servirse por http/https — **no funciona abriendo `index.html` con
doble clic** desde el explorador de archivos (el navegador bloquea esa
carga por seguridad, CORS).

- **Ya subido a GitHub Pages**: funciona directo, sin nada que
  configurar, porque se sirve por https.
- **Probarlo en tu compu antes de subirlo**: abre una consola en la
  carpeta del sitio y corre:
  ```
  python -m http.server 8000
  ```
  y entra a `http://localhost:8000` en el navegador.

## 1. Cómo agregar una novela nueva

No se toca el HTML ni el CSS. Basta con abrir `novelas.json` y agregar
un nuevo objeto al final de la lista (recuerda la coma antes de la
llave `{` si no es el último elemento):

```json
{
  "title": "Nombre de tu novela",
  "synopsis": "Un párrafo que resume la historia (aparece en el modal de detalle).",
  "chapters": 12,
  "fandoms": ["Fate", "DxD"],
  "mature": false,
  "cover": "img/covers/nombre-archivo.jpg",
  "banner": "img/banners/nombre-archivo.jpg",
  "link": "https://www.patreon.com/collection/xxxxxxx"
}
```

Campos:

- **title**: título tal cual quieres que se vea.
- **synopsis**: texto del modal de detalle. Si lo dejas vacío
  (`""`), se muestra "Sinopsis pendiente de agregar."
- **chapters**: número de capítulos (solo el número).
- **fandoms**: lista de universos/franquicias involucrados en el
  crossover. Puede tener uno o varios (ej. `["Fate", "DxD"]`). Los 10
  fandoms con chip propio en la barra de filtros están definidos en
  `QUICK_FANDOMS` al inicio de `script.js` — si agregas muchas
  novelas de un fandom nuevo que no está en esa lista, puedes
  agregarlo ahí (es la única vez que tocarías `script.js` para esto).
  Si `fandoms` queda vacío (`[]`), la novela aparece bajo el filtro
  "Otros universos".
- **mature**: `true` o `false`. Si es `true`, la tarjeta muestra una
  insignia roja "+18" y la novela aparece al usar ese filtro.
- **cover**: ruta a la portada, formato vertical 2:3 (por ejemplo
  800×1200 px). Si la dejas vacía (`""`), la tarjeta muestra un fondo
  generado automáticamente (gradiente + "waveform") coloreado según
  el fandom — se ve prolijo incluso sin portada real.
- **banner**: ruta a una imagen ancha (por ejemplo 1200×500 px) que
  se usa como fondo del modal de detalle. Es opcional — si la dejas
  vacía, el modal usa la misma portada (o el mismo fondo generado) que
  la tarjeta.
- **link**: URL de la colección en Patreon. Si la dejas vacía, el
  botón "Escuchar en Patreon" usa el link general del canal en vez de
  uno específico.

En cuanto guardes el archivo y recargues la página, la novela aparece
automáticamente en el catálogo, el buscador, los filtros y el orden.

## 2. Cómo cambiar el logo

El logo actual (el círculo con el anillo de colores en el header) está
dibujado en CSS puro, en el bloque `.brand-mark` de `style.css` — no
usa ningún archivo de imagen. Si quieres reemplazarlo por un logo real:

1. Guarda tu logo en `img/logo/` (svg, png o webp).
2. En `index.html`, reemplaza:
   ```html
   <div class="brand-mark"></div>
   ```
   por:
   ```html
   <img src="img/logo/tu-logo.png" alt="AnimeArts Audio Novelas" width="52" height="52" style="border-radius:50%;">
   ```
3. Puedes borrar el bloque `.brand-mark` de `style.css` si ya no lo
   usas.

El favicon (ícono de la pestaña del navegador) está en
`img/logo/favicon.svg` y se referencia en el `<head>` de `index.html`
— reemplázalo por el tuyo cuando tengas uno.

## 3. Cómo cambiar los colores

Todos los colores del sitio están centralizados como variables al
inicio de `style.css`:

```css
:root{
  --bg: #120e1a;          /* fondo general */
  --surface: #1d1630;     /* tarjetas, buscador, chips */
  --line: #322850;        /* bordes y separadores */
  --ink: #f3ede4;         /* texto principal */
  --ink-dim: #b9aecf;     /* texto secundario */
  --amber: #f2a541;       /* color de acento (capítulos, logo) */
  --rift: #8f6bff;        /* color principal (chips activos, foco) */
  --rift-2: #4fd5e0;      /* color secundario (eyebrow, links) */
  --mature: #e2566b;      /* insignia +18 */
  --patreon: #e0384f;     /* botones de Patreon */
}
```

Cambia estos valores y todo el sitio se actualiza automáticamente, ya
que ningún color está escrito directamente en otro lugar del CSS.

## 4. Cómo cambiar las imágenes (portadas y banners)

- **Portadas** (`cover`): formato vertical, relación de aspecto **2:3**
  (por ejemplo 800×1200 px). Se muestran en la tarjeta del catálogo y
  como fondo del modal si no hay banner.
- **Banners** (`banner`): formato horizontal ancho (por ejemplo
  1200×500 px). Opcional — solo se usa en el modal de detalle.
- Guarda los archivos en `img/covers/` y `img/banners/`
  respectivamente, y apunta a ellos desde `novelas.json` con la ruta
  relativa (ej. `"cover": "img/covers/mi-novela.jpg"`).
- Todas las portadas usan `loading="lazy"`, así que no se descargan
  hasta que el usuario se acerca a ellas al hacer scroll — el sitio
  aguanta cientos de portadas sin problema.

## 5. Buscador, filtros y orden

Ya vienen listos y funcionan solos con lo que haya en `novelas.json`:

- El buscador busca coincidencias en título, sinopsis y fandoms.
- Los filtros de fandom son chips (botones), no un dropdown — los 10
  más comunes están fijos en `QUICK_FANDOMS` (script.js), más
  "Otros universos" para el resto, más el filtro "+18".
- El orden admite: orden original del catálogo, A–Z, o más capítulos
  primero.

## Créditos

Todas las historias se narran y publican en Patreon:
https://www.patreon.com/c/AnimeFicsArts?vanity=user
