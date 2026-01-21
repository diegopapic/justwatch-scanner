import type { Provider, Genre, SearchFilters, NewTitleEdge, Title } from './types.js';

const GRAPHQL_ENDPOINT = 'https://apis.justwatch.com/graphql';

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>, operationName: string): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      operationName,
      query, 
      variables 
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
  }

  const json = await response.json();
  
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

// Lista de proveedores conocidos para Argentina (hardcoded porque la API de packages es inestable)
export function getProvidersForArgentina(): Provider[] {
  return [
    { id: 'nfx', technicalName: 'nfx', clearName: 'Netflix', shortName: 'NFX' },
    { id: 'prv', technicalName: 'prv', clearName: 'Amazon Prime Video', shortName: 'PRV' },
    { id: 'dnp', technicalName: 'dnp', clearName: 'Disney+', shortName: 'DNP' },
    { id: 'hbm', technicalName: 'hbm', clearName: 'Max', shortName: 'MAX' },
    { id: 'pmp', technicalName: 'pmp', clearName: 'Paramount+', shortName: 'PMP' },
    { id: 'atp', technicalName: 'atp', clearName: 'Apple TV+', shortName: 'ATP' },
    { id: 'stv', technicalName: 'stv', clearName: 'Star+', shortName: 'STV' },
    { id: 'cru', technicalName: 'cru', clearName: 'Crunchyroll', shortName: 'CRU' },
    { id: 'mbi', technicalName: 'mbi', clearName: 'MUBI', shortName: 'MBI' },
    { id: 'pks', technicalName: 'pks', clearName: 'Pluto TV', shortName: 'PKS' },
    { id: 'clv', technicalName: 'clv', clearName: 'Claro Video', shortName: 'CLV' },
    { id: 'mvp', technicalName: 'mvp', clearName: 'Movistar Play', shortName: 'MVP' },
    { id: 'flt', technicalName: 'flt', clearName: 'Flow', shortName: 'FLT' },
    { id: 'itu', technicalName: 'itu', clearName: 'Apple TV', shortName: 'ITU' },
    { id: 'gop', technicalName: 'gop', clearName: 'Google Play Movies', shortName: 'GOP' },
    { id: 'ytr', technicalName: 'ytr', clearName: 'YouTube Premium', shortName: 'YTR' },
    { id: 'car', technicalName: 'car', clearName: 'Cine.ar', shortName: 'CAR' },
  ];
}

// Lista de géneros (hardcoded)
export function getGenresForArgentina(): Genre[] {
  return [
    { id: 'act', technicalName: 'act', translation: 'Acción y aventura' },
    { id: 'ani', technicalName: 'ani', translation: 'Animación' },
    { id: 'cmy', technicalName: 'cmy', translation: 'Comedia' },
    { id: 'crm', technicalName: 'crm', translation: 'Crimen' },
    { id: 'doc', technicalName: 'doc', translation: 'Documental' },
    { id: 'drm', technicalName: 'drm', translation: 'Drama' },
    { id: 'fml', technicalName: 'fml', translation: 'Familia' },
    { id: 'fnt', technicalName: 'fnt', translation: 'Fantasía' },
    { id: 'hst', technicalName: 'hst', translation: 'Historia' },
    { id: 'hrr', technicalName: 'hrr', translation: 'Terror' },
    { id: 'msc', technicalName: 'msc', translation: 'Música' },
    { id: 'mys', technicalName: 'mys', translation: 'Misterio' },
    { id: 'rma', technicalName: 'rma', translation: 'Romance' },
    { id: 'scf', technicalName: 'scf', translation: 'Ciencia ficción' },
    { id: 'spt', technicalName: 'spt', translation: 'Deportes' },
    { id: 'trl', technicalName: 'trl', translation: 'Thriller' },
    { id: 'war', technicalName: 'war', translation: 'Bélico' },
    { id: 'wst', technicalName: 'wst', translation: 'Western' },
  ];
}

