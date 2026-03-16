// Mock holiday data service - In production, this would integrate with Nager.Date, Calendarific, or government APIs

export interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'regional' | 'local' | 'company';
  region?: string;
  recurring: boolean;
  moveable?: boolean;
}

export interface RegionalCalendar {
  country: string;
  region: string;
  year: number;
  holidays: Holiday[];
  source: string;
  lastUpdated: string;
}

// Spain Regional Calendars
const SPAIN_NATIONAL_2025: Holiday[] = [
  { date: '2025-01-01', name: 'New Year\'s Day', type: 'national', recurring: true },
  { date: '2025-01-06', name: 'Epiphany', type: 'national', recurring: true },
  { date: '2025-04-18', name: 'Good Friday', type: 'national', recurring: true, moveable: true },
  { date: '2025-05-01', name: 'Labour Day', type: 'national', recurring: true },
  { date: '2025-08-15', name: 'Assumption of Mary', type: 'national', recurring: true },
  { date: '2025-10-12', name: 'Spanish National Day', type: 'national', recurring: true },
  { date: '2025-11-01', name: 'All Saints\' Day', type: 'national', recurring: true },
  { date: '2025-12-06', name: 'Constitution Day', type: 'national', recurring: true },
  { date: '2025-12-08', name: 'Immaculate Conception', type: 'national', recurring: true },
  { date: '2025-12-25', name: 'Christmas Day', type: 'national', recurring: true }
];

const CATALONIA_REGIONAL_2025: Holiday[] = [
  { date: '2025-04-21', name: 'Easter Monday', type: 'regional', region: 'Catalonia', recurring: true, moveable: true },
  { date: '2025-06-24', name: 'Sant Joan', type: 'regional', region: 'Catalonia', recurring: true },
  { date: '2025-09-11', name: 'Diada de Catalunya', type: 'regional', region: 'Catalonia', recurring: true },
  { date: '2025-12-26', name: 'Sant Esteve', type: 'regional', region: 'Catalonia', recurring: true }
];

const BARCELONA_LOCAL_2025: Holiday[] = [
  { date: '2025-09-24', name: 'La Mercè', type: 'local', region: 'Barcelona', recurring: true }
];

const MADRID_REGIONAL_2025: Holiday[] = [
  { date: '2025-03-19', name: 'Saint Joseph', type: 'regional', region: 'Madrid', recurring: true },
  { date: '2025-04-21', name: 'Easter Monday', type: 'regional', region: 'Madrid', recurring: true, moveable: true },
  { date: '2025-05-02', name: 'Community of Madrid Day', type: 'regional', region: 'Madrid', recurring: true },
  { date: '2025-05-15', name: 'San Isidro', type: 'local', region: 'Madrid', recurring: true }
];

const ANDALUSIA_REGIONAL_2025: Holiday[] = [
  { date: '2025-02-28', name: 'Andalusia Day', type: 'regional', region: 'Andalusia', recurring: true },
  { date: '2025-04-17', name: 'Maundy Thursday', type: 'regional', region: 'Andalusia', recurring: true, moveable: true }
];

const BASQUE_REGIONAL_2025: Holiday[] = [
  { date: '2025-03-19', name: 'Saint Joseph', type: 'regional', region: 'Basque Country', recurring: true },
  { date: '2025-04-17', name: 'Maundy Thursday', type: 'regional', region: 'Basque Country', recurring: true, moveable: true },
  { date: '2025-04-21', name: 'Easter Monday', type: 'regional', region: 'Basque Country', recurring: true, moveable: true },
  { date: '2025-07-25', name: 'Santiago Apostle', type: 'regional', region: 'Basque Country', recurring: true },
  { date: '2025-10-25', name: 'Basque Country Day', type: 'regional', region: 'Basque Country', recurring: true }
];

// UK Regional Calendars
const UK_NATIONAL_2025: Holiday[] = [
  { date: '2025-01-01', name: 'New Year\'s Day', type: 'national', recurring: true },
  { date: '2025-04-18', name: 'Good Friday', type: 'national', recurring: true, moveable: true },
  { date: '2025-04-21', name: 'Easter Monday', type: 'national', recurring: true, moveable: true },
  { date: '2025-05-05', name: 'Early May Bank Holiday', type: 'national', recurring: false, moveable: true },
  { date: '2025-05-26', name: 'Spring Bank Holiday', type: 'national', recurring: false, moveable: true },
  { date: '2025-08-25', name: 'Summer Bank Holiday', type: 'national', recurring: false, moveable: true },
  { date: '2025-12-25', name: 'Christmas Day', type: 'national', recurring: true },
  { date: '2025-12-26', name: 'Boxing Day', type: 'national', recurring: true }
];

