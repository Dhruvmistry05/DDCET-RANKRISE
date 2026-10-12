const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_rankrise_dev_key_2026';
const adminToken = jwt.sign({ id: 1, email: 'admin@test.com', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
const studentToken = jwt.sign({ id: 2, email: 'student@test.com', role: 'student' }, JWT_SECRET, { expiresIn: '1h' });

const request = (options, postData = null, isMultipart = false, boundary = '') => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const createMultipartBuffer = (fields, fileField = null) => {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const crlf = '\r\n';
  const parts = [];

  for (const [key, val] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}${crlf}Content-Disposition: form-data; name="${key}"${crlf}${crlf}${val}${crlf}`
    ));
  }

  if (fileField) {
    parts.push(Buffer.from(
      `--${boundary}${crlf}Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"${crlf}Content-Type: ${fileField.contentType}${crlf}${crlf}`
    ));
    parts.push(fileField.buffer);
    parts.push(Buffer.from(crlf));
  }

  parts.push(Buffer.from(`--${boundary}--${crlf}`));
  const body = Buffer.concat(parts);
  return { body, boundary };
};

const runTests = async () => {
  console.log("============================================================");
  console.log("  Running Admin Resource Management Comprehensive Test Suite");
  console.log("============================================================");

  let passed = 0;
  let failed = 0;

  const assert = (name, condition, details = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name} ${details}`);
      failed++;
    }
  };

  // Valid PDF buffer: starts with %PDF-1.4
  const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  // Fake PDF buffer: invalid magic bytes
  const fakePdfBuffer = Buffer.from('THIS IS NOT A REAL PDF FILE, JUST TEXT.');

  try {
    // TEST 1: Unauthorized access rejection (No Token)
    const t1 = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ title: 'Test' }));
    assert("Rejects unauthenticated POST /api/resources", t1.status === 401);

    // TEST 2: Student forbidden from calling admin API
    const t2 = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' }
    }, JSON.stringify({ title: 'Test' }));
    assert("Rejects student token with 403 Forbidden", t2.status === 403);

    // TEST 3: Invalid file signature rejection (Fake PDF)
    const { body: fakeBody, boundary: fakeBoundary } = createMultipartBuffer(
      { title: 'Fake PDF Test', type: 'syllabus' },
      { name: 'file', filename: 'fake.pdf', contentType: 'application/pdf', buffer: fakePdfBuffer }
    );
    const t3 = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${fakeBoundary}`,
        'Content-Length': fakeBody.length
      }
    }, fakeBody);
    assert("Rejects file with invalid PDF signature (magic bytes)", t3.status === 400 && t3.data.error.includes('signature'));

    // TEST 4: Valid PDF upload and resource creation
    const { body: validBody, boundary: validBoundary } = createMultipartBuffer(
      { title: 'DDCET 2026 Test Paper', type: 'question_paper', exam_year: '2026', published: 'true' },
      { name: 'file', filename: 'valid_test.pdf', contentType: 'application/pdf', buffer: validPdfBuffer }
    );
    const t4 = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${validBoundary}`,
        'Content-Length': validBody.length
      }
    }, validBody);
    assert("Uploads valid PDF and creates resource", t4.status === 201 && t4.data.id && t4.data.file_path);
    const createdPaperId = t4.data.id;

    // TEST 5: External link URL validation - Reject javascript: scheme
    const t5RejectJs = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      title: 'Malicious Link Test',
      type: 'general',
      external_url: 'javascript:alert(document.cookie)',
      published: true
    }));
    assert("Rejects unsafe javascript: scheme URL with 400", t5RejectJs.status === 400 && /HTTPS and HTTP/i.test(t5RejectJs.data?.error || ''));

    // TEST 5b: External link URL validation - Reject data: scheme
    const t5RejectData = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      title: 'Data URI Test',
      type: 'general',
      external_url: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      published: true
    }));
    assert("Rejects unsafe data: scheme URL with 400", t5RejectData.status === 400 && /HTTPS and HTTP/i.test(t5RejectData.data?.error || ''));

    // TEST 5c: External link URL validation - Reject malformed URL
    const t5RejectMalformed = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      title: 'Malformed URL Test',
      type: 'general',
      external_url: 'htp://broken url',
      published: true
    }));
    assert("Rejects malformed URL with 400", t5RejectMalformed.status === 400);

    // TEST 5d: Valid external link creation with HTTPS, exam_year, display_order
    const t5 = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      title: 'Official DDCET Portal Link',
      description: 'Official Gujarat admission portal',
      type: 'general',
      external_url: 'https://gujaratuniversity.ac.in/admission',
      exam_year: 2026,
      display_order: 1,
      published: true
    }));
    assert("Creates external URL resource without file", t5.status === 201 && t5.data.external_url === 'https://gujaratuniversity.ac.in/admission');
    const createdUrlResourceId = t5.data.id;

    // TEST 5e: Student query externalOnly & publishedOnly
    const t5StudentQuery = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources?externalOnly=true&publishedOnly=true', method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const foundLink = Array.isArray(t5StudentQuery.data) && t5StudentQuery.data.find(r => r.id === createdUrlResourceId);
    assert("Student retrieves published external link via externalOnly query", t5StudentQuery.status === 200 && !!foundLink && foundLink.display_order === 1);

    // TEST 5f: Reject unsafe URL on PUT /api/resources/:id
    const t5RejectPut = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${createdUrlResourceId}`, method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      external_url: 'javascript:void(0)'
    }));
    assert("Rejects unsafe javascript: URL on metadata update with 400", t5RejectPut.status === 400);

    // TEST 6: Update resource metadata (PUT /api/resources/:id)
    const t6 = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${createdPaperId}`, method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      title: 'DDCET 2026 Test Paper (Updated)',
      description: 'Updated comprehensive description'
    }));
    assert("Updates resource metadata", t6.status === 200 && t6.data.title === 'DDCET 2026 Test Paper (Updated)');

    // TEST 7: Quick toggle publish/unpublish (PUT /api/resources/:id/publish)
    const t7 = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${createdPaperId}/publish`, method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert("Toggles publish status to draft", t7.status === 200 && t7.data.published === false);

    // TEST 8: Replace PDF file (PUT /api/resources/:id/replace-file)
    const newPdfBuffer = Buffer.from('%PDF-1.4\n%New Replaced File Content\n%%EOF');
    const { body: replaceBody, boundary: replaceBoundary } = createMultipartBuffer(
      {},
      { name: 'file', filename: 'replaced.pdf', contentType: 'application/pdf', buffer: newPdfBuffer }
    );
    const t8 = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${createdPaperId}/replace-file`, method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${replaceBoundary}`,
        'Content-Length': replaceBody.length
      }
    }, replaceBody);
    assert("Replaces PDF file while preserving resource ID", t8.status === 200 && t8.data.id === createdPaperId);

    // TEST 9: Answer key linkage and safe deletion prevention
    // Create an answer key linked to this paper
    const t9CreateKey = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      title: 'DDCET 2026 Answer Key',
      type: 'answer_key',
      paper_id: createdPaperId,
      external_url: 'https://example.com/key.pdf',
      published: true
    }));
    const keyId = t9CreateKey.data.id;

    // Try deleting paper while answer key is linked -> should reject
    const t9DeletePaper = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${createdPaperId}`, method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert("Blocks deleting paper when answer key is linked to it", t9DeletePaper.status === 400 && t9DeletePaper.data.error);

    // Delete answer key first
    const t9DeleteKey = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${keyId}`, method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert("Deletes linked answer key successfully", t9DeleteKey.status === 200 && t9DeleteKey.data.success);

    // Now delete paper -> should succeed
    const t9DeletePaperAfter = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${createdPaperId}`, method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert("Deletes paper and coordinates file cleanup after link is cleared", t9DeletePaperAfter.status === 200 && t9DeletePaperAfter.data.success);

    // Cleanup external URL test resource
    await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${createdUrlResourceId}`, method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log("------------------------------------------------------------");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED.`);
    console.log("============================================================\n");
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  }
};

runTests();
