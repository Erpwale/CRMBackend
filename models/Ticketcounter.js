const ticketcounterSchema = new mongoose.Schema({
  _id: String,
  seq: {
    type: Number,
    default: 1999
  }
});
module.exports = mongoose.model("ticketcounterSchema", ticketcounterSchema);
