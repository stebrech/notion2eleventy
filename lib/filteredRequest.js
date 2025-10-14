import "dotenv/config";
import { Client } from "@notionhq/client";

// Debug: Check if NOTION_KEY is available
if (!process.env.NOTION_KEY) {
	console.error("Error: NOTION_KEY environment variable is not set");
	throw new Error("NOTION_KEY environment variable is required");
}

const notion = new Client({ auth: process.env.NOTION_KEY });

// Get all posts with status defined as environment variable
async function filteredRequest({ dbId, dsId, postType, requiredMetadata }) {
	try {
		const databaseId = dbId;
		let dataSourceId = dsId;
		if (!dataSourceId) {
			const db = await notion.databases.retrieve({ database_id: databaseId });
			dataSourceId = db.data_sources[0].id;
			console.log(`Use the first dataSourceId because there is none specified: ${dataSourceId}`);
		}
		else {
			console.log(`The provided dataSourceId for the post type "${postType}" is: ${dataSourceId}`)
		}
		const statusFieldType = requiredMetadata.statusFieldType;
		const response = await notion.dataSources.query({
			data_source_id: dataSourceId,
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
		throw new Error(error);
	}
}

export default filteredRequest;
