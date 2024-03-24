require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");

const notion = new Client({ auth: process.env.NOTION_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

// Get all posts with status defined as environment variable
async function filteredRequest({ dbId, requiredMetadata }) {
	try {
		const statusFieldType = requiredMetadata.statusFieldType;
		const response = await notion.databases.query({
			database_id: dbId,
			filter: {
				or: [
					{
						property: requiredMetadata.status,
						[statusFieldType]: { equals: process.env.CHECKSTATUS },
					},
					{
						property: requiredMetadata.status,
						[statusFieldType]: { equals: process.env.CHECKSTATUS2 },
					},
				],
			},
		});
		return response.results;
	} catch (error) {
		console.error("Error in the filteredRequest function:", error.message);
	}
}

async function createArray({ dbId, requiredMetadata, optionalMetadata, permalink }) {
	try {
		const filteredData = await filteredRequest({ dbId, requiredMetadata });
		const results = filteredData.map((result) => {
			const data = {
				id: result.id,
				cover: result.cover?.file?.url || result.cover?.external?.url,
				title: result.properties[requiredMetadata.title]?.title
					?.map((text) => text.plain_text)
					.join(""),
			};
			if (optionalMetadata.date) {
				data.date = result.properties[optionalMetadata.date]?.date?.start.split("T")[0];
			}
			if (optionalMetadata.layout) {
				data.layout = result.properties[optionalMetadata.layout]?.select?.name;
			}
			if (optionalMetadata.textFields) {
				for (const field of optionalMetadata.textFields) {
					data[field] = result.properties[field]?.rich_text
						?.map((text) => text.plain_text)
						.join("");
				}
			}
			if (optionalMetadata.multiSelectFields) {
				for (const field of optionalMetadata.multiSelectFields) {
					data[field] = result.properties[field]?.multi_select.map((selection) => selection.name);
				}
			}
			if (optionalMetadata.selectFields) {
				for (const field of optionalMetadata.selectFields) {
					data[field] = result.properties[field]?.select?.name;
				}
			}
			if (optionalMetadata.dateFields) {
				for (const field of optionalMetadata.dateFields) {
					data[field] = result.properties[field]?.date?.start.split("T")[0];
				}
			}
			if (optionalMetadata.checkboxFields) {
				for (const field of optionalMetadata.checkboxFields) {
					data[field] = result.properties[field]?.checkbox;
				}
			}
			if (optionalMetadata.urlFields) {
				for (const field of optionalMetadata.urlFields) {
					data[field] = result.properties[field]?.url;
				}
			}
			if (optionalMetadata.numberFields) {
				for (const field of optionalMetadata.numberFields) {
					data[field] = result.properties[field]?.number;
				}
			}
			if (optionalMetadata.personFields) {
				for (const field of optionalMetadata.personFields) {
					data[field] = result.properties[field]?.people?.map((person) => person.name);
				}
			}
			if (optionalMetadata.relationFields) {
				for (const field of optionalMetadata.relationFields) {
					data[field] = result.properties[field]?.relation?.map((relation) => relation.id);
				}
			}

			if (permalink.slug) {
				data.customSlug = result.properties[permalink.slug]?.rich_text
					?.map((text) => text.plain_text)
					.join("");
			}

			data.content = "";
			return data;
		});
		return results;
	} catch (error) {
		console.error("Error in the createArray function:", error.message);
	}
}

// Functions to replace special characters
function matchUmlauts(match) {
	switch (match) {
		case "ä":
			return "ae";
		case "ö":
			return "oe";
		case "ü":
			return "ue";
	}
}

function matchAccents(match) {
	switch (match) {
		case "ç":
			return "c";
		case "é" || "è" || "ê" || "ë":
			return "e";
		case "à" || "â":
			return "a";
		case "ù" || "û":
			return "u";
		case "î" || "ï":
			return "i";
		case "ô":
			return "o";
	}
}

// Get content from Notion
const getContent = async (id) => {
	try {
		const mdblocks = await n2m.pageToMarkdown(id);
		return n2m.toMarkdownString(mdblocks);
	} catch (error) {
		// Handle errors here
		console.error("Error in the getContent function:", error.message);
	}
};

function camelize(str) {
	return str
		.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
			return index === 0 ? word.toLowerCase() : word.toUpperCase();
		})
		.replace(/\s+/g, "");
}

function createSlug(title) {
	let slug = title
		.toLowerCase()
		.replace(/[\s/]/gi, "-")
		.replace(/[äöü]/gi, matchUmlauts)
		.replace(/[çéèêëàâùûîïô]/gi, matchAccents)
		.replace(/[^a-z0-9-]/gi, "");
	return slug;
}

function createFilename(slug, date, optionalDatePrefix) {
	let filename = "";
	if (date && optionalDatePrefix) {
		filename = `${date.replace(/[-]/gi, "")}_${slug}.md`;
	} else {
		filename = `${slug}.md`;
	}
	return filename;
}

function createUrlPath(permalink, postType, slug, customSlug, date) {
	let urlPath = "";
	if (permalink.includesPostType) {
		urlPath += `${postType}/`;
	}
	if (permalink.includesYear && date) {
		urlPath += `${date.match(/\d{4}/g)}/`;
	}
	if (permalink.includesMonth && date) {
		urlPath += `${date.match(/(?<=-)\d{2}(?=-)/g)}/`;
	}
	if (permalink.includesDay && date) {
		urlPath += `${date.match(/(?<=\d{4}-\d{2}-)\d{2}/g)}/`;
	}
	if (permalink.slug && customSlug) {
		urlPath += customSlug + "/";
	} else {
		urlPath += slug + "/";
	}
	return urlPath;
}

