// Alguns volumes Windows retornam EISDIR em readlink de arquivos comuns.
// Normaliza somente esse caso comprovado por lstat; links reais e demais erros são preservados.
const fs = require("node:fs");
function normalize(error, file) {
  if (error?.code === "EISDIR") {
    try {
      if (!fs.lstatSync(file).isSymbolicLink()) error.code = "EINVAL";
    } catch {}
  }
  return error;
}
const original = fs.readlink;
fs.readlink = function (file, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }
  return original.call(fs, file, options, (error, result) =>
    callback(error ? normalize(error, file) : null, result),
  );
};
const originalSync = fs.readlinkSync;
fs.readlinkSync = function (file, options) {
  try {
    return originalSync.call(fs, file, options);
  } catch (error) {
    throw normalize(error, file);
  }
};
const originalPromise = fs.promises.readlink;
fs.promises.readlink = async function (file, options) {
  try {
    return await originalPromise.call(fs.promises, file, options);
  } catch (error) {
    throw normalize(error, file);
  }
};
