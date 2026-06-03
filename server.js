// server.js - Complete API with API key generation, JSON storage, and policy generation

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// File to store API keys and policies
const DATA_FILE = path.join(__dirname, 'data.json');

// Load existing data or create new
let data = { apiKeys: {}, policies: [] };
if (fs.existsSync(DATA_FILE)) {
    try {
        data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch(e) { console.log('New file created'); }
}

// Save function
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============ API KEY MANAGEMENT ============

// 1. Generate a new API key (for your website users)
app.post('/api/generate-key', (req, res) => {
    const { email, keyName } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    const newKey = `hgt_live_${crypto.randomBytes(32).toString('hex')}`;
    
    data.apiKeys[newKey] = {
        email: email,
        key_name: keyName || 'My API Key',
        created_at: new Date().toISOString(),
        last_used: null,
        total_requests: 0,
        is_active: true
    };
    
    saveData();
    
    res.json({
        success: true,
        api_key: newKey,
        message: 'Copy this key. You will not see it again.'
    });
});

// 2. Get all keys for a user (to display in their dashboard)
app.post('/api/my-keys', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email required' });
    }
    
    const userKeys = [];
    for (const [key, value] of Object.entries(data.apiKeys)) {
        if (value.email === email) {
            userKeys.push({
                key_preview: key.substring(0, 20) + '...',
                full_key: key,
                key_name: value.key_name,
                created_at: value.created_at,
                total_requests: value.total_requests,
                is_active: value.is_active
            });
        }
    }
    
    res.json({ success: true, keys: userKeys });
});

// 3. Revoke an API key
app.post('/api/revoke-key', (req, res) => {
    const { api_key, email } = req.body;
    
    if (!data.apiKeys[api_key]) {
        return res.status(404).json({ success: false, error: 'Key not found' });
    }
    
    if (data.apiKeys[api_key].email !== email) {
        return res.status(403).json({ success: false, error: 'Not your key' });
    }
    
    delete data.apiKeys[api_key];
    saveData();
    
    res.json({ success: true, message: 'Key revoked' });
});

// ============ PRIVACY POLICY GENERATION ============

// 4. Generate privacy policy (for your frontend AND other apps)
app.post('/api/generate', (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const { app_name, website_url, contact_email, answers, optional_notes, is_internal } = req.body;
    
    // Allow internal requests (from your own frontend) without API key
    const isInternal = is_internal === true;
    
    // Validate API key for external requests
    if (!isInternal) {
        if (!apiKey) {
            return res.status(401).json({ success: false, error: 'API key required. Get one from /api/generate-key' });
        }
        
        if (!data.apiKeys[apiKey] || !data.apiKeys[apiKey].is_active) {
            return res.status(401).json({ success: false, error: 'Invalid or inactive API key' });
        }
        
        // Update usage stats
        data.apiKeys[apiKey].last_used = new Date().toISOString();
        data.apiKeys[apiKey].total_requests++;
        saveData();
    }
    
    // Validate required fields
    if (!app_name || !contact_email) {
        return res.status(400).json({ success: false, error: 'app_name and contact_email required' });
    }
    
    // Generate unique policy ID
    const policyId = `privacy_policy_${Date.now()}_hgt`;
    const policyLink = `https://hgt.com/policy/${policyId}`;
    
    // Generate the full privacy policy text
    const policyText = generateFullPolicyText(app_name, website_url, contact_email, answers, optional_notes);
    
    // Save policy (optional - you can remove this if you don't want to store)
    data.policies.push({
        id: policyId,
        app_name: app_name,
        email: contact_email,
        generated_at: new Date().toISOString(),
        policy_length: policyText.length
    });
    saveData();
    
    res.json({
        success: true,
        policy_id: policyId,
        policy_link: policyLink,
        policy_text: policyText,
        message: 'Privacy policy generated successfully'
    });
});

// 5. Get policy by ID
app.get('/api/policy/:policyId', (req, res) => {
    const policy = data.policies.find(p => p.id === req.params.policyId);
    if (policy) {
        res.json({ success: true, policy });
    } else {
        res.status(404).json({ success: false, error: 'Policy not found' });
    }
});

// ============ HELPER FUNCTION: GENERATE DETAILED POLICY ============

