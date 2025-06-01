require('dotenv').config();
console.log('▶️ MP_ACCESS_TOKEN =', process.env.MP_ACCESS_TOKEN);

const express = require('express');
const cors = require('cors');
// Requiere el nuevo SDK de MercadoPago v2
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa el cliente de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

app.post('/create_preference', async (req, res) => {
  try {
    const { items, shipping_cost } = req.body;
    console.log('👀 /create_preference recibio:', req.body);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No hay items en el carrito' });
    }

    // Construye la preferencia
    const preference = {
      items: items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'COP',
      })),
      shipments: {
        cost: shipping_cost || 0,
        mode: 'not_specified',
      },
      external_reference: req.body.order_id // <-- ID de la orden local
    };

    // Usa el nuevo método del SDK v2
    const preferenceClient = new Preference(client);
    try {
      const response = await preferenceClient.create({ body: preference });
      console.log('✅ Preferencia creada:', response);
      res.json({ preferenceId: response.id });
    } catch (sdkError) {
      console.error('❌ Error detallado MercadoPago:', sdkError);
      res.status(500).json({ error: 'Error al crear la preferencia de pago', details: sdkError });
    }
  } catch (error) {
    console.error('❌ Error en /create_preference:', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Error al crear la preferencia de pago' });
  }
});

// Webhook para MercadoPago
app.post('/webhook_mercadopago', express.json(), async (req, res) => {
  try {
    const paymentId = req.body.data && req.body.data.id ? req.body.data.id : null;
    const topic = req.body.type || req.body.topic;

    if (topic === 'payment' && paymentId) {
      // Consultar el pago a MercadoPago
      const { Payment } = require('mercadopago');
      const paymentClient = new Payment(client);
      const result = await paymentClient.get({ id: paymentId });

      if (result.status === 'approved') {
        // Marcar el pedido como pagado en la base de datos (Supabase)
        const orderId = result.external_reference;
        const { supabase } = require('../src/lib/supabase-functions');
        // Actualizar payment_status a 'Pagado', payment_method a 'mercadopago', pero NO cambiar estado
        await supabase.from('orden').update({ payment_status: 'Pagado', payment_method: 'mercadopago' }).eq('id_order', orderId);
        console.log('✅ Pedido pagado y actualizado:', orderId);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error en webhook:', err);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log('Servidor backend escuchando en http://localhost:3000');
});
