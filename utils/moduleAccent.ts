import type { Section } from '../types';

// Per-module accent colour — the clarity redesign gives each learning area one
// colour, reused on the breadcrumb, the "do this next" hint strips, primary
// buttons and progress bars. Light and dark variants so it reads on both the
// warm hanji surfaces and the dark ink ones.

export interface Accent { light: string; dark: string; }

const PERSIMMON: Accent = { light: '#C13F22', dark: '#F07A55' };
const PINE:      Accent = { light: '#2E6B59', dark: '#5FB89B' };
const OCHRE:     Accent = { light: '#A8761F', dark: '#E0B457' };
const SLATE:     Accent = { light: '#2F5D8A', dark: '#7FB0E0' };
const PLUM:      Accent = { light: '#8E3B54', dark: '#D88AA5' };

const ACCENTS: Partial<Record<Section, Accent>> = {
  hangul: PERSIMMON, writing: PERSIMMON, typing: PERSIMMON, dashboard: PERSIMMON,
  vocabulary: PINE, srs: PINE, reading: PINE, bookmarks: PINE,
  grammar: OCHRE, honorifics: OCHRE,
  phrases: SLATE, quiz: SLATE, topik: SLATE, 'topik-test': SLATE, conversation: SLATE,
  profile: SLATE, 'cookie-demo': SLATE,
  culture: PLUM, 'culture-cards': PLUM, kdrama: PLUM, kpop: PLUM,
};

export const accentFor = (s: Section): Accent => ACCENTS[s] ?? PERSIMMON;
