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
