# Graphql Koa Scripts - API

There are 3 main things that should be aware of:

- App (your application),
- Server `const { Server } = require('graphql-koa-scripts');`, to make and listen the Application, and
- TestServer `const { TestServer } = require('graphql-koa-scripts');`, to test your app.


> Also in details, there are dependencies and configurations :-)


## App

App Structure can be a `Function` that return the `object`, or `object` directly.

### App Object

Basic structure:

- [configure()](API.md#configure), that return new dependencies that will be merged,
- [router()](API.md#router), to modify koaRouter, and add graphql handler, and
- [hooks[]](API.md#hooks), for advance usage, you can use hook too.

```javascript
{

  // overrides any dependencies and configuration with this function,
  // you need to replace logger? here you go, just put logger in return object, it will be merged.
  configure(dependencies) {
    return { ...modifiedDependencies }
  }

  router(koaRouter, dependencies) {
    // ... do something here to modify koa,

    // example return qs:
    r.get('/qs', (ctx) => {
      ctx.body = ctx.query;
    });

    // add graphql?
    dependencies.graphqlHandler({
      typeDefs: `
        type Query {
          hello: String
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'Awesome!',
        },
      },
      endpointUrl: '/graphql',
    });
  }

  // hooks
  hooks: [
    { on: 'http:listen:before', fn: () => console.log('http:listen:before!!!'), },
    { on: 'http:listen:after', fn: () => console.log('http:listen:after!!!'), },
  ],

}

```


### App as Function

When we need to initialize the application before routing, handler. For example, database connection.

You can pass `App` as a function in `Server(App)`. but be sure to return the `App Object`.

example:

```javascript
const App = async (dependencies) => {

  // do something here,

  // examples
  const mongo = /* .... */;

  const zipkinTracer = /* .... */;


  // return App Object
  return {
    configure() {
      /* .... */
    }

    router() {
      /* .... */
    }
  }

}

// fire up!
Server(App);
```


### Configure

Configure function basically is to get the `dependencies`. And replace something that you want to costumize.

Full list of dependencies are in [dependencies section](API.md#dependencies).

**Example changing PORT**

You can pass the port your server want to listen, like `configure: () => ({ PORT: 3000 })`

> \*hint: or you can add something in dependencies, to be use later :-)


### Router

Router takes 2 arguments `router(koaRouter, dependencies)`. *Yes actually koaRouter, is in dependencies too.*


example using it:

```javascript
{
  router(koaRouter, dependencies) {

    // example return qs:
    r.get('/qs', (ctx) => {
      ctx.body = ctx.query;
    });

    // return server date?
    r.get('/date', (ctx) => {
      ctx.body = new Date().toISOString();
    });

  }
}
```


### Hooks

*will be added later*


### graphqlHandler

This function is what the reason why this package made :-).

it takes `graphql schema`, and `endpointUrl`. and put it in the `koaRouter`.

#### Options

Any options put in `graphqlHandler` actually will be put into `new ApolloServer({ ... options ...})` too.

Therefore, if you want to customize the ApolloServer Server's options, just put it.

#### Basic Usage

```javascript
graphqlHandler({

  typeDefs: `
    type Query {
      hello: String
    }
  `,

  resolvers: {
    Query: {
      hello: () => 'Awesome!',
    },
  },

  endpointUrl: '/graphql',
});
```

!> At least put these 3: `resolvers`, `typeDefs`, and `endpointUrl`.

> Even if you make multiple graphql endpoint, just call again `graphqlHandler`, with different `endpointUrl`.


#### Subscription

It's nice to put subscription aware. when you have `resolvers.Subscription`. It will auto detect, and blend it too.


##### Example Usage

```javascript
const { withFilter } = require('graphql-subscriptions');

const typeDefs = `
  type Query {
    hello(name: String): String
  }
  type Subscription {
    healthcheck: String
  }
`;

const resolvers = {
  Query: {
    hello: (_, { name = 'guest' }) => `Hello ${name}!`,
  },

  Subscription: {
    healthcheck: {
      subscribe: withFilter(
        () => global.graphqlPubSub.asyncIterator('all'),
        (payload /* , variables */) => typeof payload.healthcheck === 'string',
      ),
    },
  },
};

