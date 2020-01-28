import React from "react";
import { render } from "react-dom";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

import { link } from "./graphql/link";
import App from "./App";

import "./index.css";

const typePolicies = {
  Query: {
    fields: {
      person: {
        keyArgs: ["id"],
        read(existingData, { args, toReference }) {
          console.log(`--> typePolicy for person id: ${args.id}`);
          return existingData || toReference({ __typename: 'Person', id: args.id });
        },
      }
    },
  },
};

const client = new ApolloClient({
  cache: new InMemoryCache({ typePolicies }),
  link,
});

render(
  <ApolloProvider client={client}>
    <App client={client} />
  </ApolloProvider>,
  document.getElementById("root")
);
