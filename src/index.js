import React from "react";
import { render } from "react-dom";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

import { link } from "./graphql/link";
import App from "./App";

import "./index.css";

const resolvers = {
  Person: {
    clientObject: (person, args, context, info) => {
      // console.log("in person resolver", person);
      if (!person.clientObject) {
        console.log(`Generating person.clientObject for person: ${person.name}`);
        return { clientTime: new Date().toLocaleTimeString() };
      }
      return person.clientObject;
    }
  }
};

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link,
  resolvers
});

render(
  <ApolloProvider client={client}>
    <App client={client} />
  </ApolloProvider>,
  document.getElementById("root")
);
