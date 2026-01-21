import inquirer from 'inquirer';
import chalk from 'chalk';
import { getProvidersForArgentina, getGenresForArgentina, getNewTitles, searchTitles, searchByTitle } from './api.js';
import type { SearchFilters, Provider, Genre, NewTitleEdge, Title } from './types.js';
import { MONETIZATION_TYPES } from './types.js';
import * as fs from 'fs';

// Helpers para formateo
function formatRuntime(minutes?: number): string {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-AR');
}

function formatScore(score?: number): string {
  if (!score) return '-';
  return score.toFixed(1);
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

// Mostrar resultados de títulos nuevos
function displayNewTitles(edges: NewTitleEdge[]): void {
  console.log('\n' + chalk.bold.green(`═══ Encontrados ${edges.length} títulos ═══`) + '\n');
  
  edges.forEach((edge, index) => {
    const node = edge.node;
    const offer = edge.newOffer;
    const content = node.content;
    
    const typeIcon = node.objectType === 'MOVIE' ? '🎬' : '📺';
    const title = chalk.bold.white(content.title);
    const year = chalk.gray(`(${content.originalReleaseYear})`);
    const imdb = content.scoring?.imdbScore 
      ? chalk.yellow(`⭐ ${formatScore(content.scoring.imdbScore)}`) 
      : '';
    
    console.log(`${chalk.cyan(String(index + 1).padStart(3, ' '))}. ${typeIcon} ${title} ${year} ${imdb}`);
    
    // Plataforma y tipo de oferta
    const platform = chalk.magenta(offer.package.clearName);
    const monetization = offer.monetizationType === 'FLATRATE' 
      ? chalk.green('Streaming') 
      : offer.monetizationType === 'RENT'
        ? chalk.yellow(`Alquiler: ${offer.currency || ''} ${offer.retailPrice || ''}`)
        : offer.monetizationType === 'BUY'
          ? chalk.red(`Compra: ${offer.currency || ''} ${offer.retailPrice || ''}`)
          : chalk.blue(offer.monetizationType);
    
    const quality = chalk.gray(`[${offer.presentationType}]`);
    const addedDate = chalk.gray(`Agregado: ${formatDate(offer.lastChangeDate)}`);
    
    console.log(`     ${platform} • ${monetization} ${quality}`);
    console.log(`     ${addedDate}`);
    
    // Géneros
    if (content.genres?.length) {
      const genres = content.genres.map(g => g.translation).join(', ');
      console.log(`     ${chalk.gray('Géneros:')} ${genres}`);
    }
    
    // Duración
    if (content.runtime) {
      console.log(`     ${chalk.gray('Duración:')} ${formatRuntime(content.runtime)}`);
    }
    
    // URL
    console.log(`     ${chalk.blue.underline(`https://www.justwatch.com${content.fullPath}`)}`);
    console.log('');
  });
}

// Mostrar resultados de búsqueda
function displayTitles(titles: Title[]): void {
  console.log('\n' + chalk.bold.green(`═══ Encontrados ${titles.length} títulos ═══`) + '\n');
  
  titles.forEach((title, index) => {
    const content = title.content;
    
    const typeIcon = title.objectType === 'MOVIE' ? '🎬' : '📺';
    const titleText = chalk.bold.white(content.title);
    const year = chalk.gray(`(${content.originalReleaseYear})`);
    const imdb = content.scoring?.imdbScore 
      ? chalk.yellow(`⭐ ${formatScore(content.scoring.imdbScore)}`) 
      : '';
    
    console.log(`${chalk.cyan(String(index + 1).padStart(3, ' '))}. ${typeIcon} ${titleText} ${year} ${imdb}`);
    
    // Oferta principal si existe
    if (title.watchNowOffer) {
      const offer = title.watchNowOffer;
      const platform = chalk.magenta(offer.package.clearName);
      const monetization = offer.monetizationType === 'FLATRATE' 
        ? chalk.green('Streaming') 
        : offer.monetizationType === 'RENT'
          ? chalk.yellow(`Alquiler: ${offer.currency || ''} ${offer.retailPrice || ''}`)
          : chalk.blue(offer.monetizationType);
      console.log(`     ${platform} • ${monetization}`);
    }
    
    // Géneros
    if (content.genres?.length) {
      const genres = content.genres.map(g => g.translation).join(', ');
      console.log(`     ${chalk.gray('Géneros:')} ${truncate(genres, 60)}`);
    }
    
    // Duración
    if (content.runtime) {
      console.log(`     ${chalk.gray('Duración:')} ${formatRuntime(content.runtime)}`);
    }
    
    console.log(`     ${chalk.blue.underline(`https://www.justwatch.com${content.fullPath}`)}`);
    console.log('');
  });
}

// Exportar a JSON
function exportToJson(data: unknown, filename: string): void {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(chalk.green(`\n✓ Exportado a ${filename}`));
}

// Exportar a CSV
function exportToCsv(edges: NewTitleEdge[], filename: string): void {
  const headers = ['Título', 'Año', 'Tipo', 'Plataforma', 'Monetización', 'Calidad', 'IMDB', 'Géneros', 'Agregado', 'URL'];
  const rows = edges.map(e => [
    `"${e.node.content.title.replace(/"/g, '""')}"`,
    e.node.content.originalReleaseYear,
    e.node.objectType,
    e.newOffer.package.clearName,
    e.newOffer.monetizationType,
    e.newOffer.presentationType,
    e.node.content.scoring?.imdbScore || '',
    `"${(e.node.content.genres?.map(g => g.translation).join(', ') || '').replace(/"/g, '""')}"`,
    e.newOffer.lastChangeDate || '',
    `https://www.justwatch.com${e.node.content.fullPath}`,
  ]);
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(filename, csv);
  console.log(chalk.green(`\n✓ Exportado a ${filename}`));
}

// CLI principal
export async function runCLI(): Promise<void> {
  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║     JustWatch Scanner para Argentina   ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════╝\n'));
  
  // Usar listas hardcoded en lugar de llamar a la API
  const providers = getProvidersForArgentina();
  const genres = getGenresForArgentina();
  
  console.log(chalk.green(`✓ ${providers.length} plataformas y ${genres.length} géneros disponibles\n`));
  
  // Menú principal
  const mainMenu = async (): Promise<void> => {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '¿Qué querés hacer?',
        choices: [
          { name: '🆕 Ver títulos agregados recientemente', value: 'new' },
          { name: '🔍 Buscar títulos con filtros', value: 'search' },
          { name: '🔎 Buscar por nombre', value: 'searchByName' },
          { name: '📋 Ver plataformas disponibles', value: 'providers' },
          { name: '🎭 Ver géneros disponibles', value: 'genres' },
          { name: '❌ Salir', value: 'exit' },
        ],
      },
    ]);
    
    switch (action) {
      case 'new':
        await searchNewTitles(providers, genres);
        break;
      case 'search':
        await searchWithFilters(providers, genres);
        break;
      case 'searchByName':
        await searchByName();
        break;
      case 'providers':
        displayProviders(providers);
        break;
      case 'genres':
        displayGenres(genres);
        break;
      case 'exit':
        console.log(chalk.cyan('\n¡Hasta luego! 👋\n'));
        return;
    }
    
    await mainMenu();
  };
  
  await mainMenu();
}

