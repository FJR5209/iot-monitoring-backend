/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/middleware/auth.middleware.js
 * DESCRIÇÃO: Versão final e correta do middleware de autenticação,
 * com o caminho de importação do modelo User corrigido.
 * =================================================================
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 1. Extrai o token do cabeçalho (formato "Bearer TOKEN")
      token = req.headers.authorization.split(' ')[1];

      // 2. Verifica e descodifica o token usando o segredo
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Procura o utilizador pelo ID do token e anexa-o ao objeto `req`
      //    Isto torna os dados do utilizador disponíveis em todas as rotas protegidas
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado, utilizador não encontrado.' });
      }

      next(); // Se tudo estiver OK, avança para o próximo passo (o controlador da rota)
    } catch (error) {
      // Este bloco é executado se jwt.verify() falhar (token inválido, expirado, etc.)
      return res.status(401).json({ message: 'Não autorizado, token falhou.' });
    }
  }

  if (!token) {
    // Este bloco é executado se nenhum token for enviado no cabeçalho
    return res.status(401).json({ message: 'Não autorizado, sem token.' });
  }
};
