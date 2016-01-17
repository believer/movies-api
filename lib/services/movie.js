var tmdb = require('./tmdb');
var movieInformation = require('./movieInformation');
var movieSimplify = require('./movieSimplify');
var omdb = require('./omdb');

function movie(id) {
  return new Promise((resolve, reject) => {
    tmdb.info(id)
      .then(movieInformation)
      .then(tmdb.credits)
      .then(movieSimplify)
      .then(omdb)
      .then(movie => resolve(movie))
      .catch(error => reject(error))
  });
}

module.exports = movie;
