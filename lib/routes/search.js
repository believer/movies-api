module.exports = function (req, res, next) {
  var type = req.params.type;
  var query = req.params.query || '*';
  var url;

  if (type) {
    url = process.env.ELASTIC + type + ':' + query;
  } else {
    url = process.env.ELASTIC + query;
  }

  request(url, function (err, response, body) {
    res.send(JSON.parse(body));
  });
};
