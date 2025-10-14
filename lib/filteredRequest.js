import "dotenv/config";
import { Client } from "@notionhq/client";

// Debug: Check if NOTION_KEY is available
if (!process.env.NOTION_KEY) {
	console.error("Error: NOTION_KEY environment variable is not set");
	throw new Error("NOTION_KEY environment variable is required");
}

const notion = new Client({ auth: process.env.NOTION_KEY });

// Get all posts with status defined as environment variable
async function filteredRequest({ dbId, requiredMetadata }) {
	try {
		const databaseId = dbId;
		const statusFieldType = requiredMetadata.statusFieldType;
		const response = await notion.databases.query({
			database_id: databaseId,
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

export default filteredRequest;
