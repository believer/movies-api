var db         = require('../db').r;
var request    = require('request');
var hypermedia = require('../services/hypermedia');
var mdb        = require('moviedb')(process.env.TMDB_KEY);

function list (req, res, next) {
  var skip  = parseInt(req.query.skip, 10) || 0;
  var limit = parseInt(req.query.limit, 10) || 50;

  db.table('movies')
    .orderBy(db.asc('title'))
    .skip(skip)
    .limit(limit)
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray() })
    .then(function (movies) {
      var result = {
        movies: movies,
        _links: hypermedia.movies(skip, limit, 10000)
      };
      res.send(result);
      return next();
    })
    .catch(next);
}

function details (req, res, next) {
  db.table('movies')
    .get(req.params.id)
    .run(db.conn)
    .then(function (movies) {
      res.send(movies);
      return next();
    })
    .catch(next);
}

module.exports = {
  list: list,
  details: details
};
