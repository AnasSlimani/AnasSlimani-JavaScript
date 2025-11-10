import http, { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let data = '';

const server = http.createServer((req, res) => {
    const url = req.url;
    if (url === '/index.html') {
        data = fs.readFileSync(path.join(__dirname, "index.html"), 'utf-8');
    }
    else if (url === '/about.html') {
        data = fs.readFileSync(path.join(__dirname, 'about.html'), 'utf-8');
    }
    else {
        data = fs.readFileSync(path.join(__dirname, '404.html'), 'utf-8');
    }

    res.end(data);
});

server.listen(3000,() => {
    console.log("server running on 3000")
})