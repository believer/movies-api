var db = require('../db').r;
var request = require('request');
var hypermedia = require('../services/hypermedia');
var movie = require('../services/movie');
var addToTables = require('../services/addToTables');
var _ = require('lodash');

function list (req, res, next) {
  const skip  = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 50;

  db.table('movies')
    .orderBy(db.asc('title'))
    .skip(skip)
    .limit(limit)
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      const result = {
        movies: movies,
        _links: hypermedia.movies(skip, limit, 10000)
      };

      res.send(result);
      return next();
    })
    .catch(next);
}

function details (req, res, next) {
  const id = req.params.id;

  db.table('movies')
    .get(id)
    .run(db.conn)
    .then(movies => {
      res.send(movies);
      return next();
    })
    .catch(next);
}

function add (req, res, next) {
  var id = req.params.id.match(/tt\d+/);
  var date = req.params.date;
  var userid = req.params.userid;
  var rating = parseInt(req.params.rating, 10);

  if (!id[0]) {
    res.send(500, {
      message: 'No IMDb ID'
    });

    return next();
  }

  id = id[0];

  db.table('movies')
    .getAll(id, { index: 'imdb' })
    .run(db.conn)
    .then(function (cursor) { return cursor.toArray(); })
    .then(function (exists) {
      if (!exists.length) {
        movie(id)
          .then(function (movie) {
            db.table('movies')
              .insert(movie)
              .run(db.conn)
              .then(function (insert) {
                const id = insert.generated_keys[0];

                if (userid) {
                  addToTables.user(userid, id);
                  addToTables.view(userid, date, id);
                }

                if (rating) {
                  addToTables.addRating(userid, rating, id);
                }

                res.send(200);
              });
          });
      } else {
        var existsId = exists[0].id;

        if (userid) {
          addToTables.updateUser(userid, existsId);
          addToTables.view(userid, date, existsId);
        }

        if (rating) {
          addToTables.updateRating(userid, rating, existsId);
        }

        res.send(exists[0]);
      }
    });
}

module.exports = {
  list: list,
  details: details,
  add: add,
};
