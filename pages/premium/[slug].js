import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Container from '../../components/container'
import PostBody from '../../components/post-body'
import MoreStories from '../../components/more-stories'
import Header from '../../components/header'
import PostHeader from '../../components/post-header'
import SectionSeparator from '../../components/section-separator'
import Layout from '../../components/layout'
import { getAllPostsWithSlug, getPostAndMorePosts } from '../../lib/api'
import PostTitle from '../../components/post-title'
import Head from 'next/head'
import { CMS_NAME, ONE_GRAPH_APP_ID } from '../../lib/constants'
import markdownToHtml from '../../lib/markdownToHtml'
import { fetchOneGraph } from '../../lib/fetchSupportedServices'

export default function Post({ post, morePosts, preview }) {
  const router = useRouter()
  if (!router.isFallback && !post?.number) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <Layout preview={preview}>
      <Container>
        <Header />
        {router.isFallback ? (
          <PostTitle>Loading…</PostTitle>
        ) : (
          <>
            <article>
              <Head>
                <title>
                  {post.title} | Next.js Blog Example with {CMS_NAME}
                </title>
                <meta
                  property="og:image"
                  content={post.repository.openGraphImageUrl}
                />
              </Head>
              <PostHeader
                title={post.title}
                coverImage={post.repository.openGraphImageUrl}
                createdAt={post.createdAt}
                author={post.author}
              />
              <PostBody content={post.body} />
            </article>
            <SectionSeparator />
            {morePosts.length > 0 && <MoreStories posts={morePosts} />}
          </>
        )}
      </Container>
    </Layout>
  )
}

// Should come from ENV setup
const serverSideAccessToken = 'zLMpVnk-RJ4y-Bwl70jWnM5nJhfCcFcKbPAPN6pa1fU'

const operationsDoc = `
query GitHubIssuesQuery(
  $first: Int = 50
  $name: String = "graphql-js"
  $owner: String = "graphql"
) {
  gitHub {
    repository(name: $name, owner: $owner) {
      issues(
        first: $first
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        totalCount
        edges {
          node {
            ...GitHubIssueFragment
          }
        }
      }
    }
  }
}

query GitHubIssueQuery(
  $name: String = "graphql-js"
  $owner: String = "graphql"
  $number: Int = 10
) {
  gitHub {
    repository(name: $name, owner: $owner) {
      issue(number: $number) {
        ...GitHubIssueFragment
      }
    }
  }
}

fragment GitHubIssueFragment on GitHubIssue {
  title
  url
  body
  number 
  createdAt
  author {
    login
    avatarUrl
  }
  repository {
    openGraphImageUrl
  }
}
`

export async function getStaticProps({ params, preview = false }) {
  const result = await fetchOneGraph(
    ONE_GRAPH_APP_ID,
    serverSideAccessToken,
    operationsDoc,
    { name: 'graphql-js', owner: 'graphql', number: parseInt(params.slug) },
    'GitHubIssueQuery'
  )

  const data = result.data?.gitHub?.repository?.issue
  const content = await markdownToHtml(data?.body || '')

  return {
    props: {
      preview,
      post: {
        ...data,
        content,
      },
      morePosts: data?.morePosts ?? [],
    },
  }
}

export async function getStaticPaths() {
  const result = await fetchOneGraph(
    ONE_GRAPH_APP_ID,
    serverSideAccessToken,
    operationsDoc,
    { first: 100, name: 'graphql-js', owner: 'graphql' },
    'GitHubIssuesQuery'
  )

  console.log('Result: ', result)

  const allIssues = result.data?.gitHub?.repository?.edges

  // /posts/14/
  return {
    paths: allIssues?.map((edge) => `/posts/${edge.node.number}`) || [],
    fallback: true,
  }
}
