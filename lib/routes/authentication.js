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
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      if (err) { return reject(err); }

      return resolve(res);
    });
  });
}

function setupMoviesList(id) {
  return new Promise (function (resolve, reject) {
    db.table('seen')
      .insert({
        user: id,
        movies: []
      })
      .run(db.conn)
      .then(function (added) {
        resolve(added);
      })
      .catch(function (error) {
        reject(error);
      });
    });
}

function storeInDb(email, password, res) {
  generateHash(password)
    .then(function (hash) {
      db.table('users')
        .insert({
          email: email,
          password: hash
        })
        .run(db.conn)
        .then(function (user) {
          setupMoviesList(user.generated_keys[0])
            .then(function (added) {
              res.send(200);
            });
        });
    });
}

function findUser(email) {
  return new Promise((resolve, reject) => {
    db.table('users')
      .getAll(email, { index: 'email' })
      .run(db.conn)
      .then(cursor => cursor.toArray())
      .then(user => resolve(user));
  });
}

function errorMessages(res, email, password) {
  if (!email) {
    res.send(400, {
      message: 'No e-mail provided'
    });
  }

  if (!password) {
    res.send(400, {
      message: 'No password provided'
    });
  }
}

function register (req, res, next) {
  var email = req.params.email;
  var password = req.params.password;

  if (!email || !password) {
    errorMessages(res, email, password);
    return;
  }

  findUser(email)
    .then(user => {
      if (user.length) {
        res.send(400, {
          message: 'E-mail already exists'
        });
      } else {
        storeInDb(email, password, res);
      }
    })
    .catch(next);
}

function login (req, res, next) {
  var email = req.params.email;
  var password = req.params.password;

  if (!email || !password) {
    errorMessages(res, email, password);
    return;
  }

  findUser(email)
    .then(user => {
      if (user.length) {
        var hash = user[0].password;

        compareHash(password, hash)
          .then(isEqual => {
            if (isEqual) {
              res.send(user[0]);
            } else {
              res.send(400, {
                message: 'Username or password is incorrect'
              });
            }
          });
      } else {
        res.send(400, {
          message: 'Username or password is incorrect'
        });
      }
    })
    .catch(next);
}

module.exports = {
  register: register,
  login: login
};