function displayProviders(providers: Provider[]): void {
  console.log(chalk.bold.green('\n═══ Plataformas disponibles en Argentina ═══\n'));
  providers.forEach(p => {
    console.log(`  ${chalk.cyan(p.technicalName.padEnd(10))} ${p.clearName}`);
  });
  console.log('');
}

function displayGenres(genres: Genre[]): void {
  console.log(chalk.bold.green('\n═══ Géneros disponibles ═══\n'));
  genres.forEach(g => {
    console.log(`  ${chalk.cyan(g.technicalName.padEnd(10))} ${g.translation}`);
  });
  console.log('');
}

async function searchByName(): Promise<void> {
  const { query } = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: 'Ingresá el nombre de la película o serie:',
      validate: (input: string) => input.length > 0 || 'Ingresá algo para buscar',
    },
  ]);
  
  console.log(chalk.gray('\nBuscando...'));
  
  try {
    const results = await searchByTitle(query, 'AR', 'es', 10);
    
    if (results.length === 0) {
      console.log(chalk.yellow('\nNo se encontraron resultados.'));
      return;
    }
    
    displayTitles(results);
  } catch (error) {
    console.error(chalk.red('Error en la búsqueda:'), error);
  }
}

async function searchNewTitles(providers: Provider[], genres: Genre[]): Promise<void> {
  const filters = await promptFilters(providers, genres, true);
  
  console.log(chalk.gray('\nBuscando títulos...'));
  
  try {
    const results = await getNewTitles(filters);
    
    if (results.length === 0) {
      console.log(chalk.yellow('\nNo se encontraron títulos con esos filtros.'));
      return;
    }
    
    displayNewTitles(results);
    
    // Opciones de exportación
    const { exportOption } = await inquirer.prompt([
      {
        type: 'list',
        name: 'exportOption',
        message: '¿Querés exportar los resultados?',
        choices: [
          { name: 'No, volver al menú', value: 'none' },
          { name: 'Exportar a JSON', value: 'json' },
          { name: 'Exportar a CSV', value: 'csv' },
        ],
      },
    ]);
    
    if (exportOption === 'json') {
      const filename = `justwatch-new-${new Date().toISOString().slice(0, 10)}.json`;
      exportToJson(results, filename);
    } else if (exportOption === 'csv') {
      const filename = `justwatch-new-${new Date().toISOString().slice(0, 10)}.csv`;
      exportToCsv(results, filename);
    }
  } catch (error) {
    console.error(chalk.red('Error en la búsqueda:'), error);
  }
}

