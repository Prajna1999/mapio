const fs = require('fs');
const path = require('path');

function convertSvgToJsx(svgContent) {
    let converted = svgContent;

    // 1. Remove XML declaration
    converted = converted.replace(/<\?xml[^>]*\?>/g, '');

    // 2. Remove comments
    converted = converted.replace(/<!--[\s\S]*?-->/g, '');

    // 3. Remove namespaces
    converted = converted.replace(/\s*xmlns:[\w-]+="[^"]*"/g, '');

    // 4. Replace xlink:href with href
    converted = converted.replace(/xlink:href=/g, 'href=');

    // 5. Convert inline styles from CSS strings to JSX objects
    converted = converted.replace(/style="([^"]*)"/g, (match, styleContent) => {
        // Parse CSS properties
        const properties = styleContent
            .split(';')
            .filter(prop => prop.trim())
            .map(prop => {
                const [key, value] = prop.split(':').map(s => s.trim());
                if (!key || !value) return null;

                // Convert kebab-case to camelCase
                const camelKey = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());

                // Wrap value in quotes if it's not a number
                const formattedValue = isNaN(parseFloat(value)) ? `'${value}'` : value;

                return `${camelKey}: ${formattedValue}`;
            })
            .filter(Boolean)
            .join(', ');

        return `style={{${properties}}}`;
    });

    // 6. Convert common attributes to JSX format
    const attributeMap = {
        'class': 'className',
        'stroke-width': 'strokeWidth',
        'stroke-dasharray': 'strokeDasharray',
        'stroke-dashoffset': 'strokeDashoffset',
        'stroke-linecap': 'strokeLinecap',
        'stroke-linejoin': 'strokeLinejoin',
        'fill-rule': 'fillRule',
        'clip-rule': 'clipRule',
        'font-family': 'fontFamily',
        'font-size': 'fontSize',
        'font-weight': 'fontWeight',
        'text-anchor': 'textAnchor',
        'dominant-baseline': 'dominantBaseline'
    };

    Object.entries(attributeMap).forEach(([htmlAttr, jsxAttr]) => {
        const regex = new RegExp(`\\b${htmlAttr}=`, 'g');
        converted = converted.replace(regex, `${jsxAttr}=`);
    });

    // 7. Self-closing tags (add space before />)
    converted = converted.replace(/([^/\s])\/>/g, '$1 />');

    // 8. Clean up extra whitespace
    converted = converted.replace(/\s+/g, ' ').trim();

    // 9. Format for better readability
    converted = converted.replace(/></g, '>\n<');

    return converted;
}

function createReactComponent(svgContent, componentName = 'SvgComponent') {
    const convertedSvg = convertSvgToJsx(svgContent);

    return `import React from 'react';

const ${componentName} = ({ 
  color = 'currentColor',
  size = 24,
  className = '',
  onClick,
  ...props 
}) => (
  ${convertedSvg.replace(/fill="[^"]*"/g, 'fill={color}')
            .replace(/width="[^"]*"/g, 'width={size}')
            .replace(/height="[^"]*"/g, 'height={size}')
            .replace(/<svg/, `<svg className={\`\${className} cursor-pointer\`} onClick={onClick}`)}
);

export default ${componentName};`;
}

function processFile(inputPath, outputPath = null) {
    try {
        // Read SVG file
        const svgContent = fs.readFileSync(inputPath, 'utf8');

        // Get component name from filename
        const filename = path.basename(inputPath, '.svg');
        const componentName = filename.charAt(0).toUpperCase() +
            filename.slice(1).replace(/[-_]/g, '');

        // Convert to JSX
        const jsxContent = createReactComponent(svgContent, componentName);

        // Determine output path
        const outputFile = outputPath || inputPath.replace('.svg', '.jsx');

        // Write component file
        fs.writeFileSync(outputFile, jsxContent);

        console.log(`✅ Converted: ${inputPath} → ${outputFile}`);
        console.log(`📦 Component name: ${componentName}`);

        return jsxContent;
    } catch (error) {
        console.error(`❌ Error processing ${inputPath}:`, error.message);
        return null;
    }
}

function processDirectory(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        const svgFiles = files.filter(file => path.extname(file) === '.svg');

        if (svgFiles.length === 0) {
            console.log('❌ No SVG files found in directory');
            return;
        }

        console.log(`🔍 Found ${svgFiles.length} SVG files`);

        svgFiles.forEach(file => {
            const inputPath = path.join(dirPath, file);
            const outputPath = path.join(dirPath, file.replace('.svg', '.jsx'));
            processFile(inputPath, outputPath);
        });

        console.log('🎉 All files processed!');
    } catch (error) {
        console.error('❌ Error processing directory:', error.message);
    }
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
🔧 SVG to JSX Converter

Usage:
  node svg-converter.js <input-file.svg> [output-file.jsx]
  node svg-converter.js <directory>

Examples:
  node svg-converter.js icon.svg
  node svg-converter.js icon.svg MyIcon.jsx
  node svg-converter.js ./svg-folder
    `);
        process.exit(1);
    }

    const inputPath = args[0];
    const outputPath = args[1];

    if (fs.statSync(inputPath).isDirectory()) {
        processDirectory(inputPath);
    } else {
        processFile(inputPath, outputPath);
    }
}

// Export functions for programmatic use
module.exports = {
    convertSvgToJsx,
    createReactComponent,
    processFile,
    processDirectory
};