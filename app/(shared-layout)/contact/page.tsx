// CONTACT PAGE - contact.tsx
// ==============================
export default function ContactTLA() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <header className="bg-green-700 text-white py-6 shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold">Contact TLA</h1>
          <p className="text-green-100 mt-2">
            Get in touch with Tanzania Library Association
          </p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
        <div className="border border-green-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-green-700 mb-4">
            Contact Information
          </h2>
          <p className="mb-2"><strong>Email:</strong> info@tla.or.tz</p>
          <p className="mb-2"><strong>Phone:</strong> +255 XXX XXX XXX</p>
          <p className="mb-2"><strong>Location:</strong> Dar es Salaam, Tanzania</p>
          <p className="text-sm mt-4">
            We are open to collaborations, membership inquiries, and general
            communication.
          </p>
        </div>

        <form className="border border-green-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-green-700 mb-4">
            Send a Message
          </h2>

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border border-black rounded-lg px-3 py-2 mb-4"
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full border border-black rounded-lg px-3 py-2 mb-4"
          />

          <textarea
            placeholder="Your Message"
            rows={4}
            className="w-full border border-black rounded-lg px-3 py-2 mb-4"
          ></textarea>

          <button
            type="submit"
            className="bg-green-700 text-white px-6 py-2 rounded-xl hover:bg-green-800"
          >
            Send
          </button>
        </form>
      </section>

      
    </div>
  );
}
