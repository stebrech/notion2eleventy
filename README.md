# notion2eleventy

Eleventy plugin which downloads data from Notion to your 11ty project. While building it first fetches the content via Notions’s API and the the node package @notionhq/client. The content will be converted to md with the help of the lovely node package notion-to-md.

## Features

- Downloads your Notion content and assets to your Eleventy project.
- The URL of the assets will be changed to your path of your choice.
- Status driven workflow:
  - It fetches only posts in a specific status you‘ll define.
  - At the end it updates the status.
- The notion properties can be setup in your config file and be added to the Markdown frontmatter (written in camel case).
- Multiple databases can be used and allows you to create different post types.
- The cover image in Notion will be copied to the frontmatter by default.

## Installation and configuration

### Install the npm package

```bash
npm install @stebrech/notion2eleventy
```

### Custom config file

Add a js config file to your root folder and give it name like `notion2eleventy.js`:

```js
const createMarkdownFiles = require("@stebrech/notion2eleventy");
const dbIdPosts = process.env.NOTION_DB_BLOG;
const postType1 = {
  dbId: dbIdPosts, // id of the database. You can find it in the URL of the database or in the share link.
  postType: "posts",
  // REQUIRED Notion database properties
  requiredMetadata: {
    status: "Status",
    statusFieldType: "status", // "select" or "status"
    layout: "Layout", // must be type: select
    title: "Name", // must be type: title 
    date: "Date", // if you want to sort your posts using this, your Notion property needs to be called Date; must be type: date
  },
  // Optional Notion database properties. You can add as many properties for each type as you need.
  optionalMetadata: {
    slug: "", // must be type text; only needed if the automatic slug from title (like /this-is-the-title/) is not good enough. The trailing slash will be added automatically.
    textFields: ["Description"],
    multiSelectFields: ["Tags"],
    selectFields: [],
    dateFields: [],
    checkboxFields: [],
    urlFields: [],
  },
  permalink: {
    addPermalink: true, // adds a permalink to the frontmatter
    includesPostType: true,
    includesYear: false,
    includesMonth: false, // makes only sense if permalinkHasYear is true
    publishPermalink: false, // if true, Notion requires a field called "Permalink" of type "URL" in the database
  },
  downloadPaths: {
    // Needs trailing slash
    md: "src/posts/",
    img: "src/assets/img/",
    movie: "src/assets/movie/",
    pdf: "src/assets/pdf/",
  },
  markdownPaths: {
    // URL path used in the markdown files
    img: "/assets/img/",
    movie: "/assets/movie/",
    pdf: "/assets/pdf/",
  },
};

async function notion2eleventy() {
  await createMarkdownFiles(postType1);
}
notion2eleventy()
```

### Environment variables

Add a `.env` file to the root folder and add the following variables:

```
NOTION_KEY=
CHECKSTATUS=
CHECKSTATUS2=
UPDATESTATUS=
NOTION_DB_BLOG=
```

The first four variables are required:

1. Add your API Key you created on [www.notion.so/my-integrations](https://www.notion.so/my-integrations).
2. This is the name of the status value to take into account. Posts with other status will not be downloaded.
3. Maybe you need another status to check. If not just use the same name as `CHECKSTATUS`.
4. Which status should the posts get after downloading it.

You can use as many post types and Notion databases you want. For not sharing the id of the database, you can set this with environment variable names of your choice. This obviously must be the same name as you use in the config file.

### Extend scripts

Add the node script in your package.json like:

```json
"scripts": {
  "start": "node notion2eleventy.js && npx @11ty/eleventy --serve",
  "build": "node notion2eleventy.js && npx @11ty/eleventy",
}
```

## Feedback / Contribution

Please give me feedback dropping me a [mail](mailto:mail@stebre.ch) or reach out to me on the [Mastodon](https://fosstodon.org/@stebre).

If you find a bug or want to send a feature request please raise an issue on Github. You have a concrete solution – even better. I’m happy to receive your pull request on a separate branch.