// Get data of relation field
async function getRelationData(
	relationId,
	customSlugFieldName,
	titleFieldName,
	dateFieldName,
	optionalDatePrefix,
) {
	try {
		const response = await notion.pages.retrieve({
			page_id: relationId,
		});

		const getTitle = response.properties[titleFieldName]?.title
			?.map((text) => text.plain_text)
			.join("");

		let getSlug = "";
		if (response.properties[customSlugFieldName]) {
			getSlug = response.properties[customSlugFieldName]?.rich_text
				?.map((text) => text.plain_text)
				.join("");
		} else {
			getSlug = createSlug(
				response.properties[titleFieldName]?.title?.map((text) => text.plain_text).join(""),
			);
		}

		const getFilename = createFilename(
			getSlug,
			response.properties[dateFieldName]?.date?.start.split("T")[0],
			optionalDatePrefix,
		);

		const data = {
			title: getTitle,
			slug: getSlug,
			filename: getFilename,
		};
		return data;
	} catch (error) {
		console.error("Error in the getRelationData function:", error.message);
	}
}

// Create content
async function createMarkdownFiles({
	dbId,
	postType,
	requiredMetadata,
	optionalMetadata,
	permalink,
	downloadPaths,
	markdownPaths,
}) {
	try {
		const arr = await createArray({
			dbId,
			requiredMetadata,
			optionalMetadata,
			permalink,
		});
		for (i = 0; i < arr.length; i++) {
			arr[i].content = await getContent(arr[i].id);
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

			if (permalink.addPermalink) {
				frontmatter += `permalink: ${urlPath}\n`;
			}
			frontmatter += "---\n";

			let mdContent = frontmatter + arr[i].content.parent;
			// Add content and remove double line breaks and line breaks between images
			mdContent = mdContent.replace(/\n{3,}/g, "\n\n");
			// Multiple images in a row has to be within one paragraph
			mdContent = mdContent.replace(/(?<=!\[.*\]\(.*\))\n{1,2}(?=!\[.*\]\(.*\))/g, " ");

			// Use axaio to get images, pdfs and movies from Notion
			async function getFiles(url, outputPath, filename) {
				try {
					const response = await axios({
						url: url,
						method: "GET",
						responseType: "stream",
					});

					const filePath = outputPath + filename;
					const writer = fs.createWriteStream(filePath);
					response.data.pipe(writer);

					await new Promise((resolve, reject) => {
						writer.on("finish", resolve);
						writer.on("error", reject);
					});

					console.log(`File downloaded successfully: ${filePath}`);
					return filePath;
				} catch (error) {
					console.error(`Error downloading file from ${url}:`, error.message);
					throw error; // Rethrow the error to indicate failure
				}
			}

			// Download images from Notion and replace URL in markdown file
			let images = mdContent.match(
				/(?<=cover:\s)https?:\/\/.*(images\.unsplash\.com|amazonaws).*|https?:\/\/.*?(images\.unsplash\.com|amazonaws).*?(\.jpg|\.jpeg|\.gif|\.png|\.webp).*?(?=\))/g,
			);
			if (images) {
				for (j = 0; j < images.length; j++) {
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
						fs.mkdirSync(downloadPaths.img);
					}
					await getFiles(imgUrl, downloadPaths.img, imgRenamed);
					mdContent = mdContent.replace(imgUrl, markdownPaths.img + imgRenamed);
				}
			}

			// Download pdfs from Notion and replace URL in markdown file
			let pdfs = mdContent.match(/(?<=\[.*\]\()https?:\/\/.*(amazonaws).*(\.pdf).*(?<!\))/g);
			if (pdfs) {
				for (j = 0; j < pdfs.length; j++) {
					const pdfUrl = pdfs[j];
					let pdfRenamed = "";
					if (arr[i].date && downloadPaths.pdfAddDatePrefix) {
						pdfRenamed = arr[i].date.replace(/[-]/gi, "") + "_" + slug + "_" + j + ".pdf";
					} else {
						pdfRenamed = `${slug}_${j}.pdf`;
					}
					// check if folder exists
					if (!fs.existsSync(downloadPaths.pdf)) {
						fs.mkdirSync(downloadPaths.pdf);
					}
					await getFiles(pdfUrl, downloadPaths.pdf, pdfRenamed);
					mdContent = mdContent.replace(pdfUrl, markdownPaths.pdf + pdfRenamed);
				}
			}

			// Download movies from Notion and replace URL in markdown file
			let movies = mdContent.match(
				/(?<=\[.*\]\()https?:\/\/.*(amazonaws).*(\.mov|\.mp4).*(?<!\))/g,
			);
			if (movies) {
				for (j = 0; j < movies.length; j++) {
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
						fs.mkdirSync(downloadPaths.movie);
					}
					await getFiles(movieUrl, downloadPaths.movie, movieRenamed);
					mdContent = mdContent.replace(movieUrl, markdownPaths.movie + movieRenamed);
				}
			}

			// Write markdown files
			if (!fs.existsSync(downloadPaths.md)) {
				fs.mkdirSync(downloadPaths.md);
			}
			fs.writeFile(filePath, mdContent, (err) => {
				if (err) {
					console.log(err);
				} else {
					console.log(`${filename} has been written successfully`);
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
		console.error("Error in the createMarkdownFiles function:", error.message);
	}
}

module.exports = createMarkdownFiles;
