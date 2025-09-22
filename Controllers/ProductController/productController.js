const Product = require("../../Models/Product/productModel");
const Order = require("../../Models/Product/orderModel")
const { uploadToCloudinary } = require("../../Services/cloudinary.service");
const { deleteFromCloudinary } = require("../../Services/cloudinary");
const mongoose = require("mongoose");

exports.addProduct = async (req, res) => {
  try {
    const { title, productType, description, price, mrp, stock } = req.body;
    console.log("Request Body:", req.body);
    if (!title || !productType || !description || !price || !mrp) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (title, productType, description, price, mrp).",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product thumbnail is required.",
      });
    }  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: "Only JPG, PNG, or WEBP image types are allowed.",
          });
        }
    
        if (req.file.size > 5 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: "Image size should be less than 5MB.",
          });
        }
        const result = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          "image"
        );
        const imageUrl = result.secure_url;

   
    const newProduct = new Product({
      title: title.trim(),
      productType,
      description,
      price: Number(price),
      mrp: Number(mrp),
      stock: Number(stock) || 0,
      images: [imageUrl], 
      inStock: Number(stock) > 0,
    });

    const savedProduct = await newProduct.save();
  
console.log("New product created:", savedProduct);
    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: savedProduct,
    });
  } catch (error) {
    console.error("Product creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


exports.listProducts = async (req, res) => {
  try {
    console.log("Fetching products...");    
    const products = await Product.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$productType",
          items: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
    ]);

    const books = products.find((p) => p._id === "Book") || { items: [], count: 0 };
    const onlineProducts = products.find((p) => p._id === "OnlineProduct") || { items: [], count: 0 };

    res.status(200).json({
      success: true,
      totalBooks: books.count,
      totalOnlineProducts: onlineProducts.count,
      books: books.items,
      onlineProducts: onlineProducts.items,
    });
  
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch products",
    });
  }
};
exports.listProductsForPrmocode = async (req, res) => {
  try {
    console.log("Fetching products...");    
    const products = await Product.find({})
    

    res.status(200).json({
      success: true,
      data: products,
    });
  
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch products",
    });
  }
};
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Fetching product by ID:", id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(id);
    console.log("product fetch by id is :",product)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });

  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch product",
    });
  }
};

exports.deleteProduct = async (req, res) => {
    console.log("Delete product request received");
  const productId = req.params.productId;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid productId",
    });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.images && product.images.length > 0) {
      try {
        await Promise.all(
          product.images.map(async (img) => {
            await deleteFromCloudinary(img, "image");
          })
        );
      } catch (imgErr) {
        console.error("Cloudinary image delete failed:", imgErr.message);
      }
    }

   const deletedProduct =  await Product.findByIdAndDelete(productId);
   console.log("Deleted product:", deletedProduct);
    return res.status(200).json({
      success: true,
      message: "Product and images deleted successfully",
      productId,
    });
  } catch (error) {
    console.error("deleteProduct error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateProductStockStatus = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { status } = req.body; 
    console.log("Updating stock status for productId:", productId, "to", status);
    if (!productId || status === undefined) {
      return res.status(400).json({
        success: false,
        message: "productId and status are required.",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { inStock: status },
      { new: true }
    );

    console.log("Updated product:", updatedProduct);

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

  
    return res.status(200).json({
      success: true,
      message: `Product stock status updated to ${
        status ? "In Stock" : "Out of Stock"
      }`,
      data: updatedProduct,
    });
  } catch (error) {
    console.error(" updateProductStockStatus error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update product stock status.",
      error: error.message,
    });
  }
};


exports.updateProduct = async (req, res) => {
  try {
    const productId = req.body.productId || req.params.productId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productId.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const { title, description, price, mrp, stock, productType } = req.body;

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (price) updateData.price = Number(price);
    if (mrp) updateData.mrp = Number(mrp);
    if (stock !== undefined) {
      updateData.stock = Number(stock);
      updateData.inStock = Number(stock) > 0;
    }
    if (productType) updateData.productType = productType;

    if (req.file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG, or WEBP image types are allowed.",
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Image size should be less than 5MB.",
        });
      }

      if (product.images && product.images.length > 0) {
        try {
          await Promise.all(
            product.images.map((img) => deleteFromCloudinary(img, "image"))
          );
        } catch (delErr) {
          console.warn(" Failed to delete old Cloudinary images:", delErr.message);
        }
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        "image"
      );
      updateData.images = [result.secure_url];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );
console.log("Updated product:", updatedProduct);
    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: updatedProduct,
    });
  } catch (error) {
    console.error(" Product update error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    console.log("📦 Fetching all product orders...");

    const orders = await Order.find()
      .populate("userId", "name email mobile") 
      .populate("productId", "title description price mrp images productType") 
      .lean();

    const formattedOrders = orders.map((order) => ({
      orderId: order._id,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

  
      student: {
        id: order.userId?._id,
        name: order.userId?.name || "N/A",
        email: order.userId?.email || "N/A",
        mobile: order.userId?.mobile || "N/A",
      },

 
      product: {
        id: order.productId?._id,
        title: order.productId?.title || "N/A",
        description: order.productId?.description || "N/A",
        price: order.productId?.price || 0,
        mrp: order.productId?.mrp || 0,
        images: order.productId?.images || [],
        productType: order.productId?.productType || "N/A",
      },

   
      shippingAddress: order.shippingAddress || {},

     
      promoCode: order.promoCode || null,
      payment: {
        amount: order.amount / 100, 
        currency: order.currency || "INR",
        razorpay: order.razorpay || {},
      },
    }));
console.log(formattedOrders)
    res.status(200).json({
      success: true,
      totalOrders: formattedOrders.length,
      data: formattedOrders,
    });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
};