// TonyTechLab custom CSS classes for WordPress publishing
// Injected as inline styles via juice + kept as <style> fallback for pseudo-selectors
// Uses !important throughout to override WordPress theme styles

export const TONYTECHLAB_CUSTOM_CSS = `
/* TonyTechLab Theme v2 — Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* Scope container */
.tn-cf-post {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  max-width: 860px !important;
  margin: 0 auto !important;
  line-height: 1.8 !important;
  color: #2d3748 !important;
  font-size: 1.05rem !important;
}

/* Typography */
.tn-cf-post h2 {
  font-family: 'Merriweather', Georgia, serif !important;
  font-size: 1.8rem !important;
  font-weight: 700 !important;
  color: #1a365d !important;
  margin-top: 2.5em !important;
  margin-bottom: 0.8em !important;
  padding-bottom: 0.3em !important;
  border-bottom: 3px solid #f6ad55 !important;
  line-height: 1.4 !important;
}
.tn-cf-post h3 {
  font-family: 'Merriweather', Georgia, serif !important;
  font-size: 1.3rem !important;
  font-weight: 600 !important;
  color: #2c5282 !important;
  margin-top: 1.8em !important;
  margin-bottom: 0.8em !important;
}
.tn-cf-post p { margin: 0 0 1.3em !important; font-size: 1.05rem !important; }
.tn-cf-post ul, .tn-cf-post ol { margin: 0 0 1.3em !important; padding-left: 1.5em !important; }
.tn-cf-post li { margin: 0.4em 0 !important; line-height: 1.8 !important; }
.tn-cf-post a { color: #3182ce !important; text-decoration: none !important; border-bottom: 1px solid transparent !important; }
.tn-cf-post a:hover { border-bottom-color: #3182ce !important; }
.tn-cf-post code { background: #edf2f7 !important; padding: 3px 7px !important; border-radius: 6px !important; font-size: 0.88em !important; font-family: 'JetBrains Mono', monospace !important; }
.tn-cf-post blockquote { border-left: 4px solid #3182ce !important; padding: 16px 20px !important; margin: 1.5em 0 !important; background: #ebf8ff !important; border-radius: 0 10px 10px 0 !important; color: #2a4365 !important; }

/* Step heading — number inline with title */
.tn-cf-post .tn-step-heading {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  border-bottom: 3px solid #f6ad55 !important;
}
.tn-cf-post .tn-step-number {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  border-radius: 50% !important;
  background: #3182ce !important;
  color: white !important;
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-weight: 700 !important;
  font-size: 1.1rem !important;
  line-height: 1 !important;
  flex-shrink: 0 !important;
  margin: 0 !important;
}

/* Intro Box */
.tn-cf-post .tn-cf-intro {
  font-style: italic !important;
  font-size: 1.15rem !important;
  padding: 1.5em !important;
  border-left: 4px solid #3182ce !important;
  background: linear-gradient(135deg, #ebf8ff, #e2e8f0) !important;
  border-radius: 0 8px 8px 0 !important;
  margin: 1.5em 0 !important;
  color: #1a365d !important;
}

/* Figure with shadow */
.tn-cf-post .tn-cf-figure { margin: 2em 0 !important; text-align: center !important; }
.tn-cf-post .tn-cf-figure img { max-width: 100% !important; border-radius: 12px !important; box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important; }
.tn-cf-post .tn-cf-figure img:hover { transform: scale(1.02) !important; }
.tn-cf-post .tn-cf-figcaption { font-style: italic !important; color: #718096 !important; margin-top: 0.8em !important; font-size: 0.9em !important; }

/* Table of Contents */
.tn-cf-post .tn-cf-toc {
  background: linear-gradient(135deg, #f7fafc, #edf2f7) !important;
  padding: 1.5em 2em !important;
  border-radius: 12px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
  margin: 1.5em 0 !important;
}
.tn-cf-post .tn-cf-toc h3 { margin-top: 0 !important; border: none !important; }
.tn-cf-post .tn-cf-toc ul { list-style: none !important; padding: 0 !important; margin: 0 !important; }
.tn-cf-post .tn-cf-toc li { margin: 0.5em 0 !important; line-height: 1.6 !important; }

/* Callout base + variants */
.tn-cf-post .tn-callout {
  padding: 1.2em 1.5em !important;
  border-radius: 10px !important;
  border-left: 4px solid !important;
  margin: 1.5em 0 !important;
  line-height: 1.7 !important;
}
.tn-cf-post .tn-callout strong { display: block !important; margin-bottom: 0.4em !important; font-size: 1.05em !important; }
.tn-cf-post .tn-highlight-box { background: linear-gradient(135deg, #ebf8ff, #bee3f8) !important; border-left-color: #3182ce !important; color: #2a4365 !important; }
.tn-cf-post .tn-warning-box { background: linear-gradient(135deg, #fffbeb, #fef3c7) !important; border-left-color: #d97706 !important; color: #78350f !important; }
.tn-cf-post .tn-success-box { background: linear-gradient(135deg, #f0fff4, #c6f6d5) !important; border-left-color: #38a169 !important; color: #22543d !important; }

/* Code Block */
.tn-cf-post .tn-code-block {
  position: relative !important;
  background: #1a202c !important;
  border-radius: 10px !important;
  margin: 2em 0 !important;
  overflow: hidden !important;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
}
.tn-cf-post .tn-code-label {
  display: block !important;
  text-align: right !important;
  padding: 8px 16px !important;
  background: #2d3748 !important;
  font-size: 0.75em !important;
  color: #a0aec0 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  font-family: 'JetBrains Mono', monospace !important;
}
.tn-cf-post .tn-code-block pre {
  margin: 0 !important;
  padding: 1.5em !important;
  overflow-x: auto !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 0.85em !important;
  line-height: 1.6 !important;
  color: #e2e8f0 !important;
  background: transparent !important;
}

/* Generic pre/code fallback — ensures code blocks are always readable */
.tn-cf-post pre {
  background: #0d1117 !important;
  color: #e6edf3 !important;
  border-radius: 10px !important;
  padding: 1.2em 1.5em !important;
  overflow-x: auto !important;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace !important;
  font-size: 0.88em !important;
  line-height: 1.7 !important;
  margin: 1.5em 0 !important;
  border: 1px solid #30363d !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important;
}
.tn-cf-post pre code {
  background: transparent !important;
  color: inherit !important;
  padding: 0 !important;
  font-size: inherit !important;
}
.tn-cf-post code {
  background: #f1f5f9 !important;
  color: #e11d48 !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 0.88em !important;
}
.tn-cf-post pre code {
  background: transparent !important;
  color: #e6edf3 !important;
}

/* Comparison Table */
.tn-cf-post .tn-comparison-table-wrapper {
  overflow-x: auto !important;
  margin: 2em 0 !important;
  border-radius: 10px !important;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
}
.tn-cf-post .tn-comparison-table {
  width: 100% !important;
  border-collapse: collapse !important;
  text-align: left !important;
  margin: 0 !important;
}
.tn-cf-post .tn-comparison-table th {
  background: linear-gradient(135deg, #2d3748, #1a365d) !important;
  color: white !important;
  padding: 14px 18px !important;
  font-weight: 600 !important;
}
.tn-cf-post .tn-comparison-table td {
  padding: 14px 18px !important;
  border-bottom: 1px solid #e2e8f0 !important;
}
.tn-cf-post .tn-comparison-table tr:nth-child(even) { background: #f7fafc !important; }
.tn-cf-post .tn-comparison-table tr:last-child td { border-bottom: none !important; }

/* Conclusion */
.tn-cf-post .tn-conclusion {
  background: linear-gradient(135deg, #1a365d, #2c5282) !important;
  color: white !important;
  padding: 2.5em !important;
  border-radius: 12px !important;
  text-align: center !important;
  margin: 3em 0 !important;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
}
.tn-cf-post .tn-conclusion h2 {
  color: white !important;
  border-bottom: none !important;
  margin: 0 0 0.6em !important;
  font-size: 1.6rem !important;
  padding-bottom: 0 !important;
}
.tn-cf-post .tn-conclusion p { opacity: 0.95 !important; margin-bottom: 1.5em !important; color: white !important; }
.tn-cf-post .tn-conclusion ul {
  text-align: left !important;
  list-style: none !important;
  padding: 1.5em !important;
  margin: 0 auto !important;
  max-width: 600px !important;
  background: rgba(255,255,255,0.05) !important;
  border-radius: 8px !important;
}
.tn-cf-post .tn-conclusion li {
  margin-bottom: 0.8em !important;
  display: flex !important;
  align-items: flex-start !important;
  gap: 10px !important;
  color: white !important;
}
.tn-cf-post .tn-conclusion li:last-child { margin-bottom: 0 !important; }
.tn-cf-post .tn-check-icon { color: #48bb78 !important; flex-shrink: 0 !important; margin-top: 2px !important; }

/* Tags */
.tn-cf-post .tn-tags { display: flex !important; flex-wrap: wrap !important; gap: 8px !important; margin-top: 2em !important; }
.tn-cf-post .tn-tag {
  display: inline-block !important;
  background: #edf2f7 !important;
  color: #4a5568 !important;
  padding: 6px 14px !important;
  border-radius: 20px !important;
  font-size: 0.85em !important;
}

/* Responsive */
@media (max-width: 768px) {
  .tn-cf-post h2 { font-size: 1.5rem !important; }
  .tn-cf-post .tn-cf-intro { font-size: 1em !important; padding: 1em !important; }
  .tn-cf-post .tn-conclusion { padding: 1.5em !important; }
}
`;
