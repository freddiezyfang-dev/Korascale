/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://korascale.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: ['/admin/*', '/login'],
};

