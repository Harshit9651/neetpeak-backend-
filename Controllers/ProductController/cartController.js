const Cart = require("../../Models/Product/cartModel");
const Product = require("../../Models/Product/productModel");

exports.addToCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "UserId and ProductId are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity: 1 }],
      });
    } else {
     
      const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

      if (itemIndex > -1) {
        
        cart.items[itemIndex].quantity += 1;
      } else {
        
        cart.items.push({ product: productId, quantity: 1 });
      }
    }

   const savedCart =  await cart.save();
   console.log("Cart after addition:", savedCart);

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "UserId is required" });
    }

    const cart = await Cart.findOne({ user: userId })
      .populate("items.product", "title images price oldPrice inStock  productType"); 


    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [] } });
    }

    const formattedItems = cart.items.map((item) => ({
      productId: item.product._id,
      title: item.product.title,
      images: item.product.images,
      price: item.product.price,
      oldPrice: item.product.mrp,
      inStock: item.product.inStock,
      quantity: item.quantity,
       productType: item.product.productType,
    }));

    return res.status(200).json({
      success: true,
      data: { items: formattedItems },
    });
   
  } catch (error) {
    console.error("Error in getCart:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.params;


    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "UserId and ProductId are required" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();

    return res.status(200).json({ success: true, message: "Product removed", data: { items: cart.items } });
  } catch (error) {
    console.error("Error in removeFromCart:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.updateCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || typeof quantity !== "number") {
      return res
        .status(400)
        .json({ success: false, message: "userId, productId, and quantity are required" });
    }

    if (quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be at least 1" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart" });
    }

    cart.items[itemIndex].quantity = quantity;

    await cart.save();

   
    cart = await Cart.findOne({ user: userId }).populate("items.product");

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: { items: cart.items },
    });
  } catch (error) {
    console.error("Error in updateCart:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
