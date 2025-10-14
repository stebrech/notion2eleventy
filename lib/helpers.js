// Functions to replace special characters
export const matchUmlauts = (match) => {
	switch (match) {
		case "ä":
			return "ae";
		case "ö":
			return "oe";
		case "ü":
			return "ue";
	}
};
export const matchAccents = (match) => {
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
};

// Convert to camelCase
export const camelize = (str) => {
	return str
		.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
			return index === 0 ? word.toLowerCase() : word.toUpperCase();
		})
		.replace(/\s+/g, "");
};

// Create slug
export const createSlug = (title) => {
	let slug = title
		.toLowerCase()
		.replace(/[\s/]/gi, "-")
		.replace(/[äöü]/gi, matchUmlauts)
		.replace(/[çéèêëàâùûîïô]/gi, matchAccents)
		.replace(/[^a-z0-9-]/gi, "");
	return slug;
};

// Build the file name
export const createFilename = (slug, date, optionalDatePrefix) => {
	let filename = "";
	if (date && optionalDatePrefix) {
		filename = `${date.replace(/[-]/gi, "")}_${slug}.md`;
	} else {
		filename = `${slug}.md`;
	}
	return filename;
};

// Build the URL path
export const createUrlPath = (permalink, postType, slug, customSlug, date) => {
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
};
