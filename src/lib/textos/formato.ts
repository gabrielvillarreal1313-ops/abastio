/**
 * formato.ts — Funciones centralizadas de formato para el dashboard.
 *
 * Todo el dashboard debe usar estas funciones en vez de formatters locales.
 * Esto garantiza consistencia visual (mismos separadores, decimales, sufijos).
 */

/**
 * Formato completo de moneda mexicana: "$1,234,567 MXN"
 * Redondea a enteros (sin centavos en dashboards).
 */
export function formatMXN(valor: number): string {
  return '$' + Math.round(valor).toLocaleString('en-US') + ' MXN';
}

/**
 * Formato abreviado para valores grandes: "$12.3M MXN"
 * Usa formato completo para valores < 1M.
 */
export function formatMXNCorto(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) {
    return '$' + (valor / 1_000_000).toFixed(1) + 'M MXN';
  }
  return formatMXN(valor);
}

/**
 * Formato para tablas: "$4.38M" (sin "MXN", más compacto).
 * Valores < 1M se muestran como "$123,456".
 */
export function formatMXNTabla(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) {
    return '$' + (valor / 1_000_000).toFixed(2) + 'M';
  }
  return '$' + Math.round(valor).toLocaleString('en-US');
}

/**
 * Formato para ejes de gráficas: "$12M" (sin decimales).
 */
export function formatMXNEje(valor: number): string {
  if (valor === 0) return '$0';
  return '$' + (valor / 1_000_000).toFixed(0) + 'M';
}

/**
 * Formato de porcentaje con 1 decimal: "23.5%"
 */
export function formatPct(valor: number): string {
  return valor.toFixed(1) + '%';
}

/**
 * Formato de porcentaje para ejes: "25%"
 */
export function formatPctEje(valor: number): string {
  return valor + '%';
}

/**
 * Formato de unidades con separador de miles: "1,234"
 */
export function formatUnidades(valor: number): string {
  return Math.round(valor).toLocaleString('en-US');
}

/**
 * Formato de porcentaje con signo: "+5.2%" o "-3.1%"
 */
export function formatCambioPct(valor: number): string {
  const signo = valor >= 0 ? '+' : '';
  return signo + valor.toFixed(1) + '%';
}

/**
 * Formatea un mes a partir de un string "YYYY-MM-DD" o Date.
 *
 * NO usa `new Date(string).toLocaleDateString()` porque eso introduce
 * bugs de zona horaria — "2026-04-01" se interpreta como UTC medianoche
 * y al convertirse a hora local mexicana (UTC-6) retrocede al 31 de marzo.
 * Esta función parsea año y mes directamente del string.
 *
 * @returns Mes y año en español: "abril 2026"
 */
export function formatearMesAnio(fecha: string | Date | null | undefined): string {
  if (!fecha) return '';

  let anio: number;
  let mes: number; // 1-12

  if (typeof fecha === 'string') {
    const partes = fecha.slice(0, 10).split('-');
    if (partes.length !== 3) return '';
    anio = parseInt(partes[0], 10);
    mes = parseInt(partes[1], 10);
  } else {
    anio = fecha.getFullYear();
    mes = fecha.getMonth() + 1;
  }

  if (isNaN(anio) || isNaN(mes) || mes < 1 || mes > 12) return '';

  const nombresMeses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  return `${nombresMeses[mes - 1]} ${anio}`;
}

/**
 * Retorna tiempo transcurrido desde una fecha como "hace 5 minutos".
 * Usa Date para comparar instantes — esto NO sufre del bug de timezone porque
 * no formateamos como string de fecha, solo calculamos diferencia en ms.
 */
export function tiempoRelativo(fecha: string | Date): string {
  const ms = Date.now() - new Date(fecha).getTime();
  const segundos = Math.floor(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (segundos < 60) return 'hace unos segundos';
  if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  if (dias < 30) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  return 'hace más de un mes';
}

/**
 * Formatea fecha + hora en español: "12 de abril, 2026 a las 14:30".
 * Parsea componentes manualmente del string ISO para evitar bug de timezone.
 */
export function formatearFechaHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return '';

  let anio: number, mes: number, dia: number, hora: number, minuto: number;

  if (typeof fecha === 'string') {
    const partes = fecha.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!partes) return '';
    anio = parseInt(partes[1], 10);
    mes = parseInt(partes[2], 10);
    dia = parseInt(partes[3], 10);
    hora = parseInt(partes[4], 10);
    minuto = parseInt(partes[5], 10);
  } else {
    anio = fecha.getFullYear();
    mes = fecha.getMonth() + 1;
    dia = fecha.getDate();
    hora = fecha.getHours();
    minuto = fecha.getMinutes();
  }

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  return `${dia} de ${meses[mes - 1]}, ${anio} a las ${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
}

/**
 * Formatea una duración en horas decimales a una cadena legible
 * que adapta la unidad según la magnitud.
 *
 * - null → "—"
 * - < 1 hora → "X min" (minutos enteros)
 * - 1 a 24 horas → "X.Y hrs" (un decimal)
 * - > 24 horas → "X.Y días" (un decimal)
 *
 * @example
 * formatearDuracionHoras(null)  // "—"
 * formatearDuracionHoras(0.05)  // "3 min"
 * formatearDuracionHoras(0.5)   // "30 min"
 * formatearDuracionHoras(1.5)   // "1.5 hrs"
 * formatearDuracionHoras(23.9)  // "23.9 hrs"
 * formatearDuracionHoras(25)    // "1.0 días"
 * formatearDuracionHoras(72.5)  // "3.0 días"
 */
export function formatearDuracionHoras(horas: number | null): string {
  if (horas === null || horas === undefined || Number.isNaN(horas)) {
    return '—';
  }
  if (horas < 1) {
    const minutos = Math.round(horas * 60);
    return `${minutos} min`;
  }
  if (horas < 24) {
    return `${horas.toFixed(1)} hrs`;
  }
  const dias = horas / 24;
  return `${dias.toFixed(1)} días`;
}
