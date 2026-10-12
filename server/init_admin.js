const bcrypt = require('bcryptjs');
const db = require('./db-adapter');

const run = async () => {
  try {
    const existingAdmin = await db.findOne('users', { role: 'admin' });
    if (existingAdmin) {
      console.log(`Admin account already exists with email: ${existingAdmin.email}`);
      process.exit(0);
    }

    const args = process.argv.slice(2);
    if (args.length !== 2) {
      console.log("Usage: node init_admin.js <email> <password>");
      process.exit(1);
    }

    const [email, password] = args;
    const existingEmail = await db.findOne('users', { email });
    if (existingEmail) {
      console.log(`Error: User with email ${email} already exists.`);
      process.exit(1);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    await db.insert('users', {
      email,
      password: hashedPassword,
      role: 'admin',
      profile_completed: true,
      name: 'System Administrator',
      first_login_at: null,
      last_login_at: null
    });

    console.log(`Admin account created successfully for ${email}. You can now log in.`);
  } catch (err) {
    console.error("Error creating admin:", err.message);
  } finally {
    await db.close();
    process.exit(0);
  }
};

run();
