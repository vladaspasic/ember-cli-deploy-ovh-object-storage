/* jshint node: true*/
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var Promise = require('ember-cli/lib/ext/promise');
var assert = chai.assert;

var stubProject = {
  name: function() {
    return 'my-project';
  }
};

/* global describe, it, beforeEach */
describe('ovh-object-storage', function() {
  var subject, mockUi, context;

  beforeEach(function() {
    subject = require('../../index');
    mockUi = {
      verbose: true,
      messages: [],
      write: function() {},
      writeLine: function(message) {
        this.messages.push(message);
      }
    };
    context = {
      project: stubProject,
      distDir: process.cwd() + '/tests/fixtures/dist',
      distFiles: ['app.css', 'app.js'],
      gzippedFiles: ['app.css', 'app.js', 'vendor.js'],
      ui: mockUi,
      uploadClient: {
        upload: function(options) {
          return Promise.resolve(options.files);
        }
      },
      config: {
        'ovh-object-storage': {
          endpoint: 'ovh-eu',
          appKey: 'appKey',
          appSecret: 'secreeeet',
          consumerKey: 'dakey',
          serviceName: 'my-service',
          container: 'my-container',
          region: 'SBG1'
        }
      }
    };
  });

  it('has a name', function() {
    var result = subject.createDeployPlugin({
      name: 'ovh-object-storage'
    });

    assert.equal(result.name, 'ovh-object-storage');
  });

  it('implements the correct hooks', function() {
    var plugin = subject.createDeployPlugin({
      name: 'ovh-object-storage'
    });

    assert.typeOf(plugin.configure, 'function');
    assert.typeOf(plugin.upload, 'function');
  });

  describe('#configure hook', function() {
    it('does not throw if config is ok', function() {
      var plugin = subject.createDeployPlugin({
        name: 'ovh-object-storage'
      });
      plugin.beforeHook(context);
      plugin.configure(context);
      assert.ok(true); // it didn't throw
    });

    it('throws if config is not valid', function() {
      var plugin = subject.createDeployPlugin({
        name: 'ovh-object-storage'
      });

      context.config['ovh-object-storage'] = {};

      plugin.beforeHook(context);
      assert.throws(function() {
        plugin.configure(context);
      });
    });

    it('warns about missing optional config', function() {
      delete context.config['ovh-object-storage'].filePattern;
      delete context.config['ovh-object-storage'].prefix;

      var plugin = subject.createDeployPlugin({
        name: 'ovh-object-storage'
      });
      plugin.beforeHook(context);
      plugin.configure(context);
      var messages = mockUi.messages.reduce(function(previous, current) {
        if (/- Missing config:\s.*, using default:\s/.test(current)) {
          previous.push(current);
        }

        return previous;
      }, []);
      assert.equal(messages.length, 9);
    });
  });

  describe('#upload hook', function() {
    it('prints the begin message', function() {
      var plugin = subject.createDeployPlugin({
        name: 'ovh-object-storage'
      });

      plugin.beforeHook(context);
      plugin.configure(context);
      return assert.isFulfilled(plugin.upload(context))
        .then(function() {
          assert.equal(mockUi.messages.length, 13);

          var messages = mockUi.messages.reduce(function(previous, current) {
            if (/Preparing to upload to OVH Object Storage `my-service`/.test(current)) {
              previous.push(current);
            }

            return previous;
          }, []);

          assert.equal(messages.length, 1);
        });
    });

    it('prints success message when files successully uploaded', function() {
      var plugin = subject.createDeployPlugin({
        name: 'ovh-object-storage'
      });

      plugin.beforeHook(context);
      plugin.configure(context);
      return assert.isFulfilled(plugin.upload(context))
        .then(function() {
          assert.equal(mockUi.messages.length, 13);

          var messages = mockUi.messages.reduce(function(previous, current) {
            if (/- Successfully uploaded 2 files/.test(current)) {
              previous.push(current);
            }

            return previous;
          }, []);

          assert.equal(messages.length, 1);
        });
    });

    it('prints success message when gzipped files successully uploaded', function() {
      var plugin = subject.createDeployPlugin({
        name: 'ovh-object-storage'
      });

      context.config['ovh-object-storage'].gzipped = true;

      plugin.beforeHook(context);
      plugin.configure(context);
      return assert.isFulfilled(plugin.upload(context))
        .then(function() {
          assert.equal(mockUi.messages.length, 12);

          var messages = mockUi.messages.reduce(function(previous, current) {
            if (/- Successfully uploaded 3 files/.test(current)) {
              previous.push(current);
            }

            return previous;
          }, []);

          assert.equal(messages.length, 1);
        });
    });

    it('prints an error message if the upload errors', function() {
      var plugin = subject.createDeployPlugin({
        name: 'ovh-object-storage'
      });

      context.uploadClient = {
        upload: function() {
          return Promise.reject(new Error('Ooops, something broke'));
        }
      };

      plugin.beforeHook(context);
      plugin.configure(context);
      return assert.isRejected(plugin.upload(context))
        .then(function() {
          assert.equal(mockUi.messages.length, 14);
          var messages = mockUi.messages.reduce(function(previous, current) {
            if (/- Error: Ooops, something broke/.test(current)) {
              previous.push(current);
            }

            return previous;
          }, []);

          assert.equal(messages.length, 1);
        });
    });
  });
});