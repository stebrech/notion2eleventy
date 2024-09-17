const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_KEY });
const { NotionToMarkdown } = require("notion-to-md");
const n2m = new NotionToMarkdown({ notionClient: notion });

// Get content from Notion
const getMarkdown = async (id) => {
	try {
		const mdblocks = await n2m.pageToMarkdown(id);
		return n2m.toMarkdownString(mdblocks);
	} catch (error) {
		// Handle errors here
		console.error("Error in the getContent function:", error.message);
	}
};

module.exports = getMarkdown;