async function searchWithFilters(providers: Provider[], genres: Genre[]): Promise<void> {
  const filters = await promptFilters(providers, genres, false);
  
  console.log(chalk.gray('\nBuscando títulos...'));
  
  try {
    const results = await searchTitles(filters);
    
    if (results.length === 0) {
      console.log(chalk.yellow('\nNo se encontraron títulos con esos filtros.'));
      return;
    }
    
    displayTitles(results);
  } catch (error) {
    console.error(chalk.red('Error en la búsqueda:'), error);
  }
}

async function promptFilters(providers: Provider[], genres: Genre[], isNewTitles: boolean): Promise<SearchFilters> {
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'providers',
      message: 'Seleccioná las plataformas (Enter para todas):',
      choices: providers.map(p => ({
        name: p.clearName,
        value: p.technicalName,
      })),
      pageSize: 15,
    },
    {
      type: 'list',
      name: 'objectType',
      message: '¿Qué tipo de contenido?',
      choices: [
        { name: 'Todos', value: 'all' },
        { name: 'Solo películas', value: 'MOVIE' },
        { name: 'Solo series', value: 'SHOW' },
      ],
    },
    {
      type: 'checkbox',
      name: 'genres',
      message: 'Seleccioná géneros (Enter para todos):',
      choices: genres.map(g => ({
        name: g.translation,
        value: g.technicalName,
      })),
      pageSize: 15,
    },
    {
      type: 'checkbox',
      name: 'monetizationTypes',
      message: 'Tipo de disponibilidad:',
      choices: Object.entries(MONETIZATION_TYPES).map(([value, name]) => ({
        name,
        value,
        checked: value === 'FLATRATE',
      })),
    },
    {
      type: 'input',
      name: 'releaseYearFrom',
      message: 'Año de estreno desde (vacío para sin límite):',
      validate: (input: string) => !input || !isNaN(Number(input)) || 'Ingresá un año válido',
    },
    {
      type: 'input',
      name: 'releaseYearTo',
      message: 'Año de estreno hasta (vacío para sin límite):',
      validate: (input: string) => !input || !isNaN(Number(input)) || 'Ingresá un año válido',
    },
  ]);
  
  // Preguntas adicionales para títulos nuevos
  let dateAddedFrom: string | undefined;
  
  if (isNewTitles) {
    const dateAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'dateRange',
        message: '¿Agregados en qué período?',
        choices: [
          { name: 'Última semana', value: 7 },
          { name: 'Últimos 15 días', value: 15 },
          { name: 'Último mes', value: 30 },
          { name: 'Últimos 3 meses', value: 90 },
          { name: 'Sin límite de fecha', value: 0 },
        ],
      },
    ]);
    
    if (dateAnswers.dateRange > 0) {
      const date = new Date();
      date.setDate(date.getDate() - dateAnswers.dateRange);
      dateAddedFrom = date.toISOString().slice(0, 10);
    }
  }
  
  // Cantidad de resultados
  const { count } = await inquirer.prompt([
    {
      type: 'list',
      name: 'count',
      message: '¿Cuántos resultados?',
      choices: [
        { name: '20 resultados', value: 20 },
        { name: '50 resultados', value: 50 },
        { name: '100 resultados', value: 100 },
        { name: '200 resultados', value: 200 },
      ],
    },
  ]);
  
  const filters: SearchFilters = {
    country: 'AR',
    language: 'es',
    first: count,
  };
  
  if (answers.providers.length > 0) {
    filters.providers = answers.providers;
  }
  
  if (answers.objectType !== 'all') {
    filters.objectTypes = [answers.objectType];
  }
  
  if (answers.genres.length > 0) {
    filters.genres = answers.genres;
  }
  
  if (answers.monetizationTypes.length > 0) {
    filters.monetizationTypes = answers.monetizationTypes;
  }
  
  if (answers.releaseYearFrom) {
    filters.releaseYearFrom = Number(answers.releaseYearFrom);
  }
  
  if (answers.releaseYearTo) {
    filters.releaseYearTo = Number(answers.releaseYearTo);
  }
  
  if (dateAddedFrom) {
    filters.dateAddedFrom = dateAddedFrom;
  }
  
  return filters;
}