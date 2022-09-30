//вызываемые фи↓

let n = getPageId();
getItem(n);
getComms(n);

//вызываемые фи↑
//запросы↓

async function getComms() {
  const response = await fetch(`https://gorest.co.in/public/v2/comments?post_id=${n}`, {
    method: 'Get',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  console.log(data);
  addComments(data); //приходится вызывать тут (
  return data; //promise(
}
async function getItem(n) {
  const response = await fetch(`https://gorest.co.in/public/v2/posts/${n}`, {
    method: 'Get',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  console.log(data);
  //не получается возвращать массив тут, одни promise 😭
  fillArticle(data);
  return data; //promise(
}

//запросы↑
//вспомогательные  фи↓

let title = document.querySelector('.title');
let artContent = document.querySelector('.content');
let comBlock = document.querySelector('.coment-block');

function getPageId() {
  let buf = document.location.href.split('=')[1];
  console.log(buf);
  return buf;
}

function fillArticle(data) {
  title.textContent = data.title;
  artContent.textContent = data.body;
}
function addComments(data) {
  for (let i = 0; i < data.length; ++i) {
    addComment(data[i]);
  }
}
function addComment(n) {
  let bufComBlock = document.createElement('div');
  bufComBlock.classList.add('active__block');

  let bufName = document.createElement('p');
  bufName.classList.add('comment__name');
  bufName.textContent = n.name;

  let bufContent = document.createElement('p');
  bufContent.classList.add('comment__content');
  bufContent.textContent = n.body;

  bufComBlock.append(bufName);
  bufComBlock.append(bufContent);
  comBlock.append(bufComBlock);
}
