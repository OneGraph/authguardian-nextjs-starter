console.log("Build env: ", process.env);

module.exports = {
  env: {
    oneGraphAppId: process.env.ONE_GRAPH_APP_ID,
    gitHubOrg: process.env.VERCEL_GITHUB_ORG,
    gitHubRepo: process.env.VERCEL_GITHUB_REPO,
  },
};
