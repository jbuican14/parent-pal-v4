export interface Child {
  id: string;
  user_id: string;
  name: string;
  colour_hex: string;
  school_name?: string;
}

export interface Event {
  id: string;
  user_id: string;
  child_id?: string;
  title: string;
  start_ts: string;
  end_ts: string;
  location?: string;
  prep_items?: string[];
  source_msg_id?: string;
  status: string;
}

export const mockChildren: Child[] = [
  {
    id: '1',
    user_id: '1',
    name: 'Emma',
    colour_hex: '#FF6B9D',
    school_name: 'Sunshine Elementary',
  },
  {
    id: '2',
    user_id: '1',
    name: 'Oliver',
    colour_hex: '#4ECDC4',
    school_name: 'Maple Grove Middle School',
  },
  {
    id: '3',
    user_id: '1',
    name: 'Sophie',
    colour_hex: '#FFE66D',
    school_name: 'Riverside High School',
  },
];

export const mockEvents: Event[] = [
  {
    id: '1',
    user_id: '1',
    child_id: '1',
    title: 'School Science Fair',
    start_ts: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end_ts: new Date(Date.now() + 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    location: 'Sunshine Elementary Gymnasium',
    prep_items: ['Science project poster', 'Display materials', 'Comfortable shoes'],
    status: 'upcoming',
  },
  {
    id: '2',
    user_id: '1',
    child_id: '2',
    title: 'Soccer Practice',
    start_ts: new Date().toISOString(), // Today
    end_ts: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Community Sports Center',
    prep_items: ['Soccer cleats', 'Water bottle', 'Shin guards'],
    status: 'upcoming',
  },
  {
    id: '3',
    user_id: '1',
    child_id: '3',
    title: 'Drama Club Auditions',
    start_ts: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    end_ts: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Riverside High School Theater',
    prep_items: ['Prepared monologue', 'Headshot photo', 'Resume'],
    status: 'upcoming',
  },
  {
    id: '4',
    user_id: '1',
    child_id: '1',
    title: 'Parent-Teacher Conference',
    start_ts: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_ts: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    location: 'Sunshine Elementary - Room 205',
    status: 'upcoming',
  },
  {
    id: '5',
    user_id: '1',
    child_id: '2',
    title: 'Math Competition',
    start_ts: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_ts: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    location: 'Regional Math Center',
    prep_items: ['Calculator', 'Pencils', 'Water bottle'],
    status: 'upcoming',
  },
  {
    id: '6',
    user_id: '1',
    child_id: '3',
    title: 'Senior Prom Committee Meeting',
    start_ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Past event
    end_ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Riverside High School Library',
    status: 'completed',
  },
];