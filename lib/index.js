var os = require("os");
var exec = require("child_process").execFile;
var ipaMetadata = require('ipa-metadata');

function extractRaw(string) {
    var sep = "\" (Raw: \"";
    var parts = string.split(sep);
    var value = parts.slice(0, parts.length / 2).join(sep);
    return value.substring(1);
}

function extractRawType(string) {
    var matches = string.match(/\(Raw:\s\"(.+)\"\)/);

    if (matches && matches.length > 1) {
        return matches[1];
    }
    return null;
}

function parseOutput(text, cb) {
    if (!text) {
        return cb(new Error("No input!"));
    }

    try {
        var packageNameRes = text.match(/package: name='[\S]*?'/g);
        var packageName = packageNameRes[0].replace(/package: name=/g,"").replace(/'/g,"");
        var versionNameRes = text.match(/versionName='[\S]*?'/g);
        var versionName = versionNameRes[0].replace(/versionName=/g,"").replace(/'/g,"");
        var appNameRes = text.match(/application: label='[\S]*?'/g);
        var appName = appNameRes[0].replace(/application: label=/g,"").replace(/'/g,"");
    
        var result = {
            packageName : packageName,
            versionName : versionName,
            appName : appName
        }

        cb(null, result);
    } catch (e) {
        cb(e, null);
    }
}

function parseApk(filename, maxBuffer, cb) {
    if (typeof(maxBuffer) === "function") {
        cb = maxBuffer;
        maxBuffer = 1024 * 1024;
    }

    exec(__dirname + "/../tools/aapt", ["dump", "badging", filename], {
        maxBuffer: maxBuffer,
    }, function (err, out) {
        if (err) {
            return cb(err);
        }
        parseOutput(out, cb);
    });
}

function parseIpa(filename, cb) {
    ipaMetadata(filename, function (err, data) {
        if (err) {
            return cb(err, null);
        }
        try {
            var packageName = data.metadata.CFBundleIdentifier;
            var versionName = data.metadata.CFBundleShortVersionString;
            var appName = data.metadata.CFBundleDisplayName;

            var result = {
                packageName : packageName,
                versionName : versionName,
                appName : appName
            }
            cb(null, result);
        } catch (e) {
            cb(e, null);
        }
    });
}

parseApk.parseOutput = parseOutput;

module.exports = {parseApk, parseIpa};
