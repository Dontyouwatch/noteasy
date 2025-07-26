const fs = require('fs-extra');
const path = require('path');

const toolsDir = path.join(__dirname, 'tools');
const distDir = path.join(__dirname, 'dist');
const partialsDir = path.join(__dirname, 'partials');
const templatePath = path.join(__dirname, 'index.template.html');

async function build() {
    try {
        console.log('Starting build...');

        await fs.emptyDir(distDir);
        await fs.ensureDir(path.join(distDir, 'tools'));

        const header = await fs.readFile(path.join(partialsDir, 'header.html'), 'utf-8');
        const footer = await fs.readFile(path.join(partialsDir, 'footer.html'), 'utf-8');
        const toolFiles = await fs.readdir(toolsDir);
        let toolCardsHtml = '';

        for (const file of toolFiles) {
            if (file.endsWith('.html')) {
                const fileContent = await fs.readFile(path.join(toolsDir, file), 'utf-8');
                const titleMatch = fileContent.match(/<title>(.*?)<\/title>/);
                const title = titleMatch ? titleMatch[1] : 'Unnamed Tool';
                toolCardsHtml += `<div class="tool-card"><h2>${title}</h2><p>Click here to use this simple, free, and browser-based tool.</p><a href="/tools/${file}">Use Tool</a></div>`;
                
                const bodyMatch = fileContent.match(/<body[^>]*>([\s\S]*)<\/body>/);
                if (bodyMatch) {
                    const bodyContent = bodyMatch[1];
                    const toolHeader = header.replace('<!-- PAGE_TITLE -->', `${title} - ToolHub`);
                    const finalToolHtml = toolHeader + bodyContent + footer;
                    await fs.writeFile(path.join(distDir, 'tools', file), finalToolHtml);
                    console.log(`Successfully built ${file}`);
                }
            }
        }
        
        const indexTemplate = await fs.readFile(templatePath, 'utf-8');
        const indexContent = indexTemplate.replace('<!-- TOOL_GRID_PLACEHOLDER -->', toolCardsHtml);
        const finalIndexHtml = header.replace('<!-- PAGE_TITLE -->', 'ToolHub - Free Online Tools') + indexContent + footer;
        await fs.writeFile(path.join(distDir, 'index.html'), finalIndexHtml);
        console.log('Successfully built index.html');
        console.log('Build successful!');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
