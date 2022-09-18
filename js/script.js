// async function loadItems() {
//   const response = await fetch('http://localhost:3000/api/check');
//   const data = await response.json();
//   console.log(data);
// }
// loadItems(); public/v2/posts?page=1
async function getList() {
  const response = await fetch('https://gorest.co.in/public/v2/posts?page=1', {
    //от 1 до 149 вкл
    method: 'Get',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  console.log(data);
}
async function getComms() {
  const response = await fetch('https://gorest.co.in/public/v2/comments?post_id=4', {
    method: 'Get',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  console.log(data);
}
async function getItem() {
  const response = await fetch('https://gorest.co.in/public/v2/posts/15', {
    method: 'Get',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  console.log(data);
}
getList();
getComms();
getItem();
