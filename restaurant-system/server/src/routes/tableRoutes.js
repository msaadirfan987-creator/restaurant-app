import { Router } from "express";
import Table from "../models/Table.js";
import { authenticateToken, requireAdmin, verifyCsrf } from "../middleware/auth.js";

const router = Router();

// GET /api/tables — Accessible by authenticated staff (cashier, waiter, admin)
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const tables = await Table.find({ isActive: true }).sort({ number: 1 });
    return res.status(200).json({ tables, items: tables });
  } catch (err) {
    next(err);
  }
});

// POST /api/tables — Admin only create table
router.post("/", authenticateToken, requireAdmin, verifyCsrf, async (req, res, next) => {
  try {
    const number = Number(req.body.number || req.body.tableNumber);
    const seats = Number(req.body.seats || req.body.capacity) || 4;

    if (isNaN(number) || number < 1) {
      return res.status(400).json({ message: "Valid positive table number is required." });
    }

    const existing = await Table.findOne({ number });
    if (existing) {
      return res.status(409).json({ message: `Table #${number} already exists.` });
    }

    const table = await Table.create({
      number,
      tableNumber: number,
      seats,
      capacity: seats,
      status: "available",
      isActive: true,
    });

    return res.status(201).json({ message: "Table created.", table });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tables/:id/status — Toggle status or active
router.patch("/:id/status", authenticateToken, verifyCsrf, async (req, res, next) => {
  try {
    const { status, isActive } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: "Table not found." });

    if (status) table.status = status;
    if (typeof isActive === "boolean") table.isActive = isActive;
    await table.save();

    return res.status(200).json({ message: "Table updated.", table });
  } catch (err) {
    next(err);
  }
});

export default router;
