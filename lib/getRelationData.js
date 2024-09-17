require("dotenv").config();
const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_KEY });

const { createSlug, createFilename } = require("./helpers");

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

module.exports = getRelationData;
