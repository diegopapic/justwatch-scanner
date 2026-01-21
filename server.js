const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const GRAPHQL_ENDPOINT = 'https://apis.justwatch.com/graphql';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': '*/*',
  'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.justwatch.com/',
  'Origin': 'https://www.justwatch.com',
  'Device-Id': crypto.randomBytes(16).toString('base64').slice(0, 22),
});

const PROVIDERS = [
  { id: 'nfx', name: 'Netflix' },
  { id: 'prv', name: 'Amazon Prime Video' },
  { id: 'dnp', name: 'Disney+' },
  { id: 'hbm', name: 'Max' },
  { id: 'pmp', name: 'Paramount+' },
  { id: 'atp', name: 'Apple TV+' },
  { id: 'mbi', name: 'MUBI' },
  { id: 'clv', name: 'Claro Video' },
  { id: 'mvp', name: 'Movistar Play' },
  { id: 'flt', name: 'Flow' },
  { id: 'itu', name: 'Apple TV' },
  { id: 'gop', name: 'Google Play Movies' },
  { id: 'cne', name: 'Cine.ar' },
];

const GENRES = [
  { id: 'act', name: 'Acción y aventura' },
  { id: 'ani', name: 'Animación' },
  { id: 'cmy', name: 'Comedia' },
  { id: 'crm', name: 'Crimen' },
  { id: 'doc', name: 'Documental' },
  { id: 'drm', name: 'Drama' },
  { id: 'fml', name: 'Familia' },
  { id: 'fnt', name: 'Fantasía' },
  { id: 'hst', name: 'Historia' },
  { id: 'hrr', name: 'Terror' },
  { id: 'msc', name: 'Música' },
  { id: 'mys', name: 'Misterio' },
  { id: 'rma', name: 'Romance' },
  { id: 'scf', name: 'Ciencia ficción' },
  { id: 'trl', name: 'Thriller' },
  { id: 'war', name: 'Bélico' },
  { id: 'wst', name: 'Western' },
];

app.get('/api/providers', (req, res) => res.json(PROVIDERS));
app.get('/api/genres', (req, res) => res.json(GENRES));

// Buscar por nombre
app.get('/api/search', async (req, res) => {
  const { q, country = 'AR', language = 'es' } = req.query;
  
  const query = `query GetSuggestedTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
  popularTitles(country: $country, first: $first, filter: $filter) {
    edges {
      node {
        id
        objectType
        objectId
        content(country: $country, language: $language) {
          title
          originalTitle
          originalReleaseYear
          posterUrl
          fullPath
          shortDescription
          genres { translation(language: $language) }
          runtime
          scoring { imdbScore }
        }
      }
    }
  }
}`;

  try {
    console.log('[SEARCH] Buscando: "' + q + '"');
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        operationName: 'GetSuggestedTitles',
        query,
        variables: { country, language, first: 20, filter: { searchQuery: q } },
      }),
    });
    
    const data = await response.json();
    
    if (data.errors) {
      console.error('[SEARCH] GraphQL errors:', data.errors);
      return res.status(400).json({ error: data.errors[0]?.message || 'GraphQL error' });
    }
    
    const results = data.data?.popularTitles?.edges?.map(e => e.node) || [];
    console.log('[SEARCH] Encontrados: ' + results.length + ' resultados');
    
    res.json(results);
  } catch (error) {
    console.error('[SEARCH] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Buscar títulos populares
app.post('/api/titles', async (req, res) => {
  const { 
    providers = [], 
    objectTypes = [], 
    genres = [], 
    monetizationTypes = [], 
    releaseYearFrom, 
    releaseYearTo, 
    first = 40, 
    country = 'AR', 
    language = 'es' 
  } = req.body;

  const query = `query GetPopularTitles($country: Country!, $language: Language!, $first: Int!, $popularTitlesSortBy: PopularTitlesSorting!, $sortRandomSeed: Int!, $popularAfterCursor: String!, $popularTitlesFilter: TitleFilter!) {
  popularTitles(country: $country, first: $first, sortBy: $popularTitlesSortBy, sortRandomSeed: $sortRandomSeed, after: $popularAfterCursor, filter: $popularTitlesFilter) {
    edges {
      node {
        id
        objectId
        objectType
        content(country: $country, language: $language) {
          title
          originalTitle
          originalReleaseYear
          posterUrl
          fullPath
          shortDescription
          genres { translation(language: $language) }
          runtime
          scoring { imdbScore }
        }
        offers(country: $country, platform: WEB) {
          standardWebURL
          package { clearName technicalName }
          monetizationType
          presentationType
          retailPrice(language: $language)
          currency
        }
      }
    }
  }
}`;

  const popularTitlesFilter = {
    ageCertifications: [],
    excludeGenres: [],
    excludeProductionCountries: [],
    productionCountries: [],
    excludeIrrelevantTitles: false,
    presentationTypes: [],
    packages: providers.length ? providers : [],
    objectTypes: objectTypes.length ? objectTypes : [],
    genres: genres.length ? genres : [],
    monetizationTypes: monetizationTypes.length ? monetizationTypes : [],
  };

  if (releaseYearFrom || releaseYearTo) {
    popularTitlesFilter.releaseYear = { min: releaseYearFrom || null, max: releaseYearTo || null };
  }

  try {
    console.log('[TITLES] Buscando...');
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        operationName: 'GetPopularTitles',
        query,
        variables: {
          country, language, first,
          popularTitlesSortBy: 'POPULAR',
          sortRandomSeed: 0,
          popularAfterCursor: '',
          popularTitlesFilter,
        },
      }),
    });
    
    const data = await response.json();
    
    if (data.errors) {
      console.error('[TITLES] GraphQL errors:', data.errors);
      return res.status(400).json({ error: data.errors[0]?.message || 'GraphQL error' });
    }
    
    const results = (data.data?.popularTitles?.edges || []).map(e => {
      const node = e.node;
      // Buscar la mejor oferta de streaming
      const offer = node.offers?.find(o => o.monetizationType === 'FLATRATE') || node.offers?.[0];
      return {
        ...node,
        watchNowOffer: offer || null
      };
    });
    console.log('[TITLES] Encontrados: ' + results.length);
    
    res.json(results);
  } catch (error) {
    console.error('[TITLES] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Títulos nuevos - busca por fecha específica y pagina hacia atrás
app.post('/api/new-titles', async (req, res) => {
  const { 
    providers = [], 
    objectTypes = [], 
    monetizationTypes = [],
    dateFrom,
    dateTo = null,
    first = 100, 
    country = 'AR', 
    language = 'es',
    exclusiveOnly = false,
    productionCountries = [],
    excludeProductionCountries = [],
    releaseYearFrom = null,
    releaseYearTo = null
  } = req.body;

  // Mapeo de códigos cortos a technicalName de la API
  const providerCodeToTechnical = {
    'nfx': 'netflix',
    'prv': 'amazonprimevideo',
    'dnp': 'disneyplus',
    'hbm': 'hbomax',
    'pmp': 'paramountplus',
    'atp': 'appletvplus',
    'stv': 'starplus',
    'cru': 'crunchyroll',
    'mbi': 'mubi',
    'pks': 'plutotv',
    'clv': 'clarovideo',
    'mvp': 'movistarplay',
    'flt': 'flow',
    'itu': 'itunes',
    'gop': 'googleplaymovies',
    'cne': 'cine',
  };
  
  // Convertir códigos de filtro a technicalNames
  const selectedTechnicalNames = providers.map(p => providerCodeToTechnical[p] || p);

  const query = `query GetNewTitles($country: Country!, $date: Date!, $language: Language!, $filter: TitleFilter, $after: String, $first: Int!, $platform: Platform!, $priceDrops: Boolean!, $pageType: NewPageType!) {
  newTitles(
    country: $country
    date: $date
    filter: $filter
    after: $after
    first: $first
    priceDrops: $priceDrops
    pageType: $pageType
  ) {
    totalCount
    edges {
      cursor
      node {
        ... on MovieOrSeason {
          id
          objectId
          objectType
          content(country: $country, language: $language) {
            title
            originalReleaseYear
            posterUrl
            fullPath
            shortDescription
            runtime
            genres { translation(language: $language) }
            scoring { imdbScore }
            ... on MovieOrShowContent {
              originalTitle
              productionCountries
              credits { role name }
            }
          }
          offers(country: $country, platform: $platform) {
            package { technicalName clearName }
            monetizationType
          }
        }
      }
      newOffer: newOffer(platform: $platform) {
        dateCreated
        standardWebURL
        package { clearName technicalName }
        monetizationType
        presentationType
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;

  const filter = {
    packages: providers.length ? providers : [],
    objectTypes: objectTypes.length ? objectTypes : ['MOVIE'],
    monetizationTypes: monetizationTypes.length ? monetizationTypes : [],
    ageCertifications: [],
    excludeGenres: [],
    excludeProductionCountries: excludeProductionCountries.length ? excludeProductionCountries : [],
    genres: [],
    presentationTypes: [],
    productionCountries: productionCountries.length ? productionCountries : [],
    subgenres: [],
    excludeIrrelevantTitles: false
  };
  
  // Agregar filtro de año de estreno si se proporciona
  if (releaseYearFrom || releaseYearTo) {
    filter.releaseYear = {};
    if (releaseYearFrom) filter.releaseYear.min = releaseYearFrom;
    if (releaseYearTo) filter.releaseYear.max = releaseYearTo;
  }
  
  try {
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();
    
    let logMsg = '[NEW-TITLES] Buscando: ' + fromDate.toISOString().slice(0, 10) + ' a ' + toDate.toISOString().slice(0, 10);
    if (exclusiveOnly) logMsg += ' (solo exclusivas)';
    if (productionCountries.length) logMsg += ' | Países: ' + productionCountries.join(', ');
    if (excludeProductionCountries.length) logMsg += ' | Excluir: ' + excludeProductionCountries.join(', ');
    if (releaseYearFrom || releaseYearTo) logMsg += ' | Estreno: ' + (releaseYearFrom || '?') + '-' + (releaseYearTo || '?');
    console.log(logMsg);
    console.log('[NEW-TITLES] Filter:', JSON.stringify(filter));
    
    let allResults = [];
    
    // Iterar por cada día desde toDate hasta fromDate
    let currentDate = new Date(toDate);
    
    while (currentDate >= fromDate && allResults.length < first) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      let after = null;
      let hasMore = true;
      
      while (hasMore && allResults.length < first) {
        // Pequeño delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
        let response;
        try {
          response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              operationName: 'GetNewTitles',
              query,
              variables: {
                country, 
                language, 
                first: 50,
                platform: 'WEB',
                filter,
                date: dateStr,
                priceDrops: false,
                pageType: 'NEW',
                after,
              },
            }),
          });
        } catch (fetchError) {
          console.error('[NEW-TITLES] Fetch error:', fetchError.message);
          // Devolver resultados parciales si hay
          if (allResults.length > 0) {
            console.log('[NEW-TITLES] Devolviendo ' + allResults.length + ' resultados parciales');
            return res.json(allResults);
          }
          return res.status(500).json({ error: 'Error de conexión con JustWatch: ' + fetchError.message });
        }
        
        if (!response.ok) {
          console.error('[NEW-TITLES] HTTP error:', response.status, response.statusText);
          if (allResults.length > 0) {
            console.log('[NEW-TITLES] Devolviendo ' + allResults.length + ' resultados parciales');
            return res.json(allResults);
          }
          return res.status(500).json({ error: `Error HTTP ${response.status}: ${response.statusText}` });
        }
        
        let data;
        try {
          const text = await response.text();
          // Verificar si es HTML (bloqueo de JustWatch)
          if (text.startsWith('<!') || text.startsWith('<html')) {
            console.error('[NEW-TITLES] JustWatch devolvió HTML (posible bloqueo)');
            if (allResults.length > 0) {
              console.log('[NEW-TITLES] Devolviendo ' + allResults.length + ' resultados parciales');
              return res.json(allResults);
            }
            return res.status(429).json({ error: 'JustWatch bloqueó temporalmente las requests. Intentá de nuevo en unos minutos.' });
          }
          data = JSON.parse(text);
        } catch (jsonError) {
          console.error('[NEW-TITLES] JSON parse error:', jsonError.message);
          if (allResults.length > 0) {
            console.log('[NEW-TITLES] Devolviendo ' + allResults.length + ' resultados parciales');
            return res.json(allResults);
          }
          return res.status(500).json({ error: 'Error al parsear respuesta de JustWatch' });
        }
        
        if (data.errors) {
          console.error('[NEW-TITLES] GraphQL errors:', data.errors);
          return res.status(400).json({ error: data.errors[0]?.message });
        }
        
        const edges = data.data?.newTitles?.edges || [];
        const pageInfo = data.data?.newTitles?.pageInfo;
        const totalCount = data.data?.newTitles?.totalCount || 0;
        
        if (edges.length > 0) {
          console.log('[NEW-TITLES] ' + dateStr + ': ' + totalCount + ' títulos');
        }
        
        for (const e of edges) {
          if (!exclusiveOnly && allResults.length >= first) break;
          if (exclusiveOnly && allResults.length >= first) break;
          
          // Si exclusiveOnly está activo, verificar que esté en UNA sola plataforma de streaming
          if (exclusiveOnly) {
            const titleOffers = e.node?.offers || [];
            const streamingOffers = titleOffers.filter(o => o.monetizationType === 'FLATRATE');
            
            // Obtener plataformas únicas de streaming
            const uniquePlatforms = [...new Set(streamingOffers.map(o => o.package?.technicalName))];
            
            // Solo mostrar si está en exactamente UNA plataforma
            if (uniquePlatforms.length !== 1) {
              continue;
            }
          }
          
          allResults.push({
            node: e.node,
            newOffer: e.newOffer ? {
              ...e.newOffer,
              lastChangeDate: e.newOffer.dateCreated,
            } : null
          });
        }
        
        if (pageInfo?.hasNextPage && allResults.length < first) {
          after = pageInfo.endCursor;
        } else {
          hasMore = false;
        }
      }
      
      // Ir al día anterior
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    console.log('[NEW-TITLES] Total encontrados: ' + allResults.length);
    res.json(allResults);
  } catch (error) {
    console.error('[NEW-TITLES] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Test
app.get('/api/test', async (req, res) => {
  try {
    console.log('[TEST] Probando conexión...');
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        operationName: 'GetSuggestedTitles',
        query: `query GetSuggestedTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
          popularTitles(country: $country, first: $first, filter: $filter) {
            edges { node { id content(country: $country, language: $language) { title originalReleaseYear } } }
          }
        }`,
        variables: { country: 'AR', language: 'es', first: 5, filter: { searchQuery: 'Matrix' } },
      }),
    });
    
    const data = await response.json();
    
    if (data.errors) {
      return res.json({ success: false, error: data.errors });
    }
    
    const titles = data.data?.popularTitles?.edges?.map(e => e.node.content.title) || [];
    console.log('[TEST] OK! Títulos:', titles);
    
    res.json({ success: true, count: titles.length, titles });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n🎬 JustWatch Scanner: http://localhost:' + PORT);
  console.log('📋 Test: http://localhost:' + PORT + '/api/test\n');
});