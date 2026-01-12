// Tipos para JustWatch API

export interface Provider {
  id: string;
  technicalName: string;
  clearName: string;
  shortName: string;
  iconUrl?: string;
}

export interface Genre {
  id: string;
  technicalName: string;
  translation: string;
}

export interface Offer {
  id: string;
  monetizationType: 'FLATRATE' | 'RENT' | 'BUY' | 'FREE' | 'ADS' | 'CINEMA';
  presentationType: string;
  retailPrice?: number;
  currency?: string;
  lastChangeRetailPrice?: string;
  lastChangeDate?: string;
  package: {
    id: string;
    packageId: number;
    clearName: string;
    technicalName: string;
    shortName: string;
    icon: string;
  };
  standardWebURL: string;
  availableToTime?: string;
  dateCreated?: string;
}

export interface Title {
  id: string;
  objectId: number;
  objectType: 'MOVIE' | 'SHOW';
  content: {
    title: string;
    originalReleaseYear: number;
    originalReleaseDate?: string;
    posterUrl?: string;
    fullPath: string;
    genres?: { translation: string }[];
    runtime?: number;
    shortDescription?: string;
    scoring?: {
      imdbScore?: number;
      imdbVotes?: number;
      tmdbScore?: number;
      tmdbPopularity?: number;
    };
  };
  offers?: Offer[];
  watchNowOffer?: {
    id: string;
    standardWebURL: string;
    package: {
      id: string;
      packageId: number;
      clearName: string;
      technicalName: string;
    };
    monetizationType: string;
    presentationType: string;
    retailPrice?: number;
    currency?: string;
  };
}

export interface NewTitleEdge {
  cursor: string;
  node: {
    headlineOffer?: {
      id: string;
      retailPrice?: number;
      currency?: string;
    };
    id: string;
    objectId: number;
    objectType: 'MOVIE' | 'SHOW';
    content: {
      title: string;
      originalReleaseYear: number;
      posterUrl?: string;
      fullPath: string;
      shortDescription?: string;
      genres?: { translation: string }[];
      runtime?: number;
      scoring?: {
        imdbScore?: number;
        imdbVotes?: number;
      };
    };
    offers?: Offer[];
  };
  newOffer: {
    standardWebURL: string;
    lastChangeDate?: string;
    package: {
      clearName: string;
      technicalName: string;
      icon: string;
    };
    monetizationType: string;
    presentationType: string;
    retailPrice?: number;
    currency?: string;
  };
}

export interface SearchFilters {
  country: string;
  language: string;
  providers?: string[];
  objectTypes?: ('MOVIE' | 'SHOW')[];
  genres?: string[];
  releaseYearFrom?: number;
  releaseYearTo?: number;
  monetizationTypes?: string[];
  dateAddedFrom?: string;  // ISO date string
  dateAddedTo?: string;
  sortBy?: 'POPULAR' | 'RELEASE_DATE' | 'ALPHABETICAL' | 'RANDOM';
  sortOrder?: 'ASC' | 'DESC';
  first?: number;
}

export interface AppConfig {
  filters: SearchFilters;
  outputFormat: 'table' | 'json' | 'csv';
}

// Proveedores conocidos en Argentina
export const ARGENTINA_PROVIDERS: Record<string, string> = {
  'nfx': 'Netflix',
  'prv': 'Amazon Prime Video',
  'dnp': 'Disney+',
  'mxx': 'Max',
  'pmp': 'Paramount+',
  'atp': 'Apple TV+',
  'stv': 'Star+',
  'crv': 'Crunchyroll',
  'mbi': 'MUBI',
  'sho': 'Lionsgate+',
  'flt': 'Flow',
  'clv': 'Claro video',
  'mvp': 'Movistar Play',
  'pks': 'Pluto TV',
  'ybr': 'YouTube Premium',
};

// Géneros disponibles
export const GENRES: Record<string, string> = {
  'act': 'Acción y aventura',
  'ani': 'Animación',
  'cmy': 'Comedia',
  'crm': 'Crimen',
  'doc': 'Documental',
  'drm': 'Drama',
  'eur': 'Europea',
  'fml': 'Familia',
  'fnt': 'Fantasía',
  'hst': 'Historia',
  'hrr': 'Terror',
  'msc': 'Música',
  'mys': 'Misterio',
  'rma': 'Romance',
  'scf': 'Ciencia ficción',
  'trl': 'Thriller',
  'war': 'Bélico',
  'wst': 'Western',
};

export const MONETIZATION_TYPES: Record<string, string> = {
  'FLATRATE': 'Suscripción (streaming)',
  'RENT': 'Alquiler',
  'BUY': 'Compra',
  'FREE': 'Gratis',
  'ADS': 'Gratis con anuncios',
};
