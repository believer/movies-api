require('babel-core/register');

var movies         = require('./movies');
var search         = require('./search');
var stats          = require('./stats');
var users          = require('./users');
var authentication = require('./authentication');

function attach(server) {

  // Movies
  server.get('/movies', movies.list);
  server.get('/movies/:id', movies.details);
  server.post('/movies', movies.add);

  // search
  server.get('/search', search);

  // Stats
  server.get('/stats', stats);

  // Users
  server.get('/users', users.list);
  server.get('/users/:id', users.details);
  server.get('/users/:id/movies', users.movies);
  server.get('/users/:id/stats', users.stats);

  // Register / Login
  server.post('/register', authentication.register);
  server.post('/login', authentication.login);
}

module.exports = {
  attach: attach
};
