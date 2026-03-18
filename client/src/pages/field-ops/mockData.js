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
  { id: 1, title: 'Inspect perimeter fence', time: 'Due 10:00', completed: false, priority: 'High' },
  { id: 2, title: 'Morning briefing sync', time: 'Completed 07:30', completed: true, priority: 'Normal' },
  { id: 3, title: 'Water source quality check', time: 'Creek Delta station', completed: false, priority: 'Normal' },
  { id: 4, title: 'Camera trap battery replacement', time: 'Zone C camera #4', completed: false, priority: 'High' },
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
    notes: 'จุดพักยามประจำทิศเหนือ มีชุดปฐมพยาบาลและวิทยุสื่อสารสำรอง'
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
    notes: 'แหล่งน้ำธรรมชาติ ตรวจพบร่องรอยสัตว์ป่าสงวนเมื่อ 2 วันก่อน'
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
    notes: 'พื้นที่ดินถล่มจากพายุสัปดาห์ก่อน ห้ามเข้าใกล้ขอบหน้าผาเด็ดขาด'
  }
];
