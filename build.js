const fs = require('fs-extra');
const path = require('path');

// --- Define file paths ---
const toolsDir = path.join(__dirname, 'tools');
const distDir = path.join(__dirname, 'dist');
const partialsDir = path.join(__dirname, 'partials');
const templatePath = path.join(__dirname, 'index.template.html');

async function build() {
    try {
        console.log('Starting build...');

        // 1. Prepare output directory
        await fs.emptyDir(distDir);
        await fs.ensureDir(path.join(distDir, 'tools')); // Ensure the /dist/tools folder exists

        // 2. Read the reusable parts
        const header = await fs.readFile(path.join(partialsDir, 'header.html'), 'utf-8');
        const footer = await fs.readFile(path.join(partialsDir, 'footer.html'), 'utf-8');
        
        // --- PART 1: BUILD THE LANDING PAGE ---

        // Generate tool cards for the landing page
        const toolFiles = await fs.readdir(toolsDir);
        let toolCardsHtml = '';

        for (const file of toolFiles) {
            if (file.endsWith('.html')) {
                const fileContent = await fs.readFile(path.join(toolsDir, file), 'utf-8');
                const titleMatch = fileContent.match(/<title>(.*?)<\/title>/);
                const title = titleMatch ? titleMatch[1] : 'Unnamed Tool';
                const description = `Click here to use this simple, free, and browser-based tool.`;

                toolCardsHtml += `
                    <div class="tool-card">
                        <h2>${title}</h2>
                        <p>${description}</p>
                        <a href="/tools/${file}">Use Tool</a>
                    </div>
                `;
            }
        }
        
        // Assemble the final index.html
        const indexTemplate = await fs.readFile(templatePath, 'utf-8');
        const indexContent = indexTemplate.replace('<!-- TOOL_GRID_PLACEHOLDER -->', toolCardsHtml);
        const indexHeader = header.replace('<!-- PAGE_TITLE -->', 'ToolHub - Free Online Tools');
        const finalIndexHtml = indexHeader + indexContent + footer;
        await fs.writeFile(path.join(distDir, 'index.html'), finalIndexHtml);
        console.log('Successfully built index.html');


        // --- PART 2: BUILD EVERY INDIVIDUAL TOOL PAGE ---
        
        for (const file of toolFiles) {
             if (file.endsWith('.html')) {
                const toolPath = path.join(toolsDir, file);
                const toolPageContent = await fs.readFile(toolPath, 'utf-8');
                
                // Extract the title and body content from the original tool file
                const titleMatch = toolPageContent.match(/<title>(.*?)<\/title>/);
                const bodyMatch = toolPageContent.match(/<body[^>]*>([\s\S]*)<\/body>/);

                if (!titleMatch || !bodyMatch) {
                    console.warn(`Could not parse title or body from ${file}. Skipping.`);
                    continue;
                }
                
                const title = titleMatch[1];
                const bodyContent = bodyMatch[1];
                
                // Create a custom header for this tool with the correct title
                const toolHeader = header.replace('<!-- PAGE_TITLE -->', `${title} - ToolHub`);
                
                // Assemble the final tool page
                const finalToolHtml = toolHeader + bodyContent + footer;
                
                // Write the newly built tool page to the /dist/tools/ directory
                await fs.writeFile(path.join(distDir, 'tools', file), finalToolHtml);
                console.log(`Successfully built ${file}`);
             }
        }

        console.log('Build successful!');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
