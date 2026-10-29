
require("dotenv").config();
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  {
    name: "T-shirt with Tape Details",
    price: 120,
    image: "/images/product1.png",
    rating: 4.5,
    stars: 5,
    category: "tshirt",
  },
  {
    name: "Black Slim Fit T-shirt",
    price: 90,
    image: "/images/product2.png",
    rating: 4.2,
    stars: 4,
    category: "tshirt",
  },
  {
    name: "Denim Blue Jeans",
    price: 150,
    image: "/images/product03.png",
    rating: 4.7,
    stars: 5,
    category: "pants",
  },
  {
    name: "Casual Cargo Pants",
    price: 180,
    image: "/images/product04.png",
    rating: 4.3,
    stars: 4,
    category: "pants",
  },
  {
    name: "Vertical striped shirt",
    price: 250,
    image: "/images/product05.png",
    rating: 4.7,
    stars: 4,
    category: "shirts",
  },
  {
    name: "Courage graphic t-shirt",
    price: 450,
    image: "/images/product06.png",
    rating: 4.3,
    stars: 4,
    category: "shirts",
  },
  {
    name: "loose fit Bermuda shorts",
    price: 50,
    image: "/images/product07.png",
    rating: 4.9,
    stars: 4,
    category: "pants",
  },
  {
    name: "Fadded skinny jeans",
    price: 100,
    image: "/images/product08.png",
    rating: 4.8,
    stars: 4,
    category: "pants",
  },
  {
    name: "Polo with Contrast Trim",
    price: 100,
    image: "/images/product9.png",
    rating: 4.4,
    stars: 4,
    category: "shirts",
  },
  {
    name: "Gradient graphics T-Shirts",
    price: 150,
    image: "/images/product10.png",
    rating: 4.4,
    stars: 4,
    category: "shirts",
  },
  {
    name: "Polo with Tipping details",
    price: 185,
    image: "/images/product11.png",
    rating: 4.4,
    stars: 4,
    category: "shirts",
  },
  {
    name: "Black Striped T-Shirts",
    price: 185,
    image: "/images/product12.png",
    rating: 4.4,
    stars: 4,
    category: "shirts",
  },
];

async function seedProducts() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI .env file mein nahi mili. Apne env variable ka naam check karo."
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    for (const item of products) {
      await Product.updateOne(
        { name: item.name },
        {
          $set: {
            ...item,
            stock: 10,
          },
        },
        { upsert: true }
      );
    }

    console.log("12 clothing products successfully added/updated!");
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
