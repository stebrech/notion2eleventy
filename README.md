# notion2eleventy

`notion2eleventy` is an Eleventy plugin which downloads content from Notion depending on a defined status. It fetches the content via Notions’s API and the the node package `@notionhq/client`. The content will be converted to md with the help of the lovely node package `notion-to-md`.

## 🚀 Features

- Downloads Notion content and assets to your Eleventy project.
- Status driven workflow:
  - It fetches only posts in a specific status you‘ll define.
  - At the end it updates the status.
- The assets will be downloaded to the directory of choice and renamed.
- The notion properties can be setup and added to the Markdown frontmatter (written in camel case).
- Multiple databases can be used and allows to create different post types.
- The cover image in Notion will be copied to the frontmatter by default.

> [!IMPORTANT]
> As from v0.2.0 you need to configure `notion2eleventy` via the standard `eleventy.config.js`.

## Install the npm package

```bash
npm install @stebrech/notion2eleventy
```

## Configure the plugin

### Environment variables

Add a `.env` file to the root folder and add the following variables:

```
NOTION_KEY=
CHECKSTATUS=
CHECKSTATUS2=
UPDATESTATUS=
NOTION_DB_POSTS=
```

1. Add your API Key you created on [www.notion.so/my-integrations](https://www.notion.so/my-integrations).
2. The name of the status value to take into account. Posts with other status will not be downloaded.
3. Maybe you need another status to check. If not just use the same name as `CHECKSTATUS`.
4. Which status should the posts get after downloading it.
5. The ID of the Notion database, see [Retrieve a database](https://developers.notion.com/reference/retrieve-a-database)

### Configure the plugin in `eleventy.config.js`

The minimal configuration within the `eleventy.config.js` (or `.eleventy.js`) file looks like this:

```js
const notion2eleventy = require("@stebrech/notion2eleventy");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(notion2eleventy);
};
```

This will use the default options. The one which need to be overwritten, have to be declared within an object (curly brackets).

Example:

```js
const notion2eleventy = require("@stebrech/notion2eleventy");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(notion2eleventy, {
    dbId: process.env.NOTION_DB_BLOG,
    postType: "blog",
    requiredMetadata: {
      statusFieldType: "select",
    },
    optionalMetadata: {
      textFields: ["Description"],
      multiSelectFields: ["Tags"],
    },
    permalink: {
      includesYear: true,
      includesMonth: true,
      publishPermalink: true,
    },
    downloadPaths: {
      md: "src/blog/",
      mdAddDatePrefix: false,
    },
    markdownPaths: {
      img: "src/assets/img/",
    },
  });
};
```

## All Config Options

| Option | Default value | Description |
|:-- |:-- |:-- |
| `dbId` | `process.env.NOTION_DB_POSTS` | ID of the Notion database; recommended to use env variable |
| `postType` | `"posts"` | Give the post type a specific name. It will be used with `permalink.includesPostType` |

### Required Notion metadata (database properties)

```js
// Defaults
requiredMetadata: {
  status: "Status",
  statusFieldType: "status",
  title: "Name",
},
```

| Option | Default value | Notion data type | Description |
|:-- |:-- |:-- |:-- |
| `status` | `"Status"` | see `statusFieldType` | Name of the status field in Notion database |
| `statusFieldType` | `"status"` | `"select"` or `"status"`| Type of data field in Notion database |
| `title` | `"Name"` | title | Name of the title field in Notion database |

### Optional Notion metadata (database properties)

```js
// Defaults
optionalMetadata: {
  layout: "",
  date: "",
  textFields: [],
  multiSelectFields: [],
  selectFields: [],
  dateFields: [],
  checkboxFields: [],
  urlFields: [],
  numberFields: [],
  personFields: [],
  relationFields: [],
  formulaStringFields: [],
  formulaNumberFields: [],
},
```

| Option | Default value | Database property type in Notion | Description |
|:-- |:-- |:-- |:-- |
| `layout` | `""` | Select | In case the layout within a post type is variable. The value set in Notion will be value in the frontmatter, like `layout: awesomeLayout` |
| `date` | `""` | Date | RELATED: [11ty docs: Content dates](https://www.11ty.dev/docs/dates/)  |
| `textFields` | `[]` | Text | Name of text fields in Notion database. The values must be in an array. Therefore you can set multiple text fields. |
| `multiSelectFields` | `[]` | Multi-Select | Name of multi select fields in Notion database. The values must be in an array. Therefore you can set multiple multi select fields. |
| `selectFields` | `[]` | Select | Name of select fields in Notion database. The values must be in an array. Therefore you can set multiple select fields. |
| `dateFields` | `[]` | Date | Name of date fields in Notion database. The values must be in an array. Therefore you can set multiple date fields. |
| `checkboxFields` | `[]` | Checkbox | Name of checkbox fields in Notion database. The values must be in an array. Therefore you can set multiple checkbox fields. |
| `urlFields` | `[]` | URL | Name of url fields in Notion database. The values must be in an array. Therefore you can set multiple url fields. |
| `numberFields` | `[]` | Number | Name of number fields in Notion database. The values must be in an array. Therefore you can set multiple number fields. |
| `personFields` | `[]` | Person | Name of person fields in Notion database. The values must be in an array. Therefore you can set multiple person fields. |
| `relationFields` | `[]` | Name of relation fields in Notion database | Important: `requiredMetadata.title`, `optionalMetadata.date`, `downloadPaths.mdAddDatePrefix` and `permalink.slug` must be configured the same in the database of the related post. The values must be in an array. Therefore you can set multiple relation fields. |
| `formulaStringFields` | `[]`| Name of formula fields (type string) in Notion database | Formula fields which results to a string. The values must be in an array. Therefore you can set multiple formula fields. |
| `formulaNumberFields` | `[]`| Name of formula fields (type number) in Notion database | Formula fields which results to a number. The values must be in an array. Therefore you can set multiple formular fields. |

### Permalink settings

```js
// Defaults
permalink: {
  addPermalink: true,
  includesPostType: true,
  includesYear: false,
  includesMonth: false,
  includesDay: false,
  slug: "",
  publishPermalink: false,
}
```

| Option | Default value | Database property type in Notion | Description |
|:-- |:-- |:-- |:-- |
| `addPermalink` | `true` | – | Boolean (`true` or `false`) |
| `includesPostType` | `true`| – | Boolean (`true` or `false`) |
| `includesYear` | `false` | – | Boolean (`true` or `false`); Requires `optionalMetada.date` |
| `includesMonth` | `false` | – | Boolean (`true` or `false`); Requires `optionalMetada.date`; Makes only sense if `includesYear` is true |
| `includesDay` | `false` | – | Boolean (`true` or `false`); Requires `optionalMetada.date`; Makes only sense if `includesYear` and `includesMonth` is true |
| `slug` | `""` | Text | Define a custom slug in Notion. If empty the slug will be created from the title. A trailing slash will be added automatically. `addPermalink` must be true. |
| `publishPermalink` | `false` | URL | if `true`, it requires a Notion property called "Permalink" of type "URL". |

### Download paths

```js
// Defaults
downloadPaths: {
  md: "src/posts/",
  mdSlugSubfolder: false,
  mdAddDatePrefix: false,
  img: "src/assets/img/",
  imgSlugSubfolder: false,
  imgAddDatePrefix: false,
  movie: "src/assets/movie/",
  movieSlugSubfolder: false,
  movieAddDatePrefix: false,
  pdf: "src/assets/pdf/",
  pdfSlugSubfolder: false,
  pdfAddDatePrefix: false,
}
```

| Option | Default value | Description |
|:-- |:-- |:-- |
| md | `"src/posts/"` | Download directory of the markdown files |
| mdSlugSubfolder | `false` | Write the markdown file in a specific subfolder within the download folder, named with the slug |
| mdAddDatePrefix | `false` | Add a date prefix to markdown files. Requires `optionalMetadata.date` |
| img | `"src/assets/img/"` | Download directory of the image files |
| imgSlugSubfolder | `false` | Write the image files in a specific subfolder within the download folder, named with the slug |
| imgAddDatePrefix | `false` | Add a date prefix to image files. Requires `optionalMetada.date` |
| movie | `"src/assets/movie/"` | Download directory of the movie files |
| movieSlugSubfolder | `false` | Write the movie files in a specific subfolder within the download folder, named with the slug |
| movieAddDatePrefix | `false` | Add a date prefix to movie files. Requires `optionalMetada.date` |
| pdf | `"src/assets/pdf/"` | Download directory of the pdf files |
| pdfSlugSubfolder | `false` | Write the pdf files in a specific subfolder within the download folder, named with the slug |
| pdfAddDatePrefix | `false` | Add a date prefix to pdf files. Requires `optionalMetada.date` |

### Markdown paths

```js
// Defaults
markdownPaths: {
  img: "/assets/img/",
  movie: "/assets/movie/",
  pdf: "/assets/pdf/",
}
```

| Option | Default value | Description |
|:-- |:-- |:-- |
| `img` | `"/assets/img/"` | Image paths which are used in the Markdown pages. |
| `movie` | `"/assets/movie/"` | Movie paths which are used in the Markdown pages. |
| `pdf` | `"/assets/pdf/"` | PDF paths which are used in the Markdown pages. |

### Copy assets to output directory

```js
// Defaults
copyAssetsToOutputFolder: {
  img: true,
  movie: true,
  pdf: true,
}
```

| Option | Default value | Description |
|:-- |:-- |:-- |
| `img` | `true` | Copy the img download folder to the output folder (default is _site) with the img path configured in `markdownPaths.img` |
| `movie` | `true` | Copy the movie download folder to the output folder (default is _site) with the movie path configured in `markdownPaths.movie` |
| `pdf` | `true` | Copy the pdf download folder to the output folder (default is _site) with the pdf path configured in `markdownPaths.pdf` |

## Use multiple Notion databases

For creating multiple post types in Eleventy, you can create multiple Notion databases. Therefore you’ll call the plugin multiple times in your `eleventy.config.js`.

Example:

```js
const notion2eleventy = require("@stebrech/notion2eleventy");

module.exports = function (eleventyConfig) {
  // Posts
  eleventyConfig.addPlugin(notion2eleventy, {
    requiredMetadata: {
      title: "Title",
    }
  });

  // Pages
  eleventyConfig.addPlugin(notion2eleventy, {
    dbId: process.env.NOTION_DB_PAGES,
    postType: "pages",
    requiredMetadata: {
      title: "Title",
    },
    optionalMetadata: {
      textFields: ["Description"],
    },
    downloadPaths: {
      md: "src/pages/",
    }
  });
}
```

### ~~Extend scripts~~

~~Add the node script in your package.json like:~~

> [!NOTE]  
> This is no longer necessary as of version v0.2.0

## Feedback / Contribution

Please give me feedback dropping me a [mail](mailto:mail@stebre.ch) or reach out to me on the [Mastodon](https://fosstodon.org/@stebre).

If you find a bug or want to send a feature request please raise an issue on Github. You have a concrete solution – even better. I’m happy to receive your pull request on a separate branch.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/stebre)
