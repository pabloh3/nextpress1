import { storage } from "../server/storage.js";
import themeManager from "../server/themes.js";

async function createSpaTheme() {
  try {
    console.log("Creating SPA theme...");

    // Create the SPA theme
    const spaTheme = await storage.createTheme({
      name: 'SPA',
      description: 'A modern Single Page Application theme with fast client-side rendering and smooth transitions. Perfect for dynamic, interactive websites.',
      version: '1.0.0',
      author: 'NextPress Team',
      renderer: 'react', // Using the existing React renderer
      isActive: true, // Make it the active theme
      config: {
        colors: {
          primary: '#0073aa',
          secondary: '#005177',
          background: '#ffffff',
          text: '#23282d',
          accent: '#00a0d2'
        },
        layout: {
          maxWidth: '1200px',
          sidebar: 'right',
          navigation: 'sticky'
        },
        features: {
          clientSideRouting: true,
          dynamicLoading: true,
          smoothTransitions: true,
          responsiveDesign: true
        }
      }
    });

    console.log("SPA theme created successfully:", spaTheme.name);
    console.log("Theme ID:", spaTheme.id);
    console.log("Theme is now active!");

    // Verify the theme is active
    const activeTheme = await storage.getActiveTheme();
    if (activeTheme && activeTheme.id === spaTheme.id) {
      console.log("✅ SPA theme is now the active theme");
    } else {
      console.log("❌ SPA theme is not active");
    }

  } catch (error) {
    console.error("Error creating SPA theme:", error);
    process.exit(1);
  }
}

// Run the script
createSpaTheme().then(() => {
  console.log("Script completed successfully");
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
}); 