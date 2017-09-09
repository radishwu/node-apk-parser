var https = require("https");
var fs = require("fs");
var os = require("os");
var exec = require("child_process").exec;

var targetDir = __dirname + "/tools/";
try {
    fs.statSync(targetDir);
} catch (e) {
    fs.mkdirSync(targetDir);
}

var platform = null;
if (os.type() === "Darwin") {
    platform = "darwin";
} else if (os.type() === "Linux") {
    platform = "linux";
} else {
    throw new Error("Unknown OS!");
}

function attemptDownload(attemptsLeft) {
    var url = "https://dl.google.com/android/repository/platform-tools-latest-" + platform + ".zip";
    var tempFile = "/tmp/platform-tools-" + (new Date().getTime()) + ".zip";

    var file = fs.createWriteStream(tempFile);
    var request = https.get(url, function (response) {
        response.pipe(file);
        response.on("end", function () {
            exec("unzip -j -o " + tempFile + " platform-tools/aapt -d tools/", function (err) {
                if (err) {
                    if (attemptsLeft === 0) {
                        throw err;
                    } else {
                        attemptDownload(attemptsLeft - 1);
                        return;
                    }
                }
                fs.chmodSync("tools/aapt", "755");
                fs.unlinkSync(tempFile);
                process.exit();
            });
        });
    });
}

attemptDownload(3);
