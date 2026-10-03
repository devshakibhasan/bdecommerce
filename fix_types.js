const fs = require('fs');

let path = 'src/types/index.ts';
let content = fs.readFileSync(path, 'utf-8');

// Remove all id_card_number?: string;
content = content.replace(/\s*id_card_number\?: string;/g, '');

// Put it back only in User interface
// Search for:
// export interface User {
//   id: number;
content = content.replace(/export interface User \{\s*id: number;/g, "export interface User {\n  id: number;\n  id_card_number?: string;");

fs.writeFileSync(path, content, 'utf-8');
console.log('Fixed types');
