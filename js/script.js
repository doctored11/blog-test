let plusPage = document.querySelector('.page-plus');
let minusPage = document.querySelector('.page-minus');
let pageN = document.querySelector('.page-num');

let n = getPageId();

getList(n);
pageControll(n);

plusPage.addEventListener('click', () => {
  let n = getPageId() || 1;
  pagePlus(n);
});
minusPage.addEventListener('click', () => {
  let n = getPageId() || 1;
  pageMinus(n);
});

// ↓↑

async function getList(n) {
  const response = await fetch(`https://gorest.co.in/public/v2/posts?page=${n}`, {
    //от 1 до 149 вкл
    method: 'Get',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  console.log(data);
  // return data;
  //функция возвращает promise, поэтому вызов отрисовки тут↓
  fillNavigation(data);
}

//запросы↑
//вспомогательные  фи↓

let linksBlock = document.querySelector('.links-block');

function fillNavigation(data) {
  for (let i = 0; i < data.length; ++i) {
    addNavLink(data[i]);
  }
}
function pagePlus(n) {
  linksClear();
  n++;
  open(`index.html?=${n}`, '_self', false);
}
function pageMinus(n) {
  linksClear();
  n--;
  open(`index.html?=${n}`, '_self', false);
}

function linksClear() {
  linksBlock.innerHTML = '';
}

function addNavLink(n) {
  let bufLink = document.createElement('a');
  bufLink.href = `page.html?post=${n.id} `;
  bufLink.textContent = `${n.title}`;
  bufLink.classList.add('nav-link');
  linksBlock.append(bufLink);
}

//повтор функции из page.js (
function getPageId() {
  let buf = document.location.href.split('=')[1];
  console.log(buf);
  return buf;
}

function pageControll(n) {
  pageN.textContent = n;
}
