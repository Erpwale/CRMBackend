const express = require("express");
const router = express.Router();

const SalesOrder = require("../models/SalesOrder");
const { createSalesVoucher } = require("../services/tallyService");

router.post("/sync", async (req, res) => {

    const pendingOrders = await SalesOrder.find({
        tallyStatus: "Pending"
    });

    let synced = 0;

    for (const order of pendingOrders) {

        try {

            await createSalesVoucher(order);

            order.tallyStatus = "Synced";
            order.tallySyncedAt = new Date();
            order.tallyError = "";

            await order.save();

            synced++;

        } catch (err) {

            order.tallyError = err.message;

            await order.save();
        }

    }

    res.json({

        success: true,

        total: pendingOrders.length,

        synced

    });

});

module.exports = router;