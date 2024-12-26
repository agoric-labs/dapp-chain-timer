// @ts-check
import { E, Far } from '@endo/far';
import { M } from '@endo/patterns';
import '@agoric/zoe/exported.js';
/**
 * @typedef {{
 * maxCertificates: bigint;
 * }} CertificateTerms
 */

export const meta = {
  customTermsShape: M.splitRecord({
    maxCertificates: M.bigint(),
  }),
};

/**
 * @param {ZCF<CertificateTerms>} zcf
 */
export const start = async (zcf, privateArgs) => {

  // Create storage node for time data
  const timeDataRoot = await E(privateArgs.storageNode).makeChildNode(
    'Time',
  );


  /**
   * Store time data in VStorage
   * @param {object} data
   */
  const storeTimeData = async data => {
    try {
      const myTime = await E(privateArgs.timerService).getCurrentTimestamp();
      
      await E(timeDataRoot).setValue(JSON.stringify(`${myTime.absValue}`));

      return 'Time data published successfully';
    } catch (error) {
      console.error(
        `Error publishing Time data:${error}`,
      );
      return harden(
        new Error(
          `Error publishing Time data:${error}`,
        ),
      );
    }
  };


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

  // Function to write the current timestamp every 5 seconds
  const writeTimestampPeriodically = async () => {
    while (true) {
      const currentTime = await E(
        privateArgs.timerService,
      ).getCurrentTimestamp();
      await storeTimeData({ timestamp: currentTime });
      await E(privateArgs.timerService).wakeAt(5n);
    }
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
