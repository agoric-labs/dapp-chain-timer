// @ts-check
import { E, Far } from '@endo/far';
import { M } from '@endo/patterns';
import { TimeMath } from '@agoric/time';

/**
 * @import {TypedPattern} from '@agoric/internal';
 * @import {StorageNode} from '@agoric/internal/src/lib-chainStorage';
 * @import {TimerService} from '@agoric/time';
 * @import {ERef} from '@endo/far';
 */

/**
 * @typedef {{
 * maxTime: bigint;
 * }} TimeTerms
 *
 * @typedef {{
 *   storageNode: ERef<StorageNode>;
 *   timerService: ERef<TimerService>;
 * }} TimePrivateArgs
 */

/** @type {TypedPattern<TimeTerms>} */
const TimeTermsShape = M.splitRecord({
  maxTime: M.bigint(),
});

/** @type {TypedPattern<TimePrivateArgs>} */
const TimePrivateArgsShape = M.splitRecord({
  storageNode: M.remotable('StorageNode'),
  timerService: M.remotable('TimerService'),
});

export const meta = {
  customTermsShape: TimeTermsShape,
  privateArgsShape: TimePrivateArgsShape,
};
harden(meta);

/**
 * @param {ZCF<TimeTerms>} zcf
 * @param {TimePrivateArgs} privateArgs
 */
export const start = async (zcf, privateArgs) => {
  // Create storage node for time data
  const timeDataRoot = await E(privateArgs.storageNode).makeChildNode('Time');

  const timerBrand = await E(privateArgs.timerService).getTimerBrand();
  const toRT = value => TimeMath.coerceRelativeTimeRecord(value, timerBrand);

  /**
   * Store time data in VStorage
   * @param {object} data
   */
  const storeTimeData = async data => {
    try {
      const myTime = await E(privateArgs.timerService).getCurrentTimestamp();
      await E(timeDataRoot).setValue(JSON.stringify(`${myTime.absValue}`));
      await E(privateArgs.timerService).setWakeup(
        TimeMath.addAbsRel(myTime, 1n),
        handler,
      );
      return 'Time data published successfully';
    } catch (error) {
      console.error(`Error publishing Time data:${error}`);
      return harden(new Error(`Error publishing Time data:${error}`));
    }
  };
  // callback-based API functions need a handler object
  const handler = Far('handler', {
    wake: storeTimeData,
  });

  const proposalShape = harden({
    exit: M.any(),
    give: M.any(),
    want: M.any(),
  });

  /**
   * Handle publishing of time data
   * @param {ZCFSeat} seat
   * @param {object} offerArgs
   */
  const publishHandler = async (seat, offerArgs) => {
    const { timeData } = offerArgs;

    try {
      // Store the time data
      await storeTimeData(timeData);

      seat.exit();
      return 'Time data published successfully';
    } catch (error) {
      console.error('Error publishing time data:', error);
      return harden(new Error('Failed to publish time data'));
    }
  };

  const makePublishInvitation = () =>
    zcf.makeInvitation(
      publishHandler,
      'publish time data',
      undefined,
      proposalShape,
    );

  // To verify do the following on chain: agd q vstorage data published.chainTimer.Time
  // Function to write the current timestamp every 5 seconds
  const writeTimestampPeriodically = async () => {
    // wake up at least 1 seconds from now:
    let now = await E(privateArgs.timerService).getCurrentTimestamp();
    await E(privateArgs.timerService).setWakeup(
      TimeMath.addAbsRel(now, 1n),
      handler,
    );
  };

  // Start the periodic timestamp writing
  writeTimestampPeriodically().catch(err =>
    console.error('Error in periodic timestamp writing:', err),
  );

  return harden({
    publicFacet: Far('Time Data Public Facet', {
      makePublishInvitation,
    }),
  });
};

harden(start);
