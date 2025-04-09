const ordersModel = require("../models/order.model");
const productsModel = require("../models/products.model");

// Create Order
const create = async (req, res) => {
  try {
    const { proID, title, photoURLs, username, firstName, lastName } = req.body;
    const { accID } = req.params;
    // 1️⃣ Validate required fields
    const missingFields = [
      "proID",
      "title",
      "username",
      "firstName",
      "lastName",
    ].filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (!accID) return res.status(400).json({ message: "accID not found!" });

    const product = await productsModel.findById(proID).lean();

    if (
      product.promotionExpiresAt &&
      new Date(product.promotionExpiresAt) > new Date()
    ) {
      return res.status(400).json({
        message: "Product is still under promotion, cannot boost again!",
      });
    }

    const [_, newOrder] = await Promise.all([
      productsModel.updateOne(
        { _id: proID },
        { $set: { boostStatus: "pending" } },
        { timestamps: false }
      ),
      new ordersModel({
        accID,
        proID,
        title,
        photoURLs: photoURLs || [],
        username,
        firstName,
        lastName,
        status: "pending",
        orderAt: new Date(),
      }).save(),
    ]);

    return res.status(200).json({
      message: "Order created successfully",
      // order: newOrder,
      // product: newProduct,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accept", "reject"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Must be 'accept' or 'reject'" });
    }

    const updatedOrder = await ordersModel
      .findByIdAndUpdate(
        id,
        { status, statusUpdatedAt: new Date() },
        { new: true }
      )
      .lean();

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status === "accept") {
      let promotionStart = new Date();
      let promotionEnd = new Date();
      promotionEnd.setMonth(promotionEnd.getMonth() + 1);

      await productsModel.findByIdAndUpdate(
        updatedOrder.proID,
        {
          promotionActivatedAt: promotionStart,
          promotionExpiresAt: promotionEnd,
          boostStatus: "accepted",
        },
        { new: true, timestamps: false }
      );
    } else if (status === "reject") {
      await productsModel.findByIdAndUpdate(
        updatedOrder.proID,
        {
          // promotionActivatedAt: null,
          // promotionExpiresAt: null,
          boostStatus: "rejected",
        },
        { new: true, timestamps: false }
      );
    }

    res
      .status(200)
      .json({ message: "Order updated successfully", order: updatedOrder });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order", error: error.message });
  }
};

// Remove Order
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await ordersModel.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🛠 Clear promotion fields on the related product
    await productsModel.findByIdAndUpdate(
      deletedOrder.proID,
      {
        promotionActivatedAt: null,
        promotionExpiresAt: null,
        boostStatus: "",
      },
      { new: true, timestamps: false }
    );

    res.status(200).json({ message: "Order removed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing order", error: error.message });
  }
};

const getOrderLimit = async (req, res) => {
  try {
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const orders = await ordersModel
      .find()
      .sort({ orderAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use `.lean()` for faster read performance

    const totalCount = await ordersModel.estimatedDocumentCount(); // Faster count method

    if (orders.length === 0) {
      return res.json({ message: "No orders found", orders: [] });
    }

    res.json({
      orders: orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

module.exports = { create, update, remove, getOrderLimit };
