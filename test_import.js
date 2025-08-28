const mod = require('./src/02_get_cpu_braille_character.js');
console.log('Module type:', typeof mod);
console.log('Module content:', mod);
console.log('Is function?', typeof mod === 'function');

if (typeof mod === 'function') {
  console.log('Testing function call...');
  mod(50).then(result => console.log('Result:', result)).catch(err => console.log('Error:', err));
}
