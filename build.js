const fs = require('fs-extra');
const path = require('path');

const toolsDir = path.join(__dirname, 'tools');
const distDir = path.join(__dirname, 'dist');
const partialsDir = path.join(__dirname, 'partials');
const templatePath = path.join(__dirname, 'index.template.html');

async function build() {
    try {
        // 1. Prepare output directory
        await fs.emptyDir(distDir);
        await fs.copy(toolsDir, path.join(distDir, 'tools'));

        // 2. Read the reusable header and footer
        const header = await fs.readFile(path.join(partialsDir, 'header.html'), 'utf-8');
        const footer = await fs.readFile(path.join(partialsDir, 'footer.html'), 'utf-8');

        // 3. Generate the list of tool cards
        const toolFiles = await fs.readdir(toolsDir);
        let toolCardsHtml = '';

        for (const file of toolFiles) {
            if (file.endsWith('.html')) {
                const filePath = path.join(toolsDir, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const titleMatch = fileContent.match(/<title>(.*?)<\/title>/);
                const title = titleMatch ? titleMatch[1] : 'Unnamed Tool';
                const description = `A simple, free, and browser-based tool to help you with your files.`;

                toolCardsHtml += `
                    <div class="tool-card">
                        <h2>${title}</h2>
                        <p>${description}</p>
                        <a href="/tools/${file}">Use Tool</a>
                    </div>
                `;
            }
        }

        // 4. Read the main page content and inject the tool cards
        const pageContentTemplate = await fs.readFile(templatePath, 'utf-8');
        const pageContent = pageContentTemplate.replace('<!-- TOOL_GRID_PLACEHOLDER -->', toolCardsHtml);

        // 5. Assemble the final index.html from all parts
        const finalHtml = header + pageContent + footer;
        await fs.writeFile(path.join(distDir, 'index.html'), finalHtml);

        console.log('Build successful! Site assembled in /dist folder.');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
