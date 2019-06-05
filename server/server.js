"use strict";

import express from "express";
import { ApolloServer } from "apollo-server-express";
import session from "express-session";
import { merge } from "lodash";
import ms from "ms";
import cors from 'cors';

import { loadTypeSchema } from "./utils/schema";
import config from "./config/config";
import { connect } from "./db";
import user from "./types/user/user.resolvers";
import deck from "./types/deck/deck.resolvers";
import card from "./types/card/card.resolvers";

var MongoDBStore = require("connect-mongodb-session")(session);

var types = ["user", "deck", "card"];

async function start() {
  const rootSchema = `
    schema {
      query: Query
      mutation: Mutation
    }
  `;

  var schemaTypes = await Promise.all(types.map(loadTypeSchema));

  var server = new ApolloServer({
    typeDefs: [rootSchema, ...schemaTypes],
    resolvers: merge({}, user, deck, card),
    context(req) {
      return { ...req.req };
    }
  });

  var app = express();

  // disable leaking info of what server we're using
  app.disable('x-powered-by');

  var store = new MongoDBStore({
    uri: config.dbUrl,
    collection: "sessions"
  });

  store.on("error", function(error) {
    console.log(error);
  });

  app.use(
    session({
      name: "sessionId",
      secret: `test-secret`,
      resave: true,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV == "production",
        maxAge: ms("1d")
      },
      store: store
    })
  );

  const serverUrl = `${config.proto}://${config.host}:${config.port}`;

  var corsOptions = {
    origin: ['http://localhost:3000', serverUrl],
    credentials: true
  }

  app.use(cors(corsOptions))

  server.applyMiddleware({ app, cors: false });

  var opts = {
    port: config.port
  };

  try {
    await connect(config.dbUrl);
  } catch (err) {
    console.log(`Error connecting to db: ${err}`);
  }

  try {
    await app.listen(opts);
    console.log(`GQL server ready at ${serverUrl}${server.graphqlPath}`);
  } catch (err) {
    console.log(`Error bringing up the server: ${err}`);
  }
}

export default start;
