// Simple test to verify PDF generation works
const { generateMembershipCardPDFNative } = require('./lib/membershipCardPDFAlternative.ts');

// Test data
const testData = {
  userName: "Test User",
  membershipNumber: "TLA2671234",
  membershipType: "Professional",
  userPhone: "+255 712 345 678"
};

console.log('Testing PDF generation...');
console.log('Test data:', testData);

// This would need to be run in a browser environment
console.log('PDF generation test requires browser environment.');
