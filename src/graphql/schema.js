import { GraphQLSchema, GraphQLObjectType, GraphQLID, GraphQLString, GraphQLList } from "graphql";

const PersonType = new GraphQLObjectType({
  name: "Person",
  fields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    serverTime: { type: GraphQLString }
  }
});

const peopleData = [
  { id: 1, name: "John Smith", serverTime: new Date().toLocaleTimeString() },
  { id: 2, name: "Sara Smith", serverTime: new Date().toLocaleTimeString() },
  { id: 3, name: "Budd Deey", serverTime: new Date().toLocaleTimeString() }
];

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    people: {
      type: new GraphQLList(PersonType),
      resolve: () =>
        peopleData.map(person => {
          return { ...person, serverTime: new Date().toLocaleTimeString() };
        })
    }
  }
});

export const schema = new GraphQLSchema({ query: QueryType });
