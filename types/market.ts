export interface Outcome {
  name: string;
  probability: number;
  image?: string;
}

export interface Team {
  name: string;
  score: number;
  flag: string;
}

export interface Market {
  id: string;
  question: string;
  image: string;
  category: string;
  type: 'binary' | 'multiple' | 'sports';

  // For binary markets
  probability?: number;

  // For multiple outcome markets
  outcomes?: Outcome[];

  // For sports
  homeTeam?: Team;
  awayTeam?: Team;
  matchTime?: string;

  volume: string;
  endDate?: string;
}

export const categories = [
  { name: 'Trending', icon: 'chart' },
  { name: 'Breaking', icon: null },
  { name: 'New', icon: null },
  { name: 'Politics', icon: null, divider: true },
  { name: 'Sports', icon: null },
  { name: 'Crypto', icon: null },
  { name: 'Finance', icon: null },
  { name: 'Geopolitics', icon: null },
  { name: 'Earnings', icon: null },
  { name: 'Tech', icon: null },
  { name: 'Culture', icon: null },
  { name: 'World', icon: null },
  { name: 'Economy', icon: null },
  { name: 'Trump', icon: null },
  { name: 'Elections', icon: null },
  { name: 'Mentions', icon: null },
  { name: 'More', icon: 'chevron' },
];

export const tags = [
  'Christmas',
  'Fed',
  'Ukraine',
  'Lighter',
  'SpaceX',
  'Warner Bros',
  'Weather',
  'Equities',
  'Best of 2025',
  'Derivatives',
  'Primaries',
];

export const sampleMarkets: Market[] = [
  {
    id: '1',
    question: 'Fed decision in January?',
    image: '/images/fed.jpg',
    category: 'Finance',
    type: 'multiple',
    outcomes: [
      { name: '50+ bps decrease', probability: 0.02 },
      { name: '25 bps decrease', probability: 0.12 },
    ],
    volume: '$60m Vol.',
  },
  {
    id: '2',
    question: 'Republican Presidential Nominee 2028',
    image: '/images/gop.jpg',
    category: 'Politics',
    type: 'multiple',
    outcomes: [
      { name: 'J.D. Vance', probability: 0.54 },
      { name: 'Marco Rubio', probability: 0.09 },
    ],
    volume: '$135m Vol.',
  },
  {
    id: '3',
    question: 'Super Bowl Champion 2026',
    image: '/images/nfl.jpg',
    category: 'Sports',
    type: 'multiple',
    outcomes: [
      { name: 'Los Angeles R', probability: 0.16 },
      { name: 'Seattle', probability: 0.13 },
    ],
    volume: '$633m Vol.',
  },
  {
    id: '4',
    question: 'Maduro out by...?',
    image: '/images/maduro.jpg',
    category: 'Politics',
    type: 'multiple',
    outcomes: [
      { name: 'December 31, 2025', probability: 0.03 },
      { name: 'January 31, 2026', probability: 0.14 },
    ],
    volume: '$33m Vol.',
  },
  {
    id: '5',
    question: 'Cameroon vs Gabon',
    image: '/images/soccer.jpg',
    category: 'Sports',
    type: 'sports',
    homeTeam: { name: 'Cameroon', score: 1, flag: '🇨🇲' },
    awayTeam: { name: 'Gabon', score: 0, flag: '🇬🇦' },
    matchTime: '2H - 84',
    outcomes: [
      { name: 'Cameroon', probability: 0.82 },
      { name: 'Gabon', probability: 0.02 },
    ],
    volume: '$840k Vol.',
  },
  {
    id: '6',
    question: 'Who will be named in newly released Epstein files?',
    image: '/images/epstein.jpg',
    category: 'Politics',
    type: 'multiple',
    outcomes: [
      { name: 'Stephen Colbert', probability: 1.00 },
      { name: 'Elon Musk', probability: 1.00 },
    ],
    volume: '$6m Vol.',
  },
  {
    id: '7',
    question: 'Will Trump admin release any Epstein related files on...?',
    image: '/images/trump.jpg',
    category: 'Politics',
    type: 'multiple',
    outcomes: [
      { name: 'December 26', probability: 0.24 },
      { name: 'December 27', probability: 0.25 },
    ],
    volume: '$131k Vol.',
  },
  {
    id: '8',
    question: "Will Spotify's top song on Christmas be 'All I...",
    image: '/images/spotify.jpg',
    category: 'Culture',
    type: 'binary',
    probability: 0.27,
    volume: '$323k Vol.',
  },
  {
    id: '9',
    question: 'Epstein client list released by...?',
    image: '/images/epstein2.jpg',
    category: 'Politics',
    type: 'multiple',
    outcomes: [
      { name: 'December 31', probability: 0.14 },
      { name: 'June 30', probability: 0.44 },
    ],
    volume: '$2m Vol.',
  },
  {
    id: '10',
    question: 'Will Netflix close Warner Bros. acquisition by end...',
    image: '/images/netflix.jpg',
    category: 'Finance',
    type: 'binary',
    probability: 0.26,
    volume: '$241k Vol.',
  },
  {
    id: '11',
    question: 'Will there be another US government shutdown ...',
    image: '/images/capitol.jpg',
    category: 'Politics',
    type: 'binary',
    probability: 0.27,
    volume: '$378k Vol.',
  },
  {
    id: '12',
    question: 'Lighter market cap (FDV) one day after launch?',
    image: '/images/lighter.jpg',
    category: 'Crypto',
    type: 'multiple',
    outcomes: [
      { name: '>$1B', probability: 0.90 },
      { name: '>$2B', probability: 0.85 },
    ],
    volume: '$39m Vol.',
  },
  {
    id: '13',
    question: 'Will Trump acquire Greenland before 2027?',
    image: '/images/greenland.jpg',
    category: 'Politics',
    type: 'binary',
    probability: 0.07,
    volume: '$11k Vol.',
  },
  {
    id: '14',
    question: 'U.S. forces seize another Venezuela-linked oil ship by...?',
    image: '/images/ship.jpg',
    category: 'Geopolitics',
    type: 'multiple',
    outcomes: [
      { name: 'December 26', probability: 0.19 },
      { name: 'December 31', probability: 0.54 },
    ],
    volume: '$337k Vol.',
  },
  {
    id: '15',
    question: 'Brazil Presidential Election',
    image: '/images/brazil.jpg',
    category: 'Politics',
    type: 'multiple',
    outcomes: [
      { name: 'Luiz Inácio Lula da Silva', probability: 0.49 },
      { name: 'Flávio Bolsonaro', probability: 0.17 },
    ],
    volume: '$9m Vol.',
  },
  {
    id: '16',
    question: 'Who will Trump nominate as Fed Chair?',
    image: '/images/fedchair.jpg',
    category: 'Finance',
    type: 'multiple',
    outcomes: [
      { name: 'Kevin Hassett', probability: 0.57 },
      { name: 'Kevin Warsh', probability: 0.22 },
    ],
    volume: '$83m Vol.',
  },
];
