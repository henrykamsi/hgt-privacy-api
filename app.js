import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyDordk0nIVI3H4Ev0JW8fH2Pe_WyfuDtMo",
    authDomain: "privacy-policy-b6980.firebaseapp.com",
    projectId: "privacy-policy-b6980",
    storageBucket: "privacy-policy-b6980.firebasestorage.app",
    messagingSenderId: "136019833914",
    appId: "1:136019833914:web:a0326a7b93d30dd9f9f103"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 1. BULLETPROOF NAVIGATION LOGIC
// ==========================================
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Reset Nav colors
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('text-blue-500');
        btn.classList.add('text-slate-400');
    });
    // Highlight active nav item
    const navMap = {'create-tab':'nav-create', 'policies-tab':'nav-policies', 'api-tab':'nav-api', 'me-tab':'nav-me'};
    document.getElementById(navMap[tabId]).classList.add('text-blue-500');
    document.getElementById(navMap[tabId]).classList.remove('text-slate-400');
}

// Attach Event Listeners (This fixes the "not defined" error)
document.getElementById('nav-create').addEventListener('click', () => switchTab('create-tab'));
document.getElementById('nav-policies').addEventListener('click', () => switchTab('policies-tab'));
document.getElementById('nav-api').addEventListener('click', () => switchTab('api-tab'));
document.getElementById('nav-me').addEventListener('click', () => switchTab('me-tab'));

// ==========================================
// 2. INDUSTRIAL-GRADE POLICY GENERATOR
// ==========================================
document.getElementById('btn-generate').addEventListener('click', async () => {
    const q1 = document.getElementById('q1').value || 'Company Name';
    const q2 = document.getElementById('q2').value || 'Website URL';
    const q3 = document.getElementById('q3').value || 'Support Email';
    
    // Fetch all select values
    const getVal = (id) => document.getElementById(id).value;

    const date = new Date().toLocaleDateString();

    // The Long-Form Document Builder
    const documentHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h1 style="font-size: 24px; font-weight: bold;">Privacy Policy for ${q1}</h1>
            <p><strong>Effective Date:</strong> ${date}</p>
            
            <h2 style="font-size: 20px; margin-top: 20px;">1. Introduction</h2>
            <p>Welcome to ${q1} ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at ${q3}. When you visit our website ${q2}, and more generally, use any of our services, we appreciate that you are trusting us with your personal information.</p>

            <h2 style="font-size: 20px; margin-top: 20px;">2. Information We Collect</h2>
            <p>${getVal('q4') === 'yes' ? 'We collect personal information that you voluntarily provide to us when you register on the services, express an interest in obtaining information about us or our products, or otherwise contact us. The personal information that we collect depends on the context of your interactions with us and the services.' : 'We do not actively collect personal information such as names or emails unless you explicitly provide them for support queries.'}</p>
            <p>${getVal('q5') === 'yes' ? 'We automatically collect certain information when you visit, use or navigate the services. This information does not reveal your specific identity but may include device and usage information, such as your IP address, browser, and device characteristics.' : ''}</p>

            <h2 style="font-size: 20px; margin-top: 20px;">3. Cookies and Tracking</h2>
            <p>${getVal('q6') === 'yes' ? 'We may use cookies and similar tracking technologies to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.' : 'We do not use cookies or tracking technologies on our platform.'}</p>
            <p>${getVal('q7') === 'yes' ? 'We use Google Analytics to help us understand how our customers use the site. You can read more about how Google uses your Personal Information here: https://www.google.com/intl/en/policies/privacy/.' : ''}</p>

            <h2 style="font-size: 20px; margin-top: 20px;">4. Advertising and Monetization</h2>
            <p>${getVal('q8') === 'yes' ? 'We use Google AdSense Advertising on our website. Google, as a third-party vendor, uses cookies to serve ads on our site. Users may opt-out of the use of the DART cookie by visiting the Google Ad and Content Network privacy policy.' : 'We do not currently show third-party advertisements on our platform.'}</p>

            <h2 style="font-size: 20px; margin-top: 20px;">5. Sharing of Your Information</h2>
            <p>${getVal('q10') === 'no' ? 'We will not share or sell your information with third parties for their promotional purposes.' : 'We may share your information with trusted third-party partners to facilitate our services.'} ${getVal('q9') === 'yes' ? 'We use third-party services for payment processing. We will not store or collect your payment card details. That information is provided directly to our third-party payment processors.' : ''}</p>

            <h2 style="font-size: 20px; margin-top: 20px;">6. Children's Privacy</h2>
            <p>${getVal('q12') === 'no' ? 'We do not knowingly solicit data from or market to children under 13 years of age. By using the services, you represent that you are at least 13 or that you are the parent or guardian of such a minor.' : 'Our services are directed to users of all ages, and we take special precautions to protect the privacy of children.'}</p>

            <h2 style="font-size: 20px; margin-top: 20px;">7. Your Privacy Rights (GDPR/CCPA)</h2>
            <p>${getVal('q14') === 'yes' ? 'In some regions (like the EEA, UK, and California), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure, and (iii) to restrict the processing of your personal information. To make such a request, please contact us at ' + q3 + '.' : 'You may review, change, or terminate your account at any time by contacting us.'}</p>

            <h2 style="font-size: 20px; margin-top: 20px;">8. Data Retention</h2>
            <p>${getVal('q15') === 'standard' ? 'We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law.' : 'We keep your information until you request an account deletion, at which point all associated data is permanently removed.'}</p>
        </div>
    `;

    // Save to Firestore
    try {
        await addDoc(collection(db, "policies"), {
            companyName: q1,
            htmlContent: documentHtml,
            createdAt: new Date()
        });
        alert("Success! Your professional policy has been generated and saved to the database.");
        // Switch to policies tab automatically
        switchTab('policies-tab');
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Error saving policy. Check the console.");
    }
});
