'use strict'; 'use strong';

import {config} from './Config';
import app from './Base';
import $cacheFactory from './services/$CacheFactory';
import {$templateLoader} from './services/$TemplateCache';
import {
    BaseRequest,
    RESPONSE_HEADER_MESSAGES,
    PRAGMA_HEADER,
    NO_CACHE_HEADER
} from './services/BaseRequest';
import util from './util/util';
import __mimetypes__ from './util/MimeTypes';
import $log from './util/$LogProvider';

const http =        require('http'),
      url =         require('url'),
      watch =       require('node-watch');

const p = process;

let firstrun = true,
    port;

export default function server(args) {
    port = !isNaN(+args[2]) ? args[2] : 3000;

    if (firstrun) {
        $log.warn('"server" not suitable for production use.');
    }

    prepApp().then(function() {

        // Start a webserver
        // TODO run the webserver with Gulp and gulp watch project files and angie files to reload
        http.createServer(function(request, response) {
            let path = url.parse(request.url).pathname,
                angieResponse = new BaseRequest(path, request, response),
                asset;

            // A file cannot be in the static path if it doesn't have an extension, shortcut
            // TODO you may want to move the asset loading block out of here
            if (path.indexOf('.') > -1) {
                let assetCache = new $cacheFactory('staticAssets');

                if (assetCache.get(path)) {
                    asset = assetCache.get(path);
                } else {
                    asset = $templateLoader(path, 'static');
                }

                // We have an asset and must render a response
                if (asset) {

                    let contentType;

                    // TODO mimetypes should never return undefined
                    if (__mimetypes__[ path.split('.').pop() ]) {
                        contentType = __mimetypes__[
                            path.split('.').pop()
                        ];
                    } else {
                        contentType = 'text/plain';
                    }

                    // Set the content type
                    angieResponse.responseHeaders[ 'Content-Type' ] = contentType;

                    // We do not want to cache responses
                    if (
                        config.hasOwnProperty('cacheStaticAssets') &&
                        !config.cacheStaticAssets
                    ) {
                        angieResponse.responseHeaders = util.extend(
                            angieResponse.responseHeaders,
                            {
                                'Expires': -1,
                                'Pragma': PRAGMA_HEADER,
                                'Cache-Control': NO_CACHE_HEADER
                            }
                        );
                    }

                    response.writeHead(
                        200,
                        RESPONSE_HEADER_MESSAGES['200'],
                        angieResponse.responseHeaders
                    );

                    // Check if you have an image type asset
                    $log.info(path, response._header);
                    response.write(asset);
                } else {

                    // We have no asset and must render a response
                    const error = $templateLoader('404.html');

                    // TODO extrapolate this to responses
                    response.writeHead(
                        404,
                        RESPONSE_HEADER_MESSAGES['404'],
                        angieResponse.responseHeaders
                    );
                    $log.warn(path, response._header);
                    response.write(error);
                }

                // End the response
                response.end();
            } else {
                angieResponse.route().then(function() {
                    console.log('DO I GET IN?');
                    let code = response.statusCode;
                    console.log(code);
                    if (!code) {
                        const error = $templateLoader('500.html');

                        // TODO extrapolate this to responses
                        response.writeHead(
                            500,
                            RESPONSE_HEADER_MESSAGES['500'],
                            angieResponse.responseHeaders
                        );
                        response.write(error);
                        $log.error(path, response._header);
                    } else if (code < 400) {
                        console.log($log.info, response._header);
                        $log.info(path, response._header);
                    } else if (code < 500) {
                        $log.warn(path, response._header);
                    } else {
                        $log.error(path, response._header);
                    }
                    console.log('__DO I GET IN?');
                    return true;
                }).then(function() {
                    console.log('DONE');

                    // End the response
                    response.end();
                });
            }

            // TODO this seems to cause ERR_INCOMPLETE_CHUNKED_ENCODING
            // request.connection.end();
            // request.connection.destroy();
        }).listen(+port);

        // Attempt to restart the webserver on change
        if (firstrun) {
            let watchDirs = [ p.cwd(), __dirname ].concat(app.__dependencies__);

            try {
                let restartObj = {
                        persistent: true,
                        recursive: true
                    };
                watch(watchDirs, (() => restart()), restartObj);
            } catch(e) {
                $log.error(e);
            }
        }

        // Info
        $log.info(`Serving on port ${port}`);

        // Set firstrun to false
        firstrun = false;
    });
}

function restart() {

    // TODO this doesn't reload like you think it does
    prepApp().then(function() {
        $log.info(`Application files reloaded; Still serving on port ${port}`);
    });

    // TODO live reload
}

export function prepApp() {

    // Load any app dependencies
    return app.loadDependencies(config.dependencies).then(function() {

        // Bootstrap the angular application
        return new Promise(
            (resolve) => app.bootstrap().then(
                app.__dropBootstrapMethods__
            ).then(resolve)
        );
    });
}