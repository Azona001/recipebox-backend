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
  console.log("webhook received!");
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  console.log("Event type:", event.type); //
  console.log("Payment status:", event.data.object.payment_status);

  //handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;

    //update user to pro
    const { User } = require("../models");
    await User.update({ plan: "pro" }, { where: { userId } });

    console.log(`User ${userId} upgraded to pro!`);
  }

  res.json({
    received: true,
  });
};

module.exports = { createCheckoutSession, handleWebhook };
