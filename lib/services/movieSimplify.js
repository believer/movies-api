var getNames = require('../utilities/getNames');
var getCrew  = require('../utilities/getCrew');
var _ = require('lodash');

function movieSimplify (movie) {
  return new Promise(function (resolve, reject) {
    movie.cast                 = getNames(movie.cast);
    movie.production_companies = getNames(movie.production_companies);
    movie.genres               = getNames(movie.genres);
    movie.languages            = getNames(movie.spoken_languages);
    movie.title = movie.original_title;

    movie.ids = {
      imdb: movie.imdb_id,
      tmdb: movie.id.toString()
    };

    movie.images = {
      poster: movie.poster_path,
      backdrop: movie.backdrop_path
    };

    var crew = getCrew(movie.crew);
    movie = _.merge(movie, crew);

    var skipProps = [
      'spoken_languages',
      'backdrop_path',
      'poster_path',
      'id',
      'imdb_id',
      'original_title',
      'crew'
    ];

    movie = _.omit(movie, skipProps);

    resolve(movie);
  });
}

module.exports = movieSimplify;
