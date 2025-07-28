// Simple test runner
const { spawn } = require('child_process');
const path = require('path');

const tests = [
  'auth.test.js',
  'event-validation.test.js'
];

console.log('Toronto Events Calendar - Test Suite\n' + '='.repeat(50) + '\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testFile, index) {
  return new Promise((resolve) => {
    console.log(`Running ${testFile}...`);
    
    const testPath = path.join(__dirname, testFile);
    const child = spawn('node', [testPath]);
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${testFile} passed`);
        testsPassed++;
      } else {
        console.log(`✗ ${testFile} failed`);
        console.log(output);
        testsFailed++;
      }
      console.log('');
      resolve();
    });
  });
}

async function runAllTests() {
  for (let i = 0; i < tests.length; i++) {
    await runTest(tests[i], i);
  }
  
  console.log('='.repeat(50));
  console.log(`\nTest Results:`);
  console.log(`  Passed: ${testsPassed}`);
  console.log(`  Failed: ${testsFailed}`);
  console.log(`  Total:  ${tests.length}`);
  
  if (testsFailed === 0) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  }
}

runAllTests();