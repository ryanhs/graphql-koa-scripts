# Graphql Koa Scripts

![npm](https://img.shields.io/npm/v/graphql-koa-scripts)  ![node-current](https://img.shields.io/node/v/graphql-koa-scripts)  [![Build Status](https://travis-ci.com/ryanhs/graphql-koa-scripts.svg?branch=master)](https://travis-ci.com/ryanhs/graphql-koa-scripts)  [![Coverage Status](https://coveralls.io/repos/github/ryanhs/graphql-koa-scripts/badge.svg?branch=master)](https://coveralls.io/github/ryanhs/graphql-koa-scripts?branch=master)  


**Still Early Release**. We still test it in our own production server. Stable version **1.0** come soon!

Documentation: [https://ryanhs.github.io/graphql-koa-scripts/](https://ryanhs.github.io/graphql-koa-scripts/)

## Motivation

This scripts made to be simplify the setup of projects. with koa + apollo graphql.

I really want to make a project setup as simple as possible:
  - `index.js`,
  - `package.json`,
  - `Dockerfile` (optional when needed)

Thats it! no more overhead setup.


## Example index.js

With this enough `index.js`, graphql already setup. This what simple is?

*Notes: if you use subscription on your graphql, it will automatically listen subscription-ws.*

```javascript
const { Server } = require('graphql-koa-scripts');

Server({
  configure: () => ({ PORT: 14099 }),

  router(_, { graphqlHandler }) {
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
  },
})
```


## Installation

To install just use `yarn` or `npm`. Example:
```sh
yarn add graphql-koa-scripts
```

## [Examples](https://ryanhs.github.io/graphql-koa-scripts/#/examples/index)


## LICENSE

MIT
