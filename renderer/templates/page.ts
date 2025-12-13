/**
 * Defines the static HTML page shell as a template literal string.
 * Placeholders are used for dynamic content injection.
 */
export const PageTemplate = (
	pageTitle: string,
	description: string,
	canonicalUrl: string,
	headScripts: string,
	blockContentHtml: string,
	bodyScripts: string,
	hydrateScript: string = "",
): string => {
	// We use backticks (`) to define the template literal
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
      <title>${pageTitle}</title>
      <meta name="description" content="${description}">
      <link rel="canonical" href="${canonicalUrl}">
      
      <link rel="stylesheet" href="/assets/css/main.css">
  
      <style>
        /* Default page styles */
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          background-color: #fff;
        }
        
        #page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        #main-content {
          flex: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        
        /* WordPress block styles */
        .wp-block-heading {
          margin: 1.5em 0 1em;
        }
        
        .wp-block-paragraph {
          margin: 1em 0;
        }
        
        .wp-block-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin: 1.5em 0;
        }
        
        .wp-block-button {
          display: inline-block;
        }
        
        .wp-block-button__link {
          display: inline-block;
          padding: 12px 24px;
          text-decoration: none;
          border: none;
          border-radius: 4px;
          background-color: #007cba;
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .wp-block-button__link:hover {
          background-color: #005a87;
          opacity: 1;
        }
        
        .wp-block-button__link:active {
          background-color: #004a6f;
        }
        
        /* Button variants */
        .wp-block-button__link.is-style-secondary {
          background-color: #6c757d;
        }
        
        .wp-block-button__link.is-style-secondary:hover {
          background-color: #5a6268;
        }
        
        .wp-block-button__link.is-style-outline {
          background-color: transparent;
          border: 2px solid #007cba;
          color: #007cba;
        }
        
        .wp-block-button__link.is-style-outline:hover {
          background-color: #007cba;
          color: #ffffff;
        }
        
        .wp-block-image {
          margin: 1.5em 0;
        }
        
        .wp-block-image img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        .wp-block-image figcaption {
          margin-top: 0.5em;
          font-size: 0.875em;
          color: #666;
          text-align: center;
        }
        
        .wp-block-columns {
          display: flex;
          gap: 2rem;
          margin: 1.5em 0;
        }
        
        .wp-block-column {
          flex: 1;
        }
        
        @media (max-width: 768px) {
          #main-content {
            padding: 1rem;
          }
          
          .wp-block-columns {
            flex-direction: column;
            gap: 1rem;
          }
        }
      </style>
  
      ${headScripts}
  </head>
  <body>
      <div id="page">
          <header>
              </header>
  
          <main id="main-content">
              ${blockContentHtml}
          </main>
  
          <footer>
              </footer>
      </div>
  
      ${bodyScripts}
      ${hydrateScript}
  </body>
  </html>`;
};
