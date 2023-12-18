require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const path = require("path");

const notion = new Client({ auth: process.env.NOTION_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

// Get all posts with status defined as environment variable
async function filteredRequest({dbId, requiredMetadata}) {
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

async function createArray({dbId, requiredMetadata, optionalMetadata}) {
	try {
		const filteredData = await filteredRequest({dbId, requiredMetadata});
		const results = filteredData.map((result) => {
			const data = { 
				id: result.id, 
				cover: result.cover?.file?.url || result.cover?.external?.url,
				title: result.properties[requiredMetadata.title]?.title
					?.map((text) => text.plain_text)
					.join(""),
				date: result.properties[requiredMetadata.date]?.date?.start.split("T")[0],
			};

			for (const field of optionalMetadata.textFields) {
				data[field] = result.properties[field]?.rich_text?.map((text) => text.plain_text).join("");
			}
			for (const field of optionalMetadata.multiSelectFields) {
				data[field] = result.properties[field]?.multi_select.map((tag) => tag.name);
			}
			for (const field of optionalMetadata.dateFields) {
				data[field] = result.properties[field]?.date?.start.split("T")[0];
			}
			for (const field of optionalMetadata.checkboxFields) {
				data[field] = result.properties[field]?.checkbox;
			}
			for (const field of optionalMetadata.urlFields) {
				data[field] = result.properties[field]?.url;
			}
			
			data.content = undefined;
			return data;
		});
		console.log(results);
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
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

// Create content
async function createMarkdownFiles({
	dbId,
	postType,
	layout,
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
			optionalMetadata
		});
		for (i = 0; i < arr.length; i++) {
			arr[i].content = await getContent(arr[i].id);
			let titleSlug = arr[i].title
				.toLowerCase()
				.replace(/[\s/]/gi, "-")
				.replace(/[äöü]/gi, matchUmlauts)
				.replace(/[çéèêëàâùûîïô]/gi, matchAccents)
				.replace(/[^a-z0-9-]/gi, "");

			let filename = "";
			if (arr[i].date) {
				filename = `${arr[i].date.replace(/[-]/gi, "")}_${titleSlug}.md`;
			} else {
				filename = `${titleSlug}.md`;
			}

			let file = `${downloadPaths.md}/${filename}`;

			let urlPath = "";
			if (permalink.includesPostType) {
				urlPath += `${postType}/`;
			}
			if (permalink.includesYear) {
				urlPath += `${arr[i].date.match(/\d{4}/g)}/`;
			}
			if (permalink.includesMonth) {
				urlPath += `${arr[i].date.match(/(?<=-)\d{2}(?=-)/g)}/`;
			}
			urlPath += titleSlug + "/";

			// Add frontmatter
			let frontmatter = "---\n";
			frontmatter += `layout: "${layout}"\n`;
			frontmatter += `${camelize(requiredMetadata.title)}: "${arr[i].title}"\n`;
			frontmatter += `${camelize(requiredMetadata.date)}: ${arr[i].date}\n`;
			if (arr[i].cover) {
				frontmatter += `cover: "${arr[i].cover}"\n`;
			}
			for (const field of optionalMetadata.textFields) {
				if (arr[i][field]) {
					frontmatter += `${camelize(field)}: "${arr[i][field]}"\n`;
				}
			}
			for (const field of optionalMetadata.multiSelectFields) {
				if (arr[i][field]) {
					frontmatter += `${camelize(field)}: [${arr[i][field].map(item => `"${item}"`).join(", ")}]\n`;
				}
			}
			for (const field of optionalMetadata.dateFields) {
				if (arr[i][field]) {
					frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
				}
			}
			for (const field of optionalMetadata.checkboxFields) {
				if (arr[i][field] !== undefined) {
					frontmatter += `${camelize(field)}: ${arr[i][field]}\n`;
				}
			}
			for (const field of optionalMetadata.urlFields) {
				if (arr[i][field]) {
					frontmatter += `${camelize(field)}: "${arr[i][field]}"\n`;
				}
			}
			
			frontmatter += `permalink: "${urlPath}"\n`;
			frontmatter += "---\n";

			let mdContent = frontmatter + arr[i].content.parent;
			// Add content and remove double line breaks and line breaks between images
			mdContent = mdContent.replace(/\n{3,}/g, "\n\n");
			// Place multiple images within one paragraph
			mdContent = mdContent.replace(
				/(!\[.*?\]\(.*?\))(\s*)(!?\[.*?\]\(.*?\))+/g,
				`$1\n$3`
			);

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
				/(?<=cover:\s\")https?:\/\/.*(images\.unsplash\.com|amazonaws).*(?=\")|(?<=\!\[.*\]\()https?:\/\/.*(images\.unsplash\.com|amazonaws).*(?<!\))/g
			);
			if (images) {
				for (j = 0; j < images.length; j++) {
					const imgUrl = images[j];
					const imgFiletype = imgUrl.match(
						/(?<=\.)[a-z]+(?=\?)|(?<=&fm=)[a-z]+(?=&)/g
					);
					let imgRenamed = "";
					if (arr[i].date) {
						imgRenamed = 
							arr[i].date.replace(/[-]/gi, "") +
							"_" +
							titleSlug +
							"_" +
							j +
							"." +
							imgFiletype;
					} else {
						imgRenamed = `${titleSlug}_${j}.${imgFiletype}`;
					}
					// check if folder exists
					if (!fs.existsSync(downloadPaths.img)) {
						fs.mkdirSync(downloadPaths.img);
					}
					await getFiles(imgUrl, downloadPaths.img, imgRenamed)
					mdContent = mdContent.replace(imgUrl, markdownPaths.img + imgRenamed);
				}
			}

			// Download pdfs from Notion and replace URL in markdown file
			let pdfs = mdContent.match(
				/(?<=\[.*\]\()https?:\/\/.*(amazonaws).*(\.pdf).*(?<!\))/g
			);
			if (pdfs) {
				for (j = 0; j < pdfs.length; j++) {
					const pdfUrl = pdfs[j];
					let pdfFilename = pdfUrl.match(/(?<=\/)[^\/]+(?=\?)/g);
					pdfFilename = pdfFilename.toString();

					// check if folder exists
					if (!fs.existsSync(downloadPaths.pdf)) {
						fs.mkdirSync(downloadPaths.pdf);
					}
					await getFiles(pdfUrl, downloadPaths.pdf, pdfFilename);
					mdContent = mdContent.replace(pdfUrl, markdownPaths.pdf + pdfFilename);
				}
			}

			// Download movies from Notion and replace URL in markdown file
			let movies = mdContent.match(
				/(?<=\[.*\]\()https?:\/\/.*(amazonaws).*(\.mov|\.mp4).*(?<!\))/g
			);
			if (movies) {
				for (j = 0; j < movies.length; j++) {
					const movieUrl = movies[j];
					let movieFilename = movieUrl.match(/(?<=\/)[^\/]+(?=\?)/g);
					movieFilename = movieFilename.toString();

					// check if folder exists
					if (!fs.existsSync(downloadPaths.movie)) {
						fs.mkdirSync(downloadPaths.movie);
					}
					await getFiles(movieUrl, downloadPaths.movie, movieFilename);
					mdContent = mdContent.replace(movieUrl, markdownPaths.movie + movieFilename);
				}
			}

			// Write markdown files
			if (!fs.existsSync(downloadPaths.md)) {
				fs.mkdirSync(downloadPaths.md);
			}
			fs.writeFile(file, mdContent, (err) => {
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
