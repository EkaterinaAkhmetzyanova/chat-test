const http = require('http');
const port = process.env.PORT || 8080;
const Koa = require('koa');
const koaBody = require('koa-body');
const WS = require('ws');
const uuid = require('uuid');
const Router = require('koa-router');
const app = new Koa();
const server = http.createServer(app.callback());
const wsServer = new WS.Server({server});
const router = new Router();
const users = [];


app.use(koaBody({
    urlencoded: true,
    multipart: true,
    text: true,
    json: true,
}));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers});
    try {
      return await next();
    } catch (e) {
      e.headers = {...e.headers, ...headers};
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }
    ctx.response.status = 204;
  }
});

router.get('/users', async (ctx, next) => {
  ctx.response.body = users;
});

router.post('/users/:name', async (ctx, next) => {
  const user = {...ctx.request.body, id: uuid.v4()};
  users.push(user);
  ctx.response.status = 200;
});

router.delete('users/:name', async (ctx, next) => {
  const index = users.findIndex(({name}) => name === ctx.params.name);
  if (index !== -1) {
    users.splice(index, 1);
  }
  ctx.response.status = 200;
});

wsServer.on('connection', (ws, req) => {
  const arr = [...wsServer.users];
  ws.on('message', (msg) => {
    
    arr.filter((el) => {
      return el.readyState === WS.OPEN;
    })
    .forEach((el) => el.send(JSON.stringify({type: 'delete user'})));
    ws.close();
  });
  arr.filter((el) => {
    return el.readyState === WS.OPEN;
  })
  .forEach((el) => el.send(JSON.stringify({type: 'add user'})));
});

app.use(router.routes()).use(router.allowedMethods());
server.listen(port);