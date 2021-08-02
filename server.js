const http = require('http');
const port = process.env.PORT || 8080;
const Koa = require('koa');
const cors = require('koa2-cors');
//const koaBody = require('koa-body');
const WS = require('ws');
//const uuid = require('uuid');
//const Router = require('koa-router');
const app = new Koa();
const server = http.createServer(app.callback());
const wsServer = new WS.Server({server});
//const router = new Router();
const users = [];

app.use(
  cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// app.use(koaBody({
//     urlencoded: true,
//     multipart: true,
//     text: true,
//     json: true,
// }));

// app.use(async (ctx, next) => {
//   const origin = ctx.request.get('Origin');
//   if (!origin) {
//     return await next();
//   }
//   const headers = { 'Access-Control-Allow-Origin': '*', };

//   if (ctx.request.method !== 'OPTIONS') {
//     ctx.response.set({...headers});
//     try {
//       return await next();
//     } catch (e) {
//       e.headers = {...e.headers, ...headers};
//       throw e;
//     }
//   }

//   if (ctx.request.get('Access-Control-Request-Method')) {
//     ctx.response.set({
//       ...headers,
//       'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
//     });

//     if (ctx.request.get('Access-Control-Request-Headers')) {
//       ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
//     }
//     ctx.response.status = 204;
//   }
// });

// router.get('/users', async (ctx, next) => {
//   ctx.response.body = users;
// });

// router.post('/users/:name', async (ctx, next) => {
//   const user = {...ctx.request.body, id: uuid.v4()};
//   users.push(user);
//   ctx.response.status = 200;
// });

// router.delete('users/:name', async (ctx, next) => {
//   const index = users.findIndex(({name}) => name === ctx.params.name);
//   if (index !== -1) {
//     users.splice(index, 1);
//   }
//   ctx.response.status = 200;
// });

wsServer.on('connection', (ws, req) => {
  ws.on('message', (msg) => {
    const request = JSON.parse(msg);
    if (request.event === 'login') {
      const nickname = users.findIndex((item) => item.name.toLowerCase() === request.message.toLowerCase());
      if (nickname !== -1) {
        ws.send(JSON.stringify({event: 'error', message: 'Данный псевдоним уже существует'}));
      } 
      if (request.event && nickhame === -1) {
        ws.name = request.message;
        const userList = users.map((item) => item.name);
        ws.send(JSON.stringify(
          {
            event: 'connect',
            message: userList,
          }
        ));
        users.push(ws);
        users.forEach((item) => {
          const userMsg = JSON.stringify({
            event: 'system',
            message: {
              action: 'login',
              name: ws.name,
            }
          });
          item.send(userMsg);
        });
      }
    }
    if (request.event === 'chat') {
      users.forEach((item) => {
        const userMsg = JSON.stringify({
          event: 'chat',
          message: {
            name: ws.name,
            created: new Date().toLocaleString('ru'),
            text: request.message,
          }
        });
        item.send(userMsg);
      })
    }
});

ws.on('close', () => {
  const nickname = users.findIndex((item) => item.name === ws.name);
  if (nickname !== -1) {
    users.splice(nickname, 1);
    users.forEach((item) => {
      const userMsg = JSON.stringify({
        event: 'system',
        message: {
          action: 'logout',
          name: ws.name,
        }
      });
      item.send(userMsg);
    })
  }
});


});

server.listen(port, () => console.log('Server started'));
