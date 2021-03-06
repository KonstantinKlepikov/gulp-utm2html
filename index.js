'use strict';

var fs          = require('fs'),
    through     = require('through2'),
    gutil       = require('gulp-util'),
    cheerio     = require('cheerio'),
    url         = require('url'),
    PluginError = gutil.PluginError;

function utm2html(opts) {

    return through.obj(function(file, enc, callback){
        // Pass file through if:
        // - file has no contents
        // - file is a directory
        if (file.isNull() || file.isDirectory()) {
            return callback(null, file);
        }

        // No support for streams
        if (file.isStream()) {
            this.emit('error', new PluginError({
                plugin: 'gulp-utm-builder',
                message: 'Streams are not supported.'
            }));
            return callback();
        }

        // check for necessary parameters
        // throw error if source/medium/campaign does not exist
        if (!opts.source) {
            this.emit('error', new PluginError({
                plugin: 'gulp-utm-builder',
                message: 'source can not be empty.'
            }));
        }
        if (!opts.medium) {
            this.emit('error', new PluginError({
                plugin: 'gulp-utm-builder',
                message: 'medium can not be empty.'
            }));
        }
        if (!opts.campaign) {
            this.emit('error', new PluginError({
                plugin: 'gulp-utm-builder',
                message: 'campaign can not be empty.'
            }));
        }

        if (file.isBuffer()) {

            var $ = cheerio.load(file.contents); // load in the HTML into cheerio
            var links = $('a');

            for (var i = 0, len = links.length; i < len; i++) {

                if ($(links[i]).attr('data-utm') === 'nope') {
                    $(links[i]).removeAttr("data-utm")
                    continue;
                }

                var parsedLink = url.parse($(links[i]).attr('href'), true);

                // ignore URL with malto protocol
                if (parsedLink.protocol === 'mailto:') {
                    continue;
                }

                parsedLink.query.utm_source      = opts.source;
                parsedLink.query.utm_medium      = opts.medium;
                parsedLink.query.utm_campaign    = opts.campaign;
                if (opts.term) {
                    parsedLink.query.utm_term    = opts.term;
                }
                if (opts.content) {
                    parsedLink.query.utm_content = opts.content;
                }

                delete parsedLink.search;
                $(links[i]).attr('href', url.format(parsedLink))
            }

            var data = $.html();
            var buffer = new Buffer(data.length);
            buffer.write(data);
            file.contents = buffer;

            return callback(null, file);
        }
    });
}

module.exports = utm2html;