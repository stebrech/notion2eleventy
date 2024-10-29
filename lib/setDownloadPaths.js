const fs = require("fs");

async function setDownloadPaths({ downloadPaths, slug }) {
	try {
		let paths = { md: "", img: "", movie: "", pdf: "" };

		if (downloadPaths.imgSlugSubfolder) {
			if (!fs.existsSync(`${downloadPaths.img}${slug}`)) {
				fs.mkdirSync(`${downloadPaths.img}${slug}`, { recursive: true });
			}
			paths.img = `${downloadPaths.img}${slug}/`;
		} else {
			if (!fs.existsSync(downloadPaths.img)) {
				fs.mkdirSync(downloadPaths.img, { recursive: true });
			}
			paths.img = downloadPaths.img;
		}

		if (downloadPaths.pdfSlugSubfolder) {
			if (!fs.existsSync(`${downloadPaths.pdf}${slug}`)) {
				fs.mkdirSync(`${downloadPaths.pdf}${slug}`, { recursive: true });
			}
			paths.pdf = `${downloadPaths.pdf}${slug}/`;
		} else {
			if (!fs.existsSync(downloadPaths.pdf)) {
				fs.mkdirSync(downloadPaths.pdf, { recursive: true });
			}
			paths.pdf = downloadPaths.pdf;
		}

		if (downloadPaths.movieSlugSubfolder) {
			if (!fs.existsSync(`${downloadPaths.movie}${slug}`)) {
				fs.mkdirSync(`${downloadPaths.movie}${slug}`, { recursive: true });
			}
			paths.movie = `${downloadPaths.movie}${slug}/`;
		} else {
			if (!fs.existsSync(downloadPaths.movie)) {
				fs.mkdirSync(downloadPaths.movie, { recursive: true });
			}
			paths.movie = downloadPaths.movie;
		}

		if (downloadPaths.mdSlugSubfolder) {
			if (!fs.existsSync(`${downloadPaths.md}${slug}`)) {
				fs.mkdirSync(`${downloadPaths.md}${slug}`, { recursive: true });
			}
			paths.md = `${downloadPaths.md}${slug}/`;
		} else {
			if (!fs.existsSync(downloadPaths.md)) {
				fs.mkdirSync(downloadPaths.md, { recursive: true });
			}
			paths.md = downloadPaths.md;
		}

		return paths;
	} catch (error) {
		console.error("Error in the setDownloadPaths function:", error.message);
	}
}

module.exports = setDownloadPaths;
