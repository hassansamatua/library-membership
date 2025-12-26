// ==============================
// ABOUT PAGE - about.tsx
// ==============================
import React from "react";

export default function AboutTLA() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <header className="bg-green-700 text-white py-6 shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold">About TLA</h1>
          <p className="text-green-100 mt-2">
            Tanzania Library Association
          </p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="border border-green-700 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">
            Who We Are
          </h2>
          <p className="leading-relaxed mb-4">
            The <strong>Tanzania Library Association (TLA)</strong> is a national
            professional organization representing librarians and information
            professionals in Tanzania. It is dedicated to promoting excellence
            in library and information services.
          </p>
          <p className="leading-relaxed mb-4">
            TLA supports the development of libraries in academic institutions,
            public sectors, schools, and research organizations while promoting
            access to knowledge and information literacy.
          </p>
          <p className="leading-relaxed">
            The association also advocates for professional standards,
            continuous learning, and ethical practices in librarianship.
          </p>
        </div>
      </section>

      
    </div>
  );
}

// ==============================
