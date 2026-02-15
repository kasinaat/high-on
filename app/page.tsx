import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-b from-white to-gray-100 text-center py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">High On</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Single-serve <strong>Vanilla Ice Cream Cups</strong> designed for events, gatherings, and large groups.
            A simple, safe dessert that works for everyone.
          </p>
          <Link
            href="/store"
            className="inline-block bg-black text-white px-7 py-3.5 rounded font-bold hover:bg-gray-800 transition-colors"
          >
            Order Now
          </Link>
        </div>
      </header>

      {/* Why Vanilla Cups */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold mb-10 text-center">Why Vanilla Cups?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="border border-gray-200 bg-white shadow-sm p-7 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Universally Liked</h3>
            <p className="text-gray-700">Vanilla is the safest flavour choice for mixed-age and diverse audiences.</p>
          </div>
          <div className="border border-gray-200 bg-white shadow-sm p-7 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Clean Ingredients</h3>
            <p className="text-gray-700">Made with real milk and natural vanilla. No artificial flavours or stabilisers.</p>
          </div>
          <div className="border border-gray-200 bg-white shadow-sm p-7 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Event-Friendly Format</h3>
            <p className="text-gray-700">Sealed, hygienic cup format that is easy to distribute and serve.</p>
          </div>
          <div className="border border-gray-200 bg-white shadow-sm p-7 rounded-lg">
            <h3 className="text-xl font-bold mb-3">No Taste Risk</h3>
            <p className="text-gray-700">Chosen by hosts who want zero complaints and guaranteed guest satisfaction.</p>
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="bg-gradient-to-b from-gray-50 to-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl font-bold mb-8 text-center">Perfect For</h2>
          <div className="max-w-2xl mx-auto">
            <ul className="space-y-3 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-2xl">🏢</span>
                <span>Corporate events & office celebrations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <span>Brand activations & product launches</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">💍</span>
                <span>Weddings & private functions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🛍️</span>
                <span>Mall events & community gatherings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🎓</span>
                <span>School & college events</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What We Handle */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-bold mb-10 text-center">What We Handle</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-gray-200 bg-white shadow-sm p-7 rounded-lg">
            <h3 className="text-xl font-bold mb-3">End-to-End Supply</h3>
            <p className="text-gray-700">Production, cold storage, and transport handled by our team.</p>
          </div>
          <div className="border border-gray-200 bg-white shadow-sm p-7 rounded-lg">
            <h3 className="text-xl font-bold mb-3">On-Time Delivery</h3>
            <p className="text-gray-700">Reliable service aligned with your event schedule.</p>
          </div>
          <div className="border border-gray-200 bg-white shadow-sm p-7 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Direct Billing</h3>
            <p className="text-gray-700">Clear pricing, GST-compliant invoicing, and transparent terms.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gradient-to-b from-gray-50 to-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-3xl font-bold mb-6">Let's Keep It Simple</h2>
          <p className="text-lg mb-4">
            If you're looking for a no-risk dessert option that works for everyone, our vanilla cups are a perfect fit.
          </p>
          <p className="text-lg font-semibold mb-6">Contact us for pricing, samples, or availability:</p>
          <div className="space-y-3 text-lg">
            <p className="flex items-center justify-center gap-3">
              <span>📞</span>
              <span>Phone: <a href="tel:+919840617192" className="text-blue-600 hover:underline">+91-9840617192</a></span>
            </p>
            <p className="flex items-center justify-center gap-3">
              <span>📧</span>
              <span>Email: <a href="mailto:order@sobermonks.com" className="text-blue-600 hover:underline">order@sobermonks.com</a></span>
            </p>
            <p className="flex items-center justify-center gap-3">
              <span>📍</span>
              <span>Chennai, India</span>
            </p>
          </div>
          <div className="mt-10">
            <Link
              href="/store"
              className="inline-block bg-black text-white px-8 py-4 rounded font-bold hover:bg-gray-800 transition-colors text-lg"
            >
              Start Ordering
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-12 px-5">
        <p className="mb-2">© High on. All rights reserved.</p>
        <p className="text-gray-400">Clean. Simple. Crowd-approved vanilla.</p>
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <Link href="/admin" className="hover:underline">Admin Login</Link>
          <Link href="/delivery" className="hover:underline">Delivery Partner</Link>
        </div>
      </footer>
    </div>
  );
}
