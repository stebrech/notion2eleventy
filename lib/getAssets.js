const axios = require("axios");
const fs = require("fs");

async function getAssets(url, outputPath, filename) {
	try {
		const response = await axios({
			url: url,
			method: "GET",
			responseType: "stream",
		});

		const filePath = outputPath + filename;

		// Ensure the directory exists
		fs.mkdirSync(outputPath, { recursive: true });

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

module.exports = getAssets;
