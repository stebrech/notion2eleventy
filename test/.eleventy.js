const n2e = require("../eleventy.config.js");
require("dotenv").config();

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(n2e, {
		dbId: process.env.NOTION_DB_BLOG,
		postType: "blog",
		requiredMetadata: {
			status: "Status_Select",
			statusFieldType: "select",
			title: "Title",
		},
		optionalMetadata: {
			layout: "",
			date: "Date",
			textFields: ["Description"],
			multiSelectFields: ["Tags"],
			selectFields: [],
			dateFields: ["Updated"],
			checkboxFields: ["Checkbox"],
			urlFields: ["Link"],
			numberFields: ["Number"],
			personFields: ["Person"],
			relationFields: ["Relation"],
			formulaStringFields: ["FormulaText"],
			formulaNumberFields: ["Formula"],
		},
		permalink: {
			includesYear: true,
			includesMonth: true,
			includesDay: true,
			publishPermalink: true,
		},
		downloadPaths: {
			md: "src/blog/",
			mdSlugSubfolder: true,
			img: "src/blog/",
			imgSlugSubfolder: true,
			imgAddDatePrefix: false,
			movie: "src/blog/",
			movieSlugSubfolder: true,
			pdf: "src/blog/",
			pdfSlugSubfolder: true,
		},
		markdownPaths: {
			img: "./",
			movie: "./",
			pdf: "./",
		},
		copyAssetsToOutputFolder: {
			img: false,
		},
	});

	eleventyConfig.addPassthroughCopy({
		"./src/assets/img": "/assets/img",
	});

	return {
		dir: {
			input: "src",
		},
	};
};
