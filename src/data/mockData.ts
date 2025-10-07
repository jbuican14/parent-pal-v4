export const mockEvents = [
  {
    id: '1',
    title: 'Soccer Practice',
    start_ts: new Date().toISOString(),
    end_ts: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Community Sports Center',
    child_id: '1',
  },
  {
    id: '2',
    title: 'Piano Lesson',
    start_ts: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end_ts: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    location: 'Music Academy',
    child_id: '2',
  },
  {
    id: '3',
    title: 'Doctor Appointment',
    start_ts: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    end_ts: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
    location: 'City Medical Center',
    child_id: '1',
  },
];

export const mockChildren = [
  {
    id: '1',
    name: 'Emma',
    age: 8,
    color: '#E8833A',
  },
  {
    id: '2',
    name: 'Oliver',
    age: 5,
    color: '#8B4A9C',
  },
];
