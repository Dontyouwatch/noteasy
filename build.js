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
        await fs.ensureDir(path.join(distDir, 'tools'));

        // 2. Read the reusable parts
        const header = await fs.readFile(path.join(partialsDir, 'header.html'), 'utf-8');
        const footer = await fs.readFile(path.join(partialsDir, 'footer.html'), 'utf-8');
        
        // --- PART 1: BUILD THE LANDING PAGE ---
        const toolFiles = await fs.readdir(toolsDir);
        let toolCardsHtml = '';

        for (const file of toolFiles) {
            if (file.endsWith('.html')) {
                const fileContent = await fs.readFile(path.join(toolsDir, file), 'utf-8');
                const titleMatch = fileContent.match(/<title>(.*?)<\/title>/);
                const title = titleMatch ? titleMatch[1] : 'Unnamed Tool';
                const description = `Click here to use this simple, free, and browser-based tool.`;
                toolCardsHtml += `<div class="tool-card"><h2>${title}</h2><p>${description}</p><a href="/tools/${file}">Use Tool</a></div>`;
            }
        }
        
        const indexTemplate = await fs.readFile(templatePath, 'utf-8');
        const indexContent = indexTemplate.replace('<!-- TOOL_GRID_PLACEHOLDER -->', toolCardsHtml);
        const indexHeader = header.replace('<!-- PAGE_TITLE -->', 'ToolHub - Free Online Tools').replace('<!-- TOOL_SPECIFIC_STYLES -->', ''); // No specific styles for homepage
        const finalIndexHtml = indexHeader + indexContent + footer;
        await fs.writeFile(path.join(distDir, 'index.html'), finalIndexHtml);
        console.log('Successfully built index.html');

        // --- PART 2: BUILD EVERY INDIVIDUAL TOOL PAGE ---
        for (const file of toolFiles) {
             if (file.endsWith('.html')) {
                const toolPath = path.join(toolsDir, file);
                const toolPageContent = await fs.readFile(toolPath, 'utf-8');
                
                // Extract the three key parts from the tool file
                const titleMatch = toolPageContent.match(/<title>(.*?)<\/title>/);
                const styleMatch = toolPageContent.match(/<style>([\s\S]*)<\/style>/);
                const bodyMatch = toolPageContent.match(/<body[^>]*>([\s\S]*)<\/body>/);

                if (!titleMatch || !bodyMatch) {
                    console.warn(`Could not parse title or body from ${file}. Skipping.`);
                    continue;
                }
                
                const title = titleMatch[1];
                const toolStyles = styleMatch ? styleMatch[1] : ''; // Get styles, or empty string if none
                const bodyContent = bodyMatch[1];
                
                // Create a custom header, replacing BOTH title and the new styles placeholder
                const toolHeader = header
                    .replace('<!-- PAGE_TITLE -->', `${title} - ToolHub`)
                    .replace('<!-- TOOL_SPECIFIC_STYLES -->', `<style>${toolStyles}</style>`);
                
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

build();```

### Step 3: How to Add a New Tool Now (The New Workflow)

This is the best part. From now on, your process for adding a tool is incredibly simple.

Let's say you want to add a "Text to Slug" converter.

1.  Create a new file: `/tools/text-to-slug.html`.
2.  Format it like a standalone HTML document. The build script will read from it like a template.

    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Text to Slug Converter</title>
        <style>
            /* Add any styles SPECIFIC to this tool here */
            #slug-output {
                background-color: #e9ecef;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <!-- The HTML content for your tool goes here -->
        <h1>Text to Slug Converter</h1>
        <input type="text" id="slug-input" placeholder="Enter text here...">
        <div id="slug-output">your-slug-will-appear-here</div>

        <!-- The JavaScript for your tool goes here -->
        <script>
            // ... your javascript logic ...
        </script>
    </body>
    </html>
    ```

3.  Commit and push your new file.

That's it. The build script will automatically extract the title (`Text to Slug Converter`), the specific styles (`#slug-output`), and the body content, and it will build the final page correctly, wrapped in the shared header and footer. You never have to touch the central CSS file again.
