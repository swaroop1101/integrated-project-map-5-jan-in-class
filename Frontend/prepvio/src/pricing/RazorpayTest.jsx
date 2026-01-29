import axios from "axios";

axios.defaults.withCredentials = true;

function RazorpayTest() {
  async function handlePaymentWithPlan(planId) {
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/payment/create-order",
        { planId }
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Prepvio AI",
        description: `${data.planName} - ${data.interviews} Interviews`,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              "http://localhost:5000/api/payment/verify",
              response
            );

            if (verifyRes.data.success) {
              alert(
                `✅ Payment verified!\n` +
                `Plan: ${verifyRes.data.subscription.planName}\n` +
                `🎤 Interviews Remaining: ${verifyRes.data.interviews.remaining}`
              );
            }
          } catch (err) {
            console.error(err);
            alert("Verification failed");
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
        },
        theme: {
          color: "#1A1A1A",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Razorpay Test</h2>

      <button onClick={() => handlePaymentWithPlan("monthly")}>
        Pay ₹79 (2 Interviews)
      </button>

      <button onClick={() => handlePaymentWithPlan("premium")}>
        Pay ₹120 (4 Interviews)
      </button>

      <button onClick={() => handlePaymentWithPlan("yearly")}>
        Pay ₹999 (50 Interviews)
      </button>

      <button onClick={() => handlePaymentWithPlan("lifetime")}>
        Pay ₹2999 (Unlimited Interviews)
      </button>
    </div>
  );
}

export default RazorpayTest;
