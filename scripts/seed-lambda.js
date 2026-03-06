// Lambda function to seed PostgreSQL database

exports.handler = async (event) => {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    const insertSQL = `
      INSERT INTO users (id, name, email, role, password_hash, created_at, updated_at) VALUES
      ('0cde5dbd-7e3a-47c6-a4ec-f14fceb1fa7b', 'Admin Super', 'admin@empresa.com', 'Super Admin', '$2a$10$M/szOyaSbVqzawO92qNUoeLzl66d.rw6cmQnsRz2GfnGRsg0Kd6FW', NOW(), NOW()),
      ('6a411dd7-e16e-4a0e-844e-151e30992385', 'João Silva', 'joao.ti@empresa.com', 'Gestor', '$2a$10$D2u9lTXERlquV5FGKr1/p.T004qEVb0xuqE3oNphH8U6Yd1NXxi2i', NOW(), NOW()),
      ('b681c766-abaf-439f-8fb4-3c515decf6dd', 'Maria Santos', 'maria.vendas@empresa.com', 'Gestor', '$2a$10$MaBfvm4ocTqQ9M7T9qqdmeiA8F48QIRU2pzPsD95Oy79h4JXXs3Em', NOW(), NOW()),
      ('24aabcd2-bbe6-4501-8a61-b7113c9c83ae', 'Carlos Funcionário', 'carlos.funcionario@empresa.com', 'Funcionário', '$2a$10$0T1Gb61LmTDqqe.cTvoAtu6mZqwNOdy0bSevb.w4QA3eNux8tO0/S', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING email, role;
    `;
    
    const result = await client.query(insertSQL);
    
    const checkSQL = 'SELECT COUNT(*) as total FROM users;';
    const countResult = await client.query(checkSQL);
    
    await client.end();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database seeded successfully',
        inserted: result.rows,
        totalUsers: countResult.rows[0].total
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await pool.end();
  }
};
