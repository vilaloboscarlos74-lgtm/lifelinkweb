// CDMX y Estado de México — alcaldías y municipios del Valle de México

export const ESTADOS_AREA = ['Ciudad de México', 'Estado de México'];

export const ALCALDIAS_CDMX = [
  'Álvaro Obregón',
  'Azcapotzalco',
  'Benito Juárez',
  'Coyoacán',
  'Cuajimalpa de Morelos',
  'Cuauhtémoc',
  'Gustavo A. Madero',
  'Iztacalco',
  'Iztapalapa',
  'La Magdalena Contreras',
  'Miguel Hidalgo',
  'Milpa Alta',
  'Tláhuac',
  'Tlalpan',
  'Venustiano Carranza',
  'Xochimilco',
];

export const MUNICIPIOS_EDOMEX = [
  'Amecameca',
  'Atizapán de Zaragoza',
  'Chalco',
  'Chicoloapan',
  'Chimalhuacán',
  'Coacalco de Berriozábal',
  'Cuautitlán',
  'Cuautitlán Izcalli',
  'Ecatepec de Morelos',
  'Huixquilucan',
  'Ixtapaluca',
  'La Paz',
  'Los Reyes La Paz',
  'Metepec',
  'Naucalpan de Juárez',
  'Nezahualcóyotl',
  'Nicolás Romero',
  'Tecámac',
  'Texcoco',
  'Tlalnepantla de Baz',
  'Toluca',
  'Tultepec',
  'Tultitlán',
  'Valle de Chalco Solidaridad',
  'Zinacantepec',
  'Zumpango',
];

export const MUNICIPIOS_POR_ESTADO = {
  'Ciudad de México': ALCALDIAS_CDMX,
  'Estado de México': MUNICIPIOS_EDOMEX,
};

/** Lista plana con todas las alcaldías/municipios para usar en filtros */
export const TODAS_LAS_ZONAS = [
  ...ALCALDIAS_CDMX,
  ...MUNICIPIOS_EDOMEX,
].sort((a, b) => a.localeCompare(b, 'es'));
