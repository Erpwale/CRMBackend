const SalesOrder = require("../models/SalesOrder");
const { createSalesVoucher } = require("./tallyService");

async function syncPendingOrders() {

    const pending = await SalesOrder.find({
        tallyStatus: "Pending"
    });

    console.log("Pending Orders:", pending.length);

    for (const order of pending) {

        try {

            await createSalesVoucher(order);

            order.tallyStatus = "Synced";
            order.tallySyncedAt = new Date();
            order.tallyError = "";

            await order.save();

            console.log("Synced:", order.orderNo);

        } catch (err) {

            console.log("Still Pending:", order.orderNo);

            order.tallyError = err.message;

            await order.save();
        }

    }

}

module.exports = syncPendingOrders;