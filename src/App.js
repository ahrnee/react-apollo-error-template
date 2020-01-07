import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";

const PERSON_FRAGMENT = gql`
  fragment PersonFragment on Person {
    id
    name
    serverTime
    clientObject @client(always: true)
  }
`;

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      ...PersonFragment
    }
  }
  ${PERSON_FRAGMENT}
`;

export default function App({ client }) {
  console.log('--------->');

  const { loading, data } = useQuery(ALL_PEOPLE);
  const [showIssueNotes, setShowIssueNotes] = useState(false);

  //
  const fetch = (fetchPolicy = "cache-first") => {
    client.query({ query: ALL_PEOPLE, fetchPolicy }).then(result => {
      console.log(`Query(${fetchPolicy})`, result);
    });
  };

  //
  const writeQuery = () => {
    const closureData = data;
    const newData = { people: [...closureData.people, { ...closureData.people[0], id: closureData.people.length + 1 }] };
    console.log('writeQuery. newData', newData);
    client.writeQuery({
      query: ALL_PEOPLE,
      data: newData,
    });
    setShowIssueNotes(false);
  }

  //
  const writeFragment = (key) => {
    console.log('writeFragment');
    client.writeFragment({
      fragment: PERSON_FRAGMENT,
      id: key,
      data: { clientObject: null },
    });
  }

  //
  const writeData = (key, field) => {
    console.log('writeData');
    client.writeData({ id: key, data: { [field]: null } });
  };

  //
  const evictField = (key, field) => {
    console.log(`evictField(${key}, ${field})`, client.cache.evict(key, field));
    client.cache.gc();
  };

  //
  const evictFragment = (key, field) => {
    console.log(`evictFragment(${key})`, client.cache.evict(key));
    client.cache.gc();
  };

  const nothingButAConsoleLog = () => {
    console.log('nothing but a console log');
  }

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <h2>
        Issue Notes (
        <a
          onClick={e => {
            e.preventDefault();
            setShowIssueNotes(!showIssueNotes);
          }}
          href="#"
        >
          Toggle Display
        </a>
        )
      </h2>
      {showIssueNotes && <IssueNotes />}
      <hr />
      <h2>Demo</h2>

      <h3>Names</h3>
      {loading ? (<p>Loading…</p>) : (
        <ul>
          {data.people.map(person => (
            <li key={person.id}>
              {person.name} ( <span style={{ color: "blue" }}>Server Time: <b>{person.serverTime}</b></span>, <span style={{ color: "green" }}>Client Time: <b>{person.clientObject.clientTime}</b></span> )
            </li>
          ))}
        </ul>
      )}

      <h3>Actions</h3>
      <div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetch("cache-first")}>Query (cache-first)</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetch("cache-only")}>Query (cache-only)</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => writeQuery()}>cacheWriteQuery</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => writeFragment("Person:2")}>cacheWriteFragment</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => writeData("Person:2", "clientObject")}>cacheWriteData</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => evictField("Person:2", "clientObject")}>evictField</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => evictFragment("Person:2")}>evictFragment</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => nothingButAConsoleLog()}>Nothing But A Console Log</button>
        </div>
      </div>
    </main>
  );
}

function IssueNotes() {
  return (
    <>
      <h3>Expected Behavior</h3>
      TBD
      <h3>Actual Behavior</h3>
      TBD
      <h3>Reproduction Steps</h3>
      <ol>
        <li>TBD</li>
      </ol>
      <h3>Notes</h3>
      <p>
        TBD
      </p>
    </>
  );
}
