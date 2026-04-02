const fs = require('fs');

// Patch constants.js to have more forgiving angles
let constants = fs.readFileSync('src/constants.js', 'utf8');

// Bicep Curls originally 60 / 140
constants = constants.replace("down: { angle: 60", "down: { angle: 75");
constants = constants.replace("up: { angle: 140", "up: { angle: 125");

// Squats / Lunges originally 100 / 155
constants = constants.replace(/down: \{ angle: 100/g, "down: { angle: 115");
constants = constants.replace(/up: \{ angle: 155/g, "up: { angle: 140");

// Shoulder press / Knee ext originally 150 / 90 or 150 / 100
constants = constants.replace(/down: \{ angle: 150/g, "down: { angle: 135");
constants = constants.replace(/up: \{ angle: 90/g, "up: { angle: 105");
constants = constants.replace(/up: \{ angle: 100/g, "up: { angle: 115");

// Lateral raises originally 70 / 30
constants = constants.replace("down: { angle: 70", "down: { angle: 55");
constants = constants.replace("up: { angle: 30", "up: { angle: 45");

fs.writeFileSync('src/constants.js', constants);
console.log("Constants patched.");
