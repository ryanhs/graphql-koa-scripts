const { withFilter } = require('graphql-subscriptions');
const flaverr = require('flaverr');

// Construct a schema, using GraphQL schema language
const typeDefs = `
  type Query {
    hello(name: String): String

    justErrorUnknownWithoutMessage: String
    justErrorUnknown: String
    justErrorValidation(a: Int!): String
  }

  type Subscription {
    healthcheck: String
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {

  Query: {
    hello: (_, { name = 'guest'}) => `Hello ${name}!`,
    
    justErrorUnknownWithoutMessage: () => { throw new Error(); },
    justErrorUnknown: () => { throw flaverr({ code: 'E_UNKNOWN_ERROR' }, new Error('haha')); },
    justErrorValidation: () => { throw flaverr({ code: 'E_INVALID_ARGINS' }, new Error('haha')); },
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

module.exports = {
  typeDefs,
  resolvers,
  endpointUrl: '/graphql',
};
