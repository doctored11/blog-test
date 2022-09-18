/* eslint-disable no-console */
// импорт стандартных библиотек Node.js
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { createServer } = require('http');

// файл для базы данных дел
const DB_FILE = './db.json';
// префикс URI для всех методов приложения
const URI_PREFIX = '/api/check';
// номер порта, на котором будет запущен сервер
const PORT = 3000;

/**
 * Класс ошибки, используется для отправки ответа с определённым кодом и описанием ошибки
 */
class CheckApiError extends Error {
  constructor(statusCode, data) {
    super();
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Асинхронно считывает тело запроса и разбирает его как JSON
 * @param {Object} req - Объект HTTP запроса
 * @throws {CheckApiError} Некорректные данные в аргументе
 * @returns {Object} Объект, созданный из тела запроса
 */
function drainJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(JSON.parse(data));
    });
  });
}

/**
 * Проверяет входные данные и создаёт из них корректный объект дела
 * @param {Object} data - Объект с входными данными
 * @throws {CheckApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {{ name: string, owner: string, done: boolean }} Объект дела
 */
function makeCheckItemFromData(data) {
  const errors = [];

  // составляем объект, где есть только необходимые поля
  const checkItem = {
    owner: data.owner && String(data.owner),
    name: data.name && String(data.name),
    done: Boolean(data.done),
  };

  // проверяем, все ли данные корректные и заполняем объект ошибок, которые нужно отдать клиенту
  if (!checkItem.owner)
    errors.push({ field: 'owner', message: 'Не указан ответственный' });
  if (!checkItem.name)
    errors.push({ field: 'name', message: 'Не указан заголовок задачи' });
  if (!checkItem.done) checkItem.done = false;

  // если есть ошибки, то кидаем ошибку с их списком и 422 статусом
  if (errors.length) throw new CheckApiError(422, { errors });

  return checkItem;
}

/**
 * Возвращает список дел из базы данных
 * @param {{ owner: string }} [params] - Фильтр по владельцу дела
 * @returns {{ name: string, owner: string, done: boolean }[]} Массив дел
 */
function getCheckList(params = {}) {
  const checkList = JSON.parse(readFileSync(DB_FILE) || '[]');
  if (params.owner) return checkList.filter(({ owner }) => owner === params.owner);
  return checkList;
}

/**
 * Создаёт и сохраняет дело в базу данных
 * @throws {CheckApiError} Некорректные данные в аргументе, дело не создано (statusCode 422)
 * @param {Object} data - Данные из тела запроса
 * @returns {{ name: string, owner: string, done: boolean }} Объект дела
 */
function createCheckItem(data) {
  const newItem = makeCheckItemFromData(data);
  newItem.id = Date.now().toString();
  writeFileSync(DB_FILE, JSON.stringify([...getCheckList(), newItem]), {
    encoding: 'utf8',
  });
  return newItem;
}

/**
 * Возвращает объект дела по его ID
 * @param {string} itemId - ID дела
 * @throws {CheckApiError} Дело с таким ID не найдено (statusCode 404)
 * @returns {{ name: string, owner: string, done?: boolean }} Объект дела
 */
function getCheckItem(itemId) {
  const checkItem = getCheckList().find(({ id }) => id === itemId);
  if (!checkItem) throw new CheckApiError(404, { message: ' Item Not Found' });
  return checkItem;
}

/**
 * Изменяет дело с указанным ID и сохраняет изменения в базу данных
 * @param {string} itemId - ID изменяемого дела
 * @param {{ name?: string, owner?: string, done?: boolean }} data - Объект с изменяемыми данными
 * @throws {CheckApiError} Дело с таким ID не найдено (statusCode 404)
 * @throws {CheckApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {{ name: string, owner: string, done?: boolean }} Объект дела
 */
function updateCheckItem(itemId, data) {
  const checkItems = getCheckList();
  const itemIndex = checkItems.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new CheckApiError(404, { message: ' Item Not Found' });
  Object.assign(
    checkItems[itemIndex],
    makeCheckItemFromData({ ...checkItems[itemIndex], ...data })
  );
  writeFileSync(DB_FILE, JSON.stringify(checkItems), { encoding: 'utf8' });
  return checkItems[itemIndex];
}

