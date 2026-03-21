export async function onRequestPost(context: any) {
  const { request, env } = context;

  // 1. Get Plan Data
  const { planId } = await request.json();
  
  const PREMIUM_PLANS: any = {
    premium_lite: { name: 'Premium Lite', priceMonthly: 149 },
    premium_pro: { name: 'Premium Pro', priceMonthly: 299 },
    premium_unlimited: { name: 'Premium Unlimited', priceMonthly: 499 }
  };

  const plan = PREMIUM_PLANS[planId];
  if (!plan) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Check API Key
  const paymongoKey = env.PAYMONGO_SECRET_KEY;
  if (!paymongoKey) {
    return new Response(JSON.stringify({ error: 'PayMongo secret key is not configured in Cloudflare environment variables.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const origin = url.origin;

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'authorization': `Basic ${btoa(paymongoKey + ':')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: [
              {
                currency: 'PHP',
                amount: plan.priceMonthly * 100,
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
      })
    });

    const data: any = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.errors?.[0]?.detail || 'PayMongo API Error';
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ checkoutUrl: data.data.attributes.checkout_url }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
