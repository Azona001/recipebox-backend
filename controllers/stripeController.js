require("dotenv").config();
const stripe = require("stripe")(`${process.env.STRIPE_SECRET_KEY}`);

const createCheckoutSession = async (req, res) => {
  try {
    const user = req.user;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Recipebox Pro",
              description: "Unlimited recipes and premium features",
            },
            unit_amount: 900, //$9 in  cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      client_reference_id: user.userId.toString(), //link payment to user
    });

    res.json({ url: session.url });
  } catch (error) {
    console.log(error);
    res.sttatus(500).json({ success: false, msg: "Server Error" });
  }
};

const handleWebhook = async (req, res) => {
  console.log("🔔 Webhook received!");

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log("Webhook secret exists:", !!webhookSecret); // ← add
  console.log("Signature exists:", !!sig); // ← add

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log("✅ Event constructed:", event.type); // ← add
  } catch (err) {
    console.error("❌ Webhook verification failed:", err.message); // ← add
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("Payment status:", session.payment_status); // ← add
    console.log("Client reference ID:", session.client_reference_id); // ← add

    const userId = session.client_reference_id;

    const { User } = require("../models");
    await User.update({ plan: "pro" }, { where: { userId } });
    console.log(`✅ User ${userId} upgraded to pro!`);
  }

  res.json({ received: true });
};

module.exports = { createCheckoutSession, handleWebhook };
