/**
 * TEMA PROFESSIONAL — YeferTasks
 * Paleta pastel vivid, sombras y tokens de diseño centralizados.
 */

export const colores = {
  fondo: '#F5F6FA',
  fondoAcento: '#EEF0F7',
  tarjeta: '#FFFFFF',
  divisor: '#E4E7EE',

  primario: '#7C6CF8',
  primarioOscuro: '#5A4FD4',
  primarioSuave: '#EDEBFF',
  primarioBorde: '#C4BBFE',

  texto: '#1E293B',
  textoSecundario: '#64748B',

  pagoTexto: '#4E7CFF',
  pagoFondo: '#E8F0FF',
  pagoBorde: '#B8D4FE',

  tareaTexto: '#10B981',
  tareaFondo: '#D1FAE5',
  tareaBorde: '#6EE7B7',

  ingresoTexto: '#0D9488',
  ingresoFondo: '#CCFBF1',
  ingresoBorde: '#5EEAD4',

  moraTexto: '#DC2626',
  moraFondo: '#FEE2E2',
  moraBorde: '#FCA5A5',

  completadoTexto: '#16A34A',
  completadoFondo: '#DCFCE7',
  completadoBorde: '#86EFAC',

  advertenciaTexto: '#D97706',
  advertenciaFondo: '#FEF3C7',
  advertenciaBorde: '#FCD34D',

  peligroTexto: '#DC2626',
  peligroFondo: '#FEE2E2',
  peligroBorde: '#FCA5A5',

  cuotaTexto: '#8B5CF6',
  cuotaFondo: '#F3E8FF',
  cuotaBorde: '#C4B5FD',

  skeleton: '#E8EAF0',

  sombra: '#000000',
} as const;

export const sombras = {
  sm: {
    shadowColor: colores.sombra,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colores.sombra,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: colores.sombra,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const tipografia = {
  logo: {fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.5},
  montoGrande: {fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5},
  tituloPantalla: {fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3},
  tituloSeccion: {fontSize: 18, fontWeight: '700' as const},
  cuerpo: {fontSize: 16, fontWeight: '400' as const},
  cuerpoNegrita: {fontSize: 16, fontWeight: '700' as const},
  caption: {fontSize: 13, fontWeight: '500' as const},
  badge: {fontSize: 11, fontWeight: '700' as const},
} as const;

export const espaciado = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
} as const;

export const radios = {
  tarjeta: 16,
  chip: 999,
  boton: 14,
  botonGrande: 16,
} as const;
