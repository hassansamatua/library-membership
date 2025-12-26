import React from "react";
import Link from "next/link";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Hero Section */}
      <section className="bg-green-700 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to Tanzania Library Association
        </h1>
        <p className="text-lg md:text-2xl mb-6">
          Join our membership and unlock a world of knowledge.
        </p>
        <Link href="/membership">
          <button className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-black transition">
            Become a Member
          </button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white text-black">
        <h2 className="text-3xl font-bold text-center mb-10">
          Membership Benefits
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-6 border border-green-700 rounded-lg text-center hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Access Books</h3>
            <p>Borrow books online and offline with easy tracking.</p>
          </div>
          <div className="p-6 border border-green-700 rounded-lg text-center hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Digital Resources</h3>
            <p>Access e-books, journals, and research materials 24/7.</p>
          </div>
          <div className="p-6 border border-green-700 rounded-lg text-center hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2">Community Events</h3>
            <p>Join workshops, reading clubs, and library events.</p>
          </div>
        </div>
      </section>


      {/* <section className="py-16 px-6 bg-black text-white">
        <h2 className="text-3xl font-bold text-center mb-6">About Us</h2>
        <p className="max-w-4xl mx-auto text-center text-lg">
          Tanzania Library Association (TLA) has been fostering literacy and
          learning for decades. We provide a wide range of resources to our
          members, from physical books to digital research archives. By joining
          our membership, you become part of a thriving community passionate
          about knowledge.
        </p>
      </section> */}

      {/* Call-to-action Section */}
      {/* <section className="py-16 px-6 bg-green-700 text-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Join the Library?
        </h2>
        <p className="mb-6">
          Become a member today and unlock exclusive resources.
        </p>
        <Link href="/membership">
          <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">
            Join Now
          </button>
        </Link> */}
      {/* </section> */}

    
      
    </div>
  );
};

export default Home;
