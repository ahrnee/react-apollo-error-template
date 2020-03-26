import React, { useState, useEffect } from "react";
import { gql, useQuery, defaultDataIdFromObject } from "@apollo/client";
import { useCacheSnapshots } from "./helpers/useCacheSnapshots";

const PERSON_FRAGMENT = gql`
  fragment PersonFragment on Person {
    id
    name
    serverTime
    #clientObject @client(always: true)
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

const ONE_PERSON = gql`
  query OnePerson($id: ID) {
    person(id: $id) {
      ...PersonFragment
    }
  }
  ${PERSON_FRAGMENT}
`;

export default function App({ client }) {
  const [people, setPeople] = useState(null);
  const [person, setPerson] = useState(null);
  const [showIssueNotes, setShowIssueNotes] = useState(false);
  const [userMessage, setUserMessage] = useState(null);
  const { methods: { addCacheSnapshotToLog }, components: { SnapshotLogViewer } } = useCacheSnapshots({ client });

  //
  const fetchPeople = (fetchPolicy = "cache-first") => {
    setUserMessage(`ALL_PEOPLE fetch (${fetchPolicy}) executing`);
    return client.query({ query: ALL_PEOPLE, fetchPolicy }).then(result => {
      setPeople(result.data.people);
      addCacheSnapshotToLog(`fetch (${fetchPolicy})`);
      return result.data.people;
    });
  };

  //
  const fetchPeopleFromClientCache = () => {
    const peopleResult = client.readQuery({ query: ALL_PEOPLE });
    if (peopleResult) {
      const { people } = peopleResult;
      console.log(people);
      setPeople(people);
      addCacheSnapshotToLog(`fetchPeopleFromClientCache`);
    }
  };

  //
  const fetchOnePerson = (id, fetchPolicy = "cache-first") => {
    setUserMessage(`ONE_PERSON fetch (${fetchPolicy}) executing`);
    client.query({ query: ONE_PERSON, variables: { id }, fetchPolicy }).then(result => {
      setPerson(result.data.person);
      addCacheSnapshotToLog(`fetch (${fetchPolicy})`);
      return result.data.person;
    });
  };

  const evictOnePerson = (id => {
    const evictId = defaultDataIdFromObject({ __typename: 'Person', id });
    setUserMessage(`evict: ${evictId} - executing`);
    client.cache.evict(evictId);
    client.cache.gc();
    addCacheSnapshotToLog(`evictOnePerson (${evictId})`);
  });

  //
  const createNewPersonQuery = () => {
    fetchPeople().then((people) => {
      const newData = { people: [...people, { __typename: 'Person', id: `${people.length + 1}`, name: `New Person ${people.length + 1}`, serverTime: new Date().toLocaleTimeString() }] };
      console.log('writeQuery. newData', newData);
      client.writeQuery({ query: ALL_PEOPLE, data: newData, });
    })
  }

  //
  const createNewPersonFragment = ({ id, name }) => {
    console.log('writeFragment');
    client.writeFragment({ fragment: PERSON_FRAGMENT, id: defaultDataIdFromObject({ __typename: 'Person', id }), data: { __typename: 'Person', id, name, serverTime: new Date().toLocaleTimeString() } });
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
      <h3>Messages</h3>
      {userMessage ? <div>{userMessage}</div> : <div>No Messages</div>}

      <h3>Names</h3>
      {!people ? (<p>No People Loaded</p>) : (
        <ul>
          {people.map(personItem => (
            <li key={personItem.id}>
              {personItem.name} ( <span style={{ color: "blue" }}>Server Time: <b>{personItem.serverTime}</b></span> )
            </li>
          ))}
        </ul>
      )}

      <h3>Person</h3>
      {!person || !person.id ? (<p>No Person Loaded</p>) : (
        <ul>
          <li key={person.id}>
            {person.name} ( <span style={{ color: "blue" }}>Server Time: <b>{person.serverTime}</b></span>)
            </li>
        </ul>
      )}

      <SnapshotLogViewer />

      <h3>Actions</h3>
      <div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetchOnePerson(1, "cache-first")}>1. Run ONE_PERSON (id:1) Query (cache-first)</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetchPeople("cache-first")}>2. Run ALL_PEOPLE Query (cache-first)</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetchPeople("cache-only")}>3. Run ALL_PEOPLE Query (cache-only)</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetchPeopleFromClientCache("cache-first")}>4. Fetch People from InMemory Cache</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => createNewPersonFragment({ id: Math.random(), name: `New Person ${Math.random()}` })}>5. Create New Person Fragment</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => createNewPersonQuery()}>6. Create New Person Query</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => evictOnePerson(1)}>7. Evict on person (id:1)</button>
        </div>
      </div>
    </main>
  );
}

function IssueNotes() {
  return (
    <>
      <h3>Expected Behavior</h3>
      null returned from client.readQuery if not results are available
      <h3>Actual Behavior</h3>
      Exception is thrown from client.readQuery in some circumstances if results not available
      <h3>Reproduction Steps</h3>
      <ol>
        <li>Click button: '4. Fetch People from InMemory Cache', and note that no exception is thrown</li>
        <li>Click button: '1. Run ONE_PERSON (id:1) Query (cache-first)', and note that, as expected, the person field has been initialized on ROOT-QUERY (but not people field) </li>
        <li>Click button: '4. Fetch People from InMemory Cache' again, and observe error 'Can't find field people on ROOT_QUERY object'</li>
      </ol>
      <h3>Notes</h3>
      <p>
        It is not clear if this is expected behaviour. However, I assume not,
        as otherwise there seems to be not clear way to guard against missing fields on
        ROOT_QUERY when working with InMemory cache directly (using client.readQuery and client.cache.readQuery)
      </p>
    </>
  );
}
