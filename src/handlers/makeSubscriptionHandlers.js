/*
 * REASON:
 * https://www.apollographql.com/docs/apollo-server/data/subscriptions/
 * Apollo Server 3 removes built-in support for subscriptions
 */

const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');

async function makeSubscriptionHandlers({ httpServer, schema, endpointUrl = '/graphql' }) {
  // Creating the WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: endpointUrl,
  });

  // Hand in the schema we just created and have the
  // WebSocketServer start listening.
  const serverCleanup = useServer({ schema }, wsServer);

  // Proper shutdown for the WebSocket server.
  const wsPluginDrainHttpServer = {
    async serverWillStart() {
      return {
        async drainServer() {
          await serverCleanup.dispose();
        },
      };
    },
  };

  return { wsServer, plugins: [wsPluginDrainHttpServer] };
}

module.exports = makeSubscriptionHandlers;
