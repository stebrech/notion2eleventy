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

## Installation

### Install the npm package

```bash
  npm install @stebrech/notion2eleventy
```

### Custom config file

Add a js config file to your root folder and give it name like `notion2eleventy.js`:

```js
const createMarkdownFiles = require("notion2eleventy");
const dbIdPosts = process.env.NOTION_DB_BLOG;
const postType1 = {
	dbId: dbIdPosts, // id of the database. You can find it in the URL of the database or in the share link.
	postType: "posts",
	layout: "post.njk",
	// Required Notion database properties
	requiredMetadata: {
		status: "Status",
		statusFieldType: "status", // "select" or "status"
		title: "Name",
		date: "Published",
	},
	// Optional Notion database properties. You can add as many properties for each type as you need.
	optionalMetadata: {
		textFields: ["Description"],
		multiSelectFields: ["Tags"],
		dateFields: ["Updated"],
		checkboxFields: ["on Homepage"],
		urlFields: ["External Link"],
	},
	permalink: {
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

createMarkdownFiles(postType1);
```

### Update scripts

Add the node script in your package.json like:

```json
	"scripts": {
		"start": "node notion2eleventy.js && npx @11ty/eleventy --serve",
		"build": "node notion2eleventy.js && npx @11ty/eleventy",
	}
```
