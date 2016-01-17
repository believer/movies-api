var db = require('../db').r;
var request = require('request');
var hypermedia = require('../services/hypermedia');
var movie = require('../services/movie');
var addToTables = require('../services/addToTables');
var _ = require('lodash');
var tmdb = require('../services/tmdb');

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

  if (!userid) {
    res.send(500, {
      message: 'No User ID'
    });

    return next();
  }

  id = id[0];

  db.table('movies')
    .getAll(id, { index: 'imdb' })
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(exists => {
      if (!exists.length) {
        movie(id)
          .then(movieToInsert => {
            db.table('movies')
              .insert(movieToInsert)
              .run(db.conn)
              .then(insert => {
                const id = insert.generated_keys[0];

                if (userid) {
                  addToTables.user(userid, id);
                  addToTables.view(userid, date, id);
                }

                if (rating) {
                  addToTables.addRating(userid, rating, id);
                }

                res.send(insert);
              })
              .catch(err => console.error('Failed movie insert', err));
          })
          .catch(err => console.error('Failed movie creation', err));
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
    })
    .catch(error => {
      res.send(500, error);
    })
}

function asyncEach(array, iterator, delay) {
    void function iteration(index) {
        if (index === array.length) return
        iterator(array[index], index)
        setTimeout(function () { iteration(index + 1) }, delay)
    }(0)
}

function update (req, res, next) {
  db.table('movies')
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      asyncEach(movies, (dbMovie, i) => {
        movie(dbMovie.ids.imdb || dbMovie.ids.tmdb)
          .then(info => {
            var merged = _.merge(dbMovie, info);

            db.table('movies')
              .get(dbMovie.id)
              .update(merged)
              .run(db.conn)
              .then(added => {
                console.log(dbMovie.title, added);
              });
          })
          .catch(err => console.error(err))
      }, 10000);
    });
}

module.exports = {
  list: list,
  details: details,
  add: add,
  update: update
};
