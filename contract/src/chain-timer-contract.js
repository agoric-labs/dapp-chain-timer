// @ts-nocheck
import { E, Far } from '@endo/far';
import { M } from '@endo/patterns';
import '@agoric/zoe/exported.js';
import { TimeMath } from '@agoric/time';

/**
 * @typedef {{
 * maxTime: bigint;
 * }} TimeTerms
 */

export const meta = {
  customTermsShape: M.splitRecord({
    maxTime: M.bigint(),
  }),
};

/**
 * @param {ZCF<TimeTerms>} zcf
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