/**
 * Удаляет дело из базы данных
 * @param {string} itemId - ID дела
 * @returns {{}}
 */
function deleteCheckItem(itemId) {
  const checkItems = getCheckList();
  const itemIndex = checkItems.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new CheckApiError(404, { message: ' Item Not Found' });
  checkItems.splice(itemIndex, 1);
  writeFileSync(DB_FILE, JSON.stringify(checkItems), { encoding: 'utf8' });
  return {};
}

// создаём новый файл с базой данных, если он не существует
if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, '[]', { encoding: 'utf8' });

// создаём HTTP сервер, переданная функция будет реагировать на все запросы к нему
createServer(async (req, res) => {
  // req - объект с информацией о запросе, res - объект для управления отправляемым ответом

  // этот заголовок ответа указывает, что тело ответа будет в JSON формате
  res.setHeader('Content-Type', 'application/json');

  // CORS заголовки ответа для поддержки кросс-доменных запросов из браузера
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // запрос с методом OPTIONS может отправлять браузер автоматически для проверки CORS заголовков
  // в этом случае достаточно ответить с пустым телом и этими заголовками
  if (req.method === 'OPTIONS') {
    // end = закончить формировать ответ и отправить его клиенту
    res.end();
    return;
  }

  // если URI не начинается с нужного префикса - можем сразу отдать 404
  if (!req.url || !req.url.startsWith(URI_PREFIX)) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not Found' }));
    return;
  }

  // убираем из запроса префикс URI, разбиваем его на путь и параметры
  const [uri, query] = req.url.substr(URI_PREFIX.length).split('?');
  const queryParams = {};

  // параметры могут отсутствовать вообще или иметь вид a=b&b=c
  // во втором случае наполняем объект queryParams { a: 'b', b: 'c' }
  if (query) {
    for (const piece of query.split('&')) {
      const [key, value] = piece.split('=');
      queryParams[key] = value ? decodeURIComponent(value) : '';
    }
  }

  try {
    // обрабатываем запрос и формируем тело ответа
    const body = await (async () => {
      if (uri === '' || uri === '/') {
        // /api/check
        if (req.method === 'GET') return getCheckList(queryParams);
        if (req.method === 'POST') {
          const newCheckItem = createCheckItem(await drainJson(req));
          res.statusCode = 201;
          res.setHeader('Location', `${URI_PREFIX}/${newCheckItem.id}`);
          return newCheckItem;
        }
      } else {
        // /api/check/{id}
        // параметр {id} из URI запроса
        const itemId = uri.substr(1);
        if (req.method === 'GET') return getCheckItem(itemId);
        if (req.method === 'PATCH') return updateCheckItem(itemId, await drainJson(req));
        if (req.method === 'DELETE') return deleteCheckItem(itemId);
      }
      return null;
    })();
    res.end(JSON.stringify(body));
  } catch (err) {
    // обрабатываем сгенерированную нами же ошибку
    if (err instanceof CheckApiError) {
      res.writeHead(err.statusCode);
      res.end(JSON.stringify(err.data));
    } else {
      // если что-то пошло не так - пишем об этом в консоль и возвращаем 500 ошибку сервера
      res.statusCode = 500;
      res.end(JSON.stringify({ message: 'Server Error' }));
      console.error(err);
    }
  }
})
  // выводим инструкцию, как только сервер запустился...
  .on('listening', () => {
    console.log(
      `Сервер запущен. Вы можете использовать его по адресу http://localhost:${PORT}`
    );
    console.log('Нажмите CTRL+C, чтобы остановить сервер');
    console.log('Доступные методы:');
    console.log(
      `GET ${URI_PREFIX} - получить список дел, query параметр owner фильтрует по владельцу`
    );
    console.log(
      `POST ${URI_PREFIX} - создать дело, в теле запроса нужно передать объект { name: string, owner: string, done?: boolean }`
    );
    console.log(`GET ${URI_PREFIX}/{id} - получить дело по его ID`);
    console.log(
      `PATCH ${URI_PREFIX}/{id} - изменить дело с ID, в теле запроса нужно передать объект { name?: string, owner?: string, done?: boolean }`
    );
    console.log(`DELETE ${URI_PREFIX}/{id} - удалить дело по ID`);
  })
  // ...и вызываем запуск сервера на указанном порту
  .listen(PORT);
