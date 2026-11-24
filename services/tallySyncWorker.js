
const Ledger = require("../models/Ledger");
const { syncLedgerToTally } = require("../utils/tallySync");

const INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const BATCH_SIZE = 20;
const STALE_SYNC_MINUTES = 30;

let isRunning = false;

const processPendingLedgers = async () => {
  if (isRunning) {
    console.log("Tally worker already running");
    return;
  }

  if (!process.env.TALLY_URL) {
    console.log("TALLY_URL missing. Worker skipped.");
    return;
  }

  isRunning = true;

  console.log("Starting Tally background synchronization...");

  try {
    // Recover records stuck in SYNCING after a crash.
    const staleTime = new Date(
      Date.now() - STALE_SYNC_MINUTES * 60 * 1000
    );

    await Ledger.updateMany(
      {
        tallySyncStatus: "SYNCING",
        tallyLastAttemptAt: { $lt: staleTime }
      },
      {
        $set: {
          tallySyncStatus: "PENDING",
          tallySyncError: "Previous sync interrupted. Retry pending."
        }
      }
    );

    for (let i = 0; i < BATCH_SIZE; i++) {
      // Atomically claim one pending ledger.
      const ledger = await Ledger.findOneAndUpdate(
        {
          tallySyncStatus: "PENDING"
        },
        {
          $set: {
            tallySyncStatus: "SYNCING",
            tallyLastAttemptAt: new Date()
          },
          $inc: {
            tallySyncAttempts: 1
          }
        },
        {
          new: true,
          sort: { createdAt: 1 }
        }
      );

      if (!ledger) {
        console.log("No pending ledgers found");
        break;
      }

      try {
        console.log(
          "Syncing ledger:",
          ledger.companyName,
          ledger._id
        );

        const result = await syncLedgerToTally(ledger);

        const updated = await Ledger.findOneAndUpdate(
          {
            _id: ledger._id,
            tallySyncStatus: "SYNCING"
          },
          {
            $set: {
              tallySyncStatus: "SYNCED",
              tallySyncError: null,
              tallySyncedAt: new Date()
            }
          },
          { new: true }
        );

        if (updated && global.io) {
          global.io.to(ledger.companyId.toString()).emit(
            "ledgerUpdated",
            {
              type: "TALLY_SYNC",
              data: updated
            }
          );
        }

        console.log("Tally sync success:", result.message);

      } catch (error) {
        console.error(
          "Tally sync failed:",
          ledger.companyName,
          error.message
        );

        // Network failures remain PENDING for retry.
        // Import errors are FAILED for manual review.
        const networkError =
          error.code === "ECONNABORTED" ||
          error.code === "ECONNREFUSED" ||
          error.code === "ENOTFOUND" ||
          error.code === "EHOSTUNREACH" ||
          error.code === "ECONNRESET" ||
          !error.response;

        const nextStatus = networkError
          ? "PENDING"
          : "FAILED";

        const updated = await Ledger.findOneAndUpdate(
          {
            _id: ledger._id,
            tallySyncStatus: "SYNCING"
          },
          {
            $set: {
              tallySyncStatus: nextStatus,
              tallySyncError: error.message,
              tallySyncedAt: null
            }
          },
          { new: true }
        );

        if (updated && global.io) {
          global.io.to(ledger.companyId.toString()).emit(
            "ledgerUpdated",
            {
              type: "TALLY_SYNC",
              data: updated
            }
          );
        }

        // Stop this batch if Tally is unavailable.
        if (networkError) {
          console.log(
            "Tally unavailable. Remaining ledgers will stay pending."
          );
          break;
        }
      }
    }

  } catch (error) {
    console.error("Tally worker error:", error.message);

  } finally {
    isRunning = false;
  }
};

const startTallySyncWorker = () => {
  console.log("Tally worker initialized");

  // Initial check one minute after startup.
  setTimeout(() => {
    processPendingLedgers();
  }, 60 * 1000);

  // Repeat every four hours.
  setInterval(() => {
    processPendingLedgers();
  }, INTERVAL);
};

module.exports = {
  startTallySyncWorker,
  processPendingLedgers
};