// @ts-check
import { E } from '@endo/far';

console.warn('start proposal module evaluating');

/**
 * Core eval script to start contract
 *
 * @param {BootstrapPowers} permittedPowers
 */
export const startChainTimerContract = async permittedPowers => {
  console.error('startChainTimerContract()...');
  const {
    consume: { board, chainStorage, startUpgradable, zoe, chainTimerService },
    brand: {
      consume: { IST: istBrandP },
      // @ts-expect-error dynamic extension to promise space
      produce: brandProducers,
    },
    issuer: {
      consume: { IST: istIssuerP },
      // @ts-expect-error dynamic extension to promise space
      produce: issueProducers,
    },
    installation: {
      consume: { chainTimer: chainTimerInstallationP },
    },
    instance: {
      // @ts-expect-error dynamic extension to promise space
      produce: { chainTimer: produceInstance },
    },
  } = permittedPowers;

  // print all the powers
  console.log(
    '**************************************************',
    permittedPowers,
  );

  const storageNode = await E(chainStorage).makeChildNode('chainTimer');
  const istIssuer = await istIssuerP;

  const terms = { maxCertificates: 100n };

  // agoricNames gets updated each time; the promise space only once XXXXXXX
  const installation = await chainTimerInstallationP;

  const { instance } = await E(startUpgradable)({
    installation,
    issuerKeywordRecord: { Price: istIssuer },
    label: 'chainTimer',
    terms,
    privateArgs: {
      storageNode,
      board,
      timerService: chainTimerService,
    },
  });
  console.log('CoreEval script: started contract', instance);
  const { brands, issuers } = await E(zoe).getTerms(instance);

  console.log('CoreEval script: share via agoricNames:', {
    brands,
    issuers,
  });

  produceInstance.reset();
  produceInstance.resolve(instance);
  console.log('chainTimer (re)started');
};

/** @type { import("@agoric/vats/src/core/lib-boot").BootstrapManifest } */
const chainTimerManifest = {
  [startChainTimerContract.name]: {
    consume: {
      agoricNames: true,
      board: true, // to publish boardAux info for NFT brand
      chainStorage: true, // to publish boardAux info for NFT brand
      chainTimerService: true,
      startUpgradable: true, // to start contract and save adminFacet
      zoe: true, // to get contract terms, including issuer/brand
    },
    installation: { consume: { chainTimer: true } },
    issuer: {
      consume: { IST: true },
      produce: { IST: true },
    },
    brand: {
      consume: { IST: true },
      produce: { IST: true },
    },
    instance: { produce: { chainTimer: true } },
  },
};
harden(chainTimerManifest);

export const getManifestForChainTimer = ({ restoreRef }, { chainTimerRef }) => {
  return harden({
    manifest: chainTimerManifest,
    installations: {
      chainTimer: restoreRef(chainTimerRef),
    },
  });
};
