/* ===========================================================
   Stock Vulca — buscador de cubiertas
   Lee data/stock.xlsx (o data/stock.csv) y filtra en vivo.
   =========================================================== */
(function () {
  'use strict';

  var CONFIG = {
    xlsx: 'data/stock.xlsx',
    csv: 'data/stock.csv',
    ordenMarcas: ['GOODYEAR', 'SPORTRACK', 'ROADKING'],
    maxRender: 300,
    hojaDemo: '_INSTRUCCIONES'   // mientras exista esta hoja, se avisa que son datos de ejemplo
  };

  /* ---------- helpers de texto ---------- */

  function txt(v) {
    if (v === null || v === undefined) return '';
    return String(v).trim();
  }
  // Mayúsculas sin acentos ni ñ, espacios colapsados
  function norm(v) {
    return txt(v).toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }
  // Solo letras y números (para comparar sin importar / - . espacios)
  function key(v) {
    return norm(v).replace(/[^A-Z0-9]/g, '');
  }
  function digitos(v) {
    return txt(v).replace(/\D/g, '');
  }
  function esc(v) {
    return txt(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- números y precios ---------- */

  // Acepta 118500 · "118.500" · "$ 118.500,50" · "118,500.50"
  function aNumero(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    var s = txt(v).replace(/[^\d.,-]/g, '');
    if (!s) return null;
    var tienePunto = s.indexOf('.') >= 0, tieneComa = s.indexOf(',') >= 0;
    if (tienePunto && tieneComa) {
      // el último separador que aparece es el decimal
      s = s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '');
    } else if (tieneComa) {
      s = /,\d{3}$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
    } else if (tienePunto) {
      // un ".000" al final es separador de miles, no decimal
      s = /\.\d{3}(?:\.\d{3})*$/.test(s) ? s.replace(/\./g, '') : s;
    }
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }

  var fmtPesos = (function () {
    try {
      var f = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
      return function (n) { return '$ ' + f.format(Math.round(n)); };
    } catch (e) {
      return function (n) {
        return '$ ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      };
    }
  })();

  /* ---------- reconocimiento de columnas ---------- */

  var ALIAS = {
    marca:  ['MARCA', 'BRAND', 'FABRICANTE'],
    diseno: ['DISENO', 'DISENIO', 'MODELO', 'DIBUJO', 'PATRON', 'PRODUCTO', 'DESCRIPCION', 'DETALLE', 'ARTICULO'],
    medida: ['MEDIDA', 'MEDIDAS', 'RODADO', 'TAMANO', 'SIZE', 'CUBIERTA', 'NEUMATICO'],
    stock:  ['STOCK', 'CANTIDAD', 'CANT', 'UNIDADES', 'DISPONIBLE', 'DISPONIBILIDAD', 'EXISTENCIA', 'EXISTENCIAS'],
    ruta:   ['PRECIORUTA', 'RUTA', 'PRUTA', 'LISTARUTA', 'PVPRUTA', 'PRECIORUTAS'],
    mdp:    ['PRECIOMDP', 'MDP', 'PMDP', 'LISTAMDP', 'PVPMDP', 'PRECIOMARDELPLATA', 'MARDELPLATA'],
    obs:    ['OBSERVACION', 'OBSERVACIONES', 'OBS', 'NOTA', 'NOTAS', 'COMENTARIO', 'COMENTARIOS']
  };
  var CAMPOS = ['marca', 'diseno', 'medida', 'stock', 'ruta', 'mdp', 'obs'];

  function campoDe(encabezado) {
    var k = key(encabezado);
    if (!k) return null;
    var c, i, lista, j;
    // 1) coincidencia exacta
    for (i = 0; i < CAMPOS.length; i++) {
      c = CAMPOS[i]; lista = ALIAS[c];
      for (j = 0; j < lista.length; j++) if (k === lista[j]) return c;
    }
    // 2) coincidencia parcial (ej. "PRECIO RUTA C/IVA" -> ruta)
    for (i = 0; i < CAMPOS.length; i++) {
      c = CAMPOS[i]; lista = ALIAS[c];
      for (j = 0; j < lista.length; j++) if (k.indexOf(lista[j]) >= 0) return c;
    }
    return null;
  }

  // Busca la fila de encabezados (tolera títulos arriba de la tabla)
  function buscarEncabezado(filas) {
    var limite = Math.min(filas.length, 15);
    for (var r = 0; r < limite; r++) {
      if (!filas[r]) continue;
      var mapa = {}, encontrados = 0;
      for (var c = 0; c < filas[r].length; c++) {
        var campo = campoDe(filas[r][c]);
        if (campo && !(campo in mapa)) { mapa[campo] = c; encontrados++; }
      }
      if ('medida' in mapa && encontrados >= 2) return { fila: r, mapa: mapa };
    }
    return null;
  }

  /* ---------- armado de items ---------- */

  function medidaLinda(v) {
    var m = norm(v).replace(/\s*R\s*(\d)/, ' R$1').replace(/\s*\/\s*/g, '/');
    return m;
  }

  function claveMedida(v) {
    var d = norm(v).match(/(\d{2,3})\s*[\/X.-]?\s*(\d{2,3})?\s*[A-Z]*\s*(\d{2})?/);
    if (!d) return [9999, 9999, 9999];
    return [parseInt(d[1], 10) || 9999, parseInt(d[2], 10) || 0, parseInt(d[3], 10) || 0];
  }

  function armarItem(fila, mapa, marcaHoja) {
    function val(campo) { return campo in mapa ? fila[mapa[campo]] : ''; }

    var medida = txt(val('medida'));
    if (!medida) return null;

    var marca = norm(val('marca')) || norm(marcaHoja);
    var diseno = txt(val('diseno'));
    var stockRaw = val('stock');
    var stockNum = aNumero(stockRaw);
    var it = {
      marca: marca,
      diseno: norm(diseno),
      medida: medidaLinda(medida),
      stockNum: stockNum,
      stockTexto: stockNum === null ? norm(stockRaw) : '',
      ruta: aNumero(val('ruta')),
      mdp: aNumero(val('mdp')),
      obs: norm(val('obs'))
    };
    it.ordenMedida = claveMedida(it.medida);
    it.txt = key(it.marca + it.diseno + it.medida + it.obs);
    it.dig = digitos(it.medida);
    return it;
  }

  /* ---------- lectura del archivo ---------- */

  function filasDeHoja(wb, nombre) {
    if (!wb.Sheets || !wb.Sheets[nombre]) return [];
    return XLSX.utils.sheet_to_json(wb.Sheets[nombre], {
      header: 1, blankrows: false, defval: '', raw: true
    });
  }

  function itemsDeLibro(wb) {
    var items = [], demo = false, hojas = wb.SheetNames || [];
    hojas.forEach(function (nombre) {
      if (key(nombre) === key(CONFIG.hojaDemo)) { demo = true; return; }
      if (/^_/.test(txt(nombre))) return;                 // hojas auxiliares
      var filas = filasDeHoja(wb, nombre);
      var enc = buscarEncabezado(filas);
      if (!enc) return;
      for (var r = enc.fila + 1; r < filas.length; r++) {
        if (!filas[r]) continue;
        var it = armarItem(filas[r], enc.mapa, nombre);
        if (it) items.push(it);
      }
    });
    return { items: items, demo: demo };
  }

  // Parser CSV propio (respaldo si el CDN de SheetJS no carga)
  function parsearCSV(texto) {
    texto = texto.replace(/^﻿/, '');
    var primera = texto.split(/\r?\n/)[0] || '';
    var sep = (primera.split(';').length > primera.split(',').length) ? ';' : ',';
    var filas = [], campo = '', fila = [], enComillas = false;
    for (var i = 0; i < texto.length; i++) {
      var ch = texto[i];
      if (enComillas) {
        if (ch === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; } else enComillas = false;
        } else campo += ch;
      } else if (ch === '"') {
        enComillas = true;
      } else if (ch === sep) {
        fila.push(campo); campo = '';
      } else if (ch === '\n') {
        fila.push(campo); filas.push(fila); fila = []; campo = '';
      } else if (ch !== '\r') {
        campo += ch;
      }
    }
    fila.push(campo);
    if (fila.length > 1 || txt(fila[0])) filas.push(fila);
    return filas.filter(function (f) { return f.some(function (c) { return txt(c) !== ''; }); });
  }

  function itemsDeCSV(texto, marcaPorDefecto) {
    var filas = parsearCSV(texto);
    var enc = buscarEncabezado(filas);
    if (!enc) return [];
    var items = [];
    for (var r = enc.fila + 1; r < filas.length; r++) {
      var it = armarItem(filas[r], enc.mapa, marcaPorDefecto || '');
      if (it) items.push(it);
    }
    return items;
  }

  /* ---------- estado y nodos ---------- */

  var DATOS = [], MARCA_SEL = '', SOLO_STOCK = false, ULTIMO_RENDER = [];
  var $ = function (id) { return document.getElementById(id); };
  var elQ = $('q'), elClear = $('clear'), elBrands = $('brands'), elOnly = $('onlyStock'),
      elSort = $('sort'), elCount = $('count'), elRes = $('results'), elEmpty = $('empty'),
      elCapped = $('capped'), elAlert = $('alert'), elDemo = $('demoNote'), elUpd = $('updated');

  function mostrar(el, html) {
    if (html === undefined) { el.hidden = true; return; }
    el.innerHTML = html; el.hidden = false;
  }

  /* ---------- filtro + orden ---------- */

  function tokens(q) {
    return norm(q).split(/[\s,]+/).map(key).filter(Boolean);
  }

  function coincide(it, toks) {
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (/^\d+$/.test(t)) {
        if (it.dig.indexOf(t) < 0 && it.txt.indexOf(t) < 0) return false;
      } else if (it.txt.indexOf(t) < 0) return false;
    }
    return true;
  }

  function hayStock(it) {
    if (it.stockNum !== null) return it.stockNum > 0;
    if (!it.stockTexto) return true;
    return !/^(NO|SIN|SIN STOCK|0)$/.test(it.stockTexto);
  }

  function idxMarca(m) {
    var i = CONFIG.ordenMarcas.indexOf(m);
    return i < 0 ? CONFIG.ordenMarcas.length : i;
  }

  function cmpMedida(a, b) {
    for (var i = 0; i < 3; i++) {
      if (a.ordenMedida[i] !== b.ordenMedida[i]) return a.ordenMedida[i] - b.ordenMedida[i];
    }
    return a.marca.localeCompare(b.marca);
  }

  function cmpPrecio(campo) {
    return function (a, b) {
      var x = a[campo], y = b[campo];
      if (x === null && y === null) return cmpMedida(a, b);
      if (x === null) return 1;
      if (y === null) return -1;
      return x - y || cmpMedida(a, b);
    };
  }

  function ordenar(lista, modo) {
    var cmp;
    if (modo === 'marca') {
      cmp = function (a, b) { return idxMarca(a.marca) - idxMarca(b.marca) || a.marca.localeCompare(b.marca) || cmpMedida(a, b); };
    } else if (modo === 'stock') {
      cmp = function (a, b) { return (b.stockNum || 0) - (a.stockNum || 0) || cmpMedida(a, b); };
    } else if (modo === 'ruta' || modo === 'mdp') {
      cmp = cmpPrecio(modo);
    } else {
      cmp = cmpMedida;
    }
    // lo que no tiene stock siempre va al final
    return lista.sort(function (a, b) {
      var sa = hayStock(a) ? 0 : 1, sb = hayStock(b) ? 0 : 1;
      return sa - sb || cmp(a, b);
    });
  }

  /* ---------- render ---------- */

  function badgeStock(it) {
    var cls = 'ok', texto;
    if (it.stockNum !== null) {
      if (it.stockNum <= 0) { cls = 'sin'; texto = 'SIN STOCK'; }
      else { cls = it.stockNum <= 4 ? 'bajo' : 'ok'; texto = it.stockNum + ' u.'; }
    } else {
      texto = it.stockTexto || 'CONSULTAR';
      if (!hayStock(it)) cls = 'sin';
    }
    return '<span class="stock stock--' + cls + '">' + esc(texto) + '</span>';
  }

  function bloquePrecio(tipo, valor) {
    var etiqueta = tipo === 'ruta' ? 'RUTA' : 'MDP';
    var cuerpo = valor === null
      ? '<span class="precio__valor precio__valor--vacio">A confirmar</span>'
      : '<span class="precio__valor">' + fmtPesos(valor) + '</span>';
    return '<div class="precio precio--' + tipo + '">' +
             '<span class="precio__tag">' + etiqueta + '</span>' + cuerpo +
           '</div>';
  }

  function tarjeta(it, i) {
    var cab = '<div class="card__head">' +
                '<div class="card__row">' +
                  '<span class="marca">' + esc(it.marca || 'SIN MARCA') + '</span>' +
                  badgeStock(it) +
                '</div>' +
                '<div class="medida">' + esc(it.medida) + '</div>' +
                (it.diseno ? '<div class="diseno">' + esc(it.diseno) + '</div>' : '') +
                (it.obs ? '<div class="obs">' + esc(it.obs) + '</div>' : '') +
              '</div>';

    var precios = '<div class="precios">' +
                    bloquePrecio('ruta', it.ruta) +
                    bloquePrecio('mdp', it.mdp) +
                  '</div>';

    var pie = '<div class="card__foot">' +
                '<button type="button" class="copy" data-i="' + i + '">Copiar</button>' +
              '</div>';

    return '<article class="card' + (hayStock(it) ? '' : ' card--sin') + '">' +
             cab + precios + pie +
           '</article>';
  }

  function render() {
    var toks = tokens(elQ.value);
    var lista = DATOS.filter(function (it) {
      if (MARCA_SEL && it.marca !== MARCA_SEL) return false;
      if (SOLO_STOCK && !hayStock(it)) return false;
      return coincide(it, toks);
    });
    lista = ordenar(lista, elSort.value);
    ULTIMO_RENDER = lista;

    elCount.textContent = lista.length === 1 ? '1 resultado' : lista.length + ' resultados';
    elClear.hidden = !elQ.value;

    if (!lista.length) {
      elRes.innerHTML = '';
      mostrar(elEmpty, '<strong>Sin resultados</strong><span>' +
        (DATOS.length ? 'Probá con menos dígitos, por ejemplo <b>17565</b> o <b>175</b>.'
                      : 'Todavía no se cargó el stock.') + '</span>');
      mostrar(elCapped);
      return;
    }
    elEmpty.hidden = true;

    var visibles = lista.slice(0, CONFIG.maxRender), html = '';
    for (var i = 0; i < visibles.length; i++) html += tarjeta(visibles[i], i);
    elRes.innerHTML = html;

    if (lista.length > CONFIG.maxRender) {
      mostrar(elCapped, 'Mostrando los primeros <strong>' + CONFIG.maxRender + '</strong> de ' +
        lista.length + '. Escribí la medida para filtrar.');
    } else {
      mostrar(elCapped);
    }
  }

  function pintarChips() {
    var vistas = {}, marcas = [];
    DATOS.forEach(function (it) {
      if (it.marca && !vistas[it.marca]) { vistas[it.marca] = 1; marcas.push(it.marca); }
    });
    marcas.sort(function (a, b) { return idxMarca(a) - idxMarca(b) || a.localeCompare(b); });
    var html = '<button type="button" class="chip" data-marca="" aria-pressed="' + (MARCA_SEL === '') + '">Todas</button>';
    marcas.forEach(function (m) {
      html += '<button type="button" class="chip" data-marca="' + esc(m) + '" aria-pressed="' +
              (MARCA_SEL === m) + '">' + esc(m) + '</button>';
    });
    elBrands.innerHTML = html;
  }

  /* ---------- carga ---------- */

  function fechaLinda(str) {
    var d = new Date(str);
    if (isNaN(d.getTime())) return '';
    try {
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
             ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) { return d.toLocaleString(); }
  }

  function aplicar(items, demo, fecha) {
    elAlert.hidden = true;
    DATOS = items;
    MARCA_SEL = '';
    pintarChips();
    mostrar(elDemo);
    if (demo) elDemo.hidden = false;
    elUpd.textContent = fecha ? 'Actualizado ' + fecha : 'Stock cargado';
    render();
  }

  function errorCarga(detalle) {
    elUpd.textContent = 'Sin datos';
    var extra = location.protocol === 'file:'
      ? 'Estás abriendo el archivo directo desde la PC: el navegador no permite leer el Excel así. Subilo a GitHub Pages o usá "Probar con un Excel de mi PC" abajo.'
      : 'Verificá que exista <code>' + CONFIG.xlsx + '</code> en el repositorio.';
    mostrar(elAlert, '<strong>No se pudo cargar el stock.</strong><br>' + extra +
      (detalle ? '<br><small>' + esc(detalle) + '</small>' : ''));
    render();
  }

  function cargar() {
    var sinCache = '?v=' + Date.now();

    function intentarCSV(motivo) {
      fetch(CONFIG.csv + sinCache, { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          var fecha = fechaLinda(r.headers.get('last-modified'));
          return r.text().then(function (t) {
            var items = itemsDeCSV(t, '');
            if (!items.length) throw new Error('El CSV no tiene filas reconocibles');
            aplicar(items, false, fecha);
          });
        })
        .catch(function () { errorCarga(motivo); });
    }

    if (typeof XLSX === 'undefined') { intentarCSV('No se pudo cargar la librería de Excel.'); return; }

    fetch(CONFIG.xlsx + sinCache, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var fecha = fechaLinda(r.headers.get('last-modified'));
        return r.arrayBuffer().then(function (buf) {
          var wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
          var res = itemsDeLibro(wb);
          if (!res.items.length) throw new Error('No se reconocieron columnas (falta MEDIDA).');
          aplicar(res.items, res.demo, fecha);
        });
      })
      .catch(function (e) { intentarCSV(e && e.message ? e.message : 'Error de lectura'); });
  }

  /* ---------- archivo local (solo para probar) ---------- */

  function leerLocal(file) {
    var fr = new FileReader();
    var esCSV = /\.csv$/i.test(file.name);
    fr.onload = function () {
      try {
        var items, demo = false;
        if (esCSV) {
          items = itemsDeCSV(String(fr.result), '');
        } else {
          var wb = XLSX.read(new Uint8Array(fr.result), { type: 'array' });
          var res = itemsDeLibro(wb);
          items = res.items; demo = res.demo;
        }
        if (!items.length) { mostrar(elAlert, '<strong>El archivo no tiene columnas reconocibles.</strong> Hace falta al menos una columna MEDIDA.'); return; }
        elAlert.hidden = true;
        aplicar(items, demo, fechaLinda(file.lastModified));
      } catch (e) {
        mostrar(elAlert, '<strong>No se pudo leer el archivo.</strong> ' + esc(e.message || ''));
      }
    };
    fr.onerror = function () { mostrar(elAlert, '<strong>No se pudo leer el archivo.</strong>'); };
    if (esCSV) fr.readAsText(file); else fr.readAsArrayBuffer(file);
  }

  /* ---------- eventos ---------- */

  elQ.addEventListener('input', render);
  elOnly.addEventListener('click', function () {
    SOLO_STOCK = !SOLO_STOCK;
    elOnly.setAttribute('aria-pressed', SOLO_STOCK ? 'true' : 'false');
    render();
  });
  elSort.addEventListener('change', render);
  elClear.addEventListener('click', function () { elQ.value = ''; elQ.focus(); render(); });

  elBrands.addEventListener('click', function (ev) {
    var b = ev.target.closest('.chip');
    if (!b) return;
    var m = b.getAttribute('data-marca') || '';
    MARCA_SEL = (MARCA_SEL === m) ? '' : m;
    pintarChips();
    render();
  });

  elRes.addEventListener('click', function (ev) {
    var b = ev.target.closest('.copy');
    if (!b) return;
    var it = ULTIMO_RENDER[parseInt(b.getAttribute('data-i'), 10)];
    if (!it) return;
    var partes = [it.marca, it.diseno, it.medida].filter(Boolean).join(' ');
    var texto = partes +
      '\nRUTA: ' + (it.ruta === null ? 'a confirmar' : fmtPesos(it.ruta)) +
      '\nMDP: ' + (it.mdp === null ? 'a confirmar' : fmtPesos(it.mdp)) +
      '\nStock: ' + (it.stockNum !== null ? it.stockNum : (it.stockTexto || 'consultar'));
    var ok = function () {
      b.classList.add('ok'); b.textContent = '✓ Copiado';
      setTimeout(function () { b.classList.remove('ok'); b.textContent = 'Copiar'; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, function () { copiarViejo(texto, ok); });
    } else copiarViejo(texto, ok);
  });

  function copiarViejo(texto, ok) {
    var ta = document.createElement('textarea');
    ta.value = texto; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { /* nada */ }
    document.body.removeChild(ta);
  }

  $('localFile').addEventListener('change', function (ev) {
    if (ev.target.files && ev.target.files[0]) leerLocal(ev.target.files[0]);
  });

  cargar();
})();
