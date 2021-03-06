var logger = require('winston');
var crypto = require('crypto');
var fs = require('fs');
var yaml = require('js-yaml');

var appData = yaml.safeLoad(fs.readFileSync('/src/config/app_data.yml'));
var appSecret = appData.app_secret;

var log = function(req, res, next){
  logger.info('Incoming request: ', req.originalUrl);
  next();
}

var digest = function(str){
  var sha256 = crypto.createHash('sha256');
  sha256.update(str, 'utf8');
  return sha256.digest('base64');
}

var verifySignature = function(req, res, next) {
  var signature = req.query.signature,
      resource = req.query.resource;

  if (resource && signature){
    signature = signature.replace(/\s/g, '+'),
    resource = resource.replace(/\s/g, '+');

    if (digest(resource + appSecret) === signature) {
      next();
    } else { // invalid signature
      res.status(403).render('error', {message: 'Invalid or missing signature.'});
    }
  } else if (!signature){ // missing signature
    res.status(403).render('error', {message: 'Invalid or missing signature.'});
  } else { // missing resource param
    res.status(400).render('error', {message: 'Missing or invalid params'});
  }
}

var check = function(req, res, next){
  var whitelistRegexp = /\/capture\/?\?([A-z0-9=&+\/]|\n)*$/;

  if (whitelistRegexp.test(req.originalUrl)) {
    next();
  } else {
    res.status(400).render('error', {message: 'Request parameters are invalid'});
  }
}

module.exports = {
  log: log,
  check: check,
  verifySignature: verifySignature
}
