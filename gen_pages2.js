const fs = require('fs');
const path = require('path');
const baseDir = "c:/Users/Lokesh/Desktop/E-commerce/orderly/admin/src/pages";
const files = {};

const content3 = fs.readFileSync('gen_pages2.py', 'utf-8');
const content4 = fs.readFileSync('gen_pages3.py', 'utf-8');
const content5 = fs.readFileSync('gen_pages4.py', 'utf-8');

// I can extract the strings from the python scripts, but that's error prone.
// Let me write a python to JS converter or just rewrite them.
