var mdb = require('moviedb')(process.env.TMDB_KEY);
var _   = require('lodash');

function credits (movie) {
  return new Promise(function (resolve, reject) {
    mdb.movieCredits({id:movie.imdb_id}, function (err, credits) {
      if (err) { reject(err); }
      movieWithCredits = _.merge(movie, credits);
      resolve(movieWithCredits);
    });
  });
}

function info (id) {
  return new Promise(function (resolve, reject) {
    mdb.movieInfo({id:id}, function (err, information) {
      if (err) { reject(err); }
      resolve(information);
    });
  });
}

module.exports = {
  info: info,
  credits: credits
};
