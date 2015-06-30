var db = require('../db').r;
var request = require('request');

function list (req, res, next) {
  db.table('movies')
    .limit(50)
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray() })
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function details (req, res, next) {
  db.table('movies')
    .get(req.params.id)
    .merge(function (movie) {
      return {
        cast: getNames('actors', movie),
        composers: getNames('composers', movie)
      };
    })
    .run(db.conn)
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function addMovies (movie, next) {
  db.table('movies')
    .insert(movie)
    .run(db.conn)
    .then(function () {
      return next();
    })
    .catch(next);
}

function add (req, res, next) {
  var url = 'http://api.believer.svc.tutum.io:3000/movies?limit=3000';

  request(url, function (err, response, body) {
    body = JSON.parse(body);
    body.results.forEach(function (movie) {
      db.table('movies')
        .insert(movie)
        .run(db.conn)
        .then(function () {
          return next();
        })
        .catch(next);
    });
  });
}

module.exports = {
  list: list,
  details: details,
  add: add
};
