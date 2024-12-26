/**
 * @file Permission Contract Deployment builder
 *
 * Creates files for starting an instance of the contract:
 * * contract source and instantiation proposal bundles to be published via
 *   `agd tx swingset install-bundle`
 * * start-chain-timer-permit.json and start-chain-timer.js to submit the
 *   instantiation proposal via `agd tx gov submit-proposal swingset-core-eval`
 *
 * Usage:
 *   agoric run build-contract-deployer.js
 */

import { makeHelpers } from '@agoric/deploy-script-support';
import { getManifestForChainTimer } from '../src/chain-timer-proposal.js';

/** @type {import('@agoric/deploy-script-support/src/externalTypes.js').ProposalBuilder} */
export const chainTimerProposalBuilder = async ({ publishRef, install }) => {
  return harden({
    sourceSpec: '../src/chain-timer-proposal.js',
    getManifestCall: [
      getManifestForChainTimer.name,
      {
        chainTimerRef: publishRef(
          install(
            '../src/chain-timer-contract.js',
            '../bundles/bundle-chain-timer.js',
            {
              persist: true,
            },
          ),
        ),
      },
    ],
  });
};

/** @type {DeployScriptFunction} */
export default async (homeP, endowments) => {
  const { writeCoreProposal } = await makeHelpers(homeP, endowments);
  await writeCoreProposal('start-chain-timer', chainTimerProposalBuilder);
};
