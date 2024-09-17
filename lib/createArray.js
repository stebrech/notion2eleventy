const filteredRequest = require("./filteredRequest");

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
			if (optionalMetadata.formulaStringFields) {
				for (const field of optionalMetadata.formulaStringFields) {
					data[field] = result.properties[field]?.formula?.string;
				}
			}
			if (optionalMetadata.formulaNumberFields) {
				for (const field of optionalMetadata.formulaNumberFields) {
					data[field] = result.properties[field]?.formula?.number;
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

module.exports = createArray;
