
export const COUNTRIES = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'USA', code: '+1', flag: '🇺🇸' },
  { name: 'UK', code: '+44', flag: '🇬🇧' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
];

export const CHARGER_TYPES = [
  'Type 1 (J1772)',
  'Type 2 (Mennekes)',
  'CCS1',
  'CCS2',
  'CHAdeMO',
  'Tesla Supercharger',
  'NACS'
];

interface BrandInfo {
  name: string;
  logo: string;
  models: string[];
}

export const FOUR_WHEELER_BRANDS: BrandInfo[] = [
  { name: 'Tata Motors', logo: 'https://p7.hiclipart.com/preview/806/783/714/5bbc0b39bf229.jpg', models: ['Nexon EV', 'Tiago EV', 'Punch EV', 'Tigor EV'] },
  { name: 'Hyundai', logo: 'https://www.hyundai.com/static/images/logo.png', models: ['IONIQ 5', 'Kona Electric'] },
  { name: 'Kia', logo: 'https://i.pinimg.com/736x/50/fa/1e/50fa1e9ae66d7c0aa547b8f50918b258.jpg', models: ['EV6'] },
  { name: 'Morris Garages', logo: 'https://e7.pngegg.com/pngimages/487/511/png-clipart-mg-logo-illustration-car-logo-mg-icons-logos-emojis-car-logos-thumbnail.png', models: ['ZS EV', 'Comet EV'] },
  { name: 'Volkswagen', logo: 'https://www.volkswagen.co.in/content/dam/vw-ngw/vw_pkw/global/navigation/logo/logo-volkswagen.svg', models: ['ID.4'] },
  { name: 'Jaguar', logo: 'https://www.jaguar.in/content/dam/jaguar/india/logo/jaguar-logo.png', models: ['I-PACE'] },
  { name: 'Nissan', logo: 'https://www.hiclipart.com/free-transparent-background-png-clipart-omrbh', models: ['Leaf'] },
  { name: 'Tesla', logo: 'https://www.tesla.com/themes/custom/tesla_frontend/assets/img/logo.svg', models: ['Model 3', 'Model Y'] },
];

export const TWO_WHEELER_BRANDS: BrandInfo[] = [
  { name: 'Ola', logo: 'https://olaelectric.com/assets/images/ola-logo.svg', models: ['S1 Pro', 'S1 Air', 'S1 X'] },
  { name: 'Ampere', logo: 'https://amperevehicles.com/assets/images/logo.png', models: ['Primus', 'Magnus EX'] },
  { name: 'Bajaj', logo: 'https://www.bajajauto.com/-/media/assets/bajajauto/logo/bajaj-logo.png', models: ['Chetak Premium', 'Chetak Urbane'] },
  { name: 'Ather Energy', logo: 'https://www.atherenergy.com/assets/images/ather-logo.svg', models: ['450X', '450S', 'Apex'] },
  { name: 'TVS', logo: 'https://www.tvsmotor.com/tvsmotor/assets/images/logo.png', models: ['iQube S', 'iQube ST', 'X'] },
  { name: 'Simple Energy', logo: 'https://simpleenergy.in/static/media/simple-logo.8e5a7d6e.svg', models: ['One', 'Dot One'] },
  { name: 'Okinawa Autotech', logo: 'https://okinawascooters.com/wp-content/uploads/2021/03/logo.png', models: ['Praise Pro', 'IPraise+', 'Okhi-90'] },
  { name: 'Revolt Motors', logo: 'https://revoltmotors.com/assets/images/logo.png', models: ['RV400', 'RV400 BRZ'] },
  { name: 'Vida', logo: 'https://www.vidaworld.com/content/dam/vida/india/vida-logo.png', models: ['V1 Pro', 'V1 Plus'] },
];
