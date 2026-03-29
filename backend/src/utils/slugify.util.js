const slugify = require('slugify');

function createSlug(input) {
  return slugify(String(input || ''), {
    lower: true,
    strict: true,
    locale: 'vi'
  });
}

module.exports = createSlug;
