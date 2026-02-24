import http from 'http';

const dados = JSON.stringify({
  email: 'admin@empresa.com',
  senha: 'admin123'
});

const opcoes = {
  hostname: 'localhost',
  port: 3001,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': dados.length
  }
};

const req = http.request(opcoes, (res) => {
  let resposta = '';

  res.on('data', (chunk) => {
    resposta += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Resposta:', JSON.parse(resposta));
  });
});

req.on('error', (erro) => {
  console.error('Erro na requisição:', erro.message);
  process.exit(1);
});

req.write(dados);
req.end();
