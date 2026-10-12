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

const runSuite = async () => {
  console.log("=================================================================");
  console.log("  Running Student Study Material Library & Access Control Tests  ");
  console.log("=================================================================");

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

  const dummyPdfBuffer = Buffer.from('%PDF-1.4\n%Study Material Test Content\n%%EOF');
  const createdIds = [];

  try {
    // 1. Setup: Create 1 published PDF resource
    const { body: pubBody, boundary: pubBound } = createMultipartBuffer(
      { title: 'Mathematics Practice Paper 2026', type: 'question_paper', exam_year: '2026', published: 'true' },
      { name: 'file', filename: 'math_2026.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer }
    );
    const pubRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${pubBound}`,
        'Content-Length': pubBody.length
      }
    }, pubBody);
    assert("Admin creates published PDF question paper", pubRes.status === 201 && pubRes.data?.id);
    const pubId = pubRes.data?.id;
    if (pubId) createdIds.push(pubId);

    // 2. Setup: Create 1 UNPUBLISHED (draft) PDF resource
    const { body: unpubBody, boundary: unpubBound } = createMultipartBuffer(
      { title: 'Confidential Draft Material 2026', type: 'syllabus', exam_year: '2026', published: 'false' },
      { name: 'file', filename: 'draft.pdf', contentType: 'application/pdf', buffer: dummyPdfBuffer }
    );
    const unpubRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${unpubBound}`,
        'Content-Length': unpubBody.length
      }
    }, unpubBody);
    assert("Admin creates draft/unpublished resource", unpubRes.status === 201 && unpubRes.data?.id);
    const unpubId = unpubRes.data?.id;
    if (unpubId) createdIds.push(unpubId);

    // 3. Setup: Create 1 published External URL resource
    const extRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({
      title: 'Gujarat Board DDCET Mock Portal',
      description: 'Official test sample link',
      type: 'general',
      external_url: 'https://gujaratuniversity.ac.in/mock-test',
      exam_year: 2026,
      published: true
    }));
    assert("Admin creates published external study link", extRes.status === 201 && extRes.data?.id);
    const extId = extRes.data?.id;
    if (extId) createdIds.push(extId);

    // --- TEST 1: Publication Visibility Enforcement ---
    const studentList = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentHasDraft = Array.isArray(studentList.data) && studentList.data.some(r => r.id === unpubId);
    const studentHasPub = Array.isArray(studentList.data) && studentList.data.some(r => r.id === pubId);
    assert("Student cannot see unpublished draft resource in GET /api/resources", !studentHasDraft && studentHasPub);

    // --- TEST 2: Admin can view all resources (including drafts) ---
    const adminList = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources', method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminHasDraft = Array.isArray(adminList.data) && adminList.data.some(r => r.id === unpubId);
    assert("Admin can view both published and draft resources", adminHasDraft);

    // --- TEST 3: Student access to unpublished resource rejected with 403 ---
    const studentAccessDraft = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${unpubId}/access`, method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Student rejected with 403 Forbidden on /api/resources/:id/access for draft", studentAccessDraft.status === 403);

    // --- TEST 4: Student download of unpublished resource rejected with 403 ---
    const studentDownloadDraft = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${unpubId}/download`, method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Student rejected with 403 Forbidden on /api/resources/:id/download for draft", studentDownloadDraft.status === 403);

    // --- TEST 5: Student access to published PDF resource returns 200 with file metadata ---
    const studentAccessPub = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${pubId}/access`, method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Student accesses published PDF successfully with file URL and size", 
      studentAccessPub.status === 200 && 
      studentAccessPub.data?.type === 'file' && 
      Boolean(studentAccessPub.data?.url) &&
      studentAccessPub.data?.file_size > 0
    );

    // --- TEST 6: Student access to published external link returns type external ---
    const studentAccessExt = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${extId}/access`, method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Student accesses external URL resource returning type external",
      studentAccessExt.status === 200 &&
      studentAccessExt.data?.type === 'external' &&
      studentAccessExt.data?.url.startsWith('https://gujaratuniversity')
    );

    // --- TEST 7: Filtering by type=question_paper ---
    const typeFilterRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources?type=question_paper', method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const allArePapers = Array.isArray(typeFilterRes.data) && typeFilterRes.data.every(r => r.type === 'question_paper');
    assert("Filtering by type=question_paper returns only question papers", allArePapers && typeFilterRes.data.length > 0);

    // --- TEST 8: Filtering by exam_year=2026 ---
    const yearFilterRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources?exam_year=2026', method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const allAre2026 = Array.isArray(yearFilterRes.data) && yearFilterRes.data.every(r => r.exam_year === 2026);
    assert("Filtering by exam_year=2026 returns only 2026 materials", allAre2026 && yearFilterRes.data.length >= 2);

    // --- TEST 9: Searching by title keyword ---
    const searchRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources?search=Mathematics', method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const searchMatch = Array.isArray(searchRes.data) && searchRes.data.some(r => r.id === pubId) && !searchRes.data.some(r => r.id === extId);
    assert("Searching by keyword 'Mathematics' filters results correctly", searchMatch);

    // --- TEST 10: Server-side pagination ---
    const pageRes = await request({
      hostname: 'localhost', port: 3001, path: '/api/resources?page=1&limit=1', method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert("Pagination returns paginated structure with metadata", 
      pageRes.status === 200 && 
      Array.isArray(pageRes.data?.data) && 
      pageRes.data?.data.length === 1 && 
      pageRes.data?.pagination?.page === 1 &&
      pageRes.data?.pagination?.totalPages >= 1
    );

    // --- TEST 11: File download endpoint returns PDF file ---
    const downloadRes = await request({
      hostname: 'localhost', port: 3001, path: `/api/resources/${pubId}/download`, method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const isDownloadSuccess = downloadRes.status === 200 && (
      downloadRes.headers['content-type']?.includes('pdf') ||
      downloadRes.headers['content-disposition']?.includes('attachment')
    );
    assert("Download endpoint serves valid PDF attachment with proper headers", isDownloadSuccess);

    // --- CLEANUP ---
    for (const id of createdIds) {
      await request({
        hostname: 'localhost', port: 3001, path: `/api/resources/${id}`, method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
    }

    console.log("-----------------------------------------------------------------");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED.`);
    console.log("=================================================================\n");
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  }
};

runSuite();
