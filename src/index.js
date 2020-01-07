import React from "react";
import { render } from "react-dom";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

import { link } from "./graphql/link";
import App from "./App";

import "./index.css";

const resolvers = {
  Person: {
    clientObject: (person, args, context, info) => {
      console.log("in person resolver", person);
      if (!person.clientObject) {
        console.log(`Resolvers - generating person.clientObject for person: ${person.name}`);
        return { clientTime: new Date().toLocaleTimeString() };
      }
      return person.clientObject;
    }
  }
};

const typePolicies = {
  Person: {
    fields: {
      name: (co, { readField }) => {
        console.log("*** in person.name typePolicies", co);
        return co;
      },
      clientObject: (co, param2) => {
        console.log("*** in person.clientObject typePolicies", co, param2);
        if (!co) {
          //console.log(`**** TypePolicies - generating person.clientObject for person: ${readField('name')}`);
          return { clientTime: new Date().toLocaleTimeString() };
        }
        return co;
      }
    }
  }
};

const client = new ApolloClient({
  cache: new InMemoryCache({ typePolicies }),
  link,
  resolvers,
});

render(
  <ApolloProvider client={client}>
    <App client={client} />
  </ApolloProvider>,
  document.getElementById("root")
);
