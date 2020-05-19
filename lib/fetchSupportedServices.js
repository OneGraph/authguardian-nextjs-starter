import useSWR, { mutate } from 'swr'

// This setup is only needed once per application
export async function fetchOneGraph(
  appId,
  accessToken,
  operationsDoc,
  variables,
  operationName
) {
  const authHeaders = !!accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {}

  const result = await fetch(
    `https://serve.onegraph.com/graphql?app_id=${appId}`,
    {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName,
      }),
    }
  )

  return await result.json()
}

export async function fetchOneGraphWithAuth(
  auth,
  operationsDoc,
  variables,
  operationName
) {
  return fetchOneGraph(
    auth.appId,
    auth.accessToken(),
    operationsDoc,
    variables,
    operationName
  )
}

/* Get a list of all the supported services for authentication
and authorization that OneGraph supports */
export const query = `
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
}`

export function checkErrorForCorsConfigurationRequired(error) {
  if (error?.message?.match('not allowed by Access-Control-Allow-Origin')) {
    return true
  }
  return false
}

export function useFetchSupportedServices(auth) {
  const { data, error, loading } = useSWR([query, null], (query, variables) =>
    fetchOneGraphWithAuth(auth, query, variables)
  )

  if (loading) {
    return { loading: loading }
  }

  const corsConfigurationRequired = checkErrorForCorsConfigurationRequired(
    error
  )

  if (!data) {
    return {
      supportedServices: [],
      corsConfigurationRequired: corsConfigurationRequired,
    }
  }

  const result = data

  const oauthServices = result.data.oneGraph?.services
  const supportedServices = oauthServices
    .filter((service) => service.supportsOauthLogin)
    .sort((a, b) => a.friendlyServiceName.localeCompare(b.friendlyServiceName))

  return {
    supportedServices,
    corsConfigurationRequired: corsConfigurationRequired,
  }
}
