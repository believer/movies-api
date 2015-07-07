var db = require('../db').r;
var bcrypt = require('bcrypt');

function generateHash(password) {
  return new Promise(function (resolve, reject) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
        resolve(hash);
      });
    });
  });
}

function compareHash(password, hash) {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(password, hash, function(err, res) {
      resolve(res);
    });
  });
}

function storeInDb(email, password, res) {
  generateHash(password)
    .then(function (hash) {
      db.table('users')
        .insert({
          email: email,
          password: hash,
          movies: []
        })
        .run(db.conn)
        .then(function () {
          res.send(200);
        });
    });
}

function findUser(email) {
  return new Promise(function (resolve, reject) {
    db.table('users')
      .getAll(email, { index: 'email' })
      .run(db.conn)
      .then(function (cursor) {
        return cursor.toArray();
      })
      .then(function (user) {
        resolve(user);
      })
  });
}

function register (req, res, next) {
  var email = req.params.email;
  var password = req.params.password;

  findUser(email)
    .then(function (user) {
      if (user.length) {
        res.send(400, 'E-mail already exists');
      } else {
        storeInDb(email, password, res);
      }
    })
    .catch(next);
}

function login (req, res, next) {
  var email = req.params.email;
  var password = req.params.password;

  findUser(email)
    .then(function (user) {
      if (user.length) {
        var hash = user[0].password;

        compareHash(password, hash)
          .then(function (isEqual) {
            if (isEqual) {
              res.send({
                hash: hash
              });
            }
          });
      } else {
        res.send(400, 'User does not exist');
      }
    })
    .catch(next);
}

module.exports = {
  register: register,
  login: login
};
