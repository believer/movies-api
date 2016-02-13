var db = require('../db').r;

function list (req, res, next) {
  db.table('views')
    .orderBy(db.desc('date'))
    .limit(50)
    .merge(movies => ({
      movie: db.table('movies').get(movies('movie')).pluck(['title', 'id']),
      user: db.table('users').get(movies('user')).pluck('email')('email'),
      rating: db.table('ratings')
        .getAll(movies('movie'), { index: 'movie' })
        .filter(ratings => ratings('user').eq(movies('user')))
        .coerceTo('array')
        .pluck('rating')('rating')(0)
    }))
    .run(db.conn)
    .then(cursor => cursor.toArray())
    .then(feed => {
      res.send(feed)
      return next()
    })
}

module.exports = {
  list: list
}
