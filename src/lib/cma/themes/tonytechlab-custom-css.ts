// TonyTechLab custom CSS classes for WordPress publishing
// Injected as a <style> block in published HTML — trusted, not user-supplied
// Enables gradients, shadows, and positioning that inline styles can't express

export const TONYTECHLAB_CUSTOM_CSS = `
/* TonyTechLab Theme — Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* AI-Generated Post Container */
.tn-cf-post { font-family: 'Poppins', sans-serif; max-width: 860px; margin: 0 auto; line-height: 1.8; color: #2d3748; }
.tn-cf-post h2 { font-family: 'Libre Baskerville', Georgia, serif; font-size: 1.8em; font-weight: 700; color: #1a365d; margin-top: 2.5em; margin-bottom: 0.8em; padding-bottom: 0.3em; border-bottom: 3px solid #f6ad55; }
.tn-cf-post h3 { font-family: 'Libre Baskerville', Georgia, serif; font-size: 1.3em; font-weight: 600; color: #2c5282; margin-top: 1.8em; }
.tn-cf-post p { margin: 0 0 1.3em; line-height: 1.8; font-size: 1.05em; }
.tn-cf-post ul, .tn-cf-post ol { margin: 0 0 1.3em; padding-left: 1.5em; }
.tn-cf-post li { margin: 0.4em 0; line-height: 1.8; }
.tn-cf-post a { color: #3182ce; text-decoration: none; }
.tn-cf-post a:hover { color: #2b6cb0; text-decoration: underline; }
.tn-cf-post code { background: #edf2f7; padding: 3px 7px; border-radius: 6px; font-size: 0.88em; font-family: 'JetBrains Mono', monospace; }
.tn-cf-post blockquote { border-left: 4px solid #3182ce; padding: 16px 20px; margin: 1.5em 0; background: #ebf8ff; border-radius: 0 10px 10px 0; color: #2a4365; }

/* Intro Box */
.tn-cf-intro { font-style: italic; font-size: 1.15em; padding: 1.2em 1.5em; border-left: 4px solid #3182ce; background: linear-gradient(135deg, #ebf8ff, #e2e8f0); border-radius: 0 8px 8px 0; margin: 1.5em 0; }

/* Figure with shadow */
.tn-cf-figure { margin: 2em 0; text-align: center; }
.tn-cf-figure img { max-width: 100%; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: transform 0.3s ease; }
.tn-cf-figure img:hover { transform: scale(1.02); }
.tn-cf-figcaption { font-style: italic; color: #718096; margin-top: 0.8em; font-size: 0.9em; }

/* Responsive */
@media (max-width: 768px) { .tn-cf-post h2 { font-size: 1.4em; } .tn-cf-intro { font-size: 1em; padding: 1em; } }

/* Callout Boxes — shared base */
.tn-highlight-box, .tn-warning-box, .tn-success-box {
  padding: 1.2em 1.5em;
  border-radius: 10px;
  border-left: 4px solid;
  margin: 1.5em 0;
  line-height: 1.7;
}
.tn-highlight-box strong, .tn-warning-box strong, .tn-success-box strong {
  display: block;
  margin-bottom: 0.4em;
  font-size: 1.05em;
}
.tn-highlight-box p, .tn-warning-box p, .tn-success-box p {
  margin: 0;
}

/* Callout — Info (blue) */
.tn-highlight-box {
  background: linear-gradient(135deg, #ebf8ff, #bee3f8);
  border-left-color: #3182ce;
  color: #2a4365;
}

/* Callout — Warning (amber) */
.tn-warning-box {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-left-color: #d97706;
  color: #78350f;
}

/* Callout — Success (green) */
.tn-success-box {
  background: linear-gradient(135deg, #f0fff4, #c6f6d5);
  border-left-color: #38a169;
  color: #22543d;
}

/* Code Block with language label */
.tn-code-block {
  position: relative;
  background: #1a202c;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  padding: 1.4em 1.5em;
  border-radius: 10px;
  overflow-x: auto;
  margin: 1.5em 0;
  font-size: 0.9em;
  line-height: 1.6;
}
.tn-code-label {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 0.75em;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Comparison Table — gradient headers, zebra rows */
.tn-comparison-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  margin: 1.5em 0;
}
.tn-comparison-table th {
  background: linear-gradient(135deg, #2d3748, #1a365d);
  color: white;
  padding: 14px 18px;
  font-weight: 600;
  text-align: left;
}
.tn-comparison-table td {
  padding: 12px 18px;
  border-bottom: 1px solid #e2e8f0;
}
.tn-comparison-table tr:nth-child(even) {
  background: #f7fafc;
}
.tn-comparison-table tr:last-child td {
  border-bottom: none;
}

/* Step Counter — circular badge + content */
.tn-step-container {
  display: flex;
  align-items: flex-start;
  gap: 1em;
  margin: 1.5em 0;
}
.tn-step-number {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3182ce, #2b6cb0);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95em;
  flex-shrink: 0;
  line-height: 1;
}
.tn-step-content {
  flex: 1;
  padding-top: 0.3em;
}

/* Table of Contents */
.tn-cf-toc {
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  padding: 1.5em 2em;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin: 1.5em 0;
}
.tn-cf-toc strong {
  display: block;
  font-size: 1.1em;
  color: #1a365d;
  margin-bottom: 0.8em;
}
.tn-cf-toc ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.tn-cf-toc li {
  margin: 0.3em 0;
}
.tn-cf-toc a {
  color: #3182ce;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}
.tn-cf-toc a:hover {
  border-bottom-color: #3182ce;
}

/* Conclusion Section */
.tn-conclusion {
  background: linear-gradient(135deg, #1a365d, #2c5282);
  color: white;
  padding: 2em 2.5em;
  border-radius: 12px;
  text-align: center;
  margin: 2em 0;
}
.tn-conclusion h2 {
  color: white;
  border-bottom: none;
  margin: 0 0 0.6em;
  font-size: 1.4em;
}
.tn-conclusion p {
  margin: 0;
  line-height: 1.8;
  opacity: 0.95;
}

/* Tags / Labels */
.tn-tag {
  display: inline-block;
  background: #edf2f7;
  color: #4a5568;
  padding: 0.2em 0.8em;
  border-radius: 20px;
  font-size: 0.85em;
  margin: 0.2em;
}
`;
