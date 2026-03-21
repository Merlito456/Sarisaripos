import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

console.log('Starting server.ts...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Premium Plans Configuration (Mirroring client-side for server logic)
  const PREMIUM_PLANS = {
    premium_lite: { name: 'Premium Lite', priceMonthly: 149, priceYearly: 1490 },
    premium_pro: { name: 'Premium Pro', priceMonthly: 299, priceYearly: 2990 },
    premium_unlimited: { name: 'Premium Unlimited', priceMonthly: 499, priceYearly: 4990 }
  };

  // PayMongo API Endpoint
  app.post('/api/create-paymongo-link', async (req, res) => {
    const { planId } = req.body;
    const plan = PREMIUM_PLANS[planId as keyof typeof PREMIUM_PLANS];

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    try {
      const origin = req.headers.origin || process.env.APP_URL || `http://localhost:${PORT}`;
      const options = {
        method: 'POST',
        url: 'https://api.paymongo.com/v1/checkout_sessions',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
        },
        data: {
          data: {
            attributes: {
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              line_items: [
                {
                  currency: 'PHP',
                  amount: plan.priceMonthly * 100, // PayMongo uses centavos
                  description: `${plan.name} Plan Subscription`,
                  name: `${plan.name} Plan`,
                  quantity: 1
                }
              ],
              payment_method_types: ['gcash', 'paymaya', 'grab_pay', 'card'],
              description: `Sari-Sari POS ${plan.name} Subscription`,
              success_url: `${origin}/premium?success=true`,
              cancel_url: `${origin}/premium?canceled=true`
            }
          }
        }
      };

      const response = await axios.request(options);
      res.json({ checkoutUrl: response.data.data.attributes.checkout_url });
    } catch (error: any) {
      console.error('PayMongo Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to create PayMongo link' });
    }
  });

  // Stripe API Endpoint
  app.post('/api/create-checkout-session', async (req, res) => {
    const { planId, interval } = req.body;
    const plan = PREMIUM_PLANS[planId as keyof typeof PREMIUM_PLANS];

    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const amount = interval === 'month' ? plan.priceMonthly : plan.priceYearly;

    try {
      const origin = req.headers.origin || process.env.APP_URL || `http://localhost:${PORT}`;
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      const stripe = new Stripe(stripeKey);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'php',
              product_data: {
                name: `Sari-Sari POS ${plan.name} (${interval === 'month' ? 'Monthly' : 'Yearly'})`,
                description: `Unlock premium features for your Sari-Sari store`,
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/premium?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/premium?canceled=true`,
      });

      res.json({ sessionId: session.id });
    } catch (error: any) {
      console.error('Stripe Error:', error.message);
      res.status(500).json({ error: 'Failed to create Stripe session' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
