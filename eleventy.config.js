require("dotenv").config();
const fs = require("fs");

const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_KEY });

const createArray = require("./lib/createArray");
const getAssets = require("./lib/getAssets");
const getMarkdown = require("./lib/getMarkdown");
const getRelationData = require("./lib/getRelationData");
const { createSlug, createFilename, createUrlPath, camelize } = require("./lib/helpers");

module.exports = function (eleventyConfig, options = {}) {
	/* ------------------------------------------------
	 * Default options
	 * -----------------------------------------------*/

	const defaults = {
		dbId: process.env.NOTION_DB_POSTS,
		postType: "posts",
		requiredMetadata: {
			status: "Status",
			statusFieldType: "status",
			title: "Name",
		},
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
		permalink: {
			addPermalink: true,
			includesPostType: true,
			includesYear: false,
			includesMonth: false,
			includesDay: false,
			slug: "",
			publishPermalink: false,
		},
		downloadPaths: {
			md: "src/posts/",
			mdAddDatePrefix: false,
			img: "src/assets/img/",
			imgAddDatePrefix: false,
			movie: "src/assets/movie/",
			movieAddDatePrefix: false,
			pdf: "src/assets/pdf/",
			pdfAddDatePrefix: false,
		},
		markdownPaths: {
			img: "/assets/img/",
			movie: "/assets/movie/",
			pdf: "/assets/pdf/",
		},
		copyAssetsToOutputFolder: {
			img: true,
			movie: true,
			pdf: true,
		},
	};

	const { dbId, postType } = { ...defaults, ...options };
	const requiredMetadata = { ...defaults.requiredMetadata, ...options.requiredMetadata };
	const optionalMetadata = { ...defaults.optionalMetadata, ...options.optionalMetadata };
	const permalink = { ...defaults.permalink, ...options.permalink };
	const downloadPaths = { ...defaults.downloadPaths, ...options.downloadPaths };
	const markdownPaths = { ...defaults.markdownPaths, ...options.markdownPaths };
	const copyAssetsToOutputFolder = {
		...defaults.copyAssetsToOutputFolder,
		...options.copyAssetsToOutputFolder,
	};

	if (typeof eleventyConfig.on !== "function") {
		function createMarkdownFiles() {
			console.error("");
			console.error("⚠️ WARNING: Deprecated notion2eleventy configuration as of v0.3.0 ⚠️");
			console.error("The plugin needs to be configured with the standard eleventyConfig function.");
			console.error("Please refer to the documentation for more information.");
			console.error("https://github.com/stebrech/notion2eleventy");
			console.error("");
		}
		createMarkdownFiles();
		return;
	}

	/* ------------------------------------------------
	 * Create markdown files from Notion database
	 * -----------------------------------------------*/

	eleventyConfig.on("eleventy.before", async () => {
		try {
			const arr = await createArray({
				dbId,
				requiredMetadata,
				optionalMetadata,
				permalink,
			});
			for (let i = 0; i < arr.length; i++) {
				arr[i].content = await getMarkdown(arr[i].id);
				const slug = createSlug(arr[i].title);
				const filename = createFilename(slug, arr[i].date, downloadPaths.mdAddDatePrefix);
				const filePath = `${downloadPaths.md}${filename}`;
				const urlPath = createUrlPath(permalink, postType, slug, arr[i].customSlug, arr[i].date);

				// Add frontmatter
				let frontmatter = "---\n";
				if (optionalMetadata.layout && arr[i].layout) {
					frontmatter += `${camelize(optionalMetadata.layout)}: ${arr[i].layout}\n`;
				}
				frontmatter += `${camelize(requiredMetadata.title)}: ${arr[i].title}\n`;
				if (optionalMetadata.date && arr[i].date) {
					frontmatter += `date: ${arr[i].date}\n`;
				}
				if (arr[i].cover) {
					frontmatter += `cover: ${arr[i].cover}\n`;
				}
				if (optionalMetadata.textFields) {
					for (const field of optionalMetadata.textFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
						}
					}
				}
				if (optionalMetadata.multiSelectFields) {
					for (const field of optionalMetadata.multiSelectFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}: [${arr[i][field]
								.map((item) => `"${item}"`)
								.join(", ")}]\n`;
						}
					}
				}
				if (optionalMetadata.selectFields) {
					for (const field of optionalMetadata.selectFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
						}
					}
				}
				if (optionalMetadata.dateFields) {
					for (const field of optionalMetadata.dateFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
						}
					}
				}
				if (optionalMetadata.checkboxFields) {
					for (const field of optionalMetadata.checkboxFields) {
						if (arr[i][field] !== undefined) {
							frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
						}
					}
				}
				if (optionalMetadata.urlFields) {
					for (const field of optionalMetadata.urlFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
						}
					}
				}
				if (optionalMetadata.numberFields) {
					for (const field of optionalMetadata.numberFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
						}
					}
				}
				if (optionalMetadata.personFields) {
					for (const field of optionalMetadata.personFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}: [${arr[i][field]
								.map((item) => `"${item}"`)
								.join(", ")}]\n`;
						}
					}
				}
				if (optionalMetadata.relationFields) {
					for (const field of optionalMetadata.relationFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}:\n`;
							for (let j = 0; j < arr[i][field].length; j++) {
								let relationObject = await getRelationData(
									arr[i][field][j],
									permalink.slug,
									requiredMetadata.title,
									optionalMetadata.date,
									downloadPaths.mdAddDatePrefix,
								);
								frontmatter += `  - ${camelize(requiredMetadata.title)}: ${relationObject.title}\n    slug: ${relationObject.slug}\n    filename: ${relationObject.filename}\n`;
							}
						}
					}
				}
				if (optionalMetadata.formulaStringFields) {
					for (const field of optionalMetadata.formulaStringFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
						}
					}
				}
				if (optionalMetadata.formulaNumberFields) {
					for (const field of optionalMetadata.formulaNumberFields) {
						if (arr[i][field]) {
							frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
						}
					}
				}

				if (permalink.addPermalink) {
					frontmatter += `permalink: ${urlPath}\n`;
				}
				frontmatter += "---\n";

				let mdContent = frontmatter + arr[i].content.parent;
				// Add content and remove double line breaks and line breaks between images
				mdContent = mdContent.replace(/\n{3,}/g, "\n\n");
				// Multiple images in a row has to be within one paragraph
				mdContent = mdContent.replace(/(?<=!\[.*\]\(.*\))\n{1,2}(?=!\[.*\]\(.*\))/g, " ");

				// Download images from Notion and replace URL in markdown file
				let images = mdContent.match(
					/(?<=cover:\s)https?:\/\/.*(images\.unsplash\.com|amazonaws).*|https?:\/\/.*?(images\.unsplash\.com|amazonaws).*?(\.jpg|\.jpeg|\.gif|\.png|\.webp).*?(?=\))/g,
				);
				if (images) {
					for (let j = 0; j < images.length; j++) {
						const imgUrl = images[j];
						const imgFiletype = imgUrl.match(/(?<=\.)[a-z]+(?=\?)|(?<=&fm=)[a-z]+(?=&)/g);
						let imgRenamed = "";
						if (arr[i].date && downloadPaths.imgAddDatePrefix) {
							imgRenamed =
								arr[i].date.replace(/[-]/gi, "") + "_" + slug + "_" + j + "." + imgFiletype;
						} else {
							imgRenamed = `${slug}_${j}.${imgFiletype}`;
						}
						// check if folder exists
						if (!fs.existsSync(downloadPaths.img)) {
							fs.mkdirSync(downloadPaths.img, { recursive: true });
						}
						await getAssets(imgUrl, downloadPaths.img, imgRenamed);
						mdContent = mdContent.replace(imgUrl, markdownPaths.img + imgRenamed);
					}
				}

				// Download pdfs from Notion and replace URL in markdown file
				let pdfs = mdContent.match(/(?<=\[.*\]\()https?:\/\/.*(amazonaws).*(\.pdf).*(?<!\))/g);
				if (pdfs) {
					for (let j = 0; j < pdfs.length; j++) {
						const pdfUrl = pdfs[j];
						let pdfRenamed = "";
						if (arr[i].date && downloadPaths.pdfAddDatePrefix) {
							pdfRenamed = arr[i].date.replace(/[-]/gi, "") + "_" + slug + "_" + j + ".pdf";
						} else {
							pdfRenamed = `${slug}_${j}.pdf`;
						}
						// check if folder exists
						if (!fs.existsSync(downloadPaths.pdf)) {
							fs.mkdirSync(downloadPaths.pdf, { recursive: true });
						}
						await getAssets(pdfUrl, downloadPaths.pdf, pdfRenamed);
						mdContent = mdContent.replace(pdfUrl, markdownPaths.pdf + pdfRenamed);
					}
				}

				// Download movies from Notion and replace URL in markdown file
				let movies = mdContent.match(
					/(?<=\[.*\]\()https?:\/\/.*(amazonaws).*(\.mov|\.mp4).*(?<!\))/g,
				);
				if (movies) {
					for (let j = 0; j < movies.length; j++) {
						const movieUrl = movies[j];
						const movieFiletype = movieUrl.match(/(?<=\.)[a-z]+(?=\?)|(?<=&fm=)[a-z]+(?=&)/g);
						let movieRenamed = "";
						if (arr[i].date && downloadPaths.movieAddDatePrefix) {
							movieRenamed =
								arr[i].date.replace(/[-]/gi, "") + "_" + slug + "_" + j + "." + movieFiletype;
						} else {
							movieRenamed = `${slug}_${j}.${movieFiletype}`;
						}
						// check if folder exists
						if (!fs.existsSync(downloadPaths.movie)) {
							fs.mkdirSync(downloadPaths.movie, { recursive: true });
						}
						await getAssets(movieUrl, downloadPaths.movie, movieRenamed);
						mdContent = mdContent.replace(movieUrl, markdownPaths.movie + movieRenamed);
					}
				}

				// Write markdown files
				if (!fs.existsSync(downloadPaths.md)) {
					fs.mkdirSync(downloadPaths.md, { recursive: true });
				}
				fs.writeFile(filePath, mdContent, (err) => {
					if (err) {
						console.log(err);
					} else {
						console.log(`${filename} has been written successfully (post type: ${postType})`);
					}
				});

				// Update status defined as environment variable
				const status = requiredMetadata.status;
				const statusFieldType = requiredMetadata.statusFieldType;
				if (permalink.publishPermalink) {
					notion.pages.update({
						page_id: arr[i].id,
						properties: {
							[status]: {
								[statusFieldType]: {
									name: process.env.UPDATESTATUS,
								},
							},
							Permalink: {
								url: urlPath,
							},
						},
					});
				} else {
					notion.pages.update({
						page_id: arr[i].id,
						properties: {
							[status]: {
								[statusFieldType]: {
									name: process.env.UPDATESTATUS,
								},
							},
						},
					});
				}
			}
			// If no new posts are found, log this
			if (arr.length === 0) {
				console.log(`No updates in ${postType}`);
			}
		} catch (error) {
			// Handle errors here
			console.error(error.message);
		}
	});

	/* ------------------------------------------------
	 * Copy assets to output folder
	 * -----------------------------------------------*/

	if (copyAssetsToOutputFolder.img === true) {
		eleventyConfig.addPassthroughCopy({
			[downloadPaths.img]: markdownPaths.img,
		});
	}
	if (copyAssetsToOutputFolder.pdf === true) {
		eleventyConfig.addPassthroughCopy({
			[downloadPaths.pdf]: markdownPaths.pdf,
		});
	}
	if (copyAssetsToOutputFolder.movie === true) {
		eleventyConfig.addPassthroughCopy({
			[downloadPaths.movie]: markdownPaths.movie,
		});
	}
};
