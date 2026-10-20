import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
    tableNumber: {
      type: Number,
    },
    seats: {
      type: Number,
      default: 4,
      min: 1,
    },
    capacity: {
      type: Number,
      default: 4,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    qrCode: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

tableSchema.pre("save", function () {
  if (this.number && !this.tableNumber) this.tableNumber = this.number;
  if (this.tableNumber && !this.number) this.number = this.tableNumber;
  if (this.seats && !this.capacity) this.capacity = this.seats;
  if (this.capacity && !this.seats) this.seats = this.capacity;
});

const Table = mongoose.models.Table || mongoose.model("Table", tableSchema);
export default Table;
