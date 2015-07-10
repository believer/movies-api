var _ = require('lodash');

function movieInformation (movie) {
  var props = [
    'backdrop_path',
    'genres',
    'id',
    'imdb_id',
    'overview',
    'original_title',
    'poster_path',
    'production_companies',
    'release_date',
    'runtime',
    'spoken_languages',
    'tagline'
  ];

  movie = _.pick(movie, props);

  return movie;
}

module.exports = movieInformation;
