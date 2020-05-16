# Graphql Koa Scripts

**Still Early Release**. We still testing it in our own production server. Stable version **1.0** come soon!

## Motivation

This scripts made to be simplify the setup of projects. with koa + apollo graphql + ncurated.

I really want to make a project setup as simple as possible, 1 file js, 1 package.json, and 1 Dockerfile when needed. Thats it! no more overhead setup.

##### Example index.js

with this enough index.js, graphql already setup. this is that make it simple.

*Notes: if you use subscription on your graphql, it will automatically listen subscription-ws.*

```javascript
module.exports = ({ graphqlHandler }) => {
  return ({
    // use koa-router
    router(r) {

      // test qs
      r.get('/qs', (ctx) => { ctx.body = ctx.query; });

      // its ok to add handlers here
      graphqlHandler({
        typeDefs: `
          type Query {
            hello: String
          }
        `,
        resolvers: {
          Query: {
            hello: () => 'Awesome!'
          }
        },
        endpointUrl: '/graphql',
      });

    },
  });
};
```

Just run it with `npm run start` for example.

example package.json:

```
{
  ...
  "dependencies": {
    ...
    "graphql-koa-scripts": "^0.0.5"
  },
  "scripts": {
    "start": "SDK_LOG_DEBUG_ENABLE=true NODE_ENV=development graphql-koa-scripts start index.js --dev"
  }
}

```


#### Docs

powered by [docsify](https://docsify.js.org/)
