// Public privacy policy page — required by Facebook App Review

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto p-8 prose prose-sm dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> April 3, 2026</p>
      <p>Tony Tech Lab operates the TonyTechLab platform and related services including CLM (Content Learning Management). This policy describes how we collect, use, and protect your information.</p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account Information:</strong> Name, email, profile picture via OAuth login (Google, WordPress, Facebook)</li>
        <li><strong>Platform Data:</strong> Facebook Page access tokens when you connect for publishing</li>
        <li><strong>Content:</strong> Posts, articles, and media you create through our platform</li>
        <li><strong>Usage Data:</strong> Analytics and engagement metrics from connected platforms</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide content management and publishing services</li>
        <li>To publish content to your connected Facebook Pages on your behalf</li>
        <li>To sync engagement metrics from your published content</li>
        <li>To send notifications about content approval and publishing status</li>
      </ul>

      <h2>3. Data Storage and Security</h2>
      <p>All sensitive credentials are encrypted using AES-256-GCM before storage. We do not store Facebook passwords. OAuth tokens are used solely for authorized publishing actions you configure.</p>

      <h2>4. Third-Party Services</h2>
      <ul>
        <li><strong>Facebook/Meta:</strong> Page publishing and insights</li>
        <li><strong>Zalo:</strong> Bot messaging</li>
        <li><strong>Unsplash:</strong> Stock images</li>
      </ul>

      <h2>5. Data Deletion</h2>
      <p>Disconnect your Facebook account anytime through CLM settings to revoke access and remove stored tokens. For full data deletion, contact admin@tonytechlab.com.</p>

      <h2>6. Your Rights</h2>
      <p>You can access, correct, or delete your personal data. Disconnect platform accounts anytime to remove credentials.</p>

      <h2>7. Contact</h2>
      <p>Privacy concerns: <strong>admin@tonytechlab.com</strong></p>

      <h2>8. Changes</h2>
      <p>We may update this policy periodically. Changes will be posted on this page.</p>
    </div>
  );
}
