/* jshint node: true */
"use strict";

var fs = require('fs');
var ovh = require('ovh');
var url = require('url');
var _ = require('lodash');
var path = require('path');
var https = require('https');
var CoreObject = require('core-object');
var Promise = require('ember-cli/lib/ext/promise');

function buildRequestOptions(location, token, method) {
  var parsed = url.parse(location);

  return {
    method: method,
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    path: parsed.path,
    headers: {
      'X-Auth-Token': token
    }
  };
}

function request(options, callback) {
  return https.request(options, (response) => {
    var body = '';
    response.on('data', function(chunk) {
      body += chunk;
    });
    response.on('end', function() {
      callback(null, response, body);
    });
    response.on('error', function(error) {
      callback(error);
    });
  });
}

module.exports = CoreObject.extend({
  init: function(options) {
    this._super(options);

    this.plugin = options.plugin;
    this.ovh = ovh({
      appKey: options.appKey,
      appSecret: options.appSecret,
      consumerKey: options.consumerKey,
      endpoint: options.endpoint
    });
  },

  upload(options) {
    var self = this;
    return this._findObjectStorage(options).then(function(storage) {
      return self._determineFilePaths(storage, options).then(function(files) {
        if (options.manifestPath) {
          files = files.concat(options.manifestPath);
        }

        return self._uploadFiles(files, storage, options);
      });
    });
  },

  _uploadFiles: function(files, storage, options) {
    var self = this;
    return Promise.all(_.map(files, function(filePath) {
      return self._uploadFile(filePath, storage, options);
    }));
  },

  _uploadFile: function(filePath, storage, options) {
    var plugin = this.plugin;
    var location = path.join('/', options.container, options.prefix, filePath);
    var url = storage.url + location;
    var stream = fs.createReadStream(path.resolve(options.cwd, filePath));

    plugin.log('Uploading File `' + filePath + '` to Object Storage with URL `' + url + '`', {
      verbose: true
    });

    return new Promise(function(resolve, reject) {
      var req = request(buildRequestOptions(url, storage.token, 'PUT'), function(error, response) {
        if (error || response.statusCode !== 201) {
          return reject(error || new Error('Unable to upload file. Rejected with status code: ' + response.statusCode));
        }
        plugin.log('✔  ' + location, {
          verbose: true
        });
        return resolve();
      });

      stream.pipe(req);
    });
  },

  _determineFilePaths: function(storage, options) {
    var plugin = this.plugin;
    var files = options.files || [];
    if (typeof files === 'string') {
      files = [files];
    }

    return this._getManifestEntries(storage, options).then(function(manifestEntries) {
      plugin.log('Manifest found. Differential deploy will be applied.', {
        verbose: true
      });
      return _.difference(files, manifestEntries);
    }).catch(function(error) {
      plugin.log('Manifest not found. Disabling differential deploy.', {
        color: 'yellow',
        verbose: true
      });

      if (error && error.stack) {
        plugin.log(error.stack, {
          color: 'yellow',
          verbose: true
        });
      }

      return Promise.resolve(files);
    });
  },

  _getManifestEntries: function(storage, options) {
    var manifestPath = options.manifestPath;
    if (manifestPath) {
      var location = storage.url + path.join('/', options.container, options.prefix, manifestPath);

      this.plugin.log('Downloading manifest for differential deploy from `' + location + '`...', {
        verbose: true
      });

      return new Promise(function(resolve, reject) {
        var req = request(buildRequestOptions(location, storage.token, 'GET'), function(error, response, body) {
          if (error || response.statusCode !== 200) {
            return reject(error || new Error('Unable to load manifest file contents.'));
          }
          return resolve(body.split('\n'));
        });

        req.end();
      });
    } else {
      return Promise.resolve([]);
    }
  },

  _findObjectStorage: function(options) {
    var plugin = this.plugin;
    var url = '/cloud/project/' + options.serviceName + '/storage/access';

    plugin.log('Finding Object Storage for project `' + options.serviceName + '` and region `' + options.region + '`...', {
      verbose: true
    });

    return this.ovh.requestPromised('POST', url).then(function(response) {
      var token = _.get(response, 'token');

      if (_.isEmpty(token)) {
        throw new Error('Could not get object storage access token from OVH');
      }

      var endpoints = _.get(response, 'endpoints');

      if (!_.isArray(endpoints) || _.isEmpty(endpoints)) {
        throw new Error('There are no available storage objects for your project');
      }

      var endpoint = _.find(endpoints, ['region', options.region]);

      if (_.isEmpty(endpoint)) {
        throw new Error('Could not find storage object for region `' + options.region + '`.');
      }

      plugin.log('Got Object Storage endpoint `' + endpoint.url + '` and token `' + token + '`.', {
        verbose: true
      });

      return {
        token: token,
        url: endpoint.url
      };
    }).catch(function(error) {
      // OVH API always returns an error status code
      if (_.isNumber(error)) {
        throw new Error('Could not get access for Object Storage, server responded with a status code ' + error + '.');
      }

      // rethrow original
      throw error;
    });
  }
});