// USA Federal Holidays
const USA_FEDERAL_2025: Holiday[] = [
  { date: '2025-01-01', name: 'New Year\'s Day', type: 'national', recurring: true },
  { date: '2025-01-20', name: 'Martin Luther King Jr. Day', type: 'national', recurring: false, moveable: true },
  { date: '2025-02-17', name: 'Presidents\' Day', type: 'national', recurring: false, moveable: true },
  { date: '2025-05-26', name: 'Memorial Day', type: 'national', recurring: false, moveable: true },
  { date: '2025-07-04', name: 'Independence Day', type: 'national', recurring: true },
  { date: '2025-09-01', name: 'Labor Day', type: 'national', recurring: false, moveable: true },
  { date: '2025-10-13', name: 'Columbus Day', type: 'national', recurring: false, moveable: true },
  { date: '2025-11-11', name: 'Veterans Day', type: 'national', recurring: true },
  { date: '2025-11-27', name: 'Thanksgiving', type: 'national', recurring: false, moveable: true },
  { date: '2025-12-25', name: 'Christmas Day', type: 'national', recurring: true }
];

export const REGIONAL_CALENDARS: Record<string, RegionalCalendar> = {
  'Spain-Catalonia': {
    country: 'Spain',
    region: 'Catalonia',
    year: 2025,
    holidays: [...SPAIN_NATIONAL_2025, ...CATALONIA_REGIONAL_2025],
    source: 'Spanish Government Open Data',
    lastUpdated: '2024-11-01'
  },
  'Spain-Catalonia-Barcelona': {
    country: 'Spain',
    region: 'Catalonia (Barcelona)',
    year: 2025,
    holidays: [...SPAIN_NATIONAL_2025, ...CATALONIA_REGIONAL_2025, ...BARCELONA_LOCAL_2025],
    source: 'Spanish Government Open Data + Barcelona Municipality',
    lastUpdated: '2024-11-01'
  },
  'Spain-Madrid': {
    country: 'Spain',
    region: 'Madrid',
    year: 2025,
    holidays: [...SPAIN_NATIONAL_2025, ...MADRID_REGIONAL_2025],
    source: 'Spanish Government Open Data',
    lastUpdated: '2024-11-01'
  },
  'Spain-Andalusia': {
    country: 'Spain',
    region: 'Andalusia',
    year: 2025,
    holidays: [...SPAIN_NATIONAL_2025, ...ANDALUSIA_REGIONAL_2025],
    source: 'Spanish Government Open Data',
    lastUpdated: '2024-11-01'
  },
  'Spain-Basque Country': {
    country: 'Spain',
    region: 'Basque Country',
    year: 2025,
    holidays: [...SPAIN_NATIONAL_2025, ...BASQUE_REGIONAL_2025],
    source: 'Spanish Government Open Data',
    lastUpdated: '2024-11-01'
  },
  'United Kingdom-England': {
    country: 'United Kingdom',
    region: 'England',
    year: 2025,
    holidays: UK_NATIONAL_2025,
    source: 'UK Government',
    lastUpdated: '2024-11-01'
  },
  'United States-Federal': {
    country: 'United States',
    region: 'Federal',
    year: 2025,
    holidays: USA_FEDERAL_2025,
    source: 'US Office of Personnel Management',
    lastUpdated: '2024-11-01'
  }
};

export function getRegionalCalendar(country: string, region: string, city?: string): RegionalCalendar | null {
  // Try with city first
  if (city) {
    const withCity = REGIONAL_CALENDARS[`${country}-${region}-${city}`];
    if (withCity) return withCity;
  }
  
  // Fall back to region
  const withRegion = REGIONAL_CALENDARS[`${country}-${region}`];
  return withRegion || null;
}

export const COUNTRIES_WITH_REGIONS = {
  'Spain': ['Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country', 'Canary Islands', 'Cantabria', 'Castile and León', 'Castile-La Mancha', 'Catalonia', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarre', 'Valencia'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'United States': ['Federal', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
  'Germany': ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'],
  'France': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Brittany', 'Grand Est', 'Pays de la Loire', 'Hauts-de-France', 'Normandy', 'Bourgogne-Franche-Comté', 'Centre-Val de Loire', 'Corsica']
};

export const CITIES_WITH_LOCAL_HOLIDAYS: Record<string, string[]> = {
  'Spain-Catalonia': ['Barcelona', 'Girona', 'Tarragona', 'Lleida'],
  'Spain-Madrid': ['Madrid City'],
  'Spain-Andalusia': ['Seville', 'Málaga', 'Granada', 'Córdoba']
};