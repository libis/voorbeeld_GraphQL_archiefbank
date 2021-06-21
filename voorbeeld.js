// Dit is een voorbeeld om GRAPHQL queries te doen naar https://abv.libis.be/graphql
// De grafische query builder is te vinden op https://abv.libis.be/graphiql
// !!!!!!!!!!!!!!!
// abv_gebruiker en abv_paswoord zijn omgevingsvariabelen die gebruikt worden om een JWT op te halen
// !!!!!!!!!!!!!!!

"use strict";
const fetch = require('node-fetch');
const util = require('util');
const readline = require('readline');

//simpele GRAPHQL runner.
const run = async (query, parameters, jwt = null) => {
  const queryBody = {
    "query": query,
    "variables": parameters
  };

  let headers = {
    "accept": "application/json",
    "content-type": "application/json",
  };

  if (jwt){
    headers['authorization'] = `Bearer ${jwt}`;
  }

  const response = await fetch("https://abv.libis.be/graphql", {
    "headers": headers,
    "body": JSON.stringify(queryBody),
    "method": "POST",
    "mode": "cors"
  });

  const data = await response.json();
  return data;
}

//JWT ophalen
const leesJWT = async (email, password) => {
  try {
    const query = `
    mutation Authenticate($email: String!, $paswoord: String!) {
      authenticatie(input: {email: $email, paswoord: $paswoord}) {
        jwtToken
      }
    }
`;

    const data = await run(query, {
      "email": email,
      "paswoord": password
    });

    if (Object.keys(data).includes('errors')) {
      console.log('JWT token niet beschikbaar');
      process.exit(-1);
    }

    return data['data']['authenticatie']['jwtToken'];
  } catch (e) {
    console.log(e);
  }
}

//Eenvoudige voorbeeld om een bewaarplaats op te halen
const bewaarplaatsByID = async (parameters,jwt) => {
  try{
    const query = `
query Bewaarplaats($limit: Int = 10, $after: Cursor = null) {
  bewaarplaatsen(first: $limit, after: $after) {
    nodes {
      bewaarplaatsEntityId
      identificatie
      contactgevens
      contactperson
      beschrijving
      toegangen
      voorzieningen
      controle
      laatsteWijziging
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
    totalCount
  }
}
    `;


    const data = await run(query, parameters, jwt);

    return data['data']['bewaarplaatsen'];

  } catch(e) {
    console.log(e);
  }
};

let abv_gebruiker = process.env.abv_gebruiker || '';
let abv_paswoord = process.env.abv_paswoord || '';

const abv = readline.createInterface({input: process.stdin, output: process.stdout});
abv.question(`Gebruiker [${abv_gebruiker}]:`, (data) => {
  abv_gebruiker = data.length > 0  ? data : abv_gebruiker;
  let paswoord = abv_paswoord.length == 0 ? '' : '********';
  abv.question(`Paswoord [${paswoord}]:`, (data) => {
    abv_paswoord = data.length > 0 ? data : abv_paswoord;
    abv.close();
  });
});



abv.on("close", () => {
  leesJWT(abv_gebruiker, abv_paswoord).then(token => {
    bewaarplaatsByID({"id": 5}, token).then((data) => {
      console.log(util.inspect(data, false, null, true));
    });
  });
});





