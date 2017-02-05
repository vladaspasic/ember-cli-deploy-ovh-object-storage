/* jshint node: true */
'use strict';

var minimatch = require('minimatch');
var Promise = require('ember-cli/lib/ext/promise');
var BasePlugin = require('ember-cli-deploy-plugin');
var OvhClient = require('./lib/ovh-client');

module.exports = {
  name: 'ember-cli-deploy-ovh-object-storage',

  createDeployPlugin: function(options) {
    var DeployPlugin = BasePlugin.extend({
      name: options.name,

      defaultConfig: {
        filePattern: '**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2,otf}',
        prefix: '',
        gzipped: false,
        distDir: function(context) {
          return context.distDir;
        },
        distFiles: function(context) {
          return context.distFiles || [];
        },
        gzippedFiles: function(context) {
          return context.gzippedFiles || [];
        },
        manifestPath: function(context) {
          return context.manifestPath;
        },
        uploadClient: function(context) {
          return context.uploadClient; // if you want to provide your own upload client to be used instead of one from this plugin
        },
        ovhClient: function(context) {
          return context.ovhClient; // if you want to provide your own ovh client to be used instead of one from this plugin
        }
      },

      requiredConfig: [
        'endpoint',
        'appKey',
        'appSecret',
        'consumerKey',
        'serviceName',
        'container',
        'region'
      ],

      upload: function() {
        var self = this;
        var files;

        if (this.readConfig('gzipped')) {
          files = this.readConfig('gzippedFiles');
        } else {
          files = this.readConfig('distFiles');
        }

        var filesToUpload = files.filter(minimatch.filter(this.readConfig('filePattern'), {
          matchBase: true
        }));

        var options = {
          files: filesToUpload,
          cwd: this.readConfig('distDir'),
          prefix: this.readConfig('prefix'),
          region: this.readConfig('region'),
          container: this.readConfig('container'),
          serviceName: this.readConfig('serviceName'),
          manifestPath: this.readConfig('manifestPath')
        };

        this.log('Preparing to upload to OVH Object Storage `' + options.serviceName + '`', {
          verbose: true
        });

        var client = this.readConfig('uploadClient') || new OvhClient({
          plugin: this,
          appKey: this.readConfig('appKey'),
          appSecret: this.readConfig('appSecret'),
          consumerKey: this.readConfig('consumerKey'),
          endpoint: this.readConfig('endpoint'),
          ovhClient: this.readConfig('ovhClient')
        });

        return client.upload(options).then(function(files) {
          self.log('Successfully uploaded ' + files.length + ' files.', {
            verbose: true
          });

          return {
            filesUploaded: files
          };
        }).catch(function(error) {
          if (error && error.message || typeof error === 'string') {
            self.log(error.message || error, {
              color: 'red'
            });
          }
          if (error && error.stack) {
            self.log(error.stack, {
              color: 'red'
            });
          }

          return Promise.reject(error);
        });

      }
    });

    return new DeployPlugin();
  }
};