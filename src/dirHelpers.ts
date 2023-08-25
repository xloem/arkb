import fs from 'fs';
import os from 'os';
import path from 'path';

export const getTempDir = () => {
  if (process.env.ENV === 'cloud') return os.tmpdir();
  const localDir = './temp';
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir);
  return localDir;
};

export const clearDir = () => {
  const tempDir = getTempDir();
  fs.readdirSync(tempDir).forEach((fileOrDir) => {
    const path_ = path.resolve(path.join(tempDir, fileOrDir));
    const stats = fs.statSync(path_);
    if (stats.isDirectory()) fs.rmdirSync(path_, { recursive: true });
    else fs.unlinkSync(path_);
  });
};