// blend it!
graphqlHandler({
  typeDefs,
  resolvers,
  endpointUrl: '/graphql',
});
```

!> Known bug: only 1 `graphqlHandler` that can have subscription. Multiple graphql endpointUrl with different subscription still considered to be added.


## Server(App)

`Server` is a Function that take your `App` and make blend it into `koa` and `apollo server`.

There is several ways to put your app:

- `App Object`,
- `App Function`, and
- `App` path.


### Example Usage

```javascript
const { Server } = require('graphql-koa-scripts');

// direct object
Server({
  router() { /* ... */ }
});

// as wrapper function
Server(async () => {
  /* ...do something... */
  return {
    configure() { /* ... */ }
    router() { /* ... */ }
  }
});

// to "require" the app
Server('path-to-file.js');
```


### App as Path to App File (String)

This another use case, is to separate the app and the loader.

For example, you have 2 files:

- `http/listen.js`, that `module.exports = { ... }` the App object / function.
- `index.js`, that load everything.

in `index.js` you can put it something like:

```javascript
const { Server } = require('graphql-koa-scripts');

Server(`${__dirname}/http/listen.js`);
```

> Note that we use \__dirname, because the `Server` doesn't aware the path. So put it in absolute path is better.

\*hint: This usage, is usefull in `TestServer`.


## TestServer(App)


E2E test need full graphql server, in that manner, we provide `TestServer`, that leverage `apollo-server-testing`.

!> But this leverage in this time of writing, can't handle subscription.

### Example usage

```javascript
const { TestServer } = require('graphql-koa-scripts');

const App = require('../../app');

describe('can create test server ', () => {

  it('try graphql', async () => {
    const { apolloClients, quit } = await TestServer(App);

    const res = apolloClients['/graphql'].query({
      query: '{ hello }',
    });

    await expect(res).resolves.toMatchObject({
      data: {
        hello: 'Awesome!',
      },
    });

    return quit();
  });

  it('try koaRouter /qs', async () => {
    const { supertest, quit } = await TestServer(App);

    const response = supertest.get('/qs?foo=bar');
    await expect(response).resolves.not.toThrow();

    const { body } = await response;
    expect(body).toMatchObject({ foo: 'bar' });

    return quit();
  });

});
```

**Parameter**

`TestServer` have identical parameter usage as `Server`, its the `App`.


### Tooling

There are 3 usefull tools, returned by `TestServer`:

- `apolloClients`: object contain all `apolloClient` for each `endpointUrl`,
- `supertest`: to test your http server directly, and
- `quit`: quit function. To terminate the server, *escape openhandles*.


#### apolloClients

This object contain all graphql endpointUrl. it will be formed as example:

```javascript
const apolloClients: {

  "/graphql": grapqhlServer('/grapqhlServer'),

  "/another-graphql": grapqhlServer('/another-graphql'),

  "/secret-endpoint-graphql": grapqhlServer('/secret-endpoint-graphql'),

}
```

Therefore, you can use it as:

```javascript
const res = apolloClients['/graphql'].query({
  query: '{ hello }',
});
```

More reference: https://www.apollographql.com/docs/apollo-server/testing/testing/#createtestclient


## UsingTestServer(App, fn)

> A wrapper of bluebird.using, wrap quit() as disposer. easier testing

For easier testing when you just want to do `expect()...` without worrying about `quit()`.

example:

```javascript
const { UsingTestServer } = require('graphql-koa-scripts');

describe('using UsingTestServer(App, fn)', () => {

  it(
    'try some action',
    UsingTestServer(`${__dirname}/app.js`, async ({ supertest }) => {

      expect('do some expect').not.toBe('in here');

    }),
  );

});
```

**fn**

You can write fn as `async (dependencies) => { ... }`


## Dependencies (Context)

All the dependencies can be changed via `configure`. Here are the list of current dependencies:

- `hook`,
- `bluebird`,
- `logger` *bunyan logger compatible*,
- `koa`,
- `koaRouter`,
- `graphqlPubSub` *be sure to change this, if you use something like redis backed*,
- `graphqlHandler`

*configuration related:*

- `PORT`, defaultsTo: `PORT || process.env.PORT || 4001`
- `DISABLE_LISTEN`, defaultsTo: `false`
- `DISABLE_HEALTHCHECK`, set it to `true`, if you want to disable it
