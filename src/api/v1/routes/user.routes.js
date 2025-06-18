/*
 * =================================================================
 * FICHEIRO A ATUALIZAR: src/api/v1/routes/user.routes.js
 * DESCRIÇÃO: Corrigido o erro de sintaxe de importação e os caminhos.
 * =================================================================
 */
import express from 'express';
import { 
    getAllUsers, 
    updateUser, 
    deleteUser, 
    getMyProfile, 
    updateMyProfile,
    getUserById
} from '../controllers/user.controller.js';
import { protect } from '../../../midleware/auth.middleware.js';
import { updateUserValidator, updateMyProfileValidator } from '../validators/user.validator.js';

const router = express.Router();

// Todas as rotas de utilizador são protegidas pelo middleware de autenticação
router.use(protect);

// Rota específica para o utilizador logado obter e atualizar o seu próprio perfil
router.route('/me')
    .get(getMyProfile)
    .put(updateMyProfileValidator, updateMyProfile);

// Rota para o admin listar todos os utilizadores
router.route('/')
    .get(getAllUsers);

// Rotas para o admin gerir um utilizador específico por ID
router.route('/:id')
    .get(getUserById)
    .put(updateUserValidator, updateUser)
    .delete(deleteUser);

export default router;
