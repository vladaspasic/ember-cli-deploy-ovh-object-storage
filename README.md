# ember-cli-deploy-ovh-object-storage

> An ember-cli-deploy plugin to upload files to OVH Object Storage

[![](https://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/plugins/ember-cli-deploy-s3.svg)](http://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/)

This plugin uploads assets to your static OVH Object Storage container using [node-ovh](https://github.com/ovh/node-ovh).

## Quick Start

To get up and running quickly, do the following:

- Ensure [ember-cli-deploy-build](https://github.com/ember-cli-deploy/ember-cli-deploy-build) is installed and configured.

- Install this plugin

```bash
$ ember install ember-cli-deploy-ovh-object-storage
```

- Place the following configuration into `config/deploy.js`

```javascript
ENV['ovh-object-storage'] = {
    endpoint: '<ovh-api-endpoint>',
    appKey: '<your-ovh-app-key>',
    appSecret: '<your-ovh-app-secret>',
    consumerKey: '<your-ovh-consumer-key>',
    serviceName: '<your-ovh-cloud-service-id>',
    container: '<your-ovh-cloud-storage-container>',
    region: '<your-ovh-cloud-storage-region>'
}
```

- Run the pipeline

```bash
$ ember deploy
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation](http://ember-cli-deploy.com/plugins/).

- `configure`
- `upload`

## Configuration Options

For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation](http://ember-cli-deploy.com/plugins/).

### endpoint (`required`)
This property is used by [node-ovh](https://github.com/ovh/node-ovh) plugin which specifies which API you wish to use.

*Default:* 'undefined'

### appKey (`required`)
Used to identify your OVH Application, please refer to the [OVH API Documentation][1]

*Default:* 'undefined'

### appSecret (`required`)
Used to identify your OVH Application, please refer to the [OVH API Documentation][1]

*Default:* 'undefined'

### consumerKey (`required`)
Your authentication token obtained from OVH, please refer to the [OVH API Documentation][1]

*Default:* 'undefined'

### serviceName (`required`)
Service name is an actual ID of your running OVH Cloud service where the static Object Storage container is used.

*Default:* 'undefined'

### container (`required`)
Name of your Object Storage container where the assets should be uploaded

*Default:* 'undefined'

### region (`required`)
Location where your container is hosted

*Default:* 'undefined'

### filePattern
Files that match this pattern will be uploaded. The file pattern must be relative to `distDir`.

*Default:* '\*\*/\*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2,otf}'

### prefix
A prefix added to the files that the files should be uploaded.

*Default:* `''`

### gzipped
If this is set to true, the uploader would try to upload `gzippedFiles` list to your container.

*Default:* `false`

### distDir
The root directory where the files matching `filePattern` will be searched for. By default, this option will use the `distDir` property of the deployment context, provided by [ember-cli-deploy-build][2].

*Default:* `context.distDir`

### distFiles
The list of built project files. This option should be relative to `distDir` and should include the files that match `filePattern`. By default, this option will use the `distFiles` property of the deployment context, provided by [ember-cli-deploy-build][2].

*Default:* `context.distFiles`

### gzippedFiles
The list of files that have been gziped. This option should be relative to `distDir`. By default, this option will use the `gzippedFiles` property of the deployment context, provided by [ember-cli-deploy-gzip][3].

This option will be used to determine which files in `distDir`, that match `filePattern`, require the gzip content encoding when uploading.

*Default:* `context.gzippedFiles`

### manifestPath
The path to a manifest that specifies the list of files that are to be uploaded.

This manifest file will be used to work out which files don't exist on your container and, therefore, which files should be uploaded. By default, this option will use the `manifestPath` property of the deployment context, provided by [ember-cli-deploy-manifest][4].

*Default:* `context.manifestPath`

## Running Tests

- `npm test`

[1]: https://api.ovh.com/g934.first_step_with_api
[2]: https://github.com/ember-cli-deploy/ember-cli-deploy-build "ember-cli-deploy-build"
[3]: https://github.com/lukemelia/ember-cli-deploy-gzip "ember-cli-deploy-gzip"
[4]: https://github.com/lukemelia/ember-cli-deploy-manifest "ember-cli-deploy-manifest"
