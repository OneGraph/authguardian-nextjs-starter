import OneGraphAuth from 'onegraph-auth'
import fetchSupportedServicesQuery from './fetchSupportedServices'
import copy from 'copy-to-clipboard'
import { ONE_GRAPH_APP_ID } from './constants'

export const appId = ONE_GRAPH_APP_ID

let ssr = false

if (typeof window === 'undefined') {
  ssr = true
}

export const auth = ssr
  ? {
      accessToken: () => null,
    }
  : new OneGraphAuth({
      appId: appId,
    })

export const exampleUsage = (appId, service) => {
  const componentName = `LoginWith${service.friendlyServiceName.replace(
    /\W/g,
    ''
  )}`
  return `import OneGraphAuth from "onegraph-auth";

    const auth = new OneGraphAuth({
      appId: "${appId}",
    });

    /* Usage:
      <${componentName} oneGraphAuth={auth} onLogin={() => console.log("User has successfully logged into ${service.friendlyServiceName}.")} />
    */
    const ${componentName} = ({ oneGraphAuth, onLogin }) => {
      return (
        <button
          onClick={async () => {
            await oneGraphAuth.login("${service.slug}");
            const isLoggedIn = await oneGraphAuth.isLoggedIn("${service.slug}");
            if (isLoggedIn) {
              onLogin();
            }
          }}
        >
        Log in with ${service.friendlyServiceName}
        </button>
      );
    };`
}

export function corsPrompt(appId) {
  const origin = ssr ? '' : window.location.origin

  return (
    <nav className="cors-prompt">
      <ul>
        <li>
          <a
            className="App-link"
            href={`https://www.onegraph.com/dashboard/app/${appId}?add-cors-origin=${origin}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Please click here to add {origin} to your allowed CORS origins and
            then refresh
          </a>
        </li>
      </ul>
    </nav>
  )
}

export const useAuthGuardian = (auth) => {
  if (ssr) return { loading: true, user: null, error: null }
  const accessToken = auth.accessToken()

  let decoded = null
  let error = null

  if (!!accessToken) {
    try {
      const payload = atob(accessToken.accessToken.split('.')[1])
      decoded = JSON.parse(payload)
      delete decoded['https://onegraph.com/jwt/claims']
    } catch (e) {
      console.warn(`Error decoding OneGraph jwt for appId=${appId}: `, e)
    }
  }

  return { user: decoded, error: error, loading: false }
}
