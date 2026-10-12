const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_rankrise_dev_key_2026';
const adminToken = jwt.sign({ id: 1, email: 'admin@test.com', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
const studentToken = jwt.sign({ id: 2, email: 'student@test.com', role: 'student' }, JWT_SECRET, { expiresIn: '1h' });

const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
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

const runAudit = async () => {
  console.log("========================================================================");
  console.log("   DDCET RankRise - Supabase Resource Security & Audit Test Suite      ");
  console.log("========================================================================");

  let passed = 0;
  let failed = 0;

  const assert = (title, condition, details = '') => {
    if (condition) {
      console.log(`  ✓ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${title} ${details}`);
      failed++;
    }
  };

  const dummyPdf = Buffer.from('%PDF-1.4\n%Security Audit Valid PDF\n%%EOF');
  const fakePdf = Buffer.from('NOT A PDF FILE - PLAIN TEXT MALICIOUS PAYLOAD');
  const createdIds = [];

  try {
    // =====================================================================
    // CATEGORY 1: Authentication & Server-Side Authorization Role Checks
    // =====================================================================
    console.log("\n[1] Testing Authentication & Server-Side Role Enforcement...");

    // 1.1 Unauthenticated POST /api/resources
    const unauthPost = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ title: 'Unauth' }));
    assert("Rejects unauthenticated POST /api/resources with 401 Unauthorized", unauthPost.status === 401);

    // 1.2 Student forbidden from creating resource
    const studentPost = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' }
    }, JSON.stringify({ title: 'Student Attempt', external_url: 'https://example.com' }));
    assert("Rejects student token from POST /api/resources with 403 Forbidden", studentPost.status === 403);

    // 1.3 Create test resource as admin
    const { body: admBody, boundary: admBound } = createMultipartBuffer(
      { title: 'Audit Test Resource 2026', type: 'question_paper', exam_year: '2026', published: 'true' },
      { name: 'file', filename: 'audit_test.pdf', contentType: 'application/pdf', buffer: dummyPdf }
    );
    const admCreate = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${admBound}`,
        'Content-Length': admBody.length
      }
    }, admBody);
    assert("Authorized admin can create resource", admCreate.status === 201 && admCreate.data?.id);
    const testResId = admCreate.data?.id;
    if (testResId) createdIds.push(testResId);

    // 1.4 Student forbidden from PUT /api/resources/:id
    const studentPut = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${testResId}`, method: 'PUT',
      headers: { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' }
    }, JSON.stringify({ title: 'Tampered Title' }));
    assert("Rejects student token from PUT /api/resources/:id with 403 Forbidden", studentPut.status === 403);

    // 1.5 Student forbidden from PUT /api/resources/:id/publish
    const studentPublish = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${testResId}/publish`, method: 'PUT',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Rejects student token from PUT /api/resources/:id/publish with 403 Forbidden", studentPublish.status === 403);

    // 1.6 Student forbidden from PUT /api/resources/:id/replace-file
    const studentReplace = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${testResId}/replace-file`, method: 'PUT',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Rejects student token from PUT /api/resources/:id/replace-file with 403 Forbidden", studentReplace.status === 403);

    // 1.7 Student forbidden from DELETE /api/resources/:id
    const studentDelete = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${testResId}`, method: 'DELETE',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Rejects student token from DELETE /api/resources/:id with 403 Forbidden", studentDelete.status === 403);

    // =====================================================================
    // CATEGORY 2: Input Validation, MIME / Magic Byte Verification & Safe URLs
    // =====================================================================
    console.log("\n[2] Testing Input Validation, File Signature & URL Sanitization...");

    // 2.1 Rejects fake PDF (text content with invalid magic byte)
    const { body: fakeBody, boundary: fakeBound } = createMultipartBuffer(
      { title: 'Fake PDF Upload', type: 'general' },
      { name: 'file', filename: 'fake.pdf', contentType: 'application/pdf', buffer: fakePdf }
    );
    const fakeRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${fakeBound}`,
        'Content-Length': fakeBody.length
      }
    }, fakeBody);
    assert("Rejects non-PDF file upload lacking '%PDF-' magic bytes", fakeRes.status === 400 && fakeRes.data?.error?.includes('signature'));

    // 2.2 Rejects javascript: URL
    const jsUrlRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, JSON.stringify({ title: 'XSS Attempt', external_url: 'javascript:alert(1)' }));
    assert("Rejects dangerous 'javascript:' scheme with 400 Bad Request", jsUrlRes.status === 400);

    // 2.3 Rejects data: URI
    const dataUriRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, JSON.stringify({ title: 'Data URI', external_url: 'data:text/html;base64,PHNjcmlwdD4=' }));
    assert("Rejects 'data:' scheme with 400 Bad Request", dataUriRes.status === 400);

    // 2.4 Rejects empty title
    const emptyTitleRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, JSON.stringify({ title: '   ', external_url: 'https://example.com' }));
    assert("Rejects empty or whitespace title with 400 Bad Request", emptyTitleRes.status === 400);

    // 2.5 Path traversal in filename is sanitized
    const { body: travBody, boundary: travBound } = createMultipartBuffer(
      { title: 'Path Traversal Filename Test', type: 'general' },
      { name: 'file', filename: '../../../../etc/passwd.pdf', contentType: 'application/pdf', buffer: dummyPdf }
    );
    const travRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${travBound}`,
        'Content-Length': travBody.length
      }
    }, travBody);
    const safePathCreated = travRes.status === 201 && !travRes.data?.file_path?.includes('..');
    assert("Sanitizes filename against directory traversal attempts", safePathCreated);
    if (travRes.data?.id) createdIds.push(travRes.data.id);

    // =====================================================================
    // CATEGORY 3: Information Disclosure, Draft Protection & Health Checks
    // =====================================================================
    console.log("\n[3] Testing Information Disclosure, Draft Visibility & Health Route...");

    // 3.1 Create draft resource
    const draftRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, JSON.stringify({ title: 'Top Secret Draft', external_url: 'https://secret.org', published: false }));
    const draftId = draftRes.data?.id;
    if (draftId) createdIds.push(draftId);

    // 3.2 Student list does not include draft
    const studentList = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const hasDraft = Array.isArray(studentList.data) && studentList.data.some(r => r.id === draftId);
    assert("Student cannot see draft resource in GET /api/resources", !hasDraft);

    // 3.3 Student blocked from /access for draft
    const studentAccessDraft = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${draftId}/access`, method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Student blocked with 403 Forbidden on /api/resources/:id/access for draft", studentAccessDraft.status === 403);

    // 3.4 Student blocked from /download for draft
    const studentDownDraft = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${draftId}/download`, method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Student blocked with 403 Forbidden on /api/resources/:id/download for draft", studentDownDraft.status === 403);

    // 3.5 Health endpoint exposes zero credentials
    const healthRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/health', method: 'GET'
    });
    const healthJson = JSON.stringify(healthRes.data || {});
    const leaksSecret = healthJson.includes('JWT') || healthJson.includes('secret') || healthJson.includes('SERVICE_ROLE') || healthJson.includes('postgres://');
    assert("Health check returns 200 without exposing database URL, JWT secret or service role key", healthRes.status === 200 && !leaksSecret);

    // =====================================================================
    // CATEGORY 4: Database & Storage Consistency, FK Orphan Prevention
    // =====================================================================
    console.log("\n[4] Testing Relational Integrity & Coordinated Deletion...");

    // 4.1 Create linked answer key to testResId
    const keyRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    }, JSON.stringify({
      title: 'Audit Answer Key',
      type: 'answer_key',
      paper_id: testResId,
      external_url: 'https://example.com/key',
      published: true
    }));
    const keyId = keyRes.data?.id;
    if (keyId) createdIds.push(keyId);

    // 4.2 Deleting question paper while answer key is attached is blocked
    const blockDelete = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${testResId}`, method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert("Prevents deleting question paper when dependent answer keys are linked", blockDelete.status === 400 && blockDelete.data?.error);

    // 4.3 Delete key first
    const deleteKey = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${keyId}`, method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert("Deletes answer key cleanly", deleteKey.status === 200);

    // 4.4 Delete paper after link cleared
    const deletePaper = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${testResId}`, method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert("Deletes question paper and file after link cleared", deletePaper.status === 200);

    // =====================================================================
    // CATEGORY 5: Existing Core APIs Non-Regression
    // =====================================================================
    console.log("\n[5] Testing Existing APIs & Syllabus Functionality Non-Regression...");

    const [subRes, chapRes, topRes, sylRes, qRes, tRes] = await Promise.all([
      request({ hostname: 'localhost', port: 3001, path: '/api/subjects', method: 'GET' }),
      request({ hostname: 'localhost', port: 3001, path: '/api/chapters', method: 'GET' }),
      request({ hostname: 'localhost', port: 3001, path: '/api/topics', method: 'GET' }),
      request({ hostname: 'localhost', port: 3001, path: '/api/student/syllabus', method: 'GET' }),
      request({ hostname: 'localhost', port: 3001, path: '/api/questions', method: 'GET' }),
      request({ hostname: 'localhost', port: 3001, path: '/api/tests', method: 'GET' })
    ]);

    assert("GET /api/subjects functions properly", subRes.status === 200 && Array.isArray(subRes.data));
    assert("GET /api/chapters functions properly", chapRes.status === 200 && Array.isArray(chapRes.data));
    assert("GET /api/topics functions properly", topRes.status === 200 && Array.isArray(topRes.data));
    assert("GET /api/student/syllabus returns hierarchical tree", sylRes.status === 200 && Array.isArray(sylRes.data));
    assert("GET /api/questions functions properly", qRes.status === 200 && Array.isArray(qRes.data));
    assert("GET /api/tests functions properly", tRes.status === 200 && Array.isArray(tRes.data));

    // =====================================================================
    // CLEANUP
    // =====================================================================
    for (const id of createdIds) {
      await request({
        hostname: 'localhost', port: 3001, path: `/api/resources/${id}`, method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
    }

    console.log("\n------------------------------------------------------------------------");
    console.log(`SECURITY AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED.`);
    console.log("========================================================================\n");
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Security audit execution failed:", err);
    process.exit(1);
  }
};

runAudit();
