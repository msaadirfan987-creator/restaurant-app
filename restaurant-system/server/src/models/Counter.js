import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

export async function nextOrderNumber() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Counter query timeout")), 2500)
    );
    const counterPromise = Counter.findOneAndUpdate(
      { _id: "order" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, maxTimeMS: 2000 }
    ).exec();

    const c = await Promise.race([counterPromise, timeoutPromise]);
    if (c && typeof c.seq === "number") {
      return 1000 + c.seq;
    }
  } catch (err) {
    console.warn("Counter.nextOrderNumber timed out or failed, using fallback:", err.message);
  }
  return Math.floor(1000 + (Date.now() % 9000));
}

export default Counter;
