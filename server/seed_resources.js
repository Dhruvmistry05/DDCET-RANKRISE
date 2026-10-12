const db = require('./db-adapter');

const run = async () => {
  try {
    const staticResources = [
      {
        title: 'DDCET Question Paper',
        description: 'Original DDCET Question Paper',
        type: 'question_paper',
        exam_year: 2023,
        file_path: '/resources/question-papers/DDCET_Question_Paper_2023.pdf',
        published: true,
        internal_id: 'static-qp-2023'
      },
      {
        title: 'DDCET Answer Key',
        description: 'Official DDCET Answer Key',
        type: 'answer_key',
        exam_year: 2023,
        file_path: '/resources/answer-keys/DDCET_Answer_Key_2023.pdf',
        published: true,
        internal_id: 'static-ak-2023'
      },
      {
        title: 'Official DDCET Syllabus',
        description: 'Comprehensive syllabus covering all topics and exam structure.',
        type: 'syllabus',
        exam_year: null,
        file_path: '/resources/syllabus/DDCET_Official_Syllabus.pdf',
        published: true,
        internal_id: 'static-syl-01'
      }
    ];

    let added = 0;
    for (const res of staticResources) {
      const exists = await db.findOne('resources', { internal_id: res.internal_id });
      if (!exists) {
        await db.insert('resources', res);
        added++;
      }
    }

    // Link answer key to paper
    const qp = await db.findOne('resources', { internal_id: 'static-qp-2023' });
    const ak = await db.findOne('resources', { internal_id: 'static-ak-2023' });
    if (qp && ak && !ak.paper_id) {
      await db.update('resources', ak.id, { paper_id: qp.id });
    }

    console.log(`Seeded ${added} static resources into database.`);
  } catch (err) {
    console.error("Error seeding resources:", err.message);
  } finally {
    await db.close();
    process.exit(0);
  }
};

run();
