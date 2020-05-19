import Container from '../components/container'
import MoreStories from '../components/more-stories'
import HeroPost from '../components/hero-post'
import Intro from '../components/intro'
import Layout from '../components/layout'
import { getAllPostsForHome } from '../lib/api'
import Head from 'next/head'
import { CMS_NAME, ONE_GRAPH_APP_ID } from '../lib/constants'
import {
  corsPrompt,
  exampleUsage,
  auth,
  appId,
  useAuthGuardian,
} from '../lib/common'
import { useFetchSupportedServices } from '../lib/fetchSupportedServices'
import useSWR from 'swr'
import ErrorPage from 'next/error'

export default function Index({
  allPosts,
  isAdmin,
  isLoggedIn,
  userId,
  adminData,
}) {
  if (!isLoggedIn) {
    if (typeof window !== 'undefined') {
      window.location = '/login'
    }
    return 'Redirecting you to log in...'
  }

  if (!isAdmin) {
    return <ErrorPage title="Get outta here" statusCode={403} />
  }

  const [state, setState] = React.useState({
    mostRecentService: null,
  })

  const {
    supportedServices,
    corsConfigurationRequired,
  } = useFetchSupportedServices(auth)

  const user = React.useMemo(
    () => {
      const authGuardianData = useAuthGuardian(auth)
      return authGuardianData.user
    },
    // Refetch user data if the accessToken changes
    [auth.accessToken()]
  )

  return (
    <>
      <Layout>
        <Head>
          <title>Next.js Secure Admin Page {CMS_NAME}</title>
        </Head>
        <Container>Hi there</Container>
      </Layout>

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
    </>
  )
}

// export async function getStaticProps({ preview = false }) {
//   const allPosts = (await getAllPostsForHome(preview)) || []
//   return {
//     props: { allPosts },
//   }
// }

export async function getServerSideProps(ctx) {
  var cookie = require('cookie')
  var atob = require('atob')

  var cookies = cookie.parse(ctx.req?.headers?.cookie || '')
  let agCookie = {}
  try {
    agCookie = JSON.parse(
      atob((cookies.authGuardian || '').split('.')[1] || '') || '{}'
    )
  } catch (e) {
    console.log('Whoops, ', e)
  }

  console.log('Cookies: ', cookies)
  console.log('AG Cookie: ', agCookie)

  const userId = agCookie?.user?.id || null

  const isAdmin = (agCookie?.user?.roles || []).includes('admin')
  const isLoggedIn = !!userId

  const allPosts = []
  const adminData = 'Only a logged in user can see this'
  return {
    props: { allPosts, isAdmin, isLoggedIn, userId, adminData },
  }
}
