import Blockweave from 'blockweave';
import fg from 'fast-glob';
import * as fs from 'fs';
import Deploy from './lib/deploy';
import Tags from './lib/tags';

/*
We have four use cases to account for:
1. Single File, as a JSON
  - orderedPaths is empty
  - mimeType triggered
  - isFile === true
2. Single File as an image
  - orderedPaths is empty
  - isFile === true
3. Multiple Files, as JSON
  - orderedPaths is empty
  - mimeType triggered
  - isFile === false
4. Multiple Files, as images
  - orderedPaths is NOT empty
  - mimeType NOT triggered
  - isFile === false
 */

const getWallet = () => JSON.parse(process.env.ARWEAVE_KEY as string);

// Globals
const colors = true;
const useBundler = 'https://node1.bundlr.network';

// Getters
const getBlockweave = (): Blockweave =>
  new Blockweave(
    {
      url: 'https://arweave.net',
      timeout: 20000,
    },
    ['https://arweave.net'],
  );

const getDeploy = (): Deploy => {
  // Getters
  const blockweave = getBlockweave();

  // Defaults
  const debug = false;
  const concurrency = 5;
  const bundle = undefined;

  const wallet = getWallet();
  return new Deploy(wallet, blockweave as any, debug, concurrency, true, bundle);
};

const prepare = async (dir: string, deploy: Deploy, orderedPaths: string[]) => {
  let files = [dir];
  if (fs.lstatSync(dir).isDirectory()) {
    files = await fg([`${dir}/**/*`], { dot: false });
  }

  // Defaults
  const index = 'index.html';
  const tags = new Tags();
  const license = undefined;
  const feeMultiplier = 1;
  // Force a redeploy so there aren't strange caching issues
  const forceRedeploy = true;

  // This grabs the name of the first file
  const fileName = files[0].split('/').pop() as string;

  // If it is a number, we want to pass a mime-type of application/json
  const mimeType = !isNaN(parseInt(fileName)) ? 'application/json' : '';

  await deploy.prepare(
    dir,
    files,
    index,
    tags,
    license,
    useBundler,
    feeMultiplier,
    forceRedeploy,
    colors,
    orderedPaths,
    mimeType,
  );

  return files.length == 1;
};

export const deployer = async (dir: string, orderedPaths: string[]) => {
  const deploy = getDeploy();
  const isFile = await prepare(dir, deploy, orderedPaths);
  const manifestTx: string = await deploy.deploy(isFile, useBundler, colors);
  const url = `${getBlockweave().config.url}/${manifestTx}`;
  return url;
};