function generateFullPolicyText(appName, websiteUrl, contactEmail, answers, optionalNotes) {
    let text = `PRIVACY POLICY FOR ${appName.toUpperCase()}\n\n`;
    text += `Effective Date: ${new Date().toLocaleDateString()}\n`;
    text += `Website: ${websiteUrl || 'Not provided'}\n`;
    text += `Contact Email: ${contactEmail}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // SECTION 1: Information Collection
    text += `1. INFORMATION WE COLLECT\n\n`;
    if (answers?.collects_personal_data === 'yes') {
        const dataTypes = answers?.data_types || ['name', 'email', 'IP address'];
        text += `${appName} collects personal information to provide, maintain, and improve our services. `;
        text += `When you create an account, use our features, or interact with our platform, we may collect information such as: ${dataTypes.join(', ')}. `;
        text += `This information is collected voluntarily when you sign up, fill out forms, or communicate with us. `;
        text += `We also collect usage data automatically, including device information, browser type, and pages visited. `;
        text += `Location data is only collected if you grant permission through your device settings. `;
        text += `We do not collect sensitive personal information such as social security numbers or financial account details unless explicitly provided for payment processing. `;
        text += `All data collection is done in compliance with applicable privacy laws. `;
        text += `You have the right to refuse providing certain information, but this may limit your ability to use some features. `;
        text += `We retain your data only as long as necessary to fulfill the purposes outlined in this policy. `;
        text += `After you delete your account, we may retain certain information for legal or analytical purposes. `;
        text += `We take reasonable steps to ensure that the data we collect is accurate and up to date. `;
        text += `You can review and update your personal information at any time through your account settings. `;
        text += `If you believe any information we hold is incorrect, please contact us immediately.\n\n`;
    } else {
        text += `${appName} does NOT collect any personal information from its users. `;
        text += `We believe in minimal data collection and respect your privacy. `;
        text += `You can use our services without providing your name, email address, or any identifying information. `;
        text += `We do not track your location, device ID, or browsing activity. `;
        text += `The only information we may collect is non-personal, anonymous usage data that cannot be used to identify you. `;
        text += `We do not use cookies for tracking purposes. `;
        text += `If you choose to contact us directly, we will only use your email address to respond to your inquiry. `;
        text += `We do not share, sell, or transfer any personal information because we simply do not collect it. `;
        text += `Our services function fully without requiring any personal data from you. `;
        text += `If this changes in the future, we will update this policy and obtain your consent.\n\n`;
    }
    
    // SECTION 2: Cookies
    text += `2. COOKIES AND TRACKING TECHNOLOGIES\n\n`;
    if (answers?.uses_cookies === 'yes') {
        text += `${appName} uses cookies and similar tracking technologies to enhance your browsing experience. `;
        text += `Cookies are small text files stored on your device that help us remember your preferences, login status, and activity on our platform. `;
        text += `We use session cookies, which expire when you close your browser, and persistent cookies, which remain until you delete them. `;
        text += `Tracking technologies such as web beacons and pixels help us analyze user behavior and improve our services. `;
        text += `You can control cookie settings through your browser preferences. `;
        text += `Most browsers accept cookies by default, but you can choose to block or delete them. `;
        text += `However, disabling cookies may affect the functionality of ${appName}. `;
        text += `We also use first-party cookies (set by us) and third-party cookies (set by external services we use). `;
        text += `These cookies do not store sensitive personal information like credit card details. `;
        text += `We may also use fingerprinting technologies in limited cases to prevent fraud and enhance security. `;
        text += `By continuing to use ${appName}, you consent to our use of cookies and tracking technologies as described. `;
        text += `You have the right to withdraw your consent at any time by clearing your cookies or adjusting your browser settings.\n\n`;
    } else {
        text += `${appName} does NOT use cookies or any tracking technologies. `;
        text += `We believe in a cookie-free experience that respects your privacy. `;
        text += `No tracking pixels, web beacons, or fingerprinting technologies are used on our platform. `;
        text += `You can use our services without any concerns about being tracked across websites.\n\n`;
    }
    
    // SECTION 3: Google Analytics
    text += `3. ANALYTICS SERVICES\n\n`;
    if (answers?.uses_analytics === 'yes') {
        text += `${appName} uses Google Analytics to collect information about how users interact with our platform. `;
        text += `Google Analytics uses cookies to gather data such as the number of visitors, page views, and user behavior patterns. `;
        text += `This information is aggregated and anonymized to the extent possible. `;
        text += `We use this data to analyze trends, administer the platform, and improve our content and services. `;
        text += `Google Analytics may collect your IP address, but we have enabled IP anonymization to protect your privacy. `;
        text += `Google may transfer and store this information on servers located outside your country. `;
        text += `You can opt out of Google Analytics tracking by installing the Google Analytics Opt-out Browser Add-on. `;
        text += `We do not combine Google Analytics data with personally identifiable information unless explicitly stated.\n\n`;
    } else {
        text += `${appName} does NOT use Google Analytics or any similar analytics services. `;
        text += `We do not track, analyze, or monitor user behavior through third-party analytics tools. `;
        text += `Your usage of our platform remains completely anonymous from an analytics perspective.\n\n`;
    }
    
    // SECTION 4: Advertising (AdSense)
    text += `4. ADVERTISING\n\n`;
    if (answers?.uses_adsense === 'yes') {
        text += `${appName} uses Google AdSense to display relevant ads to our users. `;
        text += `Google AdSense uses cookies and advertising identifiers to serve ads based on your prior visits to our website and other sites on the internet. `;
        text += `These cookies allow Google and its partners to show personalized ads to you based on your browsing history and interests. `;
        text += `AdSense may collect your IP address, browser type, device information, and interaction with ads. `;
        text += `You have the option to opt out of personalized advertising by visiting Google's Ad Settings. `;
        text += `You can also opt out of third-party vendor cookies by visiting the Network Advertising Initiative opt-out page. `;
        text += `Children under 13 will not see personalized ads; only contextual ads may appear. `;
        text += `You can reset your advertising identifier on your mobile device at any time.\n\n`;
    } else {
        text += `${appName} does NOT display any advertisements. `;
        text += `We do not use Google AdSense or any other advertising networks. `;
        text += `Your experience on our platform is completely ad-free, and no advertising data is collected about you.\n\n`;
    }
    
    // SECTION 5: Third-party services
    text += `5. THIRD-PARTY SERVICES\n\n`;
    if (answers?.uses_third_party === 'yes' && answers?.third_party_services?.length > 0) {
        const services = answers.third_party_services.join(', ');
        text += `${appName} integrates with the following third-party services: ${services}. `;
        text += `These services may collect, process, or store your data according to their own privacy policies. `;
        text += `We choose third-party providers that demonstrate compliance with applicable privacy laws. `;
        text += `Data shared with third parties is limited to what is necessary for the specific feature or transaction. `;
        text += `We are not responsible for the privacy practices of these third-party services. `;
        text += `We encourage you to review their privacy policies before using their services. `;
        text += `If a third-party service experiences a data breach, we will notify affected users as required by law. `;
        text += `You have the right to request a list of all third-party services we use.\n\n`;
    } else {
        text += `${appName} does NOT use any third-party services or API integrations. `;
        text += `All functionality is self-contained and no external services process your data. `;
        text += `This means your information never leaves our secure environment unless you explicitly initiate a transfer.\n\n`;
    }
    
    // SECTION 6: Data sharing
    text += `6. DATA SHARING WITH THIRD PARTIES\n\n`;
    if (answers?.shares_for_marketing === 'yes') {
        text += `${appName} may share certain non-personal or aggregated data with third parties for marketing and advertising purposes. `;
        text += `This includes sharing anonymized usage statistics, demographic information, and user preferences to help advertisers reach their target audiences. `;
        text += `We do not sell your personal information to third parties without your explicit consent. `;
        text += `You have the right to opt out of marketing data sharing at any time by contacting us. `;
        text += `We do not share sensitive personal information for marketing purposes. `;
        text += `Third-party marketing partners are contractually obligated to protect your data and use it only for the purposes we specify.\n\n`;
    } else {
        text += `${appName} does NOT share your personal data with third parties for marketing purposes. `;
        text += `Your information is never sold, rented, or shared with marketers. `;
        text += `We believe in protecting your data from commercial exploitation.\n\n`;
    }
    
    // SECTION 7: Email marketing
    text += `7. EMAIL MARKETING\n\n`;
    if (answers?.uses_email_marketing === 'yes') {
        text += `${appName} may send you promotional emails, newsletters, and marketing communications if you have provided your email address and opted in. `;
        text += `We use third-party email marketing platforms to manage our email campaigns. `;
        text += `These platforms may collect information about whether you open our emails, click on links, or unsubscribe. `;
        text += `You can unsubscribe from marketing emails at any time by clicking the "unsubscribe" link at the bottom of any marketing email. `;
        text += `Even if you unsubscribe, we may still send you transactional or service-related emails. `;
        text += `We do not sell or rent your email address to third parties for their own marketing purposes.\n\n`;
    } else {
        text += `${appName} does NOT send marketing emails. `;
        text += `We may only contact you for essential service-related communications such as account verification or security alerts. `;
        text += `You will never receive promotional emails from us.\n\n`;
    }
    
    // SECTION 8: User rights
    text += `8. YOUR PRIVACY RIGHTS\n\n`;
    text += `You have the right to access, correct, or delete your personal information that we hold. `;
    if (answers?.allows_deletion === 'yes') {
        text += `To request access to your data, please email us at ${contactEmail}. We will respond within 30 days. `;
        text += `You have the right to request deletion of your personal data, also known as the "right to be forgotten." `;
        text += `Upon receiving a deletion request, we will delete your data from our active systems. `;
        text += `You have the right to data portability, meaning you can request a copy of your data in a structured format. `;
        text += `We will never charge a fee for exercising your rights unless the request is excessive or repetitive.\n\n`;
    } else {
        text += `Please contact us at ${contactEmail} for any questions regarding your data. `;
        text += `While we do not currently offer automated deletion, we will address any privacy concerns manually.\n\n`;
    }
    
    // SECTION 9: Children's privacy
    text += `9. CHILDREN'S PRIVACY\n\n`;
    if (answers?.targets_children === 'yes') {
        text += `${appName} is intended for use by children under parental supervision. `;
        text += `We comply with the Children's Online Privacy Protection Act (COPPA) and similar laws. `;
        text += `We obtain verifiable parental consent before collecting any personal information from children under 13. `;
        text += `Parents have the right to review any personal information collected from their child, request deletion, and refuse further collection. `;
        text += `If you are a parent or guardian and believe your child has provided us with information without your consent, please contact us immediately. `;
        text += `We do not use children's data for profiling or automated decision-making.\n\n`;
    } else {
        text += `${appName} is not intended for children under the age of 13. `;
        text += `We do not knowingly collect personal information from children under 13. `;
        text += `If you are a parent or guardian and believe that your child under 13 has provided us with personal information, please contact us immediately. `;
        text += `Upon verification, we will take steps to delete that information from our systems.\n\n`;
    }
    
    // SECTION 10: GDPR (if applicable)
    if (answers?.user_location === 'worldwide' || answers?.user_location === 'eu') {
        text += `10. GDPR COMPLIANCE FOR EUROPEAN UNION USERS\n\n`;
        text += `If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR). `;
        text += `Our legal bases for processing your data include your consent, the performance of a contract, compliance with legal obligations, and our legitimate interests. `;
        text += `You have the right to withdraw your consent at any time. `;
        text += `Under GDPR, you have the right to access, rectify, erase, restrict processing, data portability, and object to processing. `;
        text += `To exercise these rights, contact us at ${contactEmail}. `;
        text += `We will respond within one month. `;
        text += `You have the right to lodge a complaint with your local supervisory authority. `;
        text += `We have appointed a Data Protection Officer (DPO) who can be reached at ${contactEmail}.\n\n`;
    }
    
    // SECTION 11: CCPA (if applicable)
    if (answers?.user_location === 'worldwide' || answers?.user_location === 'us') {
        text += `11. CCPA COMPLIANCE FOR CALIFORNIA RESIDENTS\n\n`;
        text += `If you are a resident of California, you have specific rights under the California Consumer Privacy Act (CCPA). `;
        text += `You have the right to know what personal information we collect, use, disclose, and sell. `;
        text += `You have the right to request deletion of your personal information. `;
        text += `You have the right to opt out of the sale of your personal information. `;
        text += `We do not sell your personal information as defined by the CCPA. `;
        text += `You have the right to non-discrimination for exercising your CCPA rights. `;
        text += `To make a verifiable request, please contact us at ${contactEmail}. `;
        text += `We will verify your identity before responding. `;
        text += `We will respond to verifiable requests within 45 days.\n\n`;
    }
    
    // SECTION 12: Optional notes from user
    if (optionalNotes && optionalNotes.trim() !== '') {
        text += `12. ADDITIONAL INFORMATION PROVIDED BY USER\n\n`;
        text += `${optionalNotes}\n\n`;
    }
    
    // SECTION 13: Contact
    text += `13. CONTACT INFORMATION\n\n`;
    text += `If you have any questions, concerns, or complaints about this Privacy Policy or our data practices, please contact us at:\n\n`;
    text += `${appName}\n`;
    text += `Email: ${contactEmail}\n`;
    if (websiteUrl) text += `Website: ${websiteUrl}\n`;
    text += `\n`;
    
    // BRANDING - THIS APPEARS ON EVERY POLICY
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `THIS PRIVACY POLICY IS GENERATED UNDER THE BRAND OF HENRY GLOBAL TECH INDUSTRY [H.G.T.]\n\n`;
    text += `All rights reserved. [H.G.T.] HENRY Global Tech Industry 2026. All rights preserved.\n`;
    
    return text;
}

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 HGT Privacy API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 Generate API key: POST to /api/generate-key`);
    console.log(`📄 Generate policy: POST to /api/generate`);
});