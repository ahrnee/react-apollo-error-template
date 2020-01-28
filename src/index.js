import React from "react";
import { render } from "react-dom";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

import { link } from "./graphql/link";
import App from "./App";

import "./index.css";

const resolvers = {
  // Person: {
  //   clientObject: (person, args, context, info) => {
  //     // console.log("in person resolver", person);
  //     if (!person.clientObject) {
  //       console.log(`Generating person.clientObject for person: ${person.name}`);
  //       return { clientTime: new Date().toLocaleTimeString() };
  //     }
  //     return person.clientObject;
  //   }
  // }
};

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
  resolvers
});

render(
  <ApolloProvider client={client}>
    <App client={client} />
  </ApolloProvider>,
  document.getElementById("root")
);
