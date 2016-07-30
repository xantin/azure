var azure = require('azure-storage');
var async = require("async");
var dir = require("node-dir");

var input = process.argv;
if(input.length != 4){
  console.log('please specify containerName and path to the uploaded folder arguments: node azure_deployment.js <containerName> <pathToUploadedDir>');
  process.exit();
}

var containerName = input[2];
var pathToUploadedDir = input[3];
var blobSvc  = azure.createBlobService();

async.waterfall([
    function(cb){
      blobSvc.listBlobsSegmented(containerName, null, cb);
    },
    async.apply(deleteAllFiles, containerName)
  ], function(err, result){
      if(!err){
        uploadAllFilesFromFolder(containerName, pathToUploadedDir);
      }
  }
);

/**
 * @param containerName
 * @param result
 * @param response
 * @param cb
 */
function deleteAllFiles(containerName, result, response, cb){
  async.each(result.entries,
    function(entry, callback) {
      blobSvc.deleteBlob(containerName, entry.name, callback);
    }, function(err){
      return cb(err);
  });
}

/**
 * @param name
 * @param folderName
 * @returns {string|XML}
 */
function formatName(name, folderName){
    return name.replace(/\\/g,'/').replace(folderName,'').replace('/','');
}

/**
 * @param containerName
 * @param folderName
 */
function uploadAllFilesFromFolder(containerName, folderName){
    dir.paths(folderName, function(err, paths) {
        if (err) {
            throw err;
        }

        async.each(paths.files, function(filePath, callback) {
            var blobname = formatName(filePath, folderName);
            blobSvc.createBlockBlobFromLocalFile(containerName, blobname, filePath, function(error, result, response){
                if(!error){
                    console.log('File ' + blobname + ' uploaded');
                }
            });
        }, function (err){

        });
    });
}

