export const tratarErros = (err, req, res, next) => {
  console.error(err);

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      erro: err.message,
      detalhes: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  res.status(500).json({
    erro: 'Erro interno do servidor',
    detalhes: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
