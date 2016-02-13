var db = require('../db').r;
var hypermedia = require('../services/hypermedia');
var compileStats = require('../services/stats');
var movieService = require('../services/movie');
var _ = require('lodash');
var moment = require('moment');
var md5 = require('md5');

function gravatar(profile) {
  return new Promise(function (resolve, reject) {
    const email = md5(profile.email);
    const gravatar = 'https://www.gravatar.com/avatar/' + email + '.jpg?s=300';

    resolve(_.set(profile, 'gravatar', gravatar));
  });
}

function addRatings(stats) {
  return new Promise(function (resolve, reject) {
    var ratingsArray = {
      ratings: [0,0,0,0,0,0,0,0,0,0,0]
    };

    db.table('ratings')
      .run(db.conn)
      .then(function (cursor) { return cursor.toArray(); })
      .then(function (ratings) {
        ratings.forEach(function (rating, i) {
          // Rating distribution
          ratingsArray.ratings[rating.rating]++;

          if (i === ratings.length -1) {
            resolve(_.merge(ratingsArray, stats));
          }
        });
      });

  });
}

function latest(req, res, next) {
  const id = req.params.id;
  const skip  = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 50;

  db.table('views')
    .getAll(id, { index: 'user' })
    .orderBy(db.desc('date'))
    .pluck('movie')
    .skip(skip)
    .limit(limit)
    .map(movie => ({
      id: movie('movie')
    }))
    .merge(movie => db
      .table('movies')
      .get(movie('id'))
      .pluck(['images', 'title'])
    )
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      db.table('views')
        .getAll(id, { index: 'user' })
        .count()
        .run(db.conn)
        .then(numberOfMovies => {
          const result = {
            meta: {
              skip: skip,
              limit: limit,
              total: numberOfMovies
            },
            movies: movies
          }

          res.send(result)
          return next()
        })
    })
    .catch(next)
}

function list(req, res, next) {
  db.table('users')
    .limit(50)
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(users => {
      res.send(users);
      return next();
    })
    .catch(next);
}

function details(req, res, next) {
  const id = req.params.id;

  db.table('users')
    .get(id)
    .run(db.conn)
    .then(user => {
      res.send(user);
      return next();
    })
    .catch(next);
}

function movies(req, res, next) {
  const id = req.params.id;
  const skip = parseInt(req.query.skip, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 50;

  db.table('seen')
    .getAll(id, { index: 'user' })
    .map(user => ({
      user: user('user'),
      id: user('id'),
      meta: {
        skip: skip,
        limit: limit,
        total: user('movies').count()
      },
      movies: user('movies')
        .skip(skip)
        .limit(limit)
        .map(movie => ({
          id: movie
        }))
        .merge(movie => db
          .table('movies')
          .get(movie('id'))
          .pluck(['id', 'images', 'title']))
        }))
        .run(db.conn)
        .then(cursor => cursor.toArray())
        .then(user => {
          user = user[0];
          user._links = hypermedia.user(id, skip, limit, user.meta.total);

          res.send(user);
          return next();
        })
        .catch(next);
}

function stats(req, res, next) {
  var id = req.params.id;

  db.table('seen')
    .getAll(id, { index:'user' })
    .map(user => {
      return {
        user: user('user'),
        id: user('id'),
        movies: user('movies')
          .map(movie => ({ id: movie }))
          .merge(movie => {
            return {
              dates: db.table('views')
                .getAll(movie('id'), { index: 'movie' })
                .filter(views => views('user').eq(id))
                .pluck('date')
                .coerceTo('array')
            };
          })
          .merge(movie => {
            return {
              rating: db.table('ratings')
                .getAll(movie('id'), { index: 'movie' })
                .filter(ratings => ratings('user').eq(id))
               	.pluck('rating')
               	.coerceTo('array')('rating')
                .reduce((left, right) => left.add(right))
            };
          })
          .merge(movie => db.table('movies').get(movie('id')))
      };
    })
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      res.send(compileStats(movies[0].movies));
      return next();
    })
    .catch(next);
}

function profile(req, res, next) {
  const id = req.params.id;

  db.table('users')
    .get(id)
    .pluck(['email', 'id'])
    .merge(function (user) {
      return {
        stats: {
          views: db.table('views')
            .getAll(id, { index: 'user' })
            .count(),
          uniqueViews: db.table('views')
            .getAll(id, { index: 'user' })
          	.without(['id', 'date'])
  					.distinct()
          	.count()
        }
      };
    })
    .run(db.conn)
    .then(gravatar)
    .then(profile => {
      res.send(profile);
      return next();
    })
    .catch(next);
}

function watchlist(req, res, next) {
  const id = req.params.id;

  db.table('watchlist')
    .getAll(id, { index: 'user' })
    .map(movie => {
      return db.table('movies')
        .get(movie('movie'))
        .pluck(['id', 'images', 'title'])
    })
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(movies => {
      res.send(movies)
      return next()
    })
    .catch(next)
}

function addToWatchlist(req, res, next) {
  const id = req.body.id
  const user = req.params.id

  db.table('movies')
    .getAll(id, { index: 'imdb' })
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(exists => {
      if (!exists.length) {
        movieService(id)
          .then(movieToInsert => {
            db.table('movies')
              .insert(movieToInsert)
              .run(db.conn)
              .then(insert => {
                const id = insert.generated_keys[0];

                db.table('watchlist')
                  .insert({
                    movie: id,
                    user: user,
                    added: moment().unix()
                  })
                  .run(db.conn)
                  .then(inserted => {
                    res.send(inserted)
                  })
              })
          })
      } else {
        const movie = exists[0]

        db.table('watchlist')
          .getAll(movie.id, { index: 'movie' })
          .filter(db.row('user').eq(user))
          .run(db.conn)
          .then(cursor => cursor.toArray())
          .then(exists => {
            if (!exists.length) {
              db.table('watchlist')
                .insert({
                  movie: movie.id,
                  user: user,
                  added: moment().unix()
                })
                .run(db.conn)
                .then(inserted => {
                  res.send(inserted)
                })
            } else {
              res.send(400, {
                message: 'User already has movie in watchlist'
              });
            }
          })
      }
    })
}

module.exports = {
  latest: latest,
  list: list,
  details: details,
  movies: movies,
  stats: stats,
  profile: profile,
  watchlist: watchlist,
  addToWatchlist: addToWatchlist
};
