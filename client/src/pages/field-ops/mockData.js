export const missionData = {
  zone: 'Sector 7 - North Ridge',
  park: 'Khao Yai National Park',
  temperature: '35C',
  distanceKm: 8.4,
  eta: '2h 15m',
};

export const statData = [
  { id: 'gps', label: 'GPS Signal', value: 'Strong', tone: 'text-emerald-400' },
  { id: 'battery', label: 'Battery', value: '85%', tone: 'text-amber-300' },
  { id: 'network', label: 'Network', value: '4G Stable', tone: 'text-sky-300' },
];

export const taskData = [
  {
    id: 1,
    title: 'Inspect perimeter fence',
    objective: 'Check for damaged fence segments and signs of intrusion.',
    destination: 'Northern Perimeter Gate 2',
    zone: 'Northern Sector A',
    coordinate: '14.442100, 101.376200',
    eta: '25 MIN',
    time: 'Due 10:00',
    completed: false,
    priority: 'High',
  },
  {
    id: 2,
    title: 'Morning briefing sync',
    objective: 'Confirm weather risk, route changes, and radio channels.',
    destination: 'Ridge 7 Patrol Hut',
    zone: 'Eastern Valley',
    coordinate: '14.435800, 101.380500',
    eta: '15 MIN',
    time: 'Completed 07:30',
    completed: true,
    priority: 'Medium',
  },
  {
    id: 3,
    title: 'Water source quality check',
    objective: 'Collect water sample and report wildlife activity nearby.',
    destination: 'Creek Delta station',
    zone: 'Eastern Valley',
    coordinate: '14.445300, 101.381000',
    eta: '40 MIN',
    time: 'Due 13:00',
    completed: false,
    priority: 'Medium',
  },
  {
    id: 4,
    title: 'Camera trap battery replacement',
    objective: 'Replace battery and verify image capture status.',
    destination: 'Zone C camera #4',
    zone: 'Western Perimeter',
    coordinate: '14.429100, 101.361900',
    eta: '55 MIN',
    time: 'Due 15:30',
    completed: false,
    priority: 'High',
  },
];

export const incidentTemplates = [
  { id: 'wildlife', label: 'Wildlife Sighting' },
  { id: 'poaching', label: 'Poaching Alert' },
  { id: 'fire', label: 'Fire Risk' },
  { id: 'damage', label: 'Infrastructure Damage' },
];

// mockData.js
// mockData.js
// mockData.js
export const mapPoints = [
  {
    id: 'pt-01',
    name: 'Sector Alpha Outpost',
    type: 'Outpost',
    zone: 'North Ridge',
    riskLevel: 'Low',
    distanceKm: '2.4',
    eta: '45 MIN',
    position: [14.4386, 101.3724], // พิกัดโซนเขาใหญ่
    coordinates: '14.4386° N, 101.3724° E',
    notes: 'North-side guard rest point with first-aid kits and backup radios.'
  },
  {
    id: 'pt-02',
    name: 'Creek Delta',
    type: 'Water Source',
    zone: 'East Basin',
    riskLevel: 'Medium',
    distanceKm: '4.1',
    eta: '1 HR 20 MIN',
    position: [14.4453, 101.3810], // พิกัดโซนเขาใหญ่
    coordinates: '14.4453° N, 101.3810° E',
    notes: 'Natural water source; signs of protected wildlife were observed two days ago.'
  },
  {
    id: 'pt-03',
    name: 'Landslide Area 7',
    type: 'Hazard',
    zone: 'South Peak',
    riskLevel: 'High',
    distanceKm: '6.8',
    eta: '2 HR 45 MIN',
    position: [14.4291, 101.3619], // พิกัดโซนเขาใหญ่
    coordinates: '14.4291° N, 101.3619° E',
    notes: 'Recent landslide area from last week\'s storm; avoid cliff edges at all times.'
  }
];
