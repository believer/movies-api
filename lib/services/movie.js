var tmdb             = require('./tmdb');
var movieInformation = require('./movieInformation');
var movieSimplify    = require('./movieSimplify');

function movie(id) {
  return new Promise(function (resolve, reject) {
    tmdb.info(id)
      .then(movieInformation)
      .then(tmdb.credits)
      .then(movieSimplify)
      .then(function (movie) {
        resolve(movie);
      });
  });
}

module.exports = movie;
