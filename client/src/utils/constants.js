export const INCIDENT_TYPES = [
  { id: 'fire', label: 'Fire' },
  { id: 'flood', label: 'Flood' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'poaching', label: 'Poaching' },
  { id: 'logging', label: 'Illegal Logging' },
  { id: 'damage', label: 'Infrastructure Damage' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'other', label: 'Other' },
];

export const getIncidentLabel = (id) => {
  return INCIDENT_TYPES.find(t => t.id === id)?.label || id;
};
