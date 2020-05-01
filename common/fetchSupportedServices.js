// This setup is only needed once per application
async function fetchOneGraph(auth, operationsDoc, operationName, variables) {
  const result = await fetch(
    `https://serve.onegraph.com/graphql?app_id=${auth.appId}`,
    {
      method: "POST",
      headers: {
        ...auth.authHeaders(),
      },
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName,
      }),
    }
  );

  return await result.json();
}

const operationsDoc = `
    query SupportedServicesQuery {
      oneGraph {
        services {
          service
          friendlyServiceName
          slug
          supportsOauthLogin
          supportsCustomServiceAuth
        }
      }
    }
  `;

async function fetchSupportedServicesQuery(auth) {
  const result = await fetchOneGraph(
    auth,
    operationsDoc,
    "SupportedServicesQuery",
    {}
  );

  const oauthServices = result.data.oneGraph && result.data.oneGraph.services;
  const supportedServices = oauthServices
    .filter((service) => service.supportsOauthLogin)
    .sort((a, b) => a.friendlyServiceName.localeCompare(b.friendlyServiceName));

  return supportedServices;
}

export default fetchSupportedServicesQuery;
