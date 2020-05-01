import OneGraphAuth from "onegraph-auth";
import Head from "next/head";
import fetchSupportedServicesQuery from "../common/fetchSupportedServices.js";

const appId = process.env.oneGraphAppId;

let auth;

if (typeof window !== "undefined") {
  auth = new OneGraphAuth({
    appId: appId,
  });
} else {
  // Dummy auth object for SSR
  auth = {
    accessToken: () => null,
  };
}

const gitHubLink =
  process.env.GITHUB_URL ||
  "https://github.com/OneGraph/authguardian-react-starter";

const exampleUsage = (appId, service) => {
  const componentName = `LoginWith${service.friendlyServiceName.replace(
    /\W/g,
    ""
  )}`;
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
  };
  `;
};

function corsPrompt(appId) {
  const origin = window.location.origin;

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
  );
}

const gitHubIcon = (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    width="20px"
    height="20px"
  >
    <title>GitHub icon</title>
    <path
      fill="white"
      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    />
  </svg>
);

function navBar(appId) {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <a
              className="App-link"
              href={`https://www.onegraph.com/dashboard/app/${appId}/auth/auth-guardian`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Edit your rules
            </a>
          </li>
          <li>
            <a
              className="App-link"
              href="https://www.onegraph.com/docs/auth_guardian.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              AuthGuardian Docs
            </a>
          </li>
          <li>
            <a href={gitHubLink} target="_blank" rel="noopener noreferrer">
              {gitHubIcon}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function Home() {
  const [state, setState] = React.useState({
    supportedServices: [],
    corsConfigurationRequired: null,
  });

  React.useEffect(() => {
    fetchSupportedServicesQuery(auth)
      .then((supportedServices) => {
        console.log(supportedServices);
        setState((oldState) => {
          return {
            ...oldState,
            supportedServices: supportedServices,
          };
        });
      })
      // Detect if we haven't configured CORS yet
      .catch((error) => {
        if (
          error.message &&
          error.message.match("not allowed by Access-Control-Allow-Origin")
        ) {
          setState((oldState) => {
            return { ...oldState, corsConfigurationRequired: true };
          });
        }
      });
  }, []);

  const accessToken = auth.accessToken();

  let decoded = null;

  if (!!accessToken) {
    try {
      const payload = atob(accessToken.accessToken.split(".")[1]);
      decoded = JSON.parse(payload);
      delete decoded["https://onegraph.com/jwt/claims"];
    } catch (e) {
      console.warn(`Error decoding OneGraph jwt for appId=${appId}: `, e);
    }
  }

  return (
    <div className="container">
      {state.corsConfigurationRequired ? corsPrompt(appId) : navBar(appId)}

      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          Welcome to the <a href="https://nextjs.org">Next.js</a> AuthGuardian
          Starterkit!
        </h1>
        <header className="App-header">
          <p className="description">
            Your OneGraph auth JWT preview:{" "}
            <button
              onClick={() => {
                auth.destroy();
                setState(() => {
                  return { supportedServices: state.supportedServices };
                });
              }}
            >
              Clear local JWT
            </button>
          </p>
          <textarea
            className="jwt-preview card"
            rows={15}
            value={
              !!decoded ? JSON.stringify(decoded, null, 2) : "No OneGraph JWT"
            }
            readOnly={true}
          ></textarea>
          <br />
          <textarea
            className="jwt-preview"
            style={{ userSelect: "all" }}
            rows={1}
            value={
              !!accessToken && !!accessToken.accessToken
                ? accessToken.accessToken
                : ""
            }
            readOnly={true}
          ></textarea>
        </header>
        <div className="grid">
          {(state.supportedServices || []).map((service) => {
            return (
              <button
                key={service.slug}
                className="card"
                onClick={async () => {
                  await auth.login(service.slug);
                  const isLoggedIn = await auth.isLoggedIn(service.slug);
                  setState((oldState) => {
                    return {
                      ...oldState,
                      [service.slug]: isLoggedIn,
                      mostRecentService: service,
                    };
                  });
                }}
              >
                {!!state[service.slug] ? " ✓" : ""}{" "}
                <h3>{service.friendlyServiceName} &rarr;</h3>
              </button>
            );
          })}
        </div>{" "}
        {!state.mostRecentService ? null : (
          <>
            <h3>
              Add 'Sign in with {state.mostRecentService.friendlyServiceName}'
              to your React app
            </h3>
            <textarea
              className="card"
              style={{ marginBottom: "250px" }}
              rows={15}
              value={exampleUsage(appId, state.mostRecentService)}
              readOnly={true}
            ></textarea>
          </>
        )}
        <p className="description">
          Read more about building the best user experiences with Next.js in
          their excellent{" "}
          <a href="https://nextjs.org/docs">
            <p>docs &rarr;</p>
          </a>
        </p>
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <img src="/vercel.svg" alt="Vercel Logo" className="logo" />
          &nbsp; and{" "}
          <img src="/onegraph.svg" alt="OneGraph Logo" className="logo" />{" "}
          OneGraph
        </a>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: start;
          flex-wrap: wrap;

          max-width: 100%;
          margin-top: 3rem;
        }

        button.card {
          background-color: unset;
          cursor: pointer;
        }

        textarea.card {
          width: 100%;
        }

        textarea {
          width: 100%;
        }

        .card {
          margin: 1rem;
          flex-basis: 20%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        nav {
          color: #fff;
          background-color: #333;
        }

        nav.cors-prompt {
          background-color: #bb0000;
          font-weight: bolder;
          color: white;
        }

        nav a {
          color: #fff;
        }

        nav * {
          display: inline;
        }

        nav li {
          margin: 20px;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

export default Home;
