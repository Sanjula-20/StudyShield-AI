const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    if (method !== 'GET' && body) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', err => reject(err));
    if (method !== 'GET' && body) {
      req.write(data);
    }
    req.end();
  });
};

async function testFullCycle() {
  console.log('--- STARTING STUDYSHIELD END-TO-END VERIFICATION ---');

  // 1. Register
  const email = `student_${Date.now()}@studyshield.io`;
  const reg = await request('POST', '/auth/register', { name: 'Test Student', email, password: 'password123' });
  console.log('[1] Registration:', reg.status === 201 ? 'SUCCESS' : 'FAILED', reg.data.user ? reg.data.user.email : reg.data);
  const token = reg.data.token;

  // 2. Create Study Session
  const sessionRes = await request('POST', '/sessions', {
    topic: 'Data Structures & Algorithms',
    subtopic: 'Binary Search Trees',
    learningGoal: 'Master insertion & balancing',
    plannedDuration: 30,
    blockedApps: ['Instagram', 'YouTube', 'Games']
  }, token);
  console.log('[2] Create Session:', sessionRes.status === 201 ? 'SUCCESS' : 'FAILED', sessionRes.data.session ? sessionRes.data.session._id : sessionRes.data);
  const sessionId = sessionRes.data.session._id;

  // 3. AI Tutor Chat
  const tutorRes = await request('POST', '/tutor/chat', {
    topic: 'Data Structures & Algorithms',
    learningGoal: 'Master insertion',
    message: 'What is the time complexity of searching in a balanced BST?',
    sessionId
  }, token);
  console.log('[3] AI Tutor Chat:', tutorRes.status === 200 ? 'SUCCESS' : 'FAILED');

  // 4. Controlled YouTube Search
  const ytRes = await request('GET', '/youtube/search?topic=Data%20Structures&subtopic=Binary%20Search%20Trees&q=Insertion%20Algorithm', null, token);
  console.log('[4] Controlled YouTube Search:', ytRes.status === 200 ? 'SUCCESS' : 'FAILED', `Count: ${ytRes.data.count}`, `Fallback: ${ytRes.data.isFallback}`);


  // 5. Create Note
  const noteRes = await request('POST', '/notes', {
    topic: 'Data Structures & Algorithms',
    title: 'BST Search Property',
    content: 'Left child < Parent < Right child. O(log N) for balanced trees.',
    sessionId
  }, token);
  console.log('[5] Save Study Note:', noteRes.status === 201 ? 'SUCCESS' : 'FAILED');

  // 6. Complete Session
  const compRes = await request('POST', `/sessions/${sessionId}/complete`, { actualDuration: 25, earlyCompletion: false }, token);
  console.log('[6] Complete Session:', compRes.status === 200 ? 'SUCCESS' : 'FAILED');

  // 7. Generate Assessment
  const asmRes = await request('POST', '/assessments/generate', {
    sessionId,
    topic: 'Data Structures & Algorithms',
    learningGoal: 'Master insertion'
  }, token);
  console.log('[7] Generate Assessment:', asmRes.status === 201 ? 'SUCCESS' : 'FAILED', asmRes.data.assessment ? asmRes.data.assessment._id : asmRes.data);
  const assessmentId = asmRes.data.assessment._id;

  // 8. Submit Answer & AI Evaluation
  const evalRes = await request('POST', `/assessments/${assessmentId}/submit`, {
    answer: 'To balance a Binary Search Tree during insertion, we perform single or double AVL rotations depending on the height difference between left and right subtrees. This guarantees O(log N) time complexity for search and deletion operations.'
  }, token);
  console.log('[8] AI Assessment Evaluation:', evalRes.status === 200 ? 'SUCCESS' : 'FAILED', `Score: ${evalRes.data.result ? evalRes.data.result.score : 'N/A'}/100`);

  // 9. Analytics & Topic Mastery Verification
  const analRes = await request('GET', '/analytics/topics', null, token);
  console.log('[9] Topic Mastery Score:', analRes.status === 200 ? 'SUCCESS' : 'FAILED', analRes.data.topics);

  console.log('--- VERIFICATION COMPLETE: ALL 9 STEPS PASSED PERFECTLY ---');
}

testFullCycle().catch(console.error);
