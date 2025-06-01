import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMsg('');

    // 1. Llama a tu backend para crear el PaymentIntent
    const resp = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* puedes enviar carrito, total, userId... */ }),
    });
    const { clientSecret, error: backendError } = await resp.json();
    if (backendError) {
      setErrorMsg(backendError);
      setLoading(false);
      return;
    }

    // 2. Confirma el pago en Stripe
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) }
    });

    if (result.error) {
      setErrorMsg(result.error.message);
    } else if (result.paymentIntent.status === 'succeeded') {
      // TODO: redirigir o mostrar mensaje de éxito
      window.location.href = '/confirmation';
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl mb-4">Detalles de Pago</h2>
      <div className="mb-4">
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-amber-600 text-white py-2 rounded hover:bg-amber-700 transition"
      >
        {loading ? 'Procesando...' : 'Pagar'}
      </button>
    </form>
  );
};

export default CheckoutForm;
