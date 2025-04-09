const processCategory = (category) => {
  if (category) {
    return category
      .toLowerCase() // Convert to lowercase
      .replace(/&/g, "and") // Replace '&' with 'and'
      .replace(/\s+/g, "-") // Replace spaces with '+'
      .replace(/[^a-z0-9\-and]/g, ""); // Remove special characters
  }
  return "";
};

module.exports = processCategory;