// Buscar títulos por nombre
export async function searchByTitle(searchQuery: string, country: string = 'AR', language: string = 'es', count: number = 10): Promise<Title[]> {
  const query = `
    query GetSuggestedTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
      popularTitles(country: $country, first: $first, filter: $filter) {
        edges {
          node {
            id
            objectType
            objectId
            content(country: $country, language: $language) {
              title
              originalReleaseYear
              posterUrl
              fullPath
              shortDescription
              genres {
                translation
              }
              runtime
              scoring {
                imdbScore
                imdbVotes
              }
            }
          }
        }
      }
    }
  `;

  const data = await graphqlRequest<{
    popularTitles: { edges: { node: Title }[] };
  }>(query, {
    country,
    language,
    first: count,
    filter: { searchQuery },
  }, 'GetSuggestedTitles');

  return data.popularTitles.edges.map(e => e.node);
}

// Buscar títulos populares con filtros completos
export async function searchTitles(filters: SearchFilters): Promise<Title[]> {
  const query = `
    query GetPopularTitles(
      $country: Country!
      $language: Language!
      $first: Int!
      $popularTitlesSortBy: PopularTitlesSorting!
      $sortRandomSeed: Int!
      $popularAfterCursor: String
      $popularTitlesFilter: TitleFilter
      $watchNowFilter: WatchNowOfferFilter
    ) {
      popularTitles(
        country: $country
        first: $first
        sortBy: $popularTitlesSortBy
        sortRandomSeed: $sortRandomSeed
        after: $popularAfterCursor
        filter: $popularTitlesFilter
        watchNowFilter: $watchNowFilter
      ) {
        edges {
          cursor
          node {
            id
            objectId
            objectType
            content(country: $country, language: $language) {
              title
              originalReleaseYear
              originalReleaseDate
              posterUrl
              fullPath
              shortDescription
              genres {
                translation
              }
              runtime
              scoring {
                imdbScore
                imdbVotes
                tmdbScore
                tmdbPopularity
              }
            }
            watchNowOffer(country: $country, platform: WEB, filter: $watchNowFilter) {
              id
              standardWebURL
              package {
                id
                packageId
                clearName
                technicalName
              }
              monetizationType
              presentationType
              retailPrice(language: $language)
              currency
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const popularTitlesFilter: Record<string, unknown> = {
    ageCertifications: [],
    excludeGenres: [],
    excludeProductionCountries: [],
    productionCountries: [],
    excludeIrrelevantTitles: false,
    presentationTypes: [],
  };
  
  if (filters.providers?.length) {
    popularTitlesFilter.packages = filters.providers;
  }
  
  if (filters.objectTypes?.length) {
    popularTitlesFilter.objectTypes = filters.objectTypes;
  } else {
    popularTitlesFilter.objectTypes = [];
  }
  
  if (filters.genres?.length) {
    popularTitlesFilter.genres = filters.genres;
  } else {
    popularTitlesFilter.genres = [];
  }
  
  if (filters.releaseYearFrom || filters.releaseYearTo) {
    popularTitlesFilter.releaseYear = {
      min: filters.releaseYearFrom || null,
      max: filters.releaseYearTo || null,
    };
  }

  if (filters.monetizationTypes?.length) {
    popularTitlesFilter.monetizationTypes = filters.monetizationTypes;
  } else {
    popularTitlesFilter.monetizationTypes = [];
  }

  const watchNowFilter: Record<string, unknown> = {
    packages: filters.providers || [],
    monetizationTypes: filters.monetizationTypes || [],
  };

  const variables: Record<string, unknown> = {
    country: filters.country,
    language: filters.language,
    first: filters.first || 40,
    popularTitlesSortBy: filters.sortBy || 'POPULAR',
    sortRandomSeed: filters.sortBy === 'RANDOM' ? Math.floor(Math.random() * 10000) : 0,
    popularAfterCursor: '',
    popularTitlesFilter,
    watchNowFilter,
  };

  const data = await graphqlRequest<{
    popularTitles: { edges: { cursor: string; node: Title }[] };
  }>(query, variables, 'GetPopularTitles');

  return data.popularTitles.edges.map(e => e.node);
}

// Obtener títulos nuevos/agregados recientemente
export async function getNewTitles(filters: SearchFilters): Promise<NewTitleEdge[]> {
  const query = `
    query GetNewTitles(
      $country: Country!
      $language: Language!
      $first: Int!
      $filter: NewTitlesFilter
      $after: String
    ) {
      newTitles(
        country: $country
        first: $first
        filter: $filter
        after: $after
      ) {
        edges {
          cursor
          node {
            id
            objectId
            objectType
            content(country: $country, language: $language) {
              title
              originalReleaseYear
              posterUrl
              fullPath
              shortDescription
              genres {
                translation
              }
              runtime
              scoring {
                imdbScore
                imdbVotes
              }
            }
          }
          newOffer {
            standardWebURL
            lastChangeDate
            package {
              clearName
              technicalName
            }
            monetizationType
            presentationType
            retailPrice(language: $language)
            currency
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const filter: Record<string, unknown> = {};
  
  if (filters.providers?.length) {
    filter.packages = filters.providers;
  }
  
  if (filters.objectTypes?.length) {
    filter.objectTypes = filters.objectTypes;
  }

  if (filters.monetizationTypes?.length) {
    filter.monetizationTypes = filters.monetizationTypes;
  }

  // Filtro por fecha de agregado
  if (filters.dateAddedFrom) {
    filter.date = { from: filters.dateAddedFrom };
  }

  const allEdges: NewTitleEdge[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;
  const targetCount = filters.first || 50;

  while (hasNextPage && allEdges.length < targetCount) {
    const variables: Record<string, unknown> = {
      country: filters.country,
      language: filters.language,
      first: Math.min(40, targetCount - allEdges.length),
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      after: cursor || '',
    };

    try {
      const data = await graphqlRequest<{
        newTitles: {
          edges: NewTitleEdge[];
          pageInfo: { hasNextPage: boolean; endCursor: string };
        };
      }>(query, variables, 'GetNewTitles');

      const edges = data.newTitles.edges;
      
      // Filtrar por fecha máxima si es necesario
      const filteredEdges = filters.dateAddedTo
        ? edges.filter(e => {
            const date = e.newOffer?.lastChangeDate;
            return date ? date <= filters.dateAddedTo! : true;
          })
        : edges;

      allEdges.push(...filteredEdges);
      
      hasNextPage = data.newTitles.pageInfo.hasNextPage;
      cursor = data.newTitles.pageInfo.endCursor;
    } catch (error) {
      console.error('Error fetching new titles:', error);
      break;
    }
  }

  return allEdges.slice(0, targetCount);
}

// Obtener ofertas para un título específico
export async function getTitleOffers(nodeId: string, country: string = 'AR', language: string = 'es'): Promise<unknown> {
  const query = `
    query GetTitleOffers(
      $nodeId: ID!
      $country: Country!
      $language: Language!
      $filterFlatrate: OfferFilter!
      $filterBuy: OfferFilter!
      $filterRent: OfferFilter!
      $filterFree: OfferFilter!
      $platform: Platform! = WEB
    ) {
      node(id: $nodeId) {
        id
        __typename
        ... on MovieOrShowOrSeasonOrEpisode {
          offerCount(country: $country, platform: $platform)
          flatrate: offers(country: $country, platform: $platform, filter: $filterFlatrate) {
            ...TitleOffer
          }
          buy: offers(country: $country, platform: $platform, filter: $filterBuy) {
            ...TitleOffer
          }
          rent: offers(country: $country, platform: $platform, filter: $filterRent) {
            ...TitleOffer
          }
          free: offers(country: $country, platform: $platform, filter: $filterFree) {
            ...TitleOffer
          }
        }
      }
    }
    fragment TitleOffer on Offer {
      id
      presentationType
      monetizationType
      retailPrice(language: $language)
      type
      package {
        clearName
        technicalName
      }
      standardWebURL
    }
  `;

  const data = await graphqlRequest<{ node: unknown }>(query, {
    nodeId,
    country,
    language,
    platform: 'WEB',
    filterFlatrate: { monetizationTypes: ['FLATRATE', 'FLATRATE_AND_BUY', 'ADS', 'FREE', 'CINEMA'], bestOnly: true },
    filterBuy: { monetizationTypes: ['BUY'], bestOnly: true },
    filterRent: { monetizationTypes: ['RENT'], bestOnly: true },
    filterFree: { monetizationTypes: ['ADS', 'FREE'], bestOnly: true },
  }, 'GetTitleOffers');

  return data.node;
